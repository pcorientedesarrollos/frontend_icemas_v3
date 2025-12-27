import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TiposEquipoService, TipoEquipo } from '../tipos-equipo.service';
import { CatalogTableComponent, CatalogTableColumn, CatalogTableAction } from '../../../shared/components/catalog-table/catalog-table.component';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';

@Component({
    selector: 'app-tipos-equipo-list',
    standalone: true,
    imports: [CommonModule, CatalogTableComponent],
    templateUrl: './tipos-equipo-list.component.html',
    styleUrl: './tipos-equipo-list.component.css'
})
export class TiposEquipoListComponent implements OnInit {
    private tiposService = inject(TiposEquipoService);
    private router = inject(Router);
    private notificationService = inject(NotificationService);
    private confirmationService = inject(ConfirmationService);

    tipos = signal<TipoEquipo[]>([]);
    loading = signal(true);

    columns: CatalogTableColumn[] = [
        { key: 'nombre', label: 'Nombre', sortable: true },
        { key: 'descripcion', label: 'Descripción', sortable: false }
    ];

    actions: CatalogTableAction[] = [
        {
            label: 'Editar',
            color: 'success',
            onClick: (row) => this.router.navigate(['/catalogos/tipos-equipo', row.idTipo, 'editar'])
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
                this.notificationService.error('Error al cargar tipos de equipo');
                this.loading.set(false);
            }
        });
    }

    navigateToNew(): void {
        this.router.navigate(['/catalogos/tipos-equipo/nuevo']);
    }

    confirmDelete(tipo: TipoEquipo): void {
        this.confirmationService.confirm({
            title: '¿Eliminar tipo de equipo?',
            text: `¿Estás seguro que deseas eliminar el tipo "${tipo.nombre}"? Esta acción no se puede deshacer.`,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result) {
                this.tiposService.delete(tipo.idTipo).subscribe({
                    next: () => {
                        this.notificationService.success('Tipo de equipo eliminado correctamente');
                        this.loadTipos();
                    },
                    error: (err) => {
                        this.notificationService.error(err.message || 'Error al eliminar tipo de equipo');
                    }
                });
            }
        });
    }
}
