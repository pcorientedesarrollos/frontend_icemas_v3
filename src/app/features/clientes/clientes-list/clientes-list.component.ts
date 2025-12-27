import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { ClientesService } from '../clientes.service';
import { DataTableComponent, DataTableColumn, DataTableAction } from '../../../shared/components/data-table/data-table.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { AutocompleteInputComponent } from '../../../shared/components/autocomplete-input/autocomplete-input.component';
import type { AutocompleteOption } from '../../../core/interfaces';

@Component({
  selector: 'app-clientes-list',
  standalone: true,
  imports: [CommonModule, DataTableComponent, ModalComponent, AutocompleteInputComponent],
  templateUrl: './clientes-list.component.html',
  styleUrl: './clientes-list.component.css'
})
export class ClientesListComponent {
  private clientesService = inject(ClientesService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);
  private location = inject(Location);
  private confirmationService = inject(ConfirmationService);

  clientes = signal<any[]>([]);
  loading = signal(true);

  // Autocomplete state
  autocompleteOptions = signal<AutocompleteOption[]>([]);
  autocompleteLoading = signal(false);

  // Sucursales Modal state
  showSucursalesModal = signal(false);
  selectedClienteForSucursales = signal<any>(null);
  sucursalesData = signal<any[]>([]);
  sucursalesLoading = signal(false);

  sucursalesColumns: DataTableColumn[] = [
    { key: 'nombre', label: 'Nombre', sortable: true },
    { key: 'direccion', label: 'Dirección', sortable: false },
    { key: 'telefono', label: 'Teléfono', sortable: false }
  ];

  columns: DataTableColumn[] = [
    { key: 'nombre', label: 'Nombre', sortable: true },
    { key: 'empresa', label: 'Empresa', sortable: true, hideOnMobile: true },
    {
      key: 'telefono',
      label: 'Teléfono',
      sortable: false,
      width: 'w-36',
      hideOnMobile: true,
      format: (val) => {
        if (!val) return '<span class="text-gray-400 italic text-xs">Sin registro</span>';
        const str = String(val);
        const clean = str.replace(/\D/g, '');
        if (clean.length === 10) {
          return `<span class="font-mono">(${clean.slice(0, 3)}) ${clean.slice(3, 6)}-${clean.slice(6)}</span>`;
        }
        return str;
      }
    },
    {
      key: 'sucursales',
      label: 'Sucursales',
      type: 'button',
      width: 'w-24',
      buttonStyle: 'circle',
      format: (val) => (val && val.length > 0) ? val.length.toString() : '0',
      action: (row) => this.viewSucursales(row)
    }
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

  // Delete Modal
  async openDeleteModal(cliente: any) {
    const confirmed = await this.confirmationService.confirm({
      title: '¿Eliminar Cliente?',
      text: `Estás a punto de eliminar al cliente "${cliente.nombre}". Esta acción no se puede deshacer.`,
      confirmButtonText: 'Sí, eliminar cliente',
      confirmButtonColor: '#dc2626'
    });

    if (confirmed) {
      this.clientesService.delete(cliente.idCliente).subscribe({
        next: () => {
          this.notificationService.success('Cliente eliminado correctamente');
          this.loadClientes();
        },
        error: (error) => {
          console.error('Error deleting cliente:', error);
          this.notificationService.error(error.error?.message || 'Error al eliminar cliente');
        }
      });
    }
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

  goBack(): void {
    this.location.back();
  }
}
