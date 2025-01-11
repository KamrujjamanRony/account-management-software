import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, switchMap } from 'rxjs';
import { DataService } from './data.service';

@Injectable({
  providedIn: 'root',
})
export class VoucherService {
  private readonly http = inject(HttpClient);
  private readonly dataService = inject(DataService);

  private apiCall<T>(endpoint: string, method: 'get' | 'post' | 'put' | 'delete', body?: any): Observable<T> {
    return this.dataService.getPort().pipe(
      switchMap(port => {
        const url = `http://localhost:${port}/api/Voucher${endpoint}`;
        return this.http.request<T>(method, url, { body });
      })
    );
  }

  addVoucher(model: any | FormData): Observable<void> {
    console.log(model); // Optional: Debugging log
    return this.apiCall<void>('', 'post', model);
  }

  getVoucher(query: any): Observable<any> {
    return this.apiCall<any>('/SearchVoucher', 'post', query);
  }

  getVoucherDetails(query: any): Observable<any> {
    return this.apiCall<any>('/SearchVoucherwithDetail', 'post', query);
  }

  updateVoucher(id: string | number, updateVoucherRequest: any | FormData): Observable<any> {
    return this.apiCall<any>(`/EditVoucher/${id}`, 'put', updateVoucherRequest);
  }

  deleteVoucher(id: string | number): Observable<any> {
    return this.apiCall<any>(`/DeleteVoucher?id=${id}`, 'delete');
  }
}
