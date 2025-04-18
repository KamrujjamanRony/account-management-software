import { CommonModule, DatePipe } from '@angular/common';
import { Component, ElementRef, inject, signal, viewChildren } from '@angular/core';
import { FieldComponent } from '../../../../shared/components/field/field.component';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AllSvgComponent } from '../../../../shared/components/svg/all-svg/all-svg.component';
import { Observable } from 'rxjs';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { AccountListService } from '../../../services/account-list.service';
import { VendorService } from '../../../services/vendor.service';
import { VoucherService } from '../../../services/voucher.service';
import { AccountingReportsService } from '../../../services/accounting-reports.service';
import { DataFetchService } from '../../../../shared/services/useDataFetch';
import { DataService } from '../../../../shared/services/data.service';
import { ToastService } from '../../../../shared/components/primeng/toast/toast.service';

@Component({
  selector: 'app-journal-voucher',
  imports: [CommonModule, FieldComponent, ReactiveFormsModule, AllSvgComponent, FormsModule],
  templateUrl: './journal-voucher.component.html',
  styleUrl: './journal-voucher.component.css'
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
  highlightedTr: number = -1;
  selectedVoucher: any;
  selectedVoucherDetails: any;
  selectedVoucherDetailsIndex: any;
  transactionTypeOption = [
    { id: "BalanceSheet", text: "Balance-Sheet" },
    { id: "Contra", text: "Contra" },
  ];
  filteredVoucherList = signal<any[]>([]);
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
      voucherDate: today.toISOString().split('T')[0]
    });

    this.transactionType.set(this.form.value.transactionType)
    this.onLoadVoucher();
    this.accountListService.getAccountList({ "allbyheadId": 1 }).subscribe(data => this.allOption.set(data.map((c: any) => ({ id: c.id, text: c.subHead.toLowerCase() }))));
    setTimeout(() => this.focusFirstInput(), 10);
    this.dataService.getHeader().subscribe(data => this.header.set(data));
  }

  ngAfterViewInit() {
    this.onLoadJournal();
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

  onLoadJournal() {
    this.accountListService.getAccountList({
      "allbyheadId": 1,
      "search": null,
      "coaMap": [],
      "accountGroup": ["Current Asset", "NonCurrent/Fixed Asset", "Current Liability", "NonCurrent Liability", "Equity"]
    }).subscribe(data => this.headIdOption.set(data.map((c: any) => ({ id: c.id, text: c.subHead.toLowerCase() }))));
    this.vendorService.getVendor('').subscribe(data => this.vendorIdOption.set(data.map((c: any) => ({ id: c.id, text: c.name.toLowerCase() }))));
    this.accountingReportsService.getCurrentBalanceApi({}).subscribe(data => this.accountBankCashIdOption.set(data.map((c: any) => ({ id: c.headId, text: c.subHead }))));
  }

  onTransactionTypeChange() {
    this.transactionType.set(this.form.value.transactionType)
    this.onLoadVoucher();
    this.onLoadJournal();
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
      this.toastService.showMessage('warn', 'Warning', "You don't add a Voucher details in editing mode!");
      return;
    }
    if (this.debitVoucherForm.value.headId == this.creditVoucherForm.value.headId) {
      this.toastService.showMessage('warn', 'Warning', "Debit Voucher Head and Credit Voucher Head must be unique!");
      return;
    }
    const findDebitVoucherHead = this.dataArray.find(v => v.headId == this.debitVoucherForm.value.headId);
    const findCreditVoucherHead = this.dataArray.find(v => v.headId == this.creditVoucherForm.value.headId);
    console.log(findDebitVoucherHead, findCreditVoucherHead);
    console.log(this.debitVoucherForm.value.subHeadId, this.creditVoucherForm.value.subHeadId);
    if ((findDebitVoucherHead && !this.debitVoucherForm.value.subHeadId) || (findCreditVoucherHead && !this.creditVoucherForm.value.subHeadId)) {
      this.toastService.showMessage('warn', 'Warning', "This Voucher Head Already Added in Voucher Details!");
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
            this.toastService.showMessage('warn', 'Warning', 'Head is Not Valid Form Voucher Details');
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
        this.toastService.showMessage('warn', 'Warning', 'Debit Amount Must Be Gater Than 0');
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
            this.toastService.showMessage('warn', 'Warning', 'Head is Not Valid Form Voucher Details');
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
        this.toastService.showMessage('warn', 'Warning', 'Credit Amount Must Be Gater Than 0');
      }


    }
    else {
      this.toastService.showMessage('warn', 'Warning', 'Form is invalid! Please Fill All Requirement Field.');
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
      this.toastService.showMessage('warn', 'Warning', "You don't add a Voucher details in editing mode!");
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
            this.toastService.showMessage('warn', 'Warning', 'Head is Not Valid Form Voucher Details');
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
        this.toastService.showMessage('warn', 'Warning', 'Debit Amount Must Be Gater Than 0');
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
            this.toastService.showMessage('warn', 'Warning', 'Head is Not Valid Form Voucher Details');
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
        this.toastService.showMessage('warn', 'Warning', 'Credit Amount Must Be Gater Than 0');
      }


    }
    else {
      this.toastService.showMessage('warn', 'Warning', 'Form is invalid! Please Fill All Requirement Field.');
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
      this.toastService.showMessage('warn', 'Warning', 'Debit and Credit Amount Must be Equal!');
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
                this.toastService.showMessage('success', 'Successful', '"Voucher successfully updated!');
                const rest = this.filteredVoucherList().filter(d => d.id !== response.id);
                this.filteredVoucherList.set([...rest, response]);
                this.isSubmitted = false;
                this.selectedVoucher = null;
                this.resetForm(e);
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
                this.toastService.showMessage('success', 'Successful', 'Voucher successfully added!');
                this.dataArray = [];
                this.filteredVoucherList.set([...this.filteredVoucherList(), response])
                this.isSubmitted = false;
                this.resetForm(e);
                this.isSubmitting.set(false);
              }

            },
            error: (error) => {
              if (error.error.message || error.error.title) {
                this.toastService.showMessage('error', 'Error', `${error.error.status} : ${error.error.message || error.error.title}`);
                this.isSubmitting.set(false);
              }
              console.error('Error add:', error);
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
          this.toastService.showMessage('success', 'Successful', 'Voucher deleted successfully!');
          this.filteredVoucherList.set(this.filteredVoucherList().filter(d => d.id !== id));
        } else {
          console.error('Error deleting Voucher:', data);
          this.toastService.showMessage('error', 'Error', `Error deleting Voucher : ${data.message}`);
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
      const inputs = this.inputRefs();
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
    const inputs = this.inputRefs();
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
    const inputs = this.inputRefs();
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
    let marginTop = (this.header()?.marginTop | 0) + 10;
    const marginBottom = 10;

    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'A4' });

    // Header Section
    // Get the exact center of the page (considering margins)
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

    // Title Section
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
