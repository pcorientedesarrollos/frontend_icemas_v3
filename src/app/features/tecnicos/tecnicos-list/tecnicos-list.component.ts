import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TecnicosService } from '../tecnicos.service';
import { DataTableComponent, DataTableColumn, DataTableAction } from '../../../shared/components/data-table/data-table.component';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { AutocompleteInputComponent, AutocompleteOption } from '../../../shared/components/autocomplete-input/autocomplete-input.component';

@Component({
  selector: 'app-tecnicos-list',
  standalone: true,
  imports: [CommonModule, DataTableComponent, AutocompleteInputComponent],
  templateUrl: './tecnicos-list.component.html',
  styleUrl: './tecnicos-list.component.css',
})
export class TecnicosListComponent {
  private tecnicosService = inject(TecnicosService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);
  private confirmationService = inject(ConfirmationService);

  tecnicos = signal<any[]>([]);
  loading = signal(true);

  // Autocomplete state
  autocompleteOptions = signal<AutocompleteOption[]>([]);
  autocompleteLoading = signal(false);

  columns: DataTableColumn[] = [
    { key: 'nombre', label: 'Nombre', sortable: true },
    { key: 'email', label: 'Email', sortable: true, hideOnMobile: true },
    { key: 'telefono', label: 'Teléfono', sortable: false, width: 'whitespace-nowrap', hideOnMobile: true },
    { key: 'especialidad', label: 'Especialidad', sortable: true },
    {
      key: 'activo',
      label: 'Estado',
      sortable: true,
      type: 'badge',
      format: (value) => value === 1 ? 'Activo' : 'Inactivo',
      width: 'w-1 whitespace-nowrap'
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

  // Delete Modal
  async openDeleteModal(tecnico: any) {
    const confirmed = await this.confirmationService.confirm({
      title: '¿Eliminar Técnico?',
      text: `Estás a punto de eliminar al técnico "${tecnico.nombre}". Esta acción no se puede deshacer.`,
      confirmButtonText: 'Sí, eliminar técnico',
      confirmButtonColor: '#dc2626'
    });

    if (confirmed) {
      this.tecnicosService.delete(tecnico.idTecnico).subscribe({
        next: () => {
          this.notificationService.success('Técnico eliminado correctamente');
          this.loadTecnicos();
        },
        error: (error) => {
          console.error('Error deleting tecnico:', error);
          this.notificationService.error(error.error?.message || 'Error al eliminar técnico');
        }
      });
    }
  }

  // Autocomplete methods
  onAutocompleteSearch(query: string): void {
    this.autocompleteLoading.set(true);
    this.tecnicosService.autocomplete(query).subscribe({
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
    this.router.navigate(['/tecnicos', option.id]);
  }

  onAutocompleteClear(): void {
    this.autocompleteOptions.set([]);
  }
}
