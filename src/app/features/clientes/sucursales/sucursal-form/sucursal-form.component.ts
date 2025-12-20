import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { SucursalesService } from '../sucursales.service';
import { ClientesService } from '../../clientes.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { SearchableSelectComponent } from '../../../../shared/components/searchable-select/searchable-select.component';

@Component({
  selector: 'app-sucursal-form',
  imports: [CommonModule, ReactiveFormsModule, SearchableSelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sucursal-form.component.html',
  styleUrl: './sucursal-form.component.css',
})
export class SucursalFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private sucursalesService = inject(SucursalesService);
  private clientesService = inject(ClientesService);
  private notificationService = inject(NotificationService);
  private location = inject(Location);

  isEditMode = signal(false);
  saving = signal(false);
  sucursalId: number | null = null;
  preselectedClienteId = signal<number | null>(null);

  clientes = signal<any[]>([]);

  form: FormGroup = this.fb.group({
    idCliente: ['', Validators.required],
    nombre: ['', Validators.required],
    direccion: [''],
    telefono: [''],
    contacto: ['']
  });

  ngOnInit(): void {
    // Check for preselected cliente from query params
    const clienteId = this.route.snapshot.queryParams['clienteId'];
    if (clienteId) {
      this.preselectedClienteId.set(+clienteId);
      this.form.patchValue({ idCliente: +clienteId });
    }

    this.loadClientes();

    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEditMode.set(true);
      this.sucursalId = +id;
      this.loadSucursal(this.sucursalId);
    }
  }

  loadClientes(): void {
    this.clientesService.getAll().subscribe({
      next: (data) => this.clientes.set(data),
      error: () => this.notificationService.error('Error al cargar clientes')
    });
  }

  loadSucursal(id: number): void {
    this.sucursalesService.getOne(id).subscribe({
      next: (sucursal) => {
        this.form.patchValue({
          idCliente: sucursal.idCliente,
          nombre: sucursal.nombre,
          direccion: sucursal.direccion || '',
          telefono: sucursal.telefono || '',
          contacto: sucursal.contacto || ''
        });
        this.preselectedClienteId.set(sucursal.idCliente);
      },
      error: () => {
        this.notificationService.error('Error al cargar la sucursal');
        this.router.navigate(['/sucursales']);
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.saving.set(true);
    const formValue = this.form.value;

    const data = {
      ...formValue,
      idCliente: +formValue.idCliente
    };

    const request$ = this.isEditMode()
      ? this.sucursalesService.update(this.sucursalId!, data)
      : this.sucursalesService.create(data);

    request$.subscribe({
      next: () => {
        this.notificationService.success(
          this.isEditMode() ? 'Sucursal actualizada correctamente' : 'Sucursal creada correctamente'
        );

        // Navigate back based on context
        const clienteId = this.preselectedClienteId();
        if (clienteId) {
          this.router.navigate(['/clientes', clienteId]);
        } else {
          this.router.navigate(['/sucursales']);
        }
      },
      error: () => {
        this.notificationService.error('Error al guardar la sucursal');
        this.saving.set(false);
      }
    });
  }

  onCancel() {
    this.location.back();
  }
}
