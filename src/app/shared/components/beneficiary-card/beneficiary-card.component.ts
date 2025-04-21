import { Component, Input, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonicModule,
  AlertController,
  NavController,
  ToastController,
} from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Beneficiary } from 'src/app/core/interfaces/beneficiary.interface';
import { Plan } from 'src/app/core/interfaces/plan.interface';
import { BeneficiaryService } from 'src/app/core/services/beneficiary.service';
import { environment } from 'src/environments/environment';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-beneficiary-card',
  imports: [IonicModule, CommonModule],
  standalone: true,
  templateUrl: './beneficiary-card.component.html',
  styleUrls: ['./beneficiary-card.component.scss'],
  // animations: [
  //   trigger('fadeIn', [
  //     transition(':enter', [
  //       style({ opacity: 0, transform: 'translateY(10px)' }),
  //       animate(
  //         '400ms ease-out',
  //         style({ opacity: 1, transform: 'translateY(0)' })
  //       ),
  //     ]),
  //   ]),
  // ],
})
export class BeneficiaryCardComponent implements OnInit {
  @Input() beneficiaries: Beneficiary[] = [];
  @Input() plan?: Plan;

  public environment = environment.url;
  public maxBeneficiaries: number = 5;
  public screenWidth: number;
  public isLoading: boolean = false;

  constructor(
    private router: Router,
    private alertCtrl: AlertController,
    private beneficiaryService: BeneficiaryService,
    private navCtrl: NavController,
    private toastCtrl: ToastController
  ) {
    this.screenWidth = window.innerWidth;
  }

  ngOnInit() {
    // Inicialización adicional si es necesaria
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.screenWidth = window.innerWidth;
  }

  async goToBeneficiary(beneficiary: Beneficiary) {
    this.isLoading = true;
    try {
      await this.beneficiaryService.setActiveBeneficiary({ ...beneficiary });
      this.navCtrl.navigateForward(['/beneficiary/home']);
    } catch (error) {
      this.showToast('No se pudo acceder al perfil del beneficiario');
    } finally {
      this.isLoading = false;
    }
  }

  get sortedBeneficiaries(): Beneficiary[] {
    return [...this.beneficiaries].sort((a, b) =>
      a.nombre.localeCompare(b.nombre)
    );
  }

  async createBeneficiary() {
    this.router.navigate(['/code/code-lookup']);
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['Entendido'],
    });
    await alert.present();
  }

  async showToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'bottom',
      color: 'medium',
    });
    await toast.present();
  }

  // Método para manejar errores de carga de imagen
  handleImageError(event: any, beneficiary: Beneficiary) {
    event.target.src = '/assets/images/default_user.png';
  }
}
