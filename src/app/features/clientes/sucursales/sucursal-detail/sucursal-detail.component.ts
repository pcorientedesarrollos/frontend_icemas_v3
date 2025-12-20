import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { SucursalesService } from '../sucursales.service';
import { DataTableComponent, DataTableColumn, DataTableAction } from '../../../../shared/components/data-table/data-table.component';
import { NotificationService } from '../../../../core/services/notification.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-sucursal-detail',
    standalone: true,
    imports: [CommonModule, DataTableComponent],
    templateUrl: './sucursal-detail.component.html',
    styleUrl: './sucursal-detail.component.css',
})
export class SucursalDetailComponent implements OnInit {
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private sucursalesService = inject(SucursalesService);
    private notificationService = inject(NotificationService);
    private destroyRef = inject(DestroyRef);
    private location = inject(Location);

    sucursal = signal<any>(null);
    equipos = signal<any[]>([]);
    servicios = signal<any[]>([]);
    loading = signal(true);
    loadingEquipos = signal(false);
    loadingServicios = signal(false);
    sucursalId: number | null = null;

    // Tab control
    activeTab = signal<'equipos' | 'servicios'>('equipos');

    equiposColumns: DataTableColumn[] = [
        { key: 'idEquipo', label: 'ID', sortable: true },
        { key: 'nombre', label: 'Nombre', sortable: true },
        { key: 'marca.nombre', label: 'Marca', sortable: false },
        { key: 'tipoEquipo.nombre', label: 'Tipo', sortable: false },
        { key: 'serie', label: 'Serie', sortable: false, hideOnMobile: true },
        {
            key: 'estado',
            label: 'Estado',
            sortable: true,
            type: 'badge',
            format: (value: number) => value === 1 ? 'Activo' : 'Inactivo'
        },
    ];

    equiposActions: DataTableAction[] = [
        {
            label: 'Ver',
            color: 'primary',
            onClick: (row) => this.router.navigate(['/equipos', row.idEquipo])
        },
        {
            label: 'Editar',
            color: 'success',
            onClick: (row) => this.router.navigate(['/equipos', row.idEquipo, 'editar'])
        }
    ];

    serviciosColumns: DataTableColumn[] = [
        { key: 'idServicio', label: 'ID', sortable: true },
        { key: 'folio', label: 'Folio', sortable: true },
        { key: 'fechaServicio', label: 'Fecha', sortable: true, format: (value: any) => new Date(value).toLocaleDateString('es-MX') },
        { key: 'equipo.nombre', label: 'Equipo', sortable: false },
        { key: 'tipoServicio.nombre', label: 'Tipo', sortable: false, hideOnMobile: true },
        { key: 'tecnico.nombre', label: 'Técnico', sortable: false, hideOnMobile: true },
        {
            key: 'estado',
            label: 'Estado',
            sortable: true,
            format: (value: string) => {
                const badges: Record<string, string> = {
                    'Pendiente': '<span class="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Pendiente</span>',
                    'En Proceso': '<span class="px-2 py-1 text-xs font-medium rounded-full bg-primary-100 text-primary-800">En Proceso</span>',
                    'Completado': '<span class="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Completado</span>',
                    'Cancelado': '<span class="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Cancelado</span>'
                };
                return badges[value] || value;
            }
        },
    ];

    serviciosActions: DataTableAction[] = [
        {
            label: 'Ver',
            color: 'primary',
            onClick: (row) => this.router.navigate(['/servicios', row.idServicio])
        }
    ];

    ngOnInit(): void {
        const id = this.route.snapshot.params['id'];
        if (id) {
            this.sucursalId = +id;
            this.loadSucursal(this.sucursalId);
            this.loadEquipos(this.sucursalId);
            this.loadServicios(this.sucursalId);
        }
    }

    loadSucursal(id: number): void {
        this.loading.set(true);
        this.sucursalesService.getOne(id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (data: any) => {
                    this.sucursal.set(data);
                    this.loading.set(false);
                },
                error: () => {
                    this.notificationService.error('Error al cargar la sucursal');
                    this.router.navigate(['/sucursales']);
                }
            });
    }

    loadEquipos(id: number): void {
        this.loadingEquipos.set(true);
        this.sucursalesService.getEquipos(id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (data: any) => {
                    this.equipos.set(data);
                    this.loadingEquipos.set(false);
                },
                error: () => {
                    this.notificationService.error('Error al cargar equipos');
                    this.loadingEquipos.set(false);
                }
            });
    }

    loadServicios(id: number): void {
        this.loadingServicios.set(true);
        this.sucursalesService.getServicios(id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (data: any) => {
                    this.servicios.set(data);
                    this.loadingServicios.set(false);
                },
                error: () => {
                    this.notificationService.error('Error al cargar servicios');
                    this.loadingServicios.set(false);
                }
            });
    }

    setActiveTab(tab: 'equipos' | 'servicios'): void {
        this.activeTab.set(tab);
    }

    getCountByEstado(estado: string): number {
        return this.servicios().filter((s: any) => s.estado === estado).length;
    }

    navigateToEdit(): void {
        this.router.navigate(['/sucursales', this.sucursalId, 'editar']);
    }

    navigateToNewEquipo(): void {
        this.router.navigate(['/equipos/nuevo'], { queryParams: { sucursalId: this.sucursalId } });
    }

    navigateToNewServicio(): void {
        this.router.navigate(['/servicios/nuevo'], { queryParams: { sucursalId: this.sucursalId } });
    }

    navigateBack(): void {
        // Navigate to cliente detail if we have cliente info
        const clienteId = this.sucursal()?.cliente?.idCliente;
        if (clienteId) {
            this.router.navigate(['/clientes', clienteId]);
        } else {
            this.router.navigate(['/sucursales']);
        }
    }
}
