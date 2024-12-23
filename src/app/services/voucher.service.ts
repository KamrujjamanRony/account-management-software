import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VoucherService {

  // http = inject(HttpClient);
  // rootUrl = 'http://localhost:2222/api/Bank'

  // addBank(model: any | FormData): Observable<void> {
  //   return this.http.post<void>(this.rootUrl, model)
  // }

  // getBank(query: any): Observable<any> {
  //   return this.http.post<any>(`${this.rootUrl}/SearchBank?Search=${query}`, '');
  // }

  // updateBank(id: any, updateBankRequest: any | FormData): Observable<any> {
  //   return this.http.put<any>(`${this.rootUrl}/EditBank/${id}`, updateBankRequest);
  // }

  // deleteBank(id: any): Observable<any> {
  //   return this.http.post<any>(`${this.rootUrl}/DeleteBank?id=${id}`, '');
  // }
}
