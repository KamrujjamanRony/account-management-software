import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPencil, faXmark, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { form, required, validate, debounce, FormField, maxLength } from '@angular/forms/signals';
import { VendorService } from '../../../services/vendor.service';
import { PermissionS } from '../../../../settings/services/permission-s';
import { ToastService } from '../../../../utils/toast/toast.service';
import { ConfirmService } from '../../../../utils/confirm/confirm.service';
import { AuthService } from '../../../../settings/services/auth.service';
// import { VendorM } from '../../../models/Vendor'; // Create this model if not exists

@Component({
  selector: 'app-vendor-entry',
  imports: [FormsModule, FormField, FontAwesomeModule],
  templateUrl: './vendor-entry.component.html',
  styleUrls: ['./vendor-entry.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorEntryComponent {
  faPencil = faPencil;
  faXmark = faXmark;
  faMagnifyingGlass = faMagnifyingGlass;
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  /* ---------------- DI ---------------- */
  private vendorService = inject(VendorService);
  private permissionService = inject(PermissionS);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);
  private authService = inject(AuthService);

  /* ---------------- SIGNAL STATE ---------------- */
  vendors = signal<any[]>([]); // Replace 'any' with VendorM type
  searchQuery = signal('');

  isView = signal(false);
  isInsert = signal(false);
  isEdit = signal(false);
  isDelete = signal(false);
  showList = signal(true);

  filteredVendorList = computed(() => {
    const query = this.searchQuery().toLowerCase();

    return this.vendors()
      .filter(data =>
        String(data.name ?? '').toLowerCase().includes(query) ||
        String(data.address ?? '').toLowerCase().includes(query) ||
        String(data.mobile ?? '').toLowerCase().includes(query) ||
        String(data.remarks ?? '').toLowerCase().includes(query)
      )
  });

  selected = signal<any | null>(null); // Replace 'any' with VendorM type
  isLoading = signal(false);
  hasError = signal(false);
  isSubmitted = signal(false);

  /* ---------------- FORM MODEL ---------------- */
  model = signal({
    name: "",
    address: "",
    mobile: "",
    remarks: "",
    postBy: this.authService.getUser()?.username || ''
  });

  /* ---------------- SIGNAL FORM ---------------- */
  form = form(this.model, (schemaPath) => {
    required(schemaPath.name, { message: 'Vendor name is required' });
    debounce(schemaPath.name, 300);

    // Optional: Add validation for mobile
    maxLength(schemaPath.mobile, 11, { message: 'Mobile cannot exceed 11 digits' });
    debounce(schemaPath.mobile, 300);
  });

  /* ---------------- LIFECYCLE ---------------- */
  ngOnInit(): void {
    this.loadVendors();
    this.loadPermissions();
  }

  /* ---------------- LOADERS ---------------- */
  loadPermissions() {
    this.isView.set(this.permissionService.hasPermission('Vendor Setup'));
    this.isInsert.set(this.permissionService.hasPermission('Vendor Setup', 'create'));
    this.isEdit.set(this.permissionService.hasPermission('Vendor Setup', 'edit'));
    this.isDelete.set(this.permissionService.hasPermission('Vendor Setup', 'delete'));
  }

  loadVendors() {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.vendorService.getVendor("").subscribe({
      next: (data) => {
        this.vendors.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.isLoading.set(false);
      }
    });
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

    const payload = {
      ...this.form().value(),
      postBy: this.form().value().postBy || 'system' // Ensure postBy has a value
    };

    const request$ = this.selected()
      ? this.vendorService.updateVendor(this.selected()!.id!, payload)
      : this.vendorService.addVendor(payload);

    request$.subscribe({
      next: (response) => {
        if (this.selected()) {
          // Update the existing item in the list
          this.vendors.update(list =>
            list.map(item => item.id === response.id ? response : item)
          );
        } else {
          // Add new item to the list
          this.vendors.update(list => [response, ...list]);
        }

        this.onToggleList();
        this.toast.success('Saved successfully!', 'bottom-right', 5000);
      },
      error: (error) => {
        this.toast.danger('Save unsuccessful!', 'bottom-left', 3000);
        console.error('Error submitting form:', error);
        this.isSubmitted.set(false);
      }
    });
  }

  /* ---------------- UPDATE ---------------- */
  onUpdate(data: any) { // Replace 'any' with VendorM type
    this.selected.set(data);

    // Update form model
    this.model.update(current => ({
      ...current,
      name: this.selected()?.name ?? "",
      address: this.selected()?.address ?? "",
      mobile: this.selected()?.mobile ?? "",
      remarks: this.selected()?.remarks ?? "",
      postBy: this.selected()?.postBy ?? "",
    }));

    this.showList.set(false);
  }

  /* ---------------- DELETE ---------------- */
  async onDelete(id: any) {
    const ok = await this.confirm.confirm({
      message: 'Are you sure you want to delete this vendor?',
      confirmText: "Yes, I'm sure",
      cancelText: 'No, cancel',
      variant: 'danger',
    });

    if (ok) {
      this.vendorService.deleteVendor(id).subscribe({
        next: (response) => {
          if (response && response.id) {
            this.vendors.update(list => list.filter(i => i.id !== id));
            this.toast.success('Vendor deleted successfully!', 'bottom-right', 5000);
          } else {
            this.toast.danger('Delete unsuccessful!', 'bottom-left', 3000);
          }
        },
        error: (error) => {
          this.toast.danger('Delete unsuccessful!', 'bottom-left', 3000);
          console.error('Error deleting vendor:', error);
        }
      });
    }
  }

  /* ---------------- RESET ---------------- */
  formReset() {
    this.model.set({
      name: "",
      address: "",
      mobile: "",
      remarks: "",
      postBy: this.authService.getUser()?.username || ''
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