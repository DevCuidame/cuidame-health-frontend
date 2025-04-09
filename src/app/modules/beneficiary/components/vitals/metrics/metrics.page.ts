import { AfterViewInit, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular';
// import { User } from 'src/app/interfaces';
// import { MetricsService } from 'src/app/services/Metrics/metrics.service';
// import { StorageService } from 'src/app/services/storage.service';

@Component({
  selector: 'app-metrics',
  templateUrl: './metrics.page.html',
  styleUrls: ['./metrics.page.scss'],
})
export class MetricsPage implements AfterViewInit {
  public bloodPressure: string = 'Presión Arterial';
  public heartRate: string = 'Frecuencia Cardiaca';
  public RespiratoryRate: string = 'Frecuencia Respiratoria';
  public glucose: string = 'Glucosa en la Sangre';
  public oxygen: string = 'Oxigeno en la sangre';

  constructor(
    public navCtrl: NavController,
    // private storageService: StorageService,
    // private metricService: MetricsService,
    private router: Router
  ) {}

  async ngAfterViewInit() {
    // await this.storageService.init();
    await this.avalaible();
    // await this.getUser();
  }

  // public pacientOrPet: boolean;
  public petId: string = '';
  // public user: User;
  public agreement: any;

  async avalaible() {
    // const agreement = this.storageService.getPetAgreement();
    // if (agreement === undefined || agreement === 'null') {
    //   this.agreement = false;
    // } else {
    //   this.agreement = true;
    // }
  }

  // metricsComponent(option: String) {
  //   if (option === 'bloodPressure') {
  //     this.metricService.setMetric(this.bloodPressure);
  //   } else if (option === 'heartRate') {
  //     this.metricService.setMetric(this.heartRate);
  //   } else if (option === 'glucose') {
  //     this.metricService.setMetric(this.glucose);
  //   } else if (option === 'oxygen') {
  //     this.metricService.setMetric(this.oxygen);
  //   } else {
  //     this.metricService.setMetric(this.RespiratoryRate);
  //   }
  //   this.navCtrl.navigateForward('/private/pages/metrics-component');
  // }

  // private async getUser() {
  //   await this.storageService
  //     .loadUser()
  //     .then((userp) => {
  //       if (userp) {
  //         this.user = userp;
  //       }
  //     })
  //     .catch((e) => console.log('Error obteniento user storage', e));
  // }
}
