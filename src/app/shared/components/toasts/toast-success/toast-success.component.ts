import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-toast-success',
  imports: [],
  templateUrl: './toast-success.component.html',
  styleUrl: './toast-success.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastSuccessComponent {
  readonly title = input('');

}
