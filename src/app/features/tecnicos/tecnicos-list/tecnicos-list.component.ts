import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TecnicosService } from '../tecnicos.service';
import { DataTableComponent, DataTableColumn, DataTableAction } from '../../../shared/components/data-table/data-table.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-tecnicos-list',
  standalone: true,
  imports: [CommonModule, DataTableComponent, ModalComponent],
  template: `
    <div class="space-y-6">
      <!-- Page Title -->
      <div class="flex justify-between items-center px-1">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Técnicos</h1>
          <p class="text-gray-500 text-sm mt-1">Gestión de personal técnico</p>
        </div>
      </div>

      <!-- Table with Integrated Header -->
      <app-data-table
        [data]="tecnicos()"
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
            <span>Nuevo Técnico</span>
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
          ¿Estás seguro que deseas eliminar al técnico <strong>{{ selectedTecnico()?.nombre }}</strong>?
          Esta acción no se puede deshacer.
        </p>
      </app-modal>
    </div>
  `
})
export class TecnicosListComponent {
  private tecnicosService = inject(TecnicosService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);

  tecnicos = signal<any[]>([]);
  loading = signal(true);
  showDeleteModal = signal(false);
  selectedTecnico = signal<any>(null);

  columns: DataTableColumn[] = [
    { key: 'idTecnico', label: 'ID', sortable: true },
    { key: 'nombre', label: 'Nombre', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'telefono', label: 'Teléfono', sortable: false },
    { key: 'especialidad', label: 'Especialidad', sortable: true },
    {
      key: 'activo',
      label: 'Estado',
      sortable: true,
      format: (value) => value === 1 ? '✓ Activo' : '✗ Inactivo'
    },
  ];

  actions: DataTableAction[] = [
    {
      label: 'Ver',
      color: 'primary',
      onClick: (row) => this.router.navigate(['/tecnicos', row.idTecnico])
    },
    {
      label: 'Editar',
      color: 'success',
      onClick: (row) => this.router.navigate(['/tecnicos', row.idTecnico, 'editar'])
    },
    {
      label: 'Eliminar',
      color: 'danger',
      onClick: (row) => this.openDeleteModal(row)
    }
  ];

  ngOnInit(): void {
    this.loadTecnicos();
  }

  loadTecnicos(): void {
    this.loading.set(true);
    this.tecnicosService.getAll().subscribe({
      next: (data) => {
        this.tecnicos.set(data);
        this.loading.set(false);
      },
      error: (error) => {
        this.notificationService.error('Error al cargar técnicos');
        this.loading.set(false);
      }
    });
  }

  navigateToNew(): void {
    this.router.navigate(['/tecnicos/nuevo']);
  }

  openDeleteModal(tecnico: any): void {
    this.selectedTecnico.set(tecnico);
    this.showDeleteModal.set(true);
  }

  confirmDelete(): void {
    const id = this.selectedTecnico()?.idTecnico;
    if (!id) return;

    this.tecnicosService.delete(id).subscribe({
      next: () => {
        this.notificationService.success('Técnico eliminado correctamente');
        this.showDeleteModal.set(false);
        this.loadTecnicos();
      },
      error: (error) => {
        this.notificationService.error('Error al eliminar técnico');
      }
    });
  }
}
