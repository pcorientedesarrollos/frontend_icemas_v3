import { Component, inject, signal, OnInit, DestroyRef, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';

import { ServiciosService } from '../servicios/servicios.service';
import { TecnicosService } from '../tecnicos/tecnicos.service';
import { ClientesService } from '../clientes/clientes.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FullCalendarModule],
  providers: [],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private router = inject(Router);
  private serviciosService = inject(ServiciosService);
  private tecnicosService = inject(TecnicosService);
  private destroyRef = inject(DestroyRef);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  // Signals for stats
  totalServices = signal(0);
  pendingServices = signal(0);
  completedServices = signal(0);
  activeTechnicians = signal(0);

  // Recent activity
  recentServices = signal<any[]>([]);
  pendingServicesList = signal<any[]>([]); // Lista de servicios pendientes
  activeTechsList = signal<any[]>([]);

  // Calendar Events
  calendarEvents = signal<any[]>([]);
  allServices: any[] = []; // Store all services for lookup

  // Modal State
  showServiceModal = signal(false);
  selectedService = signal<any>(null);

  // Toggle for Calendar
  showCalendar = signal(false);

  // Calendar Options
  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    locale: esLocale,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    weekends: true,
    editable: true, // Enable drag and drop
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    events: [], // Will be updated
    eventClick: (clickInfo) => this.handleEventClick(clickInfo),
    eventDrop: (info) => this.handleEventDrop(info), // Handle drag and drop
    height: 'auto'
  };

  ngOnInit(): void {
    // Only load data in browser, not during SSR
    if (this.isBrowser) {
      this.loadDashboardData();
    }
  }

  loadDashboardData(): void {
    // 1. Load Services (for stats, calendar, and recent list)
    this.serviciosService.getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.processServiceData(data);
        },
        error: (err) => console.error('Error loading services', err)
      });

    // 2. Load Technicians (for stats and active list)
    this.tecnicosService.getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.processTechnicianData(data);
        },
        error: (err) => console.error('Error loading technicians', err)
      });
  }

  processServiceData(services: any[]): void {
    this.allServices = services;

    // Stats
    const pending = services.filter(s => s.estado === 'Pendiente').length;
    const completed = services.filter(s => s.estado === 'Completado').length;
    const cancelled = services.filter(s => s.estado === 'Cancelado').length;
    const incomplete = services.filter(s => s.estado === 'Incompleto').length;

    this.totalServices.set(services.length);
    this.pendingServices.set(pending);
    this.completedServices.set(completed);


    // Recent Services (Last 5)
    // Assuming created_at or falling back to fechaServicio for sorting
    const sorted = [...services].sort((a, b) =>
      new Date(b.created_at || b.idServicio).getTime() - new Date(a.created_at || a.idServicio).getTime()
    );
    this.recentServices.set(sorted.slice(0, 5));

    // Pending Services - ordenados por fecha del servicio (más cercanos primero)
    const pendingList = services
      .filter(s => s.estado === 'Pendiente')
      .sort((a, b) => new Date(a.fechaServicio).getTime() - new Date(b.fechaServicio).getTime())
      .slice(0, 5); // Mostrar solo los primeros 5
    this.pendingServicesList.set(pendingList);

    // Calendar Events - Filter today onwards
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const events = services
      .filter(s => {
        const serviceDate = new Date(s.fechaServicio);
        return serviceDate >= today;
      })
      .map(s => {
        let color = '#3788d8'; // Default blue
        if (s.estado === 'Pendiente') color = '#f59e0b'; // Amber/Yellow
        if (s.estado === 'Completado') color = '#10b981'; // Green
        if (s.estado === 'Cancelado') color = '#ef4444'; // Red
        if (s.estado === 'Incompleto') color = '#f97316'; // Orange

        return {
          id: s.idServicio.toString(),
          title: `${s.folio} - ${s.cliente?.nombre || 'Cliente'}`,
          start: s.fechaServicio, // Assuming 'YYYY-MM-DD' or ISO string
          color: color,
          extendedProps: {
            estado: s.estado,
            tecnico: s.tecnico?.nombre
          }
        };
      });

    this.calendarEvents.set(events);
    // Update calendar options to reflect new events
    this.calendarOptions = {
      ...this.calendarOptions,
      events: events
    };
  }

  processTechnicianData(techs: any[]): void {
    const active = techs.filter(t => t.activo === 1 || t.activo === true);
    this.activeTechnicians.set(active.length);

    // For "Active Techs List", we might ideally want to know who has assigned pending services, 
    // but for now we list all active techs.
    this.activeTechsList.set(active.slice(0, 5));
  }

  handleEventClick(clickInfo: any) {
    const serviceId = clickInfo.event.id;
    const service = this.allServices.find(s => s.idServicio.toString() === serviceId);

    if (service) {
      this.selectedService.set(service);
      this.showServiceModal.set(true);
    }
  }

  closeModal() {
    this.showServiceModal.set(false);
    this.selectedService.set(null);
  }

  submitServiceDetails() {
    if (this.selectedService()) {
      this.router.navigate(['/servicios', this.selectedService().idServicio]);
    }
  }

  handleEventDrop(info: any) {
    const serviceId = parseInt(info.event.id);
    const newDate = info.event.start;

    // Format date to YYYY-MM-DD
    const formattedDate = newDate.toISOString().split('T')[0];

    // Update service date on server
    this.serviciosService.update(serviceId, { fechaServicio: formattedDate })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          // Update local service data
          const service = this.allServices.find(s => s.idServicio === serviceId);
          if (service) {
            service.fechaServicio = formattedDate;
          }
        },
        error: () => {
          // Revert the event to its original date
          info.revert();
          console.error('❌ Error al actualizar fecha del servicio');
        }
      });
  }

  // Quick Actions
  newService(): void {
    this.router.navigate(['/servicios/nuevo']);
  }

  newClient(): void {
    this.router.navigate(['/clientes/nuevo']);
  }

  viewCalendar(): void {
    this.showCalendar.update(v => !v);
  }

  navigateToService(id: number): void {
    this.router.navigate(['/servicios', id]);
  }

  // Métodos para navegar a servicios filtrados
  viewAllServices(): void {
    this.router.navigate(['/servicios']);
  }

  viewPendingServices(): void {
    this.router.navigate(['/servicios'], { queryParams: { estado: 'Pendiente' } });
  }

  viewCompletedServices(): void {
    this.router.navigate(['/servicios'], { queryParams: { estado: 'Completado' } });
  }
}
