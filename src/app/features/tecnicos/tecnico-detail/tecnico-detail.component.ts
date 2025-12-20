import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { TecnicosService } from '../tecnicos.service';
import { DataTableComponent, DataTableColumn } from '../../../shared/components/data-table/data-table.component';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
    selector: 'app-tecnico-detail',
    standalone: true,
    imports: [CommonModule, DataTableComponent],
    templateUrl: './tecnico-detail.component.html',
    styleUrl: './tecnico-detail.component.css',
})
export class TecnicoDetailComponent implements OnInit {
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private tecnicosService = inject(TecnicosService);
    private notificationService = inject(NotificationService);
    private location = inject(Location);

    tecnico = signal<any>(null);
    servicios = signal<any[]>([]);
    loading = signal(true);
    loadingServicios = signal(false);
    tecnicoId: number | null = null;

    serviciosColumns: DataTableColumn[] = [
        { key: 'idServicio', label: 'ID', sortable: true },
        { key: 'folio', label: 'Folio', sortable: true },
        { key: 'fechaServicio', label: 'Fecha', sortable: true, format: (value: any) => new Date(value).toLocaleDateString('es-MX') },
        { key: 'cliente.nombre', label: 'Cliente', sortable: false },
        { key: 'equipo.nombre', label: 'Equipo', sortable: false },
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

    ngOnInit(): void {
        const id = this.route.snapshot.params['id'];
        if (id) {
            this.tecnicoId = +id;
            this.loadTecnico(this.tecnicoId);
            this.loadServicios(this.tecnicoId);
        }
    }

    loadTecnico(id: number): void {
        this.loading.set(true);
        this.tecnicosService.getOne(id).subscribe({
            next: (data) => {
                this.tecnico.set(data);
                this.loading.set(false);
            },
            error: () => {
                this.notificationService.error('Error al cargar el técnico');
                this.router.navigate(['/tecnicos']);
            }
        });
    }

    loadServicios(tecnicoId: number): void {
        this.loadingServicios.set(true);
        // Assuming getServicios method exists in TecnicosService
        this.tecnicosService.getServicios(tecnicoId).subscribe({
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

    getCountByEstado(estado: string): number {
        return this.servicios().filter((s: any) => s.estado === estado).length;
    }

    navigateToEdit(): void {
        this.router.navigate(['/tecnicos', this.tecnicoId, 'editar']);
    }

    navigateBack(): void {
        this.location.back();
    }
}

