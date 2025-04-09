// src/app/modules/beneficiary/components/vitals/components/metrics-chart/metrics-chart.component.ts
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MetricsFilterService } from 'src/app/core/services/Metrics/metricsFilter.service';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-metrics-chart',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <div class="chart-container">
      <div class="filters">
        <button 
          [class.active]="currentFilter === 'day'" 
          (click)="setFilter('day')">Día</button>
        <button 
          [class.active]="currentFilter === 'week'" 
          (click)="setFilter('week')">Semana</button>
        <button 
          [class.active]="currentFilter === 'month'" 
          (click)="setFilter('month')">Mes</button>
        <button 
          [class.active]="currentFilter === 'year'" 
          (click)="setFilter('year')">Año</button>
      </div>

      <div class="navigation">
        <button (click)="navigate('prev')" class="nav-button">&larr;</button>
        <span class="period-label">{{ currentPeriodLabel }}</span>
        <button (click)="navigate('next')" class="nav-button">&rarr;</button>
      </div>

      <div *ngIf="hasData" class="chart-area">
        <!-- Aquí iría el componente de gráfico real -->
        <!-- Por ahora, mostramos un placeholder del gráfico -->
        <div class="chart-placeholder">
          <div class="chart-bars">
            <div *ngFor="let value of chartData" 
                 class="chart-bar" 
                 [style.height.%]="calculateBarHeight(value)">
              <span class="bar-value">{{ formatValue(value) }}</span>
            </div>
          </div>
          <div class="chart-labels">
            <span *ngFor="let label of chartLabels">{{ label }}</span>
          </div>
        </div>
      </div>
      
      <div *ngIf="!hasData" class="no-data">
        <p>No hay datos suficientes para mostrar un gráfico</p>
      </div>
    </div>
  `,
  styles: [`
    .chart-container {
      background-color: white;
      border-radius: 12px;
      padding: 15px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      margin: 20px 0;
    }
    
    .filters {
      display: flex;
      justify-content: center;
      margin-bottom: 15px;
      gap: 8px;
    }
    
    .filters button {
      background-color: #236596;
      border: none;
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.3s ease;
      font-size: 14px;
    }
    
    .filters button:hover {
      background-color: #1a4c73;
    }
    
    .filters button.active {
      background-color: white;
      color: #1a4c73;
      border: 2px solid #1a4c73;
      transform: scale(1.05);
    }
    
    .navigation {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 15px 0;
      padding: 0 10px;
    }
    
    .nav-button {
      background-color: #f58418;
      border: none;
      color: white;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      transition: background-color 0.3s ease;
    }
    
    .nav-button:hover {
      background-color: #cc6c12;
    }
    
    .period-label {
      font-size: clamp(16px, 4vw, 20px);
      font-weight: 600;
      color: #1a4c73;
    }
    
    .chart-area {
      height: 250px;
      position: relative;
      margin-top: 20px;
    }
    
    .chart-placeholder {
      height: 200px;
      width: 100%;
      position: relative;
      display: flex;
      flex-direction: column;
    }
    
    .chart-bars {
      display: flex;
      justify-content: space-around;
      align-items: flex-end;
      height: 180px;
      width: 100%;
      flex-grow: 1;
    }
    
    .chart-bar {
      width: 30px;
      background-image: linear-gradient(to top, #4fd1c5, #2b6cb0);
      border-radius: 4px 4px 0 0;
      position: relative;
      transition: all 0.5s ease;
      margin: 0 2px;
    }
    
    .bar-value {
      position: absolute;
      top: -20px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 12px;
      color: #1a4c73;
      font-weight: bold;
    }
    
    .chart-labels {
      display: flex;
      justify-content: space-around;
      margin-top: 10px;
      font-size: 12px;
      color: #666;
    }
    
    .no-data {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 200px;
      color: #666;
      font-style: italic;
      border: 1px dashed #ccc;
      border-radius: 8px;
      margin-top: 20px;
    }
    
    /* Animación para las barras del gráfico */
    @keyframes grow-up {
      from { height: 0; }
      to { height: 100%; }
    }
    
    .chart-bar {
      animation: grow-up 0.8s ease;
    }
  `]
})
export class MetricsChartComponent implements OnInit, OnChanges {
  @Input() title: string = '';
  @Input() bloodPressureMetrics: any[] = [];
  @Input() bloodGlucoseMetrics: any[] = [];
  @Input() bloodOxygenMetrics: any[] = [];
  @Input() heartRateMetrics: any[] = [];
  @Input() respiratoryRateMetrics: any[] = [];

  public currentFilter: 'day' | 'week' | 'month' | 'year' = 'day';
  public currentPeriod: Date = new Date();
  public currentPeriodLabel: string = '';
  public chartData: number[] = [];
  public chartLabels: string[] = [];
  public hasData: boolean = false;
  public maxValue: number = 0;

  constructor(private metricsFilterService: MetricsFilterService) {}

  ngOnInit(): void {
    this.updateChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['bloodPressureMetrics'] || 
        changes['bloodGlucoseMetrics'] ||
        changes['bloodOxygenMetrics'] || 
        changes['heartRateMetrics'] || 
        changes['respiratoryRateMetrics']) {
      this.updateChart();
    }
  }

  setFilter(filter: 'day' | 'week' | 'month' | 'year'): void {
    this.currentFilter = filter;
    this.currentPeriod = new Date(); // Reset to today
    this.updateChart();
  }

  navigate(direction: 'prev' | 'next'): void {
    const isForward = direction === 'next';
    const adjustment = isForward ? 1 : -1;
    
    switch (this.currentFilter) {
      case 'day':
        this.currentPeriod.setDate(this.currentPeriod.getDate() + adjustment);
        break;
      case 'week':
        this.currentPeriod.setDate(this.currentPeriod.getDate() + (adjustment * 7));
        break;
      case 'month':
        this.currentPeriod.setMonth(this.currentPeriod.getMonth() + adjustment);
        break;
      case 'year':
        this.currentPeriod.setFullYear(this.currentPeriod.getFullYear() + adjustment);
        break;
    }
    
    this.updateChart();
  }

  updateChart(): void {
    // Obtener los datos métricos correctos según el título
    const metrics = this.getMetricsByTitle();
    
    // Aplicar filtrado según el período seleccionado
    const filteredData = this.filterMetricsByPeriod(metrics);
    
    // Actualizar el estado de filtrado compartido
    this.metricsFilterService.updateFilteredMetrics(filteredData);
    
    // Actualizar la etiqueta del período actual
    this.updatePeriodLabel();
    
    // Si no hay datos, marcar hasData como falso
    if (filteredData.length === 0) {
      this.hasData = false;
      this.chartData = [];
      this.chartLabels = [];
      return;
    }

    // Preparar datos para el gráfico
    this.prepareChartData(filteredData);
    
    // Indicar que hay datos para mostrar
    this.hasData = true;
  }

  getMetricsByTitle(): any[] {
    switch (this.title) {
      case 'Presión Arterial':
        return this.bloodPressureMetrics;
      case 'Frecuencia Cardiaca':
        return this.heartRateMetrics;
      case 'Frecuencia Respiratoria':
        return this.respiratoryRateMetrics;
      case 'Glucosa en la Sangre':
        return this.bloodGlucoseMetrics;
      case 'Oxigeno en la sangre':
        return this.bloodOxygenMetrics;
      default:
        return [];
    }
  }

  filterMetricsByPeriod(metrics: any[]): any[] {
    if (!metrics || metrics.length === 0) {
      return [];
    }

    const today = this.currentPeriod;
    
    switch (this.currentFilter) {
      case 'day': {
        // Filtrar métricas del día actual
        const day = today.toISOString().split('T')[0];
        return metrics.filter(metric => 
          new Date(metric.date).toISOString().split('T')[0] === day
        );
      }
      
      case 'week': {
        // Filtrar métricas de la semana actual
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        
        return metrics.filter(metric => {
          const date = new Date(metric.date);
          return date >= startOfWeek && date <= endOfWeek;
        });
      }
      
      case 'month': {
        // Filtrar métricas del mes actual
        const year = today.getFullYear();
        const month = today.getMonth();
        
        return metrics.filter(metric => {
          const date = new Date(metric.date);
          return date.getFullYear() === year && date.getMonth() === month;
        });
      }
      
      case 'year': {
        // Filtrar métricas del año actual
        const year = today.getFullYear();
        
        return metrics.filter(metric => 
          new Date(metric.date).getFullYear() === year
        );
      }
      
      default:
        return metrics;
    }
  }

  updatePeriodLabel(): void {
    const options: Intl.DateTimeFormatOptions = { 
      day: '2-digit', 
      month: 'short',
      year: 'numeric'
    };
    
    switch (this.currentFilter) {
      case 'day':
        this.currentPeriodLabel = this.currentPeriod.toLocaleDateString(undefined, options);
        break;
        
      case 'week': {
        const startOfWeek = new Date(this.currentPeriod);
        startOfWeek.setDate(this.currentPeriod.getDate() - this.currentPeriod.getDay());
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        
        const startStr = startOfWeek.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
        const endStr = endOfWeek.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
        
        this.currentPeriodLabel = `${startStr} - ${endStr}`;
        break;
      }
        
      case 'month':
        this.currentPeriodLabel = this.currentPeriod.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
        break;
        
      case 'year':
        this.currentPeriodLabel = this.currentPeriod.getFullYear().toString();
        break;
    }
  }

  prepareChartData(filteredData: any[]): void {
    // Ordenar datos por fecha
    const sortedData = [...filteredData].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Limitar a máximo 7 puntos de datos para mejor visualización
    const dataPoints = this.limitDataPoints(sortedData, 7);
    
    // Preparar etiquetas y valores según el tipo de métrica
    this.chartLabels = dataPoints.map(item => this.formatDateLabel(new Date(item.date)));
    
    if (this.title === 'Presión Arterial') {
      // Para presión arterial, mostrar valores sistólicos
      this.chartData = dataPoints.map(item => item.systolic);
      this.maxValue = Math.max(...this.chartData) * 1.2; // 20% más para margen visual
    } else {
      // Para otras métricas, mostrar valores de tasa
      this.chartData = dataPoints.map(item => item.rate);
      this.maxValue = Math.max(...this.chartData) * 1.2; // 20% más para margen visual
    }
  }

  limitDataPoints(data: any[], maxPoints: number): any[] {
    if (data.length <= maxPoints) {
      return data;
    }
    
    // Si hay más puntos que el máximo, tomar muestras distribuidas
    const result = [];
    const step = Math.floor(data.length / maxPoints);
    
    for (let i = 0; i < maxPoints - 1; i++) {
      result.push(data[i * step]);
    }
    
    // Asegurar que el último punto siempre esté incluido
    result.push(data[data.length - 1]);
    
    return result;
  }

  formatDateLabel(date: Date): string {
    switch (this.currentFilter) {
      case 'day':
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case 'week':
        return date.toLocaleDateString([], { weekday: 'short' });
      case 'month':
        return date.getDate().toString();
      case 'year':
        return date.toLocaleDateString([], { month: 'short' });
      default:
        return '';
    }
  }

  calculateBarHeight(value: number): number {
    if (!this.maxValue) return 0;
    return (value / this.maxValue) * 100;
  }

  formatValue(value: number): string {
    if (this.title === 'Presión Arterial') {
      // Para presión arterial
      return value.toString();
    } else if (this.title === 'Glucosa en la Sangre') {
      // Para glucosa
      return `${value}`;
    } else if (this.title === 'Oxigeno en la sangre') {
      // Para oxígeno
      return `${value}%`;
    } else {
      // Para frecuencias cardíaca y respiratoria
      return value.toString();
    }
  }
}