import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ClientesService } from '../clientes.service';
import { NotificationService } from '../../../core/services/notification.service';
import { UniqueClienteNameValidator } from '../../../core/validators/unique-cliente-name.validator';
import { forkJoin, switchMap, of, map, tap, catchError, finalize } from 'rxjs';

@Component({
  selector: 'app-cliente-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cliente-form.component.html',
  styleUrl: './cliente-form.component.css'
})
export class ClienteFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private clientesService = inject(ClientesService);
  private notificationService = inject(NotificationService);
  private uniqueNameValidator = inject(UniqueClienteNameValidator);
  private location = inject(Location);

  isEditMode = signal(false);
  saving = signal(false);
  clienteId: number | null = null;

  form: FormGroup = this.fb.group({
    nombre: [
      '',
      [Validators.required],
      [this.uniqueNameValidator.validate.bind(this.uniqueNameValidator)]
    ],
    empresa: ['', Validators.required],
    telefono: [''],
    sucursales: this.fb.array([]) // FormArray for dynamic sucursales
  });

  get sucursalesArray(): FormArray {
    return this.form.get('sucursales') as FormArray;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEditMode.set(true);
      this.clienteId = +id;
      this.loadCliente(this.clienteId);
    }
  }

  loadCliente(id: number): void {
    this.clientesService.getOne(id).subscribe({
      next: (cliente) => {
        this.form.patchValue({
          nombre: cliente.nombre,
          empresa: cliente.empresa,
          telefono: cliente.telefono || ''
        });
        // Note: We are not loading existing sucursales into the array for edit mode
        // as per the requirement to add them when *creating* (or adding new ones).
        // If needed, we could fetch and populate them here.
      },
      error: () => {
        this.notificationService.error('Error al cargar el cliente');
        this.router.navigate(['/clientes']);
      }
    });
  }

  addSucursal(): void {
    const sucursalGroup = this.fb.group({
      nombre: ['', Validators.required],
      direccion: [''],
      telefono: [''],
      contacto: ['']
    });
    this.sucursalesArray.push(sucursalGroup);
  }

  removeSucursal(index: number): void {
    this.sucursalesArray.removeAt(index);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const formValue = this.form.value;
    const clienteData = {
      nombre: formValue.nombre,
      empresa: formValue.empresa,
      telefono: formValue.telefono
    };
    const sucursalesData = formValue.sucursales || [];

    if (this.isEditMode()) {
      // Edit Mode: Update client only (for now)
      this.clientesService.update(this.clienteId!, clienteData).subscribe({
        next: () => {
          this.notificationService.success('Cliente actualizado correctamente');
          this.router.navigate(['/clientes']);
        },
        error: () => {
          this.notificationService.error('Error al actualizar el cliente');
          this.saving.set(false);
        }
      });
    } else {
      // Create Mode: Create Client -> Then Create Sucursales
      this.clientesService.create(clienteData).pipe(
        switchMap((nuevoCliente) => {
          if (sucursalesData.length === 0) {
            return of(nuevoCliente);
          }

          // Create array of sucursal creation observables
          const sucursalRequests = sucursalesData.map((s: any) =>
            this.clientesService.createSucursal(nuevoCliente.idCliente, s)
              .pipe(catchError(err => {
                console.error('Error creating sucursal:', err);
                return of(null); // Continue even if one fails
              }))
          );

          return forkJoin(sucursalRequests).pipe(
            map(() => nuevoCliente) // Return the client at the end
          );
        }),
        finalize(() => this.saving.set(false))
      ).subscribe({
        next: () => {
          const extraMsg = sucursalesData.length > 0 ? ' y sus sucursales' : '';
          this.notificationService.success(`Cliente${extraMsg} creado correctamente`);
          this.router.navigate(['/clientes']);
        },
        error: (err) => {
          console.error(err);
          this.notificationService.error('Error al crear el cliente');
        }
      });
    }
  }

  onCancel(): void {
    this.location.back();
  }
}
