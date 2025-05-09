import { Professional } from "./professional.interface";

export interface AppointmentType {
    id: number;
    name: string;
    description: string;
    default_duration: number;
    color_code: string;
  }
  
  export interface Appointment {
    id: number;
    patient_id: number;
    professional_id: number;
    appointment_type_id: number;
    start_time: string;
    end_time: string;
    status: string;
    notes: string;
    cancellation_reason?: string;
    professional: Professional;
    appointmentType: AppointmentType;
  }
  