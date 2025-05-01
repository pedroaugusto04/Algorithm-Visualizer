import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AlgorithmOptions } from '../models/AlgorithmOptions';

@Injectable({
  providedIn: 'root'
})
export class AlgorithmService {

  private headers = new HttpHeaders().set('Content-Type', 'application/json; charset=utf-8');

  constructor(private httpClient: HttpClient) { }

  getSupportedAlgorithmsByDataStructure(dataStructureId: string): Observable<AlgorithmOptions[]> {

     const params = new HttpParams().set('dataStructureId', dataStructureId);
        
        const supportedAlgorithmsUrl = 
        new URL(environment.apiGetSupportedAlgorithmsByDataStructure, environment.baseUrl).toString();
      
        return this.httpClient.get<AlgorithmOptions[]>(supportedAlgorithmsUrl, { params, headers: this.headers, withCredentials: true });
  }

}
