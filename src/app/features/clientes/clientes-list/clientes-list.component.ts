import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ClientesService } from '../clientes.service';
import { DataTableComponent, DataTableColumn, DataTableAction } from '../../../shared/components/data-table/data-table.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-clientes-list',
  standalone: true,
  imports: [CommonModule, DataTableComponent, ModalComponent],
  template: `
    <div class="space-y-6">
      <!-- Page Title -->
      <div class="flex justify-between items-center px-1">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Clientes</h1>
          <p class="text-gray-500 text-sm mt-1">Gestión de clientes y empresas</p>
        </div>
        <!-- Button moved to table -->
      </div>

      <!-- Table with Integrated Header -->
      <app-data-table
        [data]="clientes()"
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
            <span>Nuevo Cliente</span>
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
          ¿Estás seguro que deseas eliminar el cliente <strong>{{ selectedCliente()?.nombre }}</strong>?
          Esta acción no se puede deshacer.
        </p>
      </app-modal>
    </div>
  `
})
export class ClientesListComponent {
  private clientesService = inject(ClientesService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);

  clientes = signal<any[]>([]);
  loading = signal(true);
  showDeleteModal = signal(false);
  selectedCliente = signal<any>(null);

  columns: DataTableColumn[] = [
    { key: 'idCliente', label: 'ID', sortable: true },
    { key: 'nombre', label: 'Nombre', sortable: true },
    { key: 'empresa', label: 'Empresa', sortable: true },
    { key: 'telefono', label: 'Teléfono', sortable: false },
  ];

  actions: DataTableAction[] = [
    {
      label: 'Ver',
      color: 'primary',
      onClick: (row) => this.router.navigate(['/clientes', row.idCliente])
    },
    {
      label: 'Editar',
      color: 'success',
      onClick: (row) => this.router.navigate(['/clientes', row.idCliente, 'editar'])
    },
    {
      label: 'Eliminar',
      color: 'danger',
      onClick: (row) => this.openDeleteModal(row)
    }
  ];

  ngOnInit(): void {
    this.loadClientes();
  }

  loadClientes(): void {
    this.loading.set(true);
    this.clientesService.getAll('').subscribe({
      next: (data) => {
        this.clientes.set(data);
        this.loading.set(false);
      },
      error: (error) => {
        this.notificationService.error('Error al cargar clientes');
        this.loading.set(false);
      }
    });
  }

  navigateToNew(): void {
    this.router.navigate(['/clientes/nuevo']);
  }

  openDeleteModal(cliente: any): void {
    this.selectedCliente.set(cliente);
    this.showDeleteModal.set(true);
  }

  confirmDelete(): void {
    const id = this.selectedCliente()?.idCliente;
    if (!id) return;

    this.clientesService.delete(id).subscribe({
      next: () => {
        this.notificationService.success('Cliente eliminado correctamente');
        this.showDeleteModal.set(false);
        this.loadClientes();
      },
      error: (error) => {
        this.notificationService.error('Error al eliminar cliente');
      }
    });
  }
}
