import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { DataService } from '../../shared/services/data.service';
import { Observable, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  private readonly http = inject(HttpClient);
  private readonly dataService = inject(DataService);

  private apiCall<T>(endpoint: string, method: 'get' | 'post' | 'put' | 'delete', body?: any): Observable<T> {
    return this.dataService.getPort().pipe(
      switchMap(port => {
        const url = `${port}/HWS/Authentication${endpoint}`;
        return this.http.request<T>(method, url, { body });
      })
    );
  }

  login(model: any): Observable<any> {
    return this.apiCall<any>('/Login', 'post', model);
  }
}
