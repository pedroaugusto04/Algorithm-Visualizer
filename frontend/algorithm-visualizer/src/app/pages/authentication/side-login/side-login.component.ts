import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoginUserDTO } from 'src/app/models/DTO/User/LoginUserDTO';
import { AuthService } from 'src/app/services/auth.service';
import { CookieService } from "ngx-cookie-service";
import { SnackBarService } from 'src/app/services/utils/snack-bar.service';

@Component({
  selector: 'app-side-login',
  imports: [RouterModule, MaterialModule, FormsModule, ReactiveFormsModule],
  templateUrl: './side-login.component.html',
  styleUrl: './side-login.component.scss'
})
export class AppSideLoginComponent {

  constructor(private router: Router, private authService: AuthService,
    private cookieService: CookieService, private snackBarService: SnackBarService
  ) { }

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.minLength(6)]),
    password: new FormControl('', [Validators.required]),
  });

  get f() {
    return this.form.controls;
  }

  onSignIn() {

    if (!this.form.valid) {
      this.snackBarService.showSnackBarError("Incorrect username or password");
      return;
    }

    const loginUserDTO: LoginUserDTO = {
      email: this.form.value.email || '',
      password: this.form.value.password || ''
    }

    this.authService.loginUser(loginUserDTO).subscribe({
      next: (data) => {
        
        // salva o token nos cookies
        this.cookieService.set("token", data.token, {
          expires: 1,
          sameSite: "Strict",
          secure: true,
        });

        this.router.navigate(['/'])

        this.snackBarService.showSnackBarSuccess("Login successful");
      },
      error: () => {
        this.snackBarService.showSnackBarError("Internal error during login");
      }
    })

  }
}
