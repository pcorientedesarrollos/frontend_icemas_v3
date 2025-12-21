import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ServiciosService } from '../servicios.service';
import { ClientesService } from '../../clientes/clientes.service';
import { DataTableComponent, DataTableColumn, DataTableAction } from '../../../shared/components/data-table/data-table.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-servicios-list',
  standalone: true,
  imports: [CommonModule, DataTableComponent, ModalComponent, FormsModule],
  templateUrl: './servicios-list.component.html',
  styleUrl: './servicios-list.component.css',
})
export class ServiciosListComponent {
  private serviciosService = inject(ServiciosService);
  private clientesService = inject(ClientesService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);

  servicios = signal<any[]>([]);
  loading = signal(true);
  showDeleteModal = signal(false);
  selectedServicio = signal<any>(null);

  // Filters
  searchTerm = signal('');
  selectedYear = signal(new Date().getFullYear());
  selectedMonth = signal(new Date().getMonth() + 1); // 1-12
  selectedStatus = signal('Todos los Estados');
  selectedCliente = signal<number | 'all'>('all');
  selectedSucursal = signal<number | 'all'>('all');

  // Filter Options
  years = signal<number[]>([]);
  clientes = signal<any[]>([]);
  sucursales = signal<any[]>([]);
  months = [
    { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' }, { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' }, { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' }, { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' }
  ];
  statuses = ['Todos los Estados', 'Pendiente', 'Completado', 'Cancelado'];

  columns: DataTableColumn[] = [
    { key: 'idServicio', label: 'ID', sortable: true, width: 'w-16 font-bold text-gray-900' },
    { key: 'folio', label: 'FOLIO', sortable: true, width: 'whitespace-nowrap font-medium' },
    { key: 'fechaServicio', label: 'FECHA', sortable: true, format: (value) => new Date(value).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }), width: 'whitespace-nowrap' },
    { key: 'cliente.nombre', label: 'CLIENTE', sortable: true, maxWidth: '200px', hideOnMobile: true, format: (val) => val?.toUpperCase() },
    { key: 'sucursal.nombre', label: 'SUCURSAL', sortable: true, maxWidth: '200px', hideOnMobile: true, format: (val) => val?.toUpperCase() },
    { key: 'equipo.nombre', label: 'EQUIPO', sortable: true, maxWidth: '250px', hideOnMobile: true, format: (val) => val?.toUpperCase() },
    { key: 'equipo.serie', label: 'SERIE', sortable: false, maxWidth: '150px', hideOnMobile: true, format: (val) => val?.toUpperCase() },
    {
      key: 'estado',
      label: 'ESTADO',
      sortable: true,
      type: 'badge',
      width: 'w-1 whitespace-nowrap'
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

  // Computed properties for searchable selects
  yearsOptions = computed(() =>
    this.years().map(y => ({ value: y, label: y.toString() }))
  );

  monthsOptions = computed(() => this.months);

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
    // Generate years (current year - 5 to current year + 1)
    const currentYear = new Date().getFullYear();
    const yearsList = [];
    for (let i = currentYear + 1; i >= currentYear - 5; i--) {
      yearsList.push(i);
    }
    this.years.set(yearsList);

    // Load clientes for filter
    this.clientesService.getAll('').subscribe({
      next: (data) => this.clientes.set(data),
      error: () => { } // Silent fail
    });

    // Load all sucursales for filter (we'll get them from all clientes)
    this.clientesService.getAll('').subscribe({
      next: (clientes) => {
        const allSucursales: any[] = [];
        clientes.forEach(cliente => {
          this.clientesService.getSucursales(cliente.idCliente).subscribe({
            next: (sucursales) => {
              allSucursales.push(...sucursales);
              // Remove duplicates by idSucursal
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
      this.selectedYear();
      this.selectedMonth();
      this.selectedStatus();
      this.selectedCliente();
      this.selectedSucursal();

      // Trigger load when any filter changes
      this.loadServicios();
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    // Initial load handled by effect or manually if preferred
  }

  loadServicios(): void {
    this.loading.set(true);

    // Calculate dates based on year and month
    const year = this.selectedYear();
    const month = this.selectedMonth();

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of month

    // Format dates as YYYY-MM-DD
    const fechaInicio = startDate.toISOString().split('T')[0];
    const fechaFin = endDate.toISOString().split('T')[0];

    const filters: any = {
      fechaInicio,
      fechaFin
    };

    if (this.selectedStatus() !== 'Todos los Estados') {
      filters.estado = this.selectedStatus();
    }

    if (this.searchTerm()) {
      filters.search = this.searchTerm();
    }

    this.serviciosService.getAll(filters).subscribe({
      next: (data) => {
        // Apply additional frontend filters
        let filteredData = data;

        // Filter by Cliente
        if (this.selectedCliente() !== 'all') {
          const clienteId = Number(this.selectedCliente());
          filteredData = filteredData.filter(s => s.cliente?.idCliente === clienteId);
        }

        // Filter by Sucursal
        if (this.selectedSucursal() !== 'all') {
          const sucursalId = Number(this.selectedSucursal());
          filteredData = filteredData.filter(s => s.sucursal?.idSucursal === sucursalId);
        }

        this.servicios.set(filteredData);
        this.loading.set(false);
      },
      error: (error) => {
        this.notificationService.error('Error al cargar servicios');
        this.loading.set(false);
      }
    });
  }

  refresh(): void {
    this.loadServicios();
  }

  resetFilters(): void {
    this.searchTerm.set('');
    this.selectedYear.set(new Date().getFullYear());
    this.selectedMonth.set(new Date().getMonth() + 1);
    this.selectedStatus.set('Todos los Estados');
    this.selectedCliente.set('all');
    this.selectedSucursal.set('all');
  }

  activeFiltersCount = computed(() => {
    let count = 0;
    if (this.selectedYear()) count++;
    if (this.selectedMonth()) count++;
    if (this.selectedStatus() !== 'Todos los Estados') count++;
    return count;
  });

  get currentMonthLabel() {
    return this.months.find(m => m.value == this.selectedMonth())?.label;
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
    return this.servicios().filter(s =>
      s.estado?.toLowerCase().trim() === estado.toLowerCase().trim()
    ).length;
  }
}
