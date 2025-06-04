import { Component, ElementRef, inject, signal, viewChildren, viewChild } from '@angular/core';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { FieldComponent } from '../../../../shared/components/field/field.component';
import { SearchComponent } from '../../../../shared/components/svg/search/search.component';
import { CommonModule } from '@angular/common';
import { BankService } from '../../../services/bank.service';
import { DataFetchService } from '../../../../shared/services/useDataFetch';
import { ToastService } from '../../../../shared/components/primeng/toast/toast.service';
import { AuthService } from '../../../../settings/services/auth.service';

@Component({
  selector: 'app-bank-entry',
  imports: [CommonModule, FieldComponent, SearchComponent, ReactiveFormsModule],
  templateUrl: './bank-entry.component.html',
  styleUrl: './bank-entry.component.css'
})
export class BankEntryComponent {
  fb = inject(NonNullableFormBuilder);
  private bankService = inject(BankService);
  private dataFetchService = inject(DataFetchService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  isView = signal<boolean>(false);
  isInsert = signal<boolean>(false);
  isEdit = signal<boolean>(false);
  isDelete = signal<boolean>(false);
  filteredBankList = signal<any[]>([]);
  highlightedTr: number = -1;
  selectedBank: any;

  private searchQuery$ = new BehaviorSubject<string>('');
  isLoading$: Observable<any> | undefined;
  hasError$: Observable<any> | undefined;
  readonly inputRefs = viewChildren<ElementRef>('inputRef');
  readonly searchInput = viewChild.required<ElementRef<HTMLInputElement>>('searchInput');
  isSubmitted = false;

  form = this.fb.group({
    name: ['', [Validators.required]],
    address: [''],
    remarks: [''],
    postBy: [this.authService.getUser()?.username || '']
  });

  ngOnInit() {
    this.onLoadBanks();
    this.isView.set(this.checkPermission("Bank Setup", "View"));
    this.isInsert.set(this.checkPermission("Bank Setup", "Insert"));
    this.isEdit.set(this.checkPermission("Bank Setup", "Edit"));
    this.isDelete.set(this.checkPermission("Bank Setup", "Delete"));

    // Focus on the search input when the component is initialized
    setTimeout(() => {
      const inputs = this.inputRefs();
      inputs[0]?.nativeElement?.focus();
    }, 10); // Delay to ensure the DOM is updated
  }

  onLoadBanks() {
    const { data$, isLoading$, hasError$ } = this.dataFetchService.fetchData(this.bankService.getBank(""));

    this.isLoading$ = isLoading$;
    this.hasError$ = hasError$;
    // Combine the original data stream with the search query to create a filtered list
    combineLatest([
      data$,
      this.searchQuery$
    ]).pipe(
      map(([data, query]) =>
        data.filter((bankData: any) =>
          bankData.name?.toLowerCase().includes(query) ||
          bankData.address?.toLowerCase().includes(query) ||
          bankData.remarks?.toLowerCase().includes(query)
        )
      )
    ).subscribe(filteredData => this.filteredBankList.set(filteredData.reverse()));
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

  // Method to filter Bank list based on search query
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
    const allInputs = this.inputRefs();
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
      const inputs = this.inputRefs();
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
    if (this.form.valid) {
      // console.log(this.form.value);
      if (this.selectedBank) {
        this.bankService.updateBank(this.selectedBank.id, this.form.value)
          .subscribe({
            next: (response) => {
              if (response !== null && response !== undefined) {
                this.toastService.showMessage('success', 'Successful', "Bank successfully updated!");
                const rest = this.filteredBankList().filter(d => d.id !== response.id);
                this.filteredBankList.set([response, ...rest]);
                this.isSubmitted = false;
                this.selectedBank = null;
                this.formReset(e);
              }

            },
            error: (error) => {
              console.error('Error register:', error);
              this.toastService.showMessage('error', 'Error', `${error.error.status} : ${error.error.message || error.error.title}`);
            }
          });
      } else {
        this.bankService.addBank(this.form.value)
          .subscribe({
            next: (response) => {
              if (response !== null && response !== undefined) {
                this.toastService.showMessage('success', 'Successful', "Bank successfully added!");
                this.filteredBankList.set([response, ...this.filteredBankList()])
                this.isSubmitted = false;
                this.formReset(e);
              }

            },
            error: (error) => {
              console.error('Error register:', error);
              this.toastService.showMessage('error', 'Error', `${error.error.status} : ${error.error.message || error.error.title}`);
            }
          });
      }
    } else {
      this.toastService.showMessage('warn', 'Warning', 'Form is invalid! Please Fill All Requirement Field.');
    }
  }

  onUpdate(data: any) {
    this.selectedBank = data;
    this.form.patchValue({
      name: data?.name,
      address: data?.address,
      remarks: data?.remarks,
      postBy: data?.postBy
    });

    // Focus the 'Name' input field after patching the value
    setTimeout(() => {
      const inputs = this.inputRefs();
      inputs[0].nativeElement.focus();
    }, 0); // Delay to ensure the DOM is updated
  }

  onDelete(id: any) {
    if (confirm("Are you sure you want to delete?")) {
      this.bankService.deleteBank(id).subscribe(data => {
        if (data.id) {
          this.toastService.showMessage('success', 'Successful', "Bank deleted successfully!");
          this.filteredBankList.set(this.filteredBankList().filter(d => d.id !== id));
        } else {
          console.error('Error deleting Bank:', data);
          this.toastService.showMessage('error', 'Error', `Error deleting Bank: ${data.message}`);
        }
      });
    }
  }

  formReset(e: Event): void {
    e.preventDefault();
    this.form.reset({
      name: '',
      address: '',
      remarks: '',
      postBy: this.authService.getUser()?.username || ''
    });
    this.isSubmitted = false;
    this.selectedBank = null;
  }

}
