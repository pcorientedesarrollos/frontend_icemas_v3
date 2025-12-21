import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
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

    getSignature(id: number): Observable<string> {
        // This would need a backend endpoint to retrieve the signature as base64
        // For now, we'll just return the firma field from getOne
        return new Observable(observer => {
            this.getOne(id).subscribe({
                next: (tecnico) => {
                    if (tecnico.firma) {
                        // TODO: Backend should provide an endpoint to get signature as base64
                        // For now, return empty or construct URL
                        observer.next(''); // Placeholder
                        observer.complete();
                    } else {
                        observer.next('');
                        observer.complete();
                    }
                },
                error: (err) => observer.error(err)
            });
        });
    }

    autocomplete(term: string): Observable<any[]> {
        return this.api.get<any[]>('tecnicos/autocomplete', { term });
    }
}
