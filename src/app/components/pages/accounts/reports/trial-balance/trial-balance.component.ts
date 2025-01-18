import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AccountingReportsService } from '../../../../../services/accounting-reports.service';
import { Observable } from 'rxjs';
import { DataFetchService } from '../../../../../services/useDataFetch';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

@Component({
  selector: 'app-trial-balance',
  imports: [FormsModule, CommonModule],
  templateUrl: './trial-balance.component.html',
  styleUrl: './trial-balance.component.css'
})
export class TrialBalanceComponent {
  private accountingReportsService = inject(AccountingReportsService);
  private dataFetchService = inject(DataFetchService);
  filteredReports = signal<any[]>([]);
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

    data$.subscribe(data => {
      this.filteredReports.set(data);
      this.totalDebit.set(data.reduce((acc, curr: any) => acc + curr?.debitAmount, 0));
      this.totalCredit.set(data.reduce((acc, curr: any) => acc + curr?.creditAmount, 0));
      console.log(data)
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
    doc.text(`Trial Balance Reports`, pageWidth / 2 + marginLeft, marginTop, { align: 'center' });
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
    const dataRows = this.filteredReports().map((data: any) => [
      data?.subHead,
      data?.subSubHead || '',
      data?.debitAmount || '',
      data?.creditAmount || '',
      data?.balance || '',
    ]);

    // const totalAmount = this.filteredVoucherList().reduce((sum: number, data: any) => sum + (data.amount || 0), 0);
    // const totalDiscount = this.filteredVoucherList().reduce((sum: number, data: any) => sum + (data.discount || 0), 0);

    // Render Table
    (doc as any).autoTable({
      head: [['Head', 'SubHead', 'DebitAmount', "CreditAmount", "Balance"]],
      body: dataRows,
      // foot: [
      //   [
      //     '', '', '', '', '',
      //     totalAmount.toFixed(0),
      //     totalDiscount.toFixed(0),
      //     '', ''
      //   ],
      // ],
      theme: 'grid',
      startY: marginTop + 5,
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
      //     foot: [
      //       [
      //         '',
      //         '',
      //         totalDebit.toFixed(0),
      //         totalCredit.toFixed(0),
      //         '',
      //       ],
      //     ],
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



    // const finalY = (doc as any).lastAutoTable.finalY + 5;
    // doc.setFontSize(10);
    // doc.text(
    //   `Total Collection (${totalAmount} - ${totalDiscount}) = ${totalAmount - totalDiscount} Tk`,
    //   105,
    //   finalY,
    //   { align: 'center' }
    // );

    doc.output('dataurlnewwindow');
  }

}
