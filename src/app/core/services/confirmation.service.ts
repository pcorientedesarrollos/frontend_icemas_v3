import { Injectable, inject } from '@angular/core';
import Swal, { SweetAlertIcon } from 'sweetalert2';

@Injectable({
    providedIn: 'root'
})
export class ConfirmationService {

    async confirm(options: {
        title?: string;
        text?: string;
        icon?: SweetAlertIcon;
        confirmButtonText?: string;
        cancelButtonText?: string;
        confirmButtonColor?: string;
        cancelButtonColor?: string;
    } = {}): Promise<boolean> {
        const defaultOptions = {
            title: '¿Estás seguro?',
            text: 'Esta acción no se puede deshacer',
            icon: 'warning' as SweetAlertIcon,
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#dc2626', // red-600
            cancelButtonColor: '#6b7280', // gray-500
            reverseButtons: true,
            heightAuto: false
        };

        const finalOptions = { ...defaultOptions, ...options };

        const result = await Swal.fire(finalOptions);
        return result.isConfirmed;
    }
}
