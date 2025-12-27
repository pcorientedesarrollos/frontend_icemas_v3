import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    private http = inject(HttpClient);
    private baseUrl = environment.apiUrl;

    get<T>(endpoint: string, params?: any, options: { skipLoading?: boolean } = {}): Observable<T> {
        let headers = new HttpHeaders();
        if (options.skipLoading) {
            headers = headers.set('X-Skip-Loading', 'true');
        }
        return this.http.get<T>(`${this.baseUrl}/${endpoint}`, { params, headers });
    }

    post<T>(endpoint: string, data: any, options: { skipLoading?: boolean } = {}): Observable<T> {
        let headers = new HttpHeaders();
        if (options.skipLoading) {
            headers = headers.set('X-Skip-Loading', 'true');
        }
        return this.http.post<T>(`${this.baseUrl}/${endpoint}`, data, { headers });
    }

    put<T>(endpoint: string, data: any, options: { skipLoading?: boolean } = {}): Observable<T> {
        let headers = new HttpHeaders();
        if (options.skipLoading) {
            headers = headers.set('X-Skip-Loading', 'true');
        }
        return this.http.put<T>(`${this.baseUrl}/${endpoint}`, data, { headers });
    }

    delete<T>(endpoint: string, params?: any, options: { skipLoading?: boolean } = {}): Observable<T> {
        let headers = new HttpHeaders();
        if (options.skipLoading) {
            headers = headers.set('X-Skip-Loading', 'true');
        }
        return this.http.delete<T>(`${this.baseUrl}/${endpoint}`, { params, headers });
    }

    patch<T>(endpoint: string, data: any, options: { skipLoading?: boolean } = {}): Observable<T> {
        let headers = new HttpHeaders();
        if (options.skipLoading) {
            headers = headers.set('X-Skip-Loading', 'true');
        }
        return this.http.patch<T>(`${this.baseUrl}/${endpoint}`, data, { headers });
    }

    postFormData<T>(endpoint: string, formData: FormData): Observable<T> {
        return this.http.post<T>(`${this.baseUrl}/${endpoint}`, formData);
    }
}
