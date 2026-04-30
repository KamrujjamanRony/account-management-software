import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, inject, signal, viewChildren } from '@angular/core';
import { FieldComponent } from '../../../../shared/components/field/field.component';
import { FormArray, FormControl, FormGroup, FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AccountListService } from '../../../services/account-list.service';
import { VendorService } from '../../../services/vendor.service';
import { VoucherService } from '../../../services/voucher.service';
import { DataFetchService } from '../../../../shared/services/useDataFetch';
import { AccountingReportsService } from '../../../services/accounting-reports.service';
import { SelectorComponent } from '../../../components/selector/selector.component';
import { ToastService } from '../../../../shared/components/primeng/toast/toast.service';
import { AuthService } from '../../../../settings/services/auth.service';

@Component({
  selector: 'app-expense-voucher',
  imports: [CommonModule, FieldComponent, ReactiveFormsModule, FormsModule, SelectorComponent],
  templateUrl: './expense-voucher.component.html',
  styleUrl: './expense-voucher.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpenseVoucherComponent {
  fb = inject(NonNullableFormBuilder);
  private accountListService = inject(AccountListService);
  private vendorService = inject(VendorService);
  private voucherService = inject(VoucherService);
  private dataFetchService = inject(DataFetchService);
  private accountingReportsService = inject(AccountingReportsService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  isView = signal<boolean>(false);
  isInsert = signal<boolean>(false);
  isEdit = signal<boolean>(false);
  isDelete = signal<boolean>(false);
  showList = signal<boolean>(true);
  filteredVoucherList = signal<any[]>([]);
  highlightedTr: number = -1;
  selectedVoucher: any;
  accountBankCashIdOption = signal<any[]>([]);
  vendorIdOption = signal<any[]>([]);
  headIdOption = signal<any[]>([]);
  // Per-row sub-head options keyed by FormArray index
  subHeadOptionsByIndex = signal<Record<number, { id: any; text: string }[]>>({});
  allOption = signal<any[]>([]);
  isSubmitting = signal<boolean>(false);
  fromDate = signal<any>(null);
  toDate = signal<any>(null);
  chartofAccountId = signal<any>(null);
  todayDate: any;

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
      voucherDate: today.toISOString().split('T')[0]
    });
    this.onLoadVoucher();
    this.accountListService.getAccountList({ "allbyheadId": 1 }).subscribe(data => this.allOption.set(data.map((c: any) => ({ id: c.id, text: c.subHead.toLowerCase() }))));
    setTimeout(() => this.focusFirstInput(), 10);
    this.isView.set(this.checkPermission("Payment Voucher", "View"));
    this.isInsert.set(this.checkPermission("Payment Voucher", "Insert"));
    this.isEdit.set(this.checkPermission("Payment Voucher", "Edit"));
    this.isDelete.set(this.checkPermission("Payment Voucher", "Delete"));
  }

  ngAfterViewInit() {
    this.onLoadDropdown();
  }

  onLoadVoucher() {
    const reqData = {
      "search": null,
      "transactionType": "Payment",
      "fromDate": this.fromDate(),
      "toDate": this.toDate() || this.fromDate(),
      "chartofAccountId": this.chartofAccountId() === "null" ? null : this.chartofAccountId()
    }
    const { data$, isLoading$, hasError$ } = this.dataFetchService.fetchData(this.voucherService.getVoucher(reqData));

    data$.subscribe(data => {
      this.filteredVoucherList.set(data)
    });

    this.isLoading$ = isLoading$;
    this.hasError$ = hasError$;
  }

  onLoadDropdown() {
    this.accountListService.getAccountList({
      "allbyheadId": 1,
      "search": null,
      "coaMap": [],
      "accountGroup": ["Expenses"]
    }).subscribe(data => {
      const accountGroupId = data.find((a: any) => a.accountGroup === "Expenses")?.id;
      const headIdReq = {
        "headId": accountGroupId,
        "allbyheadId": accountGroupId,
        "search": null,
        "coaMap": [],
        "accountGroup": []
      }
      this.accountListService.getAccountList(headIdReq).subscribe(data => this.headIdOption.set(data.map((c: any) => ({ id: c.id, text: c.subHead.toLowerCase() }))));
      this.vendorService.getVendor('').subscribe(data => this.vendorIdOption.set(data.map((c: any) => ({ id: c.id, text: c.name.toLowerCase() }))));
      this.accountingReportsService.getCurrentBalanceApi({}).subscribe(data => this.accountBankCashIdOption.set(data.map((c: any) => ({ id: c.headId, text: c.subHead }))));
    });
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

  // Form Field ----------------------------------------------------------------


  form = this.fb.group({
    transactionType: ['Payment', Validators.required],
    coaMap: [''],
    voucherDate: ["", Validators.required],
    accountBankCashId: ["", Validators.required],
    voucherNo: [''],
    vendorId: [''],
    receiveFrom: [''],
    payTo: [''],
    amount: [''],
    particular: [''],
    remarks: [''],
    postBy: [this.authService.getUser()?.username || ''],
    voucherDetails: this.fb.array<FormGroup>([])
  });

  // Dynamic voucher detail lines --------------------------------------------
  get voucherDetailsArray(): FormArray {
    return this.form.get('voucherDetails') as FormArray;
  }

  createLine(initial?: any): FormGroup {
    return this.fb.group({
      id: [initial?.id ?? null],
      voucherId: [initial?.voucherId ?? null],
      headId: [initial?.headId ?? '', Validators.required],
      subHeadId: [initial?.subHeadId ?? ''],
      debitAmount: [initial?.debitAmount ?? null, [Validators.required, Validators.min(0.01)]],
      remarks: [initial?.remarks ?? ''],
    });
  }

  addLine() {
    this.voucherDetailsArray.push(this.createLine());
  }

  removeLine(index: number) {
    this.voucherDetailsArray.removeAt(index);
    const map = { ...this.subHeadOptionsByIndex() };
    const reindexed: Record<number, { id: any; text: string }[]> = {};
    Object.keys(map).map(Number).filter(i => i !== index).forEach(i => {
      reindexed[i > index ? i - 1 : i] = map[i];
    });
    this.subHeadOptionsByIndex.set(reindexed);
  }

  subHeadOptionsAt(index: number): { id: any; text: string }[] {
    return this.subHeadOptionsByIndex()[index] ?? [];
  }

  onLineHeadSelected(index: number, selected: any): void {
    const line = this.voucherDetailsArray.at(index) as FormGroup;
    line.patchValue({ headId: selected?.id ?? '', subHeadId: '' });
    if (!selected?.id) {
      const map = { ...this.subHeadOptionsByIndex() };
      delete map[index];
      this.subHeadOptionsByIndex.set(map);
      return;
    }
    this.accountListService.getAccountList({
      headId: +selected.id,
      allbyheadId: +selected.id,
    }).subscribe(data => {
      const opts = data.map((c: any) => ({ id: c.id, text: c.subHead.toLowerCase() }));
      this.subHeadOptionsByIndex.set({ ...this.subHeadOptionsByIndex(), [index]: opts });
    });
  }

  get totalAmount(): number {
    return this.voucherDetailsArray.controls.reduce(
      (acc, c) => acc + Number(c.value.debitAmount || 0), 0
    );
  }

  get bankOrCashLabel(): string {
    const cashId = this.form.value.accountBankCashId;
    return this.accountBankCashIdOption().find((a: any) => a.id == cashId)?.text ?? '';
  }

  onSubmit(e: Event) {
    this.isSubmitted = true;
    const lines = this.voucherDetailsArray.value as any[];
    if (this.form.valid && lines.length > 0 && this.voucherDetailsArray.valid) {
      this.isSubmitting.set(true);
      const { voucherDetails, ...restData } = this.form.value as any;
      const normalizedLines = lines.map(d => ({
        ...d,
        headId: Number(d.headId),
        subHeadId: d.subHeadId ? Number(d.subHeadId) : null,
        debitAmount: d.debitAmount ? Number(d.debitAmount) : 0,
        creditAmount: 0,
        remarks: d.remarks || ' ',
      }));
      const voucherFormData = { ...restData, accountBankCashId: Number(restData.accountBankCashId), vendorId: restData.vendorId ? Number(restData.vendorId) : null, amount: this.totalAmount }
      if (this.selectedVoucher) {
        const editData = { ...voucherFormData, editVoucherDetailDto: normalizedLines };
        // console.log(editData, this.selectedVoucher.id)
        this.voucherService.updateVoucher(this.selectedVoucher.id, editData)
          .subscribe({
            next: (response) => {
              if (response !== null && response !== undefined) {
                this.toastService.showMessage('success', 'Successful', "Voucher successfully updated!");
                const rest = this.filteredVoucherList().filter(d => d.id !== response.id);
                response.voucherDetailDto?.splice(-1);
                this.filteredVoucherList.set([...rest, response]);
                this.isSubmitted = false;
                this.selectedVoucher = null;
                this.resetForm(e);
                this.showList.set(true);
                this.isSubmitting.set(false);
              }
              this.isSubmitted = false;

            },
            error: (error) => {
              console.error('Error update:', error);
              this.toastService.showMessage('error', 'Error', 'Error update!');
              this.isSubmitting.set(false);
            }
          });
      } else {
        const remarks = normalizedLines.map((data) => {
          return data.subHeadId ? this.displayHead(data.subHeadId) : this.displayHead(data.headId)
        })
        const createVoucherDetailDto = normalizedLines.map((data) => ({
          headId: data.headId,
          subHeadId: data.subHeadId,
          debitAmount: data.debitAmount || 0,
          creditAmount: data.creditAmount || 0,
          remarks: data.remarks
        }));
        const addData = { ...voucherFormData, particular: remarks.join(','), createVoucherDetailDto };
        // console.log(addData);
        this.voucherService.addVoucher(addData)
          .subscribe({
            next: (response: any) => {
              // console.log(response)
              if (response !== null && response !== undefined) {
                this.toastService.showMessage('success', 'Successful', 'Voucher successfully added!');
                response.voucherDetailDto?.splice(-1);
                this.filteredVoucherList.set([...this.filteredVoucherList(), response])
                this.isSubmitted = false;
                this.resetForm(e);
                this.showList.set(true);
                this.isSubmitting.set(false);
              }
              this.isSubmitted = false;

            },
            error: (error) => {
              this.isSubmitting.set(false);
              if (error.error.message || error.error.title) {
                this.toastService.showMessage('error', 'Error', `${error.error.status} : ${error.error.message || error.error.title}`);
              }
              console.error('Error add:', error);
            }
          });
      }
    } else {
      this.toastService.showMessage('warn', 'Warning', 'Form is invalid! Please Fill All Requirement Field.');
    }
  }

  onDelete(id: any) {
    if (confirm("Are you sure you want to delete?")) {
      this.voucherService.deleteVoucher(id).subscribe(data => {
        if (data.id) {
          this.toastService.showMessage('success', 'Successful', "Voucher deleted successfully!");
          this.filteredVoucherList.set(this.filteredVoucherList().filter(d => d.id !== id));
        } else {
          console.error('Error deleting Voucher:', data);
          this.toastService.showMessage('error', 'Error', data.message);
        }
      });
    }
  }

  resetForm(e?: Event) {
    e?.preventDefault();
    this.voucherDetailsArray.clear();
    this.subHeadOptionsByIndex.set({});
    this.form.reset();
    const today = new Date();
    this.form.patchValue({
      transactionType: 'Payment',
      voucherDate: today.toISOString().split('T')[0],
      postBy: this.authService.getUser()?.username || ''
    });
    this.selectedVoucher = null;
    this.isSubmitted = false;
  }

  onToggleList() {
    this.showList.update(s => !s);
    if (this.showList()) {
      this.resetForm();
    }
  }

  onUpdate(data: any) {
    this.form.patchValue({
      transactionType: data?.transactionType,
      coaMap: data?.coaMap,
      voucherDate: data?.voucherDate.split('T')[0],
      accountBankCashId: data?.accountBankCashId,
      vendorId: data?.vendorId,
      receiveFrom: data?.receiveFrom,
      payTo: data?.payTo,
      amount: data?.amount,
      particular: data?.particular,
      voucherNo: data?.voucherNo,
      remarks: data?.remarks,
      postBy: data?.postBy
    });
    this.selectedVoucher = data;

    this.voucherDetailsArray.clear();
    const lines = (data?.voucherDetailDto ?? []).map((d: any) => ({
      id: d.id,
      voucherId: d.voucherId,
      headId: d.headId,
      subHeadId: d.subHeadId,
      debitAmount: d.debitAmount,
      remarks: d.remarks,
    }));
    const subHeadMap: Record<number, { id: any; text: string }[]> = {};
    lines.forEach((line: any, idx: number) => {
      this.voucherDetailsArray.push(this.createLine(line));
      if (line.headId) {
        this.accountListService.getAccountList({
          headId: line.headId,
          allbyheadId: line.headId,
        }).subscribe(res => {
          subHeadMap[idx] = res.map((c: any) => ({ id: c.id, text: c.subHead.toLowerCase() }));
          this.subHeadOptionsByIndex.set({ ...this.subHeadOptionsByIndex(), [idx]: subHeadMap[idx] });
        });
      }
    });

    setTimeout(() => {
      const inputs = this.inputRefs();
      inputs[0]?.nativeElement.focus();
    }, 0);
    this.showList.set(false);
  }

  // Simplified method to get form controls
  getControl(controlName: string): FormControl {
    return this.form.get(controlName) as FormControl;
  }


  // Utility methods----------------------------------------------------------------------

  focusFirstInput() {
    const inputs = this.inputRefs();
    if (inputs.length) {
      inputs[0].nativeElement.focus();
    }
  }

  displayHead(id: any) {
    return this.allOption().find((option: any) => option.id == id)?.text ?? "";
  }

  handleEnterKey(event: Event, currentIndex: number) {
    event.preventDefault();
    const allInputs = this.inputRefs();
    const inputs = allInputs.filter((i: any) => !i.nativeElement.disabled);
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
    const pageSizeWidth = 148; // A5 width
    const pageSizeHeight = 210; // A5 height
    const marginLeft = 8;
    const marginRight = 8;
    let marginTop = 10;
    const marginBottom = 8;

    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a5' });
    const centerX = doc.internal.pageSize.getWidth() / 2;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Payment Voucher Report', centerX, marginTop, { align: 'center' });
    marginTop += 5;

    doc.setFontSize(9);
    if (this.fromDate()) {
      const dateRange = `From: ${this.transform(this.fromDate())} to: ${this.toDate() ? this.transform(this.toDate()) : this.transform(this.fromDate())}`;
      doc.text(dateRange, centerX, marginTop, { align: 'center' });
      marginTop += 4;
    }

    const list = this.filteredVoucherList();
    const dataRows = list.map((data: any) => [
      this.transform(data?.voucherDate),
      data?.voucherNo || '',
      data?.accountBankName || '',
      data?.payTo || '',
      data?.particular || '',
      (Number(data?.amount) || 0).toFixed(2),
    ]);
    const total = list.reduce((acc: number, c: any) => acc + (Number(c?.amount) || 0), 0);

    autoTable(doc, {
      head: [['Date', 'No.', 'Cash/Bank', 'Pay To', 'Particular', 'Amount']],
      body: dataRows,
      foot: [['', '', '', '', 'Total', total.toFixed(2)]],
      theme: 'grid',
      startY: marginTop + 1,
      styles: { textColor: 0, cellPadding: 1.2, lineColor: 0, fontSize: 7, valign: 'middle', halign: 'center' },
      headStyles: { fillColor: [102, 255, 102], textColor: 0, lineWidth: 0.2, lineColor: 0, fontStyle: 'bold' },
      footStyles: { fillColor: [102, 255, 255], textColor: 0, lineWidth: 0.2, lineColor: 0, fontStyle: 'bold', halign: 'right' },
      columnStyles: { 4: { halign: 'left' }, 5: { halign: 'right' } },
      margin: { top: marginTop, left: marginLeft, right: marginRight },
      didDrawPage: () => {
        doc.setFontSize(7);
        doc.text('', pageSizeWidth - marginRight - 10, pageSizeHeight - marginBottom, { align: 'right' });
      },
    });

    const pdfOutput = doc.output('blob');
    window.open(URL.createObjectURL(pdfOutput));
  }

}
