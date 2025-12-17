import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-cliente-form',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="p-6">
      <h2 class="text-2xl font-bold">Cliente Form (En desarrollo)</h2>
      <p class="text-gray-600 mt-2">Formulario de cliente próximamente...</p>
    </div>
  `
})
export class ClienteFormComponent { }
