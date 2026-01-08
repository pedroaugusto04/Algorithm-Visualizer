import { Component, OnInit, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { AuthService } from 'src/app/services/auth.service';
import { SwalService } from 'src/app/services/utils/swal/swal.service';

declare const google: any;

@Component({
  selector: 'app-google-signin',
  standalone: true,
  imports: [],
  templateUrl: './google-signin.component.html',
  styleUrl: './google-signin.component.scss'
})
export class GoogleSigninComponent {

  constructor(private authService: AuthService, private cookieService: CookieService, private router: Router, private swalService: SwalService) { }

  async ngAfterViewInit(): Promise<void> {
    await this.waitForGoogleScript();
    this.initializeGoogleSignIn();
  }

  waitForGoogleScript(): Promise<void> {
    return new Promise((resolve) => {
      const check = () => {
        if (window.hasOwnProperty('google')) {
          resolve();
        } else {
          setTimeout(check, 50);
        }
      };
      check();
    });
  }

  initializeGoogleSignIn() {
    google.accounts.id.initialize({
      client_id: '159652630258-q4l81gbo4114le6el37gubp7vu5n5c6u.apps.googleusercontent.com',
      callback: (response: any) => this.handleCredentialResponse(response)
    });

    google.accounts.id.renderButton(
      document.getElementById('google-signin-button'),
      { theme: "outline", size: "large", shape: "pill", width: 210 }
    );

    google.accounts.id.prompt();
  }

  handleCredentialResponse(response: any) {
    this.authService.loginGoogleUser(response.credential).subscribe({
      next: (data) => {
        // salva o token nos cookies
        this.cookieService.set("token", data.token, {
          expires: 1,
          path: '/',
          sameSite: "None",
          secure: true,
        });

        this.router.navigate(['/'])

        this.swalService.successNoButton("Login successful", "");
      },
      error: (error) => {
        this.swalService.errorNoButton("Google Sign-in Failed", error.error.message || "An error occurred during Google login.", 4000);
      }
    });
  }
}
