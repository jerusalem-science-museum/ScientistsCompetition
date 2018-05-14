import { Component, OnInit } from '@angular/core';
import { DatabaseService } from '../services/database.service';
import { AuthService } from '../services/auth.service';
import { UploadFileService } from '../services/upload-file.service';
import { FileUpload } from '../fileupload';

@Component({
  selector: 'app-project-upload-screen',
  templateUrl: './project-upload-screen.component.html',
  styleUrls: ['./project-upload-screen.component.css']
})
export class ProjectUploadScreenComponent implements OnInit {

  selectedFiles: FileList;
  currentFileUpload: FileUpload;
  progress: { percentage: number } = { percentage: 0 };
  fields;
  projectStatus;

  constructor(public db: DatabaseService, public auth: AuthService, public uploadService: UploadFileService) 
  { 
    this.fields = ["בחר תחום מתוך הרשימה",
    "מתמטיקה","מדעי החיים","כימיה",
    "הנדסה/טכנולוגיה","היסטוריה",
    "מדעי הסביבה","פיזיקה","מדעי המחשב","מדעי החברה"];
    this.projectStatus = ["בחר סטאטוס מתוך הרשימה","עוד לא התחלתי את העבודה המעשית",
    "עוד לא סיימתי את העבודה המעשית ואין לי תוצאות",
    "עוד לא סיימתי את העבודה המעשית אך יש לי תוצאות חלקיות",
    "סיימתי את כל העבודה המעשית ואני בכתיבת העבודה"];
  }

  ngOnInit() {
  }

  selectFile(event) {
    this.selectedFiles = event.target.files;
  }

  upload() {
    const file = this.selectedFiles.item(0);
    this.selectedFiles = undefined; //reset ? 

    this.currentFileUpload = new FileUpload(file);
    this.uploadService.pushFileToStorage(this.currentFileUpload, this.progress);
  }

}