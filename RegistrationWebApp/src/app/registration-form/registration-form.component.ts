import { User } from '../user'
import { AuthService } from '../services/auth.service';
import { Component, OnInit } from '@angular/core';
import { DatabaseService } from '../services/database.service';
import { AngularFirestore } from 'angularfire2/firestore';
import { RouterLink, Router,ActivatedRoute, Params } from '@angular/router';
import { FormsModule, FormGroup, FormControl, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CookieService } from 'ngx-cookie-service';
import { Message } from '../message';



@Component({
  selector: 'app-registration-form',
  templateUrl: './registration-form.component.html',
  styleUrls: ['./registration-form.component.css']
})
export class RegistrationFormComponent {
  userTypes; //array of user types
  managerTypes;// array of advanced user types
  user: User; // User Object - Contains all fields. Will be uploaded as a Jason object to server
  userform: FormGroup; // tracks the value and validity state of a group of FormControl
  signUpError: boolean; //if true -> there is an error in the registration form
  userPasswordValidation: string; // will contain the password verification
  title: string;
  date;
  routerMail;
  manager_mode;
  msg: Message = new Message;

  constructor(public db: DatabaseService, public auth: AuthService, public router: Router, private cookieService: CookieService, private route: ActivatedRoute) { }

  ngOnInit() {
    console.log('OnInit registration')
    this.cookieService.set('page', 'registrationForm');
    this.db.loggedInUserUID = this.cookieService.get('User uid');
    console.log('Logged in user UID: ' + this.db.loggedInUserUID);
    this.db.loggedIn = this.cookieService.get('User login status');
    this.manager_mode = this.cookieService.get('mode');
    this.route.params.subscribe((params: Params) => {
      this.routerMail = params['email'];
    });
    console.log('Request User')
    this.db.getLoggedInUser().then(() => {
      console.log('Got logged user!')
      this.db.setMetaData();
      this.userTypes = ['??????????', '????????'];
      this.managerTypes = ['??????????', '????????', '????????', '????????'];
      this.user = new User(false, this.userTypes[0]); //deafult type is student

      if (this.db.loggedIn != 'true' || this.manager_mode=='new'){
        console.log('Not logged in!');
        this.user = new User(false, this.userTypes[0]); //deafult type is student
        this.msg.subj="???????????? ?????????? ???????? ????????????";
        this.date = new Date();
        this.msg.date = this.date.getDate().toString() + "/" + (this.date.getMonth() + 1).toString() + "/" + this.date.getFullYear().toString();
        this.msg.content = "???????? ???? ?????????????? ???????????????? ???????????? ????."
        this.user.messages[0] = this.msg; //initilaize!!! ignore
        this.user.creation_date = new Date();
        this.user.createion_year = this.user.creation_date.getFullYear();
      }

      else if (this.manager_mode=='updateUser'){
        console.log('Updating!');
        this.db.getUser(this.routerMail,'','').then(() =>{
          this.user = this.db.selectedUser[0];
        })
      }
      else {
        console.log('Connected!');
        this.user = this.db.loggedInUser;
      }

      this.signUpError = false; // default- no registration form errors
      this.date = new Date();

      if (this.db.loggedIn != 'true')
        this.title = "???????? ?????????? ???????????? ???????????? ???????????? " + this.date.getFullYear();
      else if  (this.manager_mode=='new')
          this.title = "?????????? ?????????? ??????";
      else if (this.manager_mode=='updateUser')
        this.title = '?????????? ???????? ??????????'
      else
        this.title = "???????? ?????????? ??????????";

        this.validateForm()
    })
    //delay in order to wait for the getLoggedInUser function to recive the data
  }

  public signIn(email, password) { //enables the sign in button function
    return this.auth.signIn(email, password) //using the auth service
      .then((res) => {
        console.log('SIGNED IN!');
        this.cookieService.set('User uid', res.user.uid);
        this.cookieService.set('User login status', 'true');
        this.db.loggedInUserUID = res.user.uid
        this.db.loggedIn = 'true';
        this.db.getLoggedInUser().then(() => {
          if (this.db.loggedInUser.type == '????????') {
            this.cookieService.set('checkerLoggedIn', 'true');
            this.router.navigate(['checker']);
          }
          else if (this.db.loggedInUser.type == '????????') {
            this.cookieService.set('managerLoggedIn', 'true');
            this.router.navigate(['manager'])
          }
          else if (this.db.loggedInUser.type == '??????????') {
            this.router.navigate(['projectUpload']);
          }
          else
            this.router.navigate(['homepage'])
        })
      })
      .catch((err) => {
        this.db.loggedIn = 'false';
        this.db.loggedInUserUID = null;
        this.cookieService.set('User uid', '');
        this.cookieService.set('User login status', 'false');
      }
      );
  }

  // on register user button click adds new user to Database according to the data that was collected from the registration form
  public registerUser() {
    if (this.user.type != '????????') {
      for (var i = 0; i < this.db.usersList.length; i++){
        if (this.db.usersList[i].userid == this.user.userid){
          this.signUpError = true;
          alert("?????????? ???????? ?????? ?????????? ????????????")
          return;  
        }
      }
    }

    if (this.user.type != '??????????') { // in case is not student--> there is not required fildes
      this.userform.get('birthday').clearValidators();
      this.userform.get('birthday').updateValueAndValidity();
      this.userform.get('city').clearValidators();
      this.userform.get('city').updateValueAndValidity();
      this.userform.get('street').clearValidators();
      this.userform.get('street').updateValueAndValidity();
      this.userform.get('appartment').clearValidators();
      this.userform.get('appartment').updateValueAndValidity();
      this.userform.get('schoolName').clearValidators();
      this.userform.get('schoolName').updateValueAndValidity();
      this.userform.get('schoolCity').clearValidators();
      this.userform.get('schoolCity').updateValueAndValidity();
       //now teacher/ checker/ manager can register
    }
    if (this.user.type == '????????') {
      this.userform.get('userid').clearValidators();
      this.userform.get('userid').updateValueAndValidity();
      this.userform.get('gender').clearValidators();
      this.userform.get('gender').updateValueAndValidity();
      this.userform.get('phone').clearValidators();
      this.userform.get('phone').updateValueAndValidity();
      this.userform.get('engfname').clearValidators();
      this.userform.get('engfname').updateValueAndValidity();
      this.userform.get('englname').clearValidators();
      this.userform.get('englname').updateValueAndValidity();
    }

    if (!this.validatePassword()) { // condition to prevent confirm password
      this.signUpError = true;
      return;
    }

    if (this.userform.valid) { // no validate errors
      this.signUpError = false;
      this.user.email = this.user.email.toLowerCase();
      this.auth.emailSignUp(this.user.email, this.user.password, this.db.loggedInUser != null && this.db.loggedInUser != undefined && this.db.loggedInUser.type == '????????') // sign up User
        .then(res => {
          if (this.signUpError == true)// condition to prevent error
            return;
          //successfully registered:

          this.user.uid = res.user.uid; // sets the uid value in the attribute
          console.log('NEW USER:');
          console.log(this.user);
          this.db.addUserToDB(this.user); // add user to database
          if(this.db.loggedIn == 'true' && this.db.loggedInUser.type == '????????')
              this.router.navigate(['manager']);
          else {
            console.log('signing in...')
            this.signIn(this.user.email, this.user.password);
          }
        })
        .catch(error => {
          this.signUpError = true;
          if (error.code == 'auth/email-already-in-use') { // in case that email already in use
            alert("?????????? ?????????? ?????????? ?????? ???????????? ????????. ???? ?????????? ???? ?????????? ???????????? ???????? ????????");// error message
          }
          else { alert("?????????? ???????? ???????????????? ???????? ??????????") }
        })
    }
    else { // validate error
      this.signUpError = true;
    }
  }

  public validateForm() {
    // Limitations on fields in the registration form
    this.userform = new FormGroup({
      'firstname': new FormControl(this.user.firstName, [
        //first name is required, must be in Hebrew, at least 2 letters.
        Validators.required,
        Validators.minLength(2),
        Validators.pattern("[??-?? ']+")
      ]),
      'lastname': new FormControl(this.user.lastName, [
        //last name is required, must be in Hebrew, at least 2 letters.
        Validators.required,
        Validators.minLength(2),
        Validators.pattern("[??-?? ']+")
      ]),
      'email': new FormControl(this.user.email, [
        //Email is required, must be in email format
        Validators.required,
        Validators.email
      ]),
      'engfname': new FormControl(this.user.engFname, [
        //English First Name is required. Must have only English letters
        Validators.required,
        Validators.pattern("[a-zA-Z ']*")
      ]),
      'englname': new FormControl(this.user.engFname, [
        //English First Name is required. Must have only English letters
        Validators.required,
        Validators.pattern("[a-zA-Z ']*")
      ]),
      'phone': new FormControl("", [
        //phone number is required, must be 9-13 digits (only numbers).
        Validators.pattern("0[0-9-]*"),
        Validators.minLength(9),
        Validators.maxLength(13)
      ]),
      'password': new FormControl("", [
        //password is required, must at least 6 letters.
        Validators.minLength(6),
        Validators.required
      ]),
      'confimpassword': new FormControl("", [
        //confim password is required, (must be the same as password - implements in another function).
        Validators.required
      ]),
      'birthday': new FormControl("", [
        //birthday is required
        Validators.required
      ]),
      'gender': new FormControl("", [
        //gender is required
        Validators.required
      ]),
      'userid': new FormControl("", [
        //id is required
        Validators.required,
        Validators.pattern("[0-9-]*"),
        Validators.minLength(8),
        Validators.maxLength(10)
      ]),
      'city': new FormControl("", [
        //city is required
        Validators.required,
      ]),
      'street': new FormControl("", [
        //street is required
        Validators.required,
      ]),
      'appartment': new FormControl("", [
        //appartment is required
        Validators.required,
      ]),
      'schoolName': new FormControl("", [
        //schoolName is required
        Validators.required,
      ]),
      'schoolCity': new FormControl("", [
        //schoolCity is required
        Validators.required,
      ])
    });
  }

  //function to display fields from student or teacher registration
  public isUserStudent() {
    if (this.user.type == '????????')
      return false;
    else
      return true; // type is student
  }

  //check if a field is empty
  public CheckIfEmptyField(field: string) {
    if (field == '')
      return true; // field is empty
    else
      return false;
  }

  // compares the password field to the password verification field
  public validatePassword() {
    if (this.user.password == this.userPasswordValidation)
      return true; // Password is verified
    return false;
  }
  public updateInfo() {

    if (this.user.type != '??????????') { // in case is not student--> there is not required fildes
      this.userform.get('birthday').clearValidators();
      this.userform.get('birthday').updateValueAndValidity();
      this.userform.get('city').clearValidators();
      this.userform.get('city').updateValueAndValidity();
      this.userform.get('street').clearValidators();
      this.userform.get('street').updateValueAndValidity();
      this.userform.get('appartment').clearValidators();
      this.userform.get('appartment').updateValueAndValidity();
      this.userform.get('schoolName').clearValidators();
      this.userform.get('schoolName').updateValueAndValidity();
      this.userform.get('schoolCity').clearValidators();
      this.userform.get('schoolCity').updateValueAndValidity();
       //now teacher/ checker/ manager can register
    }
    this.userform.get('email').clearValidators();
    this.userform.get('email').updateValueAndValidity(); //clear validator
    this.userform.get('password').clearValidators();
    this.userform.get('password').updateValueAndValidity(); //clear validator
    this.userform.get('confimpassword').clearValidators();
    this.userform.get('confimpassword').updateValueAndValidity(); //clear validator

    if (this.userform.valid) { // no validate errors
        this.db.user = this.user; //update current user data of the service !!!
        this.db.updateListing(this.user.email);
        alert("???????????? ???????????? ????????????")
        if(this.db.loggedInUser.type == '????????')
          this.router.navigate(['manager']);
        else
          this.router.navigate(['homepage']);
    }
    else { // validate error
      this.signUpError = true;
    }
  }


  // gets - link the formControls to html
  get firstname() { return this.userform.get('firstname'); }
  get lastname() { return this.userform.get('lastname'); }
  get email() { return this.userform.get('email'); }
  get engfname() { return this.userform.get('engfname'); }
  get englname() { return this.userform.get('englname'); }
  get phone() { return this.userform.get('phone'); }
  get password() { return this.userform.get('password'); }
  get confimpassword() { return this.userform.get('confimpassword'); }
  get birthday() { return this.userform.get('birthday'); }
  get gender() { return this.userform.get('gender'); }
  get userid() { return this.userform.get('userid'); }
  get city() { return this.userform.get('city'); }
  get street() { return this.userform.get('street'); }
  get appartment() { return this.userform.get('appartment'); }
  get schoolName() { return this.userform.get('schoolName'); }
  get schoolCity() { return this.userform.get('schoolCity'); }

}

