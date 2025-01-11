import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, signal, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AllSvgComponent } from '../svg/all-svg/all-svg.component';

@Component({
  selector: 'selector2',
  imports: [CommonModule, FormsModule, AllSvgComponent],
  templateUrl: './selector2.component.html',
  styleUrl: './selector2.component.css'
})
export class Selector2Component {
  @Input() placeholder: string = 'Select an option';
  @Input() options: any[] = [];
  @Input() selectedId: any = null; // Preselected ID from the parent
  @Output() selectionChange = new EventEmitter<any>();

  inputValue: string = '';
  selected = signal<any>('');
  open: boolean = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['options'] && Array.isArray(this.options)) {
      // Ensure the 'Select Account' option is added only once
      if (!this.options.some((option) => option.id === null)) {
        this.options = [{ id: null, text: 'All' }, ...this.options];
      }
    }

    if (this.selectedId === "" || this.selectedId === null || this.selectedId === undefined) {
      this.selected.set(null);
    }

    if (changes['selectedId'] && this.selectedId !== null) {
      this.setSelectedById(this.selectedId);
    }
  }

  toggleDropdown(): void {
    this.open = !this.open;
  }

  setSelectedById(id: number): void {
    const selectedOption = this.options.find(option => option.id == id);
    if (selectedOption) {
      this.selected.set(selectedOption);
      this.selectionChange.emit(this.selected());
    }
  }

  selectOption(option: any): void {
    if (this.selected()?.id !== option.id) {
      this.selected.set(option);
      this.open = false;
      this.inputValue = '';
      this.selectionChange.emit(this.selected());
    }
  }


}
