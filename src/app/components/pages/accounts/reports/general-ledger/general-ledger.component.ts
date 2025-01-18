import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AccountingReportsService } from '../../../../../services/accounting-reports.service';
import { DataFetchService } from '../../../../../services/useDataFetch';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-general-ledger',
  imports: [FormsModule, CommonModule],
  templateUrl: './general-ledger.component.html',
  styleUrl: './general-ledger.component.css'
})
export class GeneralLedgerComponent {
  private accountingReportsService = inject(AccountingReportsService);
  private dataFetchService = inject(DataFetchService);
  filteredReports = signal<any[]>([]);
  fromDate = signal<any>(null);
  toDate = signal<any>(null);

  isLoading$: Observable<any> | undefined;
  hasError$: Observable<any> | undefined;
  marginTop: any = 0;

  ngOnInit() {
    const today = new Date();
    this.fromDate.set(today.toISOString().split('T')[0]);
    this.onLoadReport();
  }

  onLoadReport() {
    const reqData = {
      "bankCashChartofAccountId": null,
      "fromDate": this.fromDate(),
      "toDate": this.toDate() || this.fromDate()
    }
    const { data$, isLoading$, hasError$ } = this.dataFetchService.fetchData(this.accountingReportsService.trialBalanceApi(reqData));

    data$.subscribe(data => {
      this.filteredReports.set(data);
      console.log(data)
    });

    this.isLoading$ = isLoading$;
    this.hasError$ = hasError$;
  }

}
