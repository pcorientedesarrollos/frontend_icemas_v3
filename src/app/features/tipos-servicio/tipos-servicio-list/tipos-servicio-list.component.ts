import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TiposServicioService, TipoServicio } from '../tipos-servicio.service';
import { CatalogTableComponent, CatalogTableColumn, CatalogTableAction } from '../../../shared/components/catalog-table/catalog-table.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
    selector: 'app-tipos-servicio-list',
    standalone: true,
    imports: [CommonModule, CatalogTableComponent, ModalComponent],
    templateUrl: './tipos-servicio-list.component.html',
    styleUrl: './tipos-servicio-list.component.css'
})
export class TiposServicioListComponent implements OnInit {
    private tiposService = inject(TiposServicioService);
    private router = inject(Router);
    private notificationService = inject(NotificationService);

    tipos = signal<TipoServicio[]>([]);
    loading = signal(true);
    showDeleteModal = signal(false);
    selectedTipo = signal<TipoServicio | null>(null);

    columns: CatalogTableColumn[] = [
        { key: 'idTipoServicio', label: 'ID', sortable: true, width: 'w-1 whitespace-nowrap' },
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
            onClick: (row) => this.openDeleteModal(row)
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

    openDeleteModal(tipo: TipoServicio): void {
        this.selectedTipo.set(tipo);
        this.showDeleteModal.set(true);
    }

    confirmDelete(): void {
        const id = this.selectedTipo()?.idTipoServicio;
        if (!id) return;

        this.tiposService.delete(id).subscribe({
            next: () => {
                this.notificationService.success('Tipo de servicio eliminado correctamente');
                this.showDeleteModal.set(false);
                this.loadTipos();
            },
            error: () => {
                this.notificationService.error('Error al eliminar tipo de servicio');
                this.showDeleteModal.set(false);
            }
        });
    }
}
