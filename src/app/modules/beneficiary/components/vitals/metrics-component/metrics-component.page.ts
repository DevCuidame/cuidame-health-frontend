import { Component, OnDestroy, OnInit } from '@angular/core';
// import { MetricsService } from '../../../../services/Metrics/metrics.service';
// import { StorageService } from 'src/app/services/storage.service';
import { ModalController, NavController } from '@ionic/angular';
// import { MetricFormComponent } from 'src/app/components/metric-form/metric-form.component';
import { Subscription } from 'rxjs';
// import { MetricsFilterService } from 'src/app/services/Metrics/metricsFilter.service';
// import { UpdateMetricFormComponent } from 'src/app/components/update-metric-form/update-metric-form.component';

@Component({
  selector: 'app-metrics-component',
  templateUrl: './metrics-component.page.html',
  styleUrls: ['./metrics-component.page.scss'],
})
export class MetricsComponentPage implements OnInit, OnDestroy {
  public title: string = '';
  public filter: string = 'day';
  // private patientId: number;

  public heartRateMetrics: any[] = [];
  public bloodPressureMetrics: any[] = [];
  public respiratoryRateMetrics: any[] = [];
  public bloodGlucoseMetrics: any[] = [];
  public bloodOxygenMetrics: any[] = [];

  public showChart: boolean = false;

  filteredMetrics: any[] = [];
  private metricsSubscription: Subscription | undefined;

  constructor(
    // private metricsService: MetricsService,
    // private storageService: StorageService,
    private modalController: ModalController,
    public navCtrl: NavController,
    // private metricsFilteredService: MetricsFilterService
  ) {
    // this.title = this.metricsService.getMetric();
    // if (!this.title) {
    //   this.navCtrl.navigateRoot('/private/pages/metrics');
    // }
    // this.patientId = Number(this.storageService.getPatientId());
  }

  ngOnInit() {
    // this.metricsSubscription =
    //   this.metricsFilteredService.filteredMetrics$.subscribe((metrics) => {
    //     this.filteredMetrics = metrics;
    //   });
    // this.loadData();
  }

  ngOnDestroy(): void {
    if (this.metricsSubscription) {
      this.metricsSubscription.unsubscribe();
    }
  }
  async addMetric() {
    // const modal = await this.modalController.create({
    //   component: MetricFormComponent,
    //   componentProps: {
    //     title: this.title,
    //   },
    // });

    // modal.onDidDismiss().then((data) => {
    //   if (data.data && data.data.reload) {
    //     // this.loadData();
    //   }
    // });

    // return await modal.present();
  }

  async updateMetric(metric: any) {
    // const modal = await this.modalController.create({
    //   component: UpdateMetricFormComponent,
    //   componentProps: {
    //     title: this.title,
    //     data: metric,
    //   },
    // });

    // modal.onDidDismiss().then((data) => {
    //   if (data.data && data.data.reload) {
    //     // this.loadData();
    //   }
    // });

    // return await modal.present();
  }

  // loadData() {
  //   if (this.title === 'Presión Arterial') {
  //     this.metricsService
  //       .getBloodPressureData(this.patientId)
  //       .subscribe((data) => {
  //         this.bloodPressureMetrics = data.bloodPressureMetrics;
  //         this.checkIfShowChart();
  //       });
  //   } else if (this.title === 'Frecuencia Cardiaca') {
  //     this.metricsService.getHeartRateData(this.patientId).subscribe((data) => {
  //       this.heartRateMetrics = data.heartRateMetrics;
  //       this.checkIfShowChart();
  //     });
  //   } else if (this.title === 'Frecuencia Respiratoria') {
  //     this.metricsService
  //       .getRespiratoryRateData(this.patientId)
  //       .subscribe((data) => {
  //         this.respiratoryRateMetrics = data.respiratoryRateMetrics;
  //         this.checkIfShowChart();
  //       });
  //   } else if (this.title === 'Glucosa en la Sangre') {
  //     this.metricsService
  //       .getBloodGlucoseData(this.patientId)
  //       .subscribe((data) => {
  //         this.bloodGlucoseMetrics = data.bloodGlucoseMetrics;
  //         this.checkIfShowChart();
  //       });
  //   } else if (this.title === 'Oxigeno en la sangre') {
  //     this.metricsService
  //       .getBloodOxygenData(this.patientId)
  //       .subscribe((data) => {
  //         this.bloodOxygenMetrics = data.bloodOxygenMetrics;
  //         this.checkIfShowChart();
  //       });
  //   }
  // }

  checkIfShowChart() {
    if (
      (this.title === 'Presión Arterial' &&
        this.bloodPressureMetrics.length > 0) ||
      (this.title === 'Frecuencia Cardiaca' &&
        this.heartRateMetrics.length > 0) ||
      (this.title === 'Frecuencia Respiratoria' &&
        this.respiratoryRateMetrics.length > 0) ||
      (this.title === 'Glucosa en la Sangre' &&
        this.bloodGlucoseMetrics.length > 0) ||
      (this.title === 'Oxigeno en la sangre' &&
        this.bloodOxygenMetrics.length > 0)
    ) {
      this.showChart = true;
    } else {
      this.showChart = false;
    }
  }

  back() {
    this.navCtrl.navigateRoot('/private/pages/metrics');
  }

  handleAnimation(event: MouseEvent): void {
    const element = event.currentTarget as HTMLElement;
  
    // Crear el efecto ripple
    const ripple = document.createElement('span');
    ripple.classList.add('ripple');
  
    // Obtener las coordenadas del clic dentro del elemento
    const rect = element.getBoundingClientRect();
    const rippleSize = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - rippleSize / 2;
    const y = event.clientY - rect.top - rippleSize / 2;
  
    // Establecer el tamaño y la posición del ripple
    // ripple.style.width = ripple.style.height = `${rippleSize}px`;
    // ripple.style.left = `${x}px`;
    // ripple.style.top = `${y}px`;
  
    // Añadir el ripple al metric-item
    element.appendChild(ripple);
  
    // Añadir la clase de animación
    element.classList.add('animate');
  
    // Remover el ripple y la animación después de que termine
    setTimeout(() => {
      ripple.remove();
      element.classList.remove('animate');
    }, 600); // Duración de la animación
  }
  
}
