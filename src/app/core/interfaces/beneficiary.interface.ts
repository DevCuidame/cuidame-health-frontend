// Modelo adaptado según la respuesta real del backend
export interface Beneficiary {
  id: number;
  code: string;            // Código único de paciente
  nombre: string;          
  apellido: string;        
  tipoid: string;          
  numeroid: string;        
  telefono: string;        
  fecha_nacimiento?: string;
  genero: string;          
  ciudad: string;          
  departamento: any;    
  direccion: string;       
  rh: string;              
  eps?: string;            
  prepagada?: string;      
  arl?: string;            
  seguro_funerario?: string;
  a_cargo_id: number;      // ID del cuidador/usuario responsable
  image?: string | null;   // Path de la imagen
  enterprise?: string | null;
  nit?: string | null;     
  city_id?: number | null; // Campo adicional que viene en la respuesta
  created_at: string;      
  updated_at: string;      
  photourl?: string | null;
  imagebs64?: string;      
  health_data: Health_Data;
}

export interface Health_Data {
  vitals: {
    heartRate: VitalSign | null;
    bloodPressure: BloodPressure | null;
    bloodGlucose: VitalSign | null;
    bloodOxygen: VitalSign | null;
    respiratoryRate: VitalSign | null;
  };
  medical_info: {
    allergies: Allergy[];
    diseases: Disease[];
    condition: Condition | null;
    backgrounds: MedicalBackground[];
    familyBackgrounds: FamilyBackground[];
    vaccines: Vaccine[];
  };
}

export interface VitalSign {
  id: number;
  patient_id: number;
  rate: number;
  date: string;
  created_at?: string;
}

export interface BloodPressure {
  id: number;
  patient_id: number;
  systolic: number;
  diastolic: number;
  date: string;
  created_at?: string;
}

// Alergias
export interface Allergy {
  id: number;
  id_paciente: number;    
  tipo_alergia?: string;  
  descripcion?: string;   
  created_at: string;
  updated_at: string;
}

export interface Disease {
  id: number;
  id_paciente: number;    
  enfermedad?: string;  
  created_at: string;
  updated_at: string;
}

// Condición médica
export interface Condition {
  id: number;
  id_paciente: number;
  discapacidad?: string | null;
  embarazada?: string | null;
  cicatrices_descripcion?: string | null;
  tatuajes_descripcion?: string | null;
  created_at: string;
  updated_at: string;
}

// Antecedentes médicos
export interface MedicalBackground {
  id: number;
  id_paciente: number;
  tipo_antecedente?: string;
  descripcion_antecedente?: string;
  fecha_antecedente?: string;  // Viene como string en formato ISO
  created_at: string;
  updated_at: string;
}

// Antecedentes familiares
export interface FamilyBackground {
  id: number;
  id_paciente: number;
  tipo_antecedente?: string;
  parentesco?: string;
  descripcion_antecedente?: string;
  created_at: string;
  updated_at: string;
}

// Vacunas
export interface Vaccine {
  id: number;
  id_paciente: number;
  vacuna?: string;
  created_at: string;
  updated_at: string;
}

// Medicamentos
export interface Medication {
  id: number;
  medicament_name: string;
  date_order: string;  // Formato ISO
  duration?: string;
  dose?: string;
  frequency?: string;
  quantity?: string;
  authorized: boolean;
  mipres: boolean;
  controlled_substances: boolean;
  eps_authorization: boolean;
  pharmacy?: string;
  date_auth?: string;  // Formato ISO
  phone?: string;
  address?: string;
  description?: string;
  delivery_status?: string;
  delivery_date?: string;  // Formato ISO
  comments?: string;
  id_patient: number;
  files?: MedicineFile[];
}

// Archivo de medicamento
export interface MedicineFile {
  id: number;
  name: string;
  path: string;
  category: string;
  id_order: number;
  created_at: string;
  base64?: string;
}