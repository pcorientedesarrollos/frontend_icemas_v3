import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { TecnicosService } from '../tecnicos.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SignaturePadComponent } from '../../../shared/components/signature-pad/signature-pad.component';

@Component({
    selector: 'app-tecnico-form',
    imports: [CommonModule, ReactiveFormsModule, SignaturePadComponent],
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
    signatureData = signal<string | null>(null);
    showEditSignature = signal(false);

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

                // Load signature if exists
                if (tecnico.firma) {
                    // For stored signatures, we need to construct the full path
                    // The backend stores just the filename, we need to fetch it as base64
                    this.tecnicosService.getSignature(id).subscribe({
                        next: (signatureData) => {
                            this.signatureData.set(signatureData);
                        },
                        error: () => {
                            // Signature load failed, but don't block the form
                            console.warn('Failed to load technician signature');
                        }
                    });
                }
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
            next: (tecnico) => {
                const uploadTasks: Observable<any>[] = [];

                // Upload signature if present
                const signature = this.signatureData();
                const tecnicoId = this.isEditMode() ? this.tecnicoId! : tecnico.idTecnico;

                if (signature && tecnicoId) {
                    uploadTasks.push(
                        this.tecnicosService.saveSignature(tecnicoId, signature)
                    );
                }

                // If there are uploads, wait for them
                if (uploadTasks.length > 0) {
                    import('rxjs').then(({ forkJoin }) => {
                        forkJoin(uploadTasks).subscribe({
                            next: () => {
                                this.notificationService.success(
                                    this.isEditMode() ? 'Técnico actualizado correctamente' : 'Técnico creado correctamente'
                                );
                                this.router.navigate(['/tecnicos']);
                            },
                            error: () => {
                                this.notificationService.error('Técnico guardado pero error al subir firma');
                                this.saving.set(false);
                                this.router.navigate(['/tecnicos']);
                            }
                        });
                    });
                } else {
                    // No uploads needed
                    this.notificationService.success(
                        this.isEditMode() ? 'Técnico actualizado correctamente' : 'Técnico creado correctamente'
                    );
                    this.router.navigate(['/tecnicos']);
                }
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

    onSignatureSaved(signatureBase64: string): void {
        this.signatureData.set(signatureBase64);
        this.showEditSignature.set(false); // Cerrar editor
        this.notificationService.success('Firma capturada correctamente');

        // If editing, save signature to server immediately
        if (this.isEditMode() && this.tecnicoId) {
            this.tecnicosService.saveSignature(this.tecnicoId, signatureBase64).subscribe({
                next: () => {
                    this.notificationService.success('Firma guardada en el servidor');
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

    removeSignature(): void {
        if (confirm('¿Estás seguro de eliminar la firma del técnico?')) {
            if (this.isEditMode() && this.tecnicoId) {
                this.tecnicosService.deleteSignature(this.tecnicoId).subscribe({
                    next: () => {
                        this.signatureData.set(null);
                        this.notificationService.success('Firma eliminada correctamente');
                        this.showEditSignature.set(false);
                    },
                    error: () => {
                        this.notificationService.error('Error al eliminar la firma del servidor');
                    }
                });
            } else {
                this.signatureData.set(null);
                this.notificationService.success('Firma eliminada');
                this.showEditSignature.set(false);
            }
        }
    }

    cancelEditSignature(): void {
        this.showEditSignature.set(false);
    }
}
