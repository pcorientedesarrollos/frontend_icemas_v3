import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MarcasService, Marca } from '../marcas.service';
import { CatalogTableComponent, CatalogTableColumn, CatalogTableAction } from '../../../shared/components/catalog-table/catalog-table.component';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';

@Component({
    selector: 'app-marcas-list',
    standalone: true,
    imports: [CommonModule, CatalogTableComponent],
    templateUrl: './marcas-list.component.html',
    styleUrl: './marcas-list.component.css'
})
export class MarcasListComponent implements OnInit {
    private marcasService = inject(MarcasService);
    private router = inject(Router);
    private notificationService = inject(NotificationService);
    private confirmationService = inject(ConfirmationService);

    marcas = signal<Marca[]>([]);
    loading = signal(true);

    columns: CatalogTableColumn[] = [
        { key: 'nombre', label: 'Nombre', sortable: true },
        { key: 'descripcion', label: 'Descripción', sortable: true }
    ];

    actions: CatalogTableAction[] = [
        {
            label: 'Editar',
            color: 'success',
            onClick: (row) => this.router.navigate(['/catalogos/marcas', row.idMarca, 'editar'])
        },
        {
            label: 'Eliminar',
            color: 'danger',
            onClick: (row) => this.confirmDelete(row)
        }
    ];

    ngOnInit(): void {
        this.loadMarcas();
    }

    loadMarcas(): void {
        this.loading.set(true);
        this.marcasService.getAll().subscribe({
            next: (data) => {
                this.marcas.set(data);
                this.loading.set(false);
            },
            error: () => {
                this.notificationService.error('Error al cargar marcas');
                this.loading.set(false);
            }
        });
    }

    navigateToNew(): void {
        this.router.navigate(['/catalogos/marcas/nuevo']);
    }

    confirmDelete(marca: Marca): void {
        this.confirmationService.confirm({
            title: '¿Eliminar marca?',
            text: `¿Estás seguro que deseas eliminar la marca "${marca.nombre}"? Esta acción no se puede deshacer.`,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result) {
                this.marcasService.delete(marca.idMarca).subscribe({
                    next: () => {
                        this.notificationService.success('Marca eliminada correctamente');
                        this.loadMarcas();
                    },
                    error: () => {
                        this.notificationService.error('Error al eliminar marca');
                    }
                });
            }
        });
    }
}
