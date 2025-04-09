import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Subscription, timer } from 'rxjs';
import { MedicineControl } from 'src/app/core/services/medicineControl.service';
import { ToastService } from 'src/app/core/services/toast.service';

@Component({
  selector: 'app-add-medicament',
  templateUrl: './add-medicament.page.html',
  imports: [CommonModule, IonicModule, FormsModule] ,
  styleUrls: ['./add-medicament.page.scss'],
})
export class AddMedicamentPage implements OnInit {
  @Output() formSubmitted = new EventEmitter<boolean>();
  selectedStep: number | null = 1;
  isDataLoaded: boolean = false;
  updateFlag: boolean = false;
  authorized: boolean = false;
  public selectedButtonText: string = 'Medicamento';
  public showCards: boolean = true;
  public toastMessageVisible: boolean = false;

  private subscriptions: Subscription = new Subscription();

  public selectedIndicatorBorder: string = '20px';
  private idPatient: string = ''; // Se inicializará en ngOnInit()

  // File handling properties
  public fileNames: { [key: string]: string } = {};
  public selectedFiles: {
    [key: string]: {
      base64: string;
      fileName: string;
      type: string;
      category: string;
    };
  } = {};

  medicine_id: any = null;

  public formData: { [key: string]: any } = {};

  constructor(
    private medicineControl: MedicineControl,
    public toastr: ToastService,
    private router: Router,
  ) {}

  async ngOnInit() {
    // Inicializar idPatient a partir de DataService
    // this.idPatient = this.storageService.getPatientId();

    // Inicializar formData después de obtener idPatient
    this.formData = {
      //order - ordenar
      medicament_name: '', // Nombre del Medicamento
      date_order: '', // Fecha de la Orden
      duration: '', // Duración
      dose: '', // Dosis
      frequency: '', // Frecuencia
      quantity: '', // Cantidad
      authorized: false, // No autorizado
      mipres: false, // Checkbox Mipres
      controlled_substances: false, // Checkbox Estupefacientes
      eps_authorization: false, // Checkbox Autorización EPS
      //authorize - autorizar
      pharmacy: '',
      date_auth: '',
      phone: '',
      address: '',
      description: '',
      //deliver - entregar
      delivery_status: '',
      delivery_date: '',
      comments: '',
      id_patient: this.idPatient,
    };

    // this.subscriptions.add(
    //   this.dataService.updateMedicament$.subscribe((flag) => {
    //     this.updateFlag = flag;
    //     if (this.updateFlag) {
    //       this.subscriptions.add(
    //         this.dataService.medicament$.subscribe((receivedData) => {
    //           console.log(
    //             '🚀 ~ AddMedicamentPage ~ this.dataService.medicament$.subscribe ~ receivedData:',
    //             receivedData
    //           );
    //           // Actualiza formData con los datos recibidos
    //           this.formData = { ...this.formData, ...receivedData };
    //           this.medicine_id = receivedData.id;
    //           console.log("🚀 ~ AddMedicamentPage ~ this.dataService.medicament$.subscribe ~ medicine_id:", this.medicine_id)

    //           // Procesa las imágenes y actualiza fileNames
    //           if (receivedData.images && Array.isArray(receivedData.images)) {
    //             receivedData.images.forEach((image: any) => {
    //               if (image.category && image.name) {
    //                 this.fileNames[image.category] = image.name;
    //               }
    //             });
    //           }
    //         })
    //       );
    //     }
    //   })
    // );
  }

  isChecked(event: any) {
    // this.formData.authorized = event.detail.checked;
  }

  selectStep(step: number) {
    this.selectedStep = step;
  }

  goToNextStep(): void {
    // this.selectedStep++;
  }

  selectButton(buttonType: string) {
    const personasButton = document.getElementById('personasButton');
    const petsButton = document.getElementById('petsButton');
    const selectedIndicator = document.getElementById('selectedIndicator');

    if (buttonType === 'medicament') {
      this.showCards = true;
      if (selectedIndicator) {
        selectedIndicator.style.left = '0';
        selectedIndicator.textContent = 'Medicamento';
      }
      if (personasButton) {
        personasButton.classList.add('on');
        petsButton?.classList.remove('on');
      }
      this.selectedButtonText = 'Medicamento';
      this.selectedIndicatorBorder = '20px';
    } else if (buttonType === 'inputs') {
      this.showCards = false;
      if (selectedIndicator) {
        selectedIndicator.style.left = '50%';
        selectedIndicator.textContent = 'Insumo';
      }
      if (petsButton) {
        petsButton.classList.add('on');
        personasButton?.classList.remove('on');
      }
      this.selectedButtonText = 'Insumo';
      this.selectedIndicatorBorder = '20px';
    }
  }

  triggerFileInput(inputId: string): void {
    const fileInput = document.getElementById(inputId) as HTMLElement;
    fileInput.click();
  }
  clearErrorMessage() {
    this.toastMessageVisible = false;
  }

  // Handles file input changes
  onFileChange(event: any, fileType: string): void {
    if (event.target.files && event.target.files[0]) {
      const file = <File>event.target.files[0];

      const validTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/heic',
        'image/heif',
      ];
      if (!validTypes.includes(file.type)) {
        // showMessage(
        //   'info',
        //   'Por favor, selecciona un archivo válido (PDF, JPEG, PNG, HEIC).',
        //   'Información',
        //   this.toastr
        // );
        this.toastMessageVisible = true;

        timer(3000).subscribe(() => {
          this.clearErrorMessage();
        });

        return;
      }

      const reader = new FileReader();

      // Acorta el nombre del archivo para mostrarlo
      this.fileNames[fileType] = this.shortenFileName(file.name);

      reader.onload = (e: any) => {
        const mimeHeader = `data:${file.type};base64,`;
        const base64Data = e.target.result.split(',')[1];

        this.selectedFiles[fileType] = {
          base64: mimeHeader + base64Data, // Codificación Base64
          fileName: file.name,
          type: file.type,
          category: fileType,
        };
      };
      reader.readAsDataURL(file);
    }
  }

  // Shortens long file names
  shortenFileName(fileName: string, maxLength: number = 20): string {
    if (fileName.length <= maxLength) {
      return fileName;
    }
    const extIndex = fileName.lastIndexOf('.');
    const namePart = fileName.substring(0, extIndex);
    const extPart = fileName.substring(extIndex);

    return (
      namePart.substring(0, maxLength - extPart.length - 3) + '...' + extPart
    );
  }

  submitForm(form: NgForm): void {
    if (form.valid) {
      const payload = {
        ...this.formData, // Datos del formulario
      };


      if (this.updateFlag) {
        // Lógica para actualizar una orden
        this.medicineControl.updateOrder(this.medicine_id, payload).subscribe(
          (response) => {
            // showMessage(
            //   'success',
            //   'Orden Actualizada Exitosamente',
            //   'Completado',
            //   this.toastr
            // );
            this.toastMessageVisible = true;

            timer(3000).subscribe(() => {
              this.clearErrorMessage();
            });

            this.formSubmitted.emit(true);
          },
          (error) => {
            this.formSubmitted.emit(false);
            console.error('Error al actualizar la orden:', error);
            // showMessage(
            //   'error',
            //   'Error al actualizar la orden. Intenta más tarde.',
            //   'Error',
            //   this.toastr
            // );
            this.toastMessageVisible = true;

            timer(3000).subscribe(() => {
              this.clearErrorMessage();
            });
          }
        );
      } else {
        // Lógica para crear una orden
        this.medicineControl.createOrder(payload).subscribe(
          (response) => {
            // showMessage(
            //   'success',
            //   'Orden Creada Exitosamente',
            //   'Completado',
            //   this.toastr
            // );
            this.toastMessageVisible = true;

            timer(3000).subscribe(() => {
              this.clearErrorMessage();
            });

            // Una vez creada la orden, subimos las imágenes
            const idOrder = response.data.orderId.id;

            this.uploadImages(idOrder);

            this.formSubmitted.emit(true);
          },
          (error) => {
            this.formSubmitted.emit(false);
            console.error('Error al crear la orden:', error);
            // showMessage(
            //   'error',
            //   'Error al crear la orden. Intenta más tarde.',
            //   'Error',
            //   this.toastr
            // );
            this.toastMessageVisible = true;

            timer(3000).subscribe(() => {
              this.clearErrorMessage();
            });
          }
        );
      }
    } else {
      // showMessage('error', 'Formulario inválido', 'Error', this.toastr);
      this.toastMessageVisible = true;

      timer(3000).subscribe(() => {
        this.clearErrorMessage();
      });
    }
  }

  uploadImages(id: number): void {
    // Construir un objeto con las imágenes seleccionadas
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
  
    // Agregar el id de la orden al payload
    const payload = {
      id_order: id,
      images: imagesPayload,
    };
  
    // Enviar el payload al backend
    this.medicineControl.uploadImages(payload).subscribe(
      (response) => {
        // showMessage('success', 'Imágenes subidas exitosamente', 'Completado', this.toastr);
        this.toastMessageVisible = true;
  
        timer(3000).subscribe(() => {
          this.clearErrorMessage();
        });
      },
      (error) => {
        // showMessage('error', 'Error al subir las imágenes', 'Error', this.toastr);
        this.toastMessageVisible = true;
  
        timer(3000).subscribe(() => {
          this.clearErrorMessage();
        });
      }
    );
  }
  
}
