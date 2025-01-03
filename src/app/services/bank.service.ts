import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, switchMap } from 'rxjs';
import { DataService } from './data.service';

@Injectable({
  providedIn: 'root',
})
export class BankService {
  private readonly http = inject(HttpClient);
  private readonly dataService = inject(DataService);

  private apiCall<T>(endpoint: string, method: 'get' | 'post' | 'put' | 'delete', body?: any): Observable<T> {
    return this.dataService.getPort().pipe(
      switchMap(port => {
        const url = `http://localhost:${port}/api/Bank${endpoint}`;
        return this.http.request<T>(method, url, { body });
      })
    );
  }

  addBank(model: any | FormData): Observable<void> {
    return this.apiCall<void>('', 'post', model);
  }

  getBank(query: string): Observable<any> {
    return this.apiCall<any>(`/SearchBank?Search=${query}`, 'post');
  }

  updateBank(id: string | number, updateBankRequest: any | FormData): Observable<any> {
    return this.apiCall<any>(`/EditBank/${id}`, 'put', updateBankRequest);
  }

  deleteBank(id: string | number): Observable<any> {
    return this.apiCall<any>(`/DeleteBank?id=${id}`, 'delete');
  }
}
