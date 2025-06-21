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
    this.isView.set(this.checkPermission("Income & Expense", "View"));
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
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'A4' });
    // const pageSizeWidth = 210;
    // const pageSizeHeight = 297;
    const marginLeft = 10;
    const marginRight = 10;
    const marginTop = (this.header()?.marginTop | 0) + 10;
    const marginBottom = 10;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const centerX = doc.internal.pageSize.getWidth() / 2;
    let yPos = (this.header()?.marginTop | 0) + 10;

    // Header Section
    yPos = this.displayReportHeader(doc, marginTop, centerX);

    // Title Section
    yPos = this.displayReportTitle(doc, yPos, centerX);

    // Render Table with custom column widths
    yPos = this.displayReportTable(doc, yPos, centerX, pageWidth, pageHeight, marginLeft, marginRight, marginBottom);


    // Output PDF
    const pdfOutput = doc.output('blob');
    window.open(URL.createObjectURL(pdfOutput));
  }

  displayReportHeader(doc: jsPDF, yPos: number, centerX: number) {
    if (this.header()) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text(this.header()?.name, centerX, yPos, { align: 'center' });
      yPos += 2;
    }

    // if (this.header()?.address) {
    //   yPos += 3;
    //   doc.setFont('helvetica', 'bold');
    //   doc.setFontSize(12);
    //   doc.text(this.header()?.address, centerX, yPos, { align: 'center' });
    //   yPos += 2;
    // }

    // if (this.header()?.contact) {
    //   yPos += 3;
    //   doc.setFont('helvetica', 'bold');
    //   doc.setFontSize(12);
    //   doc.text(`Contact: ${this.header()?.contact}`, centerX, yPos, { align: 'center' });
    //   yPos += 2;
    // }
    // doc.line(0, yPos, 560, yPos);
    yPos += 5;

    return yPos;
  }

  displayReportTitle(doc: jsPDF, yPos: number, centerX: number): any {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`${this.transactionType() === 'All' ? 'Profit & Loss' : this.transactionType()} Statements`, centerX, yPos, { align: 'center' });
    yPos += 5;

    // Date Range
    doc.setFontSize(10);
    if (this.fromDate()) {
      const dateRange = `From: ${this.transform(this.fromDate())} to: ${this.toDate() ? this.transform(this.toDate()) : this.transform(this.fromDate())}`;
      doc.text(dateRange, centerX, yPos, { align: 'center' });
      yPos += 5;
    }

    return yPos;
  }

  displayReportTable(doc: jsPDF, yPos: number, centerX: number, pageWidth: number, pageHeight: number, marginLeft: number, marginRight: number, marginBottom: number): any {
    // Prepare Table Data
    const incomeDataRows = this.incomeReports()?.map((data: any) => [
      data?.subHead,
      data?.creditAmount || 0,
    ]);
    const expenseDataRows = this.expenseReports()?.map((data: any) => [
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
      fontSize: 11,
    };

    const footStyles = {
      fillColor: [102, 255, 255] as [number, number, number],
      textColor: 0,
      lineWidth: 0.2,
      lineColor: 0,
      fontStyle: 'bold' as const,
      fontSize: 10,
    };

    // Income Section
    if (this.transactionType() !== "Expense") {
      if (this.transactionType() === "All") {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(`Income`, centerX, yPos + 4, { align: 'center' });
        yPos += 5; // Add space after heading
      } else {
        yPos += 4; // Add space for the heading
      }

      autoTable(doc, {
        head: [['Head', "Amount"]],
        body: incomeDataRows,
        foot: [['Total:', this.totalCredit()?.toFixed(0)]],
        theme: 'grid',
        startY: yPos,
        styles: tableStyles,
        headStyles: headStyles,
        footStyles: footStyles,
        margin: { left: marginLeft, right: marginRight },
        columnStyles: {
          0: { cellWidth: 'auto', halign: 'left' }, // Head column
          1: { cellWidth: 40 }      // Amount column
        },
        didDrawPage: (data: any) => {
          doc.setFontSize(8);
          doc.text(``, pageWidth - marginRight - 10, pageHeight - marginBottom, {
            align: 'right',
          });
        },
      });

      yPos = (doc as any).lastAutoTable.finalY + 5;
    }

    // Expense Section
    if (this.transactionType() !== "Income") {
      if (this.transactionType() === "All") {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(`Expense`, centerX, yPos, { align: 'center' });
        yPos += 2; // Add space after heading
      } else {
        yPos += 4; // Add space for the heading
      }

      autoTable(doc, {
        head: [['Head', 'Amount']],
        body: expenseDataRows,
        foot: [['Total:', this.totalDebit()?.toFixed(0)]],
        theme: 'grid',
        startY: yPos,
        styles: tableStyles,
        headStyles: headStyles,
        footStyles: footStyles,
        margin: { left: marginLeft, right: marginRight },
        columnStyles: {
          0: { cellWidth: 'auto', halign: 'left' }, // Head column
          1: { cellWidth: 40 }      // Amount column
        },
        didDrawPage: (data: any) => {
          doc.setFontSize(8);
          doc.text(``, pageWidth - marginRight - 10, pageHeight - marginBottom, {
            align: 'right',
          });
        },
      });

      yPos = (doc as any).lastAutoTable.finalY + 5;
    }

    // Total Balance for All
    if (this.transactionType() === "All") {
      doc.setFontSize(12);
      doc.text(
        `Net Profit (${this.totalCredit()} - ${this.totalDebit()}) = ${this.totalCredit() - this.totalDebit()} Tk`,
        centerX,
        yPos,
        { align: 'center' }
      );
    }


    return yPos;
  }

}
