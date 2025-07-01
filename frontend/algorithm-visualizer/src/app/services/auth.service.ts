import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { LoginUserDTO } from '../models/DTO/User/LoginUserDTO';
import { LoginResponse } from '../models/Responses/LoginResponse';
import { CookieService } from 'ngx-cookie-service';
import { Router } from '@angular/router';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private headers = new HttpHeaders().set('Content-Type', 'application/json; charset=utf-8');

  constructor(private httpClient: HttpClient, private cookieService: CookieService, private router: Router, private userService: UserService) { }

  loginUser(loginUserDTO: LoginUserDTO): Observable<LoginResponse> {
    const userLoginUrl = new URL(environment.apiUserLogin, environment.baseUrl).toString();

    const requestBody: string = JSON.stringify(loginUserDTO);

    return this.httpClient.post<LoginResponse>(userLoginUrl,requestBody, {headers: this.headers});
  }

  logoutUser() {
    this.cookieService.deleteAll();
    this.userService.logoutUser();
    this.router.navigate(['/authentication/login']);
  }

  logoutUserHome() {
    this.userService.logoutUser();
    this.router.navigate(['/authentication/login']);
  }

}
