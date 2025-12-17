import { Component, input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

export type FormFieldType = 'text' | 'email' | 'password' | 'number' | 'date' | 'textarea' | 'select';

export interface SelectOption {
    value: any;
    label: string;
}

@Component({
    selector: 'app-form-field',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    template: `
    <div class="mb-4">
      <!-- Label -->
      @if (label()) {
        <label 
          [for]="id()" 
          class="block text-sm font-medium text-gray-700 mb-2"
        >
          {{ label() }}
          @if (required()) {
            <span class="text-red-500 ml-1">*</span>
          }
        </label>
      }

      <!-- Input / Textarea / Select -->
      @if (type() === 'textarea') {
        <textarea
          [id]="id()"
          [name]="name()"
          [placeholder]="placeholder()"
          [required]="required()"
          [disabled]="disabled()"
          [rows]="rows()"
          [(ngModel)]="value"
          (ngModelChange)="onValueChange($event)"
          [class]="inputClasses()"
        ></textarea>
      } @else if (type() === 'select') {
        <select
          [id]="id()"
          [name]="name()"
          [required]="required()"
          [disabled]="disabled()"
          [(ngModel)]="value"
          (ngModelChange)="onValueChange($event)"
          [class]="inputClasses()"
        >
          @if (placeholder()) {
            <option value="">{{ placeholder() }}</option>
          }
          @for (option of options(); track option.value) {
            <option [value]="option.value">{{ option.label }}</option>
          }
        </select>
      } @else {
        <input
          [type]="type()"
          [id]="id()"
          [name]="name()"
          [placeholder]="placeholder()"
          [required]="required()"
          [disabled]="disabled()"
          [min]="min()"
          [max]="max()"
          [(ngModel)]="value"
          (ngModelChange)="onValueChange($event)"
          [class]="inputClasses()"
        />
      }

      <!-- Helper Text -->
      @if (helperText() && !error()) {
        <p class="mt-1 text-sm text-gray-500">{{ helperText() }}</p>
      }

      <!-- Error Message -->
      @if (error()) {
        <p class="mt-1 text-sm text-red-600 flex items-center gap-1">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          {{ error() }}
        </p>
      }
    </div>
  `
})
export class FormFieldComponent {
    // Inputs
    type = input<FormFieldType>('text');
    label = input<string>('');
    id = input<string>(`field-${Math.random().toString(36).substr(2, 9)}`);
    name = input<string>('');
    placeholder = input<string>('');
    required = input<boolean>(false);
    disabled = input<boolean>(false);
    error = input<string>('');
    helperText = input<string>('');
    modelValue = input<any>('');

    // Number inputs
    min = input<number | undefined>(undefined);
    max = input<number | undefined>(undefined);

    // Textarea
    rows = input<number>(4);

    // Select
    options = input<SelectOption[]>([]);

    // Internal state
    value = signal<any>('');

    inputClasses = computed(() => {
        const baseClasses = 'w-full px-4 py-2.5 border rounded-lg outline-none transition-all';
        const normalClasses = 'border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent';
        const errorClasses = 'border-red-500 focus:ring-2 focus:ring-red-500 focus:border-transparent';
        const disabledClasses = 'bg-gray-100 cursor-not-allowed opacity-60';

        let classes = `${baseClasses} `;

        if (this.disabled()) {
            classes += disabledClasses;
        } else if (this.error()) {
            classes += errorClasses;
        } else {
            classes += normalClasses;
        }

        return classes;
    });

    constructor() {
        // Initialize value from modelValue
        this.value.set(this.modelValue());
    }

    onValueChange(newValue: any): void {
        this.value.set(newValue);
    }

    getValue(): any {
        return this.value();
    }
}
