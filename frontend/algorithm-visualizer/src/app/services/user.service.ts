import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { MatrixStructure } from '../models/MatrixStructure';
import { GraphStructure } from '../models/GraphStructure';
import { RegisterUserDTO } from '../models/DTO/User/RegisterUserDTO';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private headers = new HttpHeaders().set('Content-Type', 'application/json; charset=utf-8');

  constructor(private httpClient: HttpClient) { }

  registerUser(registerUserDTO: RegisterUserDTO): Observable<void> {

    const userRegisterUrl = new URL(environment.apiUserRegister, environment.baseUrl).toString();

    const requestBody: string = JSON.stringify(registerUserDTO);

    return this.httpClient.post<void>(userRegisterUrl,requestBody, {headers: this.headers});
  }

  loadUserGraphs(): Observable<GraphStructure[]> {
    const getUserGraphsUrl = new URL(environment.apiGetUserGraphData, environment.baseUrl).toString();

    return this.httpClient.get<GraphStructure[]>(getUserGraphsUrl);
  }

  loadUserMatrices(): Observable<MatrixStructure[]> {
    const getUserMatricesUrl = new URL(environment.apiGetUserMatrixData, environment.baseUrl).toString();

    return this.httpClient.get<MatrixStructure[]>(getUserMatricesUrl);
  }

}
