import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { MatrixStructure } from '../models/MatrixStructure';
import { GraphStructure } from '../models/GraphStructure';
import { RegisterUserDTO } from '../models/DTO/User/RegisterUserDTO';
import { CookieService } from 'ngx-cookie-service';
import { UserDTO } from '../models/DTO/User/UserDTO';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private headers = new HttpHeaders().set('Content-Type', 'application/json; charset=utf-8');
  
  private userSubject = new BehaviorSubject<UserDTO | null>(null);

  public readonly user$ = this.userSubject.asObservable();

  constructor(private httpClient: HttpClient, private cookieService: CookieService) { }
  

  getUserLoggedIn(): Observable<UserDTO> {

    const cachedUser = this.userSubject.value;
  
    if (cachedUser) {
      return of(cachedUser);
    }
  
    const userInfoUrl = new URL(environment.apiUserInfo, environment.baseUrl).toString();
  
    return this.httpClient.get<UserDTO>(userInfoUrl, {
      headers: this.headers,
      withCredentials: true
    }).pipe(
      tap(user => this.userSubject.next(user))
    );
  }

  isUserLoggedIn(): boolean {
    return this.userSubject.value !== null;
  }

  registerUser(registerUserDTO: RegisterUserDTO): Observable<void> {

    const userRegisterUrl = new URL(environment.apiUserRegister, environment.baseUrl).toString();

    const requestBody: string = JSON.stringify(registerUserDTO);

    return this.httpClient.post<void>(userRegisterUrl,requestBody, {headers: this.headers});
  }

  loadUserGraphsIds(): Observable<string[]> {
    const getUserGraphsIdsUrl = new URL(environment.apiGetUserGraphIdsData, environment.baseUrl).toString();

    return this.httpClient.get<string[]>(getUserGraphsIdsUrl, {headers: this.headers, withCredentials: true});
  }

  loadUserMatrices(): Observable<MatrixStructure[]> {
    const getUserMatricesUrl = new URL(environment.apiGetUserMatrixData, environment.baseUrl).toString();

    return this.httpClient.get<MatrixStructure[]>(getUserMatricesUrl, {headers: this.headers, withCredentials: true});
  }

  logoutUser(): void {
    this.userSubject.next(null);
  }

}
