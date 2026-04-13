import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { LoginService } from '../../services/login.service';
import { form, required, FormField } from '@angular/forms/signals';
import { ToastService } from '../../../utils/toast/toast.service';
import { Router } from '@angular/router';
import { DataService } from '../../../shared/services/data.service';

@Component({
  selector: 'app-login',
  imports: [FormField],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private authService = inject(AuthService);
  private loginService = inject(LoginService);
  private toast = inject(ToastService);
  private dataService = inject(DataService);
  private router = inject(Router);

  isSubmitted = signal(false);
  loading = signal(false);
  name = signal('');

  model = signal({
    userName: '',
    password: '',
  });

  form = form(this.model, (schemaPath) => {
    required(schemaPath.userName, { message: 'Username is required' });
    required(schemaPath.password, { message: 'Password is required' });
  });

  ngOnInit() {
    this.dataService.getHeader().subscribe((data) => {
      this.name.set(data?.name || 'Hospital Management System');
    });
  }

  onSubmit(event: Event) {
    event.preventDefault();

    if (!this.form().valid()) {
      this.toast.warning('Form is invalid! Please fill all required fields.', 'bottom-right', 5000);
      return;
    }

    this.isSubmitted.set(true);
    this.loading.set(true);

    this.loginService.login(this.form().value()).subscribe({
      next: (response: any) => {
        this.authService.setUser(response);
        this.toast.success('User Login Successfully!', 'bottom-right', 5000);
        this.loading.set(false);
        this.form().reset();
        this.router.navigate(['/home']);
      },
      error: (error) => {
        console.error('Error login user:', error);
        if (error.error?.message || error.error?.title) {
          this.toast.danger(`${error.error.status} : ${error.error.message || error.error.title}`, 'bottom-right', 5000);
        }
        this.loading.set(false);
        this.isSubmitted.set(false);
      },
    });
  }
}
