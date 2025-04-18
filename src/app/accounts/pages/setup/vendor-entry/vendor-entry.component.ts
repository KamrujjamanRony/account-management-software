import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, signal, viewChildren, viewChild } from '@angular/core';
import { FieldComponent } from '../../../../shared/components/field/field.component';
import { SearchComponent } from '../../../../shared/components/svg/search/search.component';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { VendorService } from '../../../services/vendor.service';
import { DataFetchService } from '../../../../shared/services/useDataFetch';
import { ToastService } from '../../../../shared/components/primeng/toast/toast.service';

@Component({
  selector: 'app-vendor-entry',
  imports: [CommonModule, FieldComponent, SearchComponent, ReactiveFormsModule],
  templateUrl: './vendor-entry.component.html',
  styleUrl: './vendor-entry.component.css'
})
export class VendorEntryComponent {
  fb = inject(NonNullableFormBuilder);
  private vendorService = inject(VendorService);
  private dataFetchService = inject(DataFetchService);
  private toastService = inject(ToastService);
  filteredVendorList = signal<any[]>([]);
  highlightedTr: number = -1;
  selectedVendor: any;

  private searchQuery$ = new BehaviorSubject<string>('');
  isLoading$: Observable<any> | undefined;
  hasError$: Observable<any> | undefined;
  readonly inputRefs = viewChildren<ElementRef>('inputRef');
  readonly searchInput = viewChild.required<ElementRef<HTMLInputElement>>('searchInput');
  isSubmitted = false;

  form = this.fb.group({
    name: ['', [Validators.required]],
    address: [''],
    mobile: [''],
    remarks: [''],
  });

  ngOnInit() {
    this.onLoadVendors();

    // Focus on the search input when the component is initialized
    setTimeout(() => {
      const inputs = this.inputRefs();
      inputs[0].nativeElement.focus();
    }, 10); // Delay to ensure the DOM is updated
  }

  onLoadVendors() {
    const { data$, isLoading$, hasError$ } = this.dataFetchService.fetchData(this.vendorService.getVendor(""));

    this.isLoading$ = isLoading$;
    this.hasError$ = hasError$;
    // Combine the original data stream with the search query to create a filtered list
    combineLatest([
      data$,
      this.searchQuery$
    ]).pipe(
      map(([data, query]) =>
        data.filter((VendorData: any) =>
          VendorData.name?.toLowerCase().includes(query) ||
          VendorData.address?.toLowerCase().includes(query) ||
          VendorData.mobile?.toString().includes(query) ||
          VendorData.remarks?.toLowerCase().includes(query)
        )
      )
    ).subscribe(filteredData => this.filteredVendorList.set(filteredData.reverse()));
  }

  // Method to filter Vendor list based on search query
  onSearchVendor(event: Event) {
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
    if (this.filteredVendorList().length === 0) {
      return; // Exit if there are no items to navigate
    }

    if (event.key === 'Tab') {
      event.preventDefault();
      const inputs = this.inputRefs();
      inputs[0].nativeElement.focus();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault(); // Prevent default scrolling behavior
      this.highlightedTr = (this.highlightedTr + 1) % this.filteredVendorList().length;
    } else if (event.key === 'ArrowUp') {
      event.preventDefault(); // Prevent default scrolling behavior
      this.highlightedTr =
        (this.highlightedTr - 1 + this.filteredVendorList().length) % this.filteredVendorList().length;
    } else if (event.key === 'Enter') {
      event.preventDefault(); // Prevent form submission

      // Call onUpdate for the currently highlighted item
      if (this.highlightedTr !== -1) {
        const selectedItem = this.filteredVendorList()[this.highlightedTr];
        this.onUpdate(selectedItem);
        this.highlightedTr = -1;
      }
    }
  }

  onSubmit(e: Event) {
    this.isSubmitted = true;
    if (this.form.valid) {
      // console.log(this.form.value);
      if (this.selectedVendor) {
        this.vendorService.updateVendor(this.selectedVendor.id, this.form.value)
          .subscribe({
            next: (response) => {
              if (response !== null && response !== undefined) {
                this.toastService.showMessage('success', 'Successful', "Vendor successfully updated!");
                const rest = this.filteredVendorList().filter(d => d.id !== response.id);
                this.filteredVendorList.set([response, ...rest]);
                this.isSubmitted = false;
                this.selectedVendor = null;
                this.formReset(e);
              }

            },
            error: (error) => {
              console.error('Error register:', error);
              this.toastService.showMessage('error', 'Error', `${error.error.status} : ${error.error.message || error.error.title}`);
            }
          });
      } else {
        this.vendorService.addVendor(this.form.value)
          .subscribe({
            next: (response) => {
              if (response !== null && response !== undefined) {
                this.toastService.showMessage('success', 'Successful', "Vendor successfully added!");
                this.filteredVendorList.set([response, ...this.filteredVendorList()])
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
    this.selectedVendor = data;
    this.form.patchValue({
      name: data?.name,
      address: data?.address,
      mobile: data?.mobile,
      remarks: data?.remarks,
    });

    // Focus the 'Name' input field after patching the value
    setTimeout(() => {
      const inputs = this.inputRefs();
      inputs[0].nativeElement.focus();
    }, 0); // Delay to ensure the DOM is updated
  }

  onDelete(id: any) {
    if (confirm("Are you sure you want to delete?")) {
      this.vendorService.deleteVendor(id).subscribe(data => {
        if (data.id) {
          this.toastService.showMessage('success', 'Successful', "Vendor deleted successfully!");
          this.filteredVendorList.set(this.filteredVendorList().filter(d => d.id !== id));
        } else {
          console.error('Error deleting Vendor:', data);
          this.toastService.showMessage('error', 'Error', `Error deleting Vendor: ${data.message}`);
        }
      });
    }
  }

  formReset(e: Event): void {
    e.preventDefault();
    this.form.reset({
      name: '',
      address: '',
      mobile: '',
      remarks: '',
    });
    this.isSubmitted = false;
    this.selectedVendor = null;
  }

}
