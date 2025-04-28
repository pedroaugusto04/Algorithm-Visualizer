import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ArrayStructure } from '../models/ArrayStructure';
import { GraphStructure } from '../models/GraphStructure';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private httpClient: HttpClient) { }

  loadUserGraphs(): Observable<GraphStructure[]> {
    const getUserGraphsUrl = new URL(environment.apiGetUserGraphData, environment.baseUrl).toString();

    return this.httpClient.get<GraphStructure[]>(getUserGraphsUrl);
  }

  loadUserArrays(): Observable<ArrayStructure[]> {
    const getUserArraysUrl = new URL(environment.apiGetUserArrayData, environment.baseUrl).toString();

    return this.httpClient.get<ArrayStructure[]>(getUserArraysUrl);
  }

}
