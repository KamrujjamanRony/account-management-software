import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, signal, viewChildren } from '@angular/core';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FieldComponent } from "../../../shared/components/field/field.component";

@Component({
  selector: 'app-outdoor-bill',
  imports: [ReactiveFormsModule, CommonModule, FieldComponent],
  templateUrl: './outdoor-bill.component.html',
  styleUrl: './outdoor-bill.component.css'
})
export class OutdoorBillComponent {
  fb = inject(NonNullableFormBuilder);
  readonly inputRefs = viewChildren<ElementRef>('inputRef');

  // dropdown options
  sexOption = signal([
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' }
  ]);

  // Sample test list
  testList = [
    { id: 509, name: 'CBC', charge: 500 },
    { id: 69, name: 'Random Blood Sugar (RBS)', charge: 150 },
    { id: 564, name: 'TSH', charge: 700 }
  ];

  refDoctor = signal([
    { label: 'Dr. Kamrujjaman', value: '1' },
    { label: 'Dr. John Doe', value: '2' },
    { label: 'Dr. Jane Smith', value: '3' }
  ]);

  form = this.fb.group({
    billNo: ['H25090001'],
    patientName: ['', Validators.required],
    age: [''],
    sex: [''],
    mobileNo: ['', Validators.required],
    address: [''],
    refDr: [''],
    consDr: [''],
    totalAmt: [1350],
    lessAmt: [0],
    collAmt: [1350],
    dueColl: [0],
    remarks: [''],
    regNo: [''],
    billTime: [''],
    dueLess: [''],
    dueLessFrom: [''],
    deliveryDate: [''],
    lastPrintPc: [''],
    pcName: [''],
    bedNo: [''],
    underDrCode: [''],
    postedBy: ['', [Validators.required]],
  });

  onSubmit(event: Event) {
    event.preventDefault();
    if (this.form.valid) {
      console.log("Bill Data:", this.form.value);
      alert('Bill Saved Successfully!');
    } else {
      alert('Please fill all required fields');
    }
  }

  formReset(e: Event) {
    e.preventDefault();
    this.form.reset();
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
}
