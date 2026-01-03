import { Component, inject, signal, computed, OnInit, effect } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EquiposService } from '../equipos.service';
import { ClientesService } from '../../clientes/clientes.service';
import { DataTableComponent, DataTableColumn, DataTableAction } from '../../../shared/components/data-table/data-table.component';
import { NotificationService } from '../../../core/services/notification.service';
import { SearchableSelectComponent } from '../../../shared/components/searchable-select/searchable-select.component';
import { ConfirmationService } from '../../../core/services/confirmation.service';

@Component({
  selector: 'app-equipos-list',
  standalone: true,
  imports: [CommonModule, DataTableComponent, FormsModule, SearchableSelectComponent],
  templateUrl: './equipos-list.component.html',
  styleUrl: './equipos-list.component.css'
})
export class EquiposListComponent implements OnInit {
  private equiposService = inject(EquiposService);
  private clientesService = inject(ClientesService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);
  private location = inject(Location);
  private confirmationService = inject(ConfirmationService);

  equipos = signal<any[]>([]);
  loading = signal(true);

  showDeleteModal = signal(false);
  selectedEquipo = signal<any>(null);

  // Filters
  searchTerm = signal('');
  selectedStatus = signal('Todos'); // 'Todos', 'Activo', 'Inactivo'
  selectedCliente = signal<number | 'all'>('all');
  selectedSucursal = signal<number | 'all'>('all');

  statuses = ['Todos', 'Activo', 'Inactivo'];
  clientes = signal<any[]>([]);
  sucursales = signal<any[]>([]);

  columns: DataTableColumn[] = [
    { key: 'cliente.nombre', label: 'CLIENTE', sortable: true, maxWidth: '200px', hideOnMobile: true, format: (val) => val?.toUpperCase() },
    { key: 'sucursal.nombre', label: 'SUCURSAL', sortable: true, maxWidth: '200px', hideOnMobile: true, format: (val) => val?.toUpperCase() || 'N/A' },
    { key: 'nombre', label: 'EQUIPO', sortable: true, format: (val) => val?.toUpperCase() },
    { key: 'modelo', label: 'MODELO', sortable: true, maxWidth: '150px', hideOnMobile: true, format: (val) => val?.toUpperCase() || '' },
    { key: 'marca.nombre', label: 'MARCA', sortable: true, maxWidth: '150px', hideOnMobile: true, format: (val) => val?.toUpperCase() || '' },
    { key: 'serie', label: 'SERIE', sortable: false, hideOnMobile: true, width: 'whitespace-nowrap', format: (val) => val?.toUpperCase() || '' },
    { key: 'estado', label: 'ESTADO', sortable: true, type: 'badge', format: (value) => value === 1 ? 'Activo' : 'Inactivo', width: 'w-1 whitespace-nowrap' }
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

  // Computed properties for searchable selects
  clientesOptions = computed(() => [
    { idCliente: 'all', nombre: 'Todos los Clientes' },
    ...this.clientes()
  ]);

  sucursalesOptions = computed(() => [
    { idSucursal: 'all', nombre: 'Todas las Sucursales' },
    ...this.sucursales()
  ]);

  statusesOptions = computed(() =>
    this.statuses.map(s => ({ value: s, label: s }))
  );

  constructor() {
    // Load clientes for filter
    this.clientesService.getAll('').subscribe({
      next: (data) => this.clientes.set(data),
      error: () => { } // Silent fail
    });

    // React to cliente selection to load its sucursales
    effect(() => {
      const clienteId = this.selectedCliente();
      if (clienteId !== 'all') {
        // Load sucursales for selected cliente
        this.clientesService.getSucursales(Number(clienteId)).subscribe({
          next: (data) => this.sucursales.set(data),
          error: () => this.sucursales.set([])
        });
        // Reset sucursal selection when cliente changes
        this.selectedSucursal.set('all');
      } else {
        // Clear sucursales when no cliente is selected
        this.sucursales.set([]);
        this.selectedSucursal.set('all');
      }
    });

    // React to filter changes (excluding selectedCliente which has its own effect)
    effect(() => {
      // Read all filter signals to track changes
      this.searchTerm();
      this.selectedStatus();
      this.selectedSucursal();

      // Trigger load when any filter changes
      this.loadEquipos();
    });
  }

  ngOnInit(): void {
    // Initial load handled by effect
  }

  loadEquipos(): void {
    this.loading.set(true);

    const filters: any = {};

    if (this.selectedStatus() === 'Activo') {
      filters.estado = 1;
    } else if (this.selectedStatus() === 'Inactivo') {
      filters.estado = 0;
    }

    if (this.searchTerm()) {
      filters.search = this.searchTerm();
    }

    this.equiposService.getAll(filters).subscribe({
      next: (data) => {
        // Apply additional frontend filters
        let filteredData = data;

        // Filter by Cliente
        if (this.selectedCliente() !== 'all') {
          const clienteId = Number(this.selectedCliente());
          filteredData = filteredData.filter(e => e.cliente?.idCliente === clienteId);
        }

        // Filter by Sucursal
        if (this.selectedSucursal() !== 'all') {
          const sucursalId = Number(this.selectedSucursal());
          filteredData = filteredData.filter(e => e.sucursal?.idSucursal === sucursalId);
        }

        this.equipos.set(filteredData);
        this.loading.set(false);
      },
      error: () => {
        this.notificationService.error('Error al cargar equipos');
        this.loading.set(false);
      }
    });
  }

  refresh(): void {
    this.loadEquipos();
  }

  resetFilters(): void {
    this.searchTerm.set('');
    this.selectedStatus.set('Todos');
    this.selectedCliente.set('all');
    this.selectedSucursal.set('all');
  }

  activeFiltersCount = computed(() => {
    let count = 0;
    if (this.selectedStatus() !== 'Todos') count++;
    return count;
  });

  navigateToNew(): void {
    this.router.navigate(['/equipos/nuevo']);
  }

  // Delete Modal
  async openDeleteModal(equipo: any) {
    // The old showDeleteModal and showConfirmModal signals are no longer used for preventing double opening here.
    // The ConfirmationService handles its own state.
    // if (this.showDeleteModal() || this.showConfirmModal()) return; // Prevent double opening

    const confirmed = await this.confirmationService.confirm({
      title: '¿Eliminar Equipo?',
      text: `Estás a punto de eliminar el equipo "${equipo.nombre}" de la sucursal "${equipo.sucursal?.nombre}". Esta acción no se puede deshacer.`,
      confirmButtonText: 'Sí, eliminar equipo',
      confirmButtonColor: '#dc2626'
    });

    if (confirmed) {
      if (equipo.idEquipo) {
        this.equiposService.delete(equipo.idEquipo).subscribe({
          next: () => {
            this.notificationService.success('Equipo eliminado correctamente');
            this.loadEquipos();
          },
          error: (err) => {
            console.error('Error deleting equipo:', err);
            this.notificationService.error(err.error?.message || 'Error al eliminar el equipo');
          }
        });
      }
    }
  }



  getCountByEstado(statusCheck: string): number {
    return this.equipos().filter(e => {
      if (statusCheck === 'Activo') return e.estado === 1;
      if (statusCheck === 'Inactivo') return e.estado === 0;
      return false;
    }).length;
  }

  onClienteChange(value: any): void {
    // CRITICAL FIX: Don't convert 'all' to Number (becomes NaN)
    if (value === 'all' || value === null || value === undefined) {
      this.selectedCliente.set('all');
    } else {
      this.selectedCliente.set(Number(value));
    }
    // The cascading effect will handle loading sucursales
    // Manually trigger data load
    this.loadEquipos();
  }

  onSucursalChange(value: any): void {
    // CRITICAL FIX: Don't convert 'all' to Number (becomes NaN)
    if (value === 'all' || value === null || value === undefined) {
      this.selectedSucursal.set('all');
    } else {
      this.selectedSucursal.set(Number(value));
    }
    this.loadEquipos();
  }

  goBack(): void {
    this.location.back();
  }
}
