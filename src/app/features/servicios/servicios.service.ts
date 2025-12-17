import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { CreateServicioDto, Servicio } from '../../core/interfaces';

@Injectable({
    providedIn: 'root'
})
export class ServiciosService {
    private api = inject(ApiService);

    getAll(filters?: any): Observable<Servicio[]> {
        return this.api.get<Servicio[]>('servicios', filters);
    }

    getOne(id: number): Observable<Servicio> {
        return this.api.get<Servicio>(`servicios/${id}`);
    }

    create(data: CreateServicioDto): Observable<Servicio> {
        return this.api.post<Servicio>('servicios', data);
    }

    update(id: number, data: Partial<CreateServicioDto>): Observable<Servicio> {
        return this.api.put<Servicio>(`servicios/${id}`, data);
    }

    delete(id: number): Observable<{ message: string }> {
        return this.api.delete<{ message: string }>(`servicios/${id}`);
    }

    getPendientes(): Observable<Servicio[]> {
        return this.api.get<Servicio[]>('servicios/pendientes');
    }

    getEnProceso(): Observable<Servicio[]> {
        return this.api.get<Servicio[]>('servicios/en-proceso');
    }

    getCompletados(): Observable<Servicio[]> {
        return this.api.get<Servicio[]>('servicios/completados');
    }

    getCancelados(): Observable<Servicio[]> {
        return this.api.get<Servicio[]>('servicios/cancelados');
    }

    saveSignature(id: number, signature: string): Observable<any> {
        return this.api.post(`servicios/${id}/firma`, { signature });
    }

    autocompleteId(term: string): Observable<any[]> {
        return this.api.get<any[]>('servicios/autocomplete/id', { term });
    }

    autocompleteCliente(term: string): Observable<string[]> {
        return this.api.get<string[]>('servicios/autocomplete/cliente', { term });
    }

    getTipos(): Observable<any[]> {
        return this.api.get<any[]>('servicios/tipos');
    }
}
