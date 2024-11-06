import { Component, ElementRef, inject, QueryList, signal, ViewChild, ViewChildren } from '@angular/core';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DepartmentService } from '../../../services/department.service';
import { CommonModule } from '@angular/common';
import { ToastSuccessComponent } from "../../shared/toast/toast-success/toast-success.component";
import { InputComponent } from "../../shared/input/input.component";
import { SvgComponent } from "../../shared/svg/svg.component";
import { EntriesService } from '../../../services/entries.service';
import { SubSubDepartmentService } from '../../../services/sub-department.service';

@Component({
  selector: 'app-account-setup',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, ToastSuccessComponent, InputComponent, SvgComponent],
  templateUrl: './account-setup.component.html',
  styleUrl: './account-setup.component.css'
})
export class AccountSetupComponent {
  fb = inject(NonNullableFormBuilder);
  private entriesService = inject(EntriesService);
  private departmentService = inject(DepartmentService);
  private subDepartmentService = inject(SubSubDepartmentService);
  options: any[] = [{id: 1, name:'expense'}, {id: 2, name:'income'}];

  departments: any[] = [];
  isDepartmentOpen: boolean = false;
  highlightedDepartment: number = -1;

  subDepartments: any[] = [];
  isSubDepartmentOpen: boolean = false;
  highlightedSubDepartment: number = -1;

  selectedTest: any;
  highlightedTr: number = -1;
  success = signal<any>("");
  Entries = signal<any[]>([]);
  filteredEntries = signal<any[]>([]);
  searchQuery = '';
  @ViewChildren(InputComponent) formInputs!: QueryList<InputComponent>;
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  isSubmitted = false;
  form = this.fb.group({
    type: ['expense', [Validators.required]],
    department: ['', [Validators.required]],
    subDepartment: ['', [Validators.required]],
    name: [''],
  });
  
  ngOnInit() {
    this.onLoad();

    // Focus on the search input when the component is initialized
    setTimeout(() => {
      this.searchInput.nativeElement.focus();
    }, 0);
  }

  onLoad() {
    this.onEntryLoaded();
    this.onDepartmentLoaded();
    this.onSubDepartmentLoaded();
  }

  onEntryLoaded() {
    this.entriesService.getAllEntries().subscribe(data => {
      this.Entries.set(data);
      this.filteredEntries.set(data);
    });
  }

  onDepartmentLoaded() {
    const type = this.getControl('type').value;
    console.log(type)
    this.departmentService.getAllDepartments(type).subscribe(data => {
      this.departments = data;
    });
  }

  onSubDepartmentLoaded() {
    console.log("clicked on sub-department")
    const selectedDepartment = this.getControl('department').value;
    console.log(selectedDepartment)
    this.subDepartmentService.getAllSubDepartments(selectedDepartment).subscribe(data => {
      this.subDepartments = data;
    });
  }

  // Method to filter test list based on search query
  onSearchTest(event: Event) {
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    this.searchQuery = query;

    // Filter the test list based on query
    this.filteredEntries.set(this.Entries().filter((test: any) => {
      const nameMatch = test.type?.toLowerCase().includes(query);
      const chargeMatch = test.department?.toString().includes(query);
      const idMatch = test.id?.toString().includes(query);
      return nameMatch || chargeMatch || idMatch;
    }))
  }

  // Simplified method to get form controls
  getControl(controlName: string): FormControl {
    return this.form.get(controlName) as FormControl;
  }

  onTypeChange(){
    this.onDepartmentLoaded();
  }

  // Function to add a new Department name
  addDepartmentName(e: Event) {
    e.preventDefault();
    const currentValue = this.getControl('department').value;
    if (currentValue && !this.departments.includes(currentValue)) {
      this.departmentService.addDepartment({id: Math.random().toString(36).substr(2, 9), name:currentValue}).subscribe(data => {
        this.onLoad()
      });
      this.getControl('department').setValue('');
      this.isDepartmentOpen = false;
    }
  }

  // Function to add a new SubDepartment name
  addSubDepartmentName(e: Event) {
    e.preventDefault();
    const currentValue = this.getControl('subDepartment').value;
    if (currentValue && !this.subDepartments.includes(currentValue)) {
      this.subDepartments.push(currentValue);
      this.getControl('subDepartment').setValue('');
      this.isSubDepartmentOpen = false;
    }
  }

  // Set the Department name from the dropdown
  selectDepartment(option: any) {
    this.getControl('department').setValue(option?.name);
    this.isDepartmentOpen = false;
    this.highlightedDepartment = -1;
  }

  // Set the Department name from the dropdown
  selectSubDepartment(option: any) {
    this.getControl('subDepartment').setValue(option);
    this.isSubDepartmentOpen = false;
    this.highlightedSubDepartment = -1;
  }

  // Handle the Down arrow key to open the dropdown
  handleDepartmentKeyDown(event: KeyboardEvent) {
    // If the down arrow key is pressed
    if (event.key === 'ArrowDown') {
      this.isDepartmentOpen = true; // Open the dropdown
      event.preventDefault(); // Prevent default behavior (e.g., scrolling)
    }
    // If the dropdown is open, handle arrow keys and Enter
    if (this.isDepartmentOpen && this.departments.length > 0) {
      if (event.key === 'ArrowDown') {
        // Move down in the list
        this.highlightedDepartment =
          (this.highlightedDepartment + 1) % this.departments.length;
        event.preventDefault(); // Prevent scrolling
      } else if (event.key === 'ArrowUp') {
        // Move up in the list
        this.highlightedDepartment =
          (this.highlightedDepartment - 1 + this.departments.length) %
          this.departments.length;
        event.preventDefault(); // Prevent scrolling
      } else if (event.key === 'Enter') {
        // Select the highlighted option on Enter
        if (this.highlightedDepartment !== -1) {
          this.selectDepartment(this.departments[this.highlightedDepartment]);
          this.isDepartmentOpen = false; // Close the dropdown after selection
        }
      }
    }
  }

  // Handle the Down arrow key to open the dropdown
  handleSubDepartmentKeyDown(event: KeyboardEvent) {
    // If the down arrow key is pressed
    if (event.key === 'ArrowDown') {
      this.isSubDepartmentOpen = true; // Open the dropdown
      event.preventDefault(); // Prevent default behavior (e.g., scrolling)
    }
    // If the dropdown is open, handle arrow keys and Enter
    if (this.isSubDepartmentOpen && this.subDepartments.length > 0) {
      if (event.key === 'ArrowDown') {
        // Move down in the list
        this.highlightedSubDepartment =
          (this.highlightedSubDepartment + 1) % this.subDepartments.length;
        event.preventDefault(); // Prevent scrolling
      } else if (event.key === 'ArrowUp') {
        // Move up in the list
        this.highlightedSubDepartment =
          (this.highlightedSubDepartment - 1 + this.subDepartments.length) %
          this.subDepartments.length;
        event.preventDefault(); // Prevent scrolling
      } else if (event.key === 'Enter') {
        // Select the highlighted option on Enter
        if (this.highlightedSubDepartment !== -1) {
          this.selectDepartment(this.subDepartments[this.highlightedSubDepartment]);
          this.isSubDepartmentOpen = false; // Close the dropdown after selection
        }
      }
    }
  }

  // Toggle Department visibility
  toggleDepartment(e: any) {
    e.preventDefault();
    this.isDepartmentOpen = !this.isDepartmentOpen;
    this.highlightedDepartment = -1;
  }

  // Toggle SubDepartment visibility
  toggleSubDepartment(e: any) {
    e.preventDefault();
    this.isSubDepartmentOpen = !this.isSubDepartmentOpen;
    this.highlightedSubDepartment = -1;
  }

  // Handle the Enter key to focus the next input field
  handleEnterKey(event: Event, index: number) {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key === 'Enter') {
      event.preventDefault(); // Prevent form submission
      const inputsArray = this.formInputs.toArray();

      if (index < inputsArray.length) {
        const nextInput = inputsArray[index + 1];

        if (nextInput && nextInput.inputRef) {
          // If the next input is a submit button
          if (nextInput.cType === 'submit') {
            // Check if it's already focused; if not, focus it first
            (document.activeElement !== nextInput.inputRef.nativeElement) && nextInput.inputRef.nativeElement.focus();
          } else {
            // Focus on the next input if it's not a submit button
            nextInput.inputRef.nativeElement.focus();
          }
        } else {
          // Submit the form if it's already focused and Enter is pressed
          this.onSubmit(event);
        }
      }
    }
  }
  
  // Handle key navigation in the search input
  handleSearchKeyDown(event: KeyboardEvent) {
    if (this.filteredEntries().length === 0) {
      return; // Exit if there are no items to navigate
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault(); // Prevent default scrolling behavior
      this.highlightedTr = (this.highlightedTr + 1) % this.filteredEntries().length;
    } else if (event.key === 'ArrowUp') {
      event.preventDefault(); // Prevent default scrolling behavior
      this.highlightedTr = 
        (this.highlightedTr - 1 + this.filteredEntries().length) % this.filteredEntries().length;
    } else if (event.key === 'Enter') {
      event.preventDefault(); // Prevent form submission

      // Call onUpdate for the currently highlighted item
      if (this.highlightedTr !== -1) {
        const selectedItem = this.filteredEntries()[this.highlightedTr];
        this.onUpdate(selectedItem); // Execute onUpdate for the selected row
        this.highlightedTr = -1;
      }
    }
  }
  





  onSubmit(e: Event) {
    this.isSubmitted = true;
    if (this.form.valid) {
      // console.log(this.form.value);
      if(this.selectedTest){
        this.entriesService.updateEntries(this.selectedTest.id, this.form.value)
        .subscribe({
          next: (response) => {
            if (response !== null && response !== undefined) {
              this.success.set("Test successfully updated!");
              this.formReset(e);
              this.onLoad();
              this.isSubmitted = false;
              setTimeout(() => {
                this.success.set("");
              }, 3000);
            }

          },
          error: (error) => {
            console.error('Error register:', error);
          }
        });
      } else {
      this.entriesService.addEntries(this.form.value)
        .subscribe({
          next: (response) => {
            if (response !== null && response !== undefined) {
              this.success.set("Test successfully added!");
              this.formReset(e);
              this.onLoad();
              this.isSubmitted = false;
              setTimeout(() => {
                this.success.set("");
              }, 3000);
            }

          },
          error: (error) => {
            console.error('Error register:', error);
          }
        });
      }
    } else {
      console.log('Form is invalid');
    }
  }

  onUpdate(data: any){
    this.selectedTest = data;
    this.form.patchValue({
      type: data?.type,
      department: data?.department,
      subDepartment: data?.subDepartment,
      name: data?.name,
    });

    // Focus the 'type' input field after patching the value
    setTimeout(() => {
      const typeInput = this.formInputs.find(input => input.label === 'Test Name');
      if (typeInput && typeInput.inputRef) {
        typeInput.inputRef.nativeElement.focus(); // Programmatically focus the type input
      }
    }, 0); // Delay to ensure the DOM is updated

    // Reset the highlighted row
    this.highlightedDepartment = -1;
    this.highlightedSubDepartment = -1;
  }

  formReset(e: Event): void {
    e.preventDefault();
    this.form.reset({
      type: '',
      department: '',
      subDepartment: '',
      name: '',
    });
  }

}
