import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const router = inject(Router);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            let errorMessage = 'An unknown error occurred';

            if (error.error instanceof ErrorEvent) {
                // Client-side error
                errorMessage = `Error: ${error.error.message}`;
            } else {
                // Server-side error
                errorMessage = error.error?.message || `Error Code: ${error.status}\nMessage: ${error.message}`;

                // Handle 401 Unauthorized
                if (error.status === 401) {
                    // Clear auth and redirect to login
                    if (typeof window !== 'undefined') {
                        localStorage.removeItem('icemas_access_token');
                    }
                    router.navigate(['/login']);
                }
            }

            console.error('HTTP Error:', errorMessage);
            return throwError(() => new Error(errorMessage));
        })
    );
};
