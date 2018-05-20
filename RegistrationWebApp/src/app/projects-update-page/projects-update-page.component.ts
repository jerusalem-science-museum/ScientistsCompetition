import { Component, OnInit } from '@angular/core';
import { DatabaseService } from '../services/database.service';
import { AuthService } from '../services/auth.service';
import { UploadFileService } from '../services/upload-file.service';
import { FormsModule, FormGroup, FormControl, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { FileUpload } from '../fileupload';
import { Project } from '../project';
import { RouterLink, Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';


@Component({
  selector: 'app-projects-update-page',
  templateUrl: './projects-update-page.component.html',
  styleUrls: ['./projects-update-page.component.css']
})
export class ProjectsUpdatePageComponent implements OnInit {

  selectedFiles: FileList;
  currentFileUpload: FileUpload;
  project: Project;
  projectform: FormGroup; // tracks the value and validity state of a group of FormControl
  projectError: boolean; //if true -> there is an error in the project form
  progress: { percentage: number } = { percentage: 0 };
  fields;
  projectField: string; // if the student is selected "another" field of research, we will use this
  projectStatus;
  user_projects = ['מתוך רשימה']; // for drop down list
  selectedWork = 'מתוך רשימה'; //for drop down list
  userFile : FileUpload;


  constructor(public db: DatabaseService, public auth: AuthService, public uploadService: UploadFileService, public router: Router, private cookieService: CookieService) {
    this.fields = [
      "מתמטיקה", "מדעי החיים", "כימיה",
      "הנדסה/טכנולוגיה", "היסטוריה",
      "מדעי הסביבה", "פיזיקה", "מדעי המחשב", "מדעי החברה", "אחר"];
    this.projectStatus = ["עוד לא התחלתי את העבודה המעשית",
      "עוד לא סיימתי את העבודה המעשית ואין לי תוצאות",
      "עוד לא סיימתי את העבודה המעשית אך יש לי תוצאות חלקיות",
      "סיימתי את כל העבודה המעשית ואני בכתיבת העבודה"];
    this.project = new Project();
    this.validateForm();
    this.projectError = false; // default- no registration form errors
  }

  ngOnInit() {
    this.db.setMetaData();
    this.db.loggedInUserUID = this.cookieService.get('User uid');
    this.db.loggedIn = this.cookieService.get('User login status');
    this.db.getLoggedInUser().then(() => {
      this.db.getProjectMetaData().subscribe((val) => {
        this.db.projectsList = val;

        for (var i = 0; i < this.db.projectsList.length; i++) {
          if (this.db.projectsList[i].id == this.db.loggedInUser.project) {
            this.project = this.db.projectsList[i];
            this.user_projects[1] = this.project.project_name;
            this.userFile = this.project.project_file;
          }
        }
      })
    });
  }
  //Holds the selected file from the form
  selectFile(event) {
    this.selectedFiles = event.target.files;
  }
  //Uploads the selected file to firebase storage and deletes the previous one
  upload() {
    this.uploadService.deleteFileUpload(this.userFile);
    const file = this.selectedFiles.item(0);
    this.selectedFiles = undefined;
    this.currentFileUpload = new FileUpload(file);
    this.uploadService.pushFileToStorage(this.currentFileUpload, this.progress);
  }
  //collects all the info from the 'add project form' and sets it with all the needed DB connections in the database
  public addProject() {
    if (this.CheckIfEmptyField(this.project.user2mail)) { // 1 participant
      this.projectform.get('partner2').clearValidators();
      this.projectform.get('partner2').updateValueAndValidity(); //clear error
    }
    if (this.CheckIfEmptyField(this.project.user3mail)) {//2 participants
      this.projectform.get('partner3').clearValidators();
      this.projectform.get('partner3').updateValueAndValidity(); // clear error
    }
    if (this.CheckIfEmptyField(this.project.school_contact_mail)) { // no theacher
      this.projectform.get('email_school').clearValidators();
      this.projectform.get('email_school').updateValueAndValidity(); //clear error
    }
    if (this.project.project_field != "אחר") { //project_field != other
      this.projectform.get('other').clearValidators();
      this.projectform.get('other').updateValueAndValidity(); //clear error
    }
    else {
      this.project.project_field = this.projectField;
    }
    if (!this.projectform.valid) { // validate errors
      this.projectError = true; // form error
      console.log(this.projectform); //show errors
      return;
    }
    this.projectError = false;
    /*This part to the following:
    1. Gets the selected file to upload from the form anf sets in into the project_file property in the project object
    2. Collects all inserted info that was inserted into the form and then uploads the project to FB using addProjectToDB() func
    3. Sets 3 users to the selectedUser property by the e-mail addresses that were given in the upload form
    4. Gets project table meta data and sets the returned value to the projectsList property
    5. Gets current project listing id in order to connect it to the users that were selected
    6. updates teacher and project properties in the selectedUser array to be the connection between teacher and student(by mail)
       and between project and students (by the project listing id)
    7. FINALLY, updates the updated selected users using the asignProjectToUser() function    
    */
    this.project.project_file = this.currentFileUpload; // assigned file in project field
    this.db.getUser(this.project.user1mail, this.project.user2mail, this.project.user3mail, this.project.school_contact_mail).then(() => {
      if (this.db.existsUsers[0] == false) {
        alert("המייל שלי' שהוזן אינו קיים במערכת'")
        this.projectError = true;
        return;
      }
      if (this.db.loggedInUser.email != this.project.user1mail) {
        alert("זה לא המייל שלי")
        this.projectError = true;
        return;
      }
      if (!this.CheckIfEmptyField(this.project.school_contact_mail) && this.db.existsUsers[3] == false) {
        alert("כתובת המייל של איש הקשר מטעם בית הספר אינה קיימת במערכת")
        this.projectError = true;
        return;
      }
      if (!this.CheckIfEmptyField(this.project.user2mail) && this.db.existsUsers[1] == false) {
        alert("כתובת מייל השותף השני אינה קיימת במערכת")
        this.projectError = true;
        return;
      }
      if (!this.CheckIfEmptyField(this.project.user3mail) && this.db.existsUsers[2] == false) {
        alert("כתובת מייל השותף השלישי אינה קיימת במערכת")
        this.projectError = true;
        return;
      }
      this.db.project = this.project;
      this.db.updateProjectListing(this.project.project_name);
      alert(" העבודה עודכנה בהצלחה ");
      this.router.navigate(['homepage']);
    });
  }

  public validateForm() {
    // Limitations on fields in the registration form
    this.projectform = new FormGroup({
      'partner1': new FormControl(this.project.user1mail, [
        // my Email is required, must be in email format.
        Validators.required,
        Validators.email
      ]),
      'partner2': new FormControl(this.project.user2mail, [
        //must be in email format.
        Validators.email
      ]),
      'partner3': new FormControl(this.project.user3mail, [
        //must be in email format.
        Validators.email
      ]),
      'projectname': new FormControl(this.project.user3mail, [
        //projectname is required.
        Validators.required
      ]),
      'email_school': new FormControl(this.project.user3mail, [
        // must be in email format.
        //Validators.required,
        Validators.email
      ]),
      'project_field': new FormControl(this.project.user3mail, [
        //projectname is required.
        Validators.required
      ]),
      'other': new FormControl(this.projectField, [
        //projectname is required.
        Validators.required
      ]),
    });
  }

  // gets - link the formControls to html
  get partner1() { return this.projectform.get('partner1'); }
  get partner2() { return this.projectform.get('partner2'); }
  get partner3() { return this.projectform.get('partner3'); }
  get projectname() { return this.projectform.get('projectname'); }
  get email_school() { return this.projectform.get('email_school'); }
  get project_field() { return this.projectform.get('project_field'); }
  get other() { return this.projectform.get('other'); }

  // get location() { return this.projectform.get('location'); }
  // get type() { return this.projectform.get('type'); }
  // get status() { return this.projectform.get('status'); }
  // get fileupload() { return this.projectform.get('fileupload'); }
  // get target() { return this.projectform.get('target'); }
  // get background() { return this.projectform.get('background'); }
  // get description() { return this.projectform.get('description'); }
  // get scope() { return this.projectform.get('scope'); }
  // get inovetion() { return this.projectform.get('inovetion'); }
  // get advantages() { return this.projectform.get('advantages'); }
  // get retrospective() { return this.projectform.get('retrospective'); }


  //check if a field is empty
  public CheckIfEmptyField(field: string) {
    if (field == undefined || field == '')
      return true; // field is empty
    else
      return false;
  }

}