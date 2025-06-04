// Interfaz para el registro del usuario
export interface RegisterData {
  name: string;
  lastname: string;        // Antes last_name
  typeID: string;          // Antes typeid
  numberID: string;        // Antes numberid
  phone: string;
  email: string;
  password: string;
  city_id: number;         // ID de la ciudad (numérico)
  address: string;
  pubName?: string;        // Antes public_name
  imageBs64?: string;      // Antes base_64
}

// Interfaz para el usuario autenticado
export interface User {
  id: number;
  code?: string;           // Código único de usuario
  hashcode?: string;       // Hash code (para recuperación de contraseña)
  name: string;
  lastname: string;        // Antes last_name
  typeperson?: string;     // Tipo de persona
  typeid: string;          // Antes typeid
  numberid?: string;       // Antes numberid
  address?: string;
  city_id?: number;        // ID de la ciudad (numérico)
  department?: number;        
  phone: string;
  gender?: string;
  birth_date?: Date;
  email: string;
  parentesco?: string;     // Relación de parentesco
  notificationid?: string; // ID para notificaciones
  verificado: boolean;     // Estado de verificación
  created_at: Date;
  updated_at: Date;
  pubname?: string;        // Nombre público
  privname?: string;       // Nombre privado
  imagebs64?: string;      // Imagen en base64
  path?: string;           // Ruta de la imagen
  roles?: string[];        // Roles asignados
  isAgent?: boolean;       // Indica si el usuario es un agente
  isAdmin?: boolean;       // Indica si el usuario es un administrador
}
