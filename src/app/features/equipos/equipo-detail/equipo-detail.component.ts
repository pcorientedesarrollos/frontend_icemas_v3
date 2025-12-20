import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';

import { CommonModule, Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { EquiposService } from '../equipos.service';
import { DataTableComponent, DataTableColumn, DataTableAction } from '../../../shared/components/data-table/data-table.component';
import { NotificationService } from '../../../core/services/notification.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-equipo-detail',
    standalone: true,
    imports: [CommonModule, DataTableComponent],
    templateUrl: './equipo-detail.component.html',
    styleUrl: './equipo-detail.component.css',
})
export class EquipoDetailComponent implements OnInit {
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private equiposService = inject(EquiposService);
    private notificationService = inject(NotificationService);
    private location = inject(Location);
    private destroyRef = inject(DestroyRef);

    equipo = signal<any>(null);
    servicios = signal<any[]>([]);
    loading = signal(true);
    equipoId: number | null = null;

    serviciosColumns: DataTableColumn[] = [
        { key: 'idServicio', label: 'ID', sortable: true },
        { key: 'folio', label: 'Folio', sortable: true },
        { key: 'fechaServicio', label: 'Fecha', sortable: true, format: (value: any) => new Date(value).toLocaleDateString('es-MX') },
        { key: 'tipoServicio.nombre', label: 'Tipo', sortable: false },
        { key: 'tecnico.nombre', label: 'Técnico', sortable: false },
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
            this.equipoId = +id;
            this.loadEquipo(this.equipoId);
        }
    }

    loadEquipo(id: number): void {
        this.loading.set(true);
        this.equiposService.getOne(id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (data: any) => {
                    this.equipo.set(data);
                    // Load services separately to get relations and order
                    this.equiposService.getServicios(id)
                        .pipe(takeUntilDestroyed(this.destroyRef))
                        .subscribe(servicios => {
                            this.servicios.set(servicios);
                        });

                    this.loading.set(false);
                },
                error: () => {
                    this.notificationService.error('Error al cargar el equipo');
                    this.router.navigate(['/equipos']);
                }
            });
    }

    getCountByEstado(estado: string): number {
        return this.servicios().filter((s: any) => s.estado === estado).length;
    }

    getEstadoEquipo(): string {
        const eq = this.equipo();
        if (!eq) return '';
        return eq.estado === 1 || eq.estado === true ? 'Activo' : 'Inactivo';
    }

    navigateToEdit(): void {
        this.router.navigate(['/equipos', this.equipoId, 'editar']);
    }

    navigateToNewServicio(): void {
        this.router.navigate(['/servicios/nuevo'], { queryParams: { equipoId: this.equipoId } });
    }

    navigateBack(): void {
        this.location.back();
    }
}
