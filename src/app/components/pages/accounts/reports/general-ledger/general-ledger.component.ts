import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectorComponent } from "../../../../shared/selector/selector.component";
import { FieldComponent } from "../../../../shared/field/field.component";

@Component({
  selector: 'app-general-ledger',
  imports: [FormsModule, CommonModule, SelectorComponent, FieldComponent],
  templateUrl: './general-ledger.component.html',
  styleUrl: './general-ledger.component.css'
})
export class GeneralLedgerComponent {
  countries = signal<any[]>([
    { id: 1, text: 'United States' },
    { id: 2, text: 'United Kingdom' },
    { id: 3, text: 'Canada' },
  ]);

  onHeadSelected(selected: any): void {
    console.log('Selected :', selected);
  }

}
