import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';

@Component({
  selector: 'app-anonymous-alert-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './anonymous-alert-dialog.component.html',
  styleUrl: './anonymous-alert-dialog.component.scss',
})
export class AnonymousAlertDialogComponent {
  
  constructor(private router: Router, private dialogRef: MatDialogRef<AnonymousAlertDialogComponent>) {}

  goToHome() {
    this.router.navigate(['/home'])
    this.dialogRef.close();
  }

  goToLogin() {
    this.router.navigate(['/authentication/login']);
    this.dialogRef.close();
  }
}
