import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UsersService, User } from '../users.service';
import { DataTableComponent, DataTableColumn, DataTableAction } from '../../../../shared/components/data-table/data-table.component';
import { NotificationService } from '../../../../core/services/notification.service';
import { UserRole } from '../../../../core/enums/user-role.enum';
import { ConfirmationService } from '../../../../core/services/confirmation.service';

@Component({
    selector: 'app-users-list',
    standalone: true,
    imports: [CommonModule, DataTableComponent],
    templateUrl: './users-list.component.html',
    styleUrl: './users-list.component.css'
})
export class UsersListComponent {
    private usersService = inject(UsersService);
    private router = inject(Router);
    private notificationService = inject(NotificationService);
    private confirmationService = inject(ConfirmationService);

    users = signal<User[]>([]);
    loading = signal(true);

    columns: DataTableColumn[] = [
        { key: 'name', label: 'Nombre', sortable: true },
        { key: 'email', label: 'Email', sortable: true },
        {
            key: 'role',
            label: 'Rol',
            sortable: true,
            width: 'w-32',
            format: (val) => val === UserRole.ADMINISTRADOR ? 'Administrador' : 'Técnico'
        },
        {
            key: 'createdAt',
            label: 'Creado',
            sortable: true,
            width: 'w-36',
            hideOnMobile: true,
            format: (val) => new Date(val).toLocaleDateString('es-MX')
        }
    ];

    actions: DataTableAction[] = [
        {
            label: 'Editar',
            color: 'success',
            onClick: (row) => this.router.navigate(['/ajustes/usuarios', row.id, 'editar'])
        },
        {
            label: 'Eliminar',
            color: 'danger',
            onClick: (row) => this.confirmDelete(row)
        }
    ];

    ngOnInit(): void {
        this.loadUsers();
    }

    loadUsers(): void {
        this.loading.set(true);
        this.usersService.getAll().subscribe({
            next: (data) => {
                this.users.set(data);
                this.loading.set(false);
            },
            error: (error) => {
                this.notificationService.error('Error al cargar usuarios');
                this.loading.set(false);
            }
        });
    }

    navigateToNew(): void {
        this.router.navigate(['/ajustes/usuarios/nuevo']);
    }

    confirmDelete(user: User): void {
        this.confirmationService.confirm({
            title: '¿Eliminar usuario?',
            text: `¿Estás seguro que deseas eliminar el usuario "${user.name}"? Esta acción no se puede deshacer.`,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result) {
                this.usersService.delete(user.id).subscribe({
                    next: () => {
                        this.notificationService.success('Usuario eliminado correctamente');
                        this.loadUsers();
                    },
                    error: (error) => {
                        this.notificationService.error('Error al eliminar usuario');
                    }
                });
            }
        });
    }
}
