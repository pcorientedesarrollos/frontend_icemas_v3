import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const token = authService.getToken();

    console.log('🔐 Auth Interceptor:', {
        url: req.url,
        hasToken: !!token,
        token: token ? `${token.substring(0, 20)}...` : 'null'
    });

    if (token && !req.url.includes('/auth/login') && !req.url.includes('/auth/register')) {
        req = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
        console.log('✅ Token added to request');
    } else {
        console.log('❌ Token NOT added:', { hasToken: !!token, isAuthUrl: req.url.includes('/auth') });
    }

    return next(req);
};
