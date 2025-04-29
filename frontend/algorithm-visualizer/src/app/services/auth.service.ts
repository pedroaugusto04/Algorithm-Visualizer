import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { MatrixStructure } from '../models/MatrixStructure';
import { GraphStructure } from '../models/GraphStructure';
import { RegisterUserDTO } from '../models/DTO/User/RegisterUserDTO';
import { LoginUserDTO } from '../models/DTO/User/LoginUserDTO';
import { LoginResponse } from '../models/Responses/LoginResponse';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private headers = new HttpHeaders().set('Content-Type', 'application/json; charset=utf-8');

  constructor(private httpClient: HttpClient) { }

  loginUser(loginUserDTO: LoginUserDTO): Observable<LoginResponse> {
    const userLoginUrl = new URL(environment.apiUserLogin, environment.baseUrl).toString();

    const requestBody: string = JSON.stringify(loginUserDTO);

    return this.httpClient.post<LoginResponse>(userLoginUrl,requestBody, {headers: this.headers});
  }

}
