import { Component, input } from '@angular/core';

@Component({
  selector: 'app-toast-success',
  standalone: true,
  imports: [],
  templateUrl: './toast-success.component.html',
  styleUrl: './toast-success.component.css'
})
export class ToastSuccessComponent {
  readonly title = input('');

}
