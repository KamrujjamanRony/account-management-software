import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, signal, ViewChild, ViewChildren, QueryList } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPencil, faXmark, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { form, required, FormField, maxLength } from '@angular/forms/signals';
import { PatientService } from '../../services/patient.service';
import { PermissionS } from '../../../settings/services/permission-s';
import { ToastService } from '../../../utils/toast/toast.service';
import { ConfirmService } from '../../../utils/confirm/confirm.service';
import { AuthService } from '../../../settings/services/auth.service';

@Component({
  selector: 'app-registration',
  imports: [FormsModule, FormField, FontAwesomeModule],
  templateUrl: './registration.component.html',
  styleUrl: './registration.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistrationComponent {
  faPencil = faPencil;
  faXmark = faXmark;
  faMagnifyingGlass = faMagnifyingGlass;
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  @ViewChildren('inputRef') inputRefs!: QueryList<ElementRef>;

  /* ---------------- DI ---------------- */
  private patientService = inject(PatientService);
  private permissionService = inject(PermissionS);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);
  private authService = inject(AuthService);

  /* ---------------- SIGNAL STATE ---------------- */
  patients = signal<any[]>([]);
  searchQuery = signal('');

  isView = signal(false);
  isInsert = signal(false);
  isEdit = signal(false);
  isDelete = signal(false);
  showList = signal(true);

  filteredPatientList = computed(() => {
    const query = this.searchQuery().toLowerCase();
    return this.patients()
      .filter(p =>
        String(p.name ?? '').toLowerCase().includes(query) ||
        String(p.contactNo ?? '').toLowerCase().includes(query) ||
        String(p.regNo ?? '').toLowerCase().includes(query)
      );
  });

  selected = signal<any>(null);
  isLoading = signal(false);
  hasError = signal(false);
  isSubmitted = signal(false);

  options: any[] = [
    { id: '', name: 'Select Sex' },
    { id: 'Male', name: 'Male' },
    { id: 'Female', name: 'Female' },
    { id: 'Others', name: 'Others' },
  ];

  /* ---------------- FORM MODEL ---------------- */
  model = signal({
    regNo: '',
    name: '',
    contactNo: '',
    fatherName: '',
    motherName: '',
    sex: '',
    dob: '',
    nid: '',
    address: '',
    remarks: '',
    postedBy: this.authService.getUser()?.username || '',
    entryDate: new Date().toISOString(),
  });

  /* ---------------- SIGNAL FORM ---------------- */
  form = form(this.model, (s) => {
    required(s.name, { message: 'Name is required' });
    required(s.contactNo, { message: 'Contact No. is required' });
    maxLength(s.contactNo, 11, { message: 'Contact No. cannot exceed 11 characters' });
    required(s.sex, { message: 'Sex is required' });
    required(s.dob, { message: 'Date of Birth is required' });
  });

  /* ---------------- LIFECYCLE ---------------- */
  ngOnInit(): void {
    this.loadPatients();
    this.loadPermissions();
    setTimeout(() => this.searchInput?.nativeElement.focus(), 0);
  }

  /* ---------------- LOADERS ---------------- */
  loadPermissions() {
    this.isView.set(this.permissionService.hasPermission('Registration'));
    this.isInsert.set(this.permissionService.hasPermission('Registration', 'Insert'));
    this.isEdit.set(this.permissionService.hasPermission('Registration', 'Edit'));
    this.isDelete.set(this.permissionService.hasPermission('Registration', 'Delete'));
  }

  loadPatients() {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.patientService.getAllPatients().subscribe({
      next: (data) => {
        this.patients.set(data.sort((a: any, b: any) => {
          const dateA = new Date(a.entryDate).getTime();
          const dateB = new Date(b.entryDate).getTime();
          return dateB - dateA;
        }));
        this.isLoading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.isLoading.set(false);
      },
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
      this.toast.warning('Form is Invalid! Please fill Contact No, Name, Sex, Date of Birth.', 'bottom-right', 5000);
      return;
    }
    this.isSubmitted.set(true);
    const payload = this.form().value();
    const request$ = this.selected()
      ? this.patientService.updatePatient(this.selected().id, payload)
      : this.patientService.addPatient(payload);
    request$.subscribe({
      next: (response) => {
        if (response) {
          if (this.selected()) {
            const rest = this.patients().filter(p => p.id !== response.id);
            this.patients.set([response, ...rest]);
          } else {
            this.patients.set([response, ...this.patients()]);
          }
          this.onToggleList();
          this.toast.success('Saved successfully!', 'bottom-right', 5000);
        }
      },
      error: (error) => {
        this.toast.danger('Save unsuccessful!', 'bottom-left', 3000);
        console.error('Error submitting:', error);
        this.isSubmitted.set(false);
      },
    });
  }

  /* ---------------- UPDATE ---------------- */
  onUpdate(data: any) {
    this.selected.set(data);
    this.model.update(current => ({
      ...current,
      regNo: data?.regNo ?? '',
      name: data?.name ?? '',
      contactNo: data?.contactNo ?? '',
      fatherName: data?.fatherName ?? '',
      motherName: data?.motherName ?? '',
      sex: data?.sex ?? '',
      dob: this.transform(data?.dob, 'yyyy-MM-dd') ?? '',
      nid: data?.nid ?? '',
      address: data?.address ?? '',
      remarks: data?.remarks ?? '',
      postedBy: data?.postedBy ?? '',
      entryDate: data?.entryDate ?? '',
    }));
    this.showList.set(false);
    setTimeout(() => {
      const inputs = this.inputRefs.toArray();
      inputs[0]?.nativeElement.focus();
    }, 0);
  }

  /* ---------------- DELETE ---------------- */
  async onDelete(id: any) {
    const ok = await this.confirm.confirm({
      message: 'Are you sure you want to delete this patient?',
      confirmText: "Yes, I'm sure",
      cancelText: 'No, cancel',
      variant: 'danger',
    });
    if (ok) {
      this.patientService.deletePatient(id).subscribe({
        next: () => {
          this.patients.update(list => list.filter(i => i.id !== id));
          this.toast.success('Patient deleted successfully!', 'bottom-right', 5000);
        },
        error: (error) => {
          this.toast.danger('Delete unsuccessful!', 'bottom-left', 3000);
          console.error('Error deleting:', error);
        },
      });
    }
  }

  /* ---------------- RESET ---------------- */
  formReset() {
    this.model.set({
      regNo: '',
      name: '',
      contactNo: '',
      fatherName: '',
      motherName: '',
      sex: '',
      dob: '',
      nid: '',
      address: '',
      remarks: '',
      postedBy: this.authService.getUser()?.username || '',
      entryDate: new Date().toISOString(),
    });
    this.selected.set(null);
    this.isSubmitted.set(false);
    this.form().reset();
  }

  onToggleList() {
    this.showList.update(s => !s);
    this.formReset();
  }

  /* ---------------- UTILITIES ---------------- */
  transform(value: any, args: any = 'dd/MM/yyyy'): any {
    if (!value) return null;
    const datePipe = new DatePipe('en-US');
    return datePipe.transform(value, args);
  }

  handleEnterKey(event: Event, currentIndex: number) {
    event.preventDefault();
    const inputs = this.inputRefs.toArray();
    if (currentIndex + 1 < inputs.length) {
      inputs[currentIndex + 1].nativeElement.focus();
    } else {
      this.onSubmit(event);
    }
  }
}
