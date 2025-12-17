import { Injectable, inject, signal } from '@angular/core';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
    type: NotificationType;
    message: string;
    duration?: number;
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private notifications = signal<Notification[]>([]);

    getNotifications = this.notifications.asReadonly();

    success(message: string, duration: number = 3000): void {
        this.showNotification({ type: 'success', message, duration });
    }

    error(message: string, duration: number = 5000): void {
        this.showNotification({ type: 'error', message, duration });
    }

    warning(message: string, duration: number = 4000): void {
        this.showNotification({ type: 'warning', message, duration });
    }

    info(message: string, duration: number = 3000): void {
        this.showNotification({ type: 'info', message, duration });
    }

    private showNotification(notification: Notification): void {
        this.notifications.update(notifications => [...notifications, notification]);

        if (notification.duration) {
            setTimeout(() => {
                this.removeNotification(notification);
            }, notification.duration);
        }
    }

    removeNotification(notification: Notification): void {
        this.notifications.update(notifications =>
            notifications.filter(n => n !== notification)
        );
    }
}
