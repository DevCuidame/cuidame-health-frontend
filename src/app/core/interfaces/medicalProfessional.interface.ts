import { User } from "./auth.interface";
import { Location } from "./city.interface";

export interface MedicalProfessional {
    id: number;
    user_id: number;
    nationality: string;
    profession: string;
    medical_registration: string;
    professional_card_number: string;
    university: string;
    graduation_year: number;
    additional_certifications: string;
    years_experience: number;
    consultation_address: string;
    institution_name: string;
    attention_township_id: string;
    consultation_schedule: string;
    consultation_modes: string;
    weekly_availability: string;
    created_at: string;
    image: ProfessionalImage;
    user: User;
    specialty_name: string;
    availability: Availability; 
    scheduleInfo: ScheduleInfo;
    location?: Location;
}

export interface ScheduleInfo {
    type: 'UNAVAILABLE' | 'ONLINE' | 'MANUAL';
    description: string;
    isBooking: boolean;
}

export interface ProfessionalImage {
    id: number;
    professional_id: number;
    public_name: string;
    private_name: string;
    profile_path: string;
    header_path: string;
    uploaded_at: string;
}

export interface Availability {
    Lunes?: DailyAvailability;
    Martes?: DailyAvailability;
    Miércoles?: DailyAvailability;
    Jueves?: DailyAvailability;
    Viernes?: DailyAvailability;
    Sábado?: DailyAvailability;
    Domingo?: DailyAvailability;
}

export interface DailyAvailability {
    start: string; 
    end: string;   
    date: string;
    formatted_date: string;
}

export interface MedicalProfessionalResponse {
    message: string;
    data: MedicalProfessional[];
    statusCode: number;
}
