import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';

export interface TipoServicio {
    idTipoServicio: number;
    nombre: string;
    descripcion?: string;
}

export interface CreateTipoServicioDto {
    nombre: string;
    descripcion?: string;
}

@Injectable({
    providedIn: 'root'
})
export class TiposServicioService {
    private api = inject(ApiService);

    getAll(): Observable<TipoServicio[]> {
        return this.api.get<TipoServicio[]>('servicios/tipos');
    }

    getOne(id: number): Observable<TipoServicio> {
        return this.api.get<TipoServicio>(`servicios/tipos/${id}`);
    }

    create(data: CreateTipoServicioDto): Observable<TipoServicio> {
        return this.api.post<TipoServicio>('servicios/tipos', data);
    }

    update(id: number, data: Partial<CreateTipoServicioDto>): Observable<TipoServicio> {
        return this.api.put<TipoServicio>(`servicios/tipos/${id}`, data);
    }

    delete(id: number): Observable<{ message: string }> {
        return this.api.delete<{ message: string }>(`servicios/tipos/${id}`);
    }

    checkNombre(nombre: string): Observable<{ exists: boolean }> {
        return this.api.get<{ exists: boolean }>('servicios/tipos/check-nombre', { nombre }, { skipLoading: true });
    }
}
