import { CommonModule, DatePipe } from '@angular/common';
import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { SearchComponent } from "../../../../shared/components/svg/search/search.component";
import { AccountingReportsService } from '../../../services/accounting-reports.service';
import { AccountListService } from '../../../services/account-list.service';
import { DataFetchService } from '../../../../shared/services/useDataFetch';
import { DataService } from '../../../../shared/services/data.service';

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
  private dataService = inject(DataService);
  filteredReports = signal<any[]>([]);
  accountBankCashIdOption = signal<any[]>([]);
  selectedBankCash = signal<any>(null);
  selectedId = signal<any>(null);
  fromDate = signal<any>(null);
  toDate = signal<any>(null);
  totalDebit = signal<any>(0);
  totalCredit = signal<any>(0);

  isLoading$: Observable<any> | undefined;
  hasError$: Observable<any> | undefined;
  header = signal<any>(null);
  readonly searchInput = viewChild.required<ElementRef<HTMLInputElement>>('searchInput');

  private searchQuery$ = new BehaviorSubject<string>('');

  ngOnInit() {
    const today = new Date();
    this.fromDate.set(today.toISOString().split('T')[0]);
    this.onLoadFilter();
    this.dataService.getHeader().subscribe(data => this.header.set(data));
  }

  // ngAfterViewInit() {
  //   this.onLoadFilter();
  // }

  onLoadFilter() {
    this.accountingReportsService.getCurrentBalanceApi({}).subscribe(data => {
      this.accountBankCashIdOption.set(data.map((c: any) => ({ id: c.headId, text: c.subHead })));
      if (this.accountBankCashIdOption()?.length > 0) {
        this.selectedId.set(this.accountBankCashIdOption()[0]?.id);
      }
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
    doc.text(`General Transaction Report`, centerX, marginTop, { align: 'center' });
    marginTop += 5;

    // Sub-header for doctor name and dates
    doc.setFontSize(10);

    if (this.fromDate()) {
      const dateRange = `From: ${this.transform(this.fromDate())} to: ${this.toDate() ? this.transform(this.toDate()) : this.transform(this.fromDate())
        }`;
      doc.text(dateRange, centerX, marginTop, { align: 'center' });
    }

    // Prepare Table Data
    const dataRows = this.filteredReports().map((data: any) => [
      this.transform(data?.voucherDate) || '',
      data?.voucherNo || '',
      data?.headName || '',
      data?.debitAmount || '',
      data?.creditAmount || '',
      data?.balance || 0,
      data?.remarks || '',
    ]);

    // Render Table with custom column widths
    (doc as any).autoTable({
      head: [['VoucherDate', 'VoucherNo', 'HeadName', 'DebitAmount', "CreditAmount", "Balance", 'Remarks']],
      body: dataRows,
      foot: [
        [
          '', '', 'Total:',
          this.totalDebit().toFixed(0),
          this.totalCredit().toFixed(0),
          '', ''
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
      columnStyles: {
        0: { cellWidth: 20 }, // VoucherDate
        1: { cellWidth: 20 }, // VoucherNo
        2: { cellWidth: 40 }, // HeadName
        3: { cellWidth: 20 }, // DebitAmount
        4: { cellWidth: 20 }, // CreditAmount
        5: { cellWidth: 20 }, // Balance
        6: { cellWidth: 30 }  // Remarks
      },
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
