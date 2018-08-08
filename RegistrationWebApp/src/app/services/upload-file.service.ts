import { Injectable } from '@angular/core';
import { AngularFireDatabase, AngularFireList } from 'angularfire2/database';
import { AngularFirestore } from 'angularfire2/firestore';
import * as firebase from 'firebase';

import { FileUpload } from '../fileupload';

@Injectable()
export class UploadFileService {

  public basePath;

  constructor(private db: AngularFireDatabase, private afs: AngularFirestore) { }

  pushFileToStorage(fileUpload: FileUpload, progress: { percentage: number }) {

    return new Promise((resolve, reject) => {
      const storageRef = firebase.storage().ref();
      const uploadTask = storageRef.child(`${this.basePath}/${fileUpload.file.name}`).put(fileUpload.file);

      uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED,
        (snapshot) => {
          // in progress , raise the progress bar
          const snap = snapshot as firebase.storage.UploadTaskSnapshot;
          progress.percentage = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
        },
        (error) => {
          // fail
          console.log(error);
        },
        () => {
          // success, finished upload , now the save the file
          uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
            fileUpload.url = downloadURL;
            fileUpload.name = fileUpload.file.name;
            console.log(fileUpload);
            resolve();
          };
        }
      );
    });
  }
}

