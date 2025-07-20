import { CommonModule, DatePipe } from '@angular/common';
import { Component, ElementRef, inject, signal, viewChild, viewChildren } from '@angular/core';
import { FieldComponent } from '../../../../shared/components/field/field.component';
import { SearchComponent } from '../../../../shared/components/svg/search/search.component';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DataFetchService } from '../../../../shared/services/useDataFetch';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { FixedAssetService } from '../../../services/fixed-asset.service';
import { AllSvgComponent } from "../../../../shared/components/svg/all-svg/all-svg.component";
import { AccountListService } from '../../../services/account-list.service';
import { ToastService } from '../../../../shared/components/primeng/toast/toast.service';
import { AuthService } from '../../../../settings/services/auth.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DataService } from '../../../../shared/services/data.service';
import { AssetViewModalComponent } from "../../../components/asset-view-modal/asset-view-modal.component";

@Component({
  selector: 'app-fixed-asset-description',
  imports: [CommonModule, FieldComponent, SearchComponent, ReactiveFormsModule, AllSvgComponent, AssetViewModalComponent],
  templateUrl: './fixed-asset-description.component.html',
  styleUrl: './fixed-asset-description.component.css'
})
export class FixedAssetDescriptionComponent {
  fb = inject(NonNullableFormBuilder);
  private fixedAssetService = inject(FixedAssetService);
  private accountListService = inject(AccountListService);
  private toastService = inject(ToastService);
  private dataFetchService = inject(DataFetchService);
  private dataService = inject(DataService);
  private authService = inject(AuthService);
  isView = signal<boolean>(false);
  isInsert = signal<boolean>(false);
  isEdit = signal<boolean>(false);
  isDelete = signal<boolean>(false);
  filteredFixedAssetList = signal<any[]>([]);
  highlightedTr: number = -1;
  assetTypeOption = signal<any[]>([]);
  showForm = signal<boolean>(false);
  selectedFixedAsset: any;
  statusOptions = signal<any[]>(['Active', 'Inactive', 'Damaged', 'Lost', 'Sold']);
  header = signal<any>(null);

  private searchQuery$ = new BehaviorSubject<string>('');
  isLoading$: Observable<any> | undefined;
  hasError$: Observable<any> | undefined;
  readonly inputRefs = viewChildren<ElementRef>('inputRef');
  readonly searchInput = viewChild.required<ElementRef<HTMLInputElement>>('searchInput');
  isSubmitted = false;

  form = this.fb.group({
    assetName: ['', [Validators.required]],
    assetTypeId: [''],
    purInvNO: [''],
    purDate: [''],
    purPrice: [''],
    depCalDate: [''],
    deprePercentage: [''],
    // depValue: [{ value: 0, disabled: false }],
    // wdv: [{ value: 0, disabled: false }],
    // others1: [{ value: 0, disabled: false }],
    depValue: [''],
    wdv: [''],
    vendor: [''],
    model: [''],
    qty: [''],
    cpu: [''],
    eul: [''],
    adInf: [''],
    location: [''],
    warrEndDate: [''],
    fileLink: [''],
    postBy: [this.authService.getUser()?.username || ''],
    status: ['Active'],
    remarks: [''],
    others1: [''],
    others2: [''],
    others3: [''],
  });

  ngOnInit() {
    const reqBody = {         // todo: set assetId
      "headId": 8,
      "allbyheadId": 8
    };
    this.accountListService.getAccountList(reqBody).subscribe(data => {
      this.assetTypeOption.set(data.map((c: any) => ({ id: c.id, text: c.subHead.toLowerCase() })));
    });
    this.onLoadFixedAssets();
    this.dataService.getHeader().subscribe(data => this.header.set(data));
    this.isView.set(this.checkPermission("Fixed Asset Description", "View"));
    this.isInsert.set(this.checkPermission("Fixed Asset Description", "Insert"));
    this.isEdit.set(this.checkPermission("Fixed Asset Description", "Edit"));
    this.isDelete.set(this.checkPermission("Fixed Asset Description", "Delete"));

    // Focus on the search input when the component is initialized
    setTimeout(() => {
      const inputs = this.inputRefs();
      inputs[0]?.nativeElement.focus();
    }, 10); // Delay to ensure the DOM is updated
  }

  onDisplayAssetType(assetTypeId: any): string {
    const assetType = this.assetTypeOption().find((item: any) => item.id == assetTypeId);
    return assetType ? assetType.text : '';
  }

  // Load Fixed Assets List
  onLoadFixedAssets() {
    const { data$, isLoading$, hasError$ } = this.dataFetchService.fetchData(this.fixedAssetService.getFixedAsset(""));

    this.isLoading$ = isLoading$;
    this.hasError$ = hasError$;
    // Combine the original data stream with the search query to create a filtered list
    combineLatest([
      data$,
      this.searchQuery$
    ]).pipe(
      map(([data, query]) =>
        data.filter((FixedAssetData: any) =>
          FixedAssetData.assetName?.toLowerCase().includes(query) ||
          FixedAssetData.purInvNO?.includes(query)
        )
      )
    ).subscribe(filteredData => this.filteredFixedAssetList.set(filteredData.reverse().map((item: any) => {
      return {
        id: item.id,
        assetName: item.assetName,
        assetTypeId: item.assetTypeId,
        purInvNO: item.purInvNO,
        purDate: item.purDate?.split('T')[0] || null,
        purPrice: item.purPrice,
        depCalDate: item.depCalDate?.split('T')[0] || null,
        deprePercentage: item.deprePercentage,
        depValue: item.depValue,
        wdv: item.wdv,
        location: item.location,
        warrEndDate: item.warrEndDate?.split('T')[0] || null,
        fileLink: item.fileLink,
        postBy: item.postBy,
        model: item.model,
        vendor: item.vendor,
        qty: item.qty,
        cpu: item.cpu,
        eul: item.eul,
        adInf: item.adInf,
        remarks: item.remarks,
        status: item.status,
        others1: item.others1,
        others2: item.others2,
        others3: item.others3
      };
    })));
  }

  checkPermission(moduleName: string, permission: string) {
    const modulePermission = this.authService.getUser()?.userMenu?.find((module: any) => module?.menuName?.toLowerCase() === moduleName.toLowerCase());
    if (modulePermission) {
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

  // Method to filter FixedAsset list based on search query
  onSearchFixedAsset(event: Event) {
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
    if (this.filteredFixedAssetList().length === 0) {
      return; // Exit if there are no items to navigate
    }

    if (event.key === 'Tab') {
      event.preventDefault();
      const inputs = this.inputRefs();
      inputs[0].nativeElement.focus();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault(); // Prevent default scrolling behavior
      this.highlightedTr = (this.highlightedTr + 1) % this.filteredFixedAssetList().length;
    } else if (event.key === 'ArrowUp') {
      event.preventDefault(); // Prevent default scrolling behavior
      this.highlightedTr =
        (this.highlightedTr - 1 + this.filteredFixedAssetList().length) % this.filteredFixedAssetList().length;
    } else if (event.key === 'Enter') {
      event.preventDefault(); // Prevent form submission

      // Call onUpdate for the currently highlighted item
      if (this.highlightedTr !== -1) {
        const selectedItem = this.filteredFixedAssetList()[this.highlightedTr];
        this.onUpdate(selectedItem);
        this.highlightedTr = -1;
      }
    }
  }

  onSubmit(e: Event) {
    this.isSubmitted = true;
    if (this.form.valid) {
      // console.log(this.form.value);
      // this.form.get('depValue')?.enable();
      // this.form.get('wdv')?.enable();
      const submitValue = { ...this.form.value, purPrice: this.form.value.purPrice || 0, depValue: this.form.value.depValue || 0, wdv: this.form.value.wdv || 0, others1: this.form.value.others1 || 0, deprePercentage: this.form.value.deprePercentage || 0, purDate: this.form.value.purDate ? new Date(this.form.value.purDate) : null, depCalDate: this.form.value.depCalDate ? new Date(this.form.value.depCalDate) : null, warrEndDate: this.form.value.warrEndDate ? new Date(this.form.value.warrEndDate) : null };
      if (this.selectedFixedAsset) {
        this.fixedAssetService.updateFixedAsset(this.selectedFixedAsset.id, submitValue)
          .subscribe({
            next: (response) => {
              if (response !== null && response !== undefined) {
                this.toastService.showMessage('success', 'Successful', 'FixedAsset successfully updated!');
                const rest = this.filteredFixedAssetList().filter(d => d.id !== response.id);
                this.filteredFixedAssetList.set([response, ...rest]);
                this.isSubmitted = false;
                this.selectedFixedAsset = null;
                this.formReset(e);
              }

            },
            error: (error) => {
              console.error('Error Update:', error);
              this.toastService.showMessage('error', 'Error', `${error.error.status} : ${error.error.message || error.error.title}`);
              // this.form.get('depValue')?.disable();
              // this.form.get('wdv')?.disable();
            }
          });
      } else {
        this.fixedAssetService.addFixedAsset(submitValue)
          .subscribe({
            next: (response) => {
              if (response !== null && response !== undefined) {
                this.toastService.showMessage('success', 'Successful', 'FixedAsset successfully added!');
                this.filteredFixedAssetList.set([response, ...this.filteredFixedAssetList()])
                this.isSubmitted = false;
                this.formReset(e);
              }

            },
            error: (error) => {
              console.error('Error register:', error);
              this.toastService.showMessage('error', 'Error', `${error.error.status} : ${error.error.message || error.error.title}`);
              // this.form.get('depValue')?.disable();
              // this.form.get('wdv')?.disable();
            }
          });
      }
    } else {
      this.toastService.showMessage('warn', 'Warning', 'Form is invalid! Please Fill All Requirement Field.');
    }
  }

  onUpdate(data: any) {
    this.selectedFixedAsset = data;
    this.form.patchValue({
      assetName: data?.assetName || '',
      assetTypeId: data?.assetTypeId || '',
      purInvNO: data?.purInvNO || '',
      purDate: data?.purDate?.split('T')[0] || null,
      purPrice: data?.purPrice || 0,
      depCalDate: data?.depCalDate?.split('T')[0] || null,
      deprePercentage: data?.deprePercentage || 0,
      depValue: data?.depValue || 0,
      wdv: data?.wdv || 0,
      location: data?.location || '',
      warrEndDate: data?.warrEndDate?.split('T')[0] || null,
      fileLink: data?.fileLink || '',
      postBy: this.authService.getUser()?.username || '',
      model: data?.model || '',
      vendor: data?.vendor || '',
      qty: data?.qty || '',
      cpu: data?.cpu || '',
      eul: data?.eul || '',
      adInf: data?.adInf || '',
      remarks: data?.remarks || '',
      status: data?.status || 'Active',
      others1: data?.others1 || '',
      others2: data?.others2 || '',
      others3: data?.others3 || '',
    });
    console.log(this.form.value);
    this.showForm.set(true);
    this.isSubmitted = false;
    this.highlightedTr = -1;

    // Focus the 'Name' input field after patching the value
    setTimeout(() => {
      const inputs = this.inputRefs();
      inputs[0].nativeElement.focus();
    }, 0); // Delay to ensure the DOM is updated
  }

  onDelete(id: any) {
    if (confirm("Are you sure you want to delete?")) {
      this.fixedAssetService.deleteFixedAsset(id).subscribe(data => {
        if (data.id) {
          this.toastService.showMessage('success', 'Successful', 'FixedAsset deleted successfully!');
          this.filteredFixedAssetList.set(this.filteredFixedAssetList().filter(d => d.id !== id));
        } else {
          console.error('Error deleting FixedAsset:', data);
          this.toastService.showMessage('error', 'Error', `Error deleting FixedAsset : ${data.message}`);
        }
      });
    }
  }

  formReset(e: Event): void {
    e.preventDefault();
    this.form.reset({
      assetName: '',
      assetTypeId: '',
      purInvNO: '',
      purDate: '',
      purPrice: '',
      depCalDate: '',
      deprePercentage: '',
      depValue: '',
      wdv: '',
      location: '',
      warrEndDate: '',
      fileLink: '',
      postBy: this.authService.getUser()?.username || '',
      model: '',
      status: 'Active',
      remarks: '',
      vendor: '',
      qty: '',
      cpu: '',
      eul: '',
      adInf: '',
      others1: '',
      others2: '',
      others3: '',
    });
    this.isSubmitted = false;
    this.selectedFixedAsset = null;
    this.showForm.set(false);
    this.highlightedTr = -1;
    // this.form.get('depValue')?.disable();
    // this.form.get('wdv')?.disable();
  }

  // Add these properties to your component
  showViewModal = false;
  selectedAsset: any | null = null;
  selectedAssetType = '';

  // Add these methods
  openViewModal(asset: any) {
    this.selectedAsset = asset;
    this.selectedAssetType = this.onDisplayAssetType(asset?.assetTypeId);
    this.showViewModal = true;
  }

  closeViewModal() {
    this.showViewModal = false;
    this.selectedAsset = null;
    this.selectedAssetType = '';
  }


  transform(value: any, args: any = 'dd/MM/yyyy'): any {
    if (!value) return null;
    const datePipe = new DatePipe('en-US');
    return datePipe.transform(value, args);
  }

  generatePDF() {
    const doc = new jsPDF({ orientation: 'l', unit: 'mm', format: 'A4' });
    // const pageSizeWidth = 210;
    // const pageSizeHeight = 297;
    const marginLeft = 10;
    const marginRight = 10;
    const marginBottom = 10;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const centerX = doc.internal.pageSize.getWidth() / 2;
    let yPos = (this.header()?.marginTop | 0) + 10;

    // Header Section
    yPos = this.displayReportHeader(doc, yPos, centerX);
    // Title Section
    yPos = this.displayReportTitle(doc, yPos, centerX);
    // Render Table with custom column widths
    yPos = this.displayReportTable(doc, yPos, pageWidth, pageHeight, marginLeft, marginRight, marginBottom);

    // Option 2: open
    const pdfOutput = doc.output('blob');
    window.open(URL.createObjectURL(pdfOutput));
  }

  displayReportHeader(doc: jsPDF, yPos: number, centerX: number): any {
    if (this.header()) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text(this.header()?.name, centerX, yPos, { align: 'center' });
      yPos += 2;
    }

    if (this.header()?.address) {
      yPos += 3;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(this.header()?.address, centerX, yPos, { align: 'center' });
      yPos += 2;
    }

    if (this.header()?.contact) {
      yPos += 3;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(`Contact: ${this.header()?.contact}`, centerX, yPos, { align: 'center' });
      yPos += 2;
    }
    doc.line(0, yPos, 560, yPos);
    yPos += 5;

    return yPos;
  }

  displayReportTitle(doc: jsPDF, yPos: number, centerX: number): any {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`Current Asset List`, centerX, yPos, { align: 'center' });
    yPos += 2;

    // Sub-header for doctor name and dates
    // doc.setFontSize(10);

    // if (this.fromDate()) {
    //   const dateRange = `From: ${this.transform(this.fromDate())} to: ${this.toDate() ? this.transform(this.toDate()) : this.transform(this.fromDate())
    //     }`;
    //   doc.text(dateRange, centerX, yPos, { align: 'center' });
    // }

    return yPos;
  }

  displayReportTable(doc: jsPDF, yPos: number, pageWidth: number, pageHeight: number, marginLeft: number, marginRight: number, marginBottom: number): any {
    // Prepare Table Data
    const dataRows = this.filteredFixedAssetList().map((data: any) => [
      this.onDisplayAssetType(data?.assetTypeId) || '',
      data?.assetName || '',
      data?.purInvNO || '',
      this.transform(data?.purDate) || '',
      data?.cpu || '',
      data?.qty || '',
      data?.purPrice || '',
      data?.eul || '',
      this.transform(data?.depCalDate) || '',
      data?.others1 || '',
      data?.deprePercentage + '%' || '',
      data?.depValue || '',
      data?.wdv || '',
      data?.status || '',
      data?.remarks || '',
    ]);
    autoTable(doc, {
      head: [['Asset Type', 'Asset Name', 'Purchase Invoice No', 'Purchase Date', "Cost/Unit", "Quantity", "Purchase Price", "Estimated Useful Life", "Depreciation Calculation Date", "Previous Value", "Depreciation %", "Depreciation Value", "Written-Down Value", "Status", 'Remarks']],
      body: dataRows,
      // foot: [
      //   [
      //     '', '', 'Total:',
      //     this.totalDebit().toFixed(0),
      //     this.totalCredit().toFixed(0),
      //     '', ''
      //   ],
      // ],
      theme: 'grid',
      startY: yPos + 2,
      styles: {
        textColor: 0,
        cellPadding: 2,
        lineColor: 0,
        fontSize: 7,
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
      margin: { top: yPos, left: marginLeft, right: marginRight },
      // columnStyles: {
      //   0: { cellWidth: 20 },
      //   1: { cellWidth: 20 },
      //   2: { cellWidth: 50 },
      //   3: { cellWidth: 20 },
      //   4: { cellWidth: 20 },
      //   5: { cellWidth: 30 },
      //   6: { cellWidth: 30 }
      // },
      didDrawPage: (data: any) => {
        // Add Footer with Margin Bottom
        doc.setFontSize(8);
        doc.text(``, pageWidth - marginRight - 10, pageHeight - marginBottom, {
          align: 'right',
        });
      },
    });

    return yPos;
  }

}
