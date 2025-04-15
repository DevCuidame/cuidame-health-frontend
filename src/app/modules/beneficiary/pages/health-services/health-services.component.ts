// health-services.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { IonicModule, NavController } from '@ionic/angular';

@Component({
  selector: 'app-health-services',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './health-services.component.html',
  styleUrls: ['./health-services.component.scss'],
})
export class HealthServicesComponent implements OnInit {
  public activeCard: string | null = null;
  public agreement: string = '';
  public vetRequest: string = '';
  public serviceRequest: boolean = false;

  constructor(
    public navCtrl: NavController,
  ) {
    // this.serviceRequest = this.dataService.getData();
  }

  selectCard(cardId: string) {
    this.activeCard = cardId;
    
    // Opcional: crear efecto de ripple
    setTimeout(() => {
      this.activeCard = null;
    }, 300);
  }

  async ngOnInit() {
    await this.getPetAgreement();
  }

  async getPetAgreement() {
    // this.agreement = this.storageService.getPetAgreement();
  }

  goToVeterinarians = async () => {
    this.vetRequest = 'veterinary';
    // this.clinicService.setButtons(this.vetRequest)
    this.navCtrl.navigateForward('/maps');
  };
  
  openWhatsappBath = async () => {
    this.vetRequest = 'lab';
    // this.clinicService.setButtons(this.vetRequest)
    this.navCtrl.navigateForward('/maps');
  };
  
  openWhatsappHotel = async () => {
    this.vetRequest = 'all';
    // this.clinicService.setButtons(this.vetRequest)
    this.navCtrl.navigateForward('/maps');
  };
  
  openWhatsappSpa = async () => {
    this.vetRequest = 'all';
    // this.clinicService.setButtons(this.vetRequest)
    this.navCtrl.navigateForward('/maps');
  };
}