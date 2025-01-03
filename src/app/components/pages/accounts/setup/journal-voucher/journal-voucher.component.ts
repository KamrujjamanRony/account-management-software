import { CommonModule, DatePipe } from '@angular/common';
import { Component, ElementRef, inject, QueryList, signal, ViewChildren } from '@angular/core';
import { ToastSuccessComponent } from '../../../../shared/toast/toast-success/toast-success.component';
import { FieldComponent } from '../../../../shared/field/field.component';
import { FormControl, FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AllSvgComponent } from '../../../../shared/svg/all-svg/all-svg.component';
import { BankService } from '../../../../../services/bank.service';
import { AccountListService } from '../../../../../services/account-list.service';
import { VendorService } from '../../../../../services/vendor.service';
import { VoucherService } from '../../../../../services/voucher.service';
import { DataFetchService } from '../../../../../services/useDataFetch';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-journal-voucher',
  imports: [CommonModule, ToastSuccessComponent, FieldComponent, ReactiveFormsModule, AllSvgComponent, FormsModule],
  templateUrl: './journal-voucher.component.html',
  styleUrl: './journal-voucher.component.css'
})
export class JournalVoucherComponent {
  fb = inject(NonNullableFormBuilder);
  private bankService = inject(BankService);
  private accountListService = inject(AccountListService);
  private vendorService = inject(VendorService);
  private voucherService = inject(VoucherService);
  dataFetchService = inject(DataFetchService);
  filteredVoucherList = signal<any[]>([]);
  highlightedTr: number = -1;
  success = signal<any>("");
  selectedVoucher: any;
  selectedVoucherDetails: any;
  selectedVoucherDetailsIndex: any;
  accountBankCashIdOption = signal<any[]>([]);
  vendorIdOption = signal<any[]>([]);
  headIdOption = signal<any[]>([]);
  subHeadIdOption = signal<any[]>([]);
  chartGroupOption = signal<any[]>([]);
  allOption = signal<any[]>([]);
  fromDate = signal<any>('');
  toDate = signal<any>('');
  isSubmitting = signal<boolean>(false);
  date: any = new Date();
  todayDate: any;
  dataArray: any[] = [];
  totalDebitAmount: number = 0;
  totalCreditAmount: number = 0;
  selectedValue: any = "";

  isLoading$: Observable<any> | undefined;
  hasError$: Observable<any> | undefined;
  @ViewChildren('inputRef') inputRefs!: QueryList<ElementRef>;
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
  }

  ngAfterViewInit() {
    this.onLoadDropdown();
  }

  onLoadVoucher() {
    const reqData = {
      "search": "",
      "transactionType": "Journal",
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
      "accountGroup": ["Current Asset", "NonCurrent/Fixed Asset", "Current Liability", "NonCurrent Liability", "Equity"]
    }).subscribe(data => this.headIdOption.set(data.map((c: any) => ({ id: c.id, text: c.subHead.toLowerCase() }))));
    const accountListReq = {
      "headId": null,
      "allbyheadId": 1,
      "search": null,
      "coaMap": ["Cash", "Bank"],
      "accountGroup": []
    }
    this.accountListService.getAccountList(accountListReq).subscribe(data => this.accountBankCashIdOption.set(data.map((c: any) => ({ id: c.id, text: c.subHead.toLowerCase() }))));
    this.vendorService.getVendor('').subscribe(data => this.vendorIdOption.set(data.map((c: any) => ({ id: c.id, text: c.name.toLowerCase() }))));
  }

  onDateChange() {
    this.onLoadVoucher();
  }

  // Form Field ----------------------------------------------------------------

  form = this.fb.group({
    transactionType: ['Journal', Validators.required],
    voucherDate: ["", Validators.required],
    voucherNo: [''],
    vendorId: [''],
    payTo: [''],
    amount: [''],
    remarks: [''],
    coaMap: [''],
    receiveFrom: [''],
    particular: [''],
  });

  addVoucherForm = this.fb.group({
    id: [""],
    chartGroup: [""],
    headId: ["", Validators.required],
    subHeadId: [""],
    debitAmount: [''],
    remarks: [''],
    voucherId: [""],
    creditAmount: [''],
  });

  // Simplified method to get form controls
  getControl(controlName: string): FormControl {
    return this.form.get(controlName) as FormControl;
  }

  addData() {
    if (this.selectedVoucher && this.dataArray.length > 0 && !this.selectedVoucherDetails) {
      alert("You don't add a Voucher details in editing mode!");
      return;
    }
    if (this.addVoucherForm.valid && this.addVoucherForm.value.headId) {
      if (this.addVoucherForm.value.debitAmount || this.addVoucherForm.value.creditAmount) {
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
            alert(`Head is Not Valid Form Voucher Details`);
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
          this.totalDebitAmount = this.dataArray.reduce((prev, data) => prev + data.debitAmount, 0);
          this.totalCreditAmount = this.dataArray.reduce((prev, data) => prev + data.creditAmount, 0);
        });
      } else {
        alert('Amount Must Be Gater Than 0');
      }


    } else {
      alert('Form is invalid! Please Fill and Head Field.');
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
      this.totalDebitAmount = this.dataArray.reduce((prev, data) => prev + data.debitAmount, 0);
      this.totalCreditAmount = this.dataArray.reduce((prev, data) => prev + data.creditAmount, 0);
    });
  }

  deleteData(index: number) {
    this.dataArray.splice(index, 1);
    this.totalDebitAmount = this.dataArray.reduce((prev, data) => prev + data.debitAmount, 0);
    this.totalCreditAmount = this.dataArray.reduce((prev, data) => prev + data.creditAmount, 0);
  }

  onSubmit(e: Event) {
    this.isSubmitted = true;
    // console.log(this.form.value);
    if (this.form.valid && this.dataArray.length > 0) {
      this.isSubmitting.set(true);
      const restData = this.form.value;
      const voucherFormData = { ...restData, vendorId: restData.vendorId ? Number(restData.vendorId) : null, amount: this.totalDebitAmount }
      // console.log(this.form.value);
      if (this.selectedVoucher) {
        const editData = { ...voucherFormData, editVoucherDetailDto: this.dataArray };
        console.log(editData, this.selectedVoucher.id)
        this.voucherService.updateVoucher(this.selectedVoucher.id, editData)
          .subscribe({
            next: (response) => {
              if (response !== null && response !== undefined) {
                this.success.set("Voucher successfully updated!");
                const rest = this.filteredVoucherList().filter(d => d.id !== response.id);
                this.filteredVoucherList.set([...rest, response]);
                this.isSubmitted = false;
                this.selectedVoucher = null;
                this.resetForm(e);
                this.isSubmitting.set(false);
                setTimeout(() => {
                  this.success.set("");
                }, 3000);
              }

            },
            error: (error) => {
              console.error('Error update:', error);
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
        const addData = { ...voucherFormData, remarks: remarks.join(','), createVoucherDetailDto };
        console.log(addData);
        this.voucherService.addVoucher(addData)
          .subscribe({
            next: (response) => {
              console.log(response)
              if (response !== null && response !== undefined) {
                this.success.set("Voucher successfully added!");
                this.dataArray = [];
                this.filteredVoucherList.set([...this.filteredVoucherList(), response])
                this.isSubmitted = false;
                this.resetForm(e);
                this.isSubmitting.set(false);
                setTimeout(() => {
                  this.success.set("");
                }, 3000);
              }

            },
            error: (error) => {
              if (error.error.message) {
                alert(`${error.error.status} : ${error.error.message}`);
                this.isSubmitting.set(false);
              }
              console.error('Error add:', error);
              this.isSubmitting.set(false);
            }
          });
      }
    } else {
      alert('Form is invalid! Please Fill All Required Field.');
    }
  }

  onDelete(id: any) {
    if (confirm("Are you sure you want to delete?")) {
      this.voucherService.deleteVoucher(id).subscribe(data => {
        if (data.id) {
          this.success.set("Voucher deleted successfully!");
          this.filteredVoucherList.set(this.filteredVoucherList().filter(d => d.id !== id));
          setTimeout(() => {
            this.success.set("");
          }, 3000);
        } else {
          console.error('Error deleting Voucher:', data);
          alert('Error deleting Voucher: ' + data.message)
        }
      });
    }
  }

  resetForm(e: Event) {
    e.preventDefault();
    this.form.reset();
    const today = new Date();
    this.form.patchValue({
      voucherDate: today.toISOString().split('T')[0]
    });
    this.addVoucherForm.reset();
    this.selectedVoucher = null;
    this.isSubmitted = false;
    this.totalDebitAmount = 0;
    this.totalCreditAmount = 0;
    this.dataArray = [];
    this.selectedVoucherDetails = null;
  }

  onUpdate(data: any) {
    this.form.patchValue({
      transactionType: data?.transactionType,
      coaMap: data?.coaMap,
      voucherDate: data?.voucherDate.split('T')[0],
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
        creditAmount: data.creditAmount,
        remarks: data.remarks
      };
    });
    this.totalDebitAmount = this.dataArray.reduce((prev, data) => prev + data.debitAmount, 0);
    this.totalCreditAmount = this.dataArray.reduce((prev, data) => prev + data.creditAmount, 0);

    // Focus the 'Name' input field after patching the value
    setTimeout(() => {
      const inputs = this.inputRefs.toArray();
      inputs[0].nativeElement.focus();
    }, 0); // Delay to ensure the DOM is updated
  }


  // Utility methods----------------------------------------------------------------------

  focusFirstInput() {
    const inputs = this.inputRefs.toArray();
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
    const inputs = this.inputRefs.toArray();
    console.log(currentIndex);
    console.log(inputs[currentIndex])

    if ((inputs[currentIndex] as any).innerText === 'Add Debit Voucher Detail' || (inputs[currentIndex] as any).innerText === 'Update Debit Voucher Detail') {
      this.addData();
      inputs[3].nativeElement.focus();
    } else if ((inputs[currentIndex] as any).innerText === 'Add Credit Voucher Detail' || (inputs[currentIndex] as any).innerText === 'Update Credit Voucher Detail') {
      this.addData();
      inputs[8].nativeElement.focus();
    } else {
      inputs[currentIndex + 1].nativeElement.focus();
    }

    // if (currentIndex + 1 < inputs.length) {
    //   inputs[currentIndex + 1].nativeElement.focus();
    // } else {
    //   this.addData();
    //   inputs[8].nativeElement.focus();
    // }
  }


  transform(value: any, args: any = 'dd/MM/yyyy'): any {
    if (!value) return null;
    const datePipe = new DatePipe('en-US');
    return datePipe.transform(value, args);
  }

}
