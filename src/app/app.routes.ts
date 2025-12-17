import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { LoginComponent } from './features/auth/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';

export const routes: Routes = [
    {
        path: 'login',
        component: LoginComponent
    },
    {
        path: '',
        component: MainLayoutComponent,
        canActivate: [authGuard],
        children: [
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            },
            {
                path: 'dashboard',
                component: DashboardComponent
            },
            {
                path: 'clientes',
                loadChildren: () => import('./features/clientes/clientes.routes').then(m => m.CLIENTES_ROUTES)
            },
            {
                path: 'equipos',
                loadChildren: () => import('./features/equipos/equipos.routes').then(m => m.EQUIPOS_ROUTES)
            },
            {
                path: 'servicios',
                loadChildren: () => import('./features/servicios/servicios.routes').then(m => m.SERVICIOS_ROUTES)
            },
            {
                path: 'tecnicos',
                loadChildren: () => import('./features/tecnicos/tecnicos.routes').then(m => m.TECNICOS_ROUTES)
            },
            {
                path: 'reportes',
                loadChildren: () => import('./features/reportes/reportes.routes').then(m => m.REPORTES_ROUTES)
            }
        ]
    },
    {
        path: '**',
        redirectTo: 'dashboard'
    }
];
