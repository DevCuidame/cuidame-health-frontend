// src/app/modules/beneficiary/components/vitals/metrics-component/metrics-component.page.ts
import { Component, OnInit } from '@angular/core';
import { IonicModule, NavController, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { MetricsService } from 'src/app/core/services/Metrics/metrics.service';
import { MetricsFilterService } from 'src/app/core/services/Metrics/metricsFilter.service';
import { BeneficiaryService } from 'src/app/core/services/beneficiary.service';
import { Beneficiary } from 'src/app/core/interfaces/beneficiary.interface';
import { MetricFormComponent } from '../components/metric-form/metric-form.component';
import { UpdateMetricFormComponent } from '../components/update-metric-form/update-metric-form.component';
import { MetricsChartComponent } from '../components/metrics-chart/metrics-chart.component';

@Component({
  selector: 'app-metrics-component',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    MetricsChartComponent
  ],
  template: `
    <div class="metric-header">
      <ion-icon name="chevron-back-outline" (click)="back()"></ion-icon>
      <p>{{title}}</p>
      <ion-icon name="add-outline" (click)="addMetric()"></ion-icon>
    </div>

    <ng-container *ngIf="showChart">
      <app-metrics-chart
        [title]="title"
        [bloodPressureMetrics]="bloodPressureMetrics"
        [bloodGlucoseMetrics]="bloodGlucoseMetrics"
        [bloodOxygenMetrics]="bloodOxygenMetrics"
        [heartRateMetrics]="heartRateMetrics"
        [respiratoryRateMetrics]="respiratoryRateMetrics"
      ></app-metrics-chart>
    </ng-container>

    <div class="data-summary">
      <p [ngSwitch]="title">
        <ng-container *ngSwitchCase="'Frecuencia Cardiaca'">
          El ritmo cardiaco se mide en pulsaciones por minuto (ppm), y puede aumentar
          con la actividad, el estrés o la excitación.
        </ng-container>
        <ng-container *ngSwitchCase="'Presión Arterial'">
          La presión arterial se mide en milímetros de mercurio (mmHg), y las lecturas
          de la presión sistólica y diastólica son un indicador de la salud del corazón.
        </ng-container>
        <ng-container *ngSwitchCase="'Frecuencia Respiratoria'">
          La frecuencia respiratoria se mide en respiraciones por minuto (rpm) y puede
          aumentar mientras se hace ejercicio o ante una enfermedad.
        </ng-container>
        <ng-container *ngSwitchCase="'Glucosa en la Sangre'">
          La glucosa en la sangre es la principal fuente de energía del cuerpo y se
          mide en miligramos por decilitro (mg/dL). Sus niveles pueden variar después
          de comer o ante condiciones de salud como la diabetes.
        </ng-container>
        <ng-container *ngSwitchCase="'Oxigeno en la sangre'">
          El oxígeno en la sangre indica la cantidad de oxígeno transportado por los
          glóbulos rojos y se mide en porcentaje (%). Los niveles normales suelen
          estar entre 95% y 100%, y pueden bajar ante problemas respiratorios o enfermedades.
        </ng-container>
      </p>
    </div>

    <div class="data">
      <ng-container *ngIf="filteredMetrics.length; else noData">
        <div *ngFor="let metric of filteredMetrics" 
             class="metric-item" 
             (click)="handleAnimation($event); updateMetric(metric)">
          <div class="metric-date">{{metric.date | date:'mediumDate'}}</div>
          <div class="metric-time">{{metric.date | date:'shortTime'}}</div>
          <div class="metric-value">
            <ng-container [ngSwitch]="title">
              <ng-container *ngSwitchCase="'Presión Arterial'">
                {{metric.systolic}}/{{metric.diastolic}} mmHg
              </ng-container>
              <ng-container *ngSwitchCase="'Frecuencia Cardiaca'">
                {{metric.rate}} ppm
              </ng-container>
              <ng-container *ngSwitchCase="'Glucosa en la Sangre'">
                {{metric.rate}} mg/dL
              </ng-container>
              <ng-container *ngSwitchCase="'Oxigeno en la sangre'">
                {{metric.rate}} %
              </ng-container>
              <ng-container *ngSwitchDefault>
                {{metric.rate}} rpm
              </ng-container>
            </ng-container>
          </div>
        </div>
      </ng-container>
      <ng-template #noData>
        <div class="metric-item no-data">No hay datos disponibles</div>
      </ng-template>
    </div>
  `,
  styles: [`
    .metric-header {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: #275289;
      margin: 50px 0;
    }
    
    .metric-header ion-icon {
      font-size: 2.875rem;
      transition: all 0.1s ease-in-out;
      cursor: pointer;
    }
    
    .metric-header ion-icon:active {
      transform: translateY(4px);
    }
    
    .metric-header p {
      font-size: 1.875rem;
      margin: 0;
    }
    
    .data-summary {
      padding: 20px;
      background: linear-gradient(90deg, #ffba52 0%, #ff6a00 100%);
      border-radius: 8px;
      margin: 20px 0;
      color: #fff;
    }
    
    .data-summary p {
      font-size: 16px;
      line-height: 1.5;
      color: #fff;
    }
    
    .data {
      display: flex;
      flex-direction: column-reverse;
      max-height: 180px;
      overflow-y: auto;
      padding: 20px;
      gap: 20px;
      background: linear-gradient(90deg, #4fd1c5 0%, #2b6cb0 100%);
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .metric-item {
      display: flex;
      justify-content: space-between;
      padding: 10px 5px;
      color: #fff;
      border-bottom: 1px solid #ddd;
      align-items: center;
      border-radius: 10px;
      position: relative;
      overflow: hidden;
      transition: background-color 0.5s ease-in-out, box-shadow 0.5s ease-in-out;
      cursor: pointer;
    }
    
    .metric-item.no-data {
      justify-content: center;
      padding: 20px;
      font-style: italic;
      opacity: 0.8;
      cursor: default;
    }
    
    .metric-item span.ripple {
      position: absolute;
      border-radius: 50%;
      transform: scale(0);
      background: rgba(255, 255, 255, 0.5);
      animation: ripple-effect 0.6s linear;
      pointer-events: none;
    }
    
    @keyframes ripple-effect {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }
    
    .metric-item.animate {
      background-color: rgba(255, 255, 255, 0.1);
      box-shadow: 0 0 10px rgba(255, 255, 255, 0.6), 0 0 20px rgba(255, 255, 255, 0.3);
      transition: box-shadow 0.5s ease, background-color 0.5s ease;
    }
    
    .metric-date {
      font-size: 14px;
      font-weight: bold;
      margin-right: 10px;
    }
    
    .metric-time {
      font-size: 12px;
      margin-right: 10px;
    }
    
    .metric-value {
      font-size: 16px;
      text-align: right;
      flex-grow: 1;
    }
  `]
})
export class MetricsComponentPage implements OnInit {
  public title: string = '';
  public filter: string = 'day';
  private patientId: number = 0;
  public activeBeneficiary: Beneficiary | null = null;

  public heartRateMetrics: any[] = [];
  public bloodPressureMetrics: any[] = [];
  public respiratoryRateMetrics: any[] = [];
  public bloodGlucoseMetrics: any[] = [];
  public bloodOxygenMetrics: any[] = [];

  public showChart: boolean = false;
  public filteredMetrics: any[] = [];

  constructor(
    private metricsService: MetricsService,
    private modalController: ModalController,
    public navCtrl: NavController,
    private metricsFilterService: MetricsFilterService,
    private beneficiaryService: BeneficiaryService
  ) {
    this.title = this.metricsService.getMetric();
    if (!this.title) {
      this.navCtrl.navigateRoot('/beneficiary/home');
    }
  }

  ngOnInit() {
    // Suscribirse a los cambios de métricas filtradas
    this.metricsFilterService.filteredMetrics$.subscribe(metrics => {
      this.filteredMetrics = metrics;
    });

    // Suscribirse al beneficiario activo
    this.beneficiaryService.activeBeneficiary$.subscribe(beneficiary => {
      this.activeBeneficiary = beneficiary;
      if (beneficiary) {
        this.patientId = beneficiary.id;
        this.loadData();
      }
    });
  }

  loadData() {
    if (!this.patientId) return;
    
    switch (this.title) {
      case 'Presión Arterial':
        this.metricsService.getBloodPressureData(this.patientId).subscribe(data => {
          if (data && data.bloodPressureMetrics) {
            this.bloodPressureMetrics = data.bloodPressureMetrics;
            this.filteredMetrics = this.bloodPressureMetrics;
            this.checkIfShowChart();
          }
        });
        break;
        
      case 'Frecuencia Cardiaca':
        this.metricsService.getHeartRateData(this.patientId).subscribe(data => {
          if (data && data.heartRateMetrics) {
            this.heartRateMetrics = data.heartRateMetrics;
            this.filteredMetrics = this.heartRateMetrics;
            this.checkIfShowChart();
          }
        });
        break;
        
      case 'Frecuencia Respiratoria':
        this.metricsService.getRespiratoryRateData(this.patientId).subscribe(data => {
          if (data && data.respiratoryRateMetrics) {
            this.respiratoryRateMetrics = data.respiratoryRateMetrics;
            this.filteredMetrics = this.respiratoryRateMetrics;
            this.checkIfShowChart();
          }
        });
        break;
        
      case 'Glucosa en la Sangre':
        this.metricsService.getBloodGlucoseData(this.patientId).subscribe(data => {
          if (data && data.bloodGlucoseMetrics) {
            this.bloodGlucoseMetrics = data.bloodGlucoseMetrics;
            this.filteredMetrics = this.bloodGlucoseMetrics;
            this.checkIfShowChart();
          }
        });
        break;
        
      case 'Oxigeno en la sangre':
        this.metricsService.getBloodOxygenData(this.patientId).subscribe(data => {
          if (data && data.bloodOxygenMetrics) {
            this.bloodOxygenMetrics = data.bloodOxygenMetrics;
            this.filteredMetrics = this.bloodOxygenMetrics;
            this.checkIfShowChart();
          }
        });
        break;
    }
  }

  checkIfShowChart() {
    this.showChart = (
      (this.title === 'Presión Arterial' && this.bloodPressureMetrics.length > 0) ||
      (this.title === 'Frecuencia Cardiaca' && this.heartRateMetrics.length > 0) ||
      (this.title === 'Frecuencia Respiratoria' && this.respiratoryRateMetrics.length > 0) ||
      (this.title === 'Glucosa en la Sangre' && this.bloodGlucoseMetrics.length > 0) ||
      (this.title === 'Oxigeno en la sangre' && this.bloodOxygenMetrics.length > 0)
    );
  }

  async addMetric() {
    if (!this.activeBeneficiary) return;
    
    const modal = await this.modalController.create({
      component: MetricFormComponent,
      componentProps: {
        title: this.title,
      },
      cssClass: 'metric-form-modal'
    });

    modal.onDidDismiss().then((data) => {
      if (data.data && data.data.reload) {
        this.loadData();
      }
    });

    return await modal.present();
  }

  async updateMetric(metric: any) {
    if (!this.activeBeneficiary) return;
    
    const modal = await this.modalController.create({
      component: UpdateMetricFormComponent,
      componentProps: {
        title: this.title,
        data: metric,
      },
      cssClass: 'metric-form-modal'
    });

    modal.onDidDismiss().then((data) => {
      if (data.data && data.data.reload) {
        this.loadData();
      }
    });

    return await modal.present();
  }

  back() {
    this.navCtrl.navigateBack('/beneficiary/home');
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
    ripple.style.width = ripple.style.height = `${rippleSize}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    
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