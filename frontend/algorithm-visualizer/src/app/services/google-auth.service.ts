import { Injectable } from '@angular/core';

declare const google: any;

@Injectable({
  providedIn: 'root'
})
export class GoogleAuthService {

  initialize(clientId: string, callback: (response: any) => void) {
    google.accounts.id.initialize({
      client_id: clientId,
      callback: callback
    });
  }

  login() {
    google.accounts.id.prompt();
  }
}
