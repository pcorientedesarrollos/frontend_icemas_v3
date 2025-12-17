import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-cliente-detail',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="p-6">
      <h2 class="text-2xl font-bold">Cliente Detail (En desarrollo)</h2>
      <p class="text-gray-600 mt-2">Detalle de cliente próximamente...</p>
    </div>
  `
})
export class ClienteDetailComponent { }
