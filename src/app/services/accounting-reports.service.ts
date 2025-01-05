import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { DataService } from './data.service';
import { Observable, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AccountingReportsService {
  private readonly http = inject(HttpClient);
  private readonly dataService = inject(DataService);

  private apiCall<T>(endpoint: string, method: 'get' | 'post' | 'put' | 'delete', body?: any): Observable<T> {
    return this.dataService.getPort().pipe(
      switchMap(port => {
        const url = `http://localhost:${port}/api/AccountingReport/${endpoint}`;
        return this.http.request<T>(method, url, { body });
      })
    );
  }

  receiptPaymentApi(model: any | FormData): Observable<any> {
    return this.apiCall<any>('ReceiptPayment', 'post', model);
  }

  trialBalanceApi(model: any | FormData): Observable<any> {
    return this.apiCall<any>('TrialBalance', 'post', model);
  }

  generalLedgerApi(model: any | FormData): Observable<any> {
    return this.apiCall<any>('GeneralLedger', 'post', model);
  }

  generalCashBookApi(model: any | FormData): Observable<any> {
    return this.apiCall<any>('GeneralCashBook', 'post', model);
  }
}
