import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment.development';
import { UserRole } from '../enums/user-role.enum';

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    name: string;
    email: string;
    password: string;
}

export interface AuthResponse {
    access_token: string;
    user: {
        id: number;
        name: string;
        email: string;
        role: UserRole;
    };
}

export interface User {
    id: number;
    name: string;
    email: string;
    role: UserRole;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private api = inject(ApiService);
    private router = inject(Router);

    isAuthenticated = signal(false);
    currentUser = signal<User | null>(null);

    constructor() {
        this.checkAuthStatus();
    }

    private checkAuthStatus(): void {
        const token = this.getToken();
        if (token) {
            this.isAuthenticated.set(true);
            // Optionally load user profile
            this.loadUserProfile();
        }
    }

    login(credentials: LoginCredentials): Observable<AuthResponse> {
        return this.api.post<AuthResponse>('auth/login', credentials).pipe(
            tap(response => {
                this.saveToken(response.access_token);
                this.currentUser.set(response.user);
                this.isAuthenticated.set(true);
                this.router.navigate(['/dashboard']);
            })
        );
    }

    register(data: RegisterData): Observable<User> {
        return this.api.post<User>('auth/register', data);
    }

    logout(): void {
        this.removeToken();
        this.isAuthenticated.set(false);
        this.currentUser.set(null);
        this.router.navigate(['/login']);
    }

    getToken(): string | null {
        if (typeof window !== 'undefined') {
            return localStorage.getItem(environment.jwtTokenKey);
        }
        return null;
    }

    private saveToken(token: string): void {
        if (typeof window !== 'undefined') {
            localStorage.setItem(environment.jwtTokenKey, token);
        }
    }

    private removeToken(): void {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(environment.jwtTokenKey);
        }
    }

    private loadUserProfile(): void {
        this.api.get<User>('auth/profile').subscribe({
            next: (user) => {
                this.currentUser.set(user);
            },
            error: () => {
                this.logout();
            }
        });
    }

    // Role helper methods
    hasRole(role: UserRole): boolean {
        const user = this.currentUser();
        return user?.role === role;
    }

    isAdmin(): boolean {
        return this.hasRole(UserRole.ADMINISTRADOR);
    }

    isTecnico(): boolean {
        return this.hasRole(UserRole.TECNICO);
    }
}
