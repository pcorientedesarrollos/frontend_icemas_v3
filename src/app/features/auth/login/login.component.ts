import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div class="max-w-md w-full">
        <!-- Logo & Title -->
        <div class="text-center mb-8">
          <div class="inline-block p-3 bg-primary-600 rounded-full mb-4">
            <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 class="text-3xl font-bold text-gray-900">ICEMAS</h1>
          <p class="text-gray-600 mt-2">Sistema de Gestión de Servicios</p>
        </div>

        <!-- Login Card -->
        <div class="bg-white rounded-2xl shadow-xl p-8">
          <h2 class="text-2xl font-semibold text-gray-800 mb-6">Iniciar Sesión</h2>

          <form (ngSubmit)="onSubmit()" #loginForm="ngForm">
            <!-- Email -->
            <div class="mb-5">
              <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <input
                type="email"
                id="email"
                name="email"
                [(ngModel)]="credentials().email"
                required
                email
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                placeholder="usuario@ejemplo.com"
                [disabled]="loading()"
              />
            </div>

            <!-- Password -->
            <div class="mb-6">
              <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <input
                [type]="showPassword() ? 'text' : 'password'"
                id="password"
                name="password"
                [(ngModel)]="credentials().password"
                required
                minlength="6"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
                [disabled]="loading()"
              />
              <button
                type="button"
                (click)="togglePassword()"
                class="text-sm text-primary-600 hover:text-primary-700 mt-2 focus:outline-none"
              >
                {{ showPassword() ? 'Ocultar' : 'Mostrar' }} contraseña
              </button>
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              [disabled]="!loginForm.form.valid || loading()"
              class="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              @if (loading()) {
                <span class="flex items-center justify-center">
                  <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Iniciando sesión...
                </span>
              } @else {
                Iniciar Sesión
              }
            </button>
          </form>

          <!-- Register Link -->
          <div class="mt-6 text-center">
            <p class="text-sm text-gray-600">
              ¿No tienes cuenta?
              <a routerLink="/register" class="text-primary-600 hover:text-primary-700 font-medium">
                Regístrate aquí
              </a>
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div class="text-center mt-6 text-sm text-gray-500">
          © 2024 ICEMAS. Todos los derechos reservados.
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
    private authService = inject(AuthService);
    private router = inject(Router);
    private notificationService = inject(NotificationService);

    credentials = signal({
        email: '',
        password: ''
    });

    loading = signal(false);
    showPassword = signal(false);

    togglePassword(): void {
        this.showPassword.update(value => !value);
    }

    onSubmit(): void {
        if (this.loading()) return;

        this.loading.set(true);

        this.authService.login(this.credentials()).subscribe({
            next: () => {
                this.notificationService.success('¡Bienvenido a ICEMAS!');
                this.router.navigate(['/dashboard']);
            },
            error: (error) => {
                this.loading.set(false);
                this.notificationService.error(
                    error.message || 'Error al iniciar sesión. Verifica tus credenciales.'
                );
            },
            complete: () => {
                this.loading.set(false);
            }
        });
    }
}
