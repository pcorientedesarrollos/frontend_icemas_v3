import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { Tecnico, CreateTecnicoDto } from '../../core/interfaces';

@Injectable({
    providedIn: 'root'
})
export class TecnicosService {
    private api = inject(ApiService);

    getAll(): Observable<Tecnico[]> {
        return this.api.get<Tecnico[]>('tecnicos');
    }

    getOne(id: number): Observable<Tecnico> {
        return this.api.get<Tecnico>(`tecnicos/${id}`);
    }

    create(data: CreateTecnicoDto): Observable<Tecnico> {
        return this.api.post<Tecnico>('tecnicos', data);
    }

    update(id: number, data: Partial<CreateTecnicoDto>): Observable<Tecnico> {
        return this.api.put<Tecnico>(`tecnicos/${id}`, data);
    }

    delete(id: number): Observable<{ message: string }> {
        return this.api.delete<{ message: string }>(`tecnicos/${id}`);
    }

    getServicios(id: number): Observable<any[]> {
        return this.api.get<any[]>(`tecnicos/${id}/servicios`);
    }

    saveSignature(id: number, signatureBase64: string): Observable<any> {
        return this.api.post<any>(`tecnicos/${id}/firma`, { signature: signatureBase64 });
    }

    deleteSignature(id: number): Observable<any> {
        return this.api.delete<any>(`tecnicos/${id}/firma`);
    }

    getSignature(id: number): Observable<string> {
        return this.api.get<{ signature: string }>(`tecnicos/${id}/firma`).pipe(
            map(response => response.signature)
        );
    }

    autocomplete(term: string): Observable<any[]> {
        return this.api.get<any[]>('tecnicos/autocomplete', { term }, { skipLoading: true });
    }
}
