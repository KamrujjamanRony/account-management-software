import { Component, computed, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { 
  faPencil, 
  faXmark, 
  faMagnifyingGlass,
  faGrin,
  faTree 
} from '@fortawesome/free-solid-svg-icons';
import { form, required, validate, debounce, FormField } from '@angular/forms/signals';
import { BankService } from '../../../services/bank.service';
import { AccountListService } from '../../../services/account-list.service';
import { PermissionS } from '../../../../settings/services/permission-s';
import { ToastService } from '../../../../utils/toast/toast.service';
import { ConfirmService } from '../../../../utils/confirm/confirm.service';
import { TreeNodeComponent } from './tree-node';
import { AuthService } from '../../../../settings/services/auth.service';

@Component({
  selector: 'app-account-list-entry',
  standalone: true,
  imports: [CommonModule, FormsModule, FormField, FontAwesomeModule, TreeNodeComponent],
  templateUrl: './account-list-entry.component.html',
  styleUrls: ['./account-list-entry.component.css']
})
export class AccountListEntryComponent {
  // Icons
  faPencil = faPencil;
  faXmark = faXmark;
  faMagnifyingGlass = faMagnifyingGlass;
  faGrin = faGrin;
  faTree = faTree;
  
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  /* ---------------- DI ---------------- */
  private bankService = inject(BankService);
  private accountListService = inject(AccountListService);
  private permissionService = inject(PermissionS);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);
  private authService = inject(AuthService);

  /* ---------------- SIGNAL STATE ---------------- */
  accounts = signal<any[]>([]);
  searchQuery = signal('');

  isView = signal(false);
  isInsert = signal(false);
  isEdit = signal(false);
  isDelete = signal(false);
  showList = signal(true);
  
  // UI State
  show = signal(false);
  isGrid = signal(true);
  isCollapsed = signal<{ [key: number]: boolean }>({});

  // Dropdown Options
  controlHeadOption = signal<any[]>([]);
  bankOption = signal<any[]>([]);
  accountGroupOption = signal<string[]>([
    "Current Asset", "NonCurrent/Fixed Asset", "Current Liability", 
    "NonCurrent Liability", "Equity", "Income", "Expenses", 
    "Assets", "Liability"
  ]);
  coaMapOption = signal<string[]>(["Cash", "Bank"]);

  // Tree Data
  treeData = signal<any[]>([]);
  isLoadingTree = signal(false);
  hasErrorTree = signal(false);

  filteredAccountList = computed(() => {
    const query = this.searchQuery().toLowerCase();

    return this.accounts()
      .filter(data =>
        String(data.accountCode ?? '').toLowerCase().includes(query) ||
        String(data.subHead ?? '').toLowerCase().includes(query) ||
        String(data.accountGroup ?? '').toLowerCase().includes(query) ||
        String(data.coaMap ?? '').toLowerCase().includes(query) ||
        String(data.accountNo ?? '').toLowerCase().includes(query) ||
        String(data.remarks ?? '').toLowerCase().includes(query)
      )
  });

  selected = signal<any | null>(null);
  isLoading = signal(false);
  hasError = signal(false);
  isSubmitted = signal(false);

  /* ---------------- FORM MODEL ---------------- */
  // Use primitive values only (strings)
  model = signal({
    controlHeadId: '',
    accountCode: '',
    accountGroup: '',
    subHead: '',
    coaMap: '',
    bankId: '0',
    accountNo: '',
    openingBalance: '0',
    remarks: '',
    postBy: this.authService.getUser()?.username || ''
  });

  /* ---------------- SIGNAL FORM ---------------- */
  form = form(this.model, (schemaPath) => {
    required(schemaPath.subHead, { message: 'Sub head is required' });
    required(schemaPath.controlHeadId, { message: 'Control head is required' });
    required(schemaPath.accountGroup, { message: 'Account group is required' });
    debounce(schemaPath.subHead, 300);
    
    // Custom validation for opening balance
    validate(schemaPath.openingBalance, (field) => {
      const openingBalance = field.value();

      if (openingBalance && Number.isNaN(Number(openingBalance))) {
        return { kind: 'openingBalance', message: 'Opening balance must be a number' };
      }

      return null;
    });
  });

  /* ---------------- LIFECYCLE ---------------- */
  ngOnInit(): void {
    this.loadPermissions();
    this.loadAccounts();
    this.loadBanks();
    this.loadAccountTree();
  }

  /* ---------------- LOADERS ---------------- */
  loadPermissions() {
    this.isView.set(this.permissionService.hasPermission('Chart Of Account'));
    this.isInsert.set(this.permissionService.hasPermission('Chart Of Account', 'insert'));
    this.isEdit.set(this.permissionService.hasPermission('Chart Of Account', 'edit'));
    this.isDelete.set(this.permissionService.hasPermission('Chart Of Account', 'delete'));
    
    console.log('Insert permission:', this.isInsert()); // Debug log
  }

  loadAccounts() {
    this.isLoading.set(true);
    this.hasError.set(false);

    const params = {
      headId: null,
      allbyheadId: 1,
      search: null,
      coaMap: [],
      accountGroup: []
    };

    this.accountListService.getAccountList(params).subscribe({
      next: (data) => {
        this.accounts.set(data);
        const heads = data.map((c: any) => ({ id: c.id, text: c.subHead }));
        this.controlHeadOption.set(heads);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading accounts:', error);
        this.hasError.set(true);
        this.isLoading.set(false);
      }
    });
  }

  loadBanks() {
    this.bankService.search('').subscribe({
      next: (data) => {
        this.bankOption.set(data.map((b: any) => ({ id: b.id, text: b.name })));
      },
      error: (error) => {
        console.error('Error loading banks:', error);
      }
    });
  }

  loadAccountTree() {
    this.isLoadingTree.set(true);
    this.hasErrorTree.set(false);

    this.accountListService.getTreeView().subscribe({
      next: (data) => {
        console.log('Tree data:', data[0]); // Debug log
        this.treeData.set(data);
        this.initializeCollapseState(this.treeData());
        this.isLoadingTree.set(false);
      },
      error: (error) => {
        console.error('Error loading tree:', error);
        this.hasErrorTree.set(true);
        this.isLoadingTree.set(false);
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

    const formValue = this.form().value();
    
    // Prepare payload for API
    const payload = {
      controlHeadId: formValue.controlHeadId ? Number(formValue.controlHeadId) : null,
      accountCode: formValue.accountCode || '',
      accountGroup: formValue.accountGroup || '',
      subHead: formValue.subHead || '',
      coaMap: formValue.coaMap || '',
      bankId: formValue.bankId ? Number(formValue.bankId) : 0,
      accountNo: formValue.accountNo || '',
      openingBalance: formValue.openingBalance ? Number(formValue.openingBalance) : 0,
      remarks: formValue.remarks || '',
      postBy: formValue.postBy || this.authService.getUser()?.username || 'system'
    };

    const request$ = this.selected()
      ? this.accountListService.updateAccountList(this.selected()!.id, payload)
      : this.accountListService.addAccountList(payload);

    request$.subscribe({
      next: (response) => {
        if (this.selected()) {
          // Update the existing item in the list
          this.accounts.update(list => 
            list.map(item => item.id === response.id ? response : item)
          );
        } else {
          // Add new item to the list
          this.accounts.update(list => [response, ...list]);
        }
        
        // Refresh tree data
        this.loadAccountTree();
        this.onToggleList();
        this.toast.success('Saved successfully!', 'bottom-right', 5000);
        this.isSubmitted.set(false);
      },
      error: (error) => {
        this.toast.danger(error.error?.message || 'Save unsuccessful!', 'bottom-left', 3000);
        console.error('Error submitting form:', error);
        this.isSubmitted.set(false);
      }
    });
  }

  /* ---------------- UPDATE ---------------- */
  onUpdate(data: any) {
    this.selected.set(data);
    
    // Update form model with string values
    this.model.update(current => ({
      ...current,
      controlHeadId: String(data?.controlHeadId ?? ''),
      accountCode: data?.accountCode ?? '',
      accountGroup: data?.accountGroup ?? '',
      subHead: data?.subHead ?? '',
      coaMap: data?.coaMap ?? '',
      bankId: String(data?.bankId ?? '0'),
      accountNo: data?.accountNo ?? '',
      openingBalance: String(data?.openingBalance ?? '0'),
      remarks: data?.remarks ?? '',
      postBy: data?.postBy ?? '',
    }));
    
    this.showList.set(false);
  }

  /* ---------------- DELETE ---------------- */
  async onDelete(id: any) {
    const ok = await this.confirm.confirm({
      message: 'Are you sure you want to delete this account?',
      confirmText: "Yes, I'm sure",
      cancelText: 'No, cancel',
      variant: 'danger',
    });

    if (ok) {
      this.accountListService.deleteAccountList(id).subscribe({
        next: (response) => {
          if (response && response.id) {
            this.accounts.update(list => list.filter(i => i.id !== id));
            this.loadAccountTree(); // Refresh tree data
            this.toast.success('Account deleted successfully!', 'bottom-right', 5000);
          } else {
            this.toast.danger('Delete unsuccessful!', 'bottom-left', 3000);
          }
        },
        error: (error) => {
          this.toast.danger(error.error?.message || 'Delete unsuccessful!', 'bottom-left', 3000);
          console.error('Error deleting account:', error);
        }
      });
    }
  }

  /* ---------------- RESET ---------------- */
  formReset() {
    this.model.set({
      controlHeadId: '',
      accountCode: '',
      accountGroup: '',
      subHead: '',
      coaMap: '',
      bankId: '0',
      accountNo: '',
      openingBalance: '0',
      remarks: '',
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

  onToggleShow(e: Event) {
    e.preventDefault();
    this.show.update(s => !s);
  }

  /* ---------------- TREE FUNCTIONS ---------------- */
  initializeCollapseState(nodes: any[]) {
    const newCollapsed: { [key: number]: boolean } = {};
    
    const setCollapsed = (nodeList: any[]) => {
      nodeList.forEach(node => {
        newCollapsed[node.id] = true;
        if (node.children && node.children.length > 0) {
          setCollapsed(node.children);
        }
      });
    };
    
    setCollapsed(nodes);
    this.isCollapsed.set(newCollapsed);
  }

  toggleNode(id: number, length: number) {
    if (length > 0) {
      this.isCollapsed.update(state => ({
        ...state,
        [id]: !state[id]
      }));
    }
  }

  onAdd(node: any) {
    console.log('Adding child to node:', node); // Debug log
    
    // Find the account data for this node
    const findData = this.accounts().find((d: any) => d.id == node.id);
    
    // Update form model
    this.model.update(current => ({
      ...current,
      controlHeadId: String(node?.id ?? ''),
      accountGroup: findData?.accountGroup ?? '',
    }));
    
    this.showList.set(false);
    
    // Show warning toast
    this.toast.warning(`Adding child under: ${node.subHead}`, 'bottom-right', 3000);
  }

  /* ---------------- UTILITY FUNCTIONS ---------------- */
  displayHead(id: any): string {
    if (!id) return '-';
    const found = this.controlHeadOption().find((option: any) => option.id == id);
    return found?.text ?? '-';
  }

  checkPermission(moduleName: string, permission: string) {
    const modulePermission = this.authService.getUser()?.userMenu?.find(
      (module: any) => module?.menuName?.toLowerCase() === moduleName.toLowerCase()
    );
    
    if (modulePermission) {
      const permissionValue = modulePermission.permissions.find(
        (perm: any) => perm.toLowerCase() === permission.toLowerCase()
      );
      return !!permissionValue;
    }
    return false;
  }
}