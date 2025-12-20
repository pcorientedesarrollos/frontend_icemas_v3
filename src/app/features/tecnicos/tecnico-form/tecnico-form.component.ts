import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TecnicosService } from '../tecnicos.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
    selector: 'app-tecnico-form',
    imports: [CommonModule, ReactiveFormsModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './tecnico-form.component.html',
    styleUrl: './tecnico-form.component.css',
})
export class TecnicoFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private tecnicosService = inject(TecnicosService);
    private notificationService = inject(NotificationService);
    private location = inject(Location);

    isEditMode = signal(false);
    saving = signal(false);
    tecnicoId: number | null = null;

    form: FormGroup = this.fb.group({
        nombre: ['', Validators.required],
        telefono: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        especialidad: ['', Validators.required],
        activo: [1]
    });

    ngOnInit(): void {
        const id = this.route.snapshot.params['id'];
        if (id) {
            this.isEditMode.set(true);
            this.tecnicoId = +id;
            this.loadTecnico(this.tecnicoId);
        }
    }

    loadTecnico(id: number): void {
        this.tecnicosService.getOne(id).subscribe({
            next: (tecnico) => {
                this.form.patchValue({
                    nombre: tecnico.nombre,
                    telefono: tecnico.telefono,
                    email: tecnico.email,
                    especialidad: tecnico.especialidad,
                    activo: tecnico.activo
                });
            },
            error: () => {
                this.notificationService.error('Error al cargar el técnico');
                this.router.navigate(['/tecnicos']);
            }
        });
    }

    toggleActivo(): void {
        const current = this.form.get('activo')?.value;
        this.form.patchValue({ activo: current === 1 ? 0 : 1 });
    }

    onSubmit(): void {
        if (this.form.invalid) return;

        this.saving.set(true);
        const data = this.form.value;

        const request$ = this.isEditMode()
            ? this.tecnicosService.update(this.tecnicoId!, data)
            : this.tecnicosService.create(data);

        request$.subscribe({
            next: () => {
                this.notificationService.success(
                    this.isEditMode() ? 'Técnico actualizado correctamente' : 'Técnico creado correctamente'
                );
                this.router.navigate(['/tecnicos']);
            },
            error: () => {
                this.notificationService.error('Error al guardar el técnico');
                this.saving.set(false);
            }
        });
    }

    onCancel(): void {
        this.location.back();
    }
}
