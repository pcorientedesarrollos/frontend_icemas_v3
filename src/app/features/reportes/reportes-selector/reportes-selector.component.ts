import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientesService } from '../../clientes/clientes.service';

import { EquiposService } from '../../equipos/equipos.service';
import { DataTableComponent, DataTableColumn } from '../../../shared/components/data-table/data-table.component';
import { NotificationService } from '../../../core/services/notification.service';
import { PdfService } from '../../../core/services/pdf.service';
import { SearchableSelectComponent } from '../../../shared/components/searchable-select/searchable-select.component';
import { PdfPreviewModalComponent } from '../../../shared/components/pdf-preview-modal/pdf-preview-modal.component';
import { loadLogoAsBase64 } from '../../../core/utils/logo-loader';

@Component({
  selector: 'app-reportes-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, DataTableComponent, SearchableSelectComponent, PdfPreviewModalComponent],
  templateUrl: './reportes-selector.component.html',
  styleUrl: './reportes-selector.component.css'
})
export class ReportesSelectorComponent {
  private clientesService = inject(ClientesService);
  private equiposService = inject(EquiposService);
  private notificationService = inject(NotificationService);
  private pdfService = inject(PdfService);

  // Report type selection
  selectedReportType = signal<'cliente' | 'equipo' | null>(null);

  // Entity selection
  clientes = signal<any[]>([]);
  equipos = signal<any[]>([]);
  clienteSucursales = signal<any[]>([]); // Sucursales del cliente seleccionado
  selectedEntityId = signal<number | null>(null);
  selectedSucursalId = signal<number | null>(null); // Sucursal seleccionada (opcional)

  // Report data
  reportData = signal<any[]>([]);
  reportTitle = signal('');
  reportSubtitle = signal('');
  loading = signal(false);
  reportGenerated = signal(false);

  // PDF Preview
  showPdfPreview = signal(false);
  pdfUrl = signal<string | null>(null);
  pdfFileName = signal('');

  // Selected cliente object (for PDF metadata)
  selectedCliente = signal<any | null>(null);
  selectedEquipo = signal<any | null>(null);

  // Equipment report filters
  selectedClienteForEquipo = signal<number | null>(null);
  equipoSucursales = signal<any[]>([]);
  selectedSucursalForEquipo = signal<number | null>(null);

  // Date filters
  fechaInicio = signal<string>('');
  fechaFin = signal<string>('');

  // Table columns for report
  reportColumns: DataTableColumn[] = [
    { key: 'folio', label: 'Folio', sortable: true },
    { key: 'fechaServicio', label: 'Fecha', sortable: true, format: (value: any) => value ? new Date(value).toLocaleDateString('es-MX') : 'N/A' },
    { key: 'tipoServicio.nombre', label: 'Tipo', sortable: false },
    { key: 'cliente.nombre', label: 'Cliente', sortable: false },
    { key: 'sucursal.nombre', label: 'Sucursal', sortable: false },
    { key: 'sucursal.nombre', label: 'Sucursal', sortable: false },
    {
      key: 'equipo.nombre',
      label: 'Equipo',
      sortable: false,
      format: (val: any, row: any) => {
        if (row.equiposAsignados && row.equiposAsignados.length > 0) {
          return row.equiposAsignados.map((e: any) => e.equipo?.nombre || 'Desconocido').join(', ');
        }
        return val || 'N/A';
      }
    },
    { key: 'tecnico.nombre', label: 'Técnico', sortable: false },
    {
      key: 'estado',
      label: 'Estado',
      sortable: true,
      format: (value: string) => {
        const badges: Record<string, string> = {
          'Pendiente': '<span class="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Pendiente</span>',

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

  goBack(): void {
    if (this.reportGenerated()) {
      this.clearReport();
    } else if (this.selectedReportType()) {
      this.selectedReportType.set(null);
    }
  }

  setDefaultDates(): void {
    // Set default dates to current full year (January 1 to today)
    const today = new Date();
    const firstDayOfYear = new Date(today.getFullYear(), 0, 1);

    this.fechaInicio.set(firstDayOfYear.toISOString().split('T')[0]);
    this.fechaFin.set(today.toISOString().split('T')[0]);
  }

  loadEntities(): void {
    this.clientesService.getAll().subscribe({
      next: (data) => {
        this.clientes.set(data);
      },
      error: () => this.notificationService.error('Error al cargar clientes')
    });



    this.equiposService.getAll().subscribe({
      next: (data) => this.equipos.set(data),
      error: () => this.notificationService.error('Error al cargar equipos')
    });
  }

  selectReportType(type: 'cliente' | 'equipo'): void {
    this.selectedReportType.set(type);
    this.selectedEntityId.set(null);
    this.reportGenerated.set(false);
    this.reportData.set([]);
  }

  onEntityChange(value: any): void {
    this.selectedEntityId.set(value ? Number(value) : null);
    this.selectedSucursalId.set(null); // Reset sucursal selection

    // If cliente is selected, load its sucursales
    if (this.selectedReportType() === 'cliente' && value) {
      this.loadClienteSucursales(Number(value));
    } else {
      this.clienteSucursales.set([]);
    }
  }

  onSucursalChange(value: any): void {
    this.selectedSucursalId.set(value ? Number(value) : null);
  }

  loadClienteSucursales(clienteId: number): void {
    this.clientesService.getSucursales(clienteId).subscribe({
      next: (data) => {
        this.clienteSucursales.set(data);
      },
      error: () => {
        this.notificationService.error('Error al cargar sucursales');
        this.clienteSucursales.set([]);
      }
    });
  }

  onClienteForEquipoChange(value: any): void {
    const clienteId = value ? Number(value) : null;
    this.selectedClienteForEquipo.set(clienteId);
    this.selectedSucursalForEquipo.set(null);
    this.selectedEntityId.set(null);

    if (clienteId) {
      // Load branches for this client
      this.clientesService.getSucursales(clienteId).subscribe({
        next: (data) => {
          this.equipoSucursales.set(data);
        },
        error: () => {
          this.notificationService.error('Error al cargar sucursales');
          this.equipoSucursales.set([]);
        }
      });

      // Load all equipment for this client
      this.clientesService.getEquipos(clienteId).subscribe({
        next: (data) => {
          this.equipos.set(data);
        },
        error: () => {
          this.notificationService.error('Error al cargar equipos');
          this.equipos.set([]);
        }
      });
    } else {
      this.equipoSucursales.set([]);
      this.equipos.set([]);
    }
  }

  onSucursalForEquipoChange(value: any): void {
    const sucursalId = value ? Number(value) : null;
    this.selectedSucursalForEquipo.set(sucursalId);
    this.selectedEntityId.set(null);

    const clienteId = this.selectedClienteForEquipo();
    if (clienteId) {
      if (sucursalId) {
        // Filter equipment by branch
        this.clientesService.getEquipos(clienteId).subscribe({
          next: (allEquipos) => {
            const filtered = allEquipos.filter((eq: any) => eq.sucursal?.idSucursal === sucursalId);
            this.equipos.set(filtered);
          },
          error: () => {
            this.notificationService.error('Error al filtrar equipos');
          }
        });
      } else {
        // Show all equipment for the client
        this.clientesService.getEquipos(clienteId).subscribe({
          next: (data) => {
            this.equipos.set(data);
          },
          error: () => {
            this.notificationService.error('Error al cargar equipos');
          }
        });
      }
    }
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
      case 'equipo':
        this.generateEquipoReport(entityId);
        break;
    }
  }

  generateClienteReport(clienteId: number): void {
    const cliente = this.clientes().find(c => Number(c.idCliente) === Number(clienteId));
    const sucursalId = this.selectedSucursalId();

    // Store the selected cliente for PDF metadata
    this.selectedCliente.set(cliente || null);

    // Build title and subtitle
    this.reportTitle.set('Reporte por Cliente');
    let subtitle = cliente?.nombre || '';

    if (sucursalId) {
      const sucursal = this.clienteSucursales().find(s => Number(s.idSucursal) === Number(sucursalId));
      if (sucursal) {
        subtitle += ` - ${sucursal.nombre}`;
      }
    }

    this.reportSubtitle.set(subtitle);

    this.clientesService.getServicios(clienteId).subscribe({
      next: (data) => {
        // Filter out cancelled services
        let filteredData = data.filter(s => s.estado !== 'Cancelado');

        // Filter by sucursal if selected
        if (sucursalId) {
          filteredData = filteredData.filter(s => Number(s.sucursal?.idSucursal) === Number(sucursalId));
        }

        // Filter by date
        const dateFiltered = this.filterByDate(filteredData);
        this.reportData.set(dateFiltered);
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
    const equipo = this.equipos().find(e => Number(e.idEquipo) === Number(equipoId));
    this.selectedEquipo.set(equipo || null);
    this.reportTitle.set('Reporte por Equipo');
    this.reportSubtitle.set(equipo?.nombre || '');

    this.equiposService.getServicios(equipoId).subscribe({
      next: (data) => {
        // Filter out cancelled services
        const filteredData = data.filter(s => s.estado !== 'Cancelado');
        this.reportData.set(this.filterByDate(filteredData));
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

    // If no date filters, return all data
    if (!inicio && !fin) {
      return data;
    }

    const filtered = data.filter(item => {
      const fecha = new Date(item.fechaServicio);

      // Skip invalid dates
      if (isNaN(fecha.getTime())) {
        return false;
      }

      const fechaInicioDate = inicio ? new Date(inicio + 'T00:00:00') : null;
      const fechaFinDate = fin ? new Date(fin + 'T23:59:59') : null;

      if (fechaInicioDate && fecha < fechaInicioDate) return false;
      if (fechaFinDate && fecha > fechaFinDate) return false;
      return true;
    });

    return filtered;
  }

  getStatsByEstado(): { pendiente: number; completado: number; cancelado: number } {
    const data = this.reportData();
    return {
      pendiente: data.filter(s => s.estado === 'Pendiente').length,

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

  async exportToPdf(): Promise<void> {
    const data = this.reportData();
    if (data.length === 0) {
      this.notificationService.warning('No hay datos para exportar');
      return;
    }

    // Load logo first
    const logoBase64 = await loadLogoAsBase64();

    // Generate PDF using jsPDF with ICEMAS format
    import('jspdf').then(({ jsPDF }) => {
      const doc = new jsPDF({ orientation: 'landscape' }); // PDF horizontal
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // ICEMAS Blue color
      const icemasBlue = [30, 58, 138]; // #1e3a8a

      // Add ICEMAS logo if loaded - proper aspect ratio
      if (logoBase64) {
        try {
          // Logo: 45x20 pixels (wider, less tall for better proportions)
          doc.addImage(logoBase64, 'PNG', 15, 12, 45, 20);
        } catch (e) {
          // Silent fail for logo loading
        }
      }

      // Company title (centered, aligned with logo height)
      doc.setFontSize(16);
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(icemasBlue[0], icemasBlue[1], icemasBlue[2]);
      doc.text('ICEMAS EQUIPOS S.A. DE C.V.', pageWidth / 2, 22, { align: 'center' });

      // Blue horizontal line (below logo and title)
      doc.setDrawColor(icemasBlue[0], icemasBlue[1], icemasBlue[2]);
      doc.setLineWidth(1.5);
      doc.line(15, 42, pageWidth - 15, 42);

      // Report title
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(this.reportTitle(), pageWidth / 2, 50, { align: 'center' });

      // Date
      const today = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' });
      doc.setFontSize(10);
      doc.text(`Fecha: ${today}`, pageWidth / 2, 57, { align: 'center' });

      // Client info
      // Client/Entity info specific to report type
      let y = 67;

      if (this.selectedReportType() === 'equipo') {
        const equipo = this.selectedEquipo();

        // Try to find Client name context if not in equipo object
        let clienteName = equipo?.cliente?.nombre;
        if (!clienteName && this.selectedClienteForEquipo()) {
          const c = this.clientes().find(c => Number(c.idCliente) === Number(this.selectedClienteForEquipo()));
          clienteName = c?.nombre;
        }

        // Try to find Sucursal name context
        let sucursalName = equipo?.sucursal?.nombre;
        if (!sucursalName && this.selectedSucursalForEquipo()) {
          // Need to look in loaded sucursales for the client
          const s = this.equipoSucursales().find(s => Number(s.idSucursal) === Number(this.selectedSucursalForEquipo()));
          sucursalName = s?.nombre;
        } else if (!sucursalName && equipo?.sucursalId && this.equipoSucursales().length > 0) {
          const s = this.equipoSucursales().find(s => Number(s.idSucursal) === Number(equipo.sucursalId));
          sucursalName = s?.nombre;
        }

        doc.setFont('Helvetica', 'bold');
        doc.text('Equipo:', 20, y);
        doc.setFont('Helvetica', 'normal');
        doc.text(equipo?.nombre || '', 45, y);

        y += 6;
        doc.setFont('Helvetica', 'bold');
        doc.text('Cliente:', 20, y);
        doc.setFont('Helvetica', 'normal');
        doc.text(clienteName || 'N/A', 45, y);

        y += 6;
        doc.setFont('Helvetica', 'bold');
        doc.text('Sucursal:', 20, y);
        doc.setFont('Helvetica', 'normal');
        doc.text(sucursalName || 'N/A', 45, y);

        // Add Serie if available
        if (equipo?.serie || equipo?.numeroSerie) {
          y += 6;
          doc.setFont('Helvetica', 'bold');
          doc.text('Serie:', 20, y);
          doc.setFont('Helvetica', 'normal');
          doc.text(equipo.serie || equipo.numeroSerie || '', 45, y);
        }

      } else {
        // Standard Client Report
        const cliente = this.selectedCliente();

        doc.setFont('Helvetica', 'bold');
        doc.text('Cliente:', 20, y);
        doc.setFont('Helvetica', 'normal');
        doc.text(this.reportSubtitle() || '', 45, y); // Title already includes sucursal if selected

        y += 6;
        doc.setFont('Helvetica', 'bold');
        doc.text('RFC:', 20, y);
        doc.setFont('Helvetica', 'normal');
        doc.text(cliente?.rfc || '', 45, y);

        y += 6;
        doc.setFont('Helvetica', 'bold');
        doc.text('Teléfono:', 20, y);
        doc.setFont('Helvetica', 'normal');
        doc.text(cliente?.telefono || '', 45, y);
      }

      // Table header
      y += 12;
      const tableStartY = y;

      // Header background (light gray)
      doc.setFillColor(230, 230, 230);
      doc.rect(20, y - 5, pageWidth - 40, 8, 'F');

      // Header text - balanced distribution across full landscape width
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      doc.text('Fecha', 20, y);
      doc.text('Sucursal', 48, y);
      doc.text('Equipo', 88, y);
      doc.text('Tipo de Servicio', 170, y);
      doc.text('Técnico', 220, y);
      doc.text('Estado', 260, y);

      // Table rows
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7);
      y += 8;

      data.forEach((item, index) => {
        // Check if we need a new page
        if (y > pageHeight - 30) {
          doc.addPage();
          y = 20;

          // Re-draw table header on new page
          doc.setFillColor(230, 230, 230);
          doc.rect(20, y - 5, pageWidth - 40, 8, 'F');
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(9);
          doc.text('Fecha', 20, y);
          doc.text('Sucursal', 48, y);
          doc.text('Equipo', 88, y);
          doc.text('Tipo de Servicio', 170, y);
          doc.text('Técnico', 220, y);
          doc.text('Estado', 260, y);

          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(7);
          y += 8;
        }

        // Zebra striping
        if (index % 2 === 0) {
          doc.setFillColor(248, 248, 248);
          doc.rect(20, y - 5, pageWidth - 40, 7, 'F');
        }

        // Row data
        const fechaCorta = item.fechaServicio ? new Date(item.fechaServicio).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '';
        doc.text(fechaCorta, 20, y);
        doc.text((item.sucursal?.nombre || '').substring(0, 22), 48, y);
        doc.text((item.equipo?.nombre || '').substring(0, 48), 88, y);
        doc.text((item.tipoServicio?.nombre || '').substring(0, 28), 170, y);
        doc.text((item.tecnico?.nombre || '').substring(0, 22), 220, y);

        // Estado with color
        const estado = item.estado || '';
        if (estado === 'Completado') {
          doc.setTextColor(0, 128, 0); // Green
        } else if (estado === 'Pendiente') {
          doc.setTextColor(200, 150, 0); // Yellow
        }
        doc.text(estado, 260, y);
        doc.setTextColor(0, 0, 0); // Reset to black

        y += 7;
      });

      // Footer on all pages
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        const footerY = pageHeight - 10;
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Reporte generado el ${today}`, pageWidth / 2, footerY, { align: 'center' });
      }

      // Create blob for preview
      const pdfBlob = doc.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      this.pdfUrl.set(blobUrl);
      this.pdfFileName.set(`Reporte_${this.reportSubtitle()}_${new Date().toISOString().split('T')[0]}.pdf`);

      // Show preview modal
      this.showPdfPreview.set(true);
    });
  }

  onPdfCancel(): void {
    const url = this.pdfUrl();
    if (url) {
      URL.revokeObjectURL(url);
    }
    this.showPdfPreview.set(false);
    this.pdfUrl.set(null);
  }

  clearReport(): void {
    this.selectedReportType.set(null);
    this.selectedEntityId.set(null);
    this.selectedSucursalId.set(null);
    this.clienteSucursales.set([]);
    this.reportData.set([]);
    this.reportGenerated.set(false);
    this.setDefaultDates();

    // Clear equipment report filters
    this.selectedClienteForEquipo.set(null);
    this.equipoSucursales.set([]);
    this.selectedSucursalForEquipo.set(null);
  }

  async generateEquipoReportFromTable(row: any): Promise<void> {
    const equipo = row.equipo || (row.equiposAsignados && row.equiposAsignados[0]?.equipo);

    if (!equipo) {
      this.notificationService.warning('No se pudo identificar el equipo');
      return;
    }

    this.loading.set(true);

    try {
      const [{ jsPDF }, { loadLogoAsBase64 }] = await Promise.all([
        import('jspdf'),
        import('../../../core/utils/logo-loader')
      ]);

      const logoBase64 = await loadLogoAsBase64();
      const doc = new jsPDF({ orientation: 'landscape' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const icemasBlue = [30, 58, 138];

      if (logoBase64) {
        try {
          doc.addImage(logoBase64, 'PNG', 15, 12, 45, 20);
        } catch (e) {
          // Silent fail for logo loading
        }
      }

      doc.setFontSize(16);
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(icemasBlue[0], icemasBlue[1], icemasBlue[2]);
      doc.text('ICEMAS EQUIPOS S.A. DE C.V.', pageWidth / 2, 22, { align: 'center' });

      doc.setDrawColor(icemasBlue[0], icemasBlue[1], icemasBlue[2]);
      doc.setLineWidth(1.5);
      doc.line(15, 42, pageWidth - 15, 42);

      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('Reporte de Servicio', pageWidth / 2, 50, { align: 'center' });

      const today = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' });
      doc.setFontSize(10);
      doc.text(`Fecha: ${today}`, pageWidth / 2, 57, { align: 'center' });

      let y = 67;
      doc.setFont('Helvetica', 'bold');
      doc.text('Folio:', 20, y);
      doc.setFont('Helvetica', 'normal');
      doc.text(row.folio || '', 45, y);

      y += 6;
      doc.setFont('Helvetica', 'bold');
      doc.text('Equipo:', 20, y);
      doc.setFont('Helvetica', 'normal');
      doc.text(equipo.nombre || '', 45, y);

      y += 6;
      doc.setFont('Helvetica', 'bold');
      doc.text('Serie:', 20, y);
      doc.setFont('Helvetica', 'normal');
      doc.text(equipo.numeroSerie || '', 45, y);

      y += 6;
      doc.setFont('Helvetica', 'bold');
      doc.text('Marca:', 20, y);
      doc.setFont('Helvetica', 'normal');
      doc.text(equipo.marca?.nombre || '', 45, y);

      y += 6;
      doc.setFont('Helvetica', 'bold');
      doc.text('Cliente:', 20, y);
      doc.setFont('Helvetica', 'normal');
      doc.text(row.cliente?.nombre || '', 45, y);

      y += 6;
      doc.setFont('Helvetica', 'bold');
      doc.text('Sucursal:', 20, y);
      doc.setFont('Helvetica', 'normal');
      doc.text(row.sucursal?.nombre || '', 45, y);

      y += 6;
      doc.setFont('Helvetica', 'bold');
      doc.text('Tipo de Servicio:', 20, y);
      doc.setFont('Helvetica', 'normal');
      doc.text(row.tipoServicio?.nombre || '', 60, y);

      y += 6;
      doc.setFont('Helvetica', 'bold');
      doc.text('Fecha de Servicio:', 20, y);
      doc.setFont('Helvetica', 'normal');
      const fechaServicio = row.fechaServicio ? new Date(row.fechaServicio).toLocaleDateString('es-MX') : 'N/A';
      doc.text(fechaServicio, 60, y);

      y += 6;
      doc.setFont('Helvetica', 'bold');
      doc.text('Técnico:', 20, y);
      doc.setFont('Helvetica', 'normal');
      doc.text(row.tecnico?.nombre || '', 45, y);

      y += 6;
      doc.setFont('Helvetica', 'bold');
      doc.text('Estado:', 20, y);
      doc.setFont(' Helvetica', 'normal');
      const estado = row.estado || '';
      if (estado === 'Completado') {
        doc.setTextColor(0, 128, 0);
      } else if (estado === 'Pendiente') {
        doc.setTextColor(200, 150, 0);
      } else if (estado === 'En Proceso') {
        doc.setTextColor(0, 0, 255);
      }
      doc.text(estado, 45, y);
      doc.setTextColor(0, 0, 0);

      // Footer
      const footerY = pageHeight - 10;
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Reporte generado el ${today}`, pageWidth / 2, footerY, { align: 'center' });

      doc.save(`Servicio_${row.folio}_${equipo.nombre}_${new Date().toISOString().split('T')[0]}.pdf`);
      this.notificationService.success('Reporte generado correctamente');
      this.loading.set(false);
    } catch (error) {
      this.notificationService.error('Error al generar el reporte');
      this.loading.set(false);
    }
  }
}
