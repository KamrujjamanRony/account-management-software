import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPencil, faXmark, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { form, required, validate, debounce, FormField } from '@angular/forms/signals';
import { BankService } from '../../../services/bank.service';
import { PermissionS } from '../../../../settings/services/permission-s';
import { ToastService } from '../../../../utils/toast/toast.service';
import { ConfirmService } from '../../../../utils/confirm/confirm.service';
import { BankM } from '../../../models/Bank';
import { AuthService } from '../../../../settings/services/auth.service';

@Component({
  selector: 'app-bank',
  imports: [FormsModule, FormField, FontAwesomeModule],
  templateUrl: './bank.html',
  styleUrl: './bank.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  private authService = inject(AuthService);



  /* ---------------- SIGNAL STATE ---------------- */
  banks = signal<BankM[]>([]);
  searchQuery = signal('');

  isView = signal(false);
  isInsert = signal(false);
  isEdit = signal(false);
  isDelete = signal(false);
  showList = signal(true);

  filteredBankList = computed(() => {
    const query = this.searchQuery().toLowerCase();

    return this.banks()
      .filter(data =>
        String(data.address ?? '').toLowerCase().includes(query) ||
        String(data.name ?? '').toLowerCase().includes(query)
      )
  });

  selected = signal<BankM | null>(null);
  isLoading = signal(false);
  hasError = signal(false);
  isSubmitted = signal(false);


  /* ---------------- FORM MODEL ---------------- */
  model = signal({
    name: "",
    address: "",
    remarks: "",
    postBy: this.authService.getUser()?.username || ''
  });

  /* ---------------- SIGNAL FORM ---------------- */
  form = form(this.model, (schemaPath) => {
    required(schemaPath.name, { message: 'Bank name is required' });
    debounce(schemaPath.name, 300);
  });

  /* ---------------- LIFECYCLE ---------------- */
  ngOnInit(): void {
    this.loadBank();
    this.loadPermissions();
  };

  /* ---------------- LOADERS ---------------- */
  loadPermissions() {
    this.isView.set(this.permissionService.hasPermission('Bank Setup'));
    this.isInsert.set(this.permissionService.hasPermission('Bank Setup', 'create'));
    this.isEdit.set(this.permissionService.hasPermission('Bank Setup', 'edit'));
    this.isDelete.set(this.permissionService.hasPermission('Bank Setup', 'delete'));
  }

  loadBank() {
    this.isLoading.set(true);
    this.hasError.set(false);

    const params = {
      searchText: ""
    };

    this.bankService.search("").subscribe({
      next: (data) => {
        this.banks.set(data);
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
      ? this.bankService.update(this.selected()!.id!, payload)
      : this.bankService.add(payload);

    request$.subscribe({
      next: () => {
        this.loadBank();
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
  onUpdate(data: BankM) {
    // this.form().reset();
    this.selected.set(data);
    // Update form model
    this.model.update(current => ({
      ...current,
      name: this.selected()?.name ?? "",
      address: this.selected()?.address ?? "",
      remarks: this.selected()?.remarks ?? "",
      postBy: this.selected()?.postBy ?? "",
    }));
    this.showList.set(false);
  }

  /* ---------------- DELETE ---------------- */
  async onDelete(id: any) {
    console.log(id);
    const ok = await this.confirm.confirm({
      message: 'Are you sure you want to delete this bank?',
      confirmText: "Yes, I'm sure",
      cancelText: 'No, cancel',
      variant: 'danger',
    });

    console.log(ok);

    if (ok) {
      // Delete bank
      this.bankService.delete(id).subscribe({
        next: () => {
          this.banks.update(list => list.filter(i => i.id !== id));
          this.toast.success('Bank deleted successfully!', 'bottom-right', 5000);
        },
        error: (error) => {
        this.toast.danger('Bank deleted unsuccessful!', 'bottom-left', 3000);
          console.error('Error deleting bank:', error);
        }
      });
    }
  }

  /* ---------------- RESET ---------------- */
  formReset() {
    this.model.set({
      name: "",
      address: "",
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
