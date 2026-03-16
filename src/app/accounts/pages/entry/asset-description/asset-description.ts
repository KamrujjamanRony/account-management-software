import { Component, computed, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { 
  faPencil, 
  faXmark, 
  faMagnifyingGlass,
  faCalendar,
  faFile,
  faDollarSign,
  faPercentage,
  faRotateLeft
} from '@fortawesome/free-solid-svg-icons';
import { form, required, debounce, FormField } from '@angular/forms/signals';
import { AssetDescriptionService } from '../../../services/asset-description.service';
import { AssetTypeService } from '../../../services/asset-type.service';
import { PermissionS } from '../../../../settings/services/permission-s';
import { ToastService } from '../../../../utils/toast/toast.service';
import { ConfirmService } from '../../../../utils/confirm/confirm.service';
import { AuthService } from '../../../../settings/services/auth.service';
import { AssetDescriptionM } from '../../../models/asset-description.model';
import { AssetTypeM } from '../../../models/asset-type';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-asset-description',
  imports: [FormsModule, FormField, FontAwesomeModule, CommonModule],
  templateUrl: './asset-description.html',
  styleUrl: './asset-description.css',
})
export class AssetDescription {
  // Icons
  faPencil = faPencil;
  faXmark = faXmark;
  faMagnifyingGlass = faMagnifyingGlass;
  faCalendar = faCalendar;
  faFile = faFile;
  faDollarSign = faDollarSign;
  faPercentage = faPercentage;
  faRotateLeft = faRotateLeft;
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  /* ---------------- DI ---------------- */
  private assetDescriptionService = inject(AssetDescriptionService);
  private assetTypeService = inject(AssetTypeService);
  private permissionService = inject(PermissionS);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);
  private authService = inject(AuthService);

  /* ---------------- SIGNAL STATE ---------------- */
  assetDescriptions = signal<AssetDescriptionM[]>([]);
  assetTypes = signal<AssetTypeM[]>([]);
  searchQuery = signal('');

  isView = signal(false);
  isInsert = signal(false);
  isEdit = signal(false);
  isDelete = signal(false);
  showList = signal(true);

  // Asset Status options
  assetStatusOptions = [
    { value: 1, label: 'Active' },
    { value: 2, label: 'Inactive' },
    { value: 3, label: 'Disposed' },
    { value: 4, label: 'Under Maintenance' }
  ];

  filteredAssetList = computed(() => {
    const query = this.searchQuery().toLowerCase();

    return this.assetDescriptions()
      .filter(data =>
        String(data.assetName ?? '').toLowerCase().includes(query) ||
        String(data.assetCode ?? '').toLowerCase().includes(query) ||
        String(data.vendorName ?? '').toLowerCase().includes(query)
      )
      .map(asset => ({
        ...asset,
        // Format calculated fields for display
        assetTypeName: this.getAssetTypeName(asset.assetTypeId)
      }));
  });

  selected = signal<AssetDescriptionM | null>(null);
  isLoading = signal(false);
  hasError = signal(false);
  isSubmitted = signal(false);

  // Date range filters
  fromDate = signal<string>(this.getTodayDateString());
  toDate = signal<string>(this.getTodayDateString());

  /* ---------------- HELPER METHODS ---------------- */
  getTodayDateString(): string {
    return new Date().toISOString().split('T')[0];
  }

  /* ---------------- FORM MODEL ---------------- */
  model = signal({
    assetName: "",
    assetCode: "",
    qty: "",
    assetTypeId: "0",
    vendorName: "",
    purInvNO: "",
    purDate: new Date().toISOString().split('T')[0],
    purPrice: "0",
    depCalDate: new Date().toISOString().split('T')[0],
    deprePercentage: "0",
    location: "",
    warrEndDate: "",
    fileLink: "",
    assetStatus: "1", // Default to Active
    remarks: "",
    postBy: this.authService.getUser()?.username || '',
    others1: "",
    others2: "",
    others3: ""
  });

  /* ---------------- SIGNAL FORM ---------------- */
  form = form(this.model, (schemaPath) => {
    required(schemaPath.assetName, { message: 'Asset name is required' });
    required(schemaPath.assetTypeId, { message: 'Asset type is required' });
    required(schemaPath.purPrice, { message: 'Purchase price is required' });
    debounce(schemaPath.assetName, 300);
  });

  /* ---------------- LIFECYCLE ---------------- */
  ngOnInit(): void {
    this.loadAssetDescriptions();
    this.loadAssetTypes();
    this.loadPermissions();
  }

  /* ---------------- LOADERS ---------------- */
  loadPermissions() {
    this.isView.set(this.permissionService.hasPermission('Fixed Asset Description'));
    this.isInsert.set(this.permissionService.hasPermission('Fixed Asset Description', 'insert'));
    this.isEdit.set(this.permissionService.hasPermission('Fixed Asset Description', 'edit'));
    this.isDelete.set(this.permissionService.hasPermission('Fixed Asset Description', 'delete'));
  }

  loadAssetDescriptions() {
    this.isLoading.set(true);
    this.hasError.set(false);

    const fromDateObj = this.fromDate() ? new Date(this.fromDate()) : undefined;
    const toDateObj = this.toDate() ? new Date(this.toDate()) : undefined;

    // Validate dates
    if (fromDateObj && toDateObj && fromDateObj > toDateObj) {
      this.toast.warning('From Date cannot be greater than To Date', 'bottom-right', 5000);
      this.isLoading.set(false);
      return;
    }

    this.assetDescriptionService.search(0, fromDateObj, toDateObj).subscribe({
      next: (data) => {
        this.assetDescriptions.set(data);
        this.isLoading.set(false);
        if (data.length === 0) {
          this.toast.warning('No records found for the selected date range', 'bottom-right', 3000);
        }
      },
      error: (error) => {
        this.hasError.set(true);
        this.isLoading.set(false);
        this.toast.danger('Error loading asset data', 'bottom-right', 5000);
        console.error('Error loading assets:', error);
      }
    });
  }

  loadAssetTypes() {
    this.assetTypeService.search("").subscribe({
      next: (data) => {
        this.assetTypes.set(data);
      },
      error: (error) => {
        console.error('Error loading asset types:', error);
      }
    });
  }

  resetDateFilters() {
    this.fromDate.set(this.getTodayDateString());
    this.toDate.set(this.getTodayDateString());
    this.loadAssetDescriptions();
  }

  getAssetTypeName(assetTypeId: number): string {
    const assetType = this.assetTypes().find(type => type.id === assetTypeId);
    return assetType?.assetTypeName || 'N/A';
  }

  getAssetStatusLabel(status: number): string {
    const option = this.assetStatusOptions.find(opt => opt.value === status);
    return option?.label || 'Unknown';
  }

  /* ---------------- SEARCH ---------------- */
  onSearch(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value.trim());
  }

  /* ---------------- SUBMIT ---------------- */
  onSubmit(event: Event) {
    event.preventDefault();

    if (!this.form().valid()) {
      this.toast.warning('Form is Invalid!', 'bottom-right', 5000);
      return;
    }

    this.isSubmitted.set(true);

    const payload = this.form().value();
    
    // Ensure dates are in YYYY-MM-DD string format
    const formatDateString = (date: string) =>
      date ? new Date(date).toISOString().split('T')[0] : '';

    if (payload.purDate) {
      payload.purDate = formatDateString(payload.purDate);
    }
    if (payload.depCalDate) {
      payload.depCalDate = formatDateString(payload.depCalDate);
    }
    if (payload.warrEndDate) {
      payload.warrEndDate = formatDateString(payload.warrEndDate);
    }

    const request$ = this.selected()
      ? this.assetDescriptionService.update(this.selected()!.id!, payload)
      : this.assetDescriptionService.add(payload);

    request$.subscribe({
      next: () => {
        this.loadAssetDescriptions();
        this.onToggleList();
        this.toast.success('Saved successfully!', 'bottom-right', 5000);
      },
      error: (error) => {
        this.toast.danger('Saved unsuccessful!', 'bottom-left', 3000);
        console.error('Error submitting form:', error);
        this.isSubmitted.set(false);
      }
    });
  }

  /* ---------------- UPDATE ---------------- */
  onUpdate(data: AssetDescriptionM) {
    this.selected.set(data);
    
    // Format dates for input fields (YYYY-MM-DD)
    const formatDate = (date: any): string => {
      if (!date) return '';
      const d = new Date(date);
      return d.toISOString().split('T')[0];
    };

    // Update form model
    this.model.update(current => ({
      assetName: data.assetName ?? "",
      assetCode: data.assetCode ?? "",
      qty: data.qty ?? "",
      assetTypeId: data.assetTypeId !== undefined && data.assetTypeId !== null ? String(data.assetTypeId) : "",
      vendorName: data.vendorName ?? "",
      purInvNO: data.purInvNO ?? "",
      purDate: formatDate(data.purDate),
      purPrice: data.purPrice !== undefined && data.purPrice !== null ? String(data.purPrice) : "",
      depCalDate: formatDate(data.depCalDate),
      deprePercentage: data.deprePercentage !== undefined && data.deprePercentage !== null ? String(data.deprePercentage) : "",
      location: data.location ?? "",
      warrEndDate: formatDate(data.warrEndDate),
      fileLink: data.fileLink ?? "",
      assetStatus: data.assetStatus !== undefined && data.assetStatus !== null ? String(data.assetStatus) : "1",
      remarks: data.remarks ?? "",
      postBy: this.authService.getUser()?.username || '',
      others1: data.others1 ?? "",
      others2: data.others2 ?? "",
      others3: data.others3 ?? ""
    }));
    
    this.showList.set(false);
  }

  /* ---------------- DELETE ---------------- */
  async onDelete(id: any) {
    const ok = await this.confirm.confirm({
      message: 'Are you sure you want to delete this asset?',
      confirmText: "Yes, I'm sure",
      cancelText: 'No, cancel',
      variant: 'danger',
    });

    if (ok) {
      this.assetDescriptionService.delete(id).subscribe({
        next: () => {
          this.assetDescriptions.update(list => list.filter(i => i.id !== id));
          this.toast.success('Asset deleted successfully!', 'bottom-right', 5000);
        },
        error: (error) => {
          this.toast.danger('Asset deleted unsuccessful!', 'bottom-left', 3000);
          console.error('Error deleting asset:', error);
        }
      });
    }
  }

  /* ---------------- RESET ---------------- */
  formReset() {
    this.model.set({
      assetName: "",
      assetCode: "",
      qty: "",
      assetTypeId: "",
      vendorName: "",
      purInvNO: "",
      purDate: new Date().toISOString().split('T')[0],
      purPrice: "",
      depCalDate: new Date().toISOString().split('T')[0],
      deprePercentage: "",
      location: "",
      warrEndDate: "",
      fileLink: "",
      assetStatus: "1",
      remarks: "",
      postBy: this.authService.getUser()?.username || '',
      others1: "",
      others2: "",
      others3: ""
    });

    this.selected.set(null);
    this.isSubmitted.set(false);
    this.form().reset();
  }

  onToggleList() {
    this.showList.update(s => !s);
    this.formReset();
  }
}