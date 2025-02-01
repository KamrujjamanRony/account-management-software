import { Component, input } from '@angular/core';

@Component({
  selector: 'Field',
  standalone: true,
  imports: [],
  templateUrl: './field.component.html',
  styleUrl: './field.component.css'
})
export class FieldComponent {
  readonly label = input<string>('');
  readonly isInvalid = input<boolean>(false);

}
