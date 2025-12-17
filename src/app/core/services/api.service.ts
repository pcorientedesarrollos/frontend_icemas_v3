import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    private http = inject(HttpClient);
    private baseUrl = environment.apiUrl;

    get<T>(endpoint: string, params?: any): Observable<T> {
        return this.http.get<T>(`${this.baseUrl}/${endpoint}`, { params });
    }

    post<T>(endpoint: string, data: any): Observable<T> {
        return this.http.post<T>(`${this.baseUrl}/${endpoint}`, data);
    }

    put<T>(endpoint: string, data: any): Observable<T> {
        return this.http.put<T>(`${this.baseUrl}/${endpoint}`, data);
    }

    delete<T>(endpoint: string): Observable<T> {
        return this.http.delete<T>(`${this.baseUrl}/${endpoint}`);
    }

    patch<T>(endpoint: string, data: any): Observable<T> {
        return this.http.patch<T>(`${this.baseUrl}/${endpoint}`, data);
    }
}
