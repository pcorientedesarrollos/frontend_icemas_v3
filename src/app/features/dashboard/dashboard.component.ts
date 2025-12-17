import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="space-y-6">
      <!-- Header -->
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p class="text-gray-600 mt-1">Bienvenido al sistema de gestión de servicios ICEMAS</p>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        @for (stat of stats; track stat.label) {
          <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">{{ stat.label }}</p>
                <p class="text-2xl font-bold text-gray-900 mt-2">{{ stat.value }}</p>
              </div>
              <div [class]="'w-12 h-12 rounded-lg flex items-center justify-center ' + stat.color">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="stat.icon" />
                </svg>
              </div>
            </div>
            <div class="mt-4 flex items-center text-sm">
              <span [class]="stat.trend === 'up' ? 'text-green-600' : 'text-red-600'">
                {{ stat.trend === 'up' ? '↑' : '↓' }} {{ stat.change }}
              </span>
              <span class="text-gray-500 ml-2">vs mes anterior</span>
            </div>
          </div>
        }
      </div>

      <!-- Recent Activity -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Servicios Pendientes -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200">
          <div class="p-6 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">Servicios Pendientes</h2>
          </div>
          <div class="p-6">
            <div class="space-y-4">
              @for (item of recentServices; track item.folio) {
                <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p class="font-medium text-gray-900">{{ item.folio }}</p>
                    <p class="text-sm text-gray-600">{{ item.cliente }}</p>
                  </div>
                  <span class="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
                    Pendiente
                  </span>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Técnicos Activos -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200">
          <div class="p-6 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">Técnicos Activos</h2>
          </div>
          <div class="p-6">
            <div class="space-y-4">
              @for (tech of technicians; track tech.name) {
                <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <span class="text-primary-700 font-medium">{{ tech.initials }}</span>
                    </div>
                    <div>
                      <p class="font-medium text-gray-900">{{ tech.name }}</p>
                      <p class="text-sm text-gray-600">{{ tech.specialty }}</p>
                    </div>
                  </div>
                  <span class="text-sm font-medium text-green-600">
                    {{ tech.activeServices }} servicios
                  </span>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent {
    stats = [
        {
            label: 'Servicios Totales',
            value: '248',
            change: '+12%',
            trend: 'up',
            color: 'bg-blue-500',
            icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
        },
        {
            label: 'Pendientes',
            value: '12',
            change: '+5%',
            trend: 'up',
            color: 'bg-yellow-500',
            icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
        },
        {
            label: 'Completados',
            value: '194',
            change: '+8%',
            trend: 'up',
            color: 'bg-green-500',
            icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
        },
        {
            label: 'Técnicos Activos',
            value: '8',
            change: '0%',
            trend: 'up',
            color: 'bg-purple-500',
            icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
        }
    ];

    recentServices = [
        { folio: 'SRV-001', cliente: 'VIPS Mérida Centro' },
        { folio: 'SRV-002', cliente: 'Oxxo Montejo' },
        { folio: 'SRV-003', cliente: 'Liverpool Altabrisa' },
    ];

    technicians = [
        { name: 'Juan Pérez', specialty: 'Refrigeración', initials: 'JP', activeServices: 3 },
        { name: 'María García', specialty: 'Aires Acondicionados', initials: 'MG', activeServices: 5 },
        { name: 'Carlos López', specialty: 'Mantenimiento', initials: 'CL', activeServices: 2 },
    ];
}
