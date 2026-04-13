import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, QueryList, signal, ViewChild, ViewChildren } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

import { ModalWrapperComponent } from '../../../../../shared/components/modal-wrapper/modal-wrapper.component';
import { PatientService } from '../../../../services/patient.service';
import { DoctorService } from '../../../../services/doctor.service';
import { DoctorFeeService } from '../../../../services/doctor-fee.service';
import { AuthService } from '../../../../../settings/services/auth.service';
import { PermissionS } from '../../../../../settings/services/permission-s';
import { ToastService } from '../../../../../utils/toast/toast.service';
import { ConfirmService } from '../../../../../utils/confirm/confirm.service';
import { form, required, FormField } from '@angular/forms/signals';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPencil, faXmark, faMagnifyingGlass, faPrint } from '@fortawesome/free-solid-svg-icons';


@Component({
  selector: 'app-doctor-fee',
  imports: [FormsModule, FormField, ModalWrapperComponent, FontAwesomeModule],
  providers: [DatePipe],
  templateUrl: './doctor-fee.component.html',
  styleUrl: './doctor-fee.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DoctorFeeComponent {
  faPencil = faPencil;
  faXmark = faXmark;
  faMagnifyingGlass = faMagnifyingGlass;
  faPrint = faPrint;
  showList = signal(true);

  /* ---------------- DI ---------------- */
  private patientService = inject(PatientService);
  private doctorService = inject(DoctorService);
  private doctorFeeService = inject(DoctorFeeService);
  private authService = inject(AuthService);
  private datePipe = inject(DatePipe);
  private permissionService = inject(PermissionS);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  /* ---------------- SIGNAL STATE ---------------- */
  allPatients = signal<any[]>([]);
  allDoctors = signal<any[]>([]);
  doctorFees = signal<any[]>([]);
  searchQuery = signal('');
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  @ViewChildren('inputRef') inputRefs!: QueryList<ElementRef>;
  initialLoad = signal(true);
  options: any[] = ['New', 'Old', 'Others'];

  selected = signal<any>(null);
  fromDate = new Date().toISOString().split('T')[0];
  toDate = '';

  isLoading = signal(false);
  hasError = signal(false);
  isSubmitted = signal(false);
  isView = signal(false);
  isInsert = signal(false);
  isEdit = signal(false);
  isDelete = signal(false);

  filteredDoctorFeeList = computed(() => {
    const query = this.searchQuery().toLowerCase();
    return this.doctorFees()
      .filter(d =>
        String(d.regNo ?? '').toLowerCase().includes(query) ||
        String(d.doctorName ?? '').toLowerCase().includes(query) ||
        String(d.patientName ?? '').toLowerCase().includes(query) ||
        String(d.contactNo ?? '').toLowerCase().includes(query) ||
        String(d.patientType ?? '').toLowerCase().includes(query) ||
        String(d.remarks ?? '').toLowerCase().includes(query) ||
        String(d.postBy ?? '').toLowerCase().includes(query)
      );
  });

  /* ---------------- FORM MODEL ---------------- */
  model = signal({
    doctorId: '' as any,
    patientRegId: '' as any,
    patientType: 'New',
    amount: '' as any,
    discount: '' as any,
    remarks: '',
    postBy: this.authService.getUser()?.username || '',
    nextFlowDate: '' as any,
    entryDate: '',
  });

  /* ---------------- SIGNAL FORM ---------------- */
  form = form(this.model, (s) => {
    required(s.doctorId, { message: 'Doctor is required' });
    required(s.patientRegId, { message: 'Patient is required' });
  });

  /* ---------------- LIFECYCLE ---------------- */
  ngOnInit() {
    this.loadDoctorFees();
    this.loadPatients();
    this.loadDoctors();
    this.loadPermissions();

    setTimeout(() => {
      this.initialLoad.set(false);
      const inputs = this.inputRefs.toArray();
      inputs[0]?.nativeElement.focus();
    }, 100);
  }

  /* ---------------- LOADERS ---------------- */
  loadPermissions() {
    this.isView.set(this.permissionService.hasPermission('Doctor Fee'));
    this.isInsert.set(this.permissionService.hasPermission('Doctor Fee', 'Insert'));
    this.isEdit.set(this.permissionService.hasPermission('Doctor Fee', 'Edit'));
    this.isDelete.set(this.permissionService.hasPermission('Doctor Fee', 'Delete'));
  }
  loadPatients() {
    this.patientService.getAllPatients().subscribe({
      next: (data) => {
        this.allPatients.set(data);
        this.patientOptions = data.map((p: any) => ({ id: p.id, name: `${p.regNo} - ${p.name} - ${p.contactNo}` }));
      },
    });
  }

  loadDoctors() {
    this.doctorService.getFilterDoctors(1, '').subscribe({
      next: (data) => {
        this.allDoctors.set(data);
        this.doctorOptions = data.map((d: any) => ({ id: d.id, name: d.name, drFee: d.drFee }));
      },
    });
  }

  loadDoctorFees() {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.doctorFeeService.search(this.searchQuery().toLowerCase(), this.fromDate, this.toDate).subscribe({
      next: (data: any[]) => {
        this.doctorFees.set(data.sort((a: any, b: any) => {
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
    const value = (event.target as HTMLInputElement).value.trim();
    if (value && value.length >= 3) {
      this.searchQuery.set(value);
      this.loadDoctorFees();
    }
  }

  /* ---------------- SUBMIT ---------------- */
  onSubmit(event: Event) {
    event.preventDefault();
    if (!this.form().valid()) {
      this.toast.warning('Form is Invalid! Please fill Patient and Doctor.', 'bottom-right', 5000);
      return;
    }
    this.isSubmitted.set(true);

    const formValue = this.form().value();
    const todayDate = new Date().toISOString();
    const payload = {
      ...formValue,
      amount: Number(formValue.amount),
      discount: Number(formValue.discount),
      nextFlowDate: formValue.nextFlowDate || '',
    };

    if (!this.selected()) {
      this.doctorFeeService.add({ ...payload, entryDate: todayDate }).subscribe({
        next: (response) => {
          if (response) {
            this.doctorFees.set([response, ...this.doctorFees()]);
            this.onToggleList();
            this.generatePDF(response);
            this.toast.success('Saved successfully!', 'bottom-right', 5000);
          }
        },
        error: (error) => {
          this.toast.danger('Save unsuccessful!', 'bottom-left', 3000);
          console.error('Error submitting:', error);
          this.isSubmitted.set(false);
        },
      });
    } else {
      this.doctorFeeService.update(this.selected(), payload).subscribe({
        next: (response) => {
          if (response) {
            const rest = this.doctorFees().filter(d => d.gid !== response.gid);
            this.doctorFees.set([response, ...rest]);
            this.selected.set(null);
            this.onToggleList();
            this.toast.success('Updated successfully!', 'bottom-right', 5000);
          }
        },
        error: (error) => {
          this.toast.danger('Update unsuccessful!', 'bottom-left', 3000);
          console.error('Error updating:', error);
          this.isSubmitted.set(false);
        },
      });
    }

    this.followupModal = false;
  }

  /* ---------------- UPDATE ---------------- */
  onUpdate(data: any) {
    this.selected.set(data.gid);

    const formattedDate = data?.nextFlowDate
      ? (() => {
        const date = new Date(data.nextFlowDate);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      })()
      : '';

    this.model.update(current => ({
      ...current,
      patientRegId: data?.patientRegId ?? '',
      doctorId: data?.doctorId ?? '',
      patientType: data?.patientType ?? 'New',
      amount: data?.amount ?? '',
      discount: data?.discount ?? '',
      remarks: data?.remarks ?? '',
      postBy: data?.postBy ?? '',
      nextFlowDate: formattedDate,
      entryDate: data?.entryDate ? data.entryDate : '',
    }));

    this.isPatientEnable = false;
    this.isDoctorEnable = false;
    this.showList.set(false);

    setTimeout(() => {
      const inputs = this.inputRefs.toArray();
      inputs[0]?.nativeElement.focus();
    }, 10);

    this.highlightedIndexPatient = -1;
    this.highlightedIndexDoctor = -1;
  }

  /* ---------------- DELETE ---------------- */
  async onDelete(id: any) {
    const ok = await this.confirm.confirm({
      message: 'Are you sure you want to delete this fee entry?',
      confirmText: "Yes, I'm sure",
      cancelText: 'No, cancel',
      variant: 'danger',
    });
    if (ok) {
      this.doctorFeeService.delete(id).subscribe({
        next: () => {
          this.doctorFees.update(list => list.filter(d => d.gid !== id));
          this.toast.success('Doctor fee deleted successfully!', 'bottom-right', 5000);
        },
        error: (error) => {
          this.toast.danger('Delete unsuccessful!', 'bottom-left', 3000);
          console.error('Error deleting:', error);
        },
      });
    }
  }

  /* ---------------- RESET ---------------- */
  formReset(e?: Event) {
    e?.preventDefault();
    this.isDoctorEnable = true;
    this.isPatientEnable = true;
    this.model.set({
      doctorId: '',
      patientRegId: '',
      patientType: 'New',
      amount: '',
      discount: '',
      remarks: '',
      postBy: this.authService.getUser()?.username || '',
      nextFlowDate: '',
      entryDate: '',
    });
    this.selected.set(null);
    this.isSubmitted.set(false);
    this.form().reset();
  }

  handleClearFilter() {
    this.searchQuery.set('');
    this.searchInput.nativeElement.value = '';
    this.fromDate = new Date().toISOString().split('T')[0];
    this.toDate = '';
    this.loadDoctorFees();
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

  /* ---------------- PATIENT AUTOCOMPLETE ---------------- */
  isPatientDropdownOpen = false;
  patientOptions: any[] = [];
  highlightedIndexPatient = -1;
  isPatientEnable = true;

  displayPatient(id: any) {
    const find = this.patientOptions.find((p: any) => p.id === id);
    return find?.name ?? '';
  }

  handlePatientKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      this.isPatientDropdownOpen = true;
      event.preventDefault();
    }
    if (this.isPatientDropdownOpen && this.patientOptions.length > 0) {
      if (event.key === 'ArrowDown') {
        this.highlightedIndexPatient = (this.highlightedIndexPatient + 1) % this.patientOptions.length;
        event.preventDefault();
      } else if (event.key === 'ArrowUp') {
        this.highlightedIndexPatient = (this.highlightedIndexPatient - 1 + this.patientOptions.length) % this.patientOptions.length;
        event.preventDefault();
      } else if (event.key === 'Enter') {
        event.preventDefault();
        if (this.highlightedIndexPatient !== -1) {
          this.onSelectPatient(this.patientOptions[this.highlightedIndexPatient]);
          this.isPatientDropdownOpen = false;
        }
      }
    }
  }

  togglePatientDropdown(e: any) {
    e.preventDefault();
    this.isPatientDropdownOpen = !this.isPatientDropdownOpen;
    this.highlightedIndexPatient = -1;
  }

  onSelectPatient(option: any) {
    this.model.update(m => ({ ...m, patientRegId: option?.id ?? this.patientOptions[this.highlightedIndexPatient]?.id }));
    this.isPatientDropdownOpen = false;
    this.isPatientEnable = false;
    this.highlightedIndexPatient = -1;
  }

  onPatientSearchChange(event: Event) {
    const searchValue = (event.target as HTMLInputElement).value?.toLowerCase();
    this.patientOptions = this.allPatients().filter(option =>
      option.name?.toLowerCase().includes(searchValue) ||
      option.regNo?.toString().toLowerCase().includes(searchValue) ||
      option.contactNo?.toString().toLowerCase().includes(searchValue)
    ).map((p: any) => ({ id: p.id, name: `${p.regNo} - ${p.name} - ${p.contactNo}` }));
    this.highlightedIndexPatient = -1;
    this.isPatientDropdownOpen = searchValue !== '';
  }

  getPatientName(id: any) {
    const patient = this.allPatients().find(p => p.id == id);
    return patient?.name ?? '';
  }

  onClearPatient(event: Event) {
    event.preventDefault();
    this.model.update(m => ({ ...m, patientRegId: '' }));
    this.isPatientEnable = true;
  }

  /* ---------------- DOCTOR AUTOCOMPLETE ---------------- */
  isDoctorDropdownOpen = false;
  doctorOptions: any[] = [];
  highlightedIndexDoctor = -1;
  isDoctorEnable = true;

  displayDoctor(id: any) {
    const find = this.doctorOptions.find((p: any) => p.id === id);
    return find?.name ?? '';
  }

  handleDoctorKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      this.isDoctorDropdownOpen = true;
      event.preventDefault();
    }
    if (this.isDoctorDropdownOpen && this.doctorOptions.length > 0) {
      if (event.key === 'ArrowDown') {
        this.highlightedIndexDoctor = (this.highlightedIndexDoctor + 1) % this.doctorOptions.length;
        event.preventDefault();
      } else if (event.key === 'ArrowUp') {
        this.highlightedIndexDoctor = (this.highlightedIndexDoctor - 1 + this.doctorOptions.length) % this.doctorOptions.length;
        event.preventDefault();
      } else if (event.key === 'Enter') {
        event.preventDefault();
        if (this.highlightedIndexDoctor !== -1) {
          this.selectDoctor(this.doctorOptions[this.highlightedIndexDoctor]);
          this.isDoctorDropdownOpen = false;
        }
      }
    }
  }

  toggleDoctorDropdown(e: any) {
    e.preventDefault();
    this.isDoctorDropdownOpen = !this.isDoctorDropdownOpen;
    this.highlightedIndexDoctor = -1;
  }

  selectDoctor(option: any) {
    this.model.update(m => ({
      ...m,
      doctorId: option?.id ?? this.doctorOptions[this.highlightedIndexDoctor]?.id,
      amount: option?.drFee ?? this.doctorOptions[this.highlightedIndexDoctor]?.drFee ?? 0,
      discount: 0,
    }));
    this.isDoctorDropdownOpen = false;
    this.isDoctorEnable = false;
    this.highlightedIndexDoctor = -1;
  }

  onDoctorSearchChange(event: Event) {
    const searchValue = (event.target as HTMLInputElement).value?.toLowerCase();
    this.doctorOptions = this.allDoctors().filter(option =>
      option.name?.toLowerCase().includes(searchValue)
    ).map((p: any) => ({ id: p.id, name: p.name, drFee: p.drFee }));
    this.highlightedIndexDoctor = -1;
    this.isDoctorDropdownOpen = searchValue !== '';
  }

  getDoctorName(id: any) {
    const doctor = this.allDoctors().find(p => p.id == id);
    return doctor?.name ?? '';
  }

  onClearDoctor(event: Event) {
    event.preventDefault();
    this.model.update(m => ({ ...m, doctorId: '', amount: 0 }));
    this.isDoctorEnable = true;
  }

  /* ---------------- MODALS ---------------- */
  followupModal = false;
  followupModalData: any;

  onFollowUpUpdate(item: any) {
    this.followupModalData = item;
    this.followupModal = true;
    this.onUpdate(item);
  }

  closeFollowupModal() {
    this.followupModal = false;
    this.formReset();
  }

  generatePDF(entry: any) {

    // Set initial margins and page dimensions
    const pageSizeWidth = 80;
    const pageSizeHeight = 100;
    const marginLeft = 10; // Left margin
    const marginTopStart = 10; // Starting top margin
    const marginBottom = 0; // Bottom margin
    const marginRight = 10; // Right margin

    // Initialize jsPDF with A7 size
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: [pageSizeWidth, pageSizeHeight] });
    const pageWidth = doc.internal.pageSize.width; // Page width
    const pageHeight = doc.internal.pageSize.height; // Page height
    const contentWidth = pageWidth - marginLeft - marginRight; // Usable content width
    const usableHeight = pageHeight - marginTopStart - marginBottom; // Usable content height

    let marginTop = marginTopStart; // Dynamic marginTop for tracking position

    // Header: Main Report Title
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Doctor Fee Entry', pageWidth / 2, marginTop, { align: 'center' });

    // Adjust marginTop for the next section
    marginTop += 6;

    // Doctor Name with Text Wrapping
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    const doctorName = `Doctor: ${entry?.doctorName}`;
    const wrappedDoctorName = doc.splitTextToSize(doctorName, contentWidth);
    doc.text(wrappedDoctorName, marginLeft, marginTop);
    marginTop += wrappedDoctorName.length * 4;

    // Patient and Fee Details
    if (entry) {
      marginTop += 1;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('Patient Details:', marginLeft, marginTop);

      doc.setFont('helvetica', 'normal');
      marginTop += 4;
      const details = [
        `Serial: ${entry.sl}`,
        `Patient Name: ${entry.patientName}`,
        `Reg No: ${entry.regNo}`,
        `Contact No: ${entry.contactNo}`,
        `Patient Type: ${entry.patientType}`,
        `Amount: ${entry.amount?.toFixed(0) || 'N/A'} Tk`,
        `Discount: ${entry.discount?.toFixed(0) || 'N/A'} Tk`,
        `Entry Date: ${entry.entryDate
          ? this.transform(entry.entryDate.split("T")[0], 'dd/MM/yyyy')
          : 'N/A'
        }`,
        `Entry Time: ${entry.entryDate
          ? entry.entryDate.split("T")[1]
          : 'N/A'
        }`,
        `Next Follow Date: ${entry.nextFlowDate
          ? this.transform(entry.nextFlowDate, 'dd/MM/yyyy')
          : 'N/A'
        }`,
        `Post by: ${entry.postBy || 'Not Entry'}`,
        `Remarks: ${entry.remarks || 'N/A'}`,
      ];

      details.forEach((detail) => {
        const wrappedDetail = doc.splitTextToSize(detail, contentWidth);

        // Check if adding the next line exceeds usable height
        const requiredHeight = wrappedDetail.length * 4;
        if (marginTop + requiredHeight > usableHeight) {
          doc.addPage(); // Add a new page
          marginTop = marginTopStart; // Reset marginTop for the new page
        }

        doc.text(wrappedDetail, marginLeft, marginTop);
        marginTop += requiredHeight; // Adjust for wrapped lines
      });
    }

    doc.output('dataurlnewwindow');
    // doc.save(`${entry.regNo}-FeeToken.pdf`);
  }


}
