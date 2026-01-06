import { Component, signal, output, input, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ServicePhoto {
  id?: number;
  url: string;
  tipo: 'antes' | 'despues';
  descripcion?: string;
  file?: File;
}

@Component({
  selector: 'app-photo-capture',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="photo-capture-container">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-medium text-gray-900">{{ title() }}</h3>
        <span class="text-xs text-gray-500">{{ photos().length }} foto(s)</span>
      </div>

      <!-- Photo Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
        @for (photo of photos(); track $index) {
          <div class="relative group aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
            <img 
              [src]="photo.url" 
              [alt]="photo.descripcion || 'Foto de servicio'"
              class="w-full h-full object-cover"
            />
            <!-- Overlay with actions -->
            <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                type="button"
                (click)="viewPhoto(photo)"
                class="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
              >
                <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
              <button
                type="button"
                (click)="removePhoto($index)"
                class="p-2 bg-red-500/80 rounded-full hover:bg-red-600 transition-colors"
              >
                <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        }

        <!-- Add Photo Button -->
        <div 
          class="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-primary-400 transition-colors flex flex-col items-center justify-center cursor-pointer bg-gray-50 hover:bg-primary-50"
          (click)="openFileInput()"
        >
          <svg class="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <span class="text-xs text-gray-500 mt-1">Agregar foto</span>
        </div>
      </div>

      <!-- Hidden File Input -->
      <input
        #fileInput
        type="file"
        accept="image/*"
        [attr.capture]="useCamera() ? 'environment' : null"
        class="hidden"
        (change)="onFileSelected($event)"
        multiple
      />

      <!-- Lightbox -->
      @if (selectedPhoto()) {
        <div class="fixed inset-0 bg-black/90 flex items-center justify-center z-50" (click)="selectedPhoto.set(null)">
          <button
            type="button"
            (click)="selectedPhoto.set(null)"
            class="absolute top-4 right-4 p-2 text-white/70 hover:text-white"
          >
            <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img 
            [src]="selectedPhoto()!.url" 
            alt="Vista ampliada"
            class="max-w-full max-h-[90vh] object-contain"
            (click)="$event.stopPropagation()"
          />
        </div>
      }
    </div>
  `,
  styles: [`
    .photo-capture-container {
      width: 100%;
    }
  `]
})
export class PhotoCaptureComponent implements OnInit {
  // Inputs
  title = input<string>('Fotos del Servicio');
  useCamera = input<boolean>(true);
  maxPhotos = input<number>(10);
  initialPhotos = input<ServicePhoto[]>([]);

  // Outputs
  photosChanged = output<ServicePhoto[]>();
  photoAdded = output<ServicePhoto>();
  photoRemoved = output<ServicePhoto>();

  // State
  photos = signal<ServicePhoto[]>([]);
  selectedPhoto = signal<ServicePhoto | null>(null);

  private fileInputRef: HTMLInputElement | null = null;

  constructor() {
    // React to changes in initialPhotos
    effect(() => {
      const initial = this.initialPhotos();
      if (initial && initial.length > 0) {
        this.photos.set([...initial]);
      }
    });
  }

  ngOnInit(): void {
    if (this.initialPhotos().length > 0) {
      this.photos.set([...this.initialPhotos()]);
    }
  }

  openFileInput(): void {
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (input && this.photos().length < this.maxPhotos()) {
      input.click();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const files = Array.from(input.files);
      const newPhotos: ServicePhoto[] = [];

      for (const file of files) {
        const url = URL.createObjectURL(file);
        const photo: ServicePhoto = {
          url,
          tipo: 'antes', // Default to 'antes'
          file,
          descripcion: ''
        };
        newPhotos.push(photo);
        this.photoAdded.emit(photo);
      }

      this.photos.update(current => [...current, ...newPhotos].slice(0, this.maxPhotos()));
      this.photosChanged.emit(this.photos());
      input.value = ''; // Reset input
    }
  }

  viewPhoto(photo: ServicePhoto): void {
    this.selectedPhoto.set(photo);
  }

  removePhoto(index: number): void {
    const removed = this.photos()[index];
    this.photos.update(current => current.filter((_, i) => i !== index));
    this.photoRemoved.emit(removed);
    this.photosChanged.emit(this.photos());

    // Revoke object URL to free memory
    if (removed.file) {
      URL.revokeObjectURL(removed.url);
    }
  }

  // Public method to get photos for upload
  getPhotosForUpload(): { file: File; tipo: string }[] {
    return this.photos()
      .filter(p => p.file)
      .map(p => ({ file: p.file!, tipo: p.tipo }));
  }
}
