import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'ModalWrapper',
  imports: [],
  templateUrl: './modal-wrapper.component.html',
  styleUrl: './modal-wrapper.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalWrapperComponent {
  readonly title = input.required<any>();
  readonly closeModal = output<void>();

  constructor(){}

  closeThisModal(): void {
    this.closeModal.emit();
  }

}
