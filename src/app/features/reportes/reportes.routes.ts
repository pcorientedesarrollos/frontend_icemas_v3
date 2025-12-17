import { Routes } from '@angular/router';

export const REPORTES_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./reportes-selector/reportes-selector.component').then(m => m.ReportesSelectorComponent)
    }
];
