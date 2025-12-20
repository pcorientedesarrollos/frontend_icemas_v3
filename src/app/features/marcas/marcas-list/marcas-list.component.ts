import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MarcasService, Marca } from '../marcas.service';
import { CatalogTableComponent, CatalogTableColumn, CatalogTableAction } from '../../../shared/components/catalog-table/catalog-table.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
    selector: 'app-marcas-list',
    standalone: true,
    imports: [CommonModule, CatalogTableComponent, ModalComponent],
    templateUrl: './marcas-list.component.html',
    styleUrl: './marcas-list.component.css'
})
export class MarcasListComponent implements OnInit {
    private marcasService = inject(MarcasService);
    private router = inject(Router);
    private notificationService = inject(NotificationService);

    marcas = signal<Marca[]>([]);
    loading = signal(true);
    showDeleteModal = signal(false);
    selectedMarca = signal<Marca | null>(null);

    columns: CatalogTableColumn[] = [
        { key: 'idMarca', label: 'ID', sortable: true, width: 'w-1 whitespace-nowrap' },
        { key: 'descripcion', label: 'Nombre', sortable: true }
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
            onClick: (row) => this.openDeleteModal(row)
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

    openDeleteModal(marca: Marca): void {
        this.selectedMarca.set(marca);
        this.showDeleteModal.set(true);
    }

    confirmDelete(): void {
        const id = this.selectedMarca()?.idMarca;
        if (!id) return;

        this.marcasService.delete(id).subscribe({
            next: () => {
                this.notificationService.success('Marca eliminada correctamente');
                this.showDeleteModal.set(false);
                this.loadMarcas();
            },
            error: () => {
                this.notificationService.error('Error al eliminar marca');
                this.showDeleteModal.set(false);
            }
        });
    }
}
