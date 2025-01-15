import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, switchMap } from 'rxjs';
import { DataService } from './data.service';

@Injectable({
  providedIn: 'root',
})
export class AccountListService {
  private readonly http = inject(HttpClient);
  private readonly dataService = inject(DataService);

  private apiCall<T>(endpoint: string, method: 'get' | 'post' | 'put' | 'delete', body?: any): Observable<T> {
    return this.dataService.getPort().pipe(
      switchMap(port => {
        const url = `${port}/api/ChartofAccount${endpoint}`;
        return this.http.request<T>(method, url, { body });
      })
    );
  }

  addAccountList(model: any | FormData): Observable<void> {
    return this.apiCall<void>('', 'post', model);
  }

  getAccountList(query: any): Observable<any> {
    return this.apiCall<any>('/SearchChartofAccount', 'post', query);
  }

  getTreeView(): Observable<any> {
    return this.apiCall<any>('/GenerateTreeData', 'get');
  }

  updateAccountList(id: string | number, updateRequest: any | FormData): Observable<any> {
    return this.apiCall<any>(`/EditChartofAccount/${id}`, 'put', updateRequest);
  }

  deleteAccountList(id: string | number): Observable<any> {
    return this.apiCall<any>(`/DeleteChartofAccount?id=${id}`, 'delete');
  }
}
