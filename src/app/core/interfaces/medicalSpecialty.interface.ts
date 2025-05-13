export interface MedicalSpecialty {
    id: number;
    name: string;
    description: string;
    public_name: string | null;
    private_name: string | null;
    image_path: string;
  }
  
  export interface MedicalSpecialtyResponse {
    message: string;
    data: MedicalSpecialty[];
    statusCode: number;
  }
  