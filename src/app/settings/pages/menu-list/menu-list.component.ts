import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPencil, faXmark, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { form, required, FormField } from '@angular/forms/signals';
import { MenuService } from '../../services/menu.service';
import { PermissionS } from '../../services/permission-s';
import { ToastService } from '../../../utils/toast/toast.service';
import { ConfirmService } from '../../../utils/confirm/confirm.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-menu-list',
  imports: [FormsModule, FormField, FontAwesomeModule],
  templateUrl: './menu-list.component.html',
  styleUrl: './menu-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuListComponent {
  faPencil = faPencil;
  faXmark = faXmark;
  faMagnifyingGlass = faMagnifyingGlass;

  /* ---------------- DI ---------------- */
  private menuService = inject(MenuService);
  private permissionService = inject(PermissionS);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);
  private authService = inject(AuthService);

  /* ---------------- SIGNAL STATE ---------------- */
  menus = signal<any[]>([]);
  searchQuery = signal('');

  isView = signal(false);
  isInsert = signal(false);
  isEdit = signal(false);
  isDelete = signal(false);
  showList = signal(true);

  menuOptions = computed(() =>
    this.menus().map(m => ({ key: m.id, value: m.menuName }))
  );

  filteredMenuList = computed(() => {
    const query = this.searchQuery().toLowerCase();
    return this.menus().filter(data =>
      String(data.menuName ?? '').toLowerCase().includes(query) ||
      String(data.moduleName ?? '').toLowerCase().includes(query) ||
      String(data.url ?? '').toLowerCase().includes(query)
    );
  });

  selected = signal<any>(null);
  isLoading = signal(false);
  hasError = signal(false);
  isSubmitted = signal(false);

  options = ['View', 'Insert', 'Edit', 'Delete'];

  /* ---------------- FORM MODEL ---------------- */
  model = signal({
    menuName: '',
    moduleName: '',
    parentMenuId: null as string | null,
    url: '',
    isActive: true,
    icon: '',
    permissionsKey: [] as string[],
  });

  /* ---------------- SIGNAL FORM ---------------- */
  form = form(this.model, (schemaPath) => {
    required(schemaPath.menuName, { message: 'Menu name is required' });
  });

  /* ---------------- LIFECYCLE ---------------- */
  ngOnInit() {
    this.loadMenus();
    this.loadPermissions();
  }

  /* ---------------- LOADERS ---------------- */
  loadPermissions() {
    const user = this.authService.getUser();
    if (user?.username === 'SuperSoft') {
      this.isView.set(this.permissionService.hasPermission('Menu'));
      this.isInsert.set(this.permissionService.hasPermission('Menu', 'Insert'));
      this.isEdit.set(this.permissionService.hasPermission('Menu', 'Edit'));
      this.isDelete.set(this.permissionService.hasPermission('Menu', 'Delete'));
    }
  }

  loadMenus() {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.menuService.search().subscribe({
      next: (data) => {
        this.menus.set(data);
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

  getParentMenuName(menuId: any): string {
    return this.menuOptions().find(m => m.key === menuId)?.value ?? '';
  }

  /* ---------------- FIELD HELPERS ---------------- */
  onTogglePermission(perm: string) {
    this.model.update(m => {
      const current = m.permissionsKey || [];
      const updated = current.includes(perm)
        ? current.filter(p => p !== perm)
        : [...current, perm];
      return { ...m, permissionsKey: updated };
    });
  }

  setIsActive(value: boolean) {
    this.model.update(m => ({ ...m, isActive: value }));
  }

  setParentMenuId(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.model.update(m => ({ ...m, parentMenuId: value || null }));
  }

  /* ---------------- SUBMIT ---------------- */
  onSubmit(event: Event) {
    event.preventDefault();

    if (!this.form().valid()) {
      this.toast.warning('Form is invalid! Please fill Menu Name field!', 'bottom-right', 5000);
      return;
    }

    this.isSubmitted.set(true);

    const payload = {
      ...this.form().value(),
      parentMenuId: this.model().parentMenuId || null,
      permissionsKey: this.model().permissionsKey || [],
      isActive: this.model().isActive,
    };

    const request$ = this.selected()
      ? this.menuService.update(this.selected().id, payload)
      : this.menuService.add(payload);

    request$.subscribe({
      next: () => {
        this.loadMenus();
        this.onToggleList();
        this.toast.success('Menu saved successfully!', 'bottom-right', 5000);
      },
      error: (error) => {
        this.toast.danger('Save unsuccessful!', 'bottom-right', 3000);
        console.error('Error submitting form:', error);
        this.isSubmitted.set(false);
      }
    });
  }

  /* ---------------- UPDATE ---------------- */
  onUpdate(data: any) {
    this.selected.set(data);
    this.model.update(current => ({
      ...current,
      menuName: data?.menuName ?? '',
      moduleName: data?.moduleName ?? '',
      parentMenuId: data?.parentMenuId ?? null,
      url: data?.url ?? '',
      isActive: data?.isActive ?? true,
      icon: data?.icon ?? '',
      permissionsKey: data?.permissionsKey ?? [],
    }));
    this.showList.set(false);
  }

  /* ---------------- DELETE ---------------- */
  async onDelete(id: any) {
    const ok = await this.confirm.confirm({
      message: 'Are you sure you want to delete this menu?',
      confirmText: "Yes, I'm sure",
      cancelText: 'No, cancel',
      variant: 'danger',
    });

    if (ok) {
      this.menuService.delete(id).subscribe({
        next: (data) => {
          if (data.id) {
            this.menus.update(list => list.filter(i => i.id !== id));
            this.toast.success('Menu deleted successfully!', 'bottom-right', 5000);
          } else {
            this.toast.danger('Error deleting menu!', 'bottom-right', 3000);
          }
        },
        error: (error) => {
          this.toast.danger('Error deleting menu!', 'bottom-right', 3000);
          console.error('Error deleting menu:', error);
        }
      });
    }
  }

  /* ---------------- RESET ---------------- */
  formReset() {
    this.model.set({
      menuName: '',
      moduleName: '',
      parentMenuId: null,
      url: '',
      isActive: true,
      icon: '',
      permissionsKey: [],
    });
    this.selected.set(null);
    this.isSubmitted.set(false);
    this.form().reset();
  }

  onToggleList() {
    this.showList.set(true);
    this.formReset();
  }
}
