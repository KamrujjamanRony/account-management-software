import { Component, computed, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPencil, faXmark, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { form, required, validate, debounce, FormField } from '@angular/forms/signals';
import { BankService } from '../../../services/bank.service';
import { PermissionS } from '../../../../settings/services/permission-s';
import { ToastService } from '../../../../utils/toast/toast.service';
import { ConfirmService } from '../../../../utils/confirm/confirm.service';

@Component({
  selector: 'app-bank',
  imports: [FormsModule, FormField, FontAwesomeModule],
  templateUrl: './bank.html',
  styleUrl: './bank.css',
})
export class Bank {
  faPencil = faPencil;
  faXmark = faXmark;
  faMagnifyingGlass = faMagnifyingGlass;
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  /* ---------------- DI ---------------- */
  private bankService = inject(BankService);
  private permissionService = inject(PermissionS);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);



  /* ---------------- SIGNAL STATE ---------------- */
  supplier = signal<SupplierM[]>([]);
  searchQuery = signal('');

  isView = signal(false);
  isInsert = signal(false);
  isEdit = signal(false);
  isDelete = signal(false);
  showList = signal(true);

  filteredSupplierList = computed(() => {
    const query = this.searchQuery().toLowerCase();

    return this.supplier()
      .filter(data =>
        String(data.address ?? '').toLowerCase().includes(query) ||
        String(data.name ?? '').toLowerCase().includes(query) ||
        data.mobileNo?.toLowerCase().includes(query)
      )
  });

  selected = signal<SupplierM | null>(null);
  isLoading = signal(false);
  hasError = signal(false);
  isSubmitted = signal(false);


  /* ---------------- FORM MODEL ---------------- */
  model = signal({
    name: "",
    address: "",
    mobileNo: "",
    valid: 0,
    userName: "",
    vatNo: "",
    crNo: "",
    image1: "",
    image2: "",
    pno: 0
  });

  /* ---------------- SIGNAL FORM ---------------- */
  form = form(this.model, (schemaPath) => {
    required(schemaPath.name, { message: 'Supplier name is required' });
    debounce(schemaPath.name, 300);
  });

  /* ---------------- LIFECYCLE ---------------- */
  ngOnInit(): void {
    this.loadSupplier();
    this.loadPermissions();
  };

  /* ---------------- LOADERS ---------------- */
  loadPermissions() {
    this.isView.set(this.permissionService.hasPermission('Suppliers'));
    this.isInsert.set(this.permissionService.hasPermission('Suppliers', 'create'));
    this.isEdit.set(this.permissionService.hasPermission('Suppliers', 'edit'));
    this.isDelete.set(this.permissionService.hasPermission('Suppliers', 'delete'));
  }

  loadSupplier() {
    this.isLoading.set(true);
    this.hasError.set(false);

    const params = {
      searchText: ""
    };

    this.supplierService.search(params).subscribe({
      next: (data) => {
        this.supplier.set(data.map((d: SupplierM) => (d?.entryDate ? { ...d, entryDate: d?.entryDate.split("T")[0] } : { ...d })));
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

    const payload = this.form().value();

    const request$ = this.selected()
      ? this.supplierService.update(this.selected()!.id!, payload)
      : this.supplierService.add(payload);

    request$.subscribe({
      next: () => {
        this.loadSupplier();
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
  onUpdate(data: SupplierM) {
    // this.form().reset();
    this.selected.set(data);
    // Update form model
    this.model.update(current => ({
      ...current,
      name: this.selected()?.name ?? "",
      address: this.selected()?.address ?? "",
      mobileNo: this.selected()?.mobileNo ?? "",
      userName: this.selected()?.userName ?? "",
      vatNo: this.selected()?.vatNo ?? "",
      crNo: this.selected()?.crNo ?? "",
      image1: this.selected()?.image1 ?? "",
      image2: this.selected()?.image2 ?? "",
      valid: this.selected()?.valid ?? 0,
      pno: this.selected()?.pno ?? 0,
    }));
    this.showList.set(false);
  }

  /* ---------------- DELETE ---------------- */
  async onDelete(id: any) {
    const ok = await this.confirm.confirm({
      message: 'Are you sure you want to delete this Supplier?',
      confirmText: "Yes, I'm sure",
      cancelText: 'No, cancel',
      variant: 'danger',
    });

    if (ok) {
      // Delete Supplier
      this.supplierService.delete(id).subscribe({
        next: () => {
          this.supplier.update(list => list.filter(i => i.id !== id));
          this.toast.success('Supplier deleted successfully!', 'bottom-right', 5000);
        },
        error: (error) => {
        this.toast.danger('Supplier deleted unsuccessful!', 'bottom-left', 3000);
          console.error('Error deleting Supplier:', error);
        }
      });
    }
  }

  /* ---------------- RESET ---------------- */
  formReset() {
    this.model.set({
      name: "",
      address: "",
      mobileNo: "",
      valid: 0,
      userName: "",
      vatNo: "",
      crNo: "",
      image1: "",
      image2: "",
      pno: 0
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
