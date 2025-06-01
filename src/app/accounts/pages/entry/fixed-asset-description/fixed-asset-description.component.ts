import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, signal, viewChild, viewChildren } from '@angular/core';
import { FieldComponent } from '../../../../shared/components/field/field.component';
import { SearchComponent } from '../../../../shared/components/svg/search/search.component';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DataFetchService } from '../../../../shared/services/useDataFetch';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { FixedAssetService } from '../../../services/fixed-asset.service';
import { AllSvgComponent } from "../../../../shared/components/svg/all-svg/all-svg.component";
import { AccountListService } from '../../../services/account-list.service';
import { ToastService } from '../../../../shared/components/primeng/toast/toast.service';
import { AuthService } from '../../../../settings/services/auth.service';

@Component({
  selector: 'app-fixed-asset-description',
  imports: [CommonModule, FieldComponent, SearchComponent, ReactiveFormsModule, AllSvgComponent],
  templateUrl: './fixed-asset-description.component.html',
  styleUrl: './fixed-asset-description.component.css'
})
export class FixedAssetDescriptionComponent {
  fb = inject(NonNullableFormBuilder);
  private fixedAssetService = inject(FixedAssetService);
  private accountListService = inject(AccountListService);
  private toastService = inject(ToastService);
  private dataFetchService = inject(DataFetchService);
  private authService = inject(AuthService);
  isView = signal<boolean>(false);
  isInsert = signal<boolean>(false);
  isEdit = signal<boolean>(false);
  isDelete = signal<boolean>(false);
  filteredFixedAssetList = signal<any[]>([]);
  highlightedTr: number = -1;
  assetTypeOption = signal<any[]>([]);
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
    assetTypeId: [''],
    purInvNO: [''],
    purDate: [''],
    purPrice: [''],
    depCalDate: [''],
    deprePercentage: [''],
    depValue: [{ value: 0, disabled: true }],
    wdv: [{ value: 0, disabled: true }],
    location: [''],
    warrEndDate: [''],
    fileLink: [''],
    postBy: [this.authService.getUser()?.username || ''],
    others1: [''],
    others2: [''],
    others3: [''],
  });

  ngOnInit() {
    const reqBody = {         // todo: set assetId
      "headId": 8,
      "allbyheadId": 8
    };
    this.accountListService.getAccountList(reqBody).subscribe(data => {
      this.assetTypeOption.set(data.map((c: any) => ({ id: c.id, text: c.subHead.toLowerCase() })));
    });
    this.onLoadFixedAssets();
    this.isView.set(this.checkPermission("Fixed Asset Description", "View"));
    this.isInsert.set(this.checkPermission("Fixed Asset Description", "Insert"));
    this.isEdit.set(this.checkPermission("Fixed Asset Description", "Edit"));
    this.isDelete.set(this.checkPermission("Fixed Asset Description", "Delete"));

    // Focus on the search input when the component is initialized
    setTimeout(() => {
      const inputs = this.inputRefs();
      inputs[0]?.nativeElement.focus();
    }, 10); // Delay to ensure the DOM is updated
  }

  onDisplayAssetType(assetTypeId: any): string {
    const assetType = this.assetTypeOption().find((item: any) => item.id == assetTypeId);
    return assetType ? assetType.text : '';
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
          FixedAssetData.purInvNO?.includes(query)
        )
      )
    ).subscribe(filteredData => this.filteredFixedAssetList.set(filteredData.reverse().map((item: any) => {
      return {
        id: item.id,
        assetName: item.assetName,
        assetTypeId: item.assetTypeId,
        purInvNO: item.purInvNO,
        purDate: item.purDate.split('T')[0],
        purPrice: item.purPrice,
        depCalDate: item.depCalDate.split('T')[0],
        deprePercentage: item.deprePercentage,
        depValue: item.depValue,
        wdv: item.wdv,
        location: item.location,
        warrEndDate: item.warrEndDate.split('T')[0],
        fileLink: item.fileLink,
        postBy: item.postBy,
        others1: item.others1,
        others2: item.others2,
        others3: item.others3
      };
    })));
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
    const depValue = (Number(this.form.get('purPrice')?.value) || 0) * (Number(this.form.get('deprePercentage')?.value) ? Number(this.form.get('deprePercentage')?.value) / 100 : 0)
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
      this.form.get('depValue')?.enable();
      this.form.get('wdv')?.enable();
      if (this.selectedFixedAsset) {
        this.fixedAssetService.updateFixedAsset(this.selectedFixedAsset.id, this.form.value)
          .subscribe({
            next: (response) => {
              if (response !== null && response !== undefined) {
                this.toastService.showMessage('success', 'Successful', 'FixedAsset successfully updated!');
                const rest = this.filteredFixedAssetList().filter(d => d.id !== response.id);
                this.filteredFixedAssetList.set([response, ...rest]);
                this.isSubmitted = false;
                this.selectedFixedAsset = null;
                this.formReset(e);
              }

            },
            error: (error) => {
              console.error('Error Update:', error);
              this.toastService.showMessage('error', 'Error', `${error.error.status} : ${error.error.message || error.error.title}`);
              this.form.get('depValue')?.disable();
              this.form.get('wdv')?.disable();
            }
          });
      } else {
        this.fixedAssetService.addFixedAsset(this.form.value)
          .subscribe({
            next: (response) => {
              if (response !== null && response !== undefined) {
                this.toastService.showMessage('success', 'Successful', 'FixedAsset successfully added!');
                this.filteredFixedAssetList.set([response, ...this.filteredFixedAssetList()])
                this.isSubmitted = false;
                this.formReset(e);
              }

            },
            error: (error) => {
              console.error('Error register:', error);
              this.toastService.showMessage('error', 'Error', `${error.error.status} : ${error.error.message || error.error.title}`);
              this.form.get('depValue')?.disable();
              this.form.get('wdv')?.disable();
            }
          });
      }
    } else {
      this.toastService.showMessage('warn', 'Warning', 'Form is invalid! Please Fill All Requirement Field.');
    }
  }

  onUpdate(data: any) {
    this.selectedFixedAsset = data;
    this.form.patchValue({
      assetName: data?.assetName,
      assetTypeId: data?.assetTypeId,
      purInvNO: data?.purInvNO,
      purDate: data?.purDate.split('T')[0],
      purPrice: data?.purPrice,
      depCalDate: data?.depCalDate.split('T')[0],
      deprePercentage: data?.deprePercentage,
      depValue: data?.depValue,
      wdv: data?.wdv,
      location: data?.location,
      warrEndDate: data?.warrEndDate.split('T')[0],
      fileLink: data?.fileLink,
      postBy: data?.postBy,
      others1: data?.others1,
      others2: data?.others2,
      others3: data?.others3,
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
          this.toastService.showMessage('success', 'Successful', 'FixedAsset deleted successfully!');
          this.filteredFixedAssetList.set(this.filteredFixedAssetList().filter(d => d.id !== id));
        } else {
          console.error('Error deleting FixedAsset:', data);
          this.toastService.showMessage('error', 'Error', `Error deleting FixedAsset : ${data.message}`);
        }
      });
    }
  }

  formReset(e: Event): void {
    e.preventDefault();
    this.form.reset({
      assetName: '',
      assetTypeId: '',
      purInvNO: '',
      purDate: '',
      purPrice: '',
      depCalDate: '',
      deprePercentage: '',
      depValue: 0,
      wdv: 0,
      location: '',
      warrEndDate: '',
      fileLink: '',
      postBy: this.authService.getUser()?.username || '',
      others1: '',
      others2: '',
      others3: '',
    });
    this.isSubmitted = false;
    this.selectedFixedAsset = null;
    this.form.get('depValue')?.disable();
    this.form.get('wdv')?.disable();
  }

}
