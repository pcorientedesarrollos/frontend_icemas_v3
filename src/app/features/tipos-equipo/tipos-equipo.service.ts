import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';

export interface TipoEquipo {
    idTipo: number;
    nombre: string;
    descripcion?: string;
}

export interface CreateTipoEquipoDto {
    nombre: string;
    descripcion?: string;
}

@Injectable({
    providedIn: 'root'
})
export class TiposEquipoService {
    private api = inject(ApiService);

    getAll(): Observable<TipoEquipo[]> {
        return this.api.get<TipoEquipo[]>('equipos/tipos');
    }

    getOne(id: number): Observable<TipoEquipo> {
        return this.api.get<TipoEquipo>(`equipos/tipos/${id}`);
    }

    create(data: CreateTipoEquipoDto): Observable<TipoEquipo> {
        return this.api.post<TipoEquipo>('equipos/tipos', data);
    }

    update(id: number, data: Partial<CreateTipoEquipoDto>): Observable<TipoEquipo> {
        return this.api.put<TipoEquipo>(`equipos/tipos/${id}`, data);
    }

    delete(id: number): Observable<{ message: string }> {
        return this.api.delete<{ message: string }>(`equipos/tipos/${id}`);
    }

    checkNombre(nombre: string): Observable<{ exists: boolean }> {
        return this.api.get<{ exists: boolean }>('equipos/tipos/check-nombre', { nombre }, { skipLoading: true });
    }
}
