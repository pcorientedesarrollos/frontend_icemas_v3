import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { CreateServicioDto, Servicio } from '../../core/interfaces';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ServiciosService {
    private api = inject(ApiService);
    private http = inject(HttpClient);

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

    saveTechnicianSignature(id: number, signature: string): Observable<any> {
        return this.api.post(`servicios/${id}/firma-tecnico`, { signature });
    }

    autocompleteId(term: string): Observable<any[]> {
        return this.api.get<any[]>('servicios/autocomplete/id', { term }, { skipLoading: true });
    }

    autocompleteCliente(term: string): Observable<string[]> {
        return this.api.get<string[]>('servicios/autocomplete/cliente', { term }, { skipLoading: true });
    }

    getTipos(): Observable<any[]> {
        return this.api.get<any[]>('servicios/tipos');
    }

    checkFolio(folio: string): Observable<{ exists: boolean }> {
        return this.api.get<{ exists: boolean }>('servicios/check-folio', { folio }, { skipLoading: true });
    }

    uploadPhoto(servicioId: number, file: File, tipo: string): Observable<any> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('tipo', tipo);
        return this.api.postFormData(`servicios/${servicioId}/fotos`, formData);
    }

    deletePhoto(photoId: number): Observable<any> {
        return this.api.delete(`servicios/fotos/${photoId}`);
    }

    getPhotos(servicioId: number): Observable<any[]> {
        return this.api.get<any[]>(`servicios/${servicioId}/fotos`);
    }

    sendPdf(servicioId: number): Observable<{ message: string; email: string }> {
        return this.api.post<{ message: string; email: string }>(`servicios/${servicioId}/send-pdf`, {});
    }

    exportData(): Observable<Blob> {
        return this.http.get(`${environment.apiUrl}/servicios/export`, { responseType: 'blob' });
    }
}
