import { Injectable } from '@angular/core';
import Swal, { SweetAlertIcon } from 'sweetalert2';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {

    // Base configuration for Toasts
    private toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 4000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.onmouseenter = Swal.stopTimer;
            toast.onmouseleave = Swal.resumeTimer;
        },
        customClass: {
            popup: 'colored-toast'
        }
    });

    constructor() { }

    /**
     * Shows a success toast notification (Green light style)
     */
    success(message: string): void {
        this.toast.fire({
            icon: 'success',
            title: '¡Éxito!',
            text: message,
            background: '#ecfdf5', // green-50
            color: '#065f46',      // green-800
            iconColor: '#34d399'   // green-400
        });
    }

    /**
     * Shows an error toast notification (Red light style)
     */
    error(message: string): void {
        this.toast.fire({
            icon: 'error',
            title: 'Error',
            text: message,
            background: '#fef2f2', // red-50
            color: '#991b1b',      // red-800
            iconColor: '#f87171'   // red-400
        });
    }

    /**
     * Shows a warning toast notification (Yellow light style)
     */
    warning(message: string): void {
        this.toast.fire({
            icon: 'warning',
            title: 'Atención',
            text: message,
            background: '#fffbeb', // amber-50
            color: '#92400e',      // amber-800
            iconColor: '#fbbf24'   // amber-400
        });
    }

    /**
     * Shows an info toast notification (Blue light style)
     */
    info(message: string): void {
        this.toast.fire({
            icon: 'info',
            title: 'Información',
            text: message,
            background: '#eff6ff', // blue-50
            color: '#1e40af',      // blue-800
            iconColor: '#60a5fa'   // blue-400
        });
    }

    /**
     * Generic method to show a custom alert modal (Blocking)
     */
    alert(title: string, text: string, icon: SweetAlertIcon = 'info'): void {
        Swal.fire({
            title,
            text,
            icon,
            confirmButtonColor: '#002366', // Brand Blue
            confirmButtonText: 'Entendido'
        });
    }
}
