import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { LoginUserDTO } from 'src/app/models/DTO/User/LoginUserDTO';
import { AuthService } from 'src/app/services/auth.service';
import { CookieService } from "ngx-cookie-service";
import { SwalService } from 'src/app/services/utils/swal/swal.service';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { GoogleSigninComponent } from 'src/app/components/google-signin/google-signin.component';

@Component({
  selector: 'app-side-login',
  standalone: true,
  imports: [RouterModule, MaterialModule, FormsModule, ReactiveFormsModule, MatInputModule, MatFormFieldModule, CommonModule,GoogleSigninComponent
  ],
  templateUrl: './side-login.component.html',
  styleUrls: ['./side-login.component.scss']
})
export class AppSideLoginComponent {

  constructor(private router: Router, private authService: AuthService,
    private cookieService: CookieService, private swalService: SwalService
  ) {
  }

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
  });

  get f() {
    return this.form.controls;
  }

  onSignIn() {

    if (!this.form.valid) {
      this.swalService.errorNoButton("Invalid input", "Please, enter valid information");
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
          path: '/',
          sameSite: "None",
          secure: true,
        });

        this.router.navigate(['/'])
      },
      error: () => {
        this.swalService.errorNoButton("Invalid credentials", "Please, try again");
      }
    })

  }

  onSignInAnonymous() {
    this.router.navigate(['/']);
  }

  handleCredentialResponse(response: any) {
    console.log(response);
  }
}
