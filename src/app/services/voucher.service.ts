import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VoucherService {

  http = inject(HttpClient);
  rootUrl = 'http://localhost:2222/api/Voucher'

  addVoucher(model: any | FormData): Observable<void> {
    console.log(model)
    return this.http.post<void>(this.rootUrl, model)
  }

  getVoucher(query: any): Observable<any> {
    return this.http.post<any>(`${this.rootUrl}/SearchVoucher`, query);
  }

  updateVoucher(id: any, updateVoucherRequest: any | FormData): Observable<any> {
    return this.http.put<any>(`${this.rootUrl}/EditVoucher/${id}`, updateVoucherRequest);
  }

  deleteVoucher(id: any): Observable<any> {
    return this.http.delete<any>(`${this.rootUrl}/DeleteVoucher?id=${id}`);
  }
}
