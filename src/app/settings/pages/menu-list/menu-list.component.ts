import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, signal, viewChild, viewChildren } from '@angular/core';
import { FieldComponent } from '../../../shared/components/field/field.component';
import { SearchComponent } from '../../../shared/components/svg/search/search.component';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DataFetchService } from '../../../shared/services/useDataFetch';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { MenuService } from '../../services/menu.service';
import { MultiSelectModule } from 'primeng/multiselect';
import { ToastService } from '../../../shared/components/primeng/toast/toast.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-menu-list',
  imports: [CommonModule, FieldComponent, SearchComponent, ReactiveFormsModule, MultiSelectModule],
  templateUrl: './menu-list.component.html',
  styleUrl: './menu-list.component.css'
})
export class MenuListComponent {
  fb = inject(NonNullableFormBuilder);
  private menuService = inject(MenuService);
  private dataFetchService = inject(DataFetchService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  isView = signal<boolean>(false);
  isInsert = signal<boolean>(false);
  isEdit = signal<boolean>(false);
  isDelete = signal<boolean>(false);
  filteredMenuList = signal<any[]>([]);
  menuOptions = signal<any[]>([]);
  highlightedTr: number = -1;
  selectedMenu: any;

  private searchQuery$ = new BehaviorSubject<string>('');
  isLoading$: Observable<any> | undefined;
  hasError$: Observable<any> | undefined;
  readonly inputRefs = viewChildren<ElementRef>('inputRef');
  readonly searchInput = viewChild.required<ElementRef<HTMLInputElement>>('searchInput');
  isSubmitted = false;
  options: any[] = ['View', 'Insert', 'Edit', 'Delete'];

  form = this.fb.group({
    menuName: ['', [Validators.required]],
    moduleName: [''],
    parentMenuId: [null],
    url: [''],
    isActive: [true],
    icon: [''],
    permissionsKey: [''],
  });

  ngOnInit() {
    this.onLoadMenu();
    this.isView.set(this.checkPermission("Menu", "View"));
    this.isInsert.set(this.checkPermission("Menu", "Insert"));
    this.isEdit.set(this.checkPermission("Menu", "Edit"));
    this.isDelete.set(this.checkPermission("Menu", "Delete"));

    // Focus on the search input when the component is initialized
    setTimeout(() => {
      const inputs = this.inputRefs();
      inputs[0]?.nativeElement?.focus();
    }, 10); // Delay to ensure the DOM is updated
  }

  onLoadMenu() {
    const { data$, isLoading$, hasError$ } = this.dataFetchService.fetchData(this.menuService.getAllMenu());

    this.isLoading$ = isLoading$;
    this.hasError$ = hasError$;
    // Combine the original data stream with the search query to create a filtered list
    combineLatest([
      data$,
      this.searchQuery$
    ]).pipe(
      map(([data, query]) =>
        data.filter((menuData: any) =>
          menuData.menuName?.toLowerCase().includes(query) ||
          menuData.moduleName?.toLowerCase().includes(query) ||
          menuData.parentMenuId == query ||
          menuData.url?.toLowerCase().includes(query)
        )
      )
    ).subscribe(filteredData => {
      this.filteredMenuList.set(filteredData.reverse());
      this.menuOptions.set(filteredData.map((menuData: any) => ({ key: menuData.id, value: menuData.menuName })));
    });
  }


  checkPermission(moduleName: string, permission: string) {
    const user = this.authService.getUser();
    const modulePermission = user?.userMenu?.find((module: any) => module?.menuName?.toLowerCase() === moduleName.toLowerCase());
    if (modulePermission && user?.username === 'SuperSoft') {
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

  // Method to filter Menu list based on search query
  onSearchMenu(event: Event) {
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    this.searchQuery$.next(query);
  }

  // Simplified method to get form controls
  getControl(controlName: string): FormControl {
    return this.form.get(controlName) as FormControl;
  }

  getParentMenuName(menuId: any): string {
    const parentMenu = this.menuOptions().find(m => m.key === menuId);
    return parentMenu?.value ?? '';
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
    if (this.filteredMenuList().length === 0) {
      return; // Exit if there are no items to navigate
    }

    if (event.key === 'Tab') {
      event.preventDefault();
      const inputs = this.inputRefs();
      inputs[0].nativeElement.focus();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault(); // Prevent default scrolling behavior
      this.highlightedTr = (this.highlightedTr + 1) % this.filteredMenuList().length;
    } else if (event.key === 'ArrowUp') {
      event.preventDefault(); // Prevent default scrolling behavior
      this.highlightedTr =
        (this.highlightedTr - 1 + this.filteredMenuList().length) % this.filteredMenuList().length;
    } else if (event.key === 'Enter') {
      event.preventDefault(); // Prevent form submission

      // Call onUpdate for the currently highlighted item
      if (this.highlightedTr !== -1) {
        const selectedItem = this.filteredMenuList()[this.highlightedTr];
        this.onUpdate(selectedItem);
        this.highlightedTr = -1;
      }
    }
  }

  onSubmit(e: Event) {
    this.isSubmitted = true;
    // console.log(this.form.value);
    if (this.form.valid) {
      // console.log(this.form.value);
      if (this.selectedMenu) {
        this.menuService.updateMenu(this.selectedMenu.id, { ...this.form.value, parentMenuId: this.form.value.parentMenuId || null, permissionsKey: this.form.value.permissionsKey || [] })
          .subscribe({
            next: (response) => {
              if (response !== null && response !== undefined) {
                this.toastService.showMessage('success', 'Success', 'Menu successfully updated!');
                const rest = this.filteredMenuList().filter(d => d.id !== response.id);
                this.filteredMenuList.set([response, ...rest]);
                this.isSubmitted = false;
                this.selectedMenu = null;
                this.formReset(e);
                this.onLoadMenu();
              }

            },
            error: (error) => {
              console.error('Error updated Menu:', error);
              this.toastService.showMessage('error', 'Error', `Error updated Menu: ${error.error.message || error.error.title}`);
            }
          });
      } else {
        this.menuService.addMenu({ ...this.form.value, parentMenuId: this.form.value.parentMenuId || null, permissionsKey: this.form.value.permissionsKey || [] })
          .subscribe({
            next: (response) => {
              if (response !== null && response !== undefined) {
                this.toastService.showMessage('success', 'Success', 'Menu successfully added!');
                this.filteredMenuList.set([response, ...this.filteredMenuList()])
                this.isSubmitted = false;
                this.formReset(e);
                this.onLoadMenu();
              }

            },
            error: (error) => {
              console.error('Error added Menu:', error);
              this.toastService.showMessage('error', 'Error', `Error added Menu: ${error.error.message || error.error.title}`);
            }
          });
      }
    } else {
      this.toastService.showMessage('warn', 'Warning', 'Form is invalid! Please Fill Menu Name Field!');
    }
  }

  onUpdate(data: any) {
    this.selectedMenu = data;
    this.form.patchValue({
      menuName: data?.menuName,
      moduleName: data?.moduleName,
      parentMenuId: data?.parentMenuId,
      url: data?.url,
      isActive: data?.isActive,
      icon: data?.icon,
      permissionsKey: data?.permissionsKey,
    });

    // Focus the 'Name' input field after patching the value
    setTimeout(() => {
      const inputs = this.inputRefs();
      inputs[0].nativeElement.focus();
    }, 0); // Delay to ensure the DOM is updated
  }

  onDelete(id: any) {
    if (confirm("Are you sure you want to delete?")) {
      this.menuService.deleteMenu(id).subscribe(data => {
        if (data.id) {
          this.toastService.showMessage('success', 'Success', 'Menu successfully deleted!');
          this.filteredMenuList.set(this.filteredMenuList().filter(d => d.id !== id));
        } else {
          console.error('Error deleting Menu:', data);
          this.toastService.showMessage('error', 'Error', `Error deleting Menu: ${data.message}`);
        }
      });
    }
  }

  formReset(e: Event): void {
    e.preventDefault();
    this.form.reset({
      menuName: '',
      moduleName: '',
      parentMenuId: null,
      url: '',
      isActive: true,
      icon: '',
      permissionsKey: '',
    });
    this.isSubmitted = false;
    this.selectedMenu = null;
  }

}
