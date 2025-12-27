import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { UsersService } from '../users.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { UserRole } from '../../../../core/enums/user-role.enum';

@Component({
    selector: 'app-user-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './user-form.component.html',
    styleUrl: './user-form.component.css'
})
export class UserFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private usersService = inject(UsersService);
    private notificationService = inject(NotificationService);
    private location = inject(Location);

    isEditMode = signal(false);
    saving = signal(false);
    showPassword = signal(false);
    userId: number | null = null;

    // Expose UserRole enum to template
    UserRole = UserRole;

    roles = [
        { value: UserRole.ADMINISTRADOR, label: 'Administrador' },
        { value: UserRole.TECNICO, label: 'Técnico' }
    ];

    form: FormGroup = this.fb.group({
        name: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        role: [UserRole.TECNICO, Validators.required]
    });

    ngOnInit(): void {
        const id = this.route.snapshot.params['id'];
        if (id) {
            this.isEditMode.set(true);
            this.userId = +id;
            this.loadUser(this.userId);
            // Make password optional in edit mode
            this.form.get('password')?.clearValidators();
            this.form.get('password')?.updateValueAndValidity();
        }
    }

    loadUser(id: number): void {
        this.usersService.getById(id).subscribe({
            next: (user) => {
                this.form.patchValue({
                    name: user.name,
                    email: user.email,
                    role: user.role
                });
            },
            error: () => {
                this.notificationService.error('Error al cargar el usuario');
                this.router.navigate(['/ajustes/usuarios']);
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

        // Remove password if it's empty in edit mode
        if (this.isEditMode() && !formValue.password) {
            delete formValue.password;
        }

        const request = this.isEditMode()
            ? this.usersService.update(this.userId!, formValue)
            : this.usersService.create(formValue);

        request.subscribe({
            next: () => {
                const action = this.isEditMode() ? 'actualizado' : 'creado';
                this.notificationService.success(`Usuario ${action} correctamente`);
                this.router.navigate(['/ajustes/usuarios']);
            },
            error: (error) => {
                const action = this.isEditMode() ? 'actualizar' : 'crear';
                const message = error.error?.message || `Error al ${action} el usuario`;
                this.notificationService.error(message);
                this.saving.set(false);
            }
        });
    }

    onCancel(): void {
        this.location.back();
    }

    togglePasswordVisibility(): void {
        this.showPassword.update(value => !value);
    }
}
