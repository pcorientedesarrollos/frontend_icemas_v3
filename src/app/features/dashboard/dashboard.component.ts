import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

import { ServiciosService } from '../servicios/servicios.service';
import { TecnicosService } from '../tecnicos/tecnicos.service';
import { ClientesService } from '../clientes/clientes.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FullCalendarModule, BaseChartDirective],
  providers: [provideCharts(withDefaultRegisterables())],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private router = inject(Router);
  private serviciosService = inject(ServiciosService);
  private tecnicosService = inject(TecnicosService);
  private destroyRef = inject(DestroyRef);

  // Signals for stats
  totalServices = signal(0);
  pendingServices = signal(0);
  completedServices = signal(0);
  activeTechnicians = signal(0);

  // Recent activity
  recentServices = signal<any[]>([]);
  activeTechsList = signal<any[]>([]);

  // Calendar Events
  calendarEvents = signal<any[]>([]);

  // Chart Data: Status Doughnut
  public statusChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right' }
    }
  };
  public statusChartType: ChartType = 'doughnut';
  public statusChartData = signal<ChartData<'doughnut'>>({
    labels: ['Pendiente', 'En Proceso', 'Completado', 'Cancelado'],
    datasets: [{ data: [0, 0, 0, 0], backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#ef4444'] }]
  });

  // Chart Data: Services Trend (Simple Mock for now, or real if we process dates)
  public trendChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, grid: { display: false } }, x: { grid: { display: false } } }
  };
  public trendChartType: ChartType = 'bar';
  public trendChartData = signal<ChartData<'bar'>>({
    labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    datasets: [{ data: [0, 0, 0, 0, 0, 0, 0], backgroundColor: '#f97316', borderRadius: 4 }]
  });

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
    editable: false,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    events: [], // Will be updated
    eventClick: (clickInfo) => this.handleEventClick(clickInfo),
    height: 'auto'
  };

  ngOnInit(): void {
    this.loadDashboardData();
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
    // Stats
    const pending = services.filter(s => s.estado === 'Pendiente').length;
    const process = services.filter(s => s.estado === 'En Proceso').length;
    const completed = services.filter(s => s.estado === 'Completado').length;
    const cancelled = services.filter(s => s.estado === 'Cancelado').length;
    const incomplete = services.filter(s => s.estado === 'Incompleto').length;

    this.totalServices.set(services.length);
    this.pendingServices.set(pending);
    this.completedServices.set(completed);

    // Update Status Chart
    this.statusChartData.set({
      labels: ['Pendiente', 'En Proceso', 'Completado', 'Cancelado/Incompleto'],
      datasets: [{
        data: [pending, process, completed, cancelled + incomplete],
        backgroundColor: ['#fbbf24', '#3b82f6', '#10b981', '#ef4444'],
        hoverBackgroundColor: ['#f59e0b', '#2563eb', '#059669', '#dc2626'],
        borderWidth: 0
      }]
    });

    // Update Trend Chart (Mock logic: distribute services randomly across days for demo feel, 
    // real logic would need date grouping)
    // For now, let's just count services by day of week if we have dates
    const days = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
    services.forEach(s => {
      const date = new Date(s.fechaServicio);
      if (!isNaN(date.getTime())) {
        days[date.getDay()]++;
      }
    });
    // Rotate to start Mon (index 1) -> Sun (index 0)
    const rotatedDays = [...days.slice(1), days[0]];

    this.trendChartData.set({
      labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
      datasets: [{
        data: rotatedDays,
        label: 'Servicios',
        backgroundColor: '#f97316',
        borderRadius: 4,
        barThickness: 20
      }]
    });


    // Recent Services (Last 5)
    // Assuming created_at or falling back to fechaServicio for sorting
    const sorted = [...services].sort((a, b) =>
      new Date(b.created_at || b.idServicio).getTime() - new Date(a.created_at || a.idServicio).getTime()
    );
    this.recentServices.set(sorted.slice(0, 5));

    // Calendar Events
    const events = services.map(s => {
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
    this.router.navigate(['/servicios', serviceId]);
  }

  // Quick Actions
  newService() {
    this.router.navigate(['/servicios/nuevo']);
  }

  newClient() {
    this.router.navigate(['/clientes/nuevo']);
  }

  viewCalendar() {
    // Scroll to calendar
    document.getElementById('calendar-section')?.scrollIntoView({ behavior: 'smooth' });
  }
}
