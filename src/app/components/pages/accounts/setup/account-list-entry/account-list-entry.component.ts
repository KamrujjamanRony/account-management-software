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
  show = signal<boolean>(false);
  highlightedTr: number = -1;
  success = signal<any>("");
  selectedAccount = signal<any>(null);
  isGrid = signal<boolean>(false);

  controlHeadOption = signal<any[]>([]);
  bankOption = signal<any[]>([]);
  accountGroupOption = signal<any[]>(["Current Asset", "NonCurrent/Fixed Asset", "Current Liability", "NonCurrent Liability", "Equity", "Income", "Expenses", "Assets", "Liability"]);
  coaMapOption = signal<any[]>(["Cash", "Bank"]);

  treeData = signal<any[]>([]);
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
    const { data$, isLoading$, hasError$ } = this.dataFetchService.fetchData(this.accountListService.getAccountList({
      "headId": null,
      "allbyheadId": 1,
      "search": null,
      "coaMap": [],
      "accountGroup": []
    }));

    data$.subscribe(data => this.controlHeadOption.set(data.map((c: any) => ({ id: c.id, text: c.subHead }))));

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

    data$.subscribe(data => this.bankOption.set(data.map((b: any) => ({ id: b.id, text: b.name }))));
  }

  // Method to filter Account list based on search query
  onSearchAccount(event: Event) {
    const query = (event.target as HTMLInputElement).value;
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
      this.form.get('accountGroup')?.enable();
      const requestData = { ...this.form.value, openingBalance: Number(this.form.value.openingBalance) };
      if (this.selectedAccount()) {
        this.accountListService.updateAccountList(this.selectedAccount()?.id, requestData)
          .subscribe({
            next: (response) => {
              if (response !== null && response !== undefined) {
                this.success.set("ChartofAccount successfully updated!");
                const rest = this.filteredAccountList().filter(d => d.id !== response.id);
                this.filteredAccountList.set([response, ...rest]);
                this.isSubmitted = false;
                this.selectedAccount.set(null);
                this.formReset(e);
                setTimeout(() => {
                  this.success.set("");
                }, 1000);
              }

            },
            error: (error) => {
              console.error('Error register:', error);
            }
          });
      } else {
        this.accountListService.addAccountList(requestData)
          .subscribe({
            next: (response) => {
              // console.log(response)
              if (response !== null && response !== undefined) {
                this.success.set("Account successfully added!");
                this.filteredAccountList.set([response, ...this.filteredAccountList()])
                this.isSubmitted = false;
                this.formReset(e);
                this.onLoadAccountTree()
                setTimeout(() => {
                  this.success.set("");
                }, 1000);
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
    this.selectedAccount.set(data);
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

    this.form.get('controlHeadId')?.disable();

    // Focus the 'Name' input field after patching the value
    setTimeout(() => {
      const inputs = this.inputRefs.toArray();
      inputs[0].nativeElement.focus();
    }, 0); // Delay to ensure the DOM is updated
  }

  onDelete(id: any) {
    if (confirm("Are you sure you want to delete?")) {
      this.accountListService.deleteAccountList(id).subscribe(data => {
        if (data.id) {
          this.success.set("ChartOfAccount deleted successfully!");
          this.filteredAccountList.set(this.filteredAccountList().filter(d => d.id !== id));
          this.onLoadAccountTree();
          setTimeout(() => {
            this.success.set("");
          }, 1000);
        } else {
          console.error('Error deleting ChartOfAccount:', data);
          alert('Error deleting ChartOfAccount: ' + data.message)
        }
      });
    }
  }

  formReset(e: Event): void {
    e.preventDefault();
    this.form.get('controlHeadId')?.enable();
    this.form.reset();
    this.isSubmitted = false;
    this.selectedAccount.set(null);
  }




  //------ Start Tree Functions --------------------------------

  onLoadAccountTree() {
    const { data$, isLoading$, hasError$ } = this.dataFetchService.fetchData(
      this.accountListService.getTreeView()
    );

    data$.subscribe(data => {
      this.treeData.set(data);
      this.initializeCollapseState(this.treeData());
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

  onAdd(data: any) {
    const findData = this.filteredAccountList().find((d: any) => d.id == data.id);
    this.form.patchValue({
      controlHeadId: data?.id,
      accountGroup: findData?.accountGroup,
    });

    this.form.get('accountGroup')?.disable();
    this.form.get('controlHeadId')?.disable();
  }
  //------ End Tree Functions --------------------------------




  // ----------Utility function start---------------------------------------------------------------------------------
  onToggleShow(e: any) {
    e.preventDefault();
    this.show.set(!this.show())
  }

  displayHead(id: any) {
    return this.controlHeadOption().find((option: any) => option.id == id)?.text ?? "";
  }
  // ----------Utility function end---------------------------------------------------------------------------------

}
