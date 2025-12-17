import { Routes } from '@angular/router';

export const SERVICIOS_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./servicios-list/servicios-list.component').then(m => m.ServiciosListComponent)
    },
    {
        path: 'nuevo',
        loadComponent: () => import('./servicio-form/servicio-form.component').then(m => m.ServicioFormComponent)
    },
    {
        path: ':id',
        loadComponent: () => import('./servicio-detail/servicio-detail.component').then(m => m.ServicioDetailComponent)
    },
    {
        path: ':id/editar',
        loadComponent: () => import('./servicio-form/servicio-form.component').then(m => m.ServicioFormComponent)
    }
];
