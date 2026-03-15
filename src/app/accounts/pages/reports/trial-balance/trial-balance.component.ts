import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AccountingReportsService } from '../../../services/accounting-reports.service';
import { DataFetchService } from '../../../../shared/services/useDataFetch';
import { DataService } from '../../../../shared/services/data.service';
import { AuthService } from '../../../../settings/services/auth.service';

@Component({
  selector: 'app-trial-balance',
  imports: [FormsModule, CommonModule],
  templateUrl: './trial-balance.component.html',
  styleUrl: './trial-balance.component.css'
})
export class TrialBalanceComponent {
  private accountingReportsService = inject(AccountingReportsService);
  private dataFetchService = inject(DataFetchService);
  private dataService = inject(DataService);
  private authService = inject(AuthService);
  isView = signal<boolean>(false);
  filteredReports = signal<any>({
    "currentAsset": [],
    "nonCurrentAsset": [],
    "currentLiability": [],
    "nonCurrentLiability": [],
    "income": [],
    "expense": []
  });
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
    this.isView.set(this.checkPermission("Trial Balance", "View"));
  }

  onLoadReport() {
    const reqData = {
      "unitId": null,
      "subUnitId": null,
      "fromDate": this.fromDate(),
      "toDate": this.toDate() || this.fromDate()
    }
    const { data$, isLoading$, hasError$ } = this.dataFetchService.fetchData(this.accountingReportsService.trialBalanceApi(reqData));

    data$.subscribe(data => {
      this.filteredReports.set(data);
      const totalCurrentAssetDebit = (data as any).currentAsset?.reduce((acc: number, curr: any) => acc + curr?.debitAmount, 0) || 0;
      const totalNonCurrentAssetDebit = (data as any).nonCurrentAsset?.reduce((acc: number, curr: any) => acc + curr?.debitAmount, 0) || 0;
      const totalCurrentLiabilityDebit = (data as any).currentLiability?.reduce((acc: number, curr: any) => acc + curr?.debitAmount, 0) || 0;
      const totalNonCurrentLiabilityDebit = (data as any).nonCurrentLiability?.reduce((acc: number, curr: any) => acc + curr?.debitAmount, 0) || 0;
      const totalIncomeDebit = (data as any).income?.reduce((acc: number, curr: any) => acc + curr?.debitAmount, 0) || 0;
      const totalExpenseDebit = (data as any).expense?.reduce((acc: number, curr: any) => acc + curr?.debitAmount, 0) || 0;

      const totalCurrentAssetCredit = (data as any).currentAsset?.reduce((acc: number, curr: any) => acc + curr?.creditAmount, 0) || 0;
      const totalNonCurrentAssetCredit = (data as any).nonCurrentAsset?.reduce((acc: number, curr: any) => acc + curr?.creditAmount, 0) || 0;
      const totalCurrentLiabilityCredit = (data as any).currentLiability?.reduce((acc: number, curr: any) => acc + curr?.creditAmount, 0) || 0;
      const totalNonCurrentLiabilityCredit = (data as any).nonCurrentLiability?.reduce((acc: number, curr: any) => acc + curr?.creditAmount, 0) || 0;
      const totalIncomeCredit = (data as any).income?.reduce((acc: number, curr: any) => acc + curr?.creditAmount, 0) || 0;
      const totalExpenseCredit = (data as any).expense?.reduce((acc: number, curr: any) => acc + curr?.creditAmount, 0) || 0;

      this.totalDebit.set(totalCurrentAssetDebit + totalNonCurrentAssetDebit + totalCurrentLiabilityDebit + totalNonCurrentLiabilityDebit + totalIncomeDebit + totalExpenseDebit);
      this.totalCredit.set(totalCurrentAssetCredit + totalNonCurrentAssetCredit + totalCurrentLiabilityCredit + totalNonCurrentLiabilityCredit + totalIncomeCredit + totalExpenseCredit);
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
    yPos = this.displayReportHeader(doc, yPos, centerX);
    // Title Section
    yPos = this.displayReportTitle(doc, yPos, centerX);
    // Render Table with custom column widths
    yPos = this.displayReportTable(doc, yPos, pageWidth, pageHeight, marginLeft, marginRight, marginBottom);
    // Option 2: open
    const pdfOutput = doc.output('blob');
    window.open(URL.createObjectURL(pdfOutput));
  }

  displayReportHeader(doc: jsPDF, yPos: number, centerX: number): any {
    if (this.header()) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text(this.header()?.name, centerX, yPos, { align: 'center' });
      yPos += 2;
    }

    if (this.header()?.address) {
      yPos += 3;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(this.header()?.address, centerX, yPos, { align: 'center' });
      yPos += 2;
    }

    if (this.header()?.contact) {
      yPos += 3;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(`Contact: ${this.header()?.contact}`, centerX, yPos, { align: 'center' });
      yPos += 2;
    }
    doc.line(0, yPos, 560, yPos);
    yPos += 5;

    return yPos;
  }

  displayReportTitle(doc: jsPDF, yPos: number, centerX: number): any {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`Trial Balance Reports`, centerX, yPos, { align: 'center' });
    yPos += 5;

    // Sub-header for doctor name and dates
    doc.setFontSize(10);

    if (this.fromDate()) {
      const dateRange = `From: ${this.transform(this.fromDate())} to: ${this.toDate() ? this.transform(this.toDate()) : this.transform(this.fromDate())
        }`;
      doc.text(dateRange, centerX, yPos, { align: 'center' });
    }

    return yPos;
  }

  displayReportTable(doc: jsPDF, yPos: number, pageWidth: number, pageHeight: number, marginLeft: number, marginRight: number, marginBottom: number): any {
    const currentAssetData = this.filteredReports()?.currentAsset || [];
    const currentLiabilityData = this.filteredReports()?.currentLiability || [];
    const expenseData = this.filteredReports()?.expense || [];
    const incomeData = this.filteredReports()?.income || [];
    const nonCurrentAssetData = this.filteredReports()?.nonCurrentAsset || [];
    const nonCurrentLiabilityData = this.filteredReports()?.nonCurrentLiability || [];
    const allDate = currentAssetData.concat(nonCurrentAssetData, currentLiabilityData, nonCurrentLiabilityData, incomeData, expenseData);
    const dataRows = allDate?.map((data: any) => [
      data?.subHead,
      data?.debitAmount || '',
      data?.creditAmount || '',
      data?.balance || '',
    ]);

    // const totalAmount = this.filteredVoucherList().reduce((sum: number, data: any) => sum + (data.amount || 0), 0);
    // const totalDiscount = this.filteredVoucherList().reduce((sum: number, data: any) => sum + (data.discount || 0), 0);

    // Render Table
    autoTable(doc, {
      head: [['Head', 'Debit Amount', "Credit Amount", "Balance"]],
      body: dataRows,
      foot: [
        [
          'Total:',
          this.totalDebit().toFixed(0),
          this.totalCredit().toFixed(0),
          ''
        ],
      ],
      theme: 'grid',
      startY: yPos + 2,
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
      margin: { top: yPos, left: marginLeft, right: marginRight },
      didDrawPage: (data: any) => {
        // Add Footer with Margin Bottom
        doc.setFontSize(8);
        doc.text(``, pageWidth - marginRight - 10, pageHeight - marginBottom, {
          align: 'right',
        });
      },
    });

    return yPos;
  }

}
