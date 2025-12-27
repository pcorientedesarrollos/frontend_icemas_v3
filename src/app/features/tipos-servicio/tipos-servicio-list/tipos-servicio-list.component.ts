import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TiposServicioService, TipoServicio } from '../tipos-servicio.service';
import { CatalogTableComponent, CatalogTableColumn, CatalogTableAction } from '../../../shared/components/catalog-table/catalog-table.component';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';

@Component({
    selector: 'app-tipos-servicio-list',
    standalone: true,
    imports: [CommonModule, CatalogTableComponent],
    templateUrl: './tipos-servicio-list.component.html',
    styleUrl: './tipos-servicio-list.component.css'
})
export class TiposServicioListComponent implements OnInit {
    private tiposService = inject(TiposServicioService);
    private router = inject(Router);
    private notificationService = inject(NotificationService);
    private confirmationService = inject(ConfirmationService);

    tipos = signal<TipoServicio[]>([]);
    loading = signal(true);

    columns: CatalogTableColumn[] = [
        { key: 'nombre', label: 'Nombre', sortable: true },
    ];

    actions: CatalogTableAction[] = [
        {
            label: 'Editar',
            color: 'success',
            onClick: (row) => this.router.navigate(['/catalogos/tipos-servicio', row.idTipoServicio, 'editar'])
        },
        {
            label: 'Eliminar',
            color: 'danger',
            onClick: (row) => this.confirmDelete(row)
        }
    ];

    ngOnInit(): void {
        this.loadTipos();
    }

    loadTipos(): void {
        this.loading.set(true);
        this.tiposService.getAll().subscribe({
            next: (data) => {
                this.tipos.set(data);
                this.loading.set(false);
            },
            error: () => {
                this.notificationService.error('Error al cargar tipos de servicio');
                this.loading.set(false);
            }
        });
    }

    navigateToNew(): void {
        this.router.navigate(['/catalogos/tipos-servicio/nuevo']);
    }

    confirmDelete(tipo: TipoServicio): void {
        this.confirmationService.confirm({
            title: '¿Eliminar tipo de servicio?',
            text: `¿Estás seguro que deseas eliminar el tipo "${tipo.nombre}"? Esta acción no se puede deshacer.`,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result) {
                this.tiposService.delete(tipo.idTipoServicio).subscribe({
                    next: () => {
                        this.notificationService.success('Tipo de servicio eliminado correctamente');
                        this.loadTipos();
                    },
                    error: (err) => {
                        this.notificationService.error(err.message || 'Error al eliminar tipo de servicio');
                    }
                });
            }
        });
    }
}
