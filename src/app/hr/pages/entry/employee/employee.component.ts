import { CommonModule, DatePipe } from '@angular/common';
import { Component, ElementRef, inject, signal, viewChild, viewChildren } from '@angular/core';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { ToastSuccessComponent } from '../../../../shared/components/toasts/toast-success/toast-success.component';
import { FieldComponent } from '../../../../shared/components/field/field.component';
import { SearchComponent } from '../../../../shared/components/svg/search/search.component';
import { DataFetchService } from '../../../../shared/services/useDataFetch';
import { EmployeeService } from '../../../services/employee.service';

@Component({
  selector: 'app-employee',
  imports: [CommonModule, ToastSuccessComponent, FieldComponent, SearchComponent, ReactiveFormsModule],
  templateUrl: './employee.component.html',
  styleUrl: './employee.component.css'
})
export class EmployeeComponent {
  fb = inject(NonNullableFormBuilder);
  private employeeService = inject(EmployeeService);
  dataFetchService = inject(DataFetchService);
  filteredEmployeeList = signal<any[]>([]);
  genderOption = signal<any[]>([
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' }
  ]);
  eduQuaOption = signal<any[]>([
    { value: 'SSC', label: 'Secondary School Certificate' },
    { value: 'HSC', label: 'Higher Secondary Certificate' },
    { value: 'B.Ed.', label: 'Bachelors degrees' },
    { value: 'M.Ed.', label: 'Masters degrees' },
  ]);
  highlightedTr: number = -1;
  success = signal<any>("");
  selectedEmployee: any;

  private searchQuery$ = new BehaviorSubject<string>('');
  isLoading$: Observable<any> | undefined;
  hasError$: Observable<any> | undefined;
  readonly inputRefs = viewChildren<ElementRef>('inputRef');
  readonly searchInput = viewChild.required<ElementRef<HTMLInputElement>>('searchInput');
  isSubmitted = false;

  form = this.fb.group({
    eName: ['', [Validators.required]],
    gender: [''],
    religion: [''],
    dob: ['', [Validators.required]],
    addr: [''],
    nid: [''],
    moNum: [''],
    emCont: [''],
    reEmCon: [''],
    email: [''],
    pic: [''],
    eduQua: [''],
    deEduQua: [''],
    expe: [''],
    skill: [''],
    ref: [''],
    dep: [''],
    oeId: [''],
    design: [''],
    jDate: ['', [Validators.required]],
    type: [''],
    act: [true],
    workingPlace: [''],
    basicSalary: ['', [Validators.required]],
    houseRent: ['', [Validators.required]],
    mediAllow: ['', [Validators.required]],
    convey: ['', [Validators.required]],
    otherAllow: ['', [Validators.required]],
    totalSalary: ['', [Validators.required]],
    fileLink: [''],
    postBy: [''],
    others1: [''],
    others2: [''],
    others3: ['']
  });

  ngOnInit() {
    this.onLoadEmployee();

    // Focus on the search input when the component is initialized
    setTimeout(() => {
      const inputs = this.inputRefs();
      inputs[0].nativeElement.focus();
    }, 10); // Delay to ensure the DOM is updated
  }

  onLoadEmployee() {
    const { data$, isLoading$, hasError$ } = this.dataFetchService.fetchData(this.employeeService.getEmployee(""));

    this.isLoading$ = isLoading$;
    this.hasError$ = hasError$;
    // Combine the original data stream with the search query to create a filtered list
    combineLatest([
      data$,
      this.searchQuery$
    ]).pipe(
      map(([data, query]) =>
        data.filter((employeeData: any) =>
          employeeData.eName?.toLowerCase().includes(query) ||
          employeeData.email?.toLowerCase().includes(query) ||
          employeeData.nid?.toLowerCase().includes(query)
        )
      )
    ).subscribe(filteredData => this.filteredEmployeeList.set(filteredData.reverse()));
  }

  // Method to filter Employee list based on search query
  onSearchEmployee(event: Event) {
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
    if (this.filteredEmployeeList().length === 0) {
      return; // Exit if there are no items to navigate
    }

    if (event.key === 'Tab') {
      event.preventDefault();
      const inputs = this.inputRefs();
      inputs[0].nativeElement.focus();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault(); // Prevent default scrolling behavior
      this.highlightedTr = (this.highlightedTr + 1) % this.filteredEmployeeList().length;
    } else if (event.key === 'ArrowUp') {
      event.preventDefault(); // Prevent default scrolling behavior
      this.highlightedTr =
        (this.highlightedTr - 1 + this.filteredEmployeeList().length) % this.filteredEmployeeList().length;
    } else if (event.key === 'Enter') {
      event.preventDefault(); // Prevent form submission

      // Call onUpdate for the currently highlighted item
      if (this.highlightedTr !== -1) {
        const selectedItem = this.filteredEmployeeList()[this.highlightedTr];
        this.onUpdate(selectedItem);
        this.highlightedTr = -1;
      }
    }
  }

  onSubmit(e: Event) {
    this.isSubmitted = true;
    if (this.form.valid) {
      // console.log(this.form.value);
      if (this.selectedEmployee) {
        this.employeeService.updateEmployee(this.selectedEmployee.eId, this.form.value)
          .subscribe({
            next: (response) => {
              if (response !== null && response !== undefined) {
                this.success.set("Employee successfully updated!");
                const rest = this.filteredEmployeeList().filter(d => d.eId !== response.eId);
                this.filteredEmployeeList.set([response, ...rest]);
                this.isSubmitted = false;
                this.selectedEmployee = null;
                this.formReset(e);
                setTimeout(() => {
                  this.success.set("");
                }, 1000);
              }

            },
            error: (error) => {
              console.error('Error register:', error);
            }
          });
      } else {
        this.employeeService.addEmployee(this.form.value)
          .subscribe({
            next: (response) => {
              if (response !== null && response !== undefined) {
                this.success.set("Employee successfully added!");
                this.filteredEmployeeList.set([response, ...this.filteredEmployeeList()])
                this.isSubmitted = false;
                this.formReset(e);
                setTimeout(() => {
                  this.success.set("");
                }, 1000);
              }

            },
            error: (error) => {
              console.error('Error register:', error);
            }
          });
      }
    } else {
      alert('Form is invalid! Please Fill Name Field.');
    }
  }

  onUpdate(data: any) {
    this.selectedEmployee = data;
    this.form.patchValue({
      eName: data?.eName,
      gender: data?.gender,
      religion: data?.religion,
      dob: data?.dob,
      addr: data?.addr,
      nid: data?.nid,
      moNum: data?.moNum,
      emCont: data?.emCont,
      reEmCon: data?.reEmCon,
      email: data?.email,
      pic: data?.pic,
      eduQua: data?.eduQua,
      deEduQua: data?.deEduQua,
      expe: data?.expe,
      skill: data?.skill,
      ref: data?.ref,
      dep: data?.dep,
      design: data?.design,
      jDate: data?.jDate,
      type: data?.type,
      act: data?.act,
      workingPlace: data?.workingPlace,
      basicSalary: data?.basicSalary,
      houseRent: data?.houseRent,
      mediAllow: data?.mediAllow,
      convey: data?.convey,
      totalSalary: data?.totalSalary,
      otherAllow: data?.otherAllow,
      fileLink: data?.fileLink,
      others1: data?.others1,
      others2: data?.others2,
      others3: data?.others3,
    });

    // Focus the 'Name' input field after patching the value
    setTimeout(() => {
      const inputs = this.inputRefs();
      inputs[0].nativeElement.focus();
    }, 0); // Delay to ensure the DOM is updated
  }

  onDelete(id: any) {
    if (confirm("Are you sure you want to delete?")) {
      this.employeeService.deleteEmployee(id).subscribe(data => {
        if (data.eId) {
          this.success.set("Employee deleted successfully!");
          this.filteredEmployeeList.set(this.filteredEmployeeList().filter(d => d.eId !== id));
          setTimeout(() => {
            this.success.set("");
          }, 1000);
        } else {
          console.error('Error deleting Employee:', data);
          alert('Error deleting Employee: ' + data.message)
        }
      });
    }
  }

  formReset(e: Event): void {
    e.preventDefault();
    this.form.reset({
      eName: '',
      gender: '',
      religion: '',
      dob: '',
      addr: '',
      nid: '',
      moNum: '',
      emCont: '',
      reEmCon: '',
      email: '',
      pic: '',
      eduQua: '',
      deEduQua: '',
      expe: '',
      skill: '',
      ref: '',
      dep: '',
      design: '',
      jDate: '',
      type: '',
      act: true,
      workingPlace: '',
      basicSalary: '',
      houseRent: '',
      mediAllow: '',
      convey: '',
      totalSalary: '',
      otherAllow: '',
      fileLink: '',
      others1: '',
      others2: '',
      others3: ''
    });
    this.isSubmitted = false;
    this.selectedEmployee = null;
  }
  transform(value: any, args: any = 'dd/MM/yyyy'): any {
    if (!value) return null;
    const datePipe = new DatePipe('en-US');
    return datePipe.transform(value, args);
  }

}
