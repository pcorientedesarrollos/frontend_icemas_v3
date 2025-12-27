import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MarcasService } from '../marcas.service';
import { NotificationService } from '../../../core/services/notification.service';
import { UniqueMarcaNameValidator } from '../../../core/validators/unique-marca-name.validator';

import { Location } from '@angular/common';

@Component({
    selector: 'app-marca-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './marca-form.component.html',
    styleUrl: './marca-form.component.css'
})
export class MarcaFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private marcasService = inject(MarcasService);
    private notificationService = inject(NotificationService);
    private location = inject(Location);
    private uniqueNameValidator = inject(UniqueMarcaNameValidator);

    isEditMode = signal(false);
    saving = signal(false);
    marcaId: number | null = null;

    form: FormGroup = this.fb.group({
        nombre: ['', Validators.required, [this.uniqueNameValidator.validate.bind(this.uniqueNameValidator)]],
        descripcion: ['']
    });

    ngOnInit(): void {
        const id = this.route.snapshot.params['id'];
        if (id) {
            this.isEditMode.set(true);
            this.marcaId = +id;
            this.loadMarca(this.marcaId);
        }
    }

    loadMarca(id: number): void {
        this.marcasService.getOne(id).subscribe({
            next: (marca) => {
                this.form.patchValue({
                    nombre: marca.nombre,
                    descripcion: marca.descripcion
                });
            },
            error: () => {
                this.notificationService.error('Error al cargar la marca');
                this.router.navigate(['/catalogos/marcas']);
            }
        });
    }

    onSubmit(): void {
        if (this.form.invalid) return;

        this.saving.set(true);
        const data = this.form.value;

        const request$ = this.isEditMode()
            ? this.marcasService.update(this.marcaId!, data)
            : this.marcasService.create(data);

        request$.subscribe({
            next: () => {
                this.notificationService.success(
                    this.isEditMode() ? 'Marca actualizada correctamente' : 'Marca creada correctamente'
                );
                this.router.navigate(['/catalogos/marcas']);
            },
            error: () => {
                this.notificationService.error('Error al guardar la marca');
                this.saving.set(false);
            }
        });
    }

    onCancel(): void {
        this.location.back();
    }
}
