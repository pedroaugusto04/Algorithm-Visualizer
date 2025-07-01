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

@Component({
  selector: 'app-side-login',
  imports: [RouterModule, MaterialModule, FormsModule, ReactiveFormsModule,MatInputModule,MatFormFieldModule],
  templateUrl: './side-login.component.html',
  styleUrl: './side-login.component.scss'
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
      this.swalService.errorNoButton("Invalid input","Please, enter valid information");
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
          sameSite: "Strict",
          secure: true,
        });

        this.router.navigate(['/'])

        this.swalService.successNoButton("Login successful","");
      },
      error: () => {
        this.swalService.errorNoButton("Invalid credentials","Please, try again");
      }
    })

  }

  onSignInAnonymous() {
    this.router.navigate(['/']);
  }
}
