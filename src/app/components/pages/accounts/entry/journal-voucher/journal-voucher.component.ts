import { CommonModule, DatePipe } from '@angular/common';
import { Component, ElementRef, inject, QueryList, signal, ViewChildren } from '@angular/core';
import { ToastSuccessComponent } from '../../../../shared/toast/toast-success/toast-success.component';
import { FieldComponent } from '../../../../shared/field/field.component';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AllSvgComponent } from '../../../../shared/svg/all-svg/all-svg.component';
import { AccountListService } from '../../../../../services/account-list.service';
import { VendorService } from '../../../../../services/vendor.service';
import { VoucherService } from '../../../../../services/voucher.service';
import { DataFetchService } from '../../../../../services/useDataFetch';
import { Observable } from 'rxjs';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

@Component({
  selector: 'app-journal-voucher',
  imports: [CommonModule, ToastSuccessComponent, FieldComponent, ReactiveFormsModule, AllSvgComponent, FormsModule],
  templateUrl: './journal-voucher.component.html',
  styleUrl: './journal-voucher.component.css'
})
export class JournalVoucherComponent {
  fb = inject(FormBuilder);
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
  transactionTypeOption = [
    { id: "BalanceSheet", text: "Balance-Sheet" },
    // { id: "Receipt", text: "Receipt" },
    // { id: "Payment", text: "Payment" },
    { id: "Contra", text: "Contra" },
  ];
  accountBankCashIdOption = signal<any[]>([]);
  vendorIdOption = signal<any[]>([]);
  headIdOption = signal<any[]>([]);
  debitSubHeadIdOption = signal<any[]>([]);
  creditSubHeadIdOption = signal<any[]>([]);
  chartGroupOption = signal<any[]>([]);
  allOption = signal<any[]>([]);
  fromDate = signal<any>('');
  toDate = signal<any>('');
  totalAmount = signal<any>(0);
  transactionType = signal<any>('BalanceSheet');
  isSubmitting = signal<boolean>(false);
  date: any = new Date();
  todayDate: any;
  dataArray: any[] = [];
  totalDebitAmount: number = 0;
  totalCreditAmount: number = 0;
  selectedValue: any = "";
  marginTop: any = 0;

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

    this.transactionType.set(this.form.value.transactionType)
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
      "transactionType": this.transactionType(),
      "fromDate": this.fromDate(),
      "toDate": this.toDate() || this.fromDate()
    }
    const { data$, isLoading$, hasError$ } = this.dataFetchService.fetchData(this.voucherService.getVoucher(reqData));

    data$.subscribe(data => {
      this.filteredVoucherList.set(data);
      this.totalAmount.set(data.reduce((acc, curr: any) => acc + curr?.amount, 0));
    });

    this.isLoading$ = isLoading$;
    this.hasError$ = hasError$;
  }

  onLoadDropdown() {
    if (this.transactionType() === "Payment") {
      this.onLoadExpense();
    } else if (this.transactionType() === "Receipt") {
      this.onLoadReceipt();
    } else if (this.transactionType() === "BalanceSheet") {
      this.onLoadJournal();
    }
  }

  onLoadExpense() {
    this.accountListService.getAccountList({
      "allbyheadId": 1,
      "search": null,
      "coaMap": [],
      "accountGroup": ["Expenses"]
    }).subscribe(data => {
      const accountGroupId = data.find((a: any) => a.accountGroup === "Expenses")?.id;
      const accountListReq = {
        "headId": null,
        "allbyheadId": 1,
        "search": null,
        "coaMap": ["Cash", "Bank"],
        "accountGroup": []
      }
      const headIdReq = {
        "headId": accountGroupId,
        "allbyheadId": accountGroupId,
        "search": null,
        "coaMap": [],
        "accountGroup": []
      }
      this.accountListService.getAccountList(accountListReq).subscribe(data => this.accountBankCashIdOption.set(data.map((c: any) => ({ id: c.id, text: c.subHead.toLowerCase() }))));
      this.accountListService.getAccountList(headIdReq).subscribe(data => this.headIdOption.set(data.map((c: any) => ({ id: c.id, text: c.subHead.toLowerCase() }))));
      this.vendorService.getVendor('').subscribe(data => this.vendorIdOption.set(data.map((c: any) => ({ id: c.id, text: c.name.toLowerCase() }))));
    });
  }

  onLoadReceipt() {
    this.accountListService.getAccountList({
      "allbyheadId": 1,
      "search": null,
      "coaMap": [],
      "accountGroup": ["Income"]
    }).subscribe(data => {
      const accountGroupId = data.find((a: any) => a.accountGroup === "Income")?.id;
      const accountListReq = {
        "headId": null,
        "allbyheadId": 1,
        "search": null,
        "coaMap": ["Cash", "Bank"],
        "accountGroup": []
      }
      const headIdReq = {
        "headId": accountGroupId,
        "allbyheadId": accountGroupId,
        "search": null,
        "coaMap": [],
        "accountGroup": []
      }
      this.accountListService.getAccountList(accountListReq).subscribe(data => this.accountBankCashIdOption.set(data.map((c: any) => ({ id: c.id, text: c.subHead.toLowerCase() }))));
      this.accountListService.getAccountList(headIdReq).subscribe(data => this.headIdOption.set(data.map((c: any) => ({ id: c.id, text: c.subHead.toLowerCase() }))));
      this.vendorService.getVendor('').subscribe(data => this.vendorIdOption.set(data.map((c: any) => ({ id: c.id, text: c.name.toLowerCase() }))));
    });
  }

  onLoadJournal() {
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

  onTransactionTypeChange() {
    this.transactionType.set(this.form.value.transactionType)
    this.onLoadVoucher();
    this.onLoadDropdown();
  }

  // Form Field ----------------------------------------------------------------

  form = this.fb.group({
    transactionType: [{ value: 'BalanceSheet', disabled: false }, Validators.required],
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

  debitVoucherForm = this.fb.group({
    id: [""],
    headId: ["", Validators.required],
    subHeadId: [""],
    debitAmount: [''],
    remarks: [''],
    voucherId: [""],
  });

  creditVoucherForm = this.fb.group({
    id: [""],
    headId: ["", Validators.required],
    subHeadId: [""],
    creditAmount: [''],
    remarks: [''],
    voucherId: [""],
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
    if (this.debitVoucherForm.value.headId == this.creditVoucherForm.value.headId) {
      alert("Debit Voucher Head and Credit Voucher Head must be unique!");
      return;
    }
    const findDebitVoucherHead = this.dataArray.find(v => v.headId == this.debitVoucherForm.value.headId);
    const findCreditVoucherHead = this.dataArray.find(v => v.headId == this.creditVoucherForm.value.headId);
    console.log(findDebitVoucherHead, findCreditVoucherHead);
    console.log(this.debitVoucherForm.value.subHeadId, this.creditVoucherForm.value.subHeadId);
    if ((findDebitVoucherHead && !this.debitVoucherForm.value.subHeadId) || (findCreditVoucherHead && !this.creditVoucherForm.value.subHeadId)) {
      alert("This Voucher Head Already Added in Voucher Details!");
      return;
    }
    const accountGroup = this.transactionType() === "BalanceSheet" ? ["Current Asset", "NonCurrent/Fixed Asset", "Current Liability", "NonCurrent Liability", "Equity"] : [this.transactionType()];
    if (this.debitVoucherForm.valid && this.debitVoucherForm.value.headId) {
      if (this.debitVoucherForm.value.debitAmount) {
        const headId = this.debitVoucherForm.value.headId;
        let children = [];
        this.accountListService.getAccountList({
          "allbyheadId": +headId,
          "accountGroup": accountGroup
        }).subscribe(accountData => {
          children = accountData.map((c: any) => ({ id: c.id, text: c.subHead.toLowerCase() }))
          if (children.length > 0 && !this.debitVoucherForm.value.subHeadId) {
            alert(`Head is Not Valid Form Voucher Details`);
            return;
          }
          const data = this.debitVoucherForm.value;
          const addData = { ...data, headId: Number(data.headId), subHeadId: data.subHeadId ? Number(data.subHeadId) : null, debitAmount: data.debitAmount ? Number(data.debitAmount) : null, remarks: data.remarks || " " }
          if (this.selectedVoucherDetails) {
            this.dataArray[this.selectedVoucherDetailsIndex] = addData;
            this.selectedVoucherDetails = null;
            this.selectedVoucherDetailsIndex = null;
          } else {
            this.dataArray.push(addData);
          }
          this.debitVoucherForm.reset();
          this.totalDebitAmount = this.dataArray.reduce((prev, data) => prev + (data.debitAmount || 0), 0);
        });
      } else {
        alert('Debit Amount Must Be Gater Than 0');
      }
    }
    if (this.creditVoucherForm.valid && this.creditVoucherForm.value.headId) {
      if (this.creditVoucherForm.value.creditAmount) {
        const headId = this.creditVoucherForm.value.headId;
        let children = [];
        this.accountListService.getAccountList({
          "allbyheadId": +headId,
          "accountGroup": accountGroup
        }).subscribe(accountData => {
          children = accountData.map((c: any) => ({ id: c.id, text: c.subHead.toLowerCase() }))
          if (children.length > 0 && !this.creditVoucherForm.value.subHeadId) {
            alert(`Head is Not Valid Form Voucher Details`);
            return;
          }
          const data = this.creditVoucherForm.value;
          const addData = { ...data, headId: Number(data.headId), subHeadId: data.subHeadId ? Number(data.subHeadId) : null, creditAmount: data.creditAmount ? Number(data.creditAmount) : null, remarks: data.remarks || " " }
          if (this.selectedVoucherDetails) {
            this.dataArray[this.selectedVoucherDetailsIndex] = addData;
            this.selectedVoucherDetails = null;
            this.selectedVoucherDetailsIndex = null;
          } else {
            this.dataArray.push(addData);
          }
          this.creditVoucherForm.reset();
          this.totalCreditAmount = this.dataArray.reduce((prev, data) => prev + (data.creditAmount || 0), 0);
        });
      } else {
        alert('Credit Amount Must Be Gater Than 0');
      }


    }
    else {
      alert('Form is invalid! Please Fill and Head Field.');
    }
    this.form.get('transactionType')?.disable();
  }

  editData(index: number) {
    this.selectedVoucherDetails = this.dataArray[index];
    this.selectedVoucherDetailsIndex = index;
    if (this.selectedVoucherDetails?.debitAmount) {
      this.debitVoucherForm.patchValue({
        id: this.selectedVoucherDetails?.id,
        headId: this.selectedVoucherDetails?.headId,
        subHeadId: this.selectedVoucherDetails?.subHeadId,
        voucherId: this.selectedVoucherDetails?.voucherId,
        debitAmount: this.selectedVoucherDetails?.debitAmount,
        remarks: this.selectedVoucherDetails?.remarks,
      });
      const debitSubHeadIdReq = {
        "headId": this.debitVoucherForm.value.headId,
        "allbyheadId": this.debitVoucherForm.value.headId
      };
      this.accountListService.getAccountList(debitSubHeadIdReq).subscribe(data => {
        this.debitSubHeadIdOption.set(data.map((c: any) => ({ id: c.id, text: c.subHead.toLowerCase() })))
        this.totalDebitAmount = this.dataArray.reduce((prev, data) => prev + data.debitAmount, 0);
      });
    }
    if (this.selectedVoucherDetails?.creditAmount) {
      this.creditVoucherForm.patchValue({
        id: this.selectedVoucherDetails?.id,
        headId: this.selectedVoucherDetails?.headId,
        subHeadId: this.selectedVoucherDetails?.subHeadId,
        voucherId: this.selectedVoucherDetails?.voucherId,
        creditAmount: this.selectedVoucherDetails?.creditAmount,
        remarks: this.selectedVoucherDetails?.remarks,
      });
      const creditSubHeadIdReq = {
        "headId": this.creditVoucherForm.value.headId,
        "allbyheadId": this.creditVoucherForm.value.headId
      };
      this.accountListService.getAccountList(creditSubHeadIdReq).subscribe(data => {
        this.creditSubHeadIdOption.set(data.map((c: any) => ({ id: c.id, text: c.subHead.toLowerCase() })));
        this.totalCreditAmount = this.dataArray.reduce((prev, data) => prev + data.creditAmount, 0);
      });
    }

  }

  updateData() {
    if (this.selectedVoucher && this.dataArray.length > 0 && !this.selectedVoucherDetails) {
      alert("You don't add a Voucher details in editing mode!");
      return;
    }
    const accountGroup = this.transactionType() === "BalanceSheet" ? ["Current Asset", "NonCurrent/Fixed Asset", "Current Liability", "NonCurrent Liability", "Equity"] : [this.transactionType()]
    if (this.debitVoucherForm.valid && this.debitVoucherForm.value.headId) {
      if (this.debitVoucherForm.value.debitAmount) {
        const headId = this.debitVoucherForm.value.headId;
        let children = [];
        this.accountListService.getAccountList({
          "allbyheadId": +headId,
          "accountGroup": accountGroup
        }).subscribe(accountData => {
          children = accountData.map((c: any) => ({ id: c.id, text: c.subHead.toLowerCase() }))
          if (children.length > 0 && !this.debitVoucherForm.value.subHeadId) {
            alert(`Head is Not Valid Form Voucher Details`);
            return;
          }
          const data = this.debitVoucherForm.value;
          const addData = { ...data, headId: Number(data.headId), subHeadId: data.subHeadId ? Number(data.subHeadId) : null, debitAmount: data.debitAmount ? Number(data.debitAmount) : null }
          if (this.selectedVoucherDetails) {
            this.dataArray[this.selectedVoucherDetailsIndex] = addData;
            this.selectedVoucherDetails = null;
            this.selectedVoucherDetailsIndex = null;
          } else {
            this.dataArray.push(addData);
          }
          this.debitVoucherForm.reset();
          this.totalDebitAmount = this.dataArray.reduce((prev, data) => prev + (data.debitAmount || 0), 0);
        });
      } else {
        alert('Debit Amount Must Be Gater Than 0');
      }


    }
    else if (this.creditVoucherForm.valid && this.creditVoucherForm.value.headId) {
      if (this.creditVoucherForm.value.creditAmount) {
        const headId = this.creditVoucherForm.value.headId;
        let children = [];
        this.accountListService.getAccountList({
          "allbyheadId": +headId,
          "accountGroup": accountGroup
        }).subscribe(accountData => {
          children = accountData.map((c: any) => ({ id: c.id, text: c.subHead.toLowerCase() }))
          if (children.length > 0 && !this.creditVoucherForm.value.subHeadId) {
            alert(`Head is Not Valid Form Voucher Details`);
            return;
          }
          const data = this.creditVoucherForm.value;
          const addData = { ...data, headId: Number(data.headId), subHeadId: data.subHeadId ? Number(data.subHeadId) : null, creditAmount: data.creditAmount ? Number(data.creditAmount) : null }
          if (this.selectedVoucherDetails) {
            this.dataArray[this.selectedVoucherDetailsIndex] = addData;
            this.selectedVoucherDetails = null;
            this.selectedVoucherDetailsIndex = null;
          } else {
            this.dataArray.push(addData);
          }
          this.creditVoucherForm.reset();
          this.totalCreditAmount = this.dataArray.reduce((prev, data) => prev + (data.creditAmount || 0), 0);
        });
      } else {
        alert('Credit Amount Must Be Gater Than 0');
      }


    }
    else {
      alert('Form is invalid! Please Fill and Head Field.');
    }
    this.form.get('transactionType')?.disable();
  }

  deleteData(index: number) {
    this.dataArray.splice(index, 1);
    this.totalDebitAmount = this.dataArray.reduce((prev, data) => prev + (data.debitAmount || 0), 0);
    this.totalCreditAmount = this.dataArray.reduce((prev, data) => prev + (data.creditAmount || 0), 0);
  }

  onSubmit(e: Event) {
    // NOTE: This method applies only when totalCreditAmount !== totalDebitAmount
    if (this.totalCreditAmount !== this.totalDebitAmount) {
      alert('Debit and Credit Amount Must be Equal!');
      return;
    }
    // TODO: This method
    this.isSubmitted = true;
    // console.log(this.form.value);
    if (this.form.valid && this.dataArray.length > 0) {
      this.isSubmitting.set(true);
      this.form.get('transactionType')?.enable();
      const restData = this.form.value;
      const voucherFormData = { ...restData, vendorId: restData.vendorId ? Number(restData.vendorId) : null, amount: this.totalDebitAmount }
      // console.log(this.form.value);
      if (this.selectedVoucher) {
        const editData = { ...voucherFormData, editVoucherDetailDto: this.dataArray };
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
                }, 1000);
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
        const addData = { ...voucherFormData, particular: remarks.join(','), createVoucherDetailDto };
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
                }, 1000);
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
          }, 1000);
        } else {
          console.error('Error deleting Voucher:', data);
          alert('Error deleting Voucher: ' + data.message)
        }
      });
    }
  }

  resetForm(e: Event) {
    e.preventDefault();
    this.form.patchValue({
      voucherDate: '',
      voucherNo: '',
      vendorId: '',
      payTo: '',
      amount: '',
      remarks: '',
      coaMap: '',
      receiveFrom: '',
      particular: ''
    });
    const today = new Date();
    this.form.patchValue({
      voucherDate: today.toISOString().split('T')[0]
    });
    this.debitVoucherForm.reset();
    this.creditVoucherForm.reset();
    this.selectedVoucher = null;
    this.isSubmitted = false;
    this.totalDebitAmount = 0;
    this.totalCreditAmount = 0;
    this.dataArray = [];
    this.selectedVoucherDetails = null;
    this.debitSubHeadIdOption.set([]);
    this.creditSubHeadIdOption.set([]);
    this.form.get('transactionType')?.enable();
  }

  onUpdate(id: any) {
    const reqData = {
      "id": id,
      "search": "",
      "transactionType": null,
      "fromDate": null,
      "toDate": null
    }
    this.voucherService.getVoucher(reqData).subscribe((data: any) => {
      console.log(data)
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
        });
        this.selectedVoucher = data[0];

        const editDetails = (this.transactionType() === "BalanceSheet" || this.transactionType() === "Contra") ? data[0].voucherDetailDto : data[0].voucherDetailDto.slice(0, data[0].voucherDetailDto.length - 1);

        this.dataArray = editDetails.map((detail: any) => {//+
          return {
            id: detail.id,
            voucherId: detail.voucherId,
            headId: detail.headId,
            subHeadId: detail.subHeadId,
            debitAmount: detail.debitAmount,
            creditAmount: detail.creditAmount,
            remarks: detail.remarks
          };
        });
        this.form.get('transactionType')?.disable();
        this.totalDebitAmount = this.dataArray.reduce((prev, v) => prev + v.debitAmount, 0);
        this.totalCreditAmount = this.dataArray.reduce((prev, v) => prev + v.creditAmount, 0);
      }
    });



    // Focus the 'Name' input field after patching the value
    setTimeout(() => {
      const inputs = this.inputRefs.toArray();
      inputs[0].nativeElement.focus();
    }, 0); // Delay to ensure the DOM is updated
  }


  // Utility methods----------------------------------------------------------------------

  onDebitHeadSelected(selected: any): void {
    // console.log('Selected :', selected);
    this.debitVoucherForm.patchValue({
      headId: selected?.id
    });
  }

  onCreditHeadSelected(selected: any): void {
    // console.log('Selected :', selected);
    this.creditVoucherForm.patchValue({
      headId: selected?.id
    });
  }

  focusFirstInput() {
    const inputs = this.inputRefs.toArray();
    if (inputs.length) {
      inputs[0].nativeElement.focus();
    }
  }

  displayHead(id: any) {
    return this.allOption().find((option: any) => option.id == id)?.text ?? "";
  }

  onHeadChanged(e: Event, type: string) {
    e.preventDefault();
    const selectElement = e.target as HTMLSelectElement;
    const selectedValue = selectElement.value;

    if (type === "debit") {
      const debitSubHeadIdReq = {
        "headId": +selectedValue,
        "allbyheadId": +selectedValue
      };
      this.accountListService.getAccountList(debitSubHeadIdReq).subscribe(data => {
        this.debitSubHeadIdOption.set(data.map((c: any) => ({ id: c.id, text: c.subHead.toLowerCase() })))
      });
      type = "";
    }

    if (type === "credit") {
      const creditSubHeadIdReq = {
        "headId": +selectedValue,
        "allbyheadId": +selectedValue
      };
      this.accountListService.getAccountList(creditSubHeadIdReq).subscribe(data => {
        this.creditSubHeadIdOption.set(data.map((c: any) => ({ id: c.id, text: c.subHead.toLowerCase() })))
      });
      type = "";
    }

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
    doc.text(`${this.transactionType()} Reports`, pageWidth / 2 + marginLeft, marginTop, { align: 'center' });
    marginTop += 5;

    doc.setFontSize(10);

    if (this.fromDate()) {
      const dateRange = `From: ${this.transform(this.fromDate())} to: ${this.toDate() ? this.transform(this.toDate()) : this.transform(this.fromDate())
        }`;
      doc.text(dateRange, pageWidth / 2 + marginLeft, marginTop, { align: 'center' });
      marginTop += 4;
    }

    // Prepare Table Data
    const dataRows = this.filteredVoucherList().map((data: any) => [
      this.transform(data?.voucherDate),
      data?.voucherNo || '',
      data?.amount?.toFixed(2) || 0,
      data?.particular || '',
      data?.remarks || '',
    ]);

    // const totalAmount = this.filteredVoucherList().reduce((sum: number, data: any) => sum + (data.amount || 0), 0);
    // const totalDiscount = this.filteredVoucherList().reduce((sum: number, data: any) => sum + (data.discount || 0), 0);

    // Render Table
    (doc as any).autoTable({
      head: [['VoucherDate', 'VoucherNo', "Amount", "Particular", 'Remarks']],
      body: dataRows,
      foot: [
        [
          '', '',
          this.totalAmount().toFixed(2),
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
