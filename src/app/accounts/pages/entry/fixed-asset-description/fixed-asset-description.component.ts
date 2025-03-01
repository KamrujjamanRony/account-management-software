import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, signal, viewChild, viewChildren } from '@angular/core';
import { ToastSuccessComponent } from '../../../../shared/components/toasts/toast-success/toast-success.component';
import { FieldComponent } from '../../../../shared/components/field/field.component';
import { SearchComponent } from '../../../../shared/components/svg/search/search.component';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DataFetchService } from '../../../../shared/services/useDataFetch';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { FixedAssetService } from '../../../services/fixed-asset.service';
import { AllSvgComponent } from "../../../../shared/components/svg/all-svg/all-svg.component";
import { AccountListService } from '../../../services/account-list.service';

@Component({
  selector: 'app-fixed-asset-description',
  imports: [CommonModule, ToastSuccessComponent, FieldComponent, SearchComponent, ReactiveFormsModule, AllSvgComponent],
  templateUrl: './fixed-asset-description.component.html',
  styleUrl: './fixed-asset-description.component.css'
})
export class FixedAssetDescriptionComponent {
  fb = inject(NonNullableFormBuilder);
  private fixedAssetService = inject(FixedAssetService);
  private accountListService = inject(AccountListService);
  dataFetchService = inject(DataFetchService);
  filteredFixedAssetList = signal<any[]>([]);
  highlightedTr: number = -1;
  assetTypeOption = signal<any[]>([]);
  success = signal<any>("");
  showForm = signal<boolean>(true);
  selectedFixedAsset: any;

  private searchQuery$ = new BehaviorSubject<string>('');
  isLoading$: Observable<any> | undefined;
  hasError$: Observable<any> | undefined;
  readonly inputRefs = viewChildren<ElementRef>('inputRef');
  readonly searchInput = viewChild.required<ElementRef<HTMLInputElement>>('searchInput');
  isSubmitted = false;

  form = this.fb.group({
    assetName: ['', [Validators.required]],
    assetType: [''],
    purInvNO: [''],
    purDate: [''],
    purPrice: [''],
    depCalDate: [''],
    depre: [''],
    depValue: [0],
    wdv: [0],
    location: [''],
    warrEndDate: [''],
    fileLink: [''],
  });

  ngOnInit() {
    const reqBody = {
      "headId": 8,
      "allbyheadId": 8
    };
    this.accountListService.getAccountList(reqBody).subscribe(data => {
      this.assetTypeOption.set(data.map((c: any) => ({ id: c.id, text: c.subHead.toLowerCase() })));
    });
    this.onLoadFixedAssets();

    // Focus on the search input when the component is initialized
    setTimeout(() => {
      const inputs = this.inputRefs();
      inputs[0].nativeElement.focus();
    }, 10); // Delay to ensure the DOM is updated
  }

  // Load Fixed Assets List
  onLoadFixedAssets() {
    const { data$, isLoading$, hasError$ } = this.dataFetchService.fetchData(this.fixedAssetService.getFixedAsset(""));

    this.isLoading$ = isLoading$;
    this.hasError$ = hasError$;
    // Combine the original data stream with the search query to create a filtered list
    combineLatest([
      data$,
      this.searchQuery$
    ]).pipe(
      map(([data, query]) =>
        data.filter((FixedAssetData: any) =>
          FixedAssetData.assetName?.toLowerCase().includes(query) ||
          FixedAssetData.location?.toLowerCase().includes(query)
        )
      )
    ).subscribe(filteredData => this.filteredFixedAssetList.set(filteredData.reverse()));
  }

  // Method to filter FixedAsset list based on search query
  onSearchFixedAsset(event: Event) {
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    this.searchQuery$.next(query);
  }

  // Simplified method to get form controls
  getControl(controlName: string): FormControl {
    return this.form.get(controlName) as FormControl;
  }


  // Calculate Input Value
  onCalculateValue(event: Event) {
    event.preventDefault();
    this.form.get('depValue')?.enable();
    this.form.get('wdv')?.enable();
    const depValue = (Number(this.form.get('purPrice')?.value) || 0) * (Number(this.form.get('depre')?.value) ? Number(this.form.get('depre')?.value) / 100 : 0)
    this.form.patchValue({
      depValue: depValue,
      wdv: (Number(this.form.get('purPrice')?.value) || 0) - depValue,
    });
    this.form.get('depValue')?.disable();
    this.form.get('wdv')?.disable();
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
    if (this.filteredFixedAssetList().length === 0) {
      return; // Exit if there are no items to navigate
    }

    if (event.key === 'Tab') {
      event.preventDefault();
      const inputs = this.inputRefs();
      inputs[0].nativeElement.focus();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault(); // Prevent default scrolling behavior
      this.highlightedTr = (this.highlightedTr + 1) % this.filteredFixedAssetList().length;
    } else if (event.key === 'ArrowUp') {
      event.preventDefault(); // Prevent default scrolling behavior
      this.highlightedTr =
        (this.highlightedTr - 1 + this.filteredFixedAssetList().length) % this.filteredFixedAssetList().length;
    } else if (event.key === 'Enter') {
      event.preventDefault(); // Prevent form submission

      // Call onUpdate for the currently highlighted item
      if (this.highlightedTr !== -1) {
        const selectedItem = this.filteredFixedAssetList()[this.highlightedTr];
        this.onUpdate(selectedItem);
        this.highlightedTr = -1;
      }
    }
  }

  onSubmit(e: Event) {
    this.isSubmitted = true;
    if (this.form.valid) {
      // console.log(this.form.value);
      if (this.selectedFixedAsset) {
        this.fixedAssetService.updateFixedAsset(this.selectedFixedAsset.id, this.form.value)
          .subscribe({
            next: (response) => {
              if (response !== null && response !== undefined) {
                this.success.set("FixedAsset successfully updated!");
                const rest = this.filteredFixedAssetList().filter(d => d.id !== response.id);
                this.filteredFixedAssetList.set([response, ...rest]);
                this.isSubmitted = false;
                this.selectedFixedAsset = null;
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
        this.fixedAssetService.addFixedAsset(this.form.value)
          .subscribe({
            next: (response) => {
              if (response !== null && response !== undefined) {
                this.success.set("FixedAsset successfully added!");
                this.filteredFixedAssetList.set([response, ...this.filteredFixedAssetList()])
                this.isSubmitted = false;
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
      }
    } else {
      alert('Form is invalid! Please Fill Name Field.');
    }
  }

  onUpdate(data: any) {
    this.selectedFixedAsset = data;
    this.form.patchValue({
      assetName: data?.assetName,
      assetType: data?.assetType,
      purInvNO: data?.purInvNO,
      purDate: data?.purDate,
      purPrice: data?.purPrice,
      depCalDate: data?.depCalDate,
      depre: data?.depre,
      depValue: data?.depValue,
      wdv: data?.wdv,
      location: data?.location,
      warrEndDate: data?.warrEndDate,
      fileLink: data?.fileLink,
    });
    this.showForm.set(true);

    // Focus the 'Name' input field after patching the value
    setTimeout(() => {
      const inputs = this.inputRefs();
      inputs[0].nativeElement.focus();
    }, 0); // Delay to ensure the DOM is updated
  }

  onDelete(id: any) {
    if (confirm("Are you sure you want to delete?")) {
      this.fixedAssetService.deleteFixedAsset(id).subscribe(data => {
        if (data.id) {
          this.success.set("FixedAsset deleted successfully!");
          this.filteredFixedAssetList.set(this.filteredFixedAssetList().filter(d => d.id !== id));
          setTimeout(() => {
            this.success.set("");
          }, 1000);
        } else {
          console.error('Error deleting FixedAsset:', data);
          alert('Error deleting FixedAsset: ' + data.message)
        }
      });
    }
  }

  formReset(e: Event): void {
    e.preventDefault();
    this.form.reset({
      assetName: '',
      assetType: '',
      purInvNO: '',
      purDate: '',
      purPrice: '',
      depCalDate: '',
      depre: '',
      depValue: 0,
      wdv: 0,
      location: '',
      warrEndDate: '',
      fileLink: '',
    });
    this.isSubmitted = false;
    this.selectedFixedAsset = null;
  }

}
