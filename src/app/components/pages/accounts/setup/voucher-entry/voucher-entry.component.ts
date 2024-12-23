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
  dataFetchService = inject(DataFetchService);
  filteredBankList = signal<any[]>([]);
  highlightedTr: number = -1;
  success = signal<any>("");
  selectedBank: any;
  accountBankCashIdOption: any = [];
  vendorIdOption: any = [];
  headIdOption: any = [];
  subHeadIdOption: any = [];
  date: any = new Date();
  today: any = this.date.toString().split('T')[0];

  private searchQuery$ = new BehaviorSubject<string>('');
  isLoading$: Observable<any> | undefined;
  hasError$: Observable<any> | undefined;
  @ViewChildren('inputRef') inputRefs!: QueryList<ElementRef>;
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  isSubmitted = false;



  form = this.fb.group({
    transactionType: ['Payment', Validators.required],
    coaMap: [''],
    voucherDate: [this.today, Validators.required],
    voucherNo: [''],
    accountBankCashId: [0, Validators.required],
    vendorId: [0],
    receiveFrom: [''],
    payTo: [''],
    amount: ['', Validators.required],
    particular: [''],
    remarks: [''],
    createVoucherDetailDto: this.fb.array([]),
    editVoucherDetailDto: this.fb.array([]),
  });

  ngOnInit() {
    this.onLoadBanks();
    this.onLoadDropdown();
    setTimeout(() => this.focusFirstInput(), 10);
  }

  focusFirstInput() {
    const inputs = this.inputRefs.toArray();
    if (inputs.length) {
      inputs[0].nativeElement.focus();
    }
  }

  onLoadBanks() {
    const { data$, isLoading$, hasError$ } = this.dataFetchService.fetchData(this.bankService.getBank(''));

    this.isLoading$ = isLoading$;
    this.hasError$ = hasError$;

    combineLatest([data$, this.searchQuery$])
      .pipe(
        map(([data, query]) =>
          data.filter((bankData: any) =>
            ['name', 'address', 'remarks'].some((key) =>
              bankData[key]?.toLowerCase().includes(query)
            )
          )
        )
      )
      .subscribe((filteredData) => this.filteredBankList.set(filteredData.reverse()));
  }

  onLoadDropdown() {
    const accountListReq = {
      "headId": null,
      "search": null,
      "coaMap": [
        "cash", "bank"
      ],
      "accountGroup": [
        "Current Asset"
      ]
    }
    const headIdReq = {
      "headId": null,
      "search": null,
      "coaMap": [],
      "accountGroup": [
        "Current Asset"
      ]
    }
    this.accountListService.getAccountList(accountListReq).subscribe(data => this.accountBankCashIdOption = data.map((c: any) => ({ id: c.id, text: c.subHead.toLowerCase() })));
    this.accountListService.getAccountList(headIdReq).subscribe(data => this.headIdOption = data.map((c: any) => ({ id: c.id, text: c.subHead.toLowerCase() })));
    this.vendorService.getVendor('').subscribe(data => this.vendorIdOption = data.map((c: any) => ({ id: c.id, text: c.name.toLowerCase() })));
  }

  onHeadChanged(e: Event){
    e.preventDefault();
    // console.log(this.form.get('createVoucherDetailDto')?.value?.map((item: any) => item.headId));
    const selectElement = e.target as HTMLSelectElement;
    const selectedValue = selectElement.value;
    
    const subHeadIdReq = {
      "headId": selectedValue,
      "search": null,
      "coaMap": [
        "cash", "bank"
      ],
      "accountGroup": [
        "Current Asset"
      ]
    }
    console.log(subHeadIdReq)
    this.accountListService.getAccountList(subHeadIdReq).subscribe(data => this.subHeadIdOption = data.map((c: any) => ({ id: c.id, text: c.subHead.toLowerCase() })));
  }

  onSearchBank(event: Event) {
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    this.searchQuery$.next(query);
  }

  get createVoucherDetailDto(): FormArray {
    return this.form.get('createVoucherDetailDto') as FormArray;
  }

  get editVoucherDetailDto(): FormArray {
    return this.form.get('editVoucherDetailDto') as FormArray;
  }

  addCreateVoucherDetail() {
    this.createVoucherDetailDto.push(
      this.fb.group({
        voucherId: [0],
        headId: [0, Validators.required],
        subHeadId: [0],
        debitAmount: [0],
        creditAmount: [0],
        remarks: [''],
      })
    );
  }

  addEditVoucherDetail() {
    this.editVoucherDetailDto.push(
      this.fb.group({
        id: [0],
        voucherId: [0],
        headId: [0, Validators.required],
        headName: [''],
        subHeadId: [0],
        subHeadName: [''],
        debitAmount: [0],
        creditAmount: [0],
        remarks: [''],
      })
    );
  }

  removeCreateVoucherDetail(index: number) {
    this.createVoucherDetailDto.removeAt(index);
  }

  removeEditVoucherDetail(index: number) {
    this.editVoucherDetailDto.removeAt(index);
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
      this.onSubmit(keyboardEvent);
    }
  }

  handleSearchKeyDown(event: KeyboardEvent) {
    if (this.filteredBankList().length === 0) {
      return; // Exit if there are no items to navigate
    }

    if (event.key === 'Tab') {
      event.preventDefault();
      const inputs = this.inputRefs.toArray();
      inputs[0].nativeElement.focus();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault(); // Prevent default scrolling behavior
      this.highlightedTr = (this.highlightedTr + 1) % this.filteredBankList().length;
    } else if (event.key === 'ArrowUp') {
      event.preventDefault(); // Prevent default scrolling behavior
      this.highlightedTr =
        (this.highlightedTr - 1 + this.filteredBankList().length) % this.filteredBankList().length;
    } else if (event.key === 'Enter') {
      event.preventDefault(); // Prevent form submission

      // Call onUpdate for the currently highlighted item
      if (this.highlightedTr !== -1) {
        const selectedItem = this.filteredBankList()[this.highlightedTr];
        this.onUpdate(selectedItem);
        this.highlightedTr = -1;
      }
    }
  }

  onSubmit(e: Event) {
    this.isSubmitted = true;
    console.log(this.form.value);
    if (this.form.valid) {
      // console.log(this.form.value);
      if (this.selectedBank) {
        this.bankService.updateBank(this.selectedBank.id, this.form.value)
          .subscribe({
            next: (response) => {
              if (response !== null && response !== undefined) {
                this.success.set("Bank successfully updated!");
                const rest = this.filteredBankList().filter(d => d.id !== response.id);
                this.filteredBankList.set([response, ...rest]);
                this.isSubmitted = false;
                this.selectedBank = null;
                this.resetForm(e);
                setTimeout(() => {
                  this.success.set("");
                }, 3000);
              }

            },
            error: (error) => {
              console.error('Error register:', error);
            }
          });
      } else {
        this.bankService.addBank(this.form.value)
          .subscribe({
            next: (response) => {
              if (response !== null && response !== undefined) {
                this.success.set("Bank successfully added!");
                this.filteredBankList.set([response, ...this.filteredBankList()])
                this.isSubmitted = false;
                this.resetForm(e);
                setTimeout(() => {
                  this.success.set("");
                }, 3000);
              }

            },
            error: (error) => {
              console.error('Error register:', error);
            }
          });
      }
    } else {
      alert('Form is invalid! Please Fill Name Field.');
    }
  }

  onUpdate(data: any) {
    this.selectedBank = data;
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
    if (confirm("Are you sure you want to delete?")) {
      this.bankService.deleteBank(id).subscribe(data => {
        if (data.id) {
          this.success.set("Bank deleted successfully!");
          this.filteredBankList.set(this.filteredBankList().filter(d => d.id !== id));
          setTimeout(() => {
            this.success.set("");
          }, 3000);
        } else {
          console.error('Error deleting Bank:', data);
          alert('Error deleting Bank: ' + data.message)
        }
      });
    }
  }

  resetForm(e: Event) {
    e.preventDefault();
    this.form.reset({
      transactionType: '',
      coaMap: '',
      voucherDate: this.today,
      voucherNo: '',
      accountBankCashId: 0,
      vendorId: 0,
      receiveFrom: '',
      payTo: '',
      amount: '',
      particular: '',
      remarks: '',
    });
    this.createVoucherDetailDto.clear();
    this.editVoucherDetailDto.clear();
    this.isSubmitted = false;
  }

}


