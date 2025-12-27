import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { LoginUserDTO } from '../models/DTO/User/LoginUserDTO';
import { LoginResponse } from '../models/Responses/LoginResponse';
import { CookieService } from 'ngx-cookie-service';
import { Router } from '@angular/router';
import { UserService } from './user.service';

import { ExecuteCode } from '../models/ExecuteCode';
import { ExecuteCodeResponse } from '../models/Responses/ExecuteCodeResponse';

@Injectable({
  providedIn: 'root'
})
export class CodeService {

  private headers = new HttpHeaders().set('Content-Type', 'application/json; charset=utf-8');

  constructor(private httpClient: HttpClient) { }

  executeCode(executeCodeDTO: ExecuteCode): Observable<ExecuteCodeResponse> {

    const executeCodeUrl = new URL(environment.apiExecuteCode, environment.baseUrl).toString();

    const requestBody: string = JSON.stringify(executeCodeDTO);

    return this.httpClient.post<ExecuteCodeResponse>(executeCodeUrl, requestBody, { headers: this.headers });
  }
}
