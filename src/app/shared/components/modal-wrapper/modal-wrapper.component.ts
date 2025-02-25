import { Component, input, output } from '@angular/core';

@Component({
  selector: 'ModalWrapper',
  standalone: true,
  imports: [],
  templateUrl: './modal-wrapper.component.html',
  styleUrl: './modal-wrapper.component.css'
})
export class ModalWrapperComponent {
  readonly title = input.required<any>();
  readonly closeModal = output<void>();

  constructor(){}

  closeThisModal(): void {
    this.closeModal.emit();
  }

}
