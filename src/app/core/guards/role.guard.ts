import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../enums/user-role.enum';

/**
 * Guard to protect routes based on user roles
 * @param allowedRoles Array of roles allowed to access the route
 * @returns CanActivateFn
 * 
 * @example
 * // In routes configuration:
 * {
 *   path: 'admin',
 *   canActivate: [roleGuard([UserRole.ADMINISTRADOR])],
 *   component: AdminComponent
 * }
 */
export const roleGuard = (allowedRoles: UserRole[]): CanActivateFn => {
    return (route, state) => {
        const authService = inject(AuthService);
        const router = inject(Router);

        const user = authService.currentUser();

        if (!user) {
            // User not authenticated
            router.navigate(['/login']);
            return false;
        }

        if (!allowedRoles.includes(user.role)) {
            // User doesn't have required role
            console.warn(`Access denied. Required roles: ${allowedRoles.join(', ')}, User role: ${user.role}`);
            router.navigate(['/dashboard']); // Redirect to dashboard or unauthorized page
            return false;
        }

        return true;
    };
};
