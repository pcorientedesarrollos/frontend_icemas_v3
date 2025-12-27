import { Component, inject, signal, OnInit, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { ServiciosService } from '../servicios.service';
import { ClientesService } from '../../clientes/clientes.service';
import { TecnicosService } from '../../tecnicos/tecnicos.service';
import { EquiposService } from '../../equipos/equipos.service';
import { TiposServicioService } from '../../tipos-servicio/tipos-servicio.service';
import { MarcasService } from '../../marcas/marcas.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SignaturePadComponent } from '../../../shared/components/signature-pad/signature-pad.component';
import { PhotoCaptureComponent, ServicePhoto } from '../../../shared/components/photo-capture/photo-capture.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { UniqueFolioValidator } from '../../../core/validators/unique-folio.validator';
import { SearchableSelectComponent } from '../../../shared/components/searchable-select/searchable-select.component';

@Component({
  selector: 'app-servicio-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SignaturePadComponent, PhotoCaptureComponent, ModalComponent, SearchableSelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './servicio-form.component.html',
  styleUrl: './servicio-form.component.css'
})
export class ServicioFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private serviciosService = inject(ServiciosService);
  private clientesService = inject(ClientesService);
  private tecnicosService = inject(TecnicosService);
  private equiposService = inject(EquiposService);
  private tiposServicioService = inject(TiposServicioService);
  private marcasService = inject(MarcasService);
  private notificationService = inject(NotificationService);
  private uniqueFolioValidator = inject(UniqueFolioValidator);
  private destroyRef = inject(DestroyRef);

  isEditMode = signal(false);
  saving = signal(false);
  servicioId: number | null = null;
  signatureData = signal<string | null>(null);
  servicePhotos = signal<ServicePhoto[]>([]);

  // Quick-create modals
  showClienteModal = signal(false);
  showSucursalModal = signal(false);
  showEquipoModal = signal(false);
  showMarcaModal = signal(false);
  showEditEquipoModal = signal(false); // Modal para editar equipo existente

  // Quick-create form values
  newClienteNombre = signal('');
  newClienteEmpresa = signal('');
  newSucursalNombre = signal('');
  newEquipoNombre = signal('');
  newEquipoModelo = signal('');
  newEquipoSerie = signal('');
  newEquipoDescripcion = signal('');
  newEquipoIdMarca = signal<number | ''>('');
  newEquipoIdTipo = signal<number | ''>('');
  newMarcaNombre = signal('');

  // Edit equipo form values
  editEquipoId = signal<number | null>(null);
  editEquipoNombre = signal('');
  editEquipoModelo = signal('');
  editEquipoSerie = signal('');
  editEquipoDescripcion = signal('');
  editEquipoIdMarca = signal<number | ''>('');
  editEquipoIdTipo = signal<number | ''>('');

  // Quick-create saving states
  savingCliente = signal(false);
  savingSucursal = signal(false);
  savingEquipo = signal(false);
  savingMarca = signal(false);
  savingEditEquipo = signal(false);

  // Catalogs
  clientes = signal<any[]>([]);
  sucursales = signal<any[]>([]);
  equipos = signal<any[]>([]);
  tecnicos = signal<any[]>([]);
  tiposServicio = signal<any[]>([]);
  marcas = signal<any[]>([]);
  tiposEquipo = signal<any[]>([]);

  // Multi-equipment selection
  selectedEquipos = signal<number[]>([]);

  form: FormGroup = this.fb.group({
    folio: [''], // Optional for new, populated for edit
    fechaServicio: ['', Validators.required],
    estado: ['Pendiente', Validators.required],
    idCliente: ['', Validators.required],
    idSucursal: ['', Validators.required],
    // idEquipo removed - now using selectedEquipos signal
    idTecnico: ['', Validators.required],
    idTipoServicio: ['', Validators.required],
    descripcion: [''],
    detalleTrabajo: ['']
  });

  ngOnInit(): void {
    this.loadCatalogs();

    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEditMode.set(true);
      this.servicioId = +id;
      this.loadServicio(this.servicioId);
    } else {
      // Set today's date as default
      const today = new Date().toISOString().split('T')[0];
      this.form.patchValue({ fechaServicio: today });

      // Add async validator for folio uniqueness only in create mode
      this.form.get('folio')?.addAsyncValidators(
        this.uniqueFolioValidator.validate.bind(this.uniqueFolioValidator)
      );
    }
  }

  loadCatalogs(): void {
    this.clientesService.getAll('')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => this.clientes.set(data),
        error: () => this.notificationService.error('Error al cargar clientes')
      });

    this.tecnicosService.getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => this.tecnicos.set(data.filter((t: any) => t.activo === 1)),
        error: () => this.notificationService.error('Error al cargar técnicos')
      });

    this.tiposServicioService.getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => this.tiposServicio.set(data),
        error: () => this.notificationService.error('Error al cargar tipos de servicio')
      });

    this.marcasService.getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => this.marcas.set(data),
        error: () => this.notificationService.error('Error al cargar marcas')
      });

    this.equiposService.getTipos()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => this.tiposEquipo.set(data),
        error: () => this.notificationService.error('Error al cargar tipos de equipo')
      });
  }

  // Quick-create Cliente
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
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (nuevoCliente) => {
          this.clientes.update(list => [...list, nuevoCliente]);
          this.form.patchValue({ idCliente: nuevoCliente.idCliente });
          this.onClienteChange();
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

  // Quick-create Sucursal
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
    this.clientesService.createSucursal(idCliente, { nombre })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (nuevaSucursal) => {
          this.sucursales.update(list => [...list, nuevaSucursal]);
          this.form.patchValue({ idSucursal: nuevaSucursal.idSucursal, idEquipo: '' });
          this.equipos.set([]);
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

  // Quick-create Equipo
  openEquipoModal(): void {
    const idSucursal = this.form.get('idSucursal')?.value;
    if (!idSucursal) {
      this.notificationService.error('Primero seleccione un cliente y una sucursal');
      return;
    }
    this.newEquipoNombre.set('');
    this.newEquipoModelo.set('');
    this.newEquipoSerie.set('');
    this.newEquipoDescripcion.set('');
    this.newEquipoIdMarca.set('');
    this.newEquipoIdTipo.set('');
    this.showEquipoModal.set(true);
  }

  closeEquipoModal(): void {
    this.showEquipoModal.set(false);
  }

  createEquipoRapido(): void {
    const nombre = this.newEquipoNombre().trim();
    const modelo = this.newEquipoModelo().trim();
    const idMarca = this.newEquipoIdMarca();
    const idTipo = this.newEquipoIdTipo();
    const idCliente = +this.form.get('idCliente')?.value;
    const idSucursal = +this.form.get('idSucursal')?.value;

    if (!nombre || !modelo || !idMarca || !idTipo) {
      this.notificationService.error('Nombre, modelo, marca y tipo son requeridos');
      return;
    }

    this.savingEquipo.set(true);
    this.equiposService.create({
      nombre,
      modelo,
      serie: this.newEquipoSerie().trim() || undefined,
      descripcion: this.newEquipoDescripcion().trim() || undefined,
      idMarca: +idMarca,
      idTipo: +idTipo,
      idCliente,
      idSucursal,
      estado: 1
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (nuevoEquipo) => {
          this.equipos.update(list => [...list, nuevoEquipo]);
          this.form.patchValue({ idEquipo: nuevoEquipo.idEquipo });
          this.notificationService.success(`Equipo "${nombre}" creado y seleccionado`);
          this.closeEquipoModal();
          this.savingEquipo.set(false);
        },
        error: () => {
          this.notificationService.error('Error al crear el equipo');
          this.savingEquipo.set(false);
        }
      });
  }

  // Quick-create Marca (from within Equipo modal)
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
    this.marcasService.create({ nombre })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (nuevaMarca) => {
          this.marcas.update(list => [...list, nuevaMarca]);
          this.newEquipoIdMarca.set(nuevaMarca.idMarca);
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

  loadServicio(id: number): void {
    this.serviciosService.getOne(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (servicio) => {
          // Load dependent selects first
          if (servicio.idCliente) {
            this.clientesService.getSucursales(servicio.idCliente)
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe({
                next: (sucursales) => {
                  this.sucursales.set(sucursales);
                  if (servicio.idSucursal) {
                    this.equiposService.getPorSucursal(servicio.idSucursal)
                      .pipe(takeUntilDestroyed(this.destroyRef))
                      .subscribe({
                        next: (equipos) => this.equipos.set(equipos)
                      });
                  }
                }
              });
          }

          // Format date for input
          const fecha = servicio.fechaServicio
            ? new Date(servicio.fechaServicio).toISOString().split('T')[0]
            : '';

          this.form.patchValue({
            folio: servicio.folio,
            fechaServicio: fecha,
            estado: servicio.estado,
            idCliente: servicio.idCliente,
            idSucursal: servicio.idSucursal,
            // idEquipo removed - using selectedEquipos
            idTecnico: servicio.idTecnico,
            idTipoServicio: servicio.idTipoServicio,
            descripcion: servicio.descripcion || '',
            detalleTrabajo: servicio.detalleTrabajo || ''
          });

          // Load selected equipos from equiposAsignados
          if (servicio.equiposAsignados && servicio.equiposAsignados.length > 0) {
            const equipoIds = servicio.equiposAsignados.map((ea: any) => ea.idEquipo);
            this.selectedEquipos.set(equipoIds);
          }

          // Load signature if exists
          if (servicio.firma) {
            this.signatureData.set(servicio.firma);
          }

          // Load photos if exist
          if (servicio.fotos && servicio.fotos.length > 0) {
            const photos: ServicePhoto[] = servicio.fotos.map((foto: any) => ({
              id: foto.id,
              url: foto.url,
              tipo: foto.tipo || 'antes',
              descripcion: foto.descripcion
            }));
            this.servicePhotos.set(photos);
          }
        },
        error: () => {
          this.notificationService.error('Error al cargar el servicio');
          this.router.navigate(['/servicios']);
        }
      });
  }

  onClienteChange(): void {
    const idCliente = this.form.get('idCliente')?.value;
    this.form.patchValue({ idSucursal: '' });
    this.selectedEquipos.set([]); // Clear equipment selection
    this.sucursales.set([]);
    this.equipos.set([]);

    if (idCliente) {
      this.clientesService.getSucursales(+idCliente)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data) => this.sucursales.set(data),
          error: () => this.notificationService.error('Error al cargar sucursales')
        });
    }
  }

  onSucursalChange(): void {
    const idSucursal = this.form.get('idSucursal')?.value;
    this.selectedEquipos.set([]); // Clear equipment selection
    this.equipos.set([]);

    if (idSucursal) {
      this.equiposService.getPorSucursal(+idSucursal)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data) => this.equipos.set(data),
          error: () => this.notificationService.error('Error al cargar equipos')
        });
    }
  }

  toggleEquipo(idEquipo: number): void {
    const current = this.selectedEquipos();
    if (current.includes(idEquipo)) {
      // Deselect
      this.selectedEquipos.set(current.filter(id => id !== idEquipo));
    } else {
      // Select
      this.selectedEquipos.set([...current, idEquipo]);
    }
  }

  editEquipo(idEquipo: number): void {
    // Buscar el equipo en la lista actual
    const equipo = this.equipos().find(e => e.idEquipo === idEquipo);
    if (!equipo) return;

    // Cargar datos del equipo en el modal de edición
    this.editEquipoId.set(equipo.idEquipo);
    this.editEquipoNombre.set(equipo.nombre || '');
    this.editEquipoModelo.set(equipo.modelo || '');
    this.editEquipoSerie.set(equipo.serie || '');
    this.editEquipoDescripcion.set(equipo.descripcion || '');
    this.editEquipoIdMarca.set(equipo.idMarca || '');
    this.editEquipoIdTipo.set(equipo.idTipo || '');

    // Abrir modal
    this.showEditEquipoModal.set(true);
  }

  closeEditEquipoModal(): void {
    this.showEditEquipoModal.set(false);
    this.editEquipoId.set(null);
    this.editEquipoNombre.set('');
    this.editEquipoModelo.set('');
    this.editEquipoSerie.set('');
    this.editEquipoDescripcion.set('');
    this.editEquipoIdMarca.set('');
    this.editEquipoIdTipo.set('');
  }

  updateEquipo(): void {
    const id = this.editEquipoId();
    const nombre = this.editEquipoNombre().trim();
    const modelo = this.editEquipoModelo().trim();
    const idMarca = this.editEquipoIdMarca();
    const idTipo = this.editEquipoIdTipo();

    if (!id || !nombre || !modelo || !idMarca || !idTipo) {
      this.notificationService.error('Nombre, modelo, marca y tipo son requeridos');
      return;
    }

    this.savingEditEquipo.set(true);
    const idSucursal = +this.form.get('idSucursal')?.value;
    const idCliente = +this.form.get('idCliente')?.value;

    this.equiposService.update(id, {
      nombre,
      modelo,
      serie: this.editEquipoSerie().trim() || undefined,
      descripcion: this.editEquipoDescripcion().trim() || undefined,
      idMarca: +idMarca,
      idTipo: +idTipo,
      idCliente,
      idSucursal,
      estado: 1
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (equipoActualizado) => {
          // Actualizar la lista de equipos
          this.equipos.update(list =>
            list.map(e => e.idEquipo === id ? equipoActualizado : e)
          );
          this.notificationService.success(`Equipo "${nombre}" actualizado correctamente`);
          this.closeEditEquipoModal();
          this.savingEditEquipo.set(false);
        },
        error: () => {
          this.notificationService.error('Error al actualizar el equipo');
          this.savingEditEquipo.set(false);
        }
      });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    // Validate equipment selection
    if (this.selectedEquipos().length === 0) {
      this.notificationService.error('Selecciona al menos un equipo');
      return;
    }

    this.saving.set(true);
    const formValue = this.form.value;

    // Don't send firma or fotos here - they have separate endpoints
    const data = {
      ...formValue,
      idCliente: +formValue.idCliente,
      idSucursal: +formValue.idSucursal,
      idsEquipos: this.selectedEquipos(), // Send equipment array
      idTecnico: +formValue.idTecnico,
      idTipoServicio: +formValue.idTipoServicio,
    };

    const request$ = this.isEditMode()
      ? this.serviciosService.update(this.servicioId!, data)
      : this.serviciosService.create(data);

    request$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (servicio) => {
          const uploadTasks: Observable<any>[] = [];

          // Upload signature if present
          const signature = this.signatureData();
          if (signature && servicio.idServicio) {
            uploadTasks.push(
              this.serviciosService.saveSignature(servicio.idServicio, signature)
            );
          }

          // Upload photos if any
          const photos = this.servicePhotos();
          if (photos.length > 0 && servicio.idServicio) {
            const photoUploads = photos
              .filter(p => p.file) // Only upload new photos that have file data
              .map(photo =>
                this.serviciosService.uploadPhoto(servicio.idServicio, photo.file!, photo.tipo)
              );
            uploadTasks.push(...photoUploads);
          }

          // If there are uploads, wait for them
          if (uploadTasks.length > 0) {
            import('rxjs').then(({ forkJoin }) => {
              forkJoin(uploadTasks)
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({
                  next: () => {
                    this.notificationService.success(
                      this.isEditMode() ? 'Servicio actualizado correctamente' : 'Servicio creado correctamente'
                    );
                    // After update, go to detail; after create, go to list
                    if (this.isEditMode()) {
                      this.router.navigate(['/servicios', servicio.idServicio]);
                    } else {
                      this.router.navigate(['/servicios']);
                    }
                  },
                  error: () => {
                    this.notificationService.error('Servicio guardado pero error al subir archivos');
                    this.saving.set(false);
                    // Even on error, redirect to detail if editing
                    if (this.isEditMode()) {
                      this.router.navigate(['/servicios', servicio.idServicio]);
                    } else {
                      this.router.navigate(['/servicios']);
                    }
                  }
                });
            });
          } else {
            // No uploads needed
            this.notificationService.success(
              this.isEditMode() ? 'Servicio actualizado correctamente' : 'Servicio creado correctamente'
            );
            // After update, go to detail; after create, go to list
            if (this.isEditMode()) {
              this.router.navigate(['/servicios', servicio.idServicio]);
            } else {
              this.router.navigate(['/servicios']);
            }
          }
        },
        error: () => {
          this.notificationService.error('Error al guardar el servicio');
          this.saving.set(false);
        }
      });
  }

  onCancel(): void {
    this.location.back();
  }

  onSignatureSaved(signatureBase64: string): void {
    this.signatureData.set(signatureBase64);

    // Automatically mark service as Completado when client signs
    this.form.patchValue({ estado: 'Completado' });
    this.notificationService.success('Firma capturada - Servicio marcado como Completado');

    // If editing, save signature to server and update status
    if (this.isEditMode() && this.servicioId) {
      this.serviciosService.saveSignature(this.servicioId, signatureBase64)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            // Also update the status on the server
            this.serviciosService.update(this.servicioId!, { estado: 'Completado' })
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe({
                next: () => {
                  this.notificationService.success('Firma guardada y servicio completado');
                },
                error: () => {
                  this.notificationService.error('Firma guardada pero error al actualizar estado');
                }
              });
          },
          error: () => {
            this.notificationService.error('Error al guardar la firma');
          }
        });
    }
  }

  onSignatureCleared(): void {
    this.signatureData.set(null);
  }

  // Photo handlers
  onPhotosChanged(photos: ServicePhoto[]): void {
    this.servicePhotos.set(photos);
  }

  onPhotoAdded(photo: ServicePhoto): void {
    // Upload photo immediately if in edit mode
    if (this.isEditMode() && this.servicioId && photo.file) {
      this.serviciosService.uploadPhoto(this.servicioId, photo.file, photo.tipo)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (result) => {
            this.notificationService.success('Foto subida correctamente');
            // Mark photo as uploaded by adding the id
            const photos = this.servicePhotos();
            const photoIndex = photos.findIndex(p => p === photo);
            if (photoIndex !== -1) {
              photos[photoIndex] = { ...photo, id: result.id, file: undefined };
              this.servicePhotos.set([...photos]);
            }
          },
          error: () => {
            this.notificationService.error('Error al subir la foto');
          }
        });
    }
  }

  onPhotoRemoved(photo: ServicePhoto): void {
    if (photo.id && this.isEditMode()) {
      this.serviciosService.deletePhoto(photo.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.notificationService.success('Foto eliminada');
          },
          error: () => {
            this.notificationService.error('Error al eliminar la foto');
          }
        });
    }
  }
}
