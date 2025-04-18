import { Component, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { AccountingReportsService } from '../../../services/accounting-reports.service';
import { DataFetchService } from '../../../../shared/services/useDataFetch';
import { DataService } from '../../../../shared/services/data.service';

@Component({
  selector: 'app-income-expense-statement',
  imports: [CommonModule, FormsModule],
  templateUrl: './income-expense-statement.component.html',
  styleUrl: './income-expense-statement.component.css'
})
export class IncomeExpenseStatementComponent {
  private accountingReportsService = inject(AccountingReportsService);
  private dataFetchService = inject(DataFetchService);
  private dataService = inject(DataService);
  incomeReports = signal<any>([]);
  expenseReports = signal<any>([]);
  transactionType = signal<any>("All");
  transactionTypeOptions = signal<any>(["All", "Income", "Expense"]);
  fromDate = signal<any>(null);
  toDate = signal<any>(null);
  totalDebit = signal<any>(0);
  totalCredit = signal<any>(0);

  isLoading$: Observable<any> | undefined;
  hasError$: Observable<any> | undefined;
  header = signal<any>(null);

  ngOnInit() {
    const today = new Date();
    this.fromDate.set(today.toISOString().split('T')[0]);
    this.onLoadReport();
    this.dataService.getHeader().subscribe(data => this.header.set(data));
  }

  onLoadReport() {
    const reqData = {
      "unitId": null,
      "subUnitId": null,
      "fromDate": this.fromDate(),
      "toDate": this.toDate() || this.fromDate()
    }
    const { data$, isLoading$, hasError$ } = this.dataFetchService.fetchData(this.accountingReportsService.trialBalanceApi(reqData));

    data$.subscribe((data: any) => {
      this.incomeReports.set(data?.income);
      this.expenseReports.set(data?.expense);

      this.totalDebit.set(data.expense?.reduce((acc: number, curr: any) => acc + curr?.debitAmount, 0));
      this.totalCredit.set(data.income?.reduce((acc: number, curr: any) => acc + curr?.creditAmount, 0));
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
    doc.text(`${this.transactionType() === 'All' ? 'Income & Expense' : this.transactionType()} Statements`, centerX, marginTop, { align: 'center' });
    marginTop += 5;

    // Sub-header for doctor name and dates
    doc.setFontSize(10);

    if (this.fromDate()) {
      const dateRange = `From: ${this.transform(this.fromDate())} to: ${this.toDate() ? this.transform(this.toDate()) : this.transform(this.fromDate())
        }`;
      doc.text(dateRange, centerX, marginTop, { align: 'center' });
    }

    // Prepare Table Data
    const incomeDataRows = this.incomeReports().map((data: any) => [
      data?.subHead,
      data?.creditAmount || 0,
    ]);
    const expenseDataRows = this.expenseReports().map((data: any) => [
      data?.subHead,
      data?.debitAmount || 0,
    ]);

    if (this.transactionType() === "All" || this.transactionType() === "Income") {
      if (this.transactionType() === "All") {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(
          `Income`,
          105,
          marginTop += 4,
          { align: 'center' }
        );
      }

      // Render Income Table
      (doc as any).autoTable({
        head: [['Head', "Amount"]],
        body: incomeDataRows,
        foot: [
          [
            'Total:',
            this.totalCredit().toFixed(0)
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
    }

    if (this.transactionType() === "All" || this.transactionType() === "Expense") {
      marginTop = (this.transactionType() === "Expense" ? marginTop - 7 : (doc as any).lastAutoTable.finalY) + 5;
      if (this.transactionType() === "All") {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(
          `Expense`,
          105,
          marginTop,
          { align: 'center' }
        );
      }
      // Render Expense Table
      (doc as any).autoTable({
        head: [['Head', 'Amount']],
        body: expenseDataRows,
        foot: [
          [
            'Total:',
            this.totalDebit().toFixed(0)
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



      if (this.transactionType() === "All") {
        const finalY = (doc as any).lastAutoTable.finalY + 5;
        doc.setFontSize(10);
        doc.text(
          `Total Balance (${this.totalCredit()} - ${this.totalDebit()}) = ${this.totalCredit() - this.totalDebit()} Tk`,
          105,
          finalY,
          { align: 'center' }
        );
      }
    }







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
