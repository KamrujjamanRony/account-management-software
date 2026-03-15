import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-asset-view-modal',
  imports: [CommonModule],
  templateUrl: './asset-view-modal.component.html',
  styleUrl: './asset-view-modal.component.css'
})
export class AssetViewModalComponent {
  @Input() asset: any = null;
  @Input() assetType: string = '';
  @Output() close = new EventEmitter<void>();

  closeModal() {
    this.close.emit();
  }

}
