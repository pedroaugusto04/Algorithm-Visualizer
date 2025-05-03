import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarModule } from "@angular/material/snack-bar";

@Injectable({
  providedIn: 'root'
})
export class SnackBarService {

  constructor(private snackBar: MatSnackBar) { }

  showSnackBarSuccess(msg: string){
    this.snackBar.open(msg, "X", {
      duration: 2000,
      verticalPosition: "top",
      panelClass: ["success-snackbar"],
    });
  }
  
  showSnackBarError(msg: string, duration?: number){
    this.snackBar.open(msg, "X", {
      duration: duration ?? 2000,
      verticalPosition: "top",
      panelClass: ["error-snackbar"],
    });
  }
}
