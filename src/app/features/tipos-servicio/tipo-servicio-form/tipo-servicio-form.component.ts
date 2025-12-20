import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { TiposServicioService } from '../tipos-servicio.service';
import { NotificationService } from '../../../core/services/notification.service';
import { UniqueTipoServicioNameValidator } from '../../../core/validators/unique-tipo-servicio-name.validator';

import { Location } from '@angular/common';

@Component({
    selector: 'app-tipo-servicio-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './tipo-servicio-form.component.html',
    styleUrl: './tipo-servicio-form.component.css'
})
export class TipoServicioFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private tiposService = inject(TiposServicioService);
    private notificationService = inject(NotificationService);
    private uniqueNameValidator = inject(UniqueTipoServicioNameValidator);
    private location = inject(Location);

    isEditMode = signal(false);
    saving = signal(false);
    tipoId: number | null = null;

    form: FormGroup = this.fb.group({
        nombre: ['', Validators.required, [this.uniqueNameValidator.validate.bind(this.uniqueNameValidator)]],
        descripcion: ['']
    });

    ngOnInit(): void {
        const id = this.route.snapshot.params['id'];
        if (id) {
            this.isEditMode.set(true);
            this.tipoId = +id;
            this.loadTipo(this.tipoId);
        }
    }

    loadTipo(id: number): void {
        this.tiposService.getOne(id).subscribe({
            next: (tipo) => {
                this.form.patchValue({
                    nombre: tipo.nombre,
                    descripcion: tipo.descripcion || ''
                });
            },
            error: () => {
                this.notificationService.error('Error al cargar el tipo de servicio');
                this.router.navigate(['/catalogos/tipos-servicio']);
            }
        });
    }

    onSubmit(): void {
        if (this.form.invalid) return;

        this.saving.set(true);
        const data = this.form.value;

        const request$ = this.isEditMode()
            ? this.tiposService.update(this.tipoId!, data)
            : this.tiposService.create(data);

        request$.subscribe({
            next: () => {
                this.notificationService.success(
                    this.isEditMode() ? 'Tipo actualizado correctamente' : 'Tipo creado correctamente'
                );
                this.router.navigate(['/catalogos/tipos-servicio']);
            },
            error: () => {
                this.notificationService.error('Error al guardar el tipo de servicio');
                this.saving.set(false);
            }
        });
    }

    onCancel(): void {
        this.location.back();
    }
}
