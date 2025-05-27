import { Beneficiary } from './beneficiary.interface';
import { MedicalSpecialty } from './medicalSpecialty.interface';
import { Professional } from './professional.interface';

export interface AppointmentType {
  id: number;
  name: string;
  description: string;
  default_duration: number;
  color_code: string;
}

// Interface principal actualizada según tu backend
export interface Appointment {
  id: number;
  patient_id: number;
  professional_id?: number | null;
  appointment_type_id: number | null;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
  cancellation_reason: string | null;
  reminder_sent: boolean;
  specialty_id: number;
  location: any | null;
  modified_by_id: number | null;
  recurring_appointment_id: number | null;
  created_at: string;
  updated_at: string;
  
  // Relaciones
  specialty: MedicalSpecialty;
  patient: Beneficiary;
  professional: Professional | null;
  appointmentType?: AppointmentType | null;
}
export interface appointmentCounts {
  EXPIRED: number;
  PENDING: number;
  CONFIRMED: number;
  COMPLETED: number;
  CANCELLED: number;
  RESCHEDULED: number;
}

export interface AppointmentResponse {
  message: string;
  success: boolean;
  data: Appointment;
  statusCode: number;
}

export enum AppointmentStatus {
  REQUESTED = 'REQUESTED', // Solicitud inicial
  CONFIRMED = 'CONFIRMED', // Confirmada por profesional
  REJECTED = 'REJECTED', // Rechazada por profesional
  CANCELED = 'CANCELED', // Cancelada por paciente
  COMPLETED = 'COMPLETED', // Cita completada
  RESCHEDULED = 'RESCHEDULED', // Reprogramada
}

export interface AppointmentRequest {
  patient_id: number | string;
  professional_id: number | string;
  date: string;
  time: string;
  type: AppointmentType;
  notes?: string;
  reason?: string;
  is_virtual: boolean;
}

export interface Specialty {
  id: number;
  name: string;
  icon?: string;
  description?: string;
}

export interface AvailableDay {
  date: string;
  has_slots: boolean;
}

export interface TimeSlot {
  time: string; // Formato "HH:MM"
  available: boolean; // Si está disponible
}

export interface ProfessionalSchedule {
  id: number;
  professional_id: number;
  day_of_week: number; // 0-6 (domingo a sábado)
  start_time: string; // Formato "HH:MM"
  end_time: string; // Formato "HH:MM"
  interval_minutes: number; // Intervalo entre citas en minutos
  is_active: boolean;
}

export interface TimeBlock {
  id: number;
  professional_id: number;
  start_date: string; // Fecha de inicio del bloqueo
  end_date: string; // Fecha de fin del bloqueo
  reason?: string; // Razón del bloqueo (opcional)
}

export interface AppointmentStats {
  total: number;
  confirmed: number;
  requested: number;
  completed: number;
  canceled: number;
  by_day?: { [key: string]: number }; // Estadísticas por día
  // by_type?: { [key in AppointmentType]?: number };  // Estadísticas por tipo
}

export interface QuestionnaireQuestion {
  id: number;
  text: string;
  type: 'text' | 'choice' | 'boolean';
  options?: string[];
  required: boolean;
}

export interface Questionnaire {
  id: number;
  title: string;
  description?: string;
  questions: QuestionnaireQuestion[];
}

export interface QuestionnaireResponse {
  id: number;
  appointment_id: number;
  question_id: number;
  answer: string;
  created_at: string;
}

// Interfaces para WebSocket
export interface AppointmentWebSocketEvent {
  type: 'appointmentsList' | 'newAppointment' | 'appointmentUpdated' | 'appointmentDeleted';
  appointments?: Appointment[];
  appointment?: Appointment;
  appointmentId?: number;
  timestamp?: Date;
}

export interface AppointmentFilter {
  status?: AppointmentStatus[];
  dateFrom?: string;
  dateTo?: string;
  professionalId?: number;
  patientId?: number;
}

export interface AppointmentStats {
  total: number;
  byStatus: appointmentCounts;
  todayCount: number;
  weekCount: number;
  monthCount: number;
}

// Para operaciones CRUD
export interface CreateAppointmentRequest {
  patient_id: number;
  professional_id?: number;
  appointment_type_id: number;
  start_time?: string;
  end_time?: string;
  appointment_date?: string;
  notes?: string;
  is_for_beneficiary?: boolean;
}

export interface UpdateAppointmentRequest {
  professional_id?: number;
  start_time?: string;
  end_time?: string;
  appointment_date?: string;
  status?: AppointmentStatus;
  notes?: string;
}

// Para respuestas de la API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}