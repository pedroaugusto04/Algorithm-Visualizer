import { Component, OnInit, NgZone } from '@angular/core';

declare const google: any;

@Component({
  selector: 'app-google-signin',
  standalone: true,
  imports: [],
  templateUrl: './google-signin.component.html',
  styleUrl: './google-signin.component.scss'
})
export class GoogleSigninComponent {



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
      { theme: "outline", size: "large", shape: "pill", width: 210}
    );

    google.accounts.id.prompt();
  }

  handleCredentialResponse(response: any) {
    console.log('Encoded JWT ID token: ' + response.credential);
  }


}
