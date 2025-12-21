import { Component, input, output, signal, computed, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

export interface CatalogTableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  type?: 'text' | 'number' | 'date' | 'badge' | 'button';
  badgeColors?: { [key: string]: string };
  format?: (value: any) => string;
  action?: (row: any) => void;
  icon?: string; // Optional icon for button
  buttonText?: string; // Optional text for button override
  hideOnMobile?: boolean; // Hide this column on small screens
  width?: string; // Specific width (e.g. '1px', '50px', 'w-1')
  maxWidth?: string; // Max width for column (e.g., '200px', '15rem')
  iconOnly?: boolean; // If true, hides the text and only shows icon
  buttonStyle?: 'standard' | 'circle';
}

export interface CatalogTableAction {
  label: string;
  icon?: string;
  color: 'primary' | 'danger' | 'success';
  visible?: (row: any) => boolean;
  onClick: (row: any) => void;
}

@Component({
  selector: 'app-catalog-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  host: {
    '(window:resize)': 'onResize()',
    '(window:scroll)': 'onScroll()'
  },
  template: `
    <!-- Minimized container, transparent bg, fit content strategy -->
    <div class="flex flex-col h-full bg-transparent w-fit max-w-full">
      
      <!-- Header with Search and Actions -->
      <!-- Reduced padding from px-4 py-4 to px-3 py-2 -->
      <div class="px-3 py-2 flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between bg-white border-b border-gray-100 rounded-t-lg w-full">
        
        <!-- Search (Left) -->
        <div class="w-full sm:w-auto">
          @if (searchable()) {
            <div class="relative">
              <input
                type="text"
                [(ngModel)]="searchTerm"
                (ngModelChange)="onSearch()"
                placeholder="Buscar..."
                class="w-48 pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:ring-1 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all placeholder-gray-400 text-gray-700"
              />
              <svg class="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          } @else {
            <ng-content select="[header-search]"></ng-content>
          }
        </div>

        <!-- Actions (Right) -->
        <div class="flex items-center gap-2">
            <ng-content select="[header-actions]"></ng-content>
        </div>
      </div>

      <!-- Table Container -->
      <div class="bg-white rounded-b-lg shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col items-start overflow-x-auto w-full">
          <div class="min-w-full inline-block align-middle">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-primary-500 border-b border-primary-600">
                <tr>
                  @for (column of columns(); track column.key) {
                    <th 
                      [ngClass]="column.hideOnMobile ? 'px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-primary-600 transition-colors select-none hidden md:table-cell' : 'px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-primary-600 transition-colors select-none'"
                      [class]="column.width || ''"
                      (click)="column.sortable !== false ? onSort(column.key) : null"
                    >
                      <div class="flex items-center gap-1.5 group whitespace-nowrap">
                        {{ column.label }}
                        @if (column.sortable !== false) {
                          <span class="text-white/70 group-hover:text-white transition-colors">
                            @if (sortColumn() === column.key) {
                                @if (sortDirection() === 'asc') {
                                    <svg class="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clip-rule="evenodd" /></svg>
                                } @else {
                                    <svg class="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
                                }
                            } @else {
                                 <svg class="w-3 h-3 opacity-0 group-hover:opacity-100" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clip-rule="evenodd" /></svg>
                            }
                          </span>
                        }
                      </div>
                    </th>
                  }
                  @if (actions() && actions()!.length > 0) {
                    <th class="px-3 py-2 text-right text-xs font-semibold text-white uppercase tracking-wider sticky right-0 bg-primary-500 w-1 whitespace-nowrap">
                      Acciones
                    </th>
                  }
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                @if (loading()) {
                  <tr>
                    <td [attr.colspan]="columns().length + (actions()?.length ? 1 : 0)" class="px-3 py-8 text-center w-full">
                      <div class="flex justify-center w-full">
                        <svg class="animate-spin h-6 w-6 text-primary-500" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    </td>
                  </tr>
                } @else if (paginatedData().length === 0) {
                  <tr>
                    <td [attr.colspan]="columns().length + (actions()?.length ? 1 : 0)" class="px-3 py-8 text-center text-gray-500 text-xs w-full">
                      <div class="flex flex-col items-center gap-1.5 w-full">
                        <svg class="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <span>No se encontraron resultados</span>
                      </div>
                    </td>
                  </tr>
                } @else {
                  @for (row of paginatedData(); track row) {
                    <tr class="hover:bg-primary-50/30 transition-colors group/row">
                      @for (column of columns(); track column.key) {
                        <!-- Reduced horizontal padding from px-2 to px-3 (wait, current data-table has px-2. I'll stick to px-3 to give a bit of breath but tighter than normal implementation) -->
                        <!-- Actually user wants "pequeña", so compact. I'll use px-3 py-1.5 -->
                        <td [ngClass]="column.hideOnMobile ? 'px-3 py-1.5 hidden md:table-cell' : 'px-3 py-1.5'" 
                            [style.maxWidth]="column.maxWidth || 'auto'"
                            [class]="column.width || ''">
                          @if (column.type === 'badge') {
                            @let rawValue = getNestedValue(row, column.key);
                            @let displayValue = column.format ? column.format(rawValue) : rawValue;
                            <span [class]="'px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap ' + getBadgeColor(displayValue, column.badgeColors)">
                              {{ displayValue }}
                            </span>
                          } @else if (column.type === 'button') {
                            <button 
                              (click)="$event.stopPropagation(); column.action && column.action(row)"
                              [class]="column.buttonStyle === 'circle' 
                                ? 'flex items-center justify-center w-8 h-8 text-xs font-bold text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-full transition-colors'
                                : 'inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded transition-colors'"
                            >
                                @if (column.icon) {
                                  <span [innerHTML]="getSafeHtml(column.icon)"></span>
                                }
                                @if (!column.iconOnly) {
                                  {{ column.buttonText ?? (column.format ? column.format(getNestedValue(row, column.key)) : getNestedValue(row, column.key)) ?? 'Ver' }}
                                }
                            </button>
                          } @else {
                            @if (column.format) {
                              <span class="text-xs text-gray-700 block truncate" [innerHTML]="column.format(getNestedValue(row, column.key))"></span>
                            } @else {
                              <span class="text-xs text-gray-700 block truncate" [title]="getNestedValue(row, column.key)">{{ getNestedValue(row, column.key) }}</span>
                            }
                          }
                        </td>
                      }

                      @if (actions() && actions()!.length > 0) {
                        <td class="px-3 py-1.5 whitespace-nowrap text-right text-xs font-medium sticky right-0 bg-white group-hover/row:bg-primary-50/30 transition-colors z-10 w-1">
                          <div class="relative inline-block">
                            <button
                              #actionBtn
                              (click)="toggleMenu(row, $event, actionBtn)"
                              class="p-1 rounded hover:bg-white hover:shadow-sm text-gray-400 hover:text-primary-600 transition-all border border-transparent hover:border-gray-100 focus:outline-none"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM17.25 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      }
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>

          <!-- Paginator - Inverted Order -->
          @if (totalPages() > 1) {
            <div class="w-full px-3 py-2 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/30">
              
              <!-- Left Side: "Go to" input (Formerly on Right) -->
              <div class="flex items-center gap-2 order-2 sm:order-1">
                 <span class="text-xs text-gray-500">Ir a</span>
                 <input 
                    type="number" 
                    [min]="1" 
                    [max]="totalPages()"
                    [value]="currentPage()"
                    (change)="onPageInput($event)"
                    class="bg-white w-10 border border-gray-300 text-gray-900 text-xs rounded focus:ring-primary-500 focus:border-primary-500 block px-1 py-1 text-center outline-none transition-colors"
                 />
                 <span class="text-xs text-gray-500">de {{ totalPages() }}</span>
              </div>
              
              <!-- Right Side: Pagination Links (Formerly on Left) -->
              <nav aria-label="Pagination" class="flex items-center space-x-1 order-1 sm:order-2">
                 <ul class="flex items-center -space-x-px text-xs">
                    <li>
                      <button 
                        (click)="previousPage()" 
                        [disabled]="currentPage() === 1"
                        class="flex items-center justify-center h-7 px-2 leading-tight text-gray-500 bg-white border border-gray-300 rounded-s hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <span class="sr-only">Previous</span>
                        <svg class="w-2 h-2 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 1 1 5l4 4"/>
                        </svg>
                      </button>
                    </li>
                    
                    @for (page of visiblePages(); track page) {
                       <li>
                          @if (page === -1) {
                            <span class="flex items-center justify-center h-7 px-2 leading-tight text-gray-500 bg-white border border-gray-300">...</span>
                          } @else {
                            <button 
                                (click)="goToPage(page)"
                                [class]="page === currentPage() 
                                    ? 'flex items-center justify-center h-7 w-7 text-primary-600 border border-gray-300 bg-primary-50 hover:bg-primary-100 hover:text-primary-700 font-medium' 
                                    : 'flex items-center justify-center h-7 w-7 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700'"
                            >
                                {{ page }}
                            </button>
                          }
                       </li>
                    }

                    <li>
                      <button 
                        (click)="nextPage()" 
                        [disabled]="currentPage() === totalPages()"
                        class="flex items-center justify-center h-7 px-2 leading-tight text-gray-500 bg-white border border-gray-300 rounded-e hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <span class="sr-only">Next</span>
                        <svg class="w-2 h-2 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 9 4-4-4-4"/>
                        </svg>
                      </button>
                    </li>
                 </ul>
              </nav>

            </div>
          }
      </div>
    </div>

    <!-- Fixed Menu Backdrop & Dropdown -->
    @if (activeMenuRow()) {
      <div 
        class="fixed inset-0 z-40 bg-transparent" 
        (click)="closeMenu()"
      ></div>
      <div 
        class="fixed z-50 bg-white rounded shadow-lg ring-1 ring-black/5 py-1 min-w-[140px] animate-in fade-in zoom-in-95 duration-100"
        [style.top.px]="menuPosition().y"
        [style.left.px]="menuPosition().x"
      >
        @for (action of actions(); track action.label) {
          @if (!action.visible || action.visible(activeMenuRow())) {
            <button
              (click)="handleActionClick(action, activeMenuRow())"
              class="w-full text-left px-3 py-2 text-xs hover:bg-primary-50 transition-colors flex items-center gap-2 group"
              [class.text-red-600]="action.color === 'danger'"
              [class.text-gray-700]="action.color !== 'danger'"
            >
              @if (action.color === 'primary') {
                 <!-- Eye Icon -->
                <svg class="w-3.5 h-3.5 text-primary-500 group-hover:text-primary-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              } @else if (action.color === 'success') {
                 <!-- Pencil Icon -->
                <svg class="w-3.5 h-3.5 text-emerald-500 group-hover:text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              } @else if (action.color === 'danger') {
                 <!-- Trash Icon -->
                <svg class="w-3.5 h-3.5 text-red-500 group-hover:text-red-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              }
              <span class="font-medium">{{ action.label }}</span>
            </button>
          }
        }
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
      /* removed height: 100% to let it fit content vertically if needed, or stick to block */
    }
  `]
})
export class CatalogTableComponent {
  // Inputs
  title = input<string>('');
  data = input<any[]>([]);
  columns = input.required<CatalogTableColumn[]>();
  actions = input<CatalogTableAction[]>();
  searchable = input<boolean>(true);
  loading = input<boolean>(false);
  pageSize = input<number>(10);

  // State
  searchTerm = signal('');
  sortColumn = signal<string>('');
  sortDirection = signal<'asc' | 'desc'>('asc');
  currentPage = signal(1);
  activeMenuRow = signal<any | null>(null);
  menuPosition = signal<{ x: number, y: number }>({ x: 0, y: 0 });

  private sanitizer = inject(DomSanitizer);

  Math = Math;

  getSafeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  onResize() {
    if (this.activeMenuRow()) {
      this.closeMenu();
    }
  }

  onScroll() {
    if (this.activeMenuRow()) {
      this.closeMenu();
    }
  }

  // Computed
  filteredData = computed(() => {
    let result = this.data();
    const search = this.searchTerm().toLowerCase();

    if (search) {
      result = result.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(search)
        )
      );
    }

    if (this.sortColumn()) {
      result = [...result].sort((a, b) => {
        const aVal = a[this.sortColumn()];
        const bVal = b[this.sortColumn()];
        const modifier = this.sortDirection() === 'asc' ? 1 : -1;

        if (aVal < bVal) return -1 * modifier;
        if (aVal > bVal) return 1 * modifier;
        return 0;
      });
    }

    return result;
  });

  totalPages = computed(() =>
    Math.ceil(this.filteredData().length / this.pageSize())
  );

  paginatedData = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.filteredData().slice(start, end);
  });

  // Basic window of pages logic
  visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];

    pages.push(1);

    let start = Math.max(2, current - 1);
    let end = Math.min(total - 1, current + 1);

    if (current <= 3) {
      end = Math.min(total - 1, 4);
    }
    if (current >= total - 2) {
      start = Math.max(2, total - 3);
    }

    if (start > 2) {
      pages.push(-1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < total - 1) {
      pages.push(-1);
    }

    if (total > 1) {
      pages.push(total);
    }

    return pages;
  });

  onSearch(): void {
    this.currentPage.set(1);
  }

  onSort(column: string): void {
    if (this.sortColumn() === column) {
      this.sortDirection.update(dir => dir === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
  }

  onPageInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let val = parseInt(input.value, 10);

    if (isNaN(val)) val = 1;
    if (val < 1) val = 1;
    if (val > this.totalPages()) val = this.totalPages();

    this.currentPage.set(val);
    input.value = val.toString();
  }

  getBadgeColor(value: any, colors?: { [key: string]: string }): string {
    if (colors && colors[value]) {
      return colors[value];
    }
    const stringValue = String(value).toLowerCase();

    if (['activo', 'completado', 'aprobado', 'exitoso', 'pagado', '1', 'true', 'yes', 'si'].includes(stringValue)) {
      return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
    }
    if (['inactivo', 'cancelado', 'rechazado', 'error', 'fallido', '0', 'false', 'no'].includes(stringValue)) {
      return 'bg-red-100 text-red-700 border border-red-200';
    }
    if (['pendiente', 'en espera', 'procesando', 'warning'].includes(stringValue)) {
      return 'bg-amber-100 text-amber-700 border border-amber-200';
    }
    if (['en progreso', 'en curso', 'programado'].includes(stringValue)) {
      return 'bg-primary-100 text-primary-700 border border-primary-200';
    }
    return 'bg-gray-100 text-gray-700 border border-gray-200';
  }

  toggleMenu(row: any, event: MouseEvent, button: HTMLElement): void {
    event.stopPropagation();

    if (this.activeMenuRow() === row) {
      this.closeMenu();
      return;
    }

    const rect = button.getBoundingClientRect();
    const menuWidth = 140;

    let x = rect.left - menuWidth + rect.width + 10;
    let y = rect.bottom + 5;

    if (x < 10) x = rect.left;

    this.menuPosition.set({ x, y });
    this.activeMenuRow.set(row);
  }

  closeMenu(): void {
    this.activeMenuRow.set(null);
  }

  handleActionClick(action: CatalogTableAction, row: any): void {
    this.closeMenu();
    action.onClick(row);
  }

  getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
  }
}
