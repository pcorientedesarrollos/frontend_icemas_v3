import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { EquiposService } from '../equipos.service';
import { DataTableComponent, DataTableColumn, DataTableAction } from '../../../shared/components/data-table/data-table.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-equipos-list',
  standalone: true,
  imports: [CommonModule, DataTableComponent, ModalComponent],
  template: `
    <div class="space-y-6">
      <!-- Page Title -->
      <div class="flex justify-between items-center px-1">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Equipos</h1>
          <p class="text-gray-500 text-sm mt-1">Gestión de equipos e inventario</p>
        </div>
      </div>

      <!-- Table with Integrated Header -->
      <app-data-table
        [data]="equipos()"
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
            <span>Nuevo Equipo</span>
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
          ¿Estás seguro que deseas eliminar el equipo <strong>{{ selectedEquipo()?.nombre }}</strong>?
          Esta acción no se puede deshacer.
        </p>
      </app-modal>
    </div>
  `
})
export class EquiposListComponent {
  private equiposService = inject(EquiposService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);

  equipos = signal<any[]>([]);
  loading = signal(true);
  showDeleteModal = signal(false);
  selectedEquipo = signal<any>(null);

  columns: DataTableColumn[] = [
    { key: 'idEquipo', label: 'ID', sortable: true },
    { key: 'nombre', label: 'Nombre', sortable: true },
    { key: 'modelo', label: 'Modelo', sortable: true },
    { key: 'marca.nombre', label: 'Marca', sortable: false },
    { key: 'serie', label: 'Serie', sortable: false },
    { key: 'estado', label: 'Estado', sortable: true, format: (value) => value === 1 ? 'Activo' : 'Inactivo' },
  ];

  actions: DataTableAction[] = [
    {
      label: 'Ver',
      color: 'primary',
      onClick: (row) => this.router.navigate(['/equipos', row.idEquipo])
    },
    {
      label: 'Editar',
      color: 'success',
      onClick: (row) => this.router.navigate(['/equipos', row.idEquipo, 'editar'])
    },
    {
      label: 'Eliminar',
      color: 'danger',
      onClick: (row) => this.openDeleteModal(row)
    }
  ];

  ngOnInit(): void {
    this.loadEquipos();
  }

  loadEquipos(): void {
    this.loading.set(true);
    this.equiposService.getAll().subscribe({
      next: (data) => {
        this.equipos.set(data);
        this.loading.set(false);
      },
      error: (error) => {
        this.notificationService.error('Error al cargar equipos');
        this.loading.set(false);
      }
    });
  }

  navigateToNew(): void {
    this.router.navigate(['/equipos/nuevo']);
  }

  openDeleteModal(equipo: any): void {
    this.selectedEquipo.set(equipo);
    this.showDeleteModal.set(true);
  }

  confirmDelete(): void {
    const id = this.selectedEquipo()?.idEquipo;
    if (!id) return;

    this.equiposService.delete(id).subscribe({
      next: () => {
        this.notificationService.success('Equipo eliminado correctamente');
        this.showDeleteModal.set(false);
        this.loadEquipos();
      },
      error: (error) => {
        this.notificationService.error('Error al eliminar equipo');
      }
    });
  }
}
