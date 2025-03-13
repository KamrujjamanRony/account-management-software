import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MultiSelectModule } from 'primeng/multiselect';

@Component({
    selector: 'app-multi-select',
    standalone: true,
    imports: [FormsModule, MultiSelectModule],
    template: `
      <p-multiselect 
        [options]="options" 
        [(ngModel)]="selectedOptions" 
        optionLabel="name" 
        placeholder="Select Options" 
        [maxSelectedLabels]="3" 
        styleClass="block !py-2.5 !px-0 !w-full !text-sm !text-gray-900 !bg-transparent !border-0 !border-b-2 !border-gray-300 !appearance-none !focus:outline-none !focus:ring-0 !focus:border-teal-600 !peer !rounded-none">
      </p-multiselect>
  `,
})
export class MultiSelectComponent {
    @Input() options: any[] = [];  // Receive options dynamically from parent
    selectedOptions: any[] = [];
}
