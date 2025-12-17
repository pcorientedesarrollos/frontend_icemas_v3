import { Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen bg-slate-50 flex">
      <!-- Sidebar Desktop -->
      <aside
        class="hidden lg:flex flex-col w-72 bg-[#1a237e] border-r border-indigo-900/10 text-white transition-all duration-300 z-50 fixed h-full shadow-2xl"
      >
        <!-- Brand -->
        <div class="p-6 flex items-center gap-3 border-b border-white/10">
            <div class="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm shadow-inner">
                <svg class="w-6 h-6 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <!-- Icono alusivo a frio/equipos -->
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            </div>
            <div class="flex flex-col">
                <span class="text-xl font-bold tracking-wide text-white leading-none">ICEMAS</span>
                <span class="text-[10px] text-cyan-200 mt-1 font-medium tracking-wider uppercase">Equipos & Servicios</span>
            </div>
        </div>

        <!-- Menu -->
        <nav class="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
            <h3 class="px-4 text-xs font-bold text-indigo-200/70 uppercase tracking-widest mb-4 mt-2">Menú Principal</h3>
            
            @for (item of menuItems; track item.path) {
                <a
                  [routerLink]="item.path"
                  routerLinkActive="bg-white/10 text-white shadow-md border-l-4 border-cyan-400"
                  class="flex items-center gap-3 px-4 py-3.5 text-indigo-100 hover:bg-white/5 hover:text-white rounded-r-xl transition-all duration-200 group border-l-4 border-transparent"
                >
                  <svg class="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" [attr.d]="item.icon" />
                  </svg>
                  <span class="font-medium text-[15px]">{{ item.label }}</span>
                </a>
            }

            <!-- Bottom Section -->
            <div class="mt-8 pt-6 border-t border-white/10">
                <h3 class="px-4 text-xs font-bold text-indigo-200/70 uppercase tracking-widest mb-4">Sistema</h3>
                <a routerLink="/settings" class="flex items-center gap-3 px-4 py-3.5 text-indigo-100 hover:bg-white/5 hover:text-white rounded-r-xl transition-all duration-200 border-l-4 border-transparent">
                    <svg class="w-5 h-5 text-indigo-300 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/></svg>
                    <span class="font-medium text-[15px]">Configuración</span>
                </a>
            </div>
        </nav>

        <!-- User Profile Footer -->
        <div class="p-4 bg-[#151c6b]">
            <div class="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group border border-white/5 shadow-sm">
                <div class="flex items-center gap-3">
                    <div class="relative">
                        <div class="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold ring-2 ring-white/20">
                            {{ getUserInitials() }}
                        </div>
                        <div class="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-[#151c6b] rounded-full"></div>
                    </div>
                    <div class="flex flex-col">
                        <span class="text-sm font-semibold text-white tracking-wide">{{ authService.currentUser()?.name ? (authService.currentUser()?.name | slice:0:15) : 'Usuario' }}</span>
                        <span class="text-[11px] text-cyan-200/80 uppercase font-medium">Administrador</span>
                    </div>
                </div>
                <button (click)="logout()" class="text-indigo-300 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded-full">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                </button>
            </div>
        </div>
      </aside>

      <!-- Sidebar Mobile Overlay -->
     @if (sidebarOpen()) {
        <div class="fixed inset-0 z-[60] lg:hidden flex">
            <div class="w-72 bg-[#1a237e] h-full text-white shadow-2xl flex flex-col relative animate-slide-in">
                 <button (click)="closeSidebar()" class="absolute top-4 right-4 text-white/50 hover:text-white">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                 </button>
                 
                 <div class="p-6 border-b border-white/10">
                     <span class="text-xl font-bold tracking-wide">ICEMAS</span>
                 </div>

                 <nav class="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                    @for (item of menuItems; track item.path) {
                        <a
                          [routerLink]="item.path"
                          (click)="closeSidebar()"
                          routerLinkActive="bg-white/10 text-white border-l-4 border-cyan-400"
                          class="flex items-center gap-3 px-4 py-3 text-indigo-100 hover:bg-white/5 rounded-r-xl transition-colors border-l-4 border-transparent"
                        >
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" [attr.d]="item.icon" />
                          </svg>
                          <span class="font-medium">{{ item.label }}</span>
                        </a>
                    }
                 </nav>
            </div>
            <div (click)="closeSidebar()" class="flex-1 bg-black/30 backdrop-blur-sm transition-opacity"></div>
        </div>
      }

      <!-- Main Content Area -->
      <div class="flex-1 lg:ml-72 flex flex-col min-h-screen transition-all duration-300">
        <!-- Topbar Mobile Only -->
        <header class="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm lg:hidden">
            <div class="flex items-center justify-between px-6 py-4">
                 <button (click)="toggleSidebar()" class="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                 </button>
                 <span class="text-gray-900 font-bold text-lg">ICEMAS</span>
                 <div class="w-8"></div><!-- Spacer -->
            </div>
        </header>

        <!-- Dynamic Content Background -->
        <main class="flex-1 p-6 lg:p-8 overflow-x-hidden bg-slate-50">
            <router-outlet />
        </main>
      </div>

    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar {
        width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.2);
    }
    @keyframes slide-in {
        from { transform: translateX(-100%); }
        to { transform: translateX(0); }
    }
    .animate-slide-in {
        animation: slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
  `]
})
export class MainLayoutComponent {
  authService = inject(AuthService);
  private router = inject(Router);

  sidebarOpen = signal(false);

  menuItems = [
    { label: 'Dashboard', path: '/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { label: 'Clientes', path: '/clientes', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { label: 'Equipos', path: '/equipos', icon: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z' },
    { label: 'Servicios', path: '/servicios', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
    { label: 'Técnicos', path: '/tecnicos', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
    { label: 'Reportes', path: '/reportes', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  ];

  toggleSidebar(): void {
    this.sidebarOpen.update(value => !value);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  getUserInitials(): string {
    const name = this.authService.currentUser()?.name || 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  logout(): void {
    this.authService.logout();
  }
}
