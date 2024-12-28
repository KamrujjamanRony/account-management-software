import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AccountListService {

  http = inject(HttpClient);
  rootUrl = 'http://localhost:2222/api/ChartofAccount'

  addAccountList(model: any | FormData): Observable<void> {
    return this.http.post<void>(this.rootUrl, model)
  }

  getAccountList(query: any): Observable<any> {
    return this.http.post<any>(`${this.rootUrl}/SearchChartofAccount`, query);
  }

  getTreeView(): Observable<any> {
    return this.http.get<any>(`${this.rootUrl}/GenerateTreeData`);
  }

  updateAccountList(id: any, updateAccountListRequest: any | FormData): Observable<any> {
    return this.http.put<any>(`${this.rootUrl}/EditChartofAccount/${id}`, updateAccountListRequest);
  }

  deleteAccountList(id: any): Observable<any> {
    return this.http.delete<any>(`${this.rootUrl}/DeleteChartofAccount?id=${id}`);
  }
}
