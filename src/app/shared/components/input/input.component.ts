import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';

interface SelectOption {
  value: string | number;
  label: string;
}

@Component({
  selector: 'app-input',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss']
})
export class InputComponent {
  @Input() label!: string;
  @Input() type: 'text' | 'number' | 'date' | 'select' | 'checkbox' = 'text';
  @Input() placeholder: string = '';
  @Input() control!: FormControl;
  @Input() options: SelectOption[] = []; 
  @Input() showCounter: boolean = false;
  @Input() textColor: string = 'var(--ion-color-light)';
  @Input() borderBottom: string = '1px solid var(--ion-color-light);';
  @Input() inputTextColor: string = 'var(--ion-color-light)';

  get errorMessage(): string {
    if (!this.control || !this.control.errors || !this.control.touched) return '';
    
    if (this.control.hasError('required')) return 'Este campo es obligatorio';
    if (this.control.hasError('minlength')) return `Debe tener al menos ${this.control.errors['minlength'].requiredLength} caracteres`;
    if (this.control.hasError('maxlength')) return `No puede tener más de ${this.control.errors['maxlength'].requiredLength} caracteres`;
    if (this.control.hasError('pattern')) return 'Formato inválido';

    return '';
  }
}
