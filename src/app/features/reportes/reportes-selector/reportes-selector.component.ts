import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientesService } from '../../clientes/clientes.service';
import { TecnicosService } from '../../tecnicos/tecnicos.service';
import { EquiposService } from '../../equipos/equipos.service';
import { DataTableComponent, DataTableColumn } from '../../../shared/components/data-table/data-table.component';
import { NotificationService } from '../../../core/services/notification.service';
import { PdfService } from '../../../core/services/pdf.service';
import { SearchableSelectComponent } from '../../../shared/components/searchable-select/searchable-select.component';

@Component({
  selector: 'app-reportes-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, DataTableComponent, SearchableSelectComponent],
  templateUrl: './reportes-selector.component.html',
  styleUrl: './reportes-selector.component.css'
})
export class ReportesSelectorComponent {
  private clientesService = inject(ClientesService);
  private tecnicosService = inject(TecnicosService);
  private equiposService = inject(EquiposService);
  private notificationService = inject(NotificationService);
  private pdfService = inject(PdfService);

  // Report type selection
  selectedReportType = signal<'cliente' | 'tecnico' | 'equipo' | null>(null);

  // Entity selection
  clientes = signal<any[]>([]);
  tecnicos = signal<any[]>([]);
  equipos = signal<any[]>([]);
  selectedEntityId = signal<number | null>(null);

  // Report data
  reportData = signal<any[]>([]);
  reportTitle = signal('');
  reportSubtitle = signal('');
  loading = signal(false);
  reportGenerated = signal(false);

  // Date filters
  fechaInicio = signal<string>('');
  fechaFin = signal<string>('');

  // Table columns for report
  reportColumns: DataTableColumn[] = [
    { key: 'folio', label: 'Folio', sortable: true },
    { key: 'fechaServicio', label: 'Fecha', sortable: true, format: (value: any) => value ? new Date(value).toLocaleDateString('es-MX') : 'N/A' },
    { key: 'tipoServicio.nombre', label: 'Tipo', sortable: false },
    { key: 'cliente.nombre', label: 'Cliente', sortable: false },
    { key: 'equipo.nombre', label: 'Equipo', sortable: false },
    { key: 'tecnico.nombre', label: 'Técnico', sortable: false },
    {
      key: 'estado',
      label: 'Estado',
      sortable: true,
      format: (value: string) => {
        const badges: Record<string, string> = {
          'Pendiente': '<span class="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Pendiente</span>',
          'En Proceso': '<span class="px-2 py-1 text-xs font-medium rounded-full bg-primary-100 text-primary-800">En Proceso</span>',
          'Completado': '<span class="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Completado</span>',
          'Cancelado': '<span class="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Cancelado</span>'
        };
        return badges[value] || value;
      }
    },
  ];

  ngOnInit(): void {
    this.loadEntities();
    this.setDefaultDates();
  }

  setDefaultDates(): void {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    this.fechaInicio.set(firstDayOfMonth.toISOString().split('T')[0]);
    this.fechaFin.set(today.toISOString().split('T')[0]);
  }

  loadEntities(): void {
    this.clientesService.getAll().subscribe({
      next: (data) => this.clientes.set(data),
      error: () => this.notificationService.error('Error al cargar clientes')
    });

    this.tecnicosService.getAll().subscribe({
      next: (data) => this.tecnicos.set(data),
      error: () => this.notificationService.error('Error al cargar técnicos')
    });

    this.equiposService.getAll().subscribe({
      next: (data) => this.equipos.set(data),
      error: () => this.notificationService.error('Error al cargar equipos')
    });
  }

  selectReportType(type: 'cliente' | 'tecnico' | 'equipo'): void {
    this.selectedReportType.set(type);
    this.selectedEntityId.set(null);
    this.reportGenerated.set(false);
    this.reportData.set([]);
  }

  onEntityChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const value = select.value;
    this.selectedEntityId.set(value ? +value : null);
  }

  onFechaInicioChange(value: string): void {
    this.fechaInicio.set(value);
  }

  onFechaFinChange(value: string): void {
    this.fechaFin.set(value);
  }

  generateReport(): void {
    const entityId = this.selectedEntityId();
    const reportType = this.selectedReportType();

    if (!entityId || !reportType) {
      this.notificationService.warning('Selecciona una entidad para generar el reporte');
      return;
    }

    this.loading.set(true);

    switch (reportType) {
      case 'cliente':
        this.generateClienteReport(entityId);
        break;
      case 'tecnico':
        this.generateTecnicoReport(entityId);
        break;
      case 'equipo':
        this.generateEquipoReport(entityId);
        break;
    }
  }

  generateClienteReport(clienteId: number): void {
    const cliente = this.clientes().find(c => c.idCliente === clienteId);
    this.reportTitle.set('Reporte por Cliente');
    this.reportSubtitle.set(cliente?.nombre || '');

    this.clientesService.getServicios(clienteId).subscribe({
      next: (data) => {
        this.reportData.set(this.filterByDate(data));
        this.reportGenerated.set(true);
        this.loading.set(false);
      },
      error: () => {
        this.notificationService.error('Error al generar reporte');
        this.loading.set(false);
      }
    });
  }

  generateTecnicoReport(tecnicoId: number): void {
    const tecnico = this.tecnicos().find(t => t.idTecnico === tecnicoId);
    this.reportTitle.set('Reporte por Técnico');
    this.reportSubtitle.set(tecnico?.nombre || '');

    this.tecnicosService.getServicios(tecnicoId).subscribe({
      next: (data) => {
        this.reportData.set(this.filterByDate(data));
        this.reportGenerated.set(true);
        this.loading.set(false);
      },
      error: () => {
        this.notificationService.error('Error al generar reporte');
        this.loading.set(false);
      }
    });
  }

  generateEquipoReport(equipoId: number): void {
    const equipo = this.equipos().find(e => e.idEquipo === equipoId);
    this.reportTitle.set('Reporte por Equipo');
    this.reportSubtitle.set(equipo?.nombre || '');

    this.equiposService.getServicios(equipoId).subscribe({
      next: (data) => {
        this.reportData.set(this.filterByDate(data));
        this.reportGenerated.set(true);
        this.loading.set(false);
      },
      error: () => {
        this.notificationService.error('Error al generar reporte');
        this.loading.set(false);
      }
    });
  }

  filterByDate(data: any[]): any[] {
    const inicio = this.fechaInicio();
    const fin = this.fechaFin();

    if (!inicio && !fin) return data;

    return data.filter(item => {
      const fecha = new Date(item.fechaServicio);
      const fechaInicioDate = inicio ? new Date(inicio) : null;
      const fechaFinDate = fin ? new Date(fin + 'T23:59:59') : null;

      if (fechaInicioDate && fecha < fechaInicioDate) return false;
      if (fechaFinDate && fecha > fechaFinDate) return false;
      return true;
    });
  }

  getStatsByEstado(): { pendiente: number; enProceso: number; completado: number; cancelado: number } {
    const data = this.reportData();
    return {
      pendiente: data.filter(s => s.estado === 'Pendiente').length,
      enProceso: data.filter(s => s.estado === 'En Proceso').length,
      completado: data.filter(s => s.estado === 'Completado').length,
      cancelado: data.filter(s => s.estado === 'Cancelado').length
    };
  }

  exportToExcel(): void {
    const data = this.reportData();
    if (data.length === 0) {
      this.notificationService.warning('No hay datos para exportar');
      return;
    }

    // Convert to CSV format with semicolon delimiter for Excel (Spanish locale)
    // Convert to CSV format with semicolon delimiter for Excel (Spanish locale)
    const headers = ['Folio', 'Fecha', 'Tipo Servicio', 'Cliente', 'Equipo', 'Técnico', 'Estado'];
    const rows = data.map(item => [
      item.folio || '',
      item.fechaServicio ? new Date(item.fechaServicio).toLocaleDateString('es-MX') : '',
      item.tipoServicio?.nombre || '',
      item.cliente?.nombre || '',
      item.equipo?.nombre || '',
      item.tecnico?.nombre || '',
      item.estado || ''
    ]);

    // Use semicolon as delimiter for Excel compatibility in Spanish locales
    const escapeCell = (cell: string) => {
      // Escape quotes and wrap if contains special characters
      const escaped = String(cell).replace(/"/g, '""');
      return escaped.includes(';') || escaped.includes('\n') ? `"${escaped}"` : escaped;
    };

    const titleRow = [`${this.reportTitle()}: ${this.reportSubtitle()}`];
    const dateRow = [`Del ${this.fechaInicio()} al ${this.fechaFin()}`];
    const generatedRow = [`Generado: ${new Date().toLocaleDateString('es-MX')}`];

    const csvContent = [
      titleRow.join(';'),
      dateRow.join(';'),
      generatedRow.join(';'),
      '', // Empty row
      headers.join(';'),
      ...rows.map(row => row.map(escapeCell).join(';'))
    ].join('\r\n');

    // Create blob and download with BOM for Excel UTF-8 support
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.reportTitle()}_${this.reportSubtitle()}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    this.notificationService.success('Reporte exportado a Excel');
  }

  exportToPdf(): void {
    const data = this.reportData();
    if (data.length === 0) {
      this.notificationService.warning('No hay datos para exportar');
      return;
    }

    // Create simple PDF report
    const title = `${this.reportTitle()}: ${this.reportSubtitle()}`;
    const fechaRango = `Del ${this.fechaInicio()} al ${this.fechaFin()}`;
    const stats = this.getStatsByEstado();

    // Generate PDF using jsPDF
    import('jspdf').then(({ jsPDF }) => {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header Background (Orange)
      doc.setFillColor(245, 166, 35); // #F5A623
      doc.rect(0, 0, pageWidth, 20, 'F');

      // Header Title (White)
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('Helvetica', 'bold');
      doc.text('ICEMAS - Reporte de Servicios', 20, 13);

      doc.setTextColor(0, 0, 0); // Reset text color

      // Report Title
      doc.setFontSize(16);
      doc.setTextColor(245, 166, 35); // #F5A623
      doc.text(title, 20, 35);

      // Date range
      doc.setFontSize(11);
      doc.setTextColor(100, 100, 100);
      doc.text(fechaRango, 20, 42);
      doc.text(`Generado: ${new Date().toLocaleDateString('es-MX')}`, 20, 48);

      // Stats
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont('Helvetica', 'bold');
      doc.text('Resumen:', 20, 60);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Total de servicios: ${data.length}`, 20, 68);

      // Colored stats
      doc.setTextColor(16, 185, 129); // Green
      doc.text(`Completados: ${stats.completado}`, 20, 75);

      doc.setTextColor(245, 166, 35); // Orange (Primary)
      doc.text(`En Proceso: ${stats.enProceso}`, 80, 75);

      doc.setTextColor(234, 179, 8); // Yellow/Amber
      doc.text(`Pendientes: ${stats.pendiente}`, 140, 75);

      doc.setTextColor(239, 68, 68); // Red
      doc.text(`Cancelados: ${stats.cancelado}`, 200, 75, { align: 'right' }); // Adjust position if needed or keep inline

      // Table header
      let y = 90;
      doc.setFillColor(245, 166, 35); // #F5A623
      doc.rect(20, y - 5, pageWidth - 40, 8, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('Helvetica', 'bold');
      doc.text('Folio', 22, y);
      doc.text('Fecha', 45, y);
      doc.text('Estado', 70, y);
      doc.text('Tipo', 100, y);
      doc.text('Equipo', 150, y);

      // Table rows
      doc.setTextColor(0, 0, 0);
      doc.setFont('Helvetica', 'normal');
      y += 8;

      data.forEach((item, index) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
          // Re-draw header on new page? Optional, keeping simple for now
        }

        // Zebra striping
        if (index % 2 === 1) {
          doc.setFillColor(249, 250, 251); // Gray 50
          doc.rect(20, y - 5, pageWidth - 40, 8, 'F');
        }

        doc.text(item.folio || '', 22, y);
        doc.text(item.fechaServicio ? new Date(item.fechaServicio).toLocaleDateString('es-MX') : '', 45, y);
        doc.text(item.estado || '', 70, y);
        doc.text((item.tipoServicio?.nombre || '').substring(0, 20), 100, y);
        doc.text((item.equipo?.nombre || '').substring(0, 25), 150, y);
        y += 8;
      });

      // Footer
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Página ${i} de ${totalPages}`, pageWidth - 20, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
      }

      // Save
      doc.save(`${this.reportTitle()}_${this.reportSubtitle()}_${new Date().toISOString().split('T')[0]}.pdf`);
      this.notificationService.success('Reporte exportado a PDF');
    });
  }

  clearReport(): void {
    this.selectedReportType.set(null);
    this.selectedEntityId.set(null);
    this.reportData.set([]);
    this.reportGenerated.set(false);
    this.setDefaultDates();
  }
}
