import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, switchMap } from 'rxjs';
import { DataService } from '../../shared/services/data.service';

@Injectable({
  providedIn: 'root'
})
export class AccountingReportsService {
  private readonly http = inject(HttpClient);
  private readonly dataService = inject(DataService);

  private apiCall<T>(endpoint: string, method: 'get' | 'post' | 'put' | 'delete', body?: any): Observable<T> {
    return this.dataService.getPort().pipe(
      switchMap(port => {
        const url = `${port}/api/AccountingReport/${endpoint}`;
        return this.http.request<T>(method, url, { body });
      })
    );
  }

  receiptPaymentApi(model: any): Observable<any> {
    return this.apiCall<any>('ReceiptPayment', 'post', model);
  }

  trialBalanceApi(model: any): Observable<any> {
    return this.apiCall<any>('TrialBalanceOne', 'post', model); //ToDo: TrialBalance should be implemented properly in the future
  }

  generalLedgerApi(model: any): Observable<any> {
    return this.apiCall<any>('GeneralLedger', 'post', model);
  }

  generalCashBookApi(model: any): Observable<any> {
    return this.apiCall<any>('GeneralCashBook', 'post', model);
  }

  getCurrentBalanceApi(model: any): Observable<any> {
    return this.apiCall<any>('GetCurrentBalace', 'post', model);
  }

  getDashboardApi(model: any): Observable<any> {
    return this.apiCall<any>('DatewiseBalance', 'post', model);
  }
}
