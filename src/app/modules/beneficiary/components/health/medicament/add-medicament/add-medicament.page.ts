import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnDestroy, OnInit, Output, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Subscription, finalize } from 'rxjs';
import { MedicineControl } from 'src/app/core/services/medicineControl.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { LoadingService } from 'src/app/core/services/loading.service';
import { BeneficiaryService } from 'src/app/core/services/beneficiary.service';

interface MedicamentFormData {
  // Datos para paso 1: Ordenar
  medicament_name: string;
  date_order: string;
  duration: string;
  dose: string;
  frequency: string;
  quantity: string;
  mipres: boolean;
  controlled_substances: boolean;
  eps_authorization: boolean;
  
  // Datos para paso 2: Autorizar
  authorized: boolean;
  pharmacy: string;
  date_auth: string;
  phone: string;
  address: string;
  description: string;
  
  // Datos para paso 3: Entregar
  delivery_status: string;
  delivery_date: string;
  comments: string;
  
  // Datos de control
  id_patient: string;
}

interface FileData {
  base64: string;
  fileName: string;
  type: string;
  category: string;
}

@Component({
  selector: 'app-add-medicament',
  templateUrl: './add-medicament.page.html',
  styleUrls: ['./add-medicament.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
})
export class AddMedicamentPage implements OnInit, OnDestroy {
  @Output() formSubmitted = new EventEmitter<boolean>();
  
  // Servicios inyectados
  private medicineControl = inject(MedicineControl);
  private toastService = inject(ToastService);
  private loadingService = inject(LoadingService);
  private beneficiaryService = inject(BeneficiaryService);
  private router = inject(Router);
  
  // Estado del componente
  selectedStep = 1;
  isSubmitting = false;
  updateFlag = false;
  medicine_id: number | null = null;
  
  // Estado de la interfaz
  selectedButtonText = 'Medicamento';
  selectedIndicatorBorder = '20px';
  toastMessageVisible = false;
  toastMessage = '';
  toastColor: 'success' | 'danger' | 'warning' | 'primary' = 'primary';
  
  // Gestión de archivos
  fileNames: { [key: string]: string } = {};
  selectedFiles: { [key: string]: FileData } = {};
  
  // Datos del formulario
  formData: MedicamentFormData = this.getInitialFormData();
  
  // Suscripciones
  private subscriptions = new Subscription();
  
  ngOnInit() {
    this.initializeComponent();
  }
  
  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
  
  /**
   * Inicializa el componente cargando los datos necesarios
   */
  private initializeComponent(): void {
    // Obtener el ID del paciente activo
    const activeBeneficiary = this.beneficiaryService.getActiveBeneficiary();
    if (activeBeneficiary && activeBeneficiary.id) {
      this.formData.id_patient = activeBeneficiary.id.toString();
    }
    
    // Verificar si estamos en modo actualización
    // Si se implementa en el futuro, se podría recibir el modo mediante un servicio o como Input
    const urlParams = new URLSearchParams(window.location.search);
    const medicineId = urlParams.get('id');
    if (medicineId) {
      this.updateFlag = true;
      this.medicine_id = Number(medicineId);
      this.loadMedicineData(this.medicine_id);
    }
  }
  
  /**
   * Obtiene los datos iniciales del formulario
   */
  private getInitialFormData(): MedicamentFormData {
    return {
      // Paso 1: Ordenar
      medicament_name: '',
      date_order: this.formatDateForInput(new Date()),
      duration: '',
      dose: '',
      frequency: '',
      quantity: '',
      mipres: false,
      controlled_substances: false,
      eps_authorization: false,
      
      // Paso 2: Autorizar
      authorized: false,
      pharmacy: '',
      date_auth: this.formatDateForInput(new Date()),
      phone: '',
      address: '',
      description: '',
      
      // Paso 3: Entregar
      delivery_status: '',
      delivery_date: '',
      comments: '',
      
      // Control
      id_patient: ''
    };
  }
  
  /**
   * Formatea una fecha para ser utilizada en campos de tipo date
   */
  private formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }
  
  /**
   * Carga los datos de un medicamento existente
   */
  private loadMedicineData(medicineId: number): void {
    this.loadingService.showLoading('Cargando datos del medicamento...');
    
    this.medicineControl.getOrderByPatientId(this.formData.id_patient)
      .pipe(finalize(() => this.loadingService.hideLoading()))
      .subscribe({
        next: (response) => {
          if (response && response.data) {
            const medicines = Array.isArray(response.data) ? response.data : [response.data];
            const medicineData = medicines.find((m: any) => m.id === medicineId);
            
            if (medicineData) {
              // Actualizar el formulario con los datos obtenidos
              this.updateFormWithMedicineData(medicineData);
            } else {
              this.showToast('No se encontró el medicamento solicitado', 'danger');
              this.router.navigate(['/beneficiary/medicines']);
            }
          }
        },
        error: (error) => {
          console.error('Error al cargar los datos del medicamento:', error);
          this.showToast('Error al cargar los datos del medicamento', 'danger');
        }
      });
  }
  
  /**
   * Actualiza el formulario con los datos del medicamento cargado
   */
  private updateFormWithMedicineData(medicineData: any): void {
    this.formData = {
      ...this.formData,
      ...medicineData
    };
    
    this.medicine_id = medicineData.id;
    
    // Procesar archivos si existen
    if (medicineData.files && Array.isArray(medicineData.files)) {
      medicineData.files.forEach((file: any) => {
        if (file.category && file.name) {
          this.fileNames[file.category] = file.name;
        }
      });
    }
  }
  
  /**
   * Cambia entre los tipos medicamento/insumo
   */
  selectButton(buttonType: string): void {
    this.selectedButtonText = buttonType === 'medicament' ? 'Medicamento' : 'Insumo';
    this.selectedIndicatorBorder = '20px';
    
    // Actualiza visualmente el botón seleccionado
    const indicator = document.getElementById('selectedIndicator');
    if (indicator) {
      indicator.style.left = buttonType === 'medicament' ? '0' : '50%';
    }
  }
  
  /**
   * Selecciona un paso específico
   */
  selectStep(step: number): void {
    // Solo permitir navegar a pasos anteriores o al siguiente
    if (step < this.selectedStep || step === this.selectedStep + 1) {
      this.selectedStep = step;
    }
  }
  
  /**
   * Avanza al siguiente paso, verificando la validez del paso actual
   */
  goToNextStep(form: NgForm): void {
    // Validar secciones específicas del formulario según el paso actual
    const isCurrentStepValid = this.validateCurrentStep(form);
    
    if (isCurrentStepValid) {
      this.selectedStep++;
      // Asegurarse de que no exceda el máximo de pasos
      if (this.selectedStep > 3) {
        this.selectedStep = 3;
      }
    } else {
      this.showToast('Por favor, complete todos los campos requeridos', 'warning');
    }
  }
  
  /**
   * Valida si el paso actual del formulario es válido
   */
  private validateCurrentStep(form: NgForm): boolean {
    // Obtener controles del formulario divididos por pasos
    const step1Fields = ['medicament_name', 'date_order', 'duration', 'dose', 'frequency', 'quantity'];
    const step2Fields = this.formData.authorized 
      ? ['description']
      : ['pharmacy', 'date_auth', 'phone', 'address'];
    const step3Fields = ['delivery_status'];
    
    if (this.formData.delivery_status === 'Programado') {
      step3Fields.push('delivery_date');
    }
    
    // Determinar qué campos validar según el paso actual
    let fieldsToValidate: string[] = [];
    
    switch (this.selectedStep) {
      case 1:
        fieldsToValidate = step1Fields;
        break;
      case 2:
        fieldsToValidate = step2Fields;
        break;
      case 3:
        fieldsToValidate = step3Fields;
        break;
    }
    
    // Verificar si todos los campos requeridos están válidos
    return fieldsToValidate.every(fieldName => {
      const control = form.controls[fieldName];
      return control && control.valid;
    });
  }
  
  /**
   * Maneja el cambio de estado de autorización
   */
  isChecked(event: any): void {
    this.formData.authorized = event.detail.checked;
  }
  
  /**
   * Activa el selector de archivos
   */
  triggerFileInput(inputId: string): void {
    const fileInput = document.getElementById(inputId) as HTMLElement;
    if (fileInput) {
      fileInput.click();
    }
  }
  
  /**
   * Procesa la selección de un archivo
   */
  onFileChange(event: any, fileType: string): void {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0] as File;
      
      // Validar tipos de archivo aceptados
      const validTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/heic',
        'image/heif',
      ];
      
      if (!validTypes.includes(file.type)) {
        this.showToast(
          'Por favor, selecciona un archivo válido (PDF, JPEG, PNG, HEIC)',
          'warning'
        );
        return;
      }
      
      // Mostrar nombre acortado del archivo
      this.fileNames[fileType] = this.shortenFileName(file.name);
      
      // Procesar archivo como Base64
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target?.result) {
          const base64String = e.target.result.toString();
          
          this.selectedFiles[fileType] = {
            base64: base64String,
            fileName: file.name,
            type: file.type,
            category: fileType
          };
        }
      };
      
      reader.readAsDataURL(file);
    }
  }
  
  /**
   * Acorta nombres de archivo largos
   */
  shortenFileName(fileName: string, maxLength: number = 20): string {
    if (fileName.length <= maxLength) {
      return fileName;
    }
    
    const extIndex = fileName.lastIndexOf('.');
    const namePart = fileName.substring(0, extIndex);
    const extPart = fileName.substring(extIndex);
    
    return `${namePart.substring(0, maxLength - extPart.length - 3)}...${extPart}`;
  }
  
  /**
   * Limpia los mensajes de toast
   */
  clearErrorMessage(): void {
    this.toastMessageVisible = false;
  }
  
  /**
   * Muestra un mensaje toast
   */
  private showToast(message: string, color: 'success' | 'danger' | 'warning' | 'primary' = 'primary'): void {
    this.toastMessage = message;
    this.toastColor = color;
    this.toastMessageVisible = true;
    
    // Auto-ocultar después de 3 segundos
    setTimeout(() => {
      this.toastMessageVisible = false;
    }, 3000);
  }
  
  /**
   * Envía el formulario
   */
  submitForm(form: NgForm): void {
    if (form.invalid) {
      this.showToast('Por favor, complete todos los campos requeridos', 'warning');
      return;
    }
    
    // Prevenir múltiples envíos
    if (this.isSubmitting) {
      return;
    }
    
    this.isSubmitting = true;
    this.loadingService.showLoading(this.updateFlag ? 'Actualizando medicamento...' : 'Guardando medicamento...');
    
    // Preparar payload del formulario
    const payload = { ...this.formData };
    
    // Determinar si es actualización o creación
    const request$ = this.updateFlag && this.medicine_id
      ? this.medicineControl.updateOrder(this.medicine_id.toString(), payload)
      : this.medicineControl.createOrder(payload);
    
    request$.pipe(
      finalize(() => {
        this.isSubmitting = false;
        this.loadingService.hideLoading();
      })
    ).subscribe({
      next: (response) => {
        // Mostrar mensaje de éxito
        this.showToast(
          this.updateFlag ? 'Medicamento actualizado exitosamente' : 'Medicamento guardado exitosamente',
          'success'
        );
        
        // Si es creación, subir archivos asociados
        if (!this.updateFlag && response && response.data && response.data.orderId) {
          const orderId = response.data.orderId.id;
          this.uploadImages(orderId);
        }
        
        // Emitir evento de formulario enviado
        this.formSubmitted.emit(true);
        
        // Opcional: navegar de vuelta al listado o a otra vista
        setTimeout(() => {
          this.router.navigate(['/beneficiary/medicines']);
        }, 1500);
      },
      error: (error) => {
        console.error('Error al procesar el medicamento:', error);
        this.showToast(
          `Error al ${this.updateFlag ? 'actualizar' : 'guardar'} el medicamento. Intente de nuevo.`,
          'danger'
        );
        this.formSubmitted.emit(false);
      }
    });
  }
  
  /**
   * Sube las imágenes asociadas al medicamento
   */
  private uploadImages(id: number): void {
    // Si no hay archivos seleccionados, salir
    if (Object.keys(this.selectedFiles).length === 0) {
      return;
    }
    
    // Construir objeto de imágenes para el payload
    const imagesPayload = Object.keys(this.selectedFiles).reduce((acc, key) => {
      const file = this.selectedFiles[key];
      acc[key] = {
        fileName: file.fileName,
        type: file.type,
        category: file.category,
        base64: file.base64,
      };
      return acc;
    }, {} as Record<string, any>);
    
    // Preparar payload completo
    const payload = {
      id_order: id,
      images: imagesPayload,
    };
    
    // Enviar al backend
    this.medicineControl.uploadImages(payload).subscribe({
      next: () => {
        this.showToast('Imágenes subidas exitosamente', 'success');
      },
      error: (error) => {
        console.error('Error al subir imágenes:', error);
        this.showToast('Error al subir las imágenes, pero el medicamento fue guardado', 'warning');
      }
    });
  }
}