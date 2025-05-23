import { Component, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AccountingReportsService } from '../../../services/accounting-reports.service';
import { DataFetchService } from '../../../../shared/services/useDataFetch';
import { DataService } from '../../../../shared/services/data.service';
import { AuthService } from '../../../../settings/services/auth.service';

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
  private authService = inject(AuthService);
  isView = signal<boolean>(false);
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
    this.isView.set(this.checkPermission("Income Expense Statement Reports", "View"));
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


  checkPermission(moduleName: string, permission: string) {
    const modulePermission = this.authService.getUser()?.userMenu?.find((module: any) => module?.menuName?.toLowerCase() === moduleName.toLowerCase());
    if (modulePermission) {
      const permissionValue = modulePermission.permissions.find((perm: any) => perm.toLowerCase() === permission.toLowerCase());
      if (permissionValue) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
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

    // Date Range
    doc.setFontSize(10);
    if (this.fromDate()) {
      const dateRange = `From: ${this.transform(this.fromDate())} to: ${this.toDate() ? this.transform(this.toDate()) : this.transform(this.fromDate())}`;
      doc.text(dateRange, centerX, marginTop, { align: 'center' });
      marginTop += 5;
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

    // Common table styles
    const tableStyles = {
      textColor: 0,
      cellPadding: 2,
      lineColor: 0,
      fontSize: 8,
      valign: 'middle' as const,
      halign: 'center' as const,
    };

    const headStyles = {
      fillColor: [102, 255, 102] as [number, number, number],
      textColor: 0,
      lineWidth: 0.2,
      lineColor: 0,
      fontStyle: 'bold' as const,
    };

    const footStyles = {
      fillColor: [102, 255, 255] as [number, number, number],
      textColor: 0,
      lineWidth: 0.2,
      lineColor: 0,
      fontStyle: 'bold' as const,
    };

    // Income Section
    if (this.transactionType() !== "Expense") {
      if (this.transactionType() === "All") {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(`Income`, centerX, marginTop + 4, { align: 'center' });
        marginTop += 5; // Add space after heading
      } else {
        marginTop += 4; // Add space for the heading
      }

      autoTable(doc, {
        head: [['Head', "Amount"]],
        body: incomeDataRows,
        foot: [['Total:', this.totalCredit().toFixed(0)]],
        theme: 'grid',
        startY: marginTop,
        styles: tableStyles,
        headStyles: headStyles,
        footStyles: footStyles,
        margin: { left: marginLeft, right: marginRight },
        columnStyles: {
          0: { cellWidth: 'auto' }, // Head column
          1: { cellWidth: 30 }      // Amount column
        },
        didDrawPage: (data: any) => {
          doc.setFontSize(8);
          doc.text(``, pageSizeWidth - marginRight - 10, pageSizeHeight - marginBottom, {
            align: 'right',
          });
        },
      });

      marginTop = (doc as any).lastAutoTable.finalY + 5;
    }

    // Expense Section
    if (this.transactionType() !== "Income") {
      if (this.transactionType() === "All") {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(`Expense`, centerX, marginTop, { align: 'center' });
        marginTop += 2; // Add space after heading
      } else {
        marginTop += 4; // Add space for the heading
      }

      autoTable(doc, {
        head: [['Head', 'Amount']],
        body: expenseDataRows,
        foot: [['Total:', this.totalDebit().toFixed(0)]],
        theme: 'grid',
        startY: marginTop,
        styles: tableStyles,
        headStyles: headStyles,
        footStyles: footStyles,
        margin: { left: marginLeft, right: marginRight },
        columnStyles: {
          0: { cellWidth: 'auto' }, // Head column
          1: { cellWidth: 30 }      // Amount column
        },
        didDrawPage: (data: any) => {
          doc.setFontSize(8);
          doc.text(``, pageSizeWidth - marginRight - 10, pageSizeHeight - marginBottom, {
            align: 'right',
          });
        },
      });

      marginTop = (doc as any).lastAutoTable.finalY + 5;
    }

    // Total Balance for All
    if (this.transactionType() === "All") {
      doc.setFontSize(10);
      doc.text(
        `Total Balance (${this.totalCredit()} - ${this.totalDebit()}) = ${this.totalCredit() - this.totalDebit()} Tk`,
        centerX,
        marginTop,
        { align: 'center' }
      );
    }

    // Output PDF
    const pdfOutput = doc.output('blob');
    window.open(URL.createObjectURL(pdfOutput));
  }

}
