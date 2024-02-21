import { Component } from '@angular/core';
import {AngularFirestore,AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { Observable, map } from 'rxjs';
import { Task } from './task/task';
import { CdkDragDrop, transferArrayItem } from '@angular/cdk/drag-drop';
import { MatDialog } from '@angular/material/dialog';
import { TaskDialogComponent, TaskDialogResult } from './task-dialog/task-dialog.component';
import { BehaviorSubject } from 'rxjs';


const getObservable = (collection: AngularFirestoreCollection<Task>) => {
  const subject = new BehaviorSubject<Task[]>([]);
  collection.valueChanges({ idField: 'id' }).subscribe((val: Task[]) => {
    subject.next(val);
  });
  return subject;
};

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'kanban-fire';
  
  constructor(private dialog: MatDialog,private store: AngularFirestore) {}

  // tutorials: Observable<any[]> | undefined;

  // users: Observable<any[]> | undefined;

  // collectionData: Observable<any[]> | undefined;

  // ngOnInit():void{
  //   const data = {
  //     name: 'aman',
  //     age: 30,
  //     city: 'New York'
  //   };


  //   this.firestore.collection('users').add(data);
  // }


  todo = getObservable(this.store.collection('todo')) as Observable<Task[]>;
  inProgress = getObservable(this.store.collection('inProgress')) as Observable<Task[]>;
  done = getObservable(this.store.collection('done')) as Observable<Task[]>;

  editTask(list: 'done' | 'todo' | 'inProgress', task: Task): void {
    
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '270px',
      data: {
        task,
        enableDelete: true,
      },
    });
    dialogRef.afterClosed().subscribe((result: TaskDialogResult|undefined) => {
      if (!result) {
        return;
      }
      if (result.delete) {
        this.store.collection(list).doc(task.id).delete();
      } else {
        this.store.collection(list).doc(task.id).update(task);
      }
    });}

    drop(event: CdkDragDrop<Task[] | null>): void {
      if (event.previousContainer === event.container || event.previousContainer.data === null) {
        return;
      }
    
      const item = event.previousContainer.data[event.previousIndex];
    
      this.store.firestore.runTransaction(() => {
        const promise = Promise.all([
          this.store.collection(event.previousContainer.id).doc(item.id).delete(),
          this.store.collection(event.container.id).add(item),
        ]);
        return promise;
      })
      .then(() => {
        if (event.previousContainer.data && event.container.data) {
          transferArrayItem(
            event.previousContainer.data,
            event.container.data,
            event.previousIndex,
            event.currentIndex
          );
        }
      })
      .catch(error => {
        console.error('Transaction failed:', error);
      });
    }
    
    


  newTask(): void {
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '270px',
      data: {
        task: {},
      },
    });
    dialogRef
      .afterClosed()
      .subscribe((result:TaskDialogResult|undefined) => {
        if (!result) {
          return;
        }
        this.store.collection('todo').add(result.task) });
}
}

