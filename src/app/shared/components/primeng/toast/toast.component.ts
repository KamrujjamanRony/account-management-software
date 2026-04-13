import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-toast',
  imports: [ToastModule],
  template: `<p-toast></p-toast>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastComponent { }
