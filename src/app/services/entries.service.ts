import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EntriesService {
  private apiUrl = 'http://localhost:3000/entries';

  http = inject(HttpClient);

  addEntries(model: any | FormData): Observable<void>{
    return this.http.post<void>(this.apiUrl, model)
  }

  // getAllEntries(): Observable<any[]> {
  //   return this.http.get<any[]>(this.apiUrl);
  // }

  getAllEntries(type: any): Observable<any[]> {
    return type ? this.http.get<any[]>(`${this.apiUrl}?type=${type}`) : this.http.get<any[]>(this.apiUrl);
  }

  getEntries(id: any): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  updateEntries(id: any, updateEntriesRequest: any | FormData): Observable<any>{
    return this.http.put<any>(`${this.apiUrl}/${id}`, updateEntriesRequest);
  }

  deleteEntries(id: any): Observable<any>{
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
