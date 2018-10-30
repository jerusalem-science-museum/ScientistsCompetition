import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreDocument } from 'angularfire2/firestore';
import { User } from '../user';
import { Observable } from 'rxjs/Observable';
import { Project } from '../project';
import { ExportUser } from '../export-user';
import { ExportProject } from '../export-project';
import { CompetitionSettings } from '../competition-settings';
import { CookieService } from 'ngx-cookie-service';
import { firebase } from '@firebase/app'
import '@firebase/database'

@Injectable()
export class DatabaseService {

  public dataCollections; //will hold the DB collection table that is stored in the firebase
  public registeredUsers; //a string that holds information that was collected from getAllDBUsers() function
  public user: User; //will hold the data that was collected from a user that wants to register to the website
  public loggedInUserUID: string; //only holds logged in users id
  public loggedInUser: User; // holds logged in user info 
  selectedUser = []; //holds an array with selected users. used by the getUser() function
  existsUsers = []; // holds the project partners - to see if they exist on the server 
  public loggedIn: string; //check if this is the right way to do
  listingDoc: AngularFirestoreDocument<User>; //holds FB listing for update operation
  observableUsers: Observable<User[]>; //A temp variable that returns metadata. used by usersList
  usersList = []; // holds a list with listing id's and users info of the UsersInfo table
  checkersList = [];// holds a list with all the current checkers.
  user_exp = [];
  proj_exp = [];

  /* project*/
  public projectCollections; // holds a connection the firebase ProjectsInfo table
  public project: Project; // Holds project info that were inserted in the form by the user
  listingProjectDoc: AngularFirestoreDocument<Project>; //holds FB listing for update operation
  observableProjects: Observable<Project[]>; //A temp variable that returns metadata. used by projectsList
  projectsList = []; // holds a list with listing id's and projects info of the ProjectInfo table

  public settingsCollection;
  settingsDoc: AngularFirestoreDocument<CompetitionSettings>; //holds FB listing for update operation
  observableSettings: Observable<CompetitionSettings[]>; //A temp variable that returns metadata. used by usersList
  competition_settings_db = []; //holds comp settings from FB
  competition_settings : CompetitionSettings; //holds comp settings to be set in FB

  constructor(private afs: AngularFirestore, private cookieService: CookieService) {
    //==========Connection to firebase table============//
    const settings = { timestampsInSnapshots: true };
    afs.firestore.settings(settings);
    this.dataCollections = afs.collection<any>('usersInfo');
    this.projectCollections = afs.collection<any>('projectsInfo');
    this.settingsCollection = afs.collection<any>('CompetitionSettings');
    //===================================================//
    this.loggedIn = 'false'; //represents if user is logged in. has to be STRING !!!
    this.existsUsers = [false, false, false];
  }

  //adds all info that was provided through the registration form to user object and ads it to the firebase DB
  public addUserToDB(user: User) {
    let noPasswordUser = {...user};
    delete noPasswordUser.password;
    this.dataCollections.doc(user.uid).set(JSON.parse(JSON.stringify(noPasswordUser))).then(() => console.log('User added!')).catch((error) => console.log(error));
  }

  private lowerCase(s : string) {
    if (s != undefined) {
      return s.toLowerCase();
    } else {
      return undefined;
    }
  }

  private lowerCaseMails(project : Project) {
    project.user1mail = this.lowerCase(project.user1mail);
    project.user2mail = this.lowerCase(project.user2mail);
    project.user3mail = this.lowerCase(project.user3mail);
    project.school_contact_mail = this.lowerCase(project.school_contact_mail);

    if (project.mentor1 != undefined) {
      project.mentor1.email = this.lowerCase(project.mentor1.email);
    }

    if (project.mentor2 != undefined) {
      project.mentor2.email = this.lowerCase(project.mentor2.email);
    }

    if (project.mentor3 != undefined) {
      project.mentor3.email = this.lowerCase(project.mentor3.email);
    }
  }

  //adds all info that was provided through the project-upload form to project object and ads it to the firebase DB
  public addProjectToDB(project: Project) {
    this.lowerCaseMails(project);
    this.projectCollections.add(JSON.parse(JSON.stringify(project)));
  }
  //sets competition settings into db
  public addCompetitionSettingsToDB(settings: CompetitionSettings) {
    this.settingsCollection.add(JSON.parse(JSON.stringify(settings)));
  }
  //Returns the DB table meta data from firebase including all table fields id and users
  getSettingsMetaData() {
    this.observableSettings = this.settingsCollection.snapshotChanges().map(actions => {
      return actions.map(a => {
        const data = a.payload.doc.data() as CompetitionSettings;
        const id = a.payload.doc.id;
        return { id, ...data };
      });
    });
    return this.observableSettings;
  }
  //Update a settings listing. the object that is passed to the update function has to be already with the wanted changes!!! (It writes a new object)
  updateSettingsListing() {
    this.settingsDoc = this.settingsCollection.doc(`${this.competition_settings_db[0].id}`); //takes the listing that will be updated by the doc.id (listing's id)
    this.settingsDoc.update(JSON.parse(JSON.stringify(this.competition_settings)));
  }

  //Update a UsersInfo listing by a given email. the object that is passed to the update function has to be already with the wanted changes!!! (It writes a new object)
  updateListing(email: string) {
    for (var i = 0; i < this.usersList.length; i++) {
      if (this.usersList[i].email == email) {
        this.listingDoc = this.dataCollections.doc(`${this.usersList[i].id}`); //takes the listing that will be updated by the doc.id (listing's id)
        this.listingDoc.update(JSON.parse(JSON.stringify(this.user)));
      }
    }
  }

  //deletes user listing by a given email
  deleteListing(email: string) {
    for (var i = 0; i < this.usersList.length; i++) {
      if (this.usersList[i].email == email) {
        this.listingDoc = this.dataCollections.doc(`${this.usersList[i].id}`); //takes the listing that will be deleted by the doc.id (listing's id)
        this.listingDoc.delete();
      }
    }
  }

  //Updates a project listing by a given email. the object that is passed to the update function has to be already with the wanted changes!!! (It writes a new object)
  updateProjectListing(project_name: string) {
    for (var i = 0; i < this.projectsList.length; i++) {
      if (this.projectsList[i].project_name == project_name) {
        this.lowerCaseMails(this.projectsList[i]);
        this.listingDoc = this.projectCollections.doc(`${this.projectsList[i].id}`); //takes the listing that will be updated by the doc.id (listing's id)
        this.listingDoc.update(JSON.parse(JSON.stringify(this.project)));
      }
    }
  }
  //deletes project listing by a given email
  deleteProjectListing(project_name: string) {
    for (var i = 0; i < this.projectsList.length; i++) {
      if (this.projectsList[i].project_name == project_name) {
        this.listingDoc = this.projectCollections.doc(`${this.projectsList[i].id}`); //takes the listing that will be deleted by the doc.id (listing's id)
        this.listingDoc.delete();
      }
    }
  }

  /* the function finds the listing to update by email, and then,
   updates it's data by selecting the user from selected user
    by the given user index.
    Index is needed to choose from the selectedUser array*/
  asignProjectToUser(email: string, userIndex) {
    for (var i = 0; i < this.usersList.length; i++) {
      if (this.usersList[i].email == email) {
        this.listingDoc = this.dataCollections.doc(`${this.usersList[i].id}`); //takes the listing that will be updated by the doc.id (listing's id)
        this.listingDoc.update(JSON.parse(JSON.stringify(this.selectedUser[userIndex])));// 
      }
    }
  }

  //This is a help function to setMetaData() it retrives usersInfo table including listing IDs.
  getMetaData() {
    this.observableUsers = this.dataCollections.snapshotChanges().map(actions => { //collects the DB table meta data including all table fields id and users
      return actions.map(a => {
        const data = a.payload.doc.data() as User;
        const id = a.payload.doc.id;
        return { id, ...data };
      });
    })

    return this.observableUsers;
  }

  transformUsers() {

    this.getMetaData().first().subscribe(usersList => {
      for (var i = 0; i < usersList.length; i++) {
        var user = usersList[i];
        let noPasswordUser = {...user};
        delete noPasswordUser.password;
        console.log(noPasswordUser.uid);
        console.log(JSON.parse(JSON.stringify(noPasswordUser)));
        this.dataCollections.doc(noPasswordUser.uid).set(JSON.parse(JSON.stringify(noPasswordUser)));
      }
    })
  }

  //after reciving the metadata from firebase - set it to the userslist variable
  setMetaData() {
    this.getMetaData().subscribe(res => {
      this.usersList = res;
    });
  }

  getProjectMetaData() { //Returns the DB table meta data from firebase including all table fields id and users
    this.observableProjects = this.projectCollections.snapshotChanges().map(actions => {
      return actions.map(a => {
        const data = a.payload.doc.data() as User;
        const id = a.payload.doc.id;
        return { id, ...data };
      });
    });
    return this.observableProjects;
  }


  //currently a temp function that stores basic users information that is found at the FBDB.
  public getAllDBUsers() {
    this.dataCollections.valueChanges().subscribe(collection => {
      for (var i = 0; i < collection.length; i++) {
        this.registeredUsers += "   email:   " + collection[i].email + "\n   uid:   " + collection[i].uid + "   \n\n   ";
      }
    })
  }
  //returns the currently logged in user by his uid and sets the value in loggedInUser property.
  //in order to use this function - the value of loggedIn has to be true. user cookies if needed
  public getLoggedInUser() {
    return new Promise((resolve, reject) => {
      this.dataCollections.valueChanges().subscribe(collection => {
        for (var i = 0; i < collection.length; i++) {
          if (collection[i].uid === this.loggedInUserUID) {
            console.log('Logged in user uid: ' + this.loggedInUserUID)
            this.loggedInUser = collection[i];
            resolve();
            return;
          }
        }
        console.log('Logged in user uid (not found): ' + this.loggedInUserUID);
        this.loggedIn = 'false';
        this.cookieService.deleteAll();
        resolve();
      })
    });
  }
  //This function sets in the 'selectedUser' array (first 3 cells) property users that were found by a given email.
  public getUser(email1: string, email2: string, email3: string) { // get user asiggned to project
    return new Promise((resolve, reject) => {
      this.dataCollections.valueChanges().subscribe(collection => {
        for (var i = 0; i < collection.length; i++) { //find participantes email's and puts them in array
          if (email1 != undefined && this.lowerCase(collection[i].email) === this.lowerCase(email1)) {
            this.selectedUser[0] = collection[i];
            this.existsUsers[0] = true;
          }
          else if (email2 != undefined && this.lowerCase(collection[i].email) === this.lowerCase(email2)) {
            this.selectedUser[1] = collection[i];
            this.existsUsers[1] = true;
          }
          else if (email3 != undefined && this.lowerCase(collection[i].email) === this.lowerCase(email3)) {
            this.selectedUser[2] = collection[i];
            this.existsUsers[2] = true;
          }
        }
        resolve();
      })
    });
  }

  public getUserName(email1: string) { // get user asiggned to project
    return new Promise((resolve, reject) => {
      this.dataCollections.valueChanges().subscribe(collection => {
        for (var i = 0; i < collection.length; i++) { //find participantes email's and puts them in array
          if (email1 != undefined && collection[i].email.toLowerCase() === email1.toLowerCase()) {
            resolve(collection[i].firstName + " " + collection[i].lastName);
          }
        }
        resolve("");
      })
    });
  }

  // returns the id listing of project by a given project name
  public getProjectID(pname: string) { //get project ID by Project name
    for (var i = 0; i < this.projectsList.length; i++) {
      if (this.projectsList[i].project_name == pname) {
        return this.projectsList[i].id;
      }
    }
    return 'not found';
  }

  public getProject(id: string) {
    for (var i = 0; i < this.projectsList.length; i++) {
      if (this.projectsList[i].id == id) {
        return this.projectsList[i];
      }
    }
    return 'not found';
  }

//sets checkers array with checkers from users list
  public getCheckers() {
    if(this.checkersList.length==0){
      for (var i = 0; i < this.usersList.length; i++) {
        if (this.usersList[i].type == "בודק")
          this.checkersList.push(this.usersList[i]);
      }
    }
  }
//exports users data from db into excel sheet
  exportUsers() {
    for (var i = 0; i < this.usersList.length; i++) {
      this.user_exp[i] = new ExportUser();
      this.user_exp[i].Another_Phone_Number = this.usersList[i].anotherPhone;
      this.user_exp[i].Appartment = this.usersList[i].appartment;
      this.user_exp[i].Birthday = this.usersList[i].birthday;
      this.user_exp[i].City = this.usersList[i].city;
      this.user_exp[i].Email = this.usersList[i].email;
      this.user_exp[i].English_First_name = this.usersList[i].engFname;
      this.user_exp[i].English_Last_Name = this.usersList[i].engLname;
      this.user_exp[i].First_name = this.usersList[i].firstName;
      this.user_exp[i].Gender = this.usersList[i].gender;
      this.user_exp[i].Last_name = this.usersList[i].lastName;
      this.user_exp[i].Phone_number = this.usersList[i].phone;
      this.user_exp[i].School_city = this.usersList[i].schoolCity;
      this.user_exp[i].School_name = this.usersList[i].schoolName;
      this.user_exp[i].Street = this.usersList[i].street;
      this.user_exp[i].User_id = this.usersList[i].userid;
      this.user_exp[i].User_type = this.usersList[i].type;
      this.user_exp[i].Password = this.usersList[i].password;
    }
  }

  makeHash(str) {
    var hash = 0, i, chr;
    if (str.length === 0) return hash;
    for (i = 0; i < str.length; i++) {
      chr   = str.charCodeAt(i);
      hash  = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer
    }

    if (hash < 0) {
      hash = -hash;
    }
    return hash.toString().substr(hash.toString().length - 6, 6);
  }
//exports projects data from db into excel sheet
  exportProjects() {
    var allPromises : Array<Promise<any>> = [];
    for (var i = 0; i < this.projectsList.length; i++) {
      this.proj_exp[i] = new ExportProject();
      this.proj_exp[i].id = this.makeHash(this.projectsList[i].id);
      this.proj_exp[i].Advantages = this.projectsList[i].advantages;
      this.proj_exp[i].Background = this.projectsList[i].background;
      this.proj_exp[i].Checker_comments = this.projectsList[i].check;
      this.proj_exp[i].Checkers_email = this.projectsList[i].checkerMail;
      this.proj_exp[i].Description = this.projectsList[i].description;
      this.proj_exp[i].Facility = this.projectsList[i].location;
      this.proj_exp[i].Field = this.projectsList[i].project_field;
      this.proj_exp[i].First_student_email = this.projectsList[i].user1mail;
      this.proj_exp[i].Inovetion = this.projectsList[i].inovetion;
      this.proj_exp[i].mentor1 = this.projectsList[i].mentor1;
      this.proj_exp[i].mentor2 = this.projectsList[i].mentor2;
      this.proj_exp[i].mentor3 = this.projectsList[i].mentor3;
      this.proj_exp[i].Model_status = this.projectsList[i].modelStatus;
      this.proj_exp[i].Products = this.projectsList[i].products;
      this.proj_exp[i].Project_name = this.projectsList[i].project_name;
      this.proj_exp[i].Research_status = this.projectsList[i].researchStatus;
      this.proj_exp[i].Retrospective = this.projectsList[i].retrospective;
      this.proj_exp[i].School_representative_email = this.projectsList[i].school_contact_mail;
      this.proj_exp[i].Scope = this.projectsList[i].scope;
      this.proj_exp[i].Second_student_email = this.projectsList[i].user2mail;
      this.proj_exp[i].Status = this.projectsList[i].status;
      this.proj_exp[i].target = this.projectsList[i].target;
      this.proj_exp[i].Third_student_email = this.projectsList[i].user3mail;
      this.proj_exp[i].Type = this.projectsList[i].type;

      var appendPromises = ((currIndex) => {
        var promise1 : Promise<any> = this.getUserName(this.projectsList[i].user1mail).then(name => {
          console.log('Got name: ' + name);
          this.proj_exp[currIndex].First_student_name = name;
          console.log('Proj exp: ' + this.proj_exp[currIndex].id);
        });

        var promise2 : Promise<any> = this.getUserName(this.projectsList[i].user2mail).then(name => {
          this.proj_exp[currIndex].Second_student_name = name;
        });

        var promise3 : Promise<any> = this.getUserName(this.projectsList[i].user3mail).then(name => {
          this.proj_exp[currIndex].Third_student_name = name;
        });

        allPromises.push(promise1);
        allPromises.push(promise2);
        allPromises.push(promise3);
      });

      appendPromises(i);
    }

    return Promise.all(allPromises);
  }



}

