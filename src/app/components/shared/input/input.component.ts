import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule],
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true
    }
  ]
})
export class InputComponent implements ControlValueAccessor {
  @Input() label: string = '';
  @Input() cType: any;
  @Input() isSubmitted: boolean = false;
  @Input() options: any[] = [];
  @Output() handleChange = new EventEmitter<void>(); 
  @Output() handleFocus = new EventEmitter<void>(); 
  @ViewChild('inputRef', { static: false  }) inputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('inputRef') inputField!: ElementRef;

  focus() {
    this.inputField.nativeElement.focus();
  }

  value: any = '';                         // Store the value for the input field
  isDisabled: boolean = false;                // Store whether the input is disabled

  // Implement ControlValueAccessor interface
  onChange = (_: any) => {};
  onTouch = () => {};
  nativeElement: any;

  onHandleChange() {
    this.handleChange.emit();
  }

  onHandleFocus() {
    this.handleFocus.emit();
  }

  writeValue(value: any): void {
    this.value = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouch = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  // Handle input change
  onInputChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (this.cType) {
      this.value = input.value;
    } else {
      // Use regular expression to prevent non-numeric and negative signs
    if (input.value.includes('-')) {
      this.value = Math.abs(parseFloat(input.value)); // Get absolute value to ensure it's positive
      (event.target as HTMLInputElement).value = this.value?.toString() || '';
    } else {
      this.value = parseFloat(input.value);
    }

    // If user inputs an invalid number (NaN), reset to null
    if (isNaN(this.value)) {
      this.value = null;
    }
    }

    this.onChange(this.value);
    this.onTouch();
  }



  get isInvalid(): boolean {
    return this.isSubmitted && !this.value;
  }
}
