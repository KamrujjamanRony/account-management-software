import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPencil, faXmark, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { form, required, FormField } from '@angular/forms/signals';
import { UserAccessTreeComponent } from '../../components/user-access-tree/user-access-tree.component';
import { UserService } from '../../services/user.service';
import { MenuService } from '../../services/menu.service';
// import { EmployeeService } from '../../../hr/services/employee.service';
import { PermissionS } from '../../services/permission-s';
import { ToastService } from '../../../utils/toast/toast.service';
import { ConfirmService } from '../../../utils/confirm/confirm.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-users',
  imports: [FormsModule, FormField, FontAwesomeModule, UserAccessTreeComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersComponent {
  faPencil = faPencil;
  faXmark = faXmark;
  faMagnifyingGlass = faMagnifyingGlass;

  /* ---------------- DI ---------------- */
  private userService = inject(UserService);
  private menuService = inject(MenuService);
  // private employeeService = inject(EmployeeService);
  private permissionService = inject(PermissionS);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);
  private authService = inject(AuthService);

  /* ---------------- SIGNAL STATE ---------------- */
  users = signal<any[]>([]);
  searchQuery = signal('');
  employeeOption = signal<any[]>([]);
  userAccessTree = signal<any[]>([]);
  menuPermissions = signal<any[]>([]);

  isView = signal(false);
  isInsert = signal(false);
  isEdit = signal(false);
  isDelete = signal(false);
  showList = signal(true);

  filteredUserList = computed(() => {
    const query = this.searchQuery().toLowerCase();
    return this.users().filter(data =>
      String(data.userName ?? '').toLowerCase().includes(query)
    );
  });

  selected = signal<any>(null);
  isLoading = signal(false);
  hasError = signal(false);
  isSubmitted = signal(false);

  /* ---------------- FORM MODEL ---------------- */
  model = signal({
    userName: '',
    password: '',
    eId: '' as string,
    isActive: true,
  });

  /* ---------------- SIGNAL FORM ---------------- */
  form = form(this.model, (schemaPath) => {
    required(schemaPath.userName, { message: 'Username is required' });
  });

  /* ---------------- LIFECYCLE ---------------- */
  ngOnInit() {
    this.loadUsers();
    // this.loadEmployees();
    this.loadTreeData('');
    this.loadPermissions();
  }

  /* ---------------- LOADERS ---------------- */
  loadPermissions() {
    this.isView.set(this.permissionService.hasPermission('User'));
    this.isInsert.set(this.permissionService.hasPermission('User', 'Insert'));
    this.isEdit.set(this.permissionService.hasPermission('User', 'Edit'));
    this.isDelete.set(this.permissionService.hasPermission('User', 'Delete'));
  }

  loadUsers() {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.userService.getUser('').subscribe({
      next: (data) => {
        this.users.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.isLoading.set(false);
      }
    });
  }

  // loadEmployees() {
  //   this.employeeService.search('').subscribe((data) => {
  //     this.employeeOption.set(data.map((item: any) => ({
  //       value: item.eId,
  //       label: item.eName
  //     })));
  //   });
  // }

  loadTreeData(userId: any) {
    this.menuService.generateTreeData(userId).subscribe((data) => {
      this.userAccessTree.set(data);
    });
  }

  /* ---------------- SEARCH ---------------- */
  onSearch(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value.trim());
  }

  onDisplayEmployee(eId: any) {
    return eId ? this.employeeOption().find(item => item?.value === eId)?.label : '';
  }

  /* ---------------- FIELD HELPERS ---------------- */
  setEmployee(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.model.update(m => ({ ...m, eId: value || '' }));
  }

  setIsActive(value: boolean) {
    this.model.update(m => ({ ...m, isActive: value }));
  }

  savePermissions() {
    const selectedNodes = this.userAccessTree();
    this.menuPermissions.set(selectedNodes);
  }

  /* ---------------- SUBMIT ---------------- */
  onSubmit(event: Event) {
    event.preventDefault();

    if (!this.form().valid()) {
      this.toast.warning('Form is invalid! Please fill all required fields.', 'bottom-right', 5000);
      return;
    }

    this.isSubmitted.set(true);
    this.savePermissions();

    const payload = {
      ...this.form().value(),
      eId: this.model().eId || null,
      isActive: this.model().isActive,
      menuPermissions: this.menuPermissions(),
    };

    const request$ = this.selected()
      ? this.userService.updateUser(this.selected().id, payload)
      : this.userService.addUser(payload);

    request$.subscribe({
      next: (response) => {
        console.log(response);
        if (response !== null && response !== undefined) {
          this.loadUsers();
          this.onToggleList();
          this.toast.success(
            response.message,
            'bottom-right', 5000
          );
        }
      },
      error: (error) => {
        console.error('Error:', error);
        if (error.error?.message || error.error?.title) {
          this.toast.danger(`${error.error.status} : ${error.error.message || error.error.title}`, 'bottom-right', 5000);
        }
        this.isSubmitted.set(false);
      }
    });
  }

  /* ---------------- UPDATE ---------------- */
  onUpdate(data: any) {
    this.selected.set(data);
    this.loadTreeData(data.id);
    this.model.update(current => ({
      ...current,
      userName: data?.userName ?? '',
      password: data?.password ?? '',
      eId: data?.eId ?? '',
      isActive: data?.isActive ?? true,
    }));
    this.menuPermissions.set(data?.menuPermissions ?? []);
    this.showList.set(false);
  }

  /* ---------------- DELETE ---------------- */
  async onDelete(id: any) {
    const ok = await this.confirm.confirm({
      message: 'Are you sure you want to delete this user?',
      confirmText: "Yes, I'm sure",
      cancelText: 'No, cancel',
      variant: 'danger',
    });

    if (ok) {
      this.userService.deleteUser(id).subscribe({
        next: (data) => {
          if (data.id) {
            this.users.update(list => list.filter(i => i.id !== id));
            this.toast.success('User deleted successfully!', 'bottom-right', 5000);
          } else {
            this.toast.danger('Error deleting user!', 'bottom-right', 3000);
          }
        },
        error: (error) => {
          this.toast.danger('Error deleting user!', 'bottom-right', 3000);
          console.error('Error deleting user:', error);
        }
      });
    }
  }

  /* ---------------- RESET ---------------- */
  formReset() {
    this.model.set({
      userName: '',
      password: '',
      eId: '',
      isActive: true,
    });
    this.menuPermissions.set([]);
    this.selected.set(null);
    this.isSubmitted.set(false);
    this.form().reset();
    this.loadTreeData('');
  }

  onToggleList() {
    this.showList.set(true);
    this.formReset();
  }
}
