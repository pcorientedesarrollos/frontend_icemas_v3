import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const router = inject(Router);
    const platformId = inject(PLATFORM_ID);
    const isBrowser = isPlatformBrowser(platformId);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            let errorMessage = 'An unknown error occurred';

            // Check if ErrorEvent exists (browser only) and error is client-side
            if (typeof ErrorEvent !== 'undefined' && error.error instanceof ErrorEvent) {
                // Client-side error
                errorMessage = `Error: ${error.error.message}`;
            } else {
                // Server-side error
                errorMessage = error.error?.message || `Error Code: ${error.status}\\nMessage: ${error.message}`;

                // Handle 401 Unauthorized ONLY in browser, not during SSR
                if (error.status === 401 && isBrowser) {
                    // Clear auth and redirect to login
                    localStorage.removeItem(environment.jwtTokenKey);
                    localStorage.removeItem('current_user');
                    router.navigate(['/login']);
                }
            }

            if (error.status === 400) {
                console.warn('Validation Error:', errorMessage);
            } else {
                console.error('HTTP Error:', errorMessage);
            }
            return throwError(() => new Error(errorMessage));
        })
    );
};
