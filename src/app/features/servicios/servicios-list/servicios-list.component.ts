import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ServiciosService } from '../servicios.service';
import { DataTableComponent, DataTableColumn, DataTableAction } from '../../../shared/components/data-table/data-table.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-servicios-list',
  standalone: true,
  imports: [CommonModule, DataTableComponent, ModalComponent],
  template: `
    <div class="space-y-6">
      <!-- Page Title -->
      <div class="flex justify-between items-center px-1">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Servicios</h1>
          <p class="text-gray-500 text-sm mt-1">Gestión de órdenes de servicio</p>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <div class="text-xs font-medium text-gray-500 uppercase tracking-wide">Pendientes</div>
          <div class="text-2xl font-bold text-yellow-600 mt-1">{{ getCountByEstado('Pendiente') }}</div>
        </div>
        <div class="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <div class="text-xs font-medium text-gray-500 uppercase tracking-wide">En Proceso</div>
          <div class="text-2xl font-bold text-blue-600 mt-1">{{ getCountByEstado('En Proceso') }}</div>
        </div>
        <div class="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <div class="text-xs font-medium text-gray-500 uppercase tracking-wide">Completados</div>
          <div class="text-2xl font-bold text-green-600 mt-1">{{ getCountByEstado('Completado') }}</div>
        </div>
        <div class="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <div class="text-xs font-medium text-gray-500 uppercase tracking-wide">Cancelados</div>
          <div class="text-2xl font-bold text-red-600 mt-1">{{ getCountByEstado('Cancelado') }}</div>
        </div>
      </div>

      <!-- Table with Integrated Header -->
      <app-data-table
        [data]="servicios()"
        [columns]="columns"
        [actions]="actions"
        [loading]="loading()"
        [searchable]="true"
      >
        <!-- Injected Action Button -->
         <button
          header-actions
          (click)="navigateToNew()"
          class="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-colors shadow-sm"
        >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>Nueva Orden</span>
        </button>
      </app-data-table>

      <!-- Delete Confirmation Modal -->
      <app-modal
        [isOpen]="showDeleteModal()"
        title="Confirmar Eliminación"
        type="danger"
        confirmButtonText="Eliminar"
        (closed)="showDeleteModal.set(false)"
        (confirmed)="confirmDelete()"
        (cancelled)="showDeleteModal.set(false)"
      >
        <p class="text-gray-600">
          ¿Estás seguro que deseas eliminar el servicio <strong>#{{ selectedServicio()?.folio }}</strong>?
          Esta acción no se puede deshacer.
        </p>
      </app-modal>
    </div>
  `
})
export class ServiciosListComponent {
  private serviciosService = inject(ServiciosService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);

  servicios = signal<any[]>([]);
  loading = signal(true);
  showDeleteModal = signal(false);
  selectedServicio = signal<any>(null);

  columns: DataTableColumn[] = [
    { key: 'idServicio', label: 'ID', sortable: true },
    { key: 'folio', label: 'Folio', sortable: true },
    { key: 'fechaServicio', label: 'Fecha', sortable: true, format: (value) => new Date(value).toLocaleDateString('es-MX') },
    { key: 'cliente.nombre', label: 'Cliente', sortable: false },
    { key: 'equipo.nombre', label: 'Equipo', sortable: false },
    { key: 'tecnico.nombre', label: 'Técnico', sortable: false },
    {
      key: 'estado',
      label: 'Estado',
      sortable: true,
      format: (value) => {
        const badges: Record<string, string> = {
          'Pendiente': '<span class="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Pendiente</span>',
          'En Proceso': '<span class="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">En Proceso</span>',
          'Completado': '<span class="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Completado</span>',
          'Cancelado': '<span class="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Cancelado</span>'
        };
        return badges[value] || value;
      }
    },
  ];

  actions: DataTableAction[] = [
    {
      label: 'Ver',
      color: 'primary',
      onClick: (row) => this.router.navigate(['/servicios', row.idServicio])
    },
    {
      label: 'Editar',
      color: 'success',
      onClick: (row) => this.router.navigate(['/servicios', row.idServicio, 'editar'])
    },
    {
      label: 'Eliminar',
      color: 'danger',
      onClick: (row) => this.openDeleteModal(row)
    }
  ];

  ngOnInit(): void {
    this.loadServicios();
  }

  loadServicios(): void {
    this.loading.set(true);
    this.serviciosService.getAll().subscribe({
      next: (data) => {
        this.servicios.set(data);
        this.loading.set(false);
      },
      error: (error) => {
        this.notificationService.error('Error al cargar servicios');
        this.loading.set(false);
      }
    });
  }

  navigateToNew(): void {
    this.router.navigate(['/servicios/nuevo']);
  }

  openDeleteModal(servicio: any): void {
    this.selectedServicio.set(servicio);
    this.showDeleteModal.set(true);
  }

  confirmDelete(): void {
    const id = this.selectedServicio()?.idServicio;
    if (!id) return;

    this.serviciosService.delete(id).subscribe({
      next: () => {
        this.notificationService.success('Servicio eliminado correctamente');
        this.showDeleteModal.set(false);
        this.loadServicios();
      },
      error: (error) => {
        this.notificationService.error('Error al eliminar servicio');
      }
    });
  }

  getCountByEstado(estado: string): number {
    return this.servicios().filter(s => s.estado === estado).length;
  }
}
