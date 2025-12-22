import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
import { UserRole } from '../../core/enums/user-role.enum';
import { UsersListComponent } from './users/users-list/users-list.component';
import { UserFormComponent } from './users/user-form/user-form.component';

export const SETTINGS_ROUTES: Routes = [
    {
        path: '',
        redirectTo: 'usuarios',
        pathMatch: 'full'
    },
    {
        path: 'usuarios',
        canActivate: [roleGuard([UserRole.ADMINISTRADOR])],
        children: [
            {
                path: '',
                component: UsersListComponent
            },
            {
                path: 'nuevo',
                component: UserFormComponent
            },
            {
                path: ':id/editar',
                component: UserFormComponent
            }
        ]
    }
];
