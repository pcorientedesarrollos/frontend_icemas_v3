import { Component, Input, Output, EventEmitter, forwardRef, signal, computed, ElementRef, HostListener, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-searchable-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="relative w-full text-left">
      <!-- Hidden Input for Focus Handling -->
      <button
        type="button"
        (click)="toggleOpen()"
        [class]="disabled() ? 'cursor-not-allowed bg-gray-100' : 'cursor-pointer bg-gray-50 hover:bg-white'"
        class="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-gray-700 h-[46px]"
        [disabled]="disabled()"
      >
        <span class="truncate block" [class.text-gray-500]="!selectedOption()">
          {{ selectedLabel() || placeholder }}
        </span>
        <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <svg class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z" clip-rule="evenodd" />
            </svg>
        </span>
      </button>

      <!-- Dropdown Panel -->
      @if (isOpen()) {
        <div class="absolute z-50 mt-1 w-full rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none max-h-60 overflow-hidden flex flex-col">
          <!-- Search Input -->
          <div class="p-2 sticky top-0 bg-white border-b border-gray-100">
            <input
              #searchInput
              type="text"
              class="w-full px-3 py-2 text-base sm:text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              placeholder="Buscar..."
              [ngModel]="searchTerm()"
              (ngModelChange)="updateSearch($event)"
              (keydown)="onKeydown($event)"
            />
          </div>
          
          <!-- Options List -->
          <ul class="max-h-60 overflow-auto py-1 text-base ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm" tabindex="-1" role="listbox">
             @if (filteredOptions().length === 0) {
               <li class="cursor-default select-none py-2 pl-3 pr-9 text-gray-700 italic px-2 text-center">
                 No se encontraron resultados
               </li>
             }
              @for (option of filteredOptions(); track getOptionValue(option)) {
               <li
                 class="relative cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-primary-50 text-gray-900"
                 [class.bg-primary-50]="getOptionValue(option) === value()"
                 [class.text-primary-900]="getOptionValue(option) === value()"
                 (click)="selectOption(option)"
               >
                 <span class="block truncate" [class.font-semibold]="getOptionValue(option) === value()">
                   {{ getOptionDisplay(option) }}
                 </span>
                 
                 @if (getOptionValue(option) === value()) {
                   <span class="absolute inset-y-0 right-0 flex items-center pr-4 text-primary-600">
                     <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                       <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
                     </svg>
                   </span>
                 }
               </li>
             }
          </ul>
        </div>
      }
    </div>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchableSelectComponent),
      multi: true
    }
  ]
})
export class SearchableSelectComponent implements ControlValueAccessor, OnChanges {
  // Config
  private _options = signal<any[]>([]);
  @Input()
  set options(value: any[]) {
    this._options.set(value || []);
  }
  get options(): any[] {
    return this._options();
  }

  @Input() valueKey: string = 'id'; // Key to use as value (if options are objects)
  @Input() labelKey: string = 'name'; // Key or keys to display
  @Input() placeholder: string = 'Seleccionar...';

  @Output() selectionChange = new EventEmitter<any>();

  // State
  isOpen = signal(false);
  searchTerm = signal('');
  value = signal<any>(null);
  disabled = signal(false);

  private elementRef = inject(ElementRef);

  // Computed
  filteredOptions = computed(() => {
    const search = this.searchTerm().toLowerCase();
    const all = this._options();
    if (!search) return all;

    return all.filter(opt => {
      const display = this.getOptionDisplay(opt).toLowerCase();
      return display.includes(search);
    });
  });

  selectedOption = computed(() => {
    const val = this.value();
    if (val === null || val === undefined) return null;
    return this._options()?.find(opt => this.getOptionValue(opt) == val); // Loose equality for consistency
  });

  selectedLabel = computed(() => {
    const opt = this.selectedOption();
    return opt ? this.getOptionDisplay(opt) : '';
  });

  // Lifecycle
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['options'] && !changes['options'].firstChange) {
      // Maybe validate current value still exists?
    }
  }

  // Value Accessor Methods
  onChange: any = () => { };
  onTouched: any = () => { };

  writeValue(obj: any): void {
    this.value.set(obj);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  // Helpers
  toggleOpen() {
    if (this.disabled()) return;
    this.isOpen.update(v => !v);
    if (this.isOpen()) {
      // Focus search input on next tick
      setTimeout(() => {
        const input = this.elementRef.nativeElement.querySelector('input');
        if (input) input.focus();
      });
    } else {
      this.onTouched();
    }
  }

  close() {
    this.isOpen.set(false);
    this.onTouched();
  }

  selectOption(option: any) {
    const val = this.getOptionValue(option);
    this.value.set(val);
    this.onChange(val);
    this.selectionChange.emit(val);
    this.close();
    this.searchTerm.set(''); // Reset search
  }

  getOptionValue(option: any): any {
    if (typeof option === 'object' && option !== null) {
      if (!this.valueKey) return option; // Return full object if no key specified (rare for selects)
      return option[this.valueKey];
    }
    return option;
  }

  getOptionDisplay(option: any): string {
    if (typeof option === 'object' && option !== null) {
      // Support labelKey as 'name' or composite keys if implemented custom logic later
      // For now, basic support:
      if (this.labelKey.includes('+')) {
        // 'nombre + apellido' logic could go here if needed, but keeping it simple for now
      }
      return option[this.labelKey] || JSON.stringify(option);
    }
    return String(option);
  }

  updateSearch(term: string) {
    this.searchTerm.set(term);
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.close();
    }
    // Add arrow navigation if needed
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.close();
    }
  }
}
