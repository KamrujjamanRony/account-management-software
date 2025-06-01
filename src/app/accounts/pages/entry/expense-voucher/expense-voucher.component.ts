import { CommonModule, DatePipe } from '@angular/common';
import { Component, ElementRef, inject, signal, viewChildren } from '@angular/core';
import { FieldComponent } from '../../../../shared/components/field/field.component';
import { FormControl, FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AllSvgComponent } from '../../../../shared/components/svg/all-svg/all-svg.component';
import { Observable } from 'rxjs';
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
  imports: [CommonModule, FieldComponent, ReactiveFormsModule, AllSvgComponent, FormsModule, SelectorComponent],
  templateUrl: './expense-voucher.component.html',
  styleUrl: './expense-voucher.component.css'
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
  filteredVoucherList = signal<any[]>([]);
  highlightedTr: number = -1;
  selectedVoucher: any;
  selectedVoucherDetails: any;
  selectedVoucherDetailsIndex: any;
  accountBankCashIdOption = signal<any[]>([]);
  vendorIdOption = signal<any[]>([]);
  headIdOption = signal<any[]>([]);
  subHeadIdOption = signal<any[]>([]);
  allOption = signal<any[]>([]);
  isSubmitting = signal<boolean>(false);
  fromDate = signal<any>(null);
  toDate = signal<any>(null);
  chartofAccountId = signal<any>(null);
  todayDate: any;
  dataArray: any[] = [];
  totalAmount: number = 0;
  bankOrCash: string = "";
  selectedValue: any = "";

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
    remarks: ['']
  });

  addVoucherForm = this.fb.group({
    id: [""],
    headId: ["", Validators.required],
    subHeadId: [""],
    voucherId: [""],
    debitAmount: [''],
    creditAmount: [''],
    remarks: [''],
  });

  addData() {
    if (this.selectedVoucher && this.dataArray.length > 0 && !this.selectedVoucherDetails) {
      this.toastService.showMessage('warn', 'Warning', "You don't add a Voucher details in editing mode!");
      return;
    }
    const cashId = this.form.value.accountBankCashId;
    if (this.addVoucherForm.valid && this.addVoucherForm.value.headId && cashId) {
      if (!this.addVoucherForm.value.debitAmount) {
        this.toastService.showMessage('warn', 'Warning', 'Amount Must Be Gater Than 0');
        return;
      }
      const headId = this.addVoucherForm.value.headId;
      let children = [];
      this.accountListService.getAccountList({
        "allbyheadId": +headId,
        "accountGroup": [
          "Income"
        ]
      }).subscribe(accountData => {
        children = accountData.map((c: any) => ({ id: c.id, text: c.subHead.toLowerCase() }))
        if (children.length > 0 && !this.addVoucherForm.value.subHeadId) {
          this.toastService.showMessage('warn', 'Warning', 'Head is Not Valid Form Voucher Details');
          return;
        }
        const data = this.addVoucherForm.value;
        const addData = { ...data, headId: Number(data.headId), subHeadId: data.subHeadId ? Number(data.subHeadId) : null, debitAmount: data.debitAmount ? Number(data.debitAmount) : null }
        if (this.selectedVoucherDetails) {
          this.dataArray[this.selectedVoucherDetailsIndex] = addData;
          this.selectedVoucherDetails = null;
          this.selectedVoucherDetailsIndex = null;
        } else {
          this.dataArray.push(addData);
        }
        this.addVoucherForm.reset();
        this.bankOrCash = this.accountBankCashIdOption().find((a: any) => a.id == cashId)?.text;
        this.totalAmount = this.dataArray.reduce((prev, data) => prev + data.debitAmount, 0);
      });

    } else {
      this.toastService.showMessage('warn', 'Warning', 'Form is invalid! Please Fill All Requirement Field.');
    }
  }

  editData(index: number) {
    this.selectedVoucherDetails = this.dataArray[index];
    this.selectedVoucherDetailsIndex = index;
    this.addVoucherForm.patchValue({
      id: this.selectedVoucherDetails?.id,
      headId: this.selectedVoucherDetails?.headId,
      subHeadId: this.selectedVoucherDetails?.subHeadId,
      voucherId: this.selectedVoucherDetails?.voucherId,
      debitAmount: this.selectedVoucherDetails?.debitAmount,
      creditAmount: this.selectedVoucherDetails?.creditAmount,
      remarks: this.selectedVoucherDetails?.remarks,
    });
    const subHeadIdReq = {
      "headId": this.addVoucherForm.value.headId,
      "allbyheadId": this.addVoucherForm.value.headId
    };
    this.accountListService.getAccountList(subHeadIdReq).subscribe(data => {
      this.subHeadIdOption.set(data.map((c: any) => ({ id: c.id, text: c.subHead.toLowerCase() })))
      this.totalAmount = this.dataArray.reduce((prev, data) => prev + data.debitAmount, 0);
    });
  }

  deleteData(index: number) {
    this.dataArray.splice(index, 1);
    this.totalAmount = this.dataArray.reduce((prev, data) => prev + data.debitAmount, 0);
  }

  onSubmit(e: Event) {
    this.isSubmitted = true;
    // console.log(this.form.value);
    if (this.form.valid && this.dataArray.length > 0) {
      this.isSubmitting.set(true);
      const restData = this.form.value;
      const voucherFormData = { ...restData, accountBankCashId: Number(restData.accountBankCashId), vendorId: restData.vendorId ? Number(restData.vendorId) : null, amount: this.totalAmount }
      // console.log(this.form.value);
      if (this.selectedVoucher) {
        const editData = { ...voucherFormData, editVoucherDetailDto: this.dataArray };
        // console.log(editData, this.selectedVoucher.id)
        this.voucherService.updateVoucher(this.selectedVoucher.id, editData)
          .subscribe({
            next: (response) => {
              if (response !== null && response !== undefined) {
                this.toastService.showMessage('success', 'Successful', "Voucher successfully updated!");
                const rest = this.filteredVoucherList().filter(d => d.id !== response.id);
                const updatedData = response.voucherDetailDto.splice(-1);
                this.filteredVoucherList.set([...rest, response]);
                this.dataArray = [];
                this.isSubmitted = false;
                this.selectedVoucher = null;
                this.resetForm(e);
                this.isSubmitting.set(false);
                this.isSubmitted = false;
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
        const remarks = this.dataArray.map((data) => {
          return data.subHeadId ? this.displayHead(data.subHeadId) : this.displayHead(data.headId)
        })
        const createVoucherDetailDto = this.dataArray.map((data) => {
          return {
            headId: data.headId,
            subHeadId: data.subHeadId,
            debitAmount: data.debitAmount || 0,
            creditAmount: data.creditAmount || 0,
            remarks: data.remarks
          }
        })
        const addData = { ...voucherFormData, particular: remarks.join(','), createVoucherDetailDto };
        // console.log(addData);
        this.voucherService.addVoucher(addData)
          .subscribe({
            next: (response: any) => {
              // console.log(response)
              if (response !== null && response !== undefined) {
                this.toastService.showMessage('success', 'Successful', 'Voucher successfully added!');
                const updatedData = response.voucherDetailDto.splice(-1);
                this.filteredVoucherList.set([...this.filteredVoucherList(), response])
                this.dataArray = [];
                this.isSubmitted = false;
                this.resetForm(e);
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

  resetForm(e: Event) {
    e.preventDefault();
    this.form.reset();
    // this.addVoucherForm.value.headId = "";
    const today = new Date();
    this.form.patchValue({
      voucherDate: today.toISOString().split('T')[0]
    });
    this.addVoucherForm.reset();
    this.selectedVoucher = null;
    this.isSubmitted = false;
    this.totalAmount = 0;
    this.dataArray = [];
    this.selectedVoucherDetails = null;
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
    });
    this.selectedVoucher = data;
    // const rest = data.voucherDetailDto.pop();
    this.dataArray = data.voucherDetailDto.map((data: any) => {//+
      return {
        id: data.id,
        voucherId: data.voucherId,
        headId: data.headId,
        subHeadId: data.subHeadId,
        debitAmount: data.debitAmount,
        remarks: data.remarks
      };
    });
    const cashId = this.form.value.accountBankCashId;
    this.bankOrCash = this.accountBankCashIdOption().find((a: any) => a.id == cashId)?.text;
    this.totalAmount = this.dataArray.reduce((prev, data) => prev + data.debitAmount, 0);

    // Focus the 'Name' input field after patching the value
    setTimeout(() => {
      const inputs = this.inputRefs();
      inputs[0].nativeElement.focus();
    }, 0); // Delay to ensure the DOM is updated
  }

  // Simplified method to get form controls
  getControl(controlName: string): FormControl {
    return this.form.get(controlName) as FormControl;
  }


  // Utility methods----------------------------------------------------------------------

  onHeadSelected(selected: any): void {
    // console.log('Selected :', selected);
    this.addVoucherForm.patchValue({
      headId: selected?.id
    });
  }

  focusFirstInput() {
    const inputs = this.inputRefs();
    if (inputs.length) {
      inputs[0].nativeElement.focus();
    }
  }

  displayHead(id: any) {
    return this.allOption().find((option: any) => option.id == id)?.text ?? "";
  }

  onHeadChanged(e: Event) {
    e.preventDefault();
    const selectElement = e.target as HTMLSelectElement;
    const selectedValue = selectElement.value;

    const subHeadIdReq = {
      "headId": +selectedValue,
      "allbyheadId": +selectedValue
    };
    this.accountListService.getAccountList(subHeadIdReq).subscribe(data => {
      this.subHeadIdOption.set(data.map((c: any) => ({ id: c.id, text: c.subHead.toLowerCase() })))
    });
  }


  handleEnterKey(event: Event, currentIndex: number) {
    const keyboardEvent = event as KeyboardEvent;
    event.preventDefault();
    const allInputs = this.inputRefs();
    const inputs = allInputs.filter((i: any) => !i.nativeElement.disabled);

    if (currentIndex + 1 < inputs.length) {
      inputs[currentIndex + 1].nativeElement.focus();
    } else {
      this.addData();
      inputs[5].nativeElement.focus();
    }
  }


  transform(value: any, args: any = 'dd/MM/yyyy'): any {
    if (!value) return null;
    const datePipe = new DatePipe('en-US');
    return datePipe.transform(value, args);
  }


}
