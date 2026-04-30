import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, inject, signal, viewChildren } from '@angular/core';
import { FieldComponent } from '../../../../shared/components/field/field.component';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SelectorComponent } from '../../../components/selector/selector.component';
import { AccountListService } from '../../../services/account-list.service';
import { VendorService } from '../../../services/vendor.service';
import { VoucherService } from '../../../services/voucher.service';
import { AccountingReportsService } from '../../../services/accounting-reports.service';
import { DataFetchService } from '../../../../shared/services/useDataFetch';
import { DataService } from '../../../../shared/services/data.service';
import { ToastService } from '../../../../shared/components/primeng/toast/toast.service';
import { AuthService } from '../../../../settings/services/auth.service';

@Component({
  selector: 'app-journal-voucher',
  imports: [CommonModule, FieldComponent, ReactiveFormsModule, FormsModule, SelectorComponent],
  templateUrl: './journal-voucher.component.html',
  styleUrl: './journal-voucher.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JournalVoucherComponent {
  fb = inject(FormBuilder);
  private accountListService = inject(AccountListService);
  private vendorService = inject(VendorService);
  private voucherService = inject(VoucherService);
  private accountingReportsService = inject(AccountingReportsService);
  private dataFetchService = inject(DataFetchService);
  private dataService = inject(DataService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  isView = signal<boolean>(false);
  isInsert = signal<boolean>(false);
  isEdit = signal<boolean>(false);
  isDelete = signal<boolean>(false);
  showList = signal<boolean>(true);
  highlightedTr: number = -1;
  selectedVoucher: any;
  transactionTypeOption = [
    { id: 'BalanceSheet', text: 'Balance-Sheet' },
    { id: 'Contra', text: 'Contra' },
  ];
  filteredVoucherList = signal<any[]>([]);
  accountBankCashIdOption = signal<any[]>([]);
  vendorIdOption = signal<any[]>([]);
  headIdOption = signal<any[]>([]);
  chartGroupOption = signal<any[]>([]);
  allOption = signal<any[]>([]);
  fromDate = signal<any>('');
  toDate = signal<any>('');
  totalAmount = signal<any>(0);
  transactionType = signal<any>('BalanceSheet');
  isSubmitting = signal<boolean>(false);
  date: any = new Date();
  todayDate: any;
  subHeadOptionsByIndex = signal<Record<number, { id: any; text: string }[]>>({});
  header = signal<any>(null);

  isLoading$: Observable<any> | undefined;
  hasError$: Observable<any> | undefined;
  readonly inputRefs = viewChildren<ElementRef>('inputRef');
  isSubmitted = false;

  // Initial Data Fetched ----------------------------------------------------------------

  ngOnInit() {
    const today = new Date();
    this.todayDate = today.toISOString().split('T')[0];
    this.fromDate.set(today.toISOString().split('T')[0]);
    this.form.patchValue({
      voucherDate: today.toISOString().split('T')[0],
    });

    this.transactionType.set(this.form.value.transactionType);
    this.onLoadVoucher();
    this.accountListService.getAccountList({ allbyheadId: 1 }).subscribe(data =>
      this.allOption.set(data.map((c: any) => ({ id: c.id, text: c.subHead.toLowerCase() })))
    );
    setTimeout(() => this.focusFirstInput(), 10);
    this.dataService.getHeader().subscribe(data => this.header.set(data));
    this.isView.set(this.checkPermission('Journal/Contra Voucher', 'View'));
    this.isInsert.set(this.checkPermission('Journal/Contra Voucher', 'Insert'));
    this.isEdit.set(this.checkPermission('Journal/Contra Voucher', 'Edit'));
    this.isDelete.set(this.checkPermission('Journal/Contra Voucher', 'Delete'));
  }

  ngAfterViewInit() {
    this.onLoadJournal();
  }

  onLoadVoucher() {
    const reqData = {
      search: '',
      transactionType: this.transactionType(),
      fromDate: this.fromDate(),
      toDate: this.toDate() || this.fromDate(),
    };
    const { data$, isLoading$, hasError$ } = this.dataFetchService.fetchData(
      this.voucherService.getVoucher(reqData)
    );

    data$.subscribe(data => {
      this.filteredVoucherList.set(data);
      this.totalAmount.set(data.reduce((acc, curr: any) => acc + curr?.amount, 0));
    });

    this.isLoading$ = isLoading$;
    this.hasError$ = hasError$;
  }

  onLoadJournal() {
    this.accountListService
      .getAccountList({
        allbyheadId: 1,
        search: null,
        coaMap: [],
        accountGroup: [
          'Current Asset',
          'NonCurrent/Fixed Asset',
          'Current Liability',
          'NonCurrent Liability',
          'Equity',
        ],
      })
      .subscribe(data =>
        this.headIdOption.set(data.map((c: any) => ({ id: c.id, text: c.subHead.toLowerCase() })))
      );
    this.vendorService
      .getVendor('')
      .subscribe(data =>
        this.vendorIdOption.set(data.map((c: any) => ({ id: c.id, text: c.name.toLowerCase() })))
      );
    this.accountingReportsService
      .getCurrentBalanceApi({})
      .subscribe(data =>
        this.accountBankCashIdOption.set(
          data.map((c: any) => ({ id: c.headId, text: c.subHead }))
        )
      );
  }

  onTransactionTypeChange() {
    this.transactionType.set(this.form.value.transactionType);
    this.onLoadVoucher();
    this.onLoadJournal();
  }

  checkPermission(moduleName: string, permission: string) {
    const modulePermission = this.authService
      .getUser()
      ?.userMenu?.find((module: any) => module?.menuName?.toLowerCase() === moduleName.toLowerCase());
    if (modulePermission) {
      const permissionValue = modulePermission.permissions.find(
        (perm: any) => perm.toLowerCase() === permission.toLowerCase()
      );
      return !!permissionValue;
    }
    return false;
  }

  // Form Field ----------------------------------------------------------------

  form = this.fb.group({
    transactionType: [{ value: 'BalanceSheet', disabled: false }, Validators.required],
    voucherDate: ['', Validators.required],
    voucherNo: [''],
    vendorId: [''],
    payTo: [''],
    amount: [''],
    remarks: [''],
    coaMap: [''],
    receiveFrom: [''],
    particular: [''],
    postBy: [this.authService.getUser()?.username || ''],
    voucherDetails: this.fb.array<FormGroup>([]),
  });

  get voucherDetailsArray(): FormArray<FormGroup> {
    return this.form.get('voucherDetails') as FormArray<FormGroup>;
  }

  createLine(initial?: any): FormGroup {
    return this.fb.group({
      id: [initial?.id ?? ''],
      voucherId: [initial?.voucherId ?? ''],
      headId: [initial?.headId ?? '', Validators.required],
      subHeadId: [initial?.subHeadId ?? ''],
      debitAmount: [initial?.debitAmount ?? null],
      creditAmount: [initial?.creditAmount ?? null],
      remarks: [initial?.remarks ?? ''],
    });
  }

  addLine(): void {
    this.voucherDetailsArray.push(this.createLine());
  }

  removeLine(index: number): void {
    this.voucherDetailsArray.removeAt(index);
    const map = { ...this.subHeadOptionsByIndex() };
    delete map[index];
    const reindexed: Record<number, { id: any; text: string }[]> = {};
    Object.keys(map)
      .map(k => Number(k))
      .sort((a, b) => a - b)
      .forEach((k, i) => {
        reindexed[i] = map[k];
      });
    this.subHeadOptionsByIndex.set(reindexed);
  }

  subHeadOptionsAt(index: number): { id: any; text: string }[] {
    return this.subHeadOptionsByIndex()[index] ?? [];
  }

  onLineHeadSelected(index: number, selected: any): void {
    const group = this.voucherDetailsArray.at(index);
    group.patchValue({ headId: selected?.id ?? '', subHeadId: '' });
    if (!selected?.id) {
      const map = { ...this.subHeadOptionsByIndex() };
      map[index] = [];
      this.subHeadOptionsByIndex.set(map);
      return;
    }
    this.accountListService
      .getAccountList({ headId: selected.id, allbyheadId: selected.id })
      .subscribe(data => {
        const opts = data.map((c: any) => ({ id: c.id, text: c.subHead.toLowerCase() }));
        const map = { ...this.subHeadOptionsByIndex() };
        map[index] = opts;
        this.subHeadOptionsByIndex.set(map);
      });
  }

  get totalDebitAmount(): number {
    return this.voucherDetailsArray.controls.reduce(
      (sum, ctrl) => sum + (Number(ctrl.value.debitAmount) || 0),
      0
    );
  }

  get totalCreditAmount(): number {
    return this.voucherDetailsArray.controls.reduce(
      (sum, ctrl) => sum + (Number(ctrl.value.creditAmount) || 0),
      0
    );
  }

  get isBalanced(): boolean {
    return this.totalDebitAmount > 0 && this.totalDebitAmount === this.totalCreditAmount;
  }

  // Simplified method to get form controls
  getControl(controlName: string): FormControl {
    return this.form.get(controlName) as FormControl;
  }

  onSubmit(e: Event) {
    if (this.totalCreditAmount !== this.totalDebitAmount || this.totalDebitAmount === 0) {
      this.toastService.showMessage('warn', 'Warning', 'Debit and Credit Amount Must be Equal!');
      return;
    }
    // Validate each line has either a positive debit OR credit (not both, not neither).
    const lines = this.voucherDetailsArray.value as any[];
    for (const line of lines) {
      const debit = Number(line.debitAmount) || 0;
      const credit = Number(line.creditAmount) || 0;
      if (!line.headId) {
        this.toastService.showMessage('warn', 'Warning', 'Each line must have a Head selected.');
        return;
      }
      if ((debit > 0 && credit > 0) || (debit === 0 && credit === 0)) {
        this.toastService.showMessage(
          'warn',
          'Warning',
          'Each line must have either a Debit or Credit amount (not both, not neither).'
        );
        return;
      }
    }

    this.isSubmitted = true;
    if (this.form.valid && lines.length > 0) {
      this.isSubmitting.set(true);
      this.form.get('transactionType')?.enable();
      const { voucherDetails: _omit, ...restData } = this.form.value as any;
      const voucherFormData = {
        ...restData,
        vendorId: restData.vendorId ? Number(restData.vendorId) : null,
        amount: this.totalDebitAmount,
      };
      const normalizedLines = lines.map((data: any) => ({
        id: data.id || undefined,
        voucherId: data.voucherId || undefined,
        headId: Number(data.headId),
        subHeadId: data.subHeadId ? Number(data.subHeadId) : null,
        debitAmount: data.debitAmount ? Number(data.debitAmount) : 0,
        creditAmount: data.creditAmount ? Number(data.creditAmount) : 0,
        remarks: data.remarks || ' ',
      }));
      if (this.selectedVoucher) {
        const editData = { ...voucherFormData, editVoucherDetailDto: normalizedLines };
        this.voucherService.updateVoucher(this.selectedVoucher.id, editData).subscribe({
          next: response => {
            if (response !== null && response !== undefined) {
              this.toastService.showMessage('success', 'Successful', 'Voucher successfully updated!');
              const rest = this.filteredVoucherList().filter(d => d.id !== response.id);
              this.filteredVoucherList.set([...rest, response]);
              this.isSubmitted = false;
              this.selectedVoucher = null;
              this.resetForm(e);
              this.showList.set(true);
              this.isSubmitting.set(false);
            }
          },
          error: error => {
            console.error('Error update:', error);
            this.toastService.showMessage(
              'error',
              'Error',
              `${error.error.status} : ${error.error.message || error.error.title}`
            );
            this.isSubmitting.set(false);
          },
        });
      } else {
        const remarks = normalizedLines.map(data =>
          data.subHeadId ? this.displayHead(data.subHeadId) : this.displayHead(data.headId)
        );
        const createVoucherDetailDto = normalizedLines.map(({ id: _i, voucherId: _v, ...rest }) => rest);
        const addData = { ...voucherFormData, particular: remarks.join(','), createVoucherDetailDto };
        this.voucherService.addVoucher(addData).subscribe({
          next: response => {
            if (response !== null && response !== undefined) {
              this.toastService.showMessage('success', 'Successful', 'Voucher successfully added!');
              this.filteredVoucherList.set([...this.filteredVoucherList(), response]);
              this.isSubmitted = false;
              this.resetForm(e);
              this.showList.set(true);
              this.isSubmitting.set(false);
            }
          },
          error: error => {
            if (error.error.message || error.error.title) {
              this.toastService.showMessage(
                'error',
                'Error',
                `${error.error.status} : ${error.error.message || error.error.title}`
              );
            }
            console.error('Error add:', error);
            this.isSubmitting.set(false);
          },
        });
      }
    } else {
      this.toastService.showMessage(
        'warn',
        'Warning',
        'Form is invalid! Please Fill All Requirement Field.'
      );
    }
  }

  onDelete(id: any) {
    if (confirm('Are you sure you want to delete?')) {
      this.voucherService.deleteVoucher(id).subscribe(data => {
        if (data.id) {
          this.toastService.showMessage('success', 'Successful', 'Voucher deleted successfully!');
          this.filteredVoucherList.set(this.filteredVoucherList().filter(d => d.id !== id));
        } else {
          console.error('Error deleting Voucher:', data);
          this.toastService.showMessage(
            'error',
            'Error',
            `Error deleting Voucher : ${data.message}`
          );
        }
      });
    }
  }

  resetForm(e?: Event) {
    e?.preventDefault();
    this.voucherDetailsArray.clear();
    this.subHeadOptionsByIndex.set({});
    this.form.patchValue({
      voucherDate: '',
      voucherNo: '',
      vendorId: '',
      payTo: '',
      amount: '',
      remarks: '',
      coaMap: '',
      receiveFrom: '',
      particular: '',
    });
    const today = new Date();
    this.form.patchValue({
      voucherDate: today.toISOString().split('T')[0],
      postBy: this.authService.getUser()?.username || '',
    });
    this.selectedVoucher = null;
    this.isSubmitted = false;
    this.form.get('transactionType')?.enable();
  }

  onToggleList() {
    this.showList.update(s => !s);
    if (this.showList()) {
      this.resetForm();
    }
  }

  onUpdate(id: any) {
    const reqData = {
      id: id,
      search: '',
      transactionType: null,
      fromDate: null,
      toDate: null,
    };
    this.voucherService.getVoucher(reqData).subscribe((data: any) => {
      if (data.length > 0) {
        this.form.get('transactionType')?.enable();
        this.form.patchValue({
          transactionType: data[0]?.transactionType,
          coaMap: data[0]?.coaMap,
          voucherDate: data[0]?.voucherDate.split('T')[0],
          vendorId: data[0]?.vendorId,
          receiveFrom: data[0]?.receiveFrom,
          payTo: data[0]?.payTo,
          amount: data[0]?.amount,
          particular: data[0]?.particular,
          voucherNo: data[0]?.voucherNo,
          remarks: data[0]?.remarks,
          postBy: data?.postBy,
        });
        this.selectedVoucher = data[0];

        const editDetails =
          this.transactionType() === 'BalanceSheet' || this.transactionType() === 'Contra'
            ? data[0].voucherDetailDto
            : data[0].voucherDetailDto.slice(0, data[0].voucherDetailDto.length - 1);

        this.voucherDetailsArray.clear();
        this.subHeadOptionsByIndex.set({});
        editDetails.forEach((line: any, i: number) => {
          this.voucherDetailsArray.push(this.createLine(line));
          if (line?.headId) {
            this.accountListService
              .getAccountList({ headId: line.headId, allbyheadId: line.headId })
              .subscribe(d => {
                const opts = d.map((c: any) => ({ id: c.id, text: c.subHead.toLowerCase() }));
                const map = { ...this.subHeadOptionsByIndex() };
                map[i] = opts;
                this.subHeadOptionsByIndex.set(map);
              });
          }
        });

        this.form.get('transactionType')?.disable();
      }
    });

    setTimeout(() => {
      const inputs = this.inputRefs();
      inputs[0]?.nativeElement.focus();
    }, 0);
    this.showList.set(false);
  }

  // Utility methods----------------------------------------------------------------------

  focusFirstInput() {
    const inputs = this.inputRefs();
    if (inputs.length) {
      inputs[0].nativeElement.focus();
    }
  }

  displayHead(id: any) {
    return this.allOption().find((option: any) => option.id == id)?.text ?? '';
  }

  handleEnterKey(event: Event, currentIndex: number) {
    event.preventDefault();
    const inputs = this.inputRefs();
    if (currentIndex + 1 < inputs.length) {
      inputs[currentIndex + 1].nativeElement.focus();
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

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`${this.transactionType()} Reports`, centerX, marginTop, { align: 'center' });
    marginTop += 5;

    doc.setFontSize(10);
    if (this.fromDate()) {
      const dateRange = `From: ${this.transform(this.fromDate())} to: ${this.toDate() ? this.transform(this.toDate()) : this.transform(this.fromDate())
        }`;
      doc.text(dateRange, centerX, marginTop, { align: 'center' });
    }

    const dataRows = this.filteredVoucherList().map((data: any) => [
      this.transform(data?.voucherDate),
      data?.voucherNo || '',
      data?.amount?.toFixed(2) || 0,
      data?.particular || '',
      data?.remarks || '',
    ]);

    autoTable(doc, {
      head: [['VoucherDate', 'VoucherNo', 'Amount', 'Particular', 'Remarks']],
      body: dataRows,
      foot: [['', '', this.totalAmount().toFixed(2), '', '']],
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
      didDrawPage: () => {
        doc.setFontSize(8);
        doc.text(``, pageSizeWidth - marginRight - 10, pageSizeHeight - marginBottom, {
          align: 'right',
        });
      },
    });

    const pdfOutput = doc.output('blob');
    window.open(URL.createObjectURL(pdfOutput));
  }
}
