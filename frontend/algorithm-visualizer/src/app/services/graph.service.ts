import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { GraphStructure } from '../models/GraphStructure';
import { GraphItem } from '../models/GraphItem';
import { GraphIdDTO } from '../models/DTO/User/GraphIdDTO';

@Injectable({
  providedIn: 'root'
})
export class GraphService {

  private headers = new HttpHeaders().set('Content-Type', 'application/json; charset=utf-8');
  

  constructor(private httpClient: HttpClient) { }

  createUndirectedUnweightedGraph(graph: GraphStructure): Observable<GraphIdDTO> {

    const requestBody: string = JSON.stringify(graph);
    
    const createUrl = new URL(environment.apiCreateUndirectedUnweightedGraph, environment.baseUrl).toString();

    return this.httpClient.post<GraphIdDTO>(createUrl,requestBody, {headers: this.headers, withCredentials: true});
  }

  createUndirectedWeightedGraph(graph: GraphStructure): Observable<GraphIdDTO> {

    const requestBody: string = JSON.stringify(graph);
    
    const createUrl = new URL(environment.apiCreateUndirectedWeightedGraph, environment.baseUrl).toString();
    
    return this.httpClient.post<GraphIdDTO>(createUrl,requestBody, {headers: this.headers, withCredentials: true});
  }

  createDirectedUnweightedGraph(graph: GraphStructure): Observable<GraphIdDTO> {

    const requestBody: string = JSON.stringify(graph);
    
    const createUrl = new URL(environment.apiCreateDirectedUnweightedGraph, environment.baseUrl).toString();

    return this.httpClient.post<GraphIdDTO>(createUrl,requestBody, {headers: this.headers, withCredentials: true});
  }

  createDirectedWeightedGraph(graph: GraphStructure): Observable<GraphIdDTO> {

    const requestBody: string = JSON.stringify(graph);
    
    const createUrl = new URL(environment.apiCreateDirectedWeightedGraph, environment.baseUrl).toString();

    return this.httpClient.post<GraphIdDTO>(createUrl,requestBody, {headers: this.headers, withCredentials: true});
  }

  getGraphById(graphId: string): Observable<GraphStructure> {
    const params = new HttpParams().set('graphId', graphId);
    
    const getGraphByIdUrl = new URL(environment.apiGetGraphById, environment.baseUrl).toString();
  
    return this.httpClient.get<GraphStructure>(getGraphByIdUrl, { params, headers: this.headers, withCredentials: true });
  }

}
