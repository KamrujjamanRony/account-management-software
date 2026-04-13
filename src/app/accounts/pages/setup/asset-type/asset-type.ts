import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPencil, faXmark, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { form, required, debounce, FormField } from '@angular/forms/signals';
import { AssetTypeService } from '../../../services/asset-type.service';
import { PermissionS } from '../../../../settings/services/permission-s';
import { ToastService } from '../../../../utils/toast/toast.service';
import { ConfirmService } from '../../../../utils/confirm/confirm.service';
import { AuthService } from '../../../../settings/services/auth.service';
import { AssetTypeM } from '../../../models/asset-type';

@Component({
  selector: 'app-asset-type',
  imports: [FormsModule, FormField, FontAwesomeModule],
  templateUrl: './asset-type.html',
  styleUrl: './asset-type.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssetType {
  faPencil = faPencil;
  faXmark = faXmark;
  faMagnifyingGlass = faMagnifyingGlass;
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  /* ---------------- DI ---------------- */
  private assetTypeService = inject(AssetTypeService);
  private permissionService = inject(PermissionS);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);
  private authService = inject(AuthService);

  /* ---------------- SIGNAL STATE ---------------- */
  assetTypes = signal<AssetTypeM[]>([]);
  searchQuery = signal('');

  isView = signal(false);
  isInsert = signal(false);
  isEdit = signal(false);
  isDelete = signal(false);
  showList = signal(true);

  filteredAssetTypeList = computed(() => {
    const query = this.searchQuery().toLowerCase();

    return this.assetTypes()
      .filter(data =>
        String(data.assetTypeName ?? '').toLowerCase().includes(query)
      );
  });

  selected = signal<AssetTypeM | null>(null);
  isLoading = signal(false);
  hasError = signal(false);
  isSubmitted = signal(false);

  /* ---------------- FORM MODEL ---------------- */
  model = signal({
    assetTypeName: "",
    postedBy: this.authService.getUser()?.username || ''
  });

  /* ---------------- SIGNAL FORM ---------------- */
  form = form(this.model, (schemaPath) => {
    required(schemaPath.assetTypeName, { message: 'Asset Type name is required' });
    debounce(schemaPath.assetTypeName, 300);
  });

  /* ---------------- LIFECYCLE ---------------- */
  ngOnInit(): void {
    this.loadAssetTypes();
    this.loadPermissions();
  }

  /* ---------------- LOADERS ---------------- */
  loadPermissions() {
    this.isView.set(this.permissionService.hasPermission('Asset Type')); // Adjust permission name as needed
    this.isInsert.set(this.permissionService.hasPermission('Asset Type', 'insert'));
    this.isEdit.set(this.permissionService.hasPermission('Asset Type', 'edit'));
    this.isDelete.set(this.permissionService.hasPermission('Asset Type', 'delete'));

    // debug
    console.log('Permissions - View:', this.isView(), 'Insert:', this.isInsert(), 'Edit:', this.isEdit(), 'Delete:', this.isDelete());
  }

  loadAssetTypes() {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.assetTypeService.search("").subscribe({
      next: (data) => {
        this.assetTypes.set(data);
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
      ? this.assetTypeService.update(this.selected()!.id!, payload)
      : this.assetTypeService.add(payload);

    request$.subscribe({
      next: () => {
        this.loadAssetTypes();
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
  onUpdate(data: AssetTypeM) {
    this.selected.set(data);
    // Update form model
    this.model.update(current => ({
      ...current,
      assetTypeName: this.selected()?.assetTypeName ?? "",
      postedBy: this.selected()?.postedBy ?? "",
    }));
    this.showList.set(false);
  }

  /* ---------------- DELETE ---------------- */
  async onDelete(id: any) {
    console.log(id);
    const ok = await this.confirm.confirm({
      message: 'Are you sure you want to delete this asset type?',
      confirmText: "Yes, I'm sure",
      cancelText: 'No, cancel',
      variant: 'danger',
    });

    console.log(ok);

    if (ok) {
      // Delete asset type
      this.assetTypeService.delete(id).subscribe({
        next: () => {
          this.assetTypes.update(list => list.filter(i => i.id !== id));
          this.toast.success('Asset Type deleted successfully!', 'bottom-right', 5000);
        },
        error: (error) => {
          this.toast.danger('Asset Type deleted unsuccessful!', 'bottom-left', 3000);
          console.error('Error deleting asset type:', error);
        }
      });
    }
  }

  /* ---------------- RESET ---------------- */
  formReset() {
    this.model.set({
      assetTypeName: "",
      postedBy: this.authService.getUser()?.username || ''
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
