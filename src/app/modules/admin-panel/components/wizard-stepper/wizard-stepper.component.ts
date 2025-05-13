import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-wizard-stepper',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stepper" [class.schedule-assignment-mode]="isScheduleAssignment">
      <div class="steps">
        <!-- En modo de asignación de horario, solo mostramos el título informativo -->
        @if (!isScheduleAssignment) {
          <div class="step" [class.active]="currentStep >= 1">
            <div class="circle" [class.completed]="currentStep > 1"></div>
            <div class="step-name">DATOS</div>
          </div>
          <div class="step" [class.active]="currentStep >= 2">
            <div class="circle" [class.completed]="currentStep > 2"></div>
            <div class="step-name">ESPECIALIDAD</div>
          </div>
          @if (isModifiedFlow) {
            <div class="step" [class.active]="currentStep >= 3">
              <div class="circle" [class.completed]="currentStep > 3"></div>
              <div class="step-name">FECHA Y HORA</div>
            </div>
          } @else {
            <div class="step" [class.active]="currentStep >= 3">
              <div class="circle" [class.completed]="currentStep > 3"></div>
              <div class="step-name">PROFESIONAL</div>
            </div>
            <div class="step" [class.active]="currentStep >= 4">
              <div class="circle" [class.completed]="currentStep > 4"></div>
              <div class="step-name">FECHA Y HORA</div>
            </div>
          }
        } @else {
          <div class="schedule-assignment-title">
            <h2>Asignación de Horario para Cita Pendiente</h2>
            <p>Ingrese los datos del profesional y seleccione fecha y hora para confirmar la cita</p>
          </div>
        }
      </div>
      <div class="step-line" [class.hidden]="isScheduleAssignment"></div>
    </div>
  `,
  styleUrls: ['./wizard-stepper.component.scss']
})
export class WizardStepperComponent {
  @Input() currentStep: number = 1;
  @Input() isScheduleAssignment: boolean = false;
  @Input() isModifiedFlow: boolean = false;
}