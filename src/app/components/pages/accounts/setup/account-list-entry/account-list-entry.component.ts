import { Component, ElementRef, inject, QueryList, signal, ViewChild, ViewChildren } from '@angular/core';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BankService } from '../../../../../services/bank.service';
import { DataFetchService } from '../../../../../services/useDataFetch';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { AccountListService } from '../../../../../services/account-list.service';
import { ToastSuccessComponent } from "../../../../shared/toast/toast-success/toast-success.component";
import { SearchComponent } from "../../../../shared/svg/search/search.component";
import { CommonModule } from '@angular/common';
import { FieldComponent } from "../../../../shared/field/field.component";

@Component({
  selector: 'app-account-list-entry',
  imports: [ToastSuccessComponent, SearchComponent, CommonModule, ReactiveFormsModule, FieldComponent],
  templateUrl: './account-list-entry.component.html',
  styleUrl: './account-list-entry.component.css'
})
export class AccountListEntryComponent {
  fb = inject(NonNullableFormBuilder);
  private bankService = inject(BankService);
  private accountListService = inject(AccountListService);
  dataFetchService = inject(DataFetchService);
  filteredAccountList = signal<any[]>([]);
  highlightedTr: number = -1;
  success = signal<any>("");
  selectedAccount: any;
  isGrid: boolean = true;

  controlHeadOption: any = [];
  bankOption: any = [];
  accountGroupOption: any = [
    { id: 'current asset', text: 'current asset' },
    { id: 'nonCurrent/fixed asset', text: 'nonCurrent/fixed asset' },
    { id: 'current liability', text: 'current liability' },
    { id: 'nonCurrent/fixed liability', text: 'nonCurrent/fixed liability' },
    { id: 'equity', text: 'equity' },
    { id: 'revenue', text: 'revenue' },
    { id: 'expense', text: 'expense' },
  ];
  coaMapOption: any = [
    { id: 'cash', text: 'cash' },
    { id: 'bank', text: 'bank' },
  ];

  treeData: any[] = [];
  isLoadingTree$: Observable<boolean> | undefined;
  hasErrorTree$: Observable<any> | undefined;

  // Initially set all nodes to collapsed
  isCollapsed: { [key: number]: boolean } = {};

  private searchQuery$ = new BehaviorSubject<string>('');
  isLoading$: Observable<any> | undefined;
  hasError$: Observable<any> | undefined;
  @ViewChildren('inputRef') inputRefs!: QueryList<ElementRef>;
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  isSubmitted = false;

  form = this.fb.group({
    controlHeadId: [{ value: '', disabled: false }, [Validators.required]],
    accountCode: [''],
    accountGroup: ['', [Validators.required]],
    subHead: ['', [Validators.required]],
    coaMap: [''],
    bankId: [0],
    accountNo: [''],
    openingBalance: [0],
    remarks: [''],
  });

  ngOnInit() {
    this.onLoadAccountList();
    this.onLoadBanks();
    this.onLoadAccountTree();

    // Focus on the search input when the component is initialized
    setTimeout(() => {
      const inputs = this.inputRefs.toArray();
      inputs[0].nativeElement.focus();
    }, 10); // Delay to ensure the DOM is updated
  }

  onLoadAccountList() {
    const { data$, isLoading$, hasError$ } = this.dataFetchService.fetchData(this.accountListService.getAccountList({}));

    data$.subscribe(data => this.controlHeadOption = data.map((c: any) => ({ id: c.id, text: c.subHead.toLowerCase() })));

    this.isLoading$ = isLoading$;
    this.hasError$ = hasError$;
    // Combine the original data stream with the search query to create a filtered list
    combineLatest([
      data$,
      this.searchQuery$
    ]).pipe(
      map(([data, query]) =>
        data.filter((accountData: any) =>
          accountData.accountCode?.toLowerCase().includes(query) ||
          accountData.accountGroup?.toLowerCase().includes(query) ||
          accountData.subHead?.toLowerCase().includes(query) ||
          accountData.coaMap?.toLowerCase().includes(query) ||
          accountData.accountNo?.toLowerCase().includes(query) ||
          accountData.remarks?.toLowerCase().includes(query)
        )
      )
    ).subscribe(filteredData => this.filteredAccountList.set(filteredData.reverse()));
  }

  onLoadBanks() {
    const { data$ } = this.dataFetchService.fetchData(this.bankService.getBank(''));

    data$.subscribe(data => this.bankOption = data.map((b: any) => ({ id: b.id, text: b.name })));
  }

  // Method to filter Account list based on search query
  onSearchAccount(event: Event) {
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
      this.onSubmit(keyboardEvent);
    }
  }

  handleSearchKeyDown(event: KeyboardEvent) {
    if (this.filteredAccountList().length === 0) {
      return; // Exit if there are no items to navigate
    }

    if (event.key === 'Tab') {
      event.preventDefault();
      const inputs = this.inputRefs.toArray();
      inputs[0].nativeElement.focus();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault(); // Prevent default scrolling behavior
      this.highlightedTr = (this.highlightedTr + 1) % this.filteredAccountList().length;
    } else if (event.key === 'ArrowUp') {
      event.preventDefault(); // Prevent default scrolling behavior
      this.highlightedTr =
        (this.highlightedTr - 1 + this.filteredAccountList().length) % this.filteredAccountList().length;
    } else if (event.key === 'Enter') {
      event.preventDefault(); // Prevent form submission

      // Call onUpdate for the currently highlighted item
      if (this.highlightedTr !== -1) {
        const selectedItem = this.filteredAccountList()[this.highlightedTr];
        this.onUpdate(selectedItem);
        this.highlightedTr = -1;
      }
    }
  }

  onSubmit(e: Event) {
    this.isSubmitted = true;
    // console.log(this.form.value);
    if (this.form.valid) {
      this.form.get('controlHeadId')?.enable();
      if (this.selectedAccount) {
        // this.bankService.updateAccount(this.selectedAccount.id, this.form.value)
        //   .subscribe({
        //     next: (response) => {
        //       if (response !== null && response !== undefined) {
        //         this.success.set("Account successfully updated!");
        //         const rest = this.filteredAccountList().filter(d => d.id !== response.id);
        //         this.filteredAccountList.set([response, ...rest]);
        //         this.isSubmitted = false;
        //         this.selectedAccount = null;
        //         this.formReset(e);
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
        this.accountListService.addAccountList(this.form.value)
          .subscribe({
            next: (response) => {
              console.log(response)
              if (response !== null && response !== undefined) {
                this.success.set("Account successfully added!");
                this.filteredAccountList.set([response, ...this.filteredAccountList()])
                this.isSubmitted = false;
                this.formReset(e);
                this.onLoadAccountTree()
                setTimeout(() => {
                  this.success.set("");
                }, 3000);
              }

            },
            error: (error) => {
              console.error('Error Adding Account:', error);
            }
          });
      }
    } else {
      alert('Form is invalid! Please Fill ControlHeadId, AccountGroup and SubHead Field.');
    }
  }

  onUpdate(data: any) {
    this.selectedAccount = data;
    this.form.patchValue({
      controlHeadId: data?.controlHeadId,
      accountCode: data?.accountCode,
      accountGroup: data?.accountGroup,
      subHead: data?.subHead,
      coaMap: data?.coaMap,
      bankId: data?.bankId,
      accountNo: data?.accountNo,
      openingBalance: data?.openingBalance,
      remarks: data?.remarks,
    });

    // Focus the 'Name' input field after patching the value
    setTimeout(() => {
      const inputs = this.inputRefs.toArray();
      inputs[0].nativeElement.focus();
    }, 0); // Delay to ensure the DOM is updated
  }

  onDelete(id: any) {
  //   if (confirm("Are you sure you want to delete?")) {
  //     this.bankService.deleteBank(id).subscribe(data => {
  //       if (data.id) {
  //         this.success.set("Bank deleted successfully!");
  //         this.filteredAccountList.set(this.filteredAccountList().filter(d => d.id !== id));
  //         setTimeout(() => {
  //           this.success.set("");
  //         }, 3000);
  //       } else {
  //         console.error('Error deleting Bank:', data);
  //         alert('Error deleting Bank: ' + data.message)
  //       }
  //     });
  //   }
  }

  formReset(e: Event): void {
    e.preventDefault();
    this.form.get('controlHeadId')?.enable();
    this.form.reset({
      controlHeadId: '',
      accountCode: '',
      accountGroup: '',
      subHead: '',
      coaMap: '',
      bankId: 0,
      accountNo: '',
      openingBalance: 0,
      remarks: '',
    });
    this.isSubmitted = false;
    this.selectedAccount = null;
  }

  

  
  //------ Start Tree Functions --------------------------------

  onLoadAccountTree() {
    const { data$, isLoading$, hasError$ } = this.dataFetchService.fetchData(
      this.accountListService.getTreeView()
    );

    data$.subscribe(data => {
      this.treeData = data;
      this.initializeCollapseState(this.treeData);
    });

    this.isLoadingTree$ = isLoading$;
    this.hasErrorTree$ = hasError$;
  }

  

  // Initialize all nodes to be collapsed
  initializeCollapseState(nodes: any[]) {
    nodes.forEach(node => {
      this.isCollapsed[node.id] = true;
      if (node.children && node.children.length > 0) {
        this.initializeCollapseState(node.children);
      }
    });
  }

  toggleNode(id: number, length: any) {
    if (length > 0) {
      this.isCollapsed[id] = !this.isCollapsed[id];
    }
  }

  onAdd(data: any){
    this.form.patchValue({
      controlHeadId: data?.id
    });
  }
  //------ End Tree Functions --------------------------------




   // ----------controlHeadId---------------------------------------------------------------------------------
   controlHeadIdDropdownOpen: boolean = false;
   highlightedIndexHeadId: number = -1;
   controlHeadIdEnable: boolean = true;
 
   displayHeadId(id: any) {
     const find = this.controlHeadOption.find((p: { id: any; }) => p.id === id);
     return find?.text.toLowerCase() ?? '';
   }
 
   handleHeadIdKeyDown(event: KeyboardEvent) {
     if (event.key === 'ArrowDown') {
       this.controlHeadIdDropdownOpen = true;
       event.preventDefault();
     }
     if (this.controlHeadIdDropdownOpen && this.controlHeadOption.length > 0) {
       if (event.key === 'ArrowDown') {
         this.highlightedIndexHeadId = (this.highlightedIndexHeadId + 1) % this.controlHeadOption.length;
         event.preventDefault();
       } else if (event.key === 'ArrowUp') {
         this.highlightedIndexHeadId = (this.highlightedIndexHeadId - 1 + this.controlHeadOption.length) % this.controlHeadOption.length;
         event.preventDefault();
       } else if (event.key === 'Enter') {
         event.preventDefault();
         if (this.highlightedIndexHeadId !== -1) {
           this.selectHeadId(this.controlHeadOption[this.highlightedIndexHeadId]);
           this.controlHeadIdDropdownOpen = false;
         }
       }
     }
   }
 
   toggleHeadIdDropdown(e: any) {
     e.preventDefault();
     this.controlHeadIdDropdownOpen = !this.controlHeadIdDropdownOpen;
     this.highlightedIndexHeadId = -1;
   }
 
   selectHeadId(option: any) {
     this.getControl('controlHeadId').setValue(option?.id ?? this.controlHeadOption[this.highlightedIndexHeadId]?.id);
     this.controlHeadIdDropdownOpen = false;
     this.form.get('controlHeadId')?.disable();
     this.controlHeadIdEnable = false;
     this.highlightedIndexHeadId = -1;
   }
 
  //  onHeadIdChange(data: any) {
  //    this.selectedHeadId = data;
  //    this.form.patchValue({
  //      controlHeadId: this.selectedHeadId.id,
  //    });
  //  }
 
   onHeadIdSearchChange(event: Event) {
     const searchValue = (event.target as HTMLInputElement).value?.toLowerCase();
     this.controlHeadOption = this.filteredAccountList().filter(option =>
       option.id.toString().includes(searchValue) ||
       option.subHead.toLowerCase().includes(searchValue)
     ).map(p => ({ id: p.id, text: p.subHead }));
     this.highlightedIndexHeadId = -1;
     if (searchValue === '') {
       this.controlHeadIdDropdownOpen = false;
     } else {
       this.controlHeadIdDropdownOpen = true;
     }
   }
 
 
   onClearHeadId(event: Event) {
     event.preventDefault();
     this.form.get('controlHeadId')?.enable();
     this.form.patchValue({
       controlHeadId: ''
     });
     this.controlHeadIdEnable = true;
   }
   //----------controlHeadId End----------------------------------------------------------------------

}
