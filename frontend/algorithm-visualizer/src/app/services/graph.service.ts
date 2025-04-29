import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { GraphStructure } from '../models/GraphStructure';
import { GraphItem } from '../models/GraphItem';

@Injectable({
  providedIn: 'root'
})
export class GraphService {

  private headers = new HttpHeaders().set('Content-Type', 'application/json; charset=utf-8');
  

  constructor(private httpClient: HttpClient) { }

  createUndirectedUnweightedGraph(graphItems: GraphItem[]): Observable<void> {

    const requestBody: string = JSON.stringify(graphItems);
    
    const createUrl = new URL(environment.apiCreateUndirectedUnweightedGraph, environment.baseUrl).toString();

    return this.httpClient.post<void>(createUrl,requestBody, {headers: this.headers});
  }

  createUndirectedWeightedGraph(graphItems: GraphItem[]): Observable<void> {

    const requestBody: string = JSON.stringify(graphItems);
    
    const createUrl = new URL(environment.apiCreateUndirectedWeightedGraph, environment.baseUrl).toString();
    
    return this.httpClient.post<void>(createUrl,requestBody, {headers: this.headers});
  }

  createDirectedUnweightedGraph(graphItems: GraphItem[]): Observable<void> {

    const requestBody: string = JSON.stringify(graphItems);
    
    const createUrl = new URL(environment.apiCreateDirectedUnweightedGraph, environment.baseUrl).toString();

    return this.httpClient.post<void>(createUrl,requestBody, {headers: this.headers});
  }

  createDirectedWeightedGraph(graphItems: GraphItem[]): Observable<void> {

    const requestBody: string = JSON.stringify(graphItems);
    
    const createUrl = new URL(environment.apiCreateDirectedWeightedGraph, environment.baseUrl).toString();

    return this.httpClient.post<void>(createUrl,requestBody, {headers: this.headers});
  }

}
