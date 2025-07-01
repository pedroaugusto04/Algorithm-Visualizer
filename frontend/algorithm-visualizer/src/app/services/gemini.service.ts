import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {

  private headers = new HttpHeaders().set('Content-Type', 'application/json; charset=utf-8');

  constructor(private httpClient: HttpClient) { }

  callGeminiApi(prompt: string): Observable<string> {
   const callGeminiApiUrl = new URL(environment.apiCallGemini, environment.baseUrl).toString();

    const body = { prompt };

    return this.httpClient.post(callGeminiApiUrl, body, { 
      headers: this.headers,
      responseType: 'text'  
    });
  }
  
}
