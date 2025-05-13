import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, OnInit } from '@angular/core';
import {
  AlertController,
  IonicModule,
  LoadingController,
  NavController,
} from '@ionic/angular';
import { ScheduleInfo } from 'src/app/core/interfaces/medicalProfessional.interface';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-health-professional-card',
  imports: [CommonModule, IonicModule],
  templateUrl: './health-professional-card.component.html',
  styleUrls: ['./health-professional-card.component.scss'],
})
export class HealthProfessionalCardComponent {
  @Input() first_name: string = '';
  @Input() last_name: string = '';
  @Input() specialty_name: string = '';
  @Input() profileImage: string = 'assets/images/test_doctor.svg';
  @Input() buttonVisible: boolean = true;
  @Input() agendaColor: string = 'var(--ion-color-primary)';
  @Input() professionalId!: number;
  @Input() lowResProfileImage: string = '';
  @Input() scheduleInfo: ScheduleInfo = {
    type: 'UNAVAILABLE',
    description: '',
    isBooking: false,
  };
  @Input() availability: boolean = false;
  @Input() gender: string = '';

  public api = environment.url;

  constructor(
    private alertCtrl: AlertController,
    private navCtrl: NavController,
    private loadingCtrl: LoadingController,
    private el: ElementRef 
  ) {}

  ngAfterViewInit() {
    const highResImg = this.el.nativeElement.querySelector('.high-res');
    if (highResImg) {
      highResImg.onload = () => {
        highResImg.classList.add('loaded');
      };
    }
  }

  async onSolicitarCita() {
    const alert = await this.alertCtrl.create({
      header: 'Solicitar cita',
      message: 'Selecciona el método de contacto que prefieras',
      cssClass: 'two-button-alert',
      buttons: [
        {
          text: 'Whatsapp',
          cssClass: 'whatsapp-button',
          handler: () => {
            this.openWhatsapp();
          },
        },
        {
          text: 'Chat',
          cssClass: 'chat-button',
          handler: () => {
            this.navCtrl.navigateForward(['/home/chat'], {
              queryParams: { professionalId: this.professionalId },
            });
          },
        },
      ],
    });
    await alert.present();
  }

  openWhatsapp = async () => {
    const loading = await this.showLoading();
    try {
      const whatsappUrl =
        'whatsapp://send?phone=573043520351&text=Hola, quiero agendar una cita con el doctor';
      window.location.href = whatsappUrl;

      setTimeout(() => {
        window.open(
          'https://web.whatsapp.com/send?phone=573043520351&text=Hola, quiero agendar una cita con el doctor',
          '_blank'
        );
      }, 500);
    } catch (error) {
      console.error('Error al abrir WhatsApp:', error);
    } finally {
      if (loading) {
        loading.dismiss();
      }
    }
  };

  async showLoading() {
    const loading = await this.loadingCtrl.create({
      message: 'Espera un momento, por favor...',
      cssClass: 'custom-loading',
    });

    loading.present();
    return loading;
  }
}
