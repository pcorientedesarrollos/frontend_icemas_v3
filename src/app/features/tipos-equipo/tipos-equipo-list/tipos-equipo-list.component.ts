import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TiposEquipoService, TipoEquipo } from '../tipos-equipo.service';
import { CatalogTableComponent, CatalogTableColumn, CatalogTableAction } from '../../../shared/components/catalog-table/catalog-table.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
    selector: 'app-tipos-equipo-list',
    standalone: true,
    imports: [CommonModule, CatalogTableComponent, ModalComponent],
    templateUrl: './tipos-equipo-list.component.html',
    styleUrl: './tipos-equipo-list.component.css'
})
export class TiposEquipoListComponent implements OnInit {
    private tiposService = inject(TiposEquipoService);
    private router = inject(Router);
    private notificationService = inject(NotificationService);

    tipos = signal<TipoEquipo[]>([]);
    loading = signal(true);
    showDeleteModal = signal(false);
    selectedTipo = signal<TipoEquipo | null>(null);

    columns: CatalogTableColumn[] = [
        { key: 'idTipo', label: 'ID', sortable: true, width: 'w-1 whitespace-nowrap' },
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
                this.notificationService.error('Error al cargar tipos de equipo');
                this.loading.set(false);
            }
        });
    }

    navigateToNew(): void {
        this.router.navigate(['/catalogos/tipos-equipo/nuevo']);
    }

    openDeleteModal(tipo: TipoEquipo): void {
        this.selectedTipo.set(tipo);
        this.showDeleteModal.set(true);
    }

    confirmDelete(): void {
        const id = this.selectedTipo()?.idTipo;
        if (!id) return;

        this.tiposService.delete(id).subscribe({
            next: () => {
                this.notificationService.success('Tipo de equipo eliminado correctamente');
                this.showDeleteModal.set(false);
                this.loadTipos();
            },
            error: () => {
                this.notificationService.error('Error al eliminar tipo de equipo');
                this.showDeleteModal.set(false);
            }
        });
    }
}
