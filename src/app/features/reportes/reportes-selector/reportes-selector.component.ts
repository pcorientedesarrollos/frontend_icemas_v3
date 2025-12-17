import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-reportes-selector',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="p-6">
      <h2 class="text-2xl font-bold">Reportes (En desarrollo)</h2>
    </div>
  `
})
export class ReportesSelectorComponent { }
