import { Component, inject, signal, computed, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EquiposService } from '../equipos.service';
import { ClientesService } from '../../clientes/clientes.service';
import { DataTableComponent, DataTableColumn, DataTableAction } from '../../../shared/components/data-table/data-table.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-equipos-list',
  standalone: true,
  imports: [CommonModule, DataTableComponent, ModalComponent, FormsModule],
  templateUrl: './equipos-list.component.html',
  styleUrl: './equipos-list.component.css'
})
export class EquiposListComponent implements OnInit {
  private equiposService = inject(EquiposService);
  private clientesService = inject(ClientesService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);

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
    { key: 'idEquipo', label: 'ID', sortable: true, hideOnMobile: true, width: 'w-16 font-bold text-gray-900' },
    { key: 'nombre', label: 'EQUIPO', sortable: true, format: (val) => val?.toUpperCase() },
    { key: 'modelo', label: 'MODELO', sortable: true, maxWidth: '150px', hideOnMobile: true, format: (val) => val?.toUpperCase() || '' },
    { key: 'marca.nombre', label: 'MARCA', sortable: true, maxWidth: '150px', hideOnMobile: true, format: (val) => val?.toUpperCase() || '' },
    { key: 'serie', label: 'SERIE', sortable: false, hideOnMobile: true, width: 'whitespace-nowrap', format: (val) => val?.toUpperCase() || '' },
    { key: 'cliente.nombre', label: 'CLIENTE', sortable: true, maxWidth: '200px', hideOnMobile: true, format: (val) => val?.toUpperCase() },
    { key: 'sucursal.nombre', label: 'SUCURSAL', sortable: true, maxWidth: '200px', hideOnMobile: true, format: (val) => val?.toUpperCase() || 'N/A' },
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

    // Load all sucursales for filter
    this.clientesService.getAll('').subscribe({
      next: (clientes) => {
        const allSucursales: any[] = [];
        clientes.forEach(cliente => {
          this.clientesService.getSucursales(cliente.idCliente).subscribe({
            next: (sucursales) => {
              allSucursales.push(...sucursales);
              const uniqueSucursales = allSucursales.filter((s, index, self) =>
                index === self.findIndex(t => t.idSucursal === s.idSucursal)
              );
              this.sucursales.set(uniqueSucursales);
            },
            error: () => { } // Silent fail
          });
        });
      },
      error: () => { } // Silent fail
    });

    // React to filter changes
    effect(() => {
      // Read all filter signals to track changes
      this.searchTerm();
      this.selectedStatus();
      this.selectedCliente();
      this.selectedSucursal();

      // Trigger load when any filter changes
      this.loadEquipos();
    }, { allowSignalWrites: true });
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
      error: () => {
        this.notificationService.error('Error al eliminar equipo');
        this.showDeleteModal.set(false);
      }
    });
  }

  getCountByEstado(statusCheck: string): number {
    return this.equipos().filter(e => {
      if (statusCheck === 'Activo') return e.estado === 1;
      if (statusCheck === 'Inactivo') return e.estado === 0;
      return false;
    }).length;
  }
}
