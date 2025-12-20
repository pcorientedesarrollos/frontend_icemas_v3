import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TiposEquipoService } from '../tipos-equipo.service';
import { NotificationService } from '../../../core/services/notification.service';
import { UniqueTipoEquipoNameValidator } from '../../../core/validators/unique-tipo-equipo-name.validator';

import { Location } from '@angular/common';

@Component({
    selector: 'app-tipo-equipo-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './tipo-equipo-form.component.html',
    styleUrl: './tipo-equipo-form.component.css'
})
export class TipoEquipoFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private tiposService = inject(TiposEquipoService);
    private notificationService = inject(NotificationService);
    private location = inject(Location);
    private uniqueNameValidator = inject(UniqueTipoEquipoNameValidator);

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
                this.notificationService.error('Error al cargar el tipo de equipo');
                this.router.navigate(['/catalogos/tipos-equipo']);
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
                this.router.navigate(['/catalogos/tipos-equipo']);
            },
            error: () => {
                this.notificationService.error('Error al guardar el tipo de equipo');
                this.saving.set(false);
            }
        });
    }

    onCancel(): void {
        this.location.back();
    }
}
