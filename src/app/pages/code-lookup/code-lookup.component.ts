import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  ToastController,
  LoadingController,
  AlertController,
  IonicModule,
} from '@ionic/angular';
import { environment } from 'src/environments/environment';
import { CommonModule } from '@angular/common';
import { CodeService } from 'src/app/core/services/code.service';
import { Router } from '@angular/router';
import { CustomButtonComponent } from 'src/app/shared/components/custom-button/custom-button.component';

@Component({
  selector: 'app-code-lookup',
  imports: [CommonModule, IonicModule, ReactiveFormsModule, CustomButtonComponent],
  templateUrl: './code-lookup.component.html',
  styleUrls: ['./code-lookup.component.scss'],
})
export class CodeLookupComponent implements OnInit {
  public buttonInsurance: string = 'assets/background/button_primary_bg.png';
  public buttonFree: string = 'assets/background/button_secondary_bg.png';
  
  // Form group for insurance code verification
  public codeForm: FormGroup;

  // Available insurance agreements
  agreements: any[] = [];

  // UI state
  showPersonaOptions: boolean = false;

  // API URL
  private apiUrl = environment.url;

  constructor(
    private fb: FormBuilder,
    private codeService: CodeService,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private router: Router
  ) {
    // Initialize the form group with validators
    this.codeForm = this.fb.group({
      agreement: ['', Validators.required],
      code: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.getAgreements();
  }

  /**
   * Toggle persona options panel
   */
  togglePersonaOptions() {
    this.showPersonaOptions = !this.showPersonaOptions;
  }

  /**
   * Redirect to insurance purchase page via WhatsApp
   */
  buyInsurance = async () => {
    try {
      const whatsappUrl =
        'whatsapp://send?phone=573007306645&text=Hola, quiero comprar un seguro para mi familiar.';
      window.location.href = whatsappUrl;

      setTimeout(() => {
        window.open(
          'https://web.whatsapp.com/send?phone=573007306645&text=Hola, quiero comprar un seguro para mi familiar.',
          '_blank'
        );
      }, 500);
    } catch (error) {
    } 
  };

  /**
   * Fetch available insurance agreements
   */
  getAgreements() {
    this.codeService.getAgreements().subscribe(
      (data: any) => {
        console.log("🚀 ~ CodeLookupComponent ~ getAgreements ~ data:", data)
        this.agreements = data.data;
      },
      (error) => {
        console.error('Error al obtener los acuerdos:', error);
        this.presentToast(
          'No se pudieron cargar los convenios, por favor intenta más tarde'
        );
      }
    );
  }

  /**
   * Verify insurance code and agreement
   */
  async verifyInsurance() {
    if (!this.codeForm.valid) {
      this.presentToast('Por favor, completa todos los campos requeridos');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Verificando...',
    });
    await loading.present();

    this.codeService.verifyInsuranceCode(this.codeForm.value).subscribe(
      async (response: any) => {
        await loading.dismiss();

        if (response.success) {
          // Navigate to form
          this.router.navigate(['/beneficiary/add'], {
            queryParams: { new: true },
          });
          this.presentToast('Código verificado correctamente');
        } else {
          this.presentToast(response.message || 'Código de seguro inválido');
        }
      },
      async (error) => {
        await loading.dismiss();
        console.error('Error al verificar código:', error);
        this.presentToast('No logramos verficar tu código.');
      }
    );
  }

  /**
   * Continue without insurance
   */
  continueWithoutInsurance() {
    this.router.navigate(['/beneficiary/add'], { queryParams: { new: true } });
  }

  /**
   * Present toast message
   */
  async presentToast(message: string) {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 3000,
      position: 'top',
      color: 'primary',
    });
    toast.present();
  }
}