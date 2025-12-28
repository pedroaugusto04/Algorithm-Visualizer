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

  constructor(private httpClient: HttpClient) { }

  executeCode(payload: {
    language: string;
    code: string;
    testcase?: string;
  }) {

    const executeCodeUrl = new URL(environment.apiExecuteCode, environment.baseUrl).toString();

    return this.httpClient.post<ExecuteCodeResponse>(
      executeCodeUrl,
      payload,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }

  executeCodeMultipart(payload: any, file: File) {

    const formData = new FormData();

    formData.append(
      'payload',
      new Blob([JSON.stringify(payload)], { type: 'application/json' })
    );

    if (file) {
      formData.append('inputFile', file);
    }

    const url = new URL(
      environment.apiExecuteCodeMultipart,
      environment.baseUrl
    ).toString();

    return this.httpClient.post<ExecuteCodeResponse>(url, formData);
  }
}
