import { Component } from '@angular/core';
import { CoreService } from 'src/app/services/core.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { UserService } from 'src/app/services/user.service';
import { RegisterUserDTO } from 'src/app/models/DTO/User/RegisterUserDTO';
import { SwalService } from 'src/app/services/utils/swal/swal.service';

@Component({
  selector: 'app-side-register',
  imports: [RouterModule, MaterialModule, FormsModule, ReactiveFormsModule],
  templateUrl: './side-register.component.html',
  styleUrl: './side-register.component.scss'
})
export class AppSideRegisterComponent {
  options = this.settings.getOptions();

  constructor(private settings: CoreService, private router: Router,
    private userService: UserService, private swalService: SwalService
  ) { }

  form = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(6)]),
    email: new FormControl('', [Validators.required,Validators.email]),
    password: new FormControl('', [Validators.required]),
  });

  get f() {
    return this.form.controls;
  }

  onSignUp() {
    
    if (!this.form.valid) {
      this.swalService.errorNoButton("Invalid input","Incorrect username or password");
      return;
    }

    const registerUserDTO: RegisterUserDTO = {
      name: this.form.value.name || '',
      email: this.form.value.email || '',
      password: this.form.value.password || ''
    }
    
    this.userService.registerUser(registerUserDTO).subscribe({
      next: () => {
        this.router.navigate(['/authentication/login'])

        this.swalService.successNoButton("User registered successfully","");
      },
      error: () => {
        this.swalService.errorNoButton("Internal error while registering user","");
      }
    })
  }
}
