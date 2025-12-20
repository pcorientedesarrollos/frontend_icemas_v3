import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { Cliente, CreateClienteDto, AutocompleteOption } from '../../core/interfaces';

@Injectable({
    providedIn: 'root'
})
export class ClientesService {
    private api = inject(ApiService);

    getAll(search?: string): Observable<Cliente[]> {
        const params = search ? { search } : {};
        return this.api.get<Cliente[]>('clientes', params);
    }

    getOne(id: number): Observable<Cliente> {
        return this.api.get<Cliente>(`clientes/${id}`);
    }

    create(data: CreateClienteDto): Observable<Cliente> {
        return this.api.post<Cliente>('clientes', data);
    }

    update(id: number, data: Partial<CreateClienteDto>): Observable<Cliente> {
        return this.api.put<Cliente>(`clientes/${id}`, data);
    }

    delete(id: number): Observable<{ message: string }> {
        return this.api.delete<{ message: string }>(`clientes/${id}`);
    }

    autocomplete(term: string): Observable<AutocompleteOption[]> {
        return this.api.get<AutocompleteOption[]>('clientes/autocomplete', { term });
    }

    checkNombre(nombre: string): Observable<{ exists: boolean }> {
        return this.api.get<{ exists: boolean }>('clientes/check-nombre', { nombre });
    }

    getSucursales(id: number): Observable<any[]> {
        return this.api.get<any[]>(`clientes/${id}/sucursales`);
    }

    createSucursal(idCliente: number, data: { nombre: string; direccion?: string }): Observable<any> {
        return this.api.post<any>('sucursales', { ...data, idCliente });
    }

    getServicios(id: number): Observable<any[]> {
        return this.api.get<any[]>(`clientes/${id}/servicios`);
    }

    getEquipos(id: number): Observable<any[]> {
        return this.api.get<any[]>(`clientes/${id}/equipos`);
    }
}

