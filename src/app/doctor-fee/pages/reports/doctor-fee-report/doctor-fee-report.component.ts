import { Component, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { SearchComponent } from '../../../../shared/components/svg/search/search.component';
import { PatientService } from '../../../services/patient.service';
import { DoctorService } from '../../../services/doctor.service';
import { DataFetchService } from '../../../../shared/services/useDataFetch';
import { DoctorFeeService } from '../../../services/doctor-fee.service';

@Component({
  selector: 'app-doctor-fee-report',
  standalone: true,
  imports: [SearchComponent, CommonModule, FormsModule],
  templateUrl: './doctor-fee-report.component.html',
  styleUrl: './doctor-fee-report.component.css'
})
export class DoctorFeeReportComponent {
  private patientService = inject(PatientService);
  private doctorService = inject(DoctorService);
  private doctorFeeService = inject(DoctorFeeService);
  dataFetchService = inject(DataFetchService);
  filteredPatientList = signal<any[]>([]);
  filteredDoctorList = signal<any[]>([]);
  filteredDoctorFeeList = signal<any[]>([]);
  DoctorFeeList = signal<any[]>([]);
  filteredDoctorOptions = signal<any[]>([]);
  query: any = '';
  fromDate: any;
  toDate: any;
  nextFollowDate: any;
  selectedDoctor: any = '';
  marginTop: any = 0;
  private searchQuery$ = new BehaviorSubject<string>('');
  isLoading$: Observable<any> | undefined;
  hasError$: Observable<any> | undefined;
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  transform(value: any, args: any = 'dd/MM/yyyy'): any {
    if (!value) return null;
    const datePipe = new DatePipe('en-US');
    return datePipe.transform(value, args);
  }

  ngOnInit() {
    const today = new Date();
    this.fromDate = today.toISOString().split('T')[0];
    // this.toDate = today.toISOString().split('T')[0];
    this.onLoadPatients();
    this.onLoadDoctors();
    this.onFilterData();

    // Focus on the search input when the component is initialized
    setTimeout(() => {
      this.searchInput.nativeElement.focus();
    }, 10);
  }

  onLoadPatients() {
    const { data$, isLoading$, hasError$ } = this.dataFetchService.fetchData(this.patientService.getAllPatients());
    data$.subscribe(data => {
      this.filteredPatientList.set(data);
    });
  }

  onLoadDoctors() {
    const { data$, isLoading$, hasError$ } = this.dataFetchService.fetchData(this.doctorService.getAllDoctors());
    data$.subscribe(data => {
      this.filteredDoctorList.set(data.sort((a: any, b: any) => a.name - b.name));
    });
  }

  // onLoadDoctorFees() {
  //   const { data$, isLoading$, hasError$ } = this.dataFetchService.fetchData(this.doctorFeeService.getAllDoctorFees());
  //   data$.subscribe(data => {
  //     this.DoctorFeeList.set(data);
  //     this.filteredDoctorFeeList.set(data);
  //   });
  //   this.isLoading$ = isLoading$;
  //   this.hasError$ = hasError$;
  //   combineLatest([data$, this.searchQuery$]).pipe(
  //     map(([data, query]) => {
  //       console.log(query)
  //       if (!query.trim()) {
  //         return data;
  //       }
  //       return data.filter((mainData: any) => {
  //         return (
  //           mainData.regNo?.toLowerCase()?.includes(query) ||
  //           mainData.patientName?.toLowerCase()?.includes(query) ||
  //           mainData.contactNo?.toLowerCase()?.includes(query) ||
  //           mainData.remarks?.toLowerCase()?.includes(query) ||
  //           mainData.postBy?.toLowerCase()?.includes(query) ||
  //           mainData.patientType?.toLowerCase()?.includes(query) ||
  //           mainData.doctorName?.toLowerCase()?.includes(query)
  //         );
  //       });
  //     })
  //   ).subscribe(filteredData => {
  //     this.filteredDoctorFeeList.set(filteredData);
  //     this.DoctorFeeList.set(filteredData);
  //     const uniqueDoctors = Array.from(new Map(filteredData.map((d: any) => [d.doctorId, { id: d.doctorId, name: d.doctorName }])).values());
  //     this.filteredDoctorOptions.set(uniqueDoctors);
  //   });
  // }

  onFilterData() {
    if (this.nextFollowDate) {
      this.fromDate = "";
      this.toDate = "";
    }
    const { data$, isLoading$, hasError$ } = this.dataFetchService.fetchData(this.doctorFeeService.getFilteredDoctorFee(this.fromDate, this.toDate, this.nextFollowDate));
    data$.subscribe(data => {
      this.DoctorFeeList.set(data);
      this.filteredDoctorFeeList.set(data.sort((a: any, b: any) => a.sl - b.sl));
      // Create a unique list of doctor options
      const uniqueDoctors = Array.from(new Map(data.map((d: any) => [d.doctorId, { id: d.doctorId, name: d.doctorName }])).values());
      // Set unique doctor options
      this.filteredDoctorOptions.set(uniqueDoctors);
    });
    this.isLoading$ = isLoading$;
    this.hasError$ = hasError$;
    combineLatest([data$, this.searchQuery$]).pipe(
      map(([data, query]) => {
        if (!query.trim()) {
          return data;
        }
        return data.filter((mainData: any) => {
          return (
            mainData.regNo?.toLowerCase()?.includes(query) ||
            mainData.patientName?.toLowerCase()?.includes(query) ||
            mainData.contactNo?.toLowerCase()?.includes(query) ||
            mainData.remarks?.toLowerCase()?.includes(query) ||
            mainData.postBy?.toLowerCase()?.includes(query) ||
            mainData.patientType?.toLowerCase()?.includes(query) ||
            mainData.doctorName?.toLowerCase()?.includes(query)
          );
        });
      })
    ).subscribe(filteredData => {
      this.filteredDoctorFeeList.set(filteredData.sort((a: any, b: any) => a.sl - b.sl));
      this.DoctorFeeList.set(filteredData);
      const uniqueDoctors = Array.from(new Map(filteredData.map((d: any) => [d.doctorId, { id: d.doctorId, name: d.doctorName }])).values());
      this.filteredDoctorOptions.set(uniqueDoctors);
    });
  }

  onSelectInputChange(): void {
    this.filteredDoctorFeeList.set(this.DoctorFeeList().sort((a: any, b: any) => a.sl - b.sl));
    if (!this.selectedDoctor.trim()) {
      return;
    }
    const filteredDoctorFees = this.filteredDoctorFeeList().filter(fee => fee.doctorId == this.selectedDoctor);
    this.filteredDoctorFeeList.set(filteredDoctorFees.sort((a: any, b: any) => a.sl - b.sl));
  }

  // Method to filter DoctorFee list based on search query
  onSearchDoctorFee(event: Event) {
    this.query = (event.target as HTMLInputElement).value.toLowerCase();
    this.searchQuery$.next(this.query);
  }

  getPatientName(id: any) {
    const patient = this.filteredPatientList().find(p => p.id == id);
    return patient?.name ?? '';
  }

  getDoctorName(id: any) {
    const doctor = this.filteredDoctorList().find(p => p.id == id);
    return doctor?.name ?? '';
  }

  handleClearFilter() {
    this.searchQuery$.next("");
    this.searchInput.nativeElement.value = "";
    const today = new Date();
    this.fromDate = today.toISOString().split('T')[0];
    this.toDate = '';
    this.nextFollowDate = '';
    this.selectedDoctor = '';
    this.onFilterData()
  }

  generatePDF() {
    const pageSizeWidth = 210;
    const pageSizeHeight = 297;
    const marginLeft = 10;
    const marginRight = 10;
    let marginTop = this.marginTop + 10;
    const marginBottom = 10;

    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'A4' });

    // Adjust margins based on conditions
    if (this.selectedDoctor) {
      marginTop += 5;
    }
    if (this.nextFollowDate || this.fromDate) {
      marginTop += 4;
    }

    // Title and Header Section
    // Get the exact center of the page (considering margins)
    const centerX = doc.internal.pageSize.getWidth() / 2;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Doctor Fee Report', centerX, marginTop, { align: 'center' });
    marginTop += 8;

    // Sub-header for doctor name and dates
    doc.setFontSize(10);
    if (this.selectedDoctor) {
      doc.text(`Doctor: ${this.getDoctorName(this.selectedDoctor)}`, centerX, marginTop, { align: 'center' });
      marginTop += 5;
    }
    if (this.nextFollowDate) {
      doc.text(`Next Follow Date: ${this.transform(this.nextFollowDate)}`, centerX, marginTop, { align: 'center' });
      marginTop += 4;
    } else if (this.fromDate) {
      const dateRange = `From: ${this.transform(this.fromDate)} to: ${this.toDate ? this.transform(this.toDate) : this.transform(this.fromDate)
        }`;
      doc.text(dateRange, centerX, marginTop, { align: 'center' });
      marginTop += 4;
    }

    // Prepare Table Data
    const dataRows = this.filteredDoctorFeeList().map((data: any) => [
      data?.sl,
      this.getPatientName(data?.patientRegId),
      data?.regNo || '',
      data?.contactNo || '',
      data?.patientType || '',
      data?.amount.toFixed(0) || 0,
      data?.discount.toFixed(0) || 0,
      this.transform(data?.nextFlowDate, 'dd/MM/yyyy') || '',
      data?.remarks || '',
    ]);

    const totalAmount = this.filteredDoctorFeeList().reduce((sum: number, data: any) => sum + (data.amount || 0), 0);
    const totalDiscount = this.filteredDoctorFeeList().reduce((sum: number, data: any) => sum + (data.discount || 0), 0);

    // Render Table
    (doc as any).autoTable({
      head: [['SL', 'Patient', 'Reg No', 'Contact No', 'Type', 'Amount', 'Discount', 'Next Follow Date', 'Remarks']],
      body: dataRows,
      foot: [
        [
          '', '', '', '', '',
          totalAmount.toFixed(0),
          totalDiscount.toFixed(0),
          '', ''
        ],
      ],
      theme: 'grid',
      startY: marginTop + 5,
      styles: {
        textColor: 0,
        cellPadding: 2,
        lineColor: 0,
        fontSize: 8,
        valign: 'middle',
        halign: 'center',
      },
      headStyles: {
        fillColor: [102, 255, 102],
        textColor: 0,
        lineWidth: 0.2,
        lineColor: 0,
        fontStyle: 'bold',
      },
      footStyles: {
        fillColor: [102, 255, 255],
        textColor: 0,
        lineWidth: 0.2,
        lineColor: 0,
        fontStyle: 'bold',
      },
      margin: { top: marginTop, left: marginLeft, right: marginRight },
      didDrawPage: (data: any) => {
        // Add Footer with Margin Bottom
        doc.setFontSize(8);
        doc.text(``, pageSizeWidth - marginRight - 10, pageSizeHeight - marginBottom, {
          align: 'right',
        });
      },
    });



    const finalY = (doc as any).lastAutoTable.finalY + 5;
    doc.setFontSize(10);
    doc.text(
      `Total Collection (${totalAmount} - ${totalDiscount}) = ${totalAmount - totalDiscount} Tk`,
      105,
      finalY,
      { align: 'center' }
    );



    // // Option 1: save
    // const fileName = `Transaction_Report_${this.transform(this.fromDate())}` +
    //   (this.toDate() ? `_to_${this.transform(this.toDate())}` : '') + '.pdf';
    // doc.save(fileName);

    // Option 2: open
    const pdfOutput = doc.output('blob');
    window.open(URL.createObjectURL(pdfOutput));


    // // Option 3: open
    // const pdfDataUri = doc.output('datauristring');
    // const newWindow = window.open();
    // if (newWindow) {
    //   newWindow.document.write(`<iframe width='100%' height='100%' src='${pdfDataUri}'></iframe>`);
    // } else {
    //   console.error('Failed to open a new window.');
    // }

    // // Option 4: open
    //   var string = doc.output('datauristring');
    //   var iframe = "<iframe width='100%' height='100%' src='" + string + "'></iframe>"
    //   var x = window.open();
    //   if (x) {
    //     x.document.open();
    //     x.document.write(iframe);
    //     x.document.close();
    //   } else {
    //     console.error('Failed to open a new window.');
    //   }
  }







}
