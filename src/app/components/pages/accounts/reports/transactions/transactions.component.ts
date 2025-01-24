import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AccountListService } from '../../../../../services/account-list.service';
import { VoucherService } from '../../../../../services/voucher.service';
import { Selector2Component } from '../../../../shared/selector2/selector2.component';
import { DataFetchService } from '../../../../../services/useDataFetch';
import { Observable } from 'rxjs';
import { CommonModule, DatePipe } from '@angular/common';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

@Component({
  selector: 'app-transactions',
  imports: [FormsModule, Selector2Component, CommonModule],
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.css'
})
export class TransactionsComponent {
  private accountListService = inject(AccountListService);
  private voucherService = inject(VoucherService);
  private dataFetchService = inject(DataFetchService);
  filteredVoucherList = signal<any[]>([]);
  fromDate = signal<any>(null);
  toDate = signal<any>(null);
  chartOfAccountName = signal<any>(null);
  chartOfAccountId = signal<any>(null);
  chartOfAccountIdOption = signal<any[]>([]);
  transactionType = signal<any>("Receipt");
  transactionTypeOption = signal<any[]>([
    // { id: "Journal", text: "Balance-Sheet" },
    { id: "Receipt", text: "Receipt" },
    { id: "Payment", text: "Payment" },
    // { id: "Contra", text: "Contra" },
  ]);
  totalDebit = signal<any>(0);
  totalCredit = signal<any>(0);

  isLoading$: Observable<any> | undefined;
  hasError$: Observable<any> | undefined;
  marginTop: any = 0;

  ngOnInit() {
    const today = new Date();
    this.fromDate.set(today.toISOString().split('T')[0]);
    this.onLoadVoucher();
  }

  ngAfterViewInit() {
    this.onLoadAccountList();
  }

  onLoadVoucher() {
    const reqData = {
      "id": null,
      "search": "",
      "transactionType": this.transactionType(),
      "fromDate": this.fromDate(),
      "toDate": this.toDate() || this.fromDate(),
      "chartofAccountId": this.chartOfAccountId() === "null" ? null : this.chartOfAccountId(),
      "subChartofAccountId": null
    }
    const { data$, isLoading$, hasError$ } = this.dataFetchService.fetchData(this.voucherService.getVoucherDetails(reqData));

    data$.subscribe(data => {
      this.filteredVoucherList.set(data);
      this.totalDebit.set(data.reduce((acc, curr: any) => acc + curr?.debitAmount, 0));
      this.totalCredit.set(data.reduce((acc, curr: any) => acc + curr?.creditAmount, 0));
    });

    this.isLoading$ = isLoading$;
    this.hasError$ = hasError$;
  }

  onLoadAccountList() {
    const accountGroup = this.transactionType() === "Receipt" ? "Income" : this.transactionType() === "Payment" ? "Expenses" : null;
    this.accountListService.getAccountList({
      "allbyheadId": 1,
      "search": null,
      "coaMap": [],
      "accountGroup": accountGroup ? [accountGroup] : ['Income', 'Expenses']
    }).subscribe(data => {
      const accountGroupId = data.find((a: any) => a.accountGroup === accountGroup)?.id;
      const headIdReq = {
        "headId": accountGroupId || null,
        "allbyheadId": accountGroupId || 1,
        "search": null,
        "coaMap": [],
        "accountGroup": accountGroup ? [accountGroup] : ['Income', 'Expenses']
      }
      this.accountListService.getAccountList(headIdReq).subscribe(data => this.chartOfAccountIdOption.set(data.map((c: any) => ({ id: c.id, text: c.subHead.toLowerCase() }))));
    });
  }

  ontransactionTypeChange() {
    this.onLoadVoucher();
    this.onLoadAccountList();
  }

  onAccountIdSelected(selected: any): void {
    // console.log('Selected :', selected);
    this.chartOfAccountId.set(selected?.id);
    this.chartOfAccountName.set(selected?.text);
    this.onLoadVoucher();
  }


  transform(value: any, args: any = 'dd/MM/yyyy'): any {
    if (!value) return null;
    const datePipe = new DatePipe('en-US');
    return datePipe.transform(value, args);
  }

  onClearFilter() {
    const today = new Date();
    this.fromDate.set(today.toISOString().split('T')[0]);
    this.toDate.set(null);
    this.filteredVoucherList.set([]);
    this.chartOfAccountName.set(null);
    this.chartOfAccountId.set(null);
    this.transactionType.set("Receipt");
    this.onLoadAccountList();
    this.onLoadVoucher();

  }



  generatePDF() {
    const pageSizeWidth = 210;
    const pageSizeHeight = 297;
    const marginLeft = 10;
    const marginRight = 10;
    let marginTop = this.marginTop + 10;
    const marginBottom = 10;

    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'A4' });

    // Adjust margins based on conditions
    if (this.chartOfAccountId()) {
      marginTop += 5;
    }
    if (this.fromDate() || this.toDate()) {
      marginTop += 4;
    }

    // Title and Header Section
    const pageWidth = doc.internal.pageSize.width - marginLeft - marginRight;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`${this.transactionType()} Reports`, pageWidth / 2 + marginLeft, marginTop, { align: 'center' });
    marginTop += 8;

    // Sub-header for doctor name and dates
    doc.setFontSize(10);
    if (this.chartOfAccountName()) {
      doc.text(`Account Name: ${this.chartOfAccountName()?.toUpperCase()}`, pageWidth / 2 + marginLeft, marginTop, { align: 'center' });
      marginTop += 5;
    }
    if (this.fromDate()) {
      const dateRange = `From: ${this.transform(this.fromDate())} to: ${this.toDate() ? this.transform(this.toDate()) : this.transform(this.fromDate())
        }`;
      doc.text(dateRange, pageWidth / 2 + marginLeft, marginTop, { align: 'center' });
      marginTop += 4;
    }

    // Prepare Table Data
    const dataRows = this.filteredVoucherList().map((data: any) => [
      this.transform(data?.voucherDate),
      data?.headName || '',
      data?.subHeadName || '',
      this.transactionType() == "Payment"
        ? data?.debitAmount?.toFixed(0) || 0
        : data?.creditAmount?.toFixed(0) || 0,
      data?.particular || '',
      data?.remarks || '',
    ]);

    // const totalAmount = this.filteredVoucherList().reduce((sum: number, data: any) => sum + (data.amount || 0), 0);
    // const totalDiscount = this.filteredVoucherList().reduce((sum: number, data: any) => sum + (data.discount || 0), 0);

    // Render Table
    (doc as any).autoTable({
      head: [['VoucherDate', 'HeadName', 'SubHeadName', `${this.transactionType() == "Payment" ? "DebitAmount" : "CreditAmount"}`, "Particular", 'Remarks']],
      body: dataRows,
      foot: [
        [
          '', 'Total:', '',
          this.transactionType() == "Payment"
            ? this.totalDebit().toFixed(2)
            : this.totalCredit().toFixed(2),
          '', ''
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
