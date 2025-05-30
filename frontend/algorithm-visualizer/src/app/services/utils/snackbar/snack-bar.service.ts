import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarModule, MatSnackBarRef } from "@angular/material/snack-bar";

@Injectable({
  providedIn: 'root'
})
export class SnackBarService {

  private currentSnackBarRef: MatSnackBarRef<any> | null = null;
  private isPriorityActive = false;

  constructor(private snackBar: MatSnackBar) { }

  showSnackBarSuccess(msg: string, duration?: number){
    this.snackBar.open(msg, "X", {
      duration: duration ?? 2000,
      verticalPosition: "top",
      panelClass: ["success-snackbar"],
    });
  }
  
  showSnackBarError(msg: string, isPriority: boolean = false){

    if (this.isPriorityActive && !isPriority) {
      return;
    }

    if (this.currentSnackBarRef) {
      if (isPriority) {
        this.currentSnackBarRef.dismiss(); 
      } else {
        return;
      }
    }

    this.isPriorityActive = isPriority;

    this.currentSnackBarRef = this.snackBar.open(msg, "X", {
      duration: 2000,
      verticalPosition: "top",
      panelClass: ["error-snackbar"],
    });

    this.currentSnackBarRef.afterDismissed().subscribe(() => {
      this.currentSnackBarRef = null;
      this.isPriorityActive = false;
    });
  }
}
