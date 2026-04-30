import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, inject, signal, viewChildren } from '@angular/core';
import { FieldComponent } from '../../../../shared/components/field/field.component';
import { FormArray, FormControl, FormGroup, FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AllSvgComponent } from '../../../../shared/components/svg/all-svg/all-svg.component';
import { DataFetchService } from '../../../../shared/services/useDataFetch';
import { Observable } from 'rxjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SelectorComponent } from '../../../components/selector/selector.component';
import { AccountListService } from '../../../services/account-list.service';
import { VendorService } from '../../../services/vendor.service';
import { VoucherService } from '../../../services/voucher.service';
import { AccountingReportsService } from '../../../services/accounting-reports.service';
import { ToastService } from '../../../../shared/components/primeng/toast/toast.service';
import { AuthService } from '../../../../settings/services/auth.service';

@Component({
  selector: 'app-receive-voucher',
  imports: [CommonModule, FieldComponent, ReactiveFormsModule, FormsModule, SelectorComponent],
  templateUrl: './receive-voucher.component.html',
  styleUrl: './receive-voucher.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReceiveVoucherComponent {
  fb = inject(NonNullableFormBuilder);
  private accountListService = inject(AccountListService);
  private vendorService = inject(VendorService);
  private voucherService = inject(VoucherService);
  private accountingReportsService = inject(AccountingReportsService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  isView = signal<boolean>(false);
  isInsert = signal<boolean>(false);
  isEdit = signal<boolean>(false);
  isDelete = signal<boolean>(false);
  showList = signal<boolean>(true);
  dataFetchService = inject(DataFetchService);
  filteredVoucherList = signal<any[]>([]);
  highlightedTr: number = -1;
  selectedVoucher: any;
  accountBankCashIdOption = signal<any[]>([]);
  vendorIdOption = signal<any[]>([]);
  headIdOption = signal<any[]>([]);
  allOption = signal<any[]>([]);
  fromDate = signal<any>('');
  toDate = signal<any>('');
  isSubmitting = signal<boolean>(false);
  date: any = new Date();
  todayDate: any;
  subHeadOptionsByIndex = signal<Record<number, { id: any; text: string }[]>>({});

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
    this.isView.set(this.checkPermission("Receive Voucher", "View"));
    this.isInsert.set(this.checkPermission("Receive Voucher", "Insert"));
    this.isEdit.set(this.checkPermission("Receive Voucher", "Edit"));
    this.isDelete.set(this.checkPermission("Receive Voucher", "Delete"));
  }

  ngAfterViewInit() {
    this.onLoadDropdown();
  }

  onLoadVoucher() {
    const reqData = {
      "search": "",
      "transactionType": "Receipt",
      "fromDate": this.fromDate(),
      "toDate": this.toDate() || this.fromDate()
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
      "accountGroup": ["Income"]
    }).subscribe(data => {
      const accountGroupId = data.find((a: any) => a.accountGroup === "Income")?.id;
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

  onDateChange() {
    this.onLoadVoucher();
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
    transactionType: ['Receipt', Validators.required],
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

  get voucherDetailsArray(): FormArray<FormGroup> {
    return this.form.get('voucherDetails') as FormArray<FormGroup>;
  }

  createLine(initial?: any): FormGroup {
    return this.fb.group({
      id: [initial?.id ?? ''],
      headId: [initial?.headId ?? '', Validators.required],
      subHeadId: [initial?.subHeadId ?? ''],
      voucherId: [initial?.voucherId ?? ''],
      creditAmount: [initial?.creditAmount ?? null, [Validators.required, Validators.min(0.01)]],
      remarks: [initial?.remarks ?? '']
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
    Object.keys(map).map(k => Number(k)).sort((a, b) => a - b).forEach((k, i) => { reindexed[i] = map[k]; });
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
    this.accountListService.getAccountList({ headId: selected.id, allbyheadId: selected.id }).subscribe(data => {
      const opts = data.map((c: any) => ({ id: c.id, text: c.subHead.toLowerCase() }));
      const map = { ...this.subHeadOptionsByIndex() };
      map[index] = opts;
      this.subHeadOptionsByIndex.set(map);
    });
  }

  get totalAmount(): number {
    return this.voucherDetailsArray.controls.reduce((sum, ctrl) => sum + (Number(ctrl.value.creditAmount) || 0), 0);
  }

  get bankOrCashLabel(): string {
    const cashId = this.form.value.accountBankCashId;
    return this.accountBankCashIdOption().find((a: any) => a.id == cashId)?.text ?? '';
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
    this.subHeadOptionsByIndex.set({});
    (data.voucherDetailDto ?? []).forEach((line: any, i: number) => {
      this.voucherDetailsArray.push(this.createLine(line));
      if (line?.headId) {
        this.accountListService.getAccountList({ headId: line.headId, allbyheadId: line.headId }).subscribe(d => {
          const opts = d.map((c: any) => ({ id: c.id, text: c.subHead.toLowerCase() }));
          const map = { ...this.subHeadOptionsByIndex() };
          map[i] = opts;
          this.subHeadOptionsByIndex.set(map);
        });
      }
    });

    setTimeout(() => {
      const inputs = this.inputRefs();
      inputs[0]?.nativeElement.focus();
    }, 0);
    this.showList.set(false);
  }

  onSubmit(e: Event) {
    this.isSubmitted = true;
    const lines = this.voucherDetailsArray.value as any[];
    if (this.form.valid && lines.length > 0 && this.voucherDetailsArray.valid) {
      this.isSubmitting.set(true);
      const { voucherDetails: _omit, ...restData } = this.form.value as any;
      const voucherFormData = { ...restData, accountBankCashId: Number(restData.accountBankCashId), vendorId: restData.vendorId ? Number(restData.vendorId) : null, amount: this.totalAmount }
      const normalizedLines = lines.map((data: any) => ({
        id: data.id || undefined,
        voucherId: data.voucherId || undefined,
        headId: Number(data.headId),
        subHeadId: data.subHeadId ? Number(data.subHeadId) : null,
        debitAmount: 0,
        creditAmount: data.creditAmount ? Number(data.creditAmount) : 0,
        remarks: data.remarks
      }));
      if (this.selectedVoucher) {
        const editData = { ...voucherFormData, editVoucherDetailDto: normalizedLines };
        this.voucherService.updateVoucher(this.selectedVoucher.id, editData)
          .subscribe({
            next: (response) => {
              if (response !== null && response !== undefined) {
                this.toastService.showMessage('success', 'Successful', "Voucher successfully updated!");
                const rest = this.filteredVoucherList().filter(d => d.id !== response.id);
                this.filteredVoucherList.set([...rest, response]);
                this.isSubmitted = false;
                this.selectedVoucher = null;
                this.resetForm(e);
                this.showList.set(true);
                this.isSubmitting.set(false);
              }

            },
            error: (error) => {
              console.error('Error update:', error);
              this.toastService.showMessage('error', 'Error', `${error.error.status} : ${error.error.message || error.error.title}`);
              this.isSubmitting.set(false);
            }
          });
      } else {
        const remarks = normalizedLines.map((data) => data.subHeadId ? this.displayHead(data.subHeadId) : this.displayHead(data.headId));
        const createVoucherDetailDto = normalizedLines.map(({ id: _i, voucherId: _v, ...rest }) => rest);
        const addData = { ...voucherFormData, particular: remarks.join(','), createVoucherDetailDto };
        this.voucherService.addVoucher(addData)
          .subscribe({
            next: (response: any) => {
              if (response !== null && response !== undefined) {
                this.toastService.showMessage('success', 'Successful', "Voucher successfully added!");
                this.filteredVoucherList.set([...this.filteredVoucherList(), response])
                this.isSubmitted = false;
                this.resetForm(e);
                this.showList.set(true);
                this.isSubmitting.set(false);
              }

            },
            error: (error) => {
              if (error.error.message || error.error.title) {
                this.toastService.showMessage('error', 'Error', `${error.error.status} : ${error.error.message || error.error.title}`);
                this.isSubmitting.set(false);
              }
              console.error('Error add:', error);
              this.toastService.showMessage('error', 'Error', `${error.error.status} : ${error.error.message || error.error.title}`);
              this.isSubmitting.set(false);
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
          this.toastService.showMessage('error', 'Error', `Error deleting Voucher : ${data.message}`);
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
      transactionType: 'Receipt',
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
    doc.text('Receive Voucher Report', centerX, marginTop, { align: 'center' });
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
      data?.receiveFrom || '',
      data?.particular || '',
      (Number(data?.amount) || 0).toFixed(2),
    ]);
    const total = list.reduce((acc: number, c: any) => acc + (Number(c?.amount) || 0), 0);

    autoTable(doc, {
      head: [['Date', 'No.', 'Cash/Bank', 'Receive From', 'Particular', 'Amount']],
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
