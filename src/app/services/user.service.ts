import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { DataService } from './data.service';
import { Observable, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly dataService = inject(DataService);

  private apiCall<T>(endpoint: string, method: 'get' | 'post' | 'put' | 'delete', body?: any): Observable<T> {
    return this.dataService.getPort().pipe(
      switchMap(port => {
        const url = `${port}/api/User${endpoint}`;
        return this.http.request<T>(method, url, { body });
      })
    );
  }

  addUser(model: any): Observable<void> {
    return this.apiCall<void>('', 'post', model);
  }

  getUser(query: string): Observable<any> {
    return this.apiCall<any>(`/SearchUser?Search=${query}`, 'post');
  }

  updateUser(id: string | number, updateUserRequest: any): Observable<any> {
    return this.apiCall<any>(`/EditUser/${id}`, 'put', updateUserRequest);
  }

  deleteUser(id: string | number): Observable<any> {
    return this.apiCall<any>(`/DeleteUser?id=${id}`, 'delete');
  }
}
