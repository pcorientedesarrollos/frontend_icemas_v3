import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'fit';
export type ModalType = 'info' | 'success' | 'warning' | 'danger';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen()) {
      <!-- Backdrop -->
      <div 
        class="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300"
        (click)="closeOnBackdrop() ? close() : null"
      ></div>

      <!-- Modal -->
      <div class="fixed inset-0 z-50 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4">
          <div 
            [class]="modalClasses()"
            class="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all"
          >
            <!-- Header -->
            @if (title() || showCloseButton()) {
              <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div class="flex items-center gap-3">
                  @if (type()) {
                    <div [class]="iconWrapperClass()">
                      <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="getIconPath()" />
                      </svg>
                    </div>
                  }
                  <h3 class="text-lg font-semibold text-gray-900">{{ title() }}</h3>
                </div>
                @if (showCloseButton()) {
                  <button
                    (click)="close()"
                    class="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                }
              </div>
            }

            <!-- Body -->
            <div class="px-6 py-4">
              <ng-content></ng-content>
            </div>

            <!-- Footer -->
            @if (showFooter()) {
              <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3 justify-end">
                @if (showCancelButton()) {
                  <button
                    (click)="onCancel()"
                    class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                  >
                    {{ cancelButtonText() }}
                  </button>
                }
                @if (showConfirmButton()) {
                  <button
                    (click)="onConfirm()"
                    [disabled]="confirmDisabled()"
                    [class]="confirmButtonClass()"
                    class="flex items-center gap-2"
                  >
                    @if (confirmDisabled()) {
                      <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    }
                    <span>{{ confirmButtonText() }}</span>
                  </button>
                }
              </div>
            }
          </div>
        </div>
      </div>
    }
  `
})
export class ModalComponent {
  // Inputs
  isOpen = input<boolean>(false);
  title = input<string>('');
  size = input<ModalSize>('md');
  type = input<ModalType | undefined>(undefined);

  showCloseButton = input<boolean>(true);
  showFooter = input<boolean>(true);
  showCancelButton = input<boolean>(true);
  showConfirmButton = input<boolean>(true);

  cancelButtonText = input<string>('Cancelar');
  confirmButtonText = input<string>('Confirmar');
  confirmDisabled = input<boolean>(false);
  closeOnBackdrop = input<boolean>(true);

  // Outputs
  closed = output<void>();
  confirmed = output<void>();
  cancelled = output<void>();

  modalClasses(): string {
    const sizeClasses = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl',
      '2xl': 'max-w-6xl',
      fit: 'w-fit max-w-[90vw]'
    };

    // For 'fit', we don't want w-full forcing expansion, but for others we do (to fill the max-w container)
    const widthClass = this.size() === 'fit' ? '' : 'w-full';

    return `${widthClass} ${sizeClasses[this.size()]}`;
  }

  iconWrapperClass(): string {
    const classes = {
      info: 'bg-primary-500',
      success: 'bg-green-500',
      warning: 'bg-yellow-500',
      danger: 'bg-red-500'
    };
    return `w-10 h-10 rounded-full flex items-center justify-center ${classes[this.type()!]}`;
  }

  confirmButtonClass(): string {
    const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

    if (this.type() === 'danger') {
      return `${baseClasses} bg-red-600 text-white hover:bg-red-700`;
    }
    if (this.type() === 'warning') {
      return `${baseClasses} bg-yellow-600 text-white hover:bg-yellow-700`;
    }
    if (this.type() === 'success') {
      return `${baseClasses} bg-green-600 text-white hover:bg-green-700`;
    }
    return `${baseClasses} bg-primary-600 text-white hover:bg-primary-700`;
  }

  getIconPath(): string {
    const icons = {
      info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      success: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
      danger: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    };
    return icons[this.type()!] || icons.info;
  }

  close(): void {
    this.closed.emit();
  }

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
    this.close();
  }
}
