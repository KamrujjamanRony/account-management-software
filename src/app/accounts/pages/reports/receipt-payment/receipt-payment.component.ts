import { Component, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { AccountingReportsService } from '../../../services/accounting-reports.service';
import { DataFetchService } from '../../../../shared/services/useDataFetch';

@Component({
  selector: 'app-receipt-payment',
  imports: [],
  templateUrl: './receipt-payment.component.html',
  styleUrl: './receipt-payment.component.css'
})
export class ReceiptPaymentComponent {
  private accountingReportsService = inject(AccountingReportsService);
  private dataFetchService = inject(DataFetchService);
  openingBalance = signal<any[]>([]);
  receiptBalance = signal<any[]>([]);
  paymentBalance = signal<any[]>([]);
  closingBalance = signal<any[]>([]);
  totalOpeningBalance = signal<any>(0);
  totalReceiptBalance = signal<any>(0);
  totalPaymentBalance = signal<any>(0);
  totalClosingBalance = signal<any>(0);
  fromDate = signal<any>('');
  toDate = signal<any>('');

  isLoading$: Observable<any> | undefined;
  hasError$: Observable<any> | undefined;

  // Initial Data Fetched ----------------------------------------------------------------

  ngOnInit() {
    const today = new Date();
    this.fromDate.set(today.toISOString().split('T')[0]);

    const reqData = {
      "bankCashChartofAccountId": null,
      "fromDate": this.fromDate(),
      "toDate": this.toDate() || this.fromDate()
    }


    const { data$, isLoading$, hasError$ } = this.dataFetchService.fetchData(this.accountingReportsService.receiptPaymentApi(reqData));

    this.isLoading$ = isLoading$;
    this.hasError$ = hasError$;

    data$.subscribe((data: any) => {
      this.openingBalance.set(data?.openingBalance);
      this.receiptBalance.set(data?.receiptBalance);
      this.paymentBalance.set(data?.paymentBalance);
      this.closingBalance.set(data?.closingBalance);
      this.totalOpeningBalance.set(this.openingBalance()?.reduce((prev: any, data: any) => prev + (data.amount || 0), 0));
      this.totalReceiptBalance.set(this.receiptBalance()?.reduce((prev: any, data: any) => prev + (data.amount || 0), 0));
      this.totalPaymentBalance.set(this.paymentBalance()?.reduce((prev: any, data: any) => prev + (data.amount || 0), 0));
      this.totalClosingBalance.set(this.closingBalance()?.reduce((prev: any, data: any) => prev + (data.amount || 0), 0));
      console.log(data)
    });
  }

}
