import { Injectable, inject } from '@angular/core';
import { jsPDF } from 'jspdf';

export interface ServiceOrderData {
    folio: string;
    fechaServicio: string;
    estado: string;
    cliente: {
        nombre: string;
        empresa?: string;
        telefono?: string;
        email?: string;
    };
    sucursal?: {
        nombre: string;
        direccion?: string;
    };
    equipo: {
        nombre: string;
        modelo?: string;
        serie?: string;
        marca?: string;
    };
    tecnico: {
        nombre: string;
    };
    tipoServicio: {
        nombre: string;
    };
    descripcion?: string;
    detalleTrabajo?: string;
    firmaCliente?: string;
    fotos?: { url: string; tipo: 'antes' | 'despues' }[];
}

@Injectable({
    providedIn: 'root'
})
export class PdfService {

    private readonly COLORS = {
        primary: '#F5A623',    // Brand Orange
        secondary: '#E89317',  // Darker Orange
        text: '#1F2937',       // Gray 800
        lightText: '#6B7280',  // Gray 500
        border: '#E5E7EB',     // Gray 200
        background: '#F9FAFB', // Gray 50
        success: '#10B981',    // Green
        warning: '#F59E0B',    // Amber
        danger: '#EF4444'      // Red
    };

    async generateServiceOrder(data: ServiceOrderData): Promise<void> {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // Load Logo
        let logoData = '';
        try {
            logoData = await this.loadImage('/image/Logo_icemas_circular.png');
        } catch (e) {
            console.error('Could not load logo for PDF', e);
        }

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 15;
        let yPos = margin;

        // ===== HEADER =====
        yPos = this.drawHeader(doc, data, margin, yPos, pageWidth, logoData);

        // ===== SERVICE INFO =====
        yPos = this.drawServiceInfo(doc, data, margin, yPos, pageWidth);

        // ===== CLIENT INFO =====
        yPos = this.drawClientInfo(doc, data, margin, yPos, pageWidth);

        // ===== EQUIPMENT INFO =====
        yPos = this.drawEquipmentInfo(doc, data, margin, yPos, pageWidth);

        // ===== WORK DETAILS =====
        yPos = this.drawWorkDetails(doc, data, margin, yPos, pageWidth);

        // ===== SIGNATURE =====
        if (data.firmaCliente) {
            yPos = this.drawSignature(doc, data, margin, yPos, pageWidth, pageHeight);
        }

        // ===== PHOTOS =====
        if (data.fotos && data.fotos.length > 0) {
            yPos = this.drawPhotos(doc, data, margin, yPos, pageWidth, pageHeight);
        }

        // ===== FOOTER =====
        this.drawFooter(doc, pageWidth, pageHeight, margin);

        // Save the PDF
        const filename = `orden_servicio_${data.folio.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        doc.save(filename);
    }

    private drawHeader(doc: jsPDF, data: ServiceOrderData, margin: number, yPos: number, pageWidth: number, logoData: string): number {
        // Header Background
        // Brand Orange: #F5A623 -> 245, 166, 35
        doc.setFillColor(245, 166, 35);
        doc.rect(0, 0, pageWidth, 28, 'F'); // Increased height slightly

        // Logo
        if (logoData) {
            // Add image at (x, y, w, h)
            doc.addImage(logoData, 'PNG', margin, 3, 22, 22);
        } else {
            // Fallback text if image fails
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(22);
            doc.setTextColor(255, 255, 255);
            doc.text('ICEMAS', margin, 18);
        }

        // Company Slogan
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        // Adjusted position relative to Logo
        doc.text('Sistema de Gestión de Servicios', margin + 28, 17);

        // Order number and status
        doc.setFontSize(12);
        doc.text(`Orden: ${data.folio}`, pageWidth - margin, 12, { align: 'right' });

        // Status badge
        const status = data.estado;
        doc.setFillColor(this.getStatusColor(status).r, this.getStatusColor(status).g, this.getStatusColor(status).b);
        const statusWidth = doc.getTextWidth(status) + 8;
        doc.roundedRect(pageWidth - margin - statusWidth, 15, statusWidth, 6, 2, 2, 'F');
        doc.setFontSize(8);
        doc.text(status, pageWidth - margin - statusWidth / 2, 19, { align: 'center' });

        return 38; // Increased return Y position
    }

    private loadImage(url: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.src = url;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL('image/png'));
                } else {
                    reject(new Error('Canvas context failed'));
                }
            };
            img.onerror = (e) => reject(e);
        });
    }

    private drawServiceInfo(doc: jsPDF, data: ServiceOrderData, margin: number, yPos: number, pageWidth: number): number {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(245, 166, 35); // Brand Orange
        doc.text('INFORMACIÓN DEL SERVICIO', margin, yPos);

        yPos += 8;
        doc.setDrawColor(229, 231, 235);
        doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(31, 41, 55);

        const col1 = margin;
        const col2 = pageWidth / 2;

        // Row 1
        yPos += 5;
        doc.setFont('helvetica', 'bold');
        doc.text('Fecha:', col1, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(this.formatDate(data.fechaServicio), col1 + 25, yPos);

        doc.setFont('helvetica', 'bold');
        doc.text('Tipo de Servicio:', col2, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(data.tipoServicio?.nombre || 'N/A', col2 + 35, yPos);

        // Row 2
        yPos += 7;
        doc.setFont('helvetica', 'bold');
        doc.text('Técnico:', col1, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(data.tecnico?.nombre || 'N/A', col1 + 25, yPos);

        return yPos + 12;
    }

    private drawClientInfo(doc: jsPDF, data: ServiceOrderData, margin: number, yPos: number, pageWidth: number): number {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(245, 166, 35); // Brand Orange
        doc.text('DATOS DEL CLIENTE', margin, yPos);

        yPos += 8;
        doc.setDrawColor(229, 231, 235);
        doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(31, 41, 55);

        const col1 = margin;
        const col2 = pageWidth / 2;

        yPos += 5;
        doc.setFont('helvetica', 'bold');
        doc.text('Nombre:', col1, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(data.cliente?.nombre || 'N/A', col1 + 25, yPos);

        if (data.cliente?.empresa) {
            doc.setFont('helvetica', 'bold');
            doc.text('Empresa:', col2, yPos);
            doc.setFont('helvetica', 'normal');
            doc.text(data.cliente.empresa, col2 + 25, yPos);
        }

        yPos += 7;
        if (data.cliente?.telefono) {
            doc.setFont('helvetica', 'bold');
            doc.text('Teléfono:', col1, yPos);
            doc.setFont('helvetica', 'normal');
            doc.text(data.cliente.telefono, col1 + 25, yPos);
        }

        if (data.cliente?.email) {
            doc.setFont('helvetica', 'bold');
            doc.text('Email:', col2, yPos);
            doc.setFont('helvetica', 'normal');
            doc.text(data.cliente.email, col2 + 25, yPos);
        }

        if (data.sucursal) {
            yPos += 7;
            doc.setFont('helvetica', 'bold');
            doc.text('Sucursal:', col1, yPos);
            doc.setFont('helvetica', 'normal');
            doc.text(data.sucursal.nombre, col1 + 25, yPos);

            if (data.sucursal.direccion) {
                yPos += 7;
                doc.setFont('helvetica', 'bold');
                doc.text('Dirección:', col1, yPos);
                doc.setFont('helvetica', 'normal');
                const lines = doc.splitTextToSize(data.sucursal.direccion, pageWidth - margin * 2 - 30);
                doc.text(lines, col1 + 25, yPos);
                yPos += (lines.length - 1) * 5;
            }
        }

        return yPos + 12;
    }

    private drawEquipmentInfo(doc: jsPDF, data: ServiceOrderData, margin: number, yPos: number, pageWidth: number): number {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(245, 166, 35); // Brand Orange
        doc.text('EQUIPO', margin, yPos);

        yPos += 8;
        doc.setDrawColor(229, 231, 235);
        doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(31, 41, 55);

        const col1 = margin;
        const col2 = pageWidth / 2;

        yPos += 5;
        doc.setFont('helvetica', 'bold');
        doc.text('Equipo:', col1, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(data.equipo?.nombre || 'N/A', col1 + 25, yPos);

        if (data.equipo?.marca) {
            doc.setFont('helvetica', 'bold');
            doc.text('Marca:', col2, yPos);
            doc.setFont('helvetica', 'normal');
            doc.text(data.equipo.marca, col2 + 25, yPos);
        }

        yPos += 7;
        if (data.equipo?.modelo) {
            doc.setFont('helvetica', 'bold');
            doc.text('Modelo:', col1, yPos);
            doc.setFont('helvetica', 'normal');
            doc.text(data.equipo.modelo, col1 + 25, yPos);
        }

        if (data.equipo?.serie) {
            doc.setFont('helvetica', 'bold');
            doc.text('Serie:', col2, yPos);
            doc.setFont('helvetica', 'normal');
            doc.text(data.equipo.serie, col2 + 25, yPos);
        }

        return yPos + 12;
    }

    private drawWorkDetails(doc: jsPDF, data: ServiceOrderData, margin: number, yPos: number, pageWidth: number): number {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(245, 166, 35); // Brand Orange
        doc.text('DETALLE DEL TRABAJO', margin, yPos);

        yPos += 8;
        doc.setDrawColor(229, 231, 235);
        doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(31, 41, 55);

        // Description
        if (data.descripcion) {
            yPos += 5;
            doc.setFont('helvetica', 'bold');
            doc.text('Descripción del Problema:', margin, yPos);
            yPos += 6;
            doc.setFont('helvetica', 'normal');
            const descLines = doc.splitTextToSize(data.descripcion, pageWidth - margin * 2);
            doc.text(descLines, margin, yPos);
            yPos += descLines.length * 5 + 5;
        }

        // Work performed
        if (data.detalleTrabajo) {
            doc.setFont('helvetica', 'bold');
            doc.text('Trabajo Realizado:', margin, yPos);
            yPos += 6;
            doc.setFont('helvetica', 'normal');
            const workLines = doc.splitTextToSize(data.detalleTrabajo, pageWidth - margin * 2);
            doc.text(workLines, margin, yPos);
            yPos += workLines.length * 5;
        }

        return yPos + 12;
    }

    private drawSignature(doc: jsPDF, data: ServiceOrderData, margin: number, yPos: number, pageWidth: number, pageHeight: number): number {
        // Check if we need a new page
        if (yPos > pageHeight - 60) {
            doc.addPage();
            yPos = 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(245, 166, 35); // Brand Orange
        doc.text('FIRMA DEL CLIENTE', margin, yPos);

        yPos += 8;
        doc.setDrawColor(229, 231, 235);
        doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);

        if (data.firmaCliente) {
            try {
                // Draw signature image
                const sigWidth = 60;
                const sigHeight = 25;
                doc.addImage(data.firmaCliente, 'PNG', margin, yPos + 2, sigWidth, sigHeight);
                yPos += sigHeight + 8;

                // Signature line
                doc.setDrawColor(31, 41, 55);
                doc.line(margin, yPos, margin + sigWidth, yPos);
                yPos += 4;
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8);
                doc.setTextColor(107, 114, 128);
                doc.text('Firma de Conformidad', margin + sigWidth / 2, yPos, { align: 'center' });
            } catch (e) {
                // If image fails, just show placeholder
                yPos += 5;
                doc.setFont('helvetica', 'italic');
                doc.setFontSize(10);
                doc.text('[Firma digital capturada]', margin, yPos);
            }
        }

        return yPos + 10;
    }

    private drawPhotos(doc: jsPDF, data: ServiceOrderData, margin: number, yPos: number, pageWidth: number, pageHeight: number): number {
        if (!data.fotos || data.fotos.length === 0) return yPos;

        // Check if we need a new page
        if (yPos > pageHeight - 80) {
            doc.addPage();
            yPos = 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(245, 166, 35); // Brand Orange
        doc.text('FOTOS DEL SERVICIO', margin, yPos);

        yPos += 8;
        doc.setDrawColor(229, 231, 235);
        doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);
        yPos += 5;

        const photoWidth = 80;
        const photoHeight = 60;
        const photosPerRow = 2;
        const gapX = 10;
        const gapY = 25;

        let col = 0;

        for (let i = 0; i < data.fotos.length; i++) {
            const foto = data.fotos[i];

            // Check if we need a new page
            if (yPos + photoHeight + 15 > pageHeight - 30) {
                doc.addPage();
                yPos = 20;
                col = 0;
            }

            const xPos = margin + (col * (photoWidth + gapX));

            try {
                // Add photo
                doc.addImage(foto.url, 'JPEG', xPos, yPos, photoWidth, photoHeight);

                // Add label below photo
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8);
                doc.setTextColor(107, 114, 128);
                const label = foto.tipo === 'antes' ? 'Antes del servicio' : 'Después del servicio';
                doc.text(label, xPos + photoWidth / 2, yPos + photoHeight + 4, { align: 'center' });
            } catch (e) {
                // If image fails, show placeholder
                doc.setDrawColor(200, 200, 200);
                doc.rect(xPos, yPos, photoWidth, photoHeight);
                doc.setFont('helvetica', 'italic');
                doc.setFontSize(10);
                doc.setTextColor(150, 150, 150);
                doc.text('[Foto no disponible]', xPos + photoWidth / 2, yPos + photoHeight / 2, { align: 'center' });
            }

            col++;
            if (col >= photosPerRow) {
                col = 0;
                yPos += photoHeight + gapY;
            }
        }

        // Add spacing if last row wasn't complete
        if (col !== 0) {
            yPos += photoHeight + gapY;
        }

        return yPos + 10;
    }

    private drawFooter(doc: jsPDF, pageWidth: number, pageHeight: number, margin: number): void {
        const footerY = pageHeight - 15;

        doc.setDrawColor(229, 231, 235);
        doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(107, 114, 128);

        const now = new Date();
        doc.text(`Generado el ${this.formatDate(now.toISOString())} a las ${now.toLocaleTimeString('es-MX')}`, margin, footerY);
        doc.text('ICEMAS - Sistema de Gestión de Servicios', pageWidth - margin, footerY, { align: 'right' });
    }

    private getStatusColor(status: string): { r: number; g: number; b: number } {
        switch (status.toLowerCase()) {
            case 'completado':
                return { r: 16, g: 185, b: 129 }; // Green
            case 'en proceso':
                return { r: 59, g: 130, b: 246 }; // Blue
            case 'pendiente':
                return { r: 245, g: 158, b: 11 }; // Amber
            case 'cancelado':
                return { r: 239, g: 68, b: 68 }; // Red
            default:
                return { r: 107, g: 114, b: 128 }; // Gray
        }
    }

    private formatDate(dateStr: string): string {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return dateStr;
        }
    }
}
