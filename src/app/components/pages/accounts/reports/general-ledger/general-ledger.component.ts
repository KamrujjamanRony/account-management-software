import { CommonModule, DatePipe } from '@angular/common';
import { Component, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AccountingReportsService } from '../../../../../services/accounting-reports.service';
import { DataFetchService } from '../../../../../services/useDataFetch';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { AccountListService } from '../../../../../services/account-list.service';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { SearchComponent } from "../../../../shared/svg/search/search.component";

@Component({
  selector: 'app-general-ledger',
  imports: [FormsModule, CommonModule, SearchComponent],
  templateUrl: './general-ledger.component.html',
  styleUrl: './general-ledger.component.css'
})
export class GeneralLedgerComponent {
  private accountingReportsService = inject(AccountingReportsService);
  private accountListService = inject(AccountListService);
  private dataFetchService = inject(DataFetchService);
  filteredReports = signal<any[]>([]);
  accountBankCashIdOption = signal<any[]>([]);
  selectedBankCash = signal<any>(null);
  selectedId = signal<any>(39);   // TODO: Cash in hand is set statically
  fromDate = signal<any>(null);
  toDate = signal<any>(null);
  totalDebit = signal<any>(0);
  totalCredit = signal<any>(0);

  isLoading$: Observable<any> | undefined;
  hasError$: Observable<any> | undefined;
  marginTop: any = 0;
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  private searchQuery$ = new BehaviorSubject<string>('');

  ngOnInit() {
    const today = new Date();
    this.fromDate.set(today.toISOString().split('T')[0]);
    this.onLoadFilter();
  }

  // ngAfterViewInit() {
  //   this.onLoadFilter();
  // }

  onLoadFilter() {

    const accountListReq = {
      "headId": null,
      "allbyheadId": 1,
      "search": null,
      "coaMap": ["Cash", "Bank"],
      "accountGroup": []
    }
    this.accountListService.getAccountList(accountListReq).subscribe(data => {
      this.accountBankCashIdOption.set(data.map((c: any) => ({ id: c.id, text: c.subHead.toLowerCase(), coaMap: c?.coaMap })));

      this.onLoadReport();
    });
  }

  onLoadReport() {
    this.selectedBankCash.set(this.accountBankCashIdOption().find((c: any) => c.id == this.selectedId()));
    const reqData = {
      "bankCashChartofAccountId": this.selectedBankCash()?.id || null,
      "fromDate": this.fromDate(),
      "toDate": this.toDate() || this.fromDate()
    }
    const { data$, isLoading$, hasError$ } = this.dataFetchService.fetchData(this.accountingReportsService.generalLedgerApi(reqData));

    this.isLoading$ = isLoading$;
    this.hasError$ = hasError$;
    // Combine the original data stream with the search query to create a filtered list
    combineLatest([
      data$,
      this.searchQuery$
    ]).pipe(
      map(([data, query]) =>
        data.filter((searchData: any) =>
          searchData.headName?.toLowerCase().includes(query) ||
          searchData.voucherNo?.toLowerCase().includes(query)
        )
      )
    ).subscribe(filteredData => {
      this.filteredReports.set(filteredData);
      this.totalDebit.set(filteredData.reduce((acc, curr: any) => acc + curr?.debitAmount, 0));
      this.totalCredit.set(filteredData.reduce((acc, curr: any) => acc + curr?.creditAmount, 0));
    });
  }

  // Method to filter Bank list based on search query
  onSearchBank(event: Event) {
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    this.searchQuery$.next(query);
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
    doc.text(`General Transaction Report`, pageWidth / 2 + marginLeft, marginTop, { align: 'center' });
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
      this.transform(data?.voucherDate) || '',
      data?.voucherNo || '',
      data?.headName || '',
      data?.remarks || '',
      data?.debitAmount || '',
      data?.creditAmount || '',
      data?.balance || 0,
    ]);

    // Render Table
    (doc as any).autoTable({
      head: [['VoucherDate', 'VoucherNo', 'HeadName', 'Remarks', 'DebitAmount', "CreditAmount", "Balance"]],
      body: dataRows,
      foot: [
        [
          '', '', '', '',
          this.totalDebit().toFixed(0),
          this.totalCredit().toFixed(0),
          ''
        ],
      ],
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
