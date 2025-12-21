import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { EquiposService } from '../equipos.service';
import { ClientesService } from '../../clientes/clientes.service';
import { MarcasService } from '../../marcas/marcas.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { SearchableSelectComponent } from '../../../shared/components/searchable-select/searchable-select.component';

@Component({
  selector: 'app-equipo-form',
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, SearchableSelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './equipo-form.component.html',
  styleUrl: './equipo-form.component.css',
})
export class EquipoFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private equiposService = inject(EquiposService);
  private clientesService = inject(ClientesService);
  private marcasService = inject(MarcasService);
  private notificationService = inject(NotificationService);
  private location = inject(Location);

  isEditMode = signal(false);
  saving = signal(false);
  equipoId: number | null = null;

  // Quick-create modals
  showMarcaModal = signal(false);
  showClienteModal = signal(false);
  showSucursalModal = signal(false);

  // Quick-create form values
  newMarcaNombre = signal('');
  newClienteNombre = signal('');
  newClienteEmpresa = signal('');
  newSucursalNombre = signal('');

  // Quick-create saving states
  savingMarca = signal(false);
  savingCliente = signal(false);
  savingSucursal = signal(false);

  // Catalogs
  clientes = signal<any[]>([]);
  sucursales = signal<any[]>([]);
  marcas = signal<any[]>([]);
  tipos = signal<any[]>([]);

  form: FormGroup = this.fb.group({
    nombre: ['', Validators.required],
    modelo: ['', Validators.required],
    serie: [''],
    descripcion: [''],
    idMarca: ['', Validators.required],
    idTipo: ['', Validators.required],
    idCliente: ['', Validators.required],
    idSucursal: ['', Validators.required],
    estado: [1, Validators.required]
  });

  ngOnInit(): void {
    this.loadCatalogs();

    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEditMode.set(true);
      this.equipoId = +id;
      this.loadEquipo(this.equipoId);
    }
  }

  onCancel(): void {
    this.location.back();
  }

  loadCatalogs(): void {
    this.clientesService.getAll().subscribe({
      next: (data) => this.clientes.set(data),
      error: () => this.notificationService.error('Error al cargar clientes')
    });

    this.equiposService.getMarcas().subscribe({ // Keep as is... wait, I checked frontend service and it IS getMarcas()
      next: (data) => {
        this.marcas.set(data);
      },
      error: () => this.notificationService.error('Error al cargar marcas')
    });

    this.equiposService.getTipos().subscribe({
      next: (data) => this.tipos.set(data),
      error: () => this.notificationService.error('Error al cargar tipos')
    });
  }

  loadEquipo(id: number): void {
    this.equiposService.getOne(id).subscribe({
      next: (equipo) => {
        if (equipo.idCliente) {
          this.clientesService.getSucursales(equipo.idCliente).subscribe({
            next: (sucursales) => this.sucursales.set(sucursales)
          });
        }

        this.form.patchValue({
          nombre: equipo.nombre,
          modelo: equipo.modelo,
          serie: equipo.serie || '',
          descripcion: equipo.descripcion || '',
          idMarca: equipo.idMarca,
          idTipo: equipo.idTipo,
          idCliente: equipo.idCliente,
          idSucursal: equipo.idSucursal,
          estado: equipo.estado
        });
      },
      error: () => {
        this.notificationService.error('Error al cargar el equipo');
        this.router.navigate(['/equipos']);
      }
    });
  }

  onClienteChange(): void {
    const idCliente = this.form.get('idCliente')?.value;
    this.form.patchValue({ idSucursal: '' });
    this.sucursales.set([]);

    if (idCliente) {
      this.form.get('idSucursal')?.enable();
      this.clientesService.getSucursales(+idCliente).subscribe({
        next: (data) => {
          this.sucursales.set(data);
          if (data.length === 0) {
            this.form.get('idSucursal')?.disable();
          }
        },
        error: () => {
          this.notificationService.error('Error al cargar sucursales');
          this.form.get('idSucursal')?.disable();
        }
      });
    } else {
      this.form.get('idSucursal')?.disable();
    }
  }

  // Quick-create Marca methods
  openMarcaModal(): void {
    this.newMarcaNombre.set('');
    this.showMarcaModal.set(true);
  }

  closeMarcaModal(): void {
    this.showMarcaModal.set(false);
  }

  createMarcaRapida(): void {
    const nombre = this.newMarcaNombre().trim();
    if (!nombre) {
      this.notificationService.error('El nombre de la marca es requerido');
      return;
    }

    this.savingMarca.set(true);
    this.marcasService.create({ nombre }).subscribe({
      next: (nuevaMarca) => {
        this.marcas.update(list => [...list, nuevaMarca]);
        this.form.patchValue({ idMarca: nuevaMarca.idMarca });
        this.notificationService.success(`Marca "${nombre}" creada y seleccionada`);
        this.closeMarcaModal();
        this.savingMarca.set(false);
      },
      error: () => {
        this.notificationService.error('Error al crear la marca');
        this.savingMarca.set(false);
      }
    });
  }

  // Quick-create Cliente methods
  openClienteModal(): void {
    this.newClienteNombre.set('');
    this.newClienteEmpresa.set('');
    this.showClienteModal.set(true);
  }

  closeClienteModal(): void {
    this.showClienteModal.set(false);
  }

  createClienteRapido(): void {
    const nombre = this.newClienteNombre().trim();
    if (!nombre) {
      this.notificationService.error('El nombre del cliente es requerido');
      return;
    }

    this.savingCliente.set(true);
    this.clientesService.create({
      nombre,
      empresa: this.newClienteEmpresa().trim() || nombre
    }).subscribe({
      next: (nuevoCliente) => {
        this.clientes.update(list => [...list, nuevoCliente]);
        this.form.patchValue({ idCliente: nuevoCliente.idCliente, idSucursal: '' });
        this.sucursales.set([]);
        this.notificationService.success(`Cliente "${nombre}" creado y seleccionado`);
        this.closeClienteModal();
        this.savingCliente.set(false);
      },
      error: () => {
        this.notificationService.error('Error al crear el cliente');
        this.savingCliente.set(false);
      }
    });
  }

  // Quick-create Sucursal methods
  openSucursalModal(): void {
    if (!this.form.get('idCliente')?.value) {
      this.notificationService.error('Primero seleccione un cliente');
      return;
    }
    this.newSucursalNombre.set('');
    this.showSucursalModal.set(true);
  }

  closeSucursalModal(): void {
    this.showSucursalModal.set(false);
  }

  createSucursalRapida(): void {
    const nombre = this.newSucursalNombre().trim();
    const idCliente = +this.form.get('idCliente')?.value;

    if (!nombre) {
      this.notificationService.error('El nombre de la sucursal es requerido');
      return;
    }

    this.savingSucursal.set(true);
    this.clientesService.createSucursal(idCliente, { nombre }).subscribe({
      next: (nuevaSucursal) => {
        this.sucursales.update(list => [...list, nuevaSucursal]);
        this.form.patchValue({ idSucursal: nuevaSucursal.idSucursal });
        this.notificationService.success(`Sucursal "${nombre}" creada y seleccionada`);
        this.closeSucursalModal();
        this.savingSucursal.set(false);
      },
      error: () => {
        this.notificationService.error('Error al crear la sucursal');
        this.savingSucursal.set(false);
      }
    });
  }



  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const formValue = this.form.value;

    const data = {
      ...formValue,
      idMarca: +formValue.idMarca,
      idTipo: +formValue.idTipo,
      idCliente: +formValue.idCliente,
      idSucursal: +formValue.idSucursal,
      estado: +formValue.estado
    };

    const request$ = this.isEditMode()
      ? this.equiposService.update(this.equipoId!, data)
      : this.equiposService.create(data);

    request$.subscribe({
      next: () => {
        this.notificationService.success(
          this.isEditMode() ? 'Equipo actualizado correctamente' : 'Equipo creado correctamente'
        );
        this.router.navigate(['/equipos']);
      },
      error: () => {
        this.notificationService.error('Error al guardar el equipo');
        this.saving.set(false);
      }
    });
  }


}
