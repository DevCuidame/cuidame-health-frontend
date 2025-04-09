// src/app/modules/beneficiary/components/vitals/metrics/metrics.page.ts
import { Component, OnInit } from '@angular/core';
import { IonicModule, NavController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { MetricsService } from 'src/app/core/services/Metrics/metrics.service';
import { BeneficiaryService } from 'src/app/core/services/beneficiary.service';
import { Beneficiary } from 'src/app/core/interfaces/beneficiary.interface';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faHeartPulse, faDroplet, faWaveSquare, faCubesStacked, faLungs } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-metrics',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    FontAwesomeModule
  ],
  template: `
    <ion-content>
      <div class="metrics-header">
        <h2>Signos Vitales</h2>
        <p>Registra y monitoriza los parámetros de salud</p>
      </div>
      
      <div class="metrics-container">
        <div class="metric-button" (click)="navigateToMetric('Presión Arterial')">
          <div class="icon-container">
            <fa-icon [icon]="faDroplet"></fa-icon>
          </div>
          <div class="content-box">
            <h3>{{ bloodPressure }}</h3>
            <p *ngIf="lastMetrics.bloodPressure">
              {{ lastMetrics.bloodPressure.systolic }}/{{ lastMetrics.bloodPressure.diastolic }} mmHg
            </p>
            <p *ngIf="!lastMetrics.bloodPressure">Sin registros</p>
          </div>
        </div>
        
        <div class="metric-button" (click)="navigateToMetric('Frecuencia Cardiaca')">
          <div class="icon-container">
            <fa-icon [icon]="faHeartPulse"></fa-icon>
          </div>
          <div class="content-box">
            <h3>{{ heartRate }}</h3>
            <p *ngIf="lastMetrics.heartRate">
              {{ lastMetrics.heartRate.rate }} ppm
            </p>
            <p *ngIf="!lastMetrics.heartRate">Sin registros</p>
          </div>
        </div>
        
        <div class="metric-button" (click)="navigateToMetric('Frecuencia Respiratoria')">
          <div class="icon-container">
            <fa-icon [icon]="faWaveSquare"></fa-icon>
          </div>
          <div class="content-box">
            <h3>{{ respiratoryRate }}</h3>
            <p *ngIf="lastMetrics.respiratoryRate">
              {{ lastMetrics.respiratoryRate.rate }} rpm
            </p>
            <p *ngIf="!lastMetrics.respiratoryRate">Sin registros</p>
          </div>
        </div>
        
        <div class="metric-button" (click)="navigateToMetric('Glucosa en la Sangre')">
          <div class="icon-container">
            <fa-icon [icon]="faCubesStacked"></fa-icon>
          </div>
          <div class="content-box">
            <h3>{{ glucose }}</h3>
            <p *ngIf="lastMetrics.bloodGlucose">
              {{ lastMetrics.bloodGlucose.rate }} mg/dL
            </p>
            <p *ngIf="!lastMetrics.bloodGlucose">Sin registros</p>
          </div>
        </div>
        
        <div class="metric-button" (click)="navigateToMetric('Oxigeno en la sangre')">
          <div class="icon-container">
            <fa-icon [icon]="faLungs"></fa-icon>
          </div>
          <div class="content-box">
            <h3>{{ oxygen }}</h3>
            <p *ngIf="lastMetrics.bloodOxygen">
              {{ lastMetrics.bloodOxygen.rate }}%
            </p>
            <p *ngIf="!lastMetrics.bloodOxygen">Sin registros</p>
          </div>
        </div>
      </div>
      
      <div class="info-panel">
        <div class="info-header">
          <h3>¿Por qué monitorizar los signos vitales?</h3>
        </div>
        <div class="info-content">
          <p>
            El seguimiento regular de los signos vitales es fundamental para:
          </p>
          <ul>
            <li>Detectar cambios en el estado de salud</li>
            <li>Monitorizar condiciones médicas existentes</li>
            <li>Evaluar la respuesta a tratamientos</li>
            <li>Prevenir complicaciones de salud</li>
          </ul>
          <p>
            Recuerda consultar a un profesional de la salud ante cualquier valor anormal.
          </p>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .metrics-header {
      padding: 20px 16px;
      background: linear-gradient(90deg, #4fd1c5 0%, #2b6cb0 100%);
      color: white;
      border-radius: 0 0 16px 16px;
      margin-bottom: 20px;
    }
    
    .metrics-header h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
    }
    
    .metrics-header p {
      margin: 5px 0 0 0;
      font-size: 16px;
      opacity: 0.9;
    }
    
    .metrics-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 0 16px;
      margin-bottom: 24px;
    }
    
    .metric-button {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 20px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    
    .metric-button:active {
      transform: translateY(3px);
      box-shadow: 0 1px 5px rgba(0, 0, 0, 0.1);
    }
    
    .icon-container {
      width: 50px;
      height: 50px;
      border-radius: 10px;
      background: linear-gradient(145deg, #4fd1c5, #2b6cb0);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    
    .icon-container fa-icon {
      color: white;
      font-size: 24px;
    }
    
    .content-box {
      flex-grow: 1;
    }
    
    .content-box h3 {
      margin: 0 0 5px 0;
      font-size: 18px;
      color: var(--ion-color-dark);
    }
    
    .content-box p {
      margin: 0;
      color: var(--ion-color-medium-shade);
      font-size: 16px;
      font-weight: 500;
    }
    
    .info-panel {
      margin: 0 16px 24px;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
    }
    
    .info-header {
      background: linear-gradient(90deg, #ffba52 0%, #ff6a00 100%);
      padding: 12px 16px;
      color: white;
    }
    
    .info-header h3 {
      margin: 0;
      font-size: 18px;
    }
    
    .info-content {
      padding: 16px;
      color: var(--ion-color-dark);
    }
    
    .info-content p {
      margin: 0 0 12px 0;
      line-height: 1.5;
    }
    
    .info-content ul {
      margin: 0 0 12px 0;
      padding-left: 20px;
    }
    
    .info-content li {
      margin-bottom: 8px;
      line-height: 1.4;
    }
  `]
})
export class MetricsPage implements OnInit {
  // Nombres de métricas
  public bloodPressure: string = 'Presión Arterial';
  public heartRate: string = 'Frecuencia Cardiaca';
  public respiratoryRate: string = 'Frecuencia Respiratoria';
  public glucose: string = 'Glucosa en la Sangre';
  public oxygen: string = 'Oxigeno en la sangre';
  
  // Íconos de FontAwesome
  public faHeartPulse = faHeartPulse;
  public faDroplet = faDroplet;
  public faWaveSquare = faWaveSquare;
  public faCubesStacked = faCubesStacked;
  public faLungs = faLungs;
  
  // Beneficiario activo
  activeBeneficiary: Beneficiary | null = null;
  
  // Últimas métricas para mostrar en la pantalla principal
  lastMetrics: {
    bloodPressure: any | null;
    heartRate: any | null;
    respiratoryRate: any | null;
    bloodGlucose: any | null;
    bloodOxygen: any | null;
  } = {
    bloodPressure: null,
    heartRate: null,
    respiratoryRate: null,
    bloodGlucose: null,
    bloodOxygen: null
  };

  constructor(
    private navCtrl: NavController,
    private metricsService: MetricsService,
    private beneficiaryService: BeneficiaryService
  ) {}

  ngOnInit() {
    // Suscribirse al beneficiario activo
    this.beneficiaryService.activeBeneficiary$.subscribe(beneficiary => {
      this.activeBeneficiary = beneficiary;
      if (beneficiary) {
        this.loadLastMetrics(beneficiary.id);
      }
    });
  }

  /**
   * Carga las últimas métricas para cada tipo
   */
  loadLastMetrics(patientId: number) {
    // Cargar presión arterial
    this.metricsService.getBloodPressureData(patientId).subscribe(data => {
      if (data && data.bloodPressureMetrics && data.bloodPressureMetrics.length > 0) {
        // Ordenar por fecha más reciente
        const sorted = [...data.bloodPressureMetrics].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        this.lastMetrics.bloodPressure = sorted[0];
      }
    });
    
    // Cargar frecuencia cardíaca
    this.metricsService.getHeartRateData(patientId).subscribe(data => {
      if (data && data.heartRateMetrics && data.heartRateMetrics.length > 0) {
        const sorted = [...data.heartRateMetrics].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        this.lastMetrics.heartRate = sorted[0];
      }
    });
    
    // Cargar frecuencia respiratoria
    this.metricsService.getRespiratoryRateData(patientId).subscribe(data => {
      if (data && data.respiratoryRateMetrics && data.respiratoryRateMetrics.length > 0) {
        const sorted = [...data.respiratoryRateMetrics].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        this.lastMetrics.respiratoryRate = sorted[0];
      }
    });
    
    // Cargar glucosa en sangre
    this.metricsService.getBloodGlucoseData(patientId).subscribe(data => {
      if (data && data.bloodGlucoseMetrics && data.bloodGlucoseMetrics.length > 0) {
        const sorted = [...data.bloodGlucoseMetrics].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        this.lastMetrics.bloodGlucose = sorted[0];
      }
    });
    
    // Cargar oxígeno en sangre
    this.metricsService.getBloodOxygenData(patientId).subscribe(data => {
      if (data && data.bloodOxygenMetrics && data.bloodOxygenMetrics.length > 0) {
        const sorted = [...data.bloodOxygenMetrics].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        this.lastMetrics.bloodOxygen = sorted[0];
      }
    });
  }

  /**
   * Navega a la página de detalle de una métrica específica
   */
  navigateToMetric(metricType: string) {
    if (!this.activeBeneficiary) {
      return;
    }
    
    // Guardar el tipo de métrica seleccionada en el servicio
    this.metricsService.setMetric(metricType);
    
    // Navegar a la página de componente de métrica
    this.navCtrl.navigateForward('/beneficiary/home/metrics-component');
  }
}