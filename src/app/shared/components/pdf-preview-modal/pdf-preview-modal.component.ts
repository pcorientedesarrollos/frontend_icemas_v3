import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-pdf-preview-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen) {
      <div class="fixed inset-0 z-50 overflow-y-auto">
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" (click)="onCancel()"></div>
        
        <!-- Modal -->
        <div class="flex min-h-screen items-center justify-center p-4">
          <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col" (click)="$event.stopPropagation()">
            
            <!-- Header -->
            <div class="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 class="text-xl font-semibold text-gray-900">Previsualización del Reporte</h3>
              <button (click)="onCancel()" class="text-gray-400 hover:text-gray-600 transition-colors">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- PDF Preview -->
            <div class="flex-1 overflow-hidden bg-gray-100 p-4">
              @if (safePdfUrl()) {
                <iframe 
                  [src]="safePdfUrl()!" 
                  class="w-full h-full min-h-[600px] rounded-lg border-2 border-gray-300"
                  type="application/pdf">
                </iframe>
              } @else {
                <div class="flex items-center justify-center h-full">
                  <div class="text-center">
                    <svg class="mx-auto h-12 w-12 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p class="mt-4 text-gray-500">Generando previsualización...</p>
                  </div>
                </div>
              }
            </div>

            <!-- Footer -->
            <div class="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button 
                (click)="onCancel()"
                class="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button 
                (click)="onDownload()"
                class="px-6 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Descargar PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class PdfPreviewModalComponent {
  @Input() isOpen: boolean = false;
  @Input() pdfUrl: string | null = null;
  @Input() fileName: string = 'reporte.pdf';

  @Output() isOpenChange = new EventEmitter<boolean>();
  @Output() download = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  safePdfUrl = signal<SafeResourceUrl | null>(null);

  private sanitizer = inject(DomSanitizer);

  ngOnChanges() {
    if (this.pdfUrl && this.isOpen) {
      this.safePdfUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfUrl));
    } else {
      this.safePdfUrl.set(null);
    }
  }

  onDownload() {
    if (this.pdfUrl) {
      const link = document.createElement('a');
      link.href = this.pdfUrl;
      link.download = this.fileName;
      link.click();
    }
    this.download.emit();
  }

  onCancel() {
    // Revoke URL when closing
    if (this.pdfUrl) {
      URL.revokeObjectURL(this.pdfUrl);
    }
    this.cancel.emit();
  }

  ngOnDestroy() {
    // Clean up object URL
    if (this.pdfUrl) {
      URL.revokeObjectURL(this.pdfUrl);
    }
  }
}
