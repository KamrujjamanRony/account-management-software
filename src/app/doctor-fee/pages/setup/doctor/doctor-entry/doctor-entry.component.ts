import { Component, computed, ElementRef, inject, signal, ViewChild, ViewChildren, QueryList } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPencil, faXmark, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { form, required, FormField } from '@angular/forms/signals';
import { DoctorService } from '../../../../services/doctor.service';
import { PermissionS } from '../../../../../settings/services/permission-s';
import { ToastService } from '../../../../../utils/toast/toast.service';
import { ConfirmService } from '../../../../../utils/confirm/confirm.service';
import { AuthService } from '../../../../../settings/services/auth.service';

@Component({
  selector: 'app-doctor-entry',
  imports: [FormsModule, FormField, FontAwesomeModule],
  templateUrl: './doctor-entry.component.html',
  styleUrl: './doctor-entry.component.css'
})
export class DoctorEntryComponent {
  faPencil = faPencil;
  faXmark = faXmark;
  faMagnifyingGlass = faMagnifyingGlass;
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  @ViewChildren('inputRef') inputRefs!: QueryList<ElementRef>;

  /* ---------------- DI ---------------- */
  private doctorService = inject(DoctorService);
  private permissionService = inject(PermissionS);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);
  private authService = inject(AuthService);

  /* ---------------- SIGNAL STATE ---------------- */
  doctors = signal<any[]>([]);
  searchQuery = signal('');

  isView = signal(false);
  isInsert = signal(false);
  isEdit = signal(false);
  isDelete = signal(false);
  showList = signal(true);

  isChamberOptions: any[] = [{ id: '', name: 'Select' }, { id: '-1', name: 'No' }, { id: '1', name: 'Yes' }];
  takeComOptions: any[] = [{ id: '', name: 'Select' }, { id: '0', name: 'No' }, { id: '1', name: 'Yes' }];

  isChamber: any = "";
  takeCom: any = "";

  filteredDoctorList = computed(() => {
    const query = this.searchQuery().toLowerCase();
    return this.doctors()
      .filter(d =>
        String(d.name ?? '').toLowerCase().includes(query) ||
        String(d.contactNo ?? '').toLowerCase().includes(query) ||
        String(d.regNo ?? '').toLowerCase().includes(query)
      );
  });

  selected = signal<any>(null);
  isLoading = signal(false);
  hasError = signal(false);
  isSubmitted = signal(false);

  /* ---------------- FORM MODEL ---------------- */
  model = signal({
    name: '',
    address: '',
    contactNo: '',
    takeCom: '0',
    isChamberDoctor: '-1',
    mpoId: 0,
    userName: 'superSoft',
    valid: 0,
    entryDate: new Date().toISOString(),
    reportUserName: 'superSoft',
    drFee: 0,
    code: null as any,
    postBy: this.authService.getUser()?.username || '',
  });

  /* ---------------- SIGNAL FORM ---------------- */
  form = form(this.model, (s) => {
    required(s.name, { message: 'Doctor name is required' });
  });

  /* ---------------- LIFECYCLE ---------------- */
  ngOnInit(): void {
    this.loadDoctors();
    this.loadPermissions();
    setTimeout(() => this.searchInput?.nativeElement.focus(), 0);
  }

  /* ---------------- LOADERS ---------------- */
  loadPermissions() {
    this.isView.set(this.permissionService.hasPermission('Doctor Entry'));
    this.isInsert.set(this.permissionService.hasPermission('Doctor Entry', 'Insert'));
    this.isEdit.set(this.permissionService.hasPermission('Doctor Entry', 'Edit'));
    this.isDelete.set(this.permissionService.hasPermission('Doctor Entry', 'Delete'));
  }

  loadDoctors() {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.doctorService.getFilterDoctors(this.isChamber, this.takeCom).subscribe({
      next: (data) => {
        this.doctors.set(data.sort((a: any, b: any) => {
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

  transform(value: any, args?: any): any {
    if (!value) return null;
    const datePipe = new DatePipe('en-US');
    return datePipe.transform(value, args || 'dd/MM/yyyy');
  }

  is(value: any) {
    return value == 1 ? 'Yes' : 'No';
  }

  /* ---------------- SEARCH ---------------- */
  onSearch(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value.trim());
  }

  /* ---------------- ENTER KEY NAV ---------------- */
  handleEnterKey(event: Event, currentIndex: number) {
    event.preventDefault();
    const allInputs = this.inputRefs.toArray();
    const inputs = allInputs.filter((i: any) => !i.nativeElement.disabled);
    if (currentIndex + 1 < inputs.length) {
      inputs[currentIndex + 1].nativeElement.focus();
    } else {
      this.onSubmit(event);
    }
  }

  /* ---------------- SUBMIT ---------------- */
  onSubmit(event: Event) {
    event.preventDefault();
    if (!this.form().valid()) {
      this.toast.warning('Form is Invalid! Please fill Name field.', 'bottom-right', 5000);
      return;
    }
    this.isSubmitted.set(true);
    const payload: any = { ...this.form().value() };
    payload.drFee = payload.drFee || 0;
    payload.takeCom = Number(payload.takeCom);
    payload.isChamberDoctor = Number(payload.isChamberDoctor);

    const request$ = this.selected()
      ? this.doctorService.updateDoctor(this.selected().id, payload)
      : this.doctorService.addDoctor(payload);

    request$.subscribe({
      next: (response) => {
        if (response) {
          if (this.selected()) {
            const rest = this.doctors().filter(d => d.id !== response.id);
            this.doctors.set([response, ...rest]);
          } else {
            this.doctors.set([response, ...this.doctors()]);
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
      name: data?.name ?? '',
      address: data?.address ?? '',
      contactNo: data?.contactNo ?? '',
      takeCom: String(data?.takeCom ?? '0'),
      isChamberDoctor: String(data?.isChamberDoctor ?? '-1'),
      mpoId: data?.mpoId ?? 0,
      userName: data?.userName ?? 'superSoft',
      valid: data?.valid ?? 0,
      entryDate: data?.entryDate ?? '',
      reportUserName: data?.reportUserName ?? 'superSoft',
      drFee: data?.drFee || 0,
      code: data?.code ?? null,
      postBy: data?.postBy ?? '',
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
      message: 'Are you sure you want to delete this doctor?',
      confirmText: "Yes, I'm sure",
      cancelText: 'No, cancel',
      variant: 'danger',
    });
    if (ok) {
      this.doctorService.deleteDoctor(id).subscribe({
        next: () => {
          this.doctors.update(list => list.filter(d => d.id !== id));
          this.toast.success('Doctor deleted successfully!', 'bottom-right', 5000);
        },
        error: (error) => {
          this.toast.danger('Doctor delete unsuccessful!', 'bottom-left', 3000);
          console.error('Error deleting doctor:', error);
        },
      });
    }
  }

  /* ---------------- RESET ---------------- */
  formReset() {
    this.model.set({
      name: '',
      address: '',
      contactNo: '',
      takeCom: '0',
      isChamberDoctor: '-1',
      mpoId: 0,
      userName: 'superSoft',
      valid: 0,
      entryDate: new Date().toISOString(),
      reportUserName: 'superSoft',
      drFee: 0,
      code: null,
      postBy: this.authService.getUser()?.username || '',
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
