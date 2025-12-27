import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { SucursalesService } from '../sucursales.service';
import { DataTableComponent, DataTableColumn, DataTableAction } from '../../../../shared/components/data-table/data-table.component';
import { NotificationService } from '../../../../core/services/notification.service';
import { ConfirmationService } from '../../../../core/services/confirmation.service';

@Component({
    selector: 'app-sucursales-list',
    standalone: true,
    imports: [CommonModule, DataTableComponent],
    templateUrl: './sucursales-list.component.html',
    styleUrl: './sucursales-list.component.css',
})
export class SucursalesListComponent {
    private sucursalesService = inject(SucursalesService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private notificationService = inject(NotificationService);
    private confirmationService = inject(ConfirmationService);

    sucursales = signal<any[]>([]);
    loading = signal(true);
    clienteId = signal<number | null>(null);

    columns: DataTableColumn[] = [
        { key: 'nombre', label: 'Nombre', sortable: true },
        { key: 'direccion', label: 'Dirección', sortable: false, hideOnMobile: true },
        { key: 'telefono', label: 'Teléfono', sortable: false, hideOnMobile: true },
        { key: 'contacto', label: 'Contacto', sortable: false, hideOnMobile: true },
    ];

    actions: DataTableAction[] = [
        {
            label: 'Ver',
            color: 'primary',
            onClick: (row) => this.router.navigate(['/sucursales', row.idSucursal])
        },
        {
            label: 'Editar',
            color: 'success',
            onClick: (row) => this.router.navigate(['/sucursales', row.idSucursal, 'editar'])
        },
        {
            label: 'Eliminar',
            color: 'danger',
            onClick: (row) => this.confirmDelete(row)
        }
    ];

    ngOnInit(): void {
        // Check if we're filtering by cliente via query params or parent route params
        const queryClienteId = this.route.snapshot.queryParams['clienteId'];
        const routeClienteId = this.route.parent?.snapshot.paramMap.get('id');

        if (queryClienteId) {
            this.clienteId.set(+queryClienteId);
        } else if (routeClienteId) {
            this.clienteId.set(+routeClienteId);
        }

        this.loadSucursales();
    }

    loadSucursales(): void {
        this.loading.set(true);
        const idCliente = this.clienteId();

        this.sucursalesService.getAll(idCliente || undefined).subscribe({
            next: (data) => {
                this.sucursales.set(data);
                this.loading.set(false);
            },
            error: (error) => {
                this.notificationService.error('Error al cargar sucursales');
                this.loading.set(false);
            }
        });
    }

    navigateToNew(): void {
        const clienteId = this.clienteId();
        if (clienteId) {
            this.router.navigate(['/sucursales/nuevo'], { queryParams: { clienteId } });
        } else {
            this.router.navigate(['/sucursales/nuevo']);
        }
    }

    confirmDelete(sucursal: any): void {
        this.confirmationService.confirm({
            title: '¿Eliminar sucursal?',
            text: `¿Estás seguro que deseas eliminar la sucursal "${sucursal.nombre}"? Esta acción no se puede deshacer.`,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result) {
                this.sucursalesService.delete(sucursal.idSucursal).subscribe({
                    next: () => {
                        this.notificationService.success('Sucursal eliminada correctamente');
                        this.loadSucursales();
                    },
                    error: (error) => {
                        this.notificationService.error('Error al eliminar sucursal');
                    }
                });
            }
        });
    }
    goBack(): void {
        this.router.navigate(['/clientes']);
    }
}
