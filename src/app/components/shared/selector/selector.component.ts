import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, signal, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AllSvgComponent } from "../svg/all-svg/all-svg.component";

@Component({
  selector: 'selector',
  imports: [CommonModule, FormsModule, AllSvgComponent],
  templateUrl: './selector.component.html',
  styleUrl: './selector.component.css'
})
export class SelectorComponent {
  @Input() placeholder: string = 'Select an option';
  @Input() options: any[] = [];
  @Input() selectedId: any = null; // Preselected ID from the parent
  @Output() selectionChange = new EventEmitter<any>();

  inputValue: string = '';
  selected = signal<any>('');
  open: boolean = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (this.selectedId === "") {
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
