import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ServiciosService } from '../servicios.service';
import { ClientesService } from '../../clientes/clientes.service';
import { NotificationService } from '../../../core/services/notification.service';
import { FormsModule } from '@angular/forms';
import { PdfService, ServiceOrderData } from '../../../core/services/pdf.service';
import { PdfPreviewModalComponent } from '../../../shared/components/pdf-preview-modal/pdf-preview-modal.component';
import { Location } from '@angular/common';

@Component({
  selector: 'app-servicio-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, PdfPreviewModalComponent],
  templateUrl: './servicio-detail.component.html',
  styleUrl: './servicio-detail.component.css'
})
export class ServicioDetailComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private serviciosService = inject(ServiciosService);
  private notificationService = inject(NotificationService);
  private pdfService = inject(PdfService);
  private location = inject(Location);
  private clientesService = inject(ClientesService);

  servicio = signal<any>(null);
  loading = signal(true);
  generatingPdf = signal(false);
  servicioId: number | null = null;

  // PDF Preview Modal
  showPdfPreview = signal(false);
  pdfUrl = signal<string | null>(null);
  pdfFilename = signal<string>('orden_servicio.pdf');

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.servicioId = +id;
      this.loadServicio(this.servicioId);
    }
  }

  loadServicio(id: number): void {
    this.loading.set(true);
    this.serviciosService.getOne(id).subscribe({
      next: (data) => {
        this.servicio.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.notificationService.error('Error al cargar el servicio');
        this.router.navigate(['/servicios']);
      }
    });
  }

  formatDate(date: string | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  navigateToEdit(): void {
    this.router.navigate(['/servicios', this.servicioId, 'editar']);
  }

  navigateBack(): void {
    this.router.navigate(['/servicios']);
  }

  async generatePdf(): Promise<void> {
    const s = this.servicio();
    if (!s) return;

    this.generatingPdf.set(true);

    try {
      const pdfData: ServiceOrderData = {
        folio: s.folio,
        fechaServicio: s.fechaServicio,
        estado: s.estado,
        cliente: {
          nombre: s.cliente?.nombre || 'N/A',
          empresa: s.cliente?.empresa,
          telefono: s.cliente?.telefono,
          email: s.cliente?.email
        },
        sucursal: s.sucursal ? {
          nombre: s.sucursal.nombre,
          direccion: s.sucursal.direccion
        } : undefined,
        equipos: s.equiposAsignados?.length > 0
          ? s.equiposAsignados.map((item: any) => ({
            nombre: item.equipo?.nombre || 'N/A',
            modelo: item.equipo?.modelo,
            serie: item.equipo?.serie,
            marca: item.equipo?.marca?.nombre
          }))
          : [{
            nombre: s.equipo?.nombre || 'N/A',
            modelo: s.equipo?.modelo,
            serie: s.equipo?.serie,
            marca: s.equipo?.marca?.nombre
          }],
        tecnico: {
          nombre: s.tecnico?.nombre || 'N/A'
        },
        tipoServicio: {
          nombre: s.tipoServicio?.nombre || 'N/A'
        },
        descripcion: s.descripcion,
        detalleTrabajo: s.detalleTrabajo,
        firmaCliente: s.firma || undefined,
        firmaTecnico: s.tecnico?.firma || undefined,
        fotos: s.fotos?.map((f: any) => ({
          url: f.url || '',
          tipo: f.tipo || 'antes'
        })) || []
      };

      const { blobUrl, filename } = await this.pdfService.generateServiceOrder(pdfData);
      this.pdfUrl.set(blobUrl);
      this.pdfFilename.set(filename);
      this.showPdfPreview.set(true);
      this.notificationService.success('PDF generado correctamente');
    } catch (error) {
      this.notificationService.error('Error al generar el PDF');
    } finally {
      this.generatingPdf.set(false);
    }
  }

  closePdfPreview(): void {
    this.showPdfPreview.set(false);
    this.pdfUrl.set(null);
  }

  sendPdfByEmail(): void {
    const s = this.servicio();
    if (!s) return;

    // Validar que el cliente tenga email
    if (!s.cliente?.email) {
      this.emailInput.set('');
      this.showEmailModal.set(true);
      return;
    }

    // Confirmar envío
    if (!confirm(`¿Enviar PDF al email: ${s.cliente.email}?`)) {
      return;
    }

    this.generatingPdf.set(true);
    this.serviciosService.sendPdf(this.servicioId!).subscribe({
      next: (response) => {
        this.notificationService.success(`PDF enviado exitosamente a ${response.email}`);
        this.generatingPdf.set(false);
      },
      error: (error) => {
        const message = error.error?.message || 'Error al enviar el PDF';
        this.notificationService.error(message);
        this.generatingPdf.set(false);
      }
    });
  }

  // Email Modal Logic
  showEmailModal = signal(false);
  emailInput = signal('');
  updatingEmail = signal(false);

  closeEmailModal(): void {
    this.showEmailModal.set(false);
    this.emailInput.set('');
  }

  submitEmail(): void {
    const email = this.emailInput().trim();
    if (!email) {
      this.notificationService.warning('Ingresa un correo electrónico');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.notificationService.warning('Ingresa un correo válido');
      return;
    }

    const s = this.servicio();
    if (!s || !s.cliente) return;

    this.updatingEmail.set(true);

    this.clientesService.update(s.cliente.idCliente, { email }).subscribe({
      next: (updatedCliente) => {
        this.notificationService.success('Correo actualizado correctamente');

        // Update local state
        const updatedServicio = { ...s, cliente: { ...s.cliente, email: updatedCliente.email } };
        this.servicio.set(updatedServicio);

        this.closeEmailModal();
        this.updatingEmail.set(false);

        // Retry sending PDF
        this.sendPdfByEmail();
      },
      error: () => {
        this.notificationService.error('Error al actualizar el correo del cliente');
        this.updatingEmail.set(false);
      }
    });
  }
}
