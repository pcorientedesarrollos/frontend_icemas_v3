import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';

export interface Marca {
    idMarca: number;
    nombre: string;
    descripcion?: string;
}

export interface CreateMarcaDto {
    nombre: string;
}

@Injectable({
    providedIn: 'root'
})
export class MarcasService {
    private api = inject(ApiService);

    getAll(): Observable<Marca[]> {
        return this.api.get<Marca[]>('equipos/marcas');
    }

    getOne(id: number): Observable<Marca> {
        return this.api.get<Marca>(`equipos/marcas/${id}`);
    }

    create(data: CreateMarcaDto): Observable<Marca> {
        return this.api.post<Marca>('equipos/marcas', data);
    }

    update(id: number, data: Partial<CreateMarcaDto>): Observable<Marca> {
        return this.api.put<Marca>(`equipos/marcas/${id}`, data);
    }

    delete(id: number): Observable<{ message: string }> {
        return this.api.delete<{ message: string }>(`equipos/marcas/${id}`);
    }

    checkNombre(nombre: string): Observable<{ exists: boolean }> {
        return this.api.get<{ exists: boolean }>('equipos/marcas/check-nombre', { nombre }, { skipLoading: true });
    }
}
