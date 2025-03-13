import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root', // Available everywhere without needing to import in providers
})
export class ToastService {
  private messageService = inject(MessageService);

  showMessage(severity: 'success' | 'info' | 'warn' | 'error' | 'secondary' | 'contrast', summary: string, detail: string) {
    this.messageService.add({ severity, summary, detail });
  }
}
