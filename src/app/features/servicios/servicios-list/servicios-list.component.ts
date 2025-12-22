import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ServiciosService } from '../servicios.service';
import { ClientesService } from '../../clientes/clientes.service';
import { DataTableComponent, DataTableColumn, DataTableAction } from '../../../shared/components/data-table/data-table.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { NotificationService } from '../../../core/services/notification.service';
import { SearchableSelectComponent } from '../../../shared/components/searchable-select/searchable-select.component';

@Component({
  selector: 'app-servicios-list',
  standalone: true,
  imports: [CommonModule, DataTableComponent, ModalComponent, FormsModule, SearchableSelectComponent],
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
  selectedMonth = signal(0); // 0 = All months, 1-12 = specific month
  selectedStatus = signal('Todos los Estados');
  selectedCliente = signal<number | 'all'>('all');
  selectedSucursal = signal<number | 'all'>('all');

  // Filter Options
  years = signal<number[]>([]);
  clientes = signal<any[]>([]);
  sucursales = signal<any[]>([]);
  months = [
    { value: 0, label: 'Todos los Meses' },
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
    { key: 'equiposNames', label: 'EQUIPOS', sortable: true, maxWidth: '250px', hideOnMobile: true, format: (val) => val?.toUpperCase() },
    { key: 'equiposSeries', label: 'SERIES', sortable: true, maxWidth: '150px', hideOnMobile: true, format: (val) => val?.toUpperCase() },
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
    }, { allowSignalWrites: true });

    // React to filter changes (excluding selectedCliente which has its own effect)
    effect(() => {
      // Read all filter signals to track changes
      this.searchTerm();
      this.selectedYear();
      this.selectedMonth();
      this.selectedStatus();
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

    console.log('🔍 loadServicios called');
    console.log('🔍 selectedCliente:', this.selectedCliente());
    console.log('🔍 selectedSucursal:', this.selectedSucursal());
    console.log('🔍 selectedYear:', this.selectedYear());
    console.log('🔍 selectedMonth:', this.selectedMonth());

    // Calculate dates based on year and month
    const year = this.selectedYear();
    const month = this.selectedMonth();

    let startDate: Date;
    let endDate: Date;

    if (month === 0) {
      // All months - entire year
      startDate = new Date(year, 0, 1); // January 1st
      endDate = new Date(year, 11, 31); // December 31st
    } else {
      // Specific month
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0); // Last day of month
    }

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

    console.log('🔍 Backend filters:', filters);

    this.serviciosService.getAll(filters).subscribe({
      next: (data) => {
        console.log('🔍 Data received from backend:', data.length, 'servicios');
        // Apply additional frontend filters
        let filteredData = data.map(s => {
          // Process equipment names and series for display
          const equiposDocs = s.equiposAsignados || [];
          const names = equiposDocs.map((ea: any) => ea.equipo?.nombre).filter(Boolean).join(', ');
          const series = equiposDocs.map((ea: any) => ea.equipo?.serie).filter(Boolean).join(', ');

          return {
            ...s,
            equiposNames: names || s.equipo?.nombre || 'Sin Equipo',
            equiposSeries: series || s.equipo?.serie || ''
          };
        });

        // Filter by Cliente
        if (this.selectedCliente() !== 'all') {
          const clienteId = Number(this.selectedCliente());
          console.log('🔍 Filtering by clienteId:', clienteId);
          filteredData = filteredData.filter(s => s.cliente?.idCliente === clienteId);
          console.log('🔍 After cliente filter:', filteredData.length);
        }

        // Filter by Sucursal
        if (this.selectedSucursal() !== 'all') {
          const sucursalId = Number(this.selectedSucursal());
          console.log('🔍 Filtering by sucursalId:', sucursalId);
          filteredData = filteredData.filter(s => s.sucursal?.idSucursal === sucursalId);
          console.log('🔍 After sucursal filter:', filteredData.length);
        }

        console.log('🔍 Final filtered data:', filteredData.length);
        this.servicios.set(filteredData);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('🔍 Error loading servicios:', error);
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
    this.selectedMonth.set(0); // All months
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

  onClienteChange(value: any): void {
    console.log('🔍 onClienteChange called with value:', value, 'type:', typeof value);
    // CRITICAL FIX: Don't convert 'all' to Number (becomes NaN)
    if (value === 'all' || value === null || value === undefined) {
      this.selectedCliente.set('all');
    } else {
      this.selectedCliente.set(Number(value));
    }
    console.log('🔍 selectedCliente set to:', this.selectedCliente());
    // The cascading effect will handle loading sucursales
    // Manually trigger data load
    this.loadServicios();
  }

  onSucursalChange(value: any): void {
    console.log('🔍 onSucursalChange called with value:', value, 'type:', typeof value);
    // CRITICAL FIX: Don't convert 'all' to Number (becomes NaN)
    if (value === 'all' || value === null || value === undefined) {
      this.selectedSucursal.set('all');
    } else {
      this.selectedSucursal.set(Number(value));
    }
    console.log('🔍 selectedSucursal set to:', this.selectedSucursal());
    this.loadServicios();
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
