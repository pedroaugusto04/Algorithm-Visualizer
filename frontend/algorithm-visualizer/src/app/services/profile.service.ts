import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { GraphStructure } from '../models/GraphStructure';
import { GraphIdDTO } from '../models/DTO/User/GraphIdDTO';
import { ProfileDTO } from '../models/DTO/User/ProfileDTO';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  private headers = new HttpHeaders().set('Content-Type', 'application/json; charset=utf-8');
  

  constructor(private httpClient: HttpClient) { }

  getProfileInfo(): Observable<ProfileDTO> {

    const getProfileInfoUrl = new URL(environment.apiProfileInfo, environment.baseUrl).toString();

    return this.httpClient.get<ProfileDTO>(getProfileInfoUrl, {headers: this.headers, withCredentials: true});
  }
}
