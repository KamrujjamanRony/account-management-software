import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { initFlowbite } from 'flowbite';
import { ToastComponent } from './shared/components/primeng/toast/toast.component';
import { Confirm } from "./utils/confirm/confirm";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent, Confirm],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('accounts');

  ngOnInit(): void {
    initFlowbite();
  }
}
