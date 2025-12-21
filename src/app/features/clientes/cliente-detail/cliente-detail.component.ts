import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ClientesService } from '../clientes.service';
import { SucursalesService } from '../sucursales/sucursales.service';
import { DataTableComponent, DataTableColumn, DataTableAction } from '../../../shared/components/data-table/data-table.component';
import { NotificationService } from '../../../core/services/notification.service';

import { Location } from '@angular/common';

@Component({
  selector: 'app-cliente-detail',
  standalone: true,
  imports: [CommonModule, DataTableComponent],
  templateUrl: './cliente-detail.component.html',
  styleUrl: './cliente-detail.component.css',
})
export class ClienteDetailComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private clientesService = inject(ClientesService);
  private location = inject(Location);
  private sucursalesService = inject(SucursalesService);
  private notificationService = inject(NotificationService);

  cliente = signal<any>(null);
  sucursales = signal<any[]>([]);
  servicios = signal<any[]>([]);
  equipos = signal<any[]>([]);

  loading = signal(true);
  loadingSucursales = signal(false);
  loadingServicios = signal(false);
  loadingEquipos = signal(false);

  // Tab state
  activeTab = signal<'general' | 'sucursales' | 'servicios' | 'equipos'>('general');

  tabs = [
    { id: 'general', label: 'Información General', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'sucursales', label: 'Sucursales', countSignal: this.sucursales, icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { id: 'servicios', label: 'Historial de Servicios', countSignal: this.servicios, icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { id: 'equipos', label: 'Equipos Registrados', countSignal: this.equipos, icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' }
  ];

  clienteId: number | null = null;

  sucursalesColumns: DataTableColumn[] = [
    { key: 'idSucursal', label: 'ID', sortable: true },
    { key: 'nombre', label: 'NOMBRE', sortable: true },
    { key: 'direccion', label: 'DIRECCIÓN', sortable: false },
    { key: 'telefono', label: 'TELÉFONO', sortable: false },
    { key: 'contacto', label: 'CONTACTO', sortable: false },
  ];

  serviciosColumns: DataTableColumn[] = [
    { key: 'folio', label: 'FOLIO', sortable: true },
    { key: 'fechaServicio', label: 'FECHA', sortable: true, format: (val) => new Date(val).toLocaleDateString() },
    { key: 'sucursal.nombre', label: 'SUCURSAL', sortable: true, format: (val) => val?.toUpperCase() || '' },
    { key: 'equipo.nombre', label: 'EQUIPO', sortable: true, format: (val) => val?.toUpperCase() || '' },
    { key: 'tecnico.nombre', label: 'TÉCNICO', sortable: true },
    { key: 'estado', label: 'ESTADO', sortable: true }
  ];

  equiposColumns: DataTableColumn[] = [
    { key: 'nombre', label: 'NOMBRE', sortable: true, format: (val) => val?.toUpperCase() },
    { key: 'modelo', label: 'MODELO', sortable: true, format: (val) => val?.toUpperCase() || '' },
    { key: 'marca.nombre', label: 'MARCA', sortable: true, format: (val) => val?.toUpperCase() || '' },
    { key: 'serie', label: 'SERIE', sortable: true, format: (val) => val?.toUpperCase() || '' },
    { key: 'sucursal.nombre', label: 'SUCURSAL', sortable: true, format: (val) => val?.toUpperCase() || '' },
    { key: 'estado', label: 'ESTADO', sortable: true, type: 'badge', format: (val) => val === 1 ? 'Activo' : 'Inactivo' }
  ];

  sucursalesActions: DataTableAction[] = [
    {
      label: 'Editar',
      color: 'success',
      onClick: (row) => this.router.navigate(['/sucursales', row.idSucursal, 'editar'])
    }
  ];

  serviciosActions: DataTableAction[] = [
    {
      label: 'Ver',
      color: 'primary',
      onClick: (row) => this.router.navigate(['/servicios', row.idServicio])
    }
  ];

  equiposActions: DataTableAction[] = [
    {
      label: 'Ver',
      color: 'primary',
      onClick: (row) => this.router.navigate(['/equipos', row.idEquipo])
    }
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.clienteId = +id;
      this.loadCliente(this.clienteId);
      this.loadSucursales(this.clienteId);
      this.loadServicios(this.clienteId);
      this.loadEquipos(this.clienteId);
    }
  }

  loadCliente(id: number): void {
    this.loading.set(true);
    this.clientesService.getOne(id).subscribe({
      next: (data) => {
        this.cliente.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.notificationService.error('Error al cargar el cliente');
        this.router.navigate(['/clientes']);
      }
    });
  }

  loadSucursales(clienteId: number): void {
    this.loadingSucursales.set(true);
    this.clientesService.getSucursales(clienteId).subscribe({
      next: (data) => {
        this.sucursales.set(data);
        this.loadingSucursales.set(false);
      },
      error: () => {
        this.notificationService.error('Error al cargar sucursales');
        this.loadingSucursales.set(false);
      }
    });
  }

  loadServicios(clienteId: number): void {
    this.loadingServicios.set(true);
    this.clientesService.getServicios(clienteId).subscribe({
      next: (data) => {
        this.servicios.set(data);
        this.loadingServicios.set(false);
      },
      error: () => {
        // Silent error or generic message, don't block UI
        console.error('Error loading servicios');
        this.loadingServicios.set(false);
      }
    });
  }

  loadEquipos(clienteId: number): void {
    this.loadingEquipos.set(true);
    this.clientesService.getEquipos(clienteId).subscribe({
      next: (data) => {
        this.equipos.set(data);
        this.loadingEquipos.set(false);
      },
      error: () => {
        console.error('Error loading equipos');
        this.loadingEquipos.set(false);
      }
    });
  }

  navigateToEdit(): void {
    this.router.navigate(['/clientes', this.clienteId, 'editar']);
  }

  navigateToNewSucursal(): void {
    this.router.navigate(['/sucursales/nuevo'], { queryParams: { clienteId: this.clienteId } });
  }

  navigateBack(): void {
    this.location.back();
  }

  setActiveTab(tab: string): void {
    if (tab === 'general' || tab === 'sucursales' || tab === 'servicios' || tab === 'equipos') {
      this.activeTab.set(tab);
    }
  }
}

