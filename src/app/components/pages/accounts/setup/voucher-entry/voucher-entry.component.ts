import { Component, ElementRef, inject, QueryList, signal, ViewChild, ViewChildren } from '@angular/core';
import { FormArray, FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BankService } from '../../../../../services/bank.service';
import { DataFetchService } from '../../../../../services/useDataFetch';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ToastSuccessComponent } from '../../../../shared/toast/toast-success/toast-success.component';
import { FieldComponent } from '../../../../shared/field/field.component';
import { AccountListService } from '../../../../../services/account-list.service';
import { VendorService } from '../../../../../services/vendor.service';
import { VoucherService } from '../../../../../services/voucher.service';

@Component({
  selector: 'app-voucher-entry',
  imports: [CommonModule, ToastSuccessComponent, FieldComponent, ReactiveFormsModule],
  templateUrl: './voucher-entry.component.html',
  styleUrl: './voucher-entry.component.css'
})
export class VoucherEntryComponent {
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
  accountBankCashIdOption: any = [];
  vendorIdOption: any = [];
  headIdOption: any = [];
  subHeadIdOption: any = [];
  allOption: any = [];
  date: any = new Date();
  todayDate: any;
  dataArray: any[] = [];
  totalAmount: number = 0;

  private searchQuery$ = new BehaviorSubject<string>('');
  isLoading$: Observable<any> | undefined;
  hasError$: Observable<any> | undefined;
  @ViewChildren('inputRef') inputRefs!: QueryList<ElementRef>;
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  isSubmitted = false;



  form = this.fb.group({
    transactionType: ['Payment', Validators.required],
    coaMap: [''],
    voucherDate: ["", Validators.required],
    accountBankCashId: ["", Validators.required],
    vendorId: [''],
    receiveFrom: [''],
    payTo: [''],
    amount: [''],
    particular: [''],
    remarks: ['']
  });

  addVoucherForm = this.fb.group({
    headId: ["", Validators.required],
    subHeadId: [""],
    debitAmount: [''],
    remarks: [''],
  });

  addData() {
    if (this.addVoucherForm.valid && this.addVoucherForm.value.headId) {
      const data = this.addVoucherForm.value;
      const addData = { ...data, headId: Number(data.headId), subHeadId: data.subHeadId ? Number(data.subHeadId) : null, debitAmount: data.debitAmount ? Number(data.debitAmount) : null }
      this.dataArray.push(addData);
      this.addVoucherForm.reset();

      this.totalAmount = this.dataArray.reduce((prev, data) => prev + data.debitAmount, 0);
    } else {
      alert('Form is invalid! Please Fill Head Field.');
    }
  }

  deleteData(index: number) {
    this.dataArray.splice(index, 1);
  }

  ngOnInit() {
    const today = new Date();
    this.todayDate = today.toISOString().split('T')[0];
    this.form.patchValue({
      voucherDate: today.toISOString().split('T')[0]
    });
    this.onLoadVoucher();
    setTimeout(() => this.focusFirstInput(), 10);
  }

  ngAfterViewInit() {
    this.onLoadDropdown();
  }

  focusFirstInput() {
    const inputs = this.inputRefs.toArray();
    if (inputs.length) {
      inputs[0].nativeElement.focus();
    }
  }

  onLoadVoucher() {
    const reqData = {
      "search": "",
      "fromDate": "2024-12-10T04:41:08.409Z",
      "toDate": "2024-12-29T04:41:08.409Z"
    }
    const { data$, isLoading$, hasError$ } = this.dataFetchService.fetchData(this.voucherService.getVoucher(reqData));

    data$.subscribe(data => {
      this.filteredVoucherList.set(data)
    });

    this.isLoading$ = isLoading$;
    this.hasError$ = hasError$;
  }

  onLoadDropdown() {
    const allListReq = {
      "headId": null,
      "search": null,
      "coaMap": [],
      "accountGroup": []
    }
    const accountListReq = {
      "headId": null,
      "search": null,
      "coaMap": [
        "cash", "bank"
      ]
    }
    const headIdReq = {
      "headId": null,
      "search": null,
      "coaMap": [],
      "accountGroup": [
        "Expenses"
      ]
    }
    this.accountListService.getAccountList(allListReq).subscribe(data => this.allOption = data.map((c: any) => ({ id: c.id, text: c.subHead.toLowerCase() })));
    this.accountListService.getAccountList(accountListReq).subscribe(data => this.accountBankCashIdOption = data.map((c: any) => ({ id: c.id, text: c.subHead.toLowerCase() })));
    this.accountListService.getAccountList(headIdReq).subscribe(data => this.headIdOption = data.map((c: any) => ({ id: c.id, text: c.subHead.toLowerCase() })));
    this.vendorService.getVendor('').subscribe(data => this.vendorIdOption = data.map((c: any) => ({ id: c.id, text: c.name.toLowerCase() })));
  }

  displaySubHead(id: any) {
    return this.allOption.find((option: any) => option.id == id)?.text;
  }

  onHeadChanged(e: Event) {
    e.preventDefault();
    const selectElement = e.target as HTMLSelectElement;
    const selectedValue = selectElement.value;
    this.subHeadIdOption = []

    const subHeadIdReq = {
      "headId": +selectedValue,
      "search": null,
      "coaMap": [],
      "accountGroup": []
    };
    this.accountListService.getAccountList(subHeadIdReq).subscribe(data => {
      this.subHeadIdOption = data.map((c: any) => ({ id: c.id, text: c.subHead.toLowerCase() }))
    });
  }

  onSearchBank(event: Event) {
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    this.searchQuery$.next(query);
  }

  // Simplified method to get form controls
  getControl(controlName: string): FormControl {
    return this.form.get(controlName) as FormControl;
  }


  handleEnterKey(event: Event, currentIndex: number) {
    const keyboardEvent = event as KeyboardEvent;
    event.preventDefault();
    const allInputs = this.inputRefs.toArray();
    const inputs = allInputs.filter((i: any) => !i.nativeElement.disabled);

    if (currentIndex + 1 < inputs.length) {
      inputs[currentIndex + 1].nativeElement.focus();
    } else {
      this.addData();
      inputs[5].nativeElement.focus();
    }
  }

  handleSearchKeyDown(event: KeyboardEvent) {
    if (this.filteredVoucherList().length === 0) {
      return; // Exit if there are no items to navigate
    }

    if (event.key === 'Tab') {
      event.preventDefault();
      const inputs = this.inputRefs.toArray();
      inputs[0].nativeElement.focus();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault(); // Prevent default scrolling behavior
      this.highlightedTr = (this.highlightedTr + 1) % this.filteredVoucherList().length;
    } else if (event.key === 'ArrowUp') {
      event.preventDefault(); // Prevent default scrolling behavior
      this.highlightedTr =
        (this.highlightedTr - 1 + this.filteredVoucherList().length) % this.filteredVoucherList().length;
    } else if (event.key === 'Enter') {
      event.preventDefault(); // Prevent form submission

      // Call onUpdate for the currently highlighted item
      if (this.highlightedTr !== -1) {
        const selectedItem = this.filteredVoucherList()[this.highlightedTr];
        this.onUpdate(selectedItem);
        this.highlightedTr = -1;
      }
    }
  }

  onSubmit(e: Event) {
    this.isSubmitted = true;
    console.log(this.form.value);
    if (this.form.valid) {
      const restData = this.form.value;
      const voucherFormData = { ...restData, accountBankCashId: Number(restData.accountBankCashId), vendorId: restData.vendorId ? Number(restData.vendorId) : null, amount: this.totalAmount, VoucherNo: "" }
      // console.log(this.form.value);
      if (this.selectedVoucher) {
        // this.bankService.updateBank(this.selectedVoucher.id, this.form.value)
        //   .subscribe({
        //     next: (response) => {
        //       if (response !== null && response !== undefined) {
        //         this.success.set("Bank successfully updated!");
        //         const rest = this.filteredVoucherList().filter(d => d.id !== response.id);
        //         this.filteredVoucherList.set([response, ...rest]);
        //         this.isSubmitted = false;
        //         this.selectedVoucher = null;
        //         this.resetForm(e);
        //         setTimeout(() => {
        //           this.success.set("");
        //         }, 3000);
        //       }

        //     },
        //     error: (error) => {
        //       console.error('Error register:', error);
        //     }
        //   });
      } else {
        const addData = { ...voucherFormData, createVoucherDetailDto: this.dataArray }
        this.voucherService.addVoucher(addData)
          .subscribe({
            next: (response) => {
              if (response !== null && response !== undefined) {
                this.success.set("Voucher successfully added!");
                this.dataArray = [];
                this.filteredVoucherList.set([response, ...this.filteredVoucherList()])
                this.isSubmitted = false;
                this.resetForm(e);
                setTimeout(() => {
                  this.success.set("");
                }, 3000);
              }

            },
            error: (error) => {
              if (error.error.message) {
                alert(`${error.error.status} : ${error.error.message}`)
              }
              console.error('Error register:', error);
            }
          });
      }
    } else {
      alert('Form is invalid! Please Fill All Required Field.');
    }
  }

  onUpdate(data: any) {
    this.selectedVoucher = data;
    // this.form.patchValue({
    //   name: data?.name,
    //   address: data?.address,
    //   remarks: data?.remarks,
    // });

    // Focus the 'Name' input field after patching the value
    setTimeout(() => {
      const inputs = this.inputRefs.toArray();
      inputs[0].nativeElement.focus();
    }, 0); // Delay to ensure the DOM is updated
  }

  onDelete(id: any) {
    // if (confirm("Are you sure you want to delete?")) {
    //   this.bankService.deleteBank(id).subscribe(data => {
    //     if (data.id) {
    //       this.success.set("Bank deleted successfully!");
    //       this.filteredVoucherList.set(this.filteredVoucherList().filter(d => d.id !== id));
    //       setTimeout(() => {
    //         this.success.set("");
    //       }, 3000);
    //     } else {
    //       console.error('Error deleting Bank:', data);
    //       alert('Error deleting Bank: ' + data.message)
    //     }
    //   });
    // }
  }

  resetForm(e: Event) {
    e.preventDefault();
    this.form.reset();
    this.isSubmitted = false;
    this.totalAmount = 0;
    this.dataArray = [];
  }

}


