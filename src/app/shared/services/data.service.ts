import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private readonly http = inject(HttpClient);
  private readonly jsonUrl = 'data/data.json';

  // Fetches the JSON data and extracts the port
  getPort(): Observable<string> {
    return this.http.get<{ port: string }>(this.jsonUrl).pipe(map(data => data.port));
  }
  // Fetches the JSON data and extracts the header
  getHeader(): Observable<any> {
    return this.http.get<any>(this.jsonUrl).pipe(map(data => data.header));
  }
  // Fetches the JSON data and extracts the options
  getOptions(): Observable<any> {
    return this.http.get<any>(this.jsonUrl).pipe(map(data => data.options));
  }
}
