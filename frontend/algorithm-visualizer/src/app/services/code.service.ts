import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ExecuteCodeResponse } from '../models/Responses/ExecuteCodeResponse';
import { parseExecutionResponse } from '../models/Responses/ExecutionResponseParser';
import { ExecuteCode } from '../models/ExecuteCode';

@Injectable({
  providedIn: 'root'
})
export class CodeService {

  constructor(private httpClient: HttpClient) { }

  executeCode(payload: ExecuteCode) {

    const executeCodeUrl = new URL(environment.apiExecuteCode, environment.baseUrl).toString();

    return this.httpClient.post<unknown>(executeCodeUrl, payload).pipe(map(parseExecutionResponse));
  }

}
