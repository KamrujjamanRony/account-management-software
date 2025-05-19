import { Component, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApexChartComponent } from '../../components/apex-chart/apex-chart.component';
import { AccountingReportsService } from '../../services/accounting-reports.service';
import { DataFetchService } from '../../../shared/services/useDataFetch';
import { DataService } from '../../../shared/services/data.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// autoTable(doc, {

@Component({
  selector: 'app-account-dashboard',
  imports: [CommonModule, FormsModule, ApexChartComponent],
  templateUrl: './account-dashboard.component.html',
  styleUrl: './account-dashboard.component.css'
})
export class AccountDashboardComponent {
  private accountingReportsService = inject(AccountingReportsService);
  private dataFetchService = inject(DataFetchService);
  private dataService = inject(DataService);
  filteredReports = signal<any>({
    "totalBalanceResult": [],
    "totalCurrentBalanceResult": [],
    "datewiseIncomeExpenceResult": {},
    "monthwiseIncomeExpenceResult": [],
  });
  fromDate = signal<any>(null);
  header = signal<any>(null);
  totalMonth = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  isLoading$: Observable<any> | undefined;
  hasError$: Observable<any> | undefined;

  ngOnInit() {
    const today = new Date();
    this.fromDate.set(today.toISOString().split('T')[0]);
    this.onLoadReport();
    this.dataService.getHeader().subscribe(data => this.header.set(data));
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
    });

    this.isLoading$ = isLoading$;
    this.hasError$ = hasError$;
  }


  transform(value: any, args: any = 'dd/MM/yyyy'): any {
    if (!value) return null;
    const datePipe = new DatePipe('en-US');
    return datePipe.transform(value, args);
  }

  generatePDF() {
    const pageSizeWidth = 210;
    const pageSizeHeight = 297;
    const marginLeft = 10;
    const marginRight = 10;
    let marginTop = (this.header()?.marginTop | 0) + 10;
    const marginBottom = 10;

    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'A4' });

    // Title and Header Section
    // Get the exact center of the page (considering margins)
    const centerX = doc.internal.pageSize.getWidth() / 2;

    // Header Section
    if (this.header()) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text(this.header()?.name, centerX, marginTop, { align: 'center' });
      marginTop += 5;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(this.header()?.address, centerX, marginTop, { align: 'center' });
      marginTop += 5;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(`Contact: ${this.header()?.contact}`, centerX, marginTop, { align: 'center' });
      marginTop += 2;
      doc.line(0, marginTop, 560, marginTop);
      marginTop += 7;
    }

    // Title Section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`Profit Loss Report`, centerX, marginTop, { align: 'center' });

    marginTop += 5;

    // Sub-header for doctor name and dates
    doc.setFontSize(10);

    if (this.fromDate()) {
      const dateRange = `Year: ${this.fromDate().split("-")[0]}`;
      doc.text(dateRange, centerX, marginTop, { align: 'center' });
    }

    // Prepare Table Data
    const dataRows = this.filteredReports().monthwiseIncomeExpenceResult.map((data: any) => [
      this.totalMonth[data?.month - 1] || '',
      data?.totalIncome || 0,
      data?.totalExpense || 0,
      data?.profit || 0,
    ]);

    // Render Table
    autoTable(doc, {
      head: [['Month', 'Receipt', 'Payment', 'Balance']],
      body: dataRows,
      foot: [
        [
          'Total:',
          this.filteredReports().totalReceipt.toFixed(0),
          this.filteredReports().totalPayment.toFixed(0),
          this.filteredReports().totalBalance.toFixed(0),
        ],
      ],
      theme: 'grid',
      startY: marginTop + 2,
      styles: {
        textColor: 0,
        cellPadding: 2,
        lineColor: 0,
        fontSize: 8,
        valign: 'middle',
        halign: 'center',
      },
      headStyles: {
        fillColor: [102, 255, 102],
        textColor: 0,
        lineWidth: 0.2,
        lineColor: 0,
        fontStyle: 'bold',
      },
      footStyles: {
        fillColor: [102, 255, 255],
        textColor: 0,
        lineWidth: 0.2,
        lineColor: 0,
        fontStyle: 'bold',
      },
      margin: { top: marginTop, left: marginLeft, right: marginRight },
      didDrawPage: (data: any) => {
        // Add Footer with Margin Bottom
        doc.setFontSize(8);
        doc.text(``, pageSizeWidth - marginRight - 10, pageSizeHeight - marginBottom, {
          align: 'right',
        });
      },
    });



    // // Option 1: save
    // const fileName = `Transaction_Report_${this.transform(this.fromDate())}` +
    //   (this.toDate() ? `_to_${this.transform(this.toDate())}` : '') + '.pdf';
    // doc.save(fileName);

    // Option 2: open
    const pdfOutput = doc.output('blob');
    window.open(URL.createObjectURL(pdfOutput));


    // // Option 3: open
    // const pdfDataUri = doc.output('datauristring');
    // const newWindow = window.open();
    // if (newWindow) {
    //   newWindow.document.write(`<iframe width='100%' height='100%' src='${pdfDataUri}'></iframe>`);
    // } else {
    //   console.error('Failed to open a new window.');
    // }

    // // Option 4: open
    //   var string = doc.output('datauristring');
    //   var iframe = "<iframe width='100%' height='100%' src='" + string + "'></iframe>"
    //   var x = window.open();
    //   if (x) {
    //     x.document.open();
    //     x.document.write(iframe);
    //     x.document.close();
    //   } else {
    //     console.error('Failed to open a new window.');
    //   }
  }

}
