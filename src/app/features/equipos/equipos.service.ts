import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { Equipo, CreateEquipoDto } from '../../core/interfaces';

@Injectable({
    providedIn: 'root'
})
export class EquiposService {
    private api = inject(ApiService);

    getAll(filters?: any): Observable<Equipo[]> {
        return this.api.get<Equipo[]>('equipos', filters);
    }

    getOne(id: number): Observable<Equipo> {
        return this.api.get<Equipo>(`equipos/${id}`);
    }

    create(data: CreateEquipoDto): Observable<Equipo> {
        return this.api.post<Equipo>('equipos', data);
    }

    update(id: number, data: Partial<CreateEquipoDto>): Observable<Equipo> {
        return this.api.put<Equipo>(`equipos/${id}`, data);
    }

    delete(id: number, force: boolean = false): Observable<{ message: string; serviciosEliminados?: number }> {
        const params = force ? { force: 'true' } : {};
        return this.api.delete<{ message: string; serviciosEliminados?: number }>(`equipos/${id}`, params);
    }

    getPorSucursal(idSucursal: number): Observable<Equipo[]> {
        return this.api.get<Equipo[]>(`equipos/por-sucursal/${idSucursal}`);
    }

    getServicios(id: number): Observable<any[]> {
        return this.api.get<any[]>(`equipos/${id}/servicios`);
    }

    getServiciosAsociados(id: number): Observable<{ count: number; servicios: any[] }> {
        return this.api.get<{ count: number; servicios: any[] }>(`equipos/${id}/servicios-asociados`);
    }

    // Marcas
    getMarcas(): Observable<any[]> {
        return this.api.get<any[]>('equipos/marcas');
    }

    // Tipos
    getTipos(): Observable<any[]> {
        return this.api.get<any[]>('equipos/tipos');
    }

    createTipo(data: { nombre: string }): Observable<any> {
        return this.api.post<any>('equipos/tipos', data);
    }

    autocomplete(term: string): Observable<any[]> {
        return this.api.get<any[]>('equipos/autocomplete/nombre', { term }, { skipLoading: true });
    }
}
