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

    delete(id: number): Observable<{ message: string }> {
        return this.api.delete<{ message: string }>(`equipos/${id}`);
    }

    getPorSucursal(idSucursal: number): Observable<Equipo[]> {
        return this.api.get<Equipo[]>(`equipos/por-sucursal/${idSucursal}`);
    }

    getServicios(id: number): Observable<any[]> {
        return this.api.get<any[]>(`equipos/${id}/servicios`);
    }
}
