import { Injectable, signal, computed } from '@angular/core';
import { Appointment, Specialty } from 'src/app/core/interfaces/appointment.interface';
import { MedicalSpecialty } from 'src/app/core/interfaces/medicalSpecialty.interface';
import { BeneficiaryImage, Image, UserImage } from 'src/app/core/interfaces/user.interface';
import { Beneficiary } from '../../interfaces/beneficiary.interface';

@Injectable({
  providedIn: 'root'
})
export class AppointmentStateService {
  // Estado del wizard
  public currentStep = signal<number>(1);
  public searchTerm = signal<string>('');
  
  // Selección de especialidad
  public selectedSpecialtyIndex = signal<number | null>(null);
  public selectedSpecialtyId = signal<number | null>(null);
  
  // Selección de horario
  public selectedDayIndex = signal<number>(-1);
  public selectedHour = signal<string>('');
  public selectedProfessionalAvailability = signal<
    { day: string; date: string; hours: string[] }[]
  >([]);
  public manualDate = signal<string>('');
  
  // Datos del paciente
  public beneficiaryId = signal<string>('');
  public userId = signal<number>(0);
  
  // Estado de búsqueda
  public searchState = signal<{
    loading: boolean;
    notFound: boolean;
    success: boolean;
    error: boolean;
  }>({
    loading: false,
    notFound: false,
    success: false,
    error: false
  });
  
  // Datos completos de la cita
  public appointment = signal<Appointment>({
    id: 0,
    appointment_type_id: 0,
    patient: {} as Beneficiary,
    specialty_id: 0,
    patient_id: 0,
    location: '',
    modified_by_id: 0,
    recurring_appointment_id: 0,
    updated_at: '',
    specialty: {} as MedicalSpecialty,
    cancellation_reason: '',
    reminder_sent: false,
    start_time: '',
    end_time: '',
    status: '',
    notes: '',
    created_at: '',
    professional: {} as any,
  });
  
  // Estado del formulario
  public isSubmitting = signal<boolean>(false);
  public success = signal<boolean>(false);
  
  constructor() {
    this.loadStoredAppointment();
  }
  
  // Métodos para manejar el estado
  
  public nextStep(): void {
    // En el nuevo flujo, solo tenemos 3 pasos
    if (this.currentStep() < 3) {
      this.currentStep.update(step => step + 1);
    }
  }
  
  public prevStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update(step => step - 1);
    }
  }
  
  public updateSearchTerm(term: string): void {
    this.searchTerm.set(term);
  }
  
  public selectSpecialty(index: number, specialtyId: number): void {
    this.selectedSpecialtyIndex.set(index);
    this.selectedSpecialtyId.set(specialtyId);
  }
  
  public selectDay(index: number): void {
    this.selectedDayIndex.set(index);
    this.selectedHour.set('');
  }
  
  public selectHour(hour: string): void {
    this.selectedHour.set(hour);
  }
  
  public setAvailability(availability: { day: string; date: string; hours: string[] }[]): void {
    this.selectedProfessionalAvailability.set(availability);
  }
  
  public toggleSelectionType(selected: 'firstTime' | 'control'): void {
    if (selected === 'firstTime') {
      this.appointment.update(app => ({
        ...app,
        first_time: true,
        control: false
      }));
    } else {
      this.appointment.update(app => ({
        ...app,
        control: true,
        first_time: false
      }));
    }
  }
  
  public updateUserData(userData: any, isForBeneficiary: boolean = false): void {
    this.appointment.update(app => ({
      ...app,
      userData: userData,
      is_for_beneficiary: isForBeneficiary
    }));
    
    if (isForBeneficiary) {
      this.beneficiaryId.set(userData.id?.toString() || '');
      this.userId.set(userData.user_id?.toString() || '');
    } else {
      this.beneficiaryId.set('');
      this.userId.set(userData.id?.toString() || '');
    }
  }
  
  public updateAppointmentForStep(): void {
    const currentStep = this.currentStep();
    const currentAppointment = { ...this.appointment() };
    
    if (currentStep === 2) {
      // Update specialty data
      const specialtyId = this.selectedSpecialtyId();
      if (specialtyId !== null) {
        currentAppointment.specialty_id = specialtyId;
      }
    }
    
    if (currentStep === 3) {
      // Si se seleccionó fecha y hora, actualizamos el estado a PENDING, si no a TO_BE_CONFIRMED
      if (currentAppointment.start_time) {
        currentAppointment.status = 'PENDING';
      } else {
        currentAppointment.status = 'TO_BE_CONFIRMED';
      }
    }
    
    this.appointment.set(currentAppointment);
    this.saveAppointmentToStorage();
  }
  
  public setSubmitting(isSubmitting: boolean): void {
    this.isSubmitting.set(isSubmitting);
  }
  
  public setSuccess(success: boolean): void {
    this.success.set(success);
  }
  
  public resetState(): void {
    this.currentStep.set(1);
    this.searchTerm.set('');
    this.selectedSpecialtyIndex.set(null);
    this.selectedSpecialtyId.set(null);
    this.selectedDayIndex.set(-1);
    this.selectedHour.set('');
    this.selectedProfessionalAvailability.set([]);
    this.beneficiaryId.set('');
    this.userId.set(0);
    this.isSubmitting.set(false);
    this.success.set(false);
    this.appointment.set({
      id: 0,
      patient: {} as Beneficiary,
      professional: {} as any,
      professional_id: 0,
      patient_id: 0,
      appointment_type_id: 0,
      cancellation_reason: '',
      reminder_sent: false,
      start_time: '',
      end_time: '',
      status: 'PENDING',
      notes: '',
      specialty_id: 0,
      location: '',
      modified_by_id: 0,
      recurring_appointment_id: 0,
      updated_at: '',
      specialty: {} as MedicalSpecialty,
      created_at: '',
    });
    
    localStorage.removeItem('selectedAppointment');
  }
  
  private loadStoredAppointment(): void {
    const storedData = localStorage.getItem('selectedAppointment');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        this.appointment.set(parsedData);
      } catch (e) {
        console.error('Error parsing stored appointment data', e);
      }
    }
  }
  
  private saveAppointmentToStorage(): void {
    localStorage.setItem('selectedAppointment', JSON.stringify(this.appointment()));
  }
  
  // Métodos para validación
  
  public isStepValid(step: number): boolean {
    switch (step) {
      case 1:
        return this.isPatientDataValid();
      case 2:
        return this.isSpecialtySelectionValid();
      case 3:
        return this.isScheduleAndDoctorValid();
      default:
        return false;
    }
  }
  
  private isPatientDataValid(): boolean {
    const patient = this.appointment().patient;
    const appointmentTypeId = this.appointment().appointment_type_id;
    
    return !!(
      patient &&
      patient.tipoid &&
      patient.numeroid &&
      patient.numeroid.length >= 5 &&
      patient.nombre &&
      patient.apellido &&
      patient.telefono &&
      appointmentTypeId && 
      appointmentTypeId > 0
    );
  }
  
  private isSpecialtySelectionValid(): boolean {
    return this.selectedSpecialtyId() !== null;
  }
  
  private isScheduleAndDoctorValid(): boolean {
    // Verificamos si hay información básica del profesional
    const professionalData = this.appointment().professional! || {};
    const hasProfessionalInfo = 
      professionalData.user &&
      (professionalData.user.first_name || professionalData.user.last_name);
    
    // En el nuevo flujo, siempre permitimos avanzar en este paso
    // La información del doctor es opcional, pero si se proporciona,
    // podemos validar que al menos tenga un nombre
    if (hasProfessionalInfo) {
      return true;
    }
    
    // Si no se ha proporcionado información del doctor,
    // es válido continuar sin ella (cita pendiente por confirmar)
    return true;
  }
  
  // Método especial para validar antes de enviar la cita
  public validateBeforeSubmit(): boolean {
    // Verificamos si todos los pasos son válidos
    const patientDataValid = this.isPatientDataValid();
    const specialtyValid = this.isSpecialtySelectionValid();
    
    // En este caso podemos ser más estrictos con la información del doctor
    const appointment = this.appointment();
    const professionalData = appointment.professional!;
    
    const hasDoctorName = !!(
      professionalData.user && 
      (professionalData.user.first_name || professionalData.user.last_name)
    );
    
    const hasAppointmentSchedule = !!(appointment.start_time && appointment.start_time);
    
    // Si tiene fecha y hora asignadas, debe tener al menos el nombre del doctor
    if (hasAppointmentSchedule && !hasDoctorName) {
      return false;
    }
    
    return patientDataValid && specialtyValid;
  }
}