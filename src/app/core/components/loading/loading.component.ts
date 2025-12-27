import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../services/loading.service';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (loadingService.isLoading()) {
      <div class="loading-overlay">
        <div class="loader-wrapper">
          <div class="logo-text" data-text="ICEMAS">ICEMAS</div>
          
          <div class="progress-container">
            <div class="progress-bar"></div>
          </div>
          
          <p class="loading-percentage">Cargando...</p>
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      --azul-icemas: #002366;
      --azul-claro: #87CEEB;
    }

    .loading-overlay {
      position: fixed;
      inset: 0;
      background-color: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(2px);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .loader-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: Arial, sans-serif;
    }

    /* Efecto de llenado en el texto */
    .logo-text {
      font-size: 2.5rem;
      font-weight: bold;
      position: relative;
      color: rgba(0, 35, 102, 0.05); /* Muy tenue */
      letter-spacing: 3px;
    }

    .logo-text::after {
      content: attr(data-text);
      position: absolute;
      left: 0;
      top: 0;
      width: 0%;
      height: 100%;
      color: var(--azul-icemas);
      overflow: hidden;
      border-right: 2px solid var(--azul-claro);
      animation: fill-text 2s ease-in-out infinite alternate;
    }

    /* Barra de progreso inferior */
    .progress-container {
      width: 120px;
      height: 3px;
      background: rgba(0,0,0,0.05);
      margin-top: 15px;
      border-radius: 10px;
      overflow: hidden;
    }

    .progress-bar {
      width: 0%;
      height: 100%;
      background: var(--azul-icemas);
      animation: progress-fill 2s ease-in-out infinite alternate;
    }

    .loading-percentage {
      margin-top: 8px;
      color: var(--azul-icemas);
      font-weight: 500;
      animation: pulse 1.5s infinite;
      font-size: 0.75rem;
      opacity: 0.8;
    }
    
    @keyframes fill-text {
      0% { width: 0%; }
      100% { width: 100%; }
    }

    @keyframes progress-fill {
      0% { width: 0%; }
      100% { width: 100%; }
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    /* Mobile adjustments */
    @media (max-width: 640px) {
      .logo-text {
        font-size: 1.8rem;
      }
      .progress-container {
        width: 100px;
      }
    }
  `]
})
export class LoadingComponent {
  loadingService = inject(LoadingService);
}
