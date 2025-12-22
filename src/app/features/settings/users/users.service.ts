import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { UserRole } from '../../../core/enums/user-role.enum';

export interface User {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    createdAt: string;
    updatedAt: string;
}

export interface CreateUserDto {
    name: string;
    email: string;
    password: string;
    role: UserRole;
}

export interface UpdateUserDto {
    name?: string;
    email?: string;
    password?: string;
    role?: UserRole;
}

@Injectable({
    providedIn: 'root'
})
export class UsersService {
    private api = inject(ApiService);

    getAll(): Observable<User[]> {
        return this.api.get<User[]>('users');
    }

    getById(id: number): Observable<User> {
        return this.api.get<User>(`users/${id}`);
    }

    create(data: CreateUserDto): Observable<User> {
        return this.api.post<User>('users', data);
    }

    update(id: number, data: UpdateUserDto): Observable<User> {
        return this.api.patch<User>(`users/${id}`, data);
    }

    delete(id: number): Observable<void> {
        return this.api.delete<void>(`users/${id}`);
    }
}
