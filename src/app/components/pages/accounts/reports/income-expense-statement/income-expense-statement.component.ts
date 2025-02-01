import { Component, inject, signal } from '@angular/core';
import { AccountingReportsService } from '../../../../../services/accounting-reports.service';
import { DataFetchService } from '../../../../../services/useDataFetch';
import { Observable } from 'rxjs';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

@Component({
  selector: 'app-income-expense-statement',
  imports: [CommonModule, FormsModule],
  templateUrl: './income-expense-statement.component.html',
  styleUrl: './income-expense-statement.component.css'
})
export class IncomeExpenseStatementComponent {
  private accountingReportsService = inject(AccountingReportsService);
  private dataFetchService = inject(DataFetchService);
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
  marginTop: any = 0;

  ngOnInit() {
    const today = new Date();
    this.fromDate.set(today.toISOString().split('T')[0]);
    this.onLoadReport();
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
    let marginTop = this.marginTop + 10;
    const marginBottom = 10;

    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'A4' });

    if (this.fromDate() || this.toDate()) {
      marginTop += 4;
    }

    // Title and Header Section
    const pageWidth = doc.internal.pageSize.width - marginLeft - marginRight;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`${this.transactionType() === 'All' ? 'Income & Expense' : this.transactionType()} Statements`, pageWidth / 2 + marginLeft, marginTop, { align: 'center' });
    marginTop += 8;

    // Sub-header for doctor name and dates
    doc.setFontSize(10);

    if (this.fromDate()) {
      const dateRange = `From: ${this.transform(this.fromDate())} to: ${this.toDate() ? this.transform(this.toDate()) : this.transform(this.fromDate())
        }`;
      doc.text(dateRange, pageWidth / 2 + marginLeft, marginTop, { align: 'center' });
      marginTop += 4;
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





    doc.output('dataurlnewwindow');
  }

}
