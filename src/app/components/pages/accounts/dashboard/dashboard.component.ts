import { Component, inject, signal } from '@angular/core';
import { AccountingReportsService } from '../../../../services/accounting-reports.service';
import { DataFetchService } from '../../../../services/useDataFetch';
import { Observable } from 'rxjs';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApexChartComponent } from "../../../shared/apex-chart/apex-chart.component";
import { ApexChart2Component } from "../../../shared/apex-chart-2/apex-chart-2.component";

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule, ApexChartComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  private accountingReportsService = inject(AccountingReportsService);
  private dataFetchService = inject(DataFetchService);
  filteredReports = signal<any>({
    "totalBalanceResult": [],
    "totalCurrentBalanceResult": [],
    "datewiseIncomeExpenceResult": {},
    "monthwiseIncomeExpenceResult": [],
  });
  fromDate = signal<any>(null);
  totalMonth = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  isLoading$: Observable<any> | undefined;
  hasError$: Observable<any> | undefined;
  marginTop: any = 0;

  ngOnInit() {
    const today = new Date();
    this.fromDate.set(today.toISOString().split('T')[0]);
    this.onLoadReport();
  }

  onLoadReport() {
    if (!this.fromDate()) {
      return;
    }
    const reqData = {
      "asonDate": this.fromDate(),
    }
    const { data$, isLoading$, hasError$ } = this.dataFetchService.fetchData(this.accountingReportsService.getDashboardApi(reqData));

    data$.subscribe((data: any) => {
      const yearlyTotalIncome = new Array(12).fill(0);
      const yearlyTotalExpense = new Array(12).fill(0);
      const yearlyProfit = new Array(12).fill(0);

      // Fill the arrays based on available data
      data?.monthwiseIncomeExpenceResult?.forEach((entry: any) => {
        const monthIndex = entry.month - 1; // Convert month number (1-12) to array index (0-11)
        yearlyTotalIncome[monthIndex] = entry.totalIncome || 0;
        yearlyTotalExpense[monthIndex] = entry.totalExpense || 0;
        yearlyProfit[monthIndex] = entry.profit || 0;
      });

      const thisMonth = this.fromDate().split('-')[1];
      console.log(+thisMonth)
      const monthlyIncome = yearlyTotalIncome[+thisMonth - 1];
      const monthlyExpense = yearlyTotalExpense[+thisMonth - 1];
      const monthlyProfit = yearlyProfit[+thisMonth - 1];

      // Calculate the total balance for the year
      const incomeExpenseChartData = [
        { name: "Received", data: yearlyTotalIncome },
        { name: "Payment", data: yearlyTotalExpense }
      ]
      const profitChartData = [
        { name: "Profit", data: yearlyProfit }
      ]
      // Calculate the total balance for the year
      const totalReceipt = data?.monthwiseIncomeExpenceResult?.reduce((prev: any, curr: any) => prev + curr?.totalIncome, 0);
      const totalPayment = data?.monthwiseIncomeExpenceResult?.reduce((prev: any, curr: any) => prev + curr?.totalExpense, 0);
      const totalBalance = data?.monthwiseIncomeExpenceResult?.reduce((prev: any, curr: any) => prev + curr?.profit, 0);
      // Update the filtered reports signal with the new data
      this.filteredReports.set({
        totalBalanceResult: data?.totalBalanceResult || [],
        datewiseIncomeExpenceResult: data?.datewiseIncomeExpenceResult,
        // datewiseIncomeExpenceResult: Array.isArray(data?.datewiseIncomeExpenceResult)
        //   ? data?.datewiseIncomeExpenceResult
        //   : Object.entries(data?.datewiseIncomeExpenceResult || {}),
        totalCurrentBalanceResult: data?.totalCurrentBalanceResult || [],
        monthwiseIncomeExpenceResult: data?.monthwiseIncomeExpenceResult || [],
        incomeExpenseChartData,
        profitChartData,
        totalReceipt,
        totalPayment,
        totalBalance,
        monthlyIncome,
        monthlyExpense,
        monthlyProfit,
      });
      console.log(this.filteredReports())
    });

    this.isLoading$ = isLoading$;
    this.hasError$ = hasError$;
  }


  transform(value: any, args: any = 'dd/MM/yyyy'): any {
    if (!value) return null;
    const datePipe = new DatePipe('en-US');
    return datePipe.transform(value, args);
  }

}
