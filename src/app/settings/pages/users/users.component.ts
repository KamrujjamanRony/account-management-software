import { Component, ElementRef, inject, signal, viewChildren, viewChild } from '@angular/core';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { DataFetchService } from '../../../shared/services/useDataFetch';
import { CommonModule } from '@angular/common';
import { UserAccessTreeComponent } from '../../components/user-access-tree/user-access-tree.component';
import { FieldComponent } from '../../../shared/components/field/field.component';
import { SearchComponent } from '../../../shared/components/svg/search/search.component';
import { UserService } from '../../services/user.service';
import { MenuService } from '../../services/menu.service';
import { EmployeeService } from '../../../hr/services/employee.service';
import { ToastService } from '../../../shared/components/primeng/toast/toast.service';

@Component({
  selector: 'app-users',
  imports: [ReactiveFormsModule, UserAccessTreeComponent, FieldComponent, SearchComponent, CommonModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent {
  fb = inject(NonNullableFormBuilder);
  private userService = inject(UserService);
  private dataFetchService = inject(DataFetchService);
  private menuService = inject(MenuService);
  private employeeService = inject(EmployeeService);
  private toastService = inject(ToastService);
  filteredUserList = signal<any[]>([]);
  employeeOption = signal<any[]>([]);
  highlightedTr: number = -1;
  selectedUser: any;

  private searchQuery$ = new BehaviorSubject<string>('');
  userAccessTree = signal<any[]>([]);
  isLoading$: Observable<any> | undefined;
  hasError$: Observable<any> | undefined;
  readonly inputRefs = viewChildren<ElementRef>('inputRef');
  readonly searchInput = viewChild.required<ElementRef<HTMLInputElement>>('searchInput');
  isSubmitted = false;

  form = this.fb.group({
    userName: ['', [Validators.required]],
    password: [''],
    eId: null,
    isActive: [true],
    menuPermissions: [['']],
  });

  ngOnInit(): void {
    this.onLoadTreeData("");

    this.onLoadUsers();

    this.onLoadEmployee("");

    // Focus on the search input when the component is initialized
    setTimeout(() => {
      const inputs = this.inputRefs();
      inputs[0].nativeElement.focus();
    }, 10);
  }

  onLoadEmployee(eId: any) {
    this.employeeService.getEmployee(eId).subscribe((data) => {
      console.log(data)
      this.employeeOption.set(data.map((item: any) => {
        return { value: item.eId, label: item.eName }
      }))
    });
  }

  onDisplayEmployee(eId: any) {
    return eId ? this.employeeOption().find(item => item?.value === eId)?.label : '';
  }

  onLoadTreeData(userId: any) {
    this.menuService.generateTreeData(userId).subscribe((data) => {
      this.userAccessTree.set(data);
    });
  }

  onLoadUsers() {
    const { data$, isLoading$, hasError$ } = this.dataFetchService.fetchData(this.userService.getUser(""));     // ToDo: user data request due

    this.isLoading$ = isLoading$;
    this.hasError$ = hasError$;
    // Combine the original data stream with the search query to create a filtered list
    combineLatest([
      data$,
      this.searchQuery$
    ]).pipe(
      map(([data, query]) =>
        data.filter((UserData: any) =>
          UserData.userName?.toLowerCase().includes(query)
        )
      )
    ).subscribe(filteredData => this.filteredUserList.set(filteredData));
  }

  // Method to filter User list based on search query
  onSearchUser(event: Event) {
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    this.searchQuery$.next(query);
  }

  // Simplified method to get form controls
  getControl(controlName: string): FormControl {
    return this.form.get(controlName) as FormControl;
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
    if (this.filteredUserList().length === 0) {
      return; // Exit if there are no items to navigate
    }

    if (event.key === 'Tab') {
      event.preventDefault();
      const inputs = this.inputRefs();
      inputs[0].nativeElement.focus();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault(); // Prevent default scrolling behavior
      this.highlightedTr = (this.highlightedTr + 1) % this.filteredUserList().length;
    } else if (event.key === 'ArrowUp') {
      event.preventDefault(); // Prevent default scrolling behavior
      this.highlightedTr =
        (this.highlightedTr - 1 + this.filteredUserList().length) % this.filteredUserList().length;
    } else if (event.key === 'Enter') {
      event.preventDefault(); // Prevent form submission

      // Call onUpdate for the currently highlighted item
      if (this.highlightedTr !== -1) {
        const selectedItem = this.filteredUserList()[this.highlightedTr];
        this.onUpdate(selectedItem);
        this.highlightedTr = -1;
      }
    }
  }

  onSubmit(e: Event) {
    this.isSubmitted = true;
    if (this.form.valid) {
      this.savePermissions();
      if (this.selectedUser) {
        this.userService.updateUser(this.selectedUser.id, this.form.value)
          .subscribe({
            next: (response) => {
              if (response !== null && response !== undefined) {
                this.toastService.showMessage('success', 'Successful', 'User successfully updated!');
                this.onLoadUsers();
                this.isSubmitted = false;
                this.selectedUser = null;
                this.formReset(e);
              }

            },
            error: (error) => {
              console.error('Error register:', error);
              if (error.error.message || error.error.title) {
                this.toastService.showMessage('error', 'Error', `${error.error.status} : ${error.error.message || error.error.title}`);
              }
            }
          });
      } else {
        this.userService.addUser(this.form.value)
          .subscribe({
            next: (response) => {
              if (response !== null && response !== undefined) {
                this.toastService.showMessage('success', 'Successful', 'User successfully added!');
                this.onLoadUsers();
                this.isSubmitted = false;
                this.formReset(e);
              }

            },
            error: (error) => {
              console.error('Error add user:', error);
              if (error.error.message || error.error.title) {
                this.toastService.showMessage('error', 'Error', `${error.error.status} : ${error.error.message || error.error.title}`);
              }
            }
          });
      }
    } else {
      this.toastService.showMessage('warn', 'Warning', 'Form is invalid! Please Fill All Recommended Field!');
    }
  }

  onUpdate(data: any) {
    this.onLoadTreeData(data.id);
    this.selectedUser = data;
    this.form.patchValue({
      userName: data?.userName,
      password: data?.password,
      eId: data?.eId,
      isActive: data?.isActive,
      menuPermissions: data?.menuPermissions,
    });

    console.log(data)

    // Focus the 'userName' input field after patching the value
    setTimeout(() => {
      const inputs = this.inputRefs();
      inputs[0].nativeElement.focus();
    }, 0); // Delay to ensure the DOM is updated
  }

  onDelete(id: any) {
    if (confirm("Are you sure you want to delete?")) {
      this.userService.deleteUser(id).subscribe(data => {
        if (data.id) {
          this.toastService.showMessage('success', 'Successful', 'User deleted successfully!');
          this.filteredUserList.set(this.filteredUserList().filter(d => d.id !== id));
        } else {
          console.error('Error deleting User:', data);
          this.toastService.showMessage('error', 'Error Deleting', data.message);
        }
      });
    }
  }

  formReset(e: Event): void {
    e.preventDefault();
    this.form.reset({
      userName: '',
      password: '',
      eId: null,
      isActive: true,
      menuPermissions: [''],
    });
    this.onLoadTreeData("");
    this.isSubmitted = false;
    this.selectedUser = null;
  }

  // User Accessibility Code Start----------------------------------------------------------------

  savePermissions() {
    // const selectedNodes = this.getSelectedNodes(this.userAccessTree());
    const selectedNodes = this.userAccessTree();
    console.log('Selected Access:', selectedNodes);
    this.form.patchValue({ menuPermissions: selectedNodes });
  }

  private getSelectedNodes(nodes: any[]): any[] {
    return nodes.reduce((acc: any[], node: any) => {
      // Recursively update the isSelected property of parent nodes
      this.updateParentSelection(node);

      // Include node if it is selected or has selected children
      if (node.isSelected || (node.children && node.children.some((child: any) => child.isSelected))) {
        const selectedPermissions = node.permissionsKey
          ?.filter((p: any) => p.isSelected)
          .map((p: any) => p.permission);

        acc.push({
          menuId: node.id,
          PermissionKey: selectedPermissions || [], // Include empty array if no permissions
        });
      }

      // Flatten selected children into the same array
      if (node.children) {
        acc.push(...this.getSelectedNodes(node.children));
      }

      return acc;
    }, []);
  }

  private updateParentSelection(node: any): boolean {
    // Check if the node has children
    if (node.children && node.children.length > 0) {
      // console.log('Processing node:', node.menuName, 'isSelected:', node.isSelected);

      // Recursively update the isSelected property of children
      const anyChildSelected = node.children.some((child: any) => this.updateParentSelection(child));
      // console.log('Any child selected for node', node.menuName, ':', anyChildSelected);

      // Update the current node's isSelected property based on its children
      node.isSelected = anyChildSelected || node.isSelected;
      // console.log('Updated node', node.menuName, 'isSelected:', node.isSelected);

      return node.isSelected;
    }

    // If it's a leaf node, return its isSelected status
    // console.log('Leaf node:', node.menuName, 'isSelected:', node.isSelected);
    return node.isSelected;
  }


  // private getSelectedNodes(nodes: any[]): any[] {
  //   return nodes
  //     .filter((node) => node.isSelected || node.children?.some((child: any) => child.isSelected))
  //     .map((node) => ({
  //       ...node,
  //       children: node.children ? this.getSelectedNodes(node.children) : undefined,
  //     }));
  // }

  // User Accessibility Code End----------------------------------------------------------------

}
