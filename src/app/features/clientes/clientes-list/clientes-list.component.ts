import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ClientesService } from '../clientes.service';
import { CatalogTableComponent, CatalogTableColumn, CatalogTableAction } from '../../../shared/components/catalog-table/catalog-table.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { NotificationService } from '../../../core/services/notification.service';
import { AutocompleteInputComponent } from '../../../shared/components/autocomplete-input/autocomplete-input.component';
import type { AutocompleteOption } from '../../../core/interfaces';

@Component({
  selector: 'app-clientes-list',
  standalone: true,
  imports: [CommonModule, CatalogTableComponent, ModalComponent, AutocompleteInputComponent],
  templateUrl: './clientes-list.component.html',
  styleUrl: './clientes-list.component.css'
})
export class ClientesListComponent {
  private clientesService = inject(ClientesService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);

  clientes = signal<any[]>([]);
  loading = signal(true);
  showDeleteModal = signal(false);
  selectedCliente = signal<any>(null);

  // Autocomplete state
  autocompleteOptions = signal<AutocompleteOption[]>([]);
  autocompleteLoading = signal(false);

  // Sucursales Modal state
  showSucursalesModal = signal(false);
  selectedClienteForSucursales = signal<any>(null);
  sucursalesData = signal<any[]>([]);
  sucursalesLoading = signal(false);

  sucursalesColumns: CatalogTableColumn[] = [
    { key: 'idSucursal', label: 'ID', sortable: true, width: 'w-1 whitespace-nowrap' },
    { key: 'nombre', label: 'Nombre', sortable: true },
    { key: 'direccion', label: 'Dirección', sortable: false },
    { key: 'telefono', label: 'Teléfono', sortable: false }
  ];

  columns: CatalogTableColumn[] = [
    { key: 'idCliente', label: 'ID', sortable: true, width: 'w-1 whitespace-nowrap' },
    { key: 'nombre', label: 'Nombre', sortable: true },
    { key: 'empresa', label: 'Empresa', sortable: true },
    { key: 'telefono', label: 'Teléfono', sortable: false, width: 'whitespace-nowrap' },
    {
      key: 'sucursales',
      label: 'Sucursales',
      type: 'button',
      buttonText: 'Ver',
      width: 'w-1 whitespace-nowrap',
      action: (row) => this.viewSucursales(row),
      icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72m-13.5 8.65h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .415.336.75.75.75Z" /></svg>`
    }
  ];

  actions: CatalogTableAction[] = [
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
    this.clientesService.getAll().subscribe({
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

  // Autocomplete methods
  onAutocompleteSearch(query: string): void {
    this.autocompleteLoading.set(true);
    this.clientesService.autocomplete(query).subscribe({
      next: (results) => {
        this.autocompleteOptions.set(results);
        this.autocompleteLoading.set(false);
      },
      error: () => {
        this.autocompleteOptions.set([]);
        this.autocompleteLoading.set(false);
      }
    });
  }

  onAutocompleteSelect(option: AutocompleteOption): void {
    this.router.navigate(['/clientes', option.id]);
  }

  onAutocompleteClear(): void {
    this.autocompleteOptions.set([]);
  }

  // Sucursales Modal methods
  viewSucursales(cliente: any): void {
    this.selectedClienteForSucursales.set(cliente);
    this.showSucursalesModal.set(true);
    this.loadSucursales(cliente.idCliente);
  }

  loadSucursales(id: number): void {
    this.sucursalesLoading.set(true);
    this.clientesService.getSucursales(id).subscribe({
      next: (data) => {
        this.sucursalesData.set(data);
        this.sucursalesLoading.set(false);
      },
      error: () => {
        this.notificationService.error('Error al cargar sucursales');
        this.sucursalesLoading.set(false);
      }
    });
  }

  closeSucursalesModal(): void {
    this.showSucursalesModal.set(false);
    this.selectedClienteForSucursales.set(null);
    this.sucursalesData.set([]);
  }
}
