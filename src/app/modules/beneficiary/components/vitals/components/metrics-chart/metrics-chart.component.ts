// metrics-chart.component.ts
import { Component, Input, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexTooltip,
  ApexStroke,
  ApexTitleSubtitle,
  ApexLegend,
  ApexTheme,
  ChartComponent,
  NgApexchartsModule
} from 'ng-apexcharts';
import { MetricsFilterService } from 'src/app/core/services/Metrics/metricsFilter.service';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  stroke: ApexStroke;
  tooltip: ApexTooltip;
  dataLabels: ApexDataLabels;
  title: ApexTitleSubtitle;
  colors: string[];
  legend: ApexLegend;
  theme: ApexTheme;
};

@Component({
  selector: 'app-metrics-chart',
  template: `
    <div class="metrics-chart-container">
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
        <apx-chart
          [series]="chartOptions.series"
          [chart]="chartOptions.chart"
          [xaxis]="chartOptions.xaxis"
          [title]="chartOptions.title"
          [colors]="chartOptions.colors || []"
          [stroke]="chartOptions.stroke"
          [tooltip]="chartOptions.tooltip"
          [dataLabels]="chartOptions.dataLabels"
          [legend]="chartOptions.legend"
          [theme]="chartOptions.theme"
        ></apx-chart>
      </div>
      
      <div *ngIf="!hasData" class="no-data">
        <p>No hay datos suficientes para mostrar un gráfico</p>
      </div>
    </div>
  `,
  styles: [`
    .metrics-chart-container {
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
      height: 350px;
      position: relative;
      margin-top: 20px;
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
  `],
  standalone: true,
  imports: [CommonModule, NgApexchartsModule]
})
export class MetricsChartComponent implements OnInit {
  @ViewChild("chart") chart!: ChartComponent;
  @Input() title: string = '';
  @Input() bloodPressureMetrics: any[] = [];
  @Input() bloodGlucoseMetrics: any[] = [];
  @Input() bloodOxygenMetrics: any[] = [];
  @Input() heartRateMetrics: any[] = [];
  @Input() respiratoryRateMetrics: any[] = [];

  public chartOptions: ChartOptions;
  public currentFilter: 'day' | 'week' | 'month' | 'year' = 'day';
  public currentPeriod: Date = new Date();
  public currentPeriodLabel: string = '';
  public hasData: boolean = false;

  constructor(private metricsFilterService: MetricsFilterService) {
    // Configuración base del chart
    this.chartOptions = {
      series: [{
        name: '',
        data: []
      }],
      chart: {
        height: 350,
        type: "area",
        animations: {
          enabled: true,
          speed: 800,
          animateGradually: {
            enabled: true,
            delay: 150
          },
          dynamicAnimation: {
            enabled: true,
            speed: 350
          }
        },
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: true,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            reset: true
          }
        },
        dropShadow: {
          enabled: true,
          color: '#000',
          top: 18,
          left: 7,
          blur: 10,
          opacity: 0.2
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: "smooth",
        width: 3
      },
      xaxis: {
        categories: []
      },
      tooltip: {
        x: {
          format: "dd MMM, yyyy"
        },
        y: {
          formatter: function(val) {
            return val + " mmHg";
          }
        }
      },
      title: {
        text: "",
        align: 'left',
        margin: 20,
        style: {
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#236596'
        }
      },
      legend: {
        position: 'top',
        horizontalAlign: 'right',
        floating: true,
        offsetY: -25,
        offsetX: -5
      },
      theme: {
        mode: 'light'
      },
      colors: ['#236596', '#F58418']
    };
  }

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
    if (this.currentFilter === 'day') {
      this.currentPeriod.setDate(
        this.currentPeriod.getDate() + (direction === 'next' ? 1 : -1)
      );
    } else if (this.currentFilter === 'week') {
      this.currentPeriod.setDate(
        this.currentPeriod.getDate() + (direction === 'next' ? 7 : -7)
      );
    } else if (this.currentFilter === 'month') {
      this.currentPeriod.setMonth(
        this.currentPeriod.getMonth() + (direction === 'next' ? 1 : -1)
      );
    } else if (this.currentFilter === 'year') {
      this.currentPeriod.setFullYear(
        this.currentPeriod.getFullYear() + (direction === 'next' ? 1 : -1)
      );
    }
    this.updateChart();
  }

  updateChart(): void {
    let filteredData: any[] = [];

    // Filtrar los datos según el filtro seleccionado
    if (this.currentFilter === 'day') {
      this.currentPeriodLabel = this.currentPeriod.toLocaleDateString();
      filteredData = this.filterByDay(this.currentPeriod);
    } else if (this.currentFilter === 'week') {
      this.currentPeriodLabel = `Semana del ${this.getStartOfWeek(
        this.currentPeriod
      ).toLocaleDateString()}`;
      filteredData = this.filterByWeek(this.currentPeriod);
    } else if (this.currentFilter === 'month') {
      this.currentPeriodLabel = this.currentPeriod.toLocaleString('default', {
        month: 'long',
        year: 'numeric',
      });
      filteredData = this.filterByMonth(this.currentPeriod);
    } else if (this.currentFilter === 'year') {
      this.currentPeriodLabel = this.currentPeriod.getFullYear().toString();
      filteredData = this.filterByYear(this.currentPeriod);
    }

    // Actualizar las métricas filtradas en el servicio
    this.metricsFilterService.updateFilteredMetrics(filteredData);

    // Si no hay datos filtrados, mostrar un mensaje o una gráfica vacía
    if (!filteredData || filteredData.length === 0) {
      this.hasData = false;
      this.chartOptions.series = [{
        name: '',
        data: []
      }];
      this.chartOptions.xaxis.categories = [];
      return;
    }

    this.hasData = true;

    // Formatear fechas para el eje X
    const formattedCategories = filteredData.map((metric) =>
      this.formatDateForFilter(new Date(metric.date))
    );

    // Configurar la gráfica según el tipo de métrica
    if (this.title === 'Presión Arterial') {
      this.chartOptions.series = [
        {
          name: 'Sistólica',
          data: filteredData.map((metric) => metric.systolic),
        },
        {
          name: 'Diastólica',
          data: filteredData.map((metric) => metric.diastolic),
        },
      ];
      this.chartOptions.xaxis.categories = formattedCategories;
      this.chartOptions.colors = ['#236596', '#F58418'];
      this.chartOptions.tooltip = {
        ...this.chartOptions.tooltip,
        y: {
          formatter: function(val) {
            return val + " mmHg";
          }
        }
      };
    } else if (this.title === 'Frecuencia Cardiaca') {
      this.chartOptions.series = [
        {
          name: 'Frecuencia Cardiaca',
          data: filteredData.map((metric) => metric.rate),
        },
      ];
      this.chartOptions.xaxis.categories = formattedCategories;
      this.chartOptions.colors = ['#FF5733'];
      this.chartOptions.tooltip = {
        ...this.chartOptions.tooltip,
        y: {
          formatter: function(val) {
            return val + " ppm";
          }
        }
      };
    } else if (this.title === 'Frecuencia Respiratoria') {
      this.chartOptions.series = [
        {
          name: 'Frecuencia Respiratoria',
          data: filteredData.map((metric) => metric.rate),
        },
      ];
      this.chartOptions.xaxis.categories = formattedCategories;
      this.chartOptions.colors = ['#33FF57'];
      this.chartOptions.tooltip = {
        ...this.chartOptions.tooltip,
        y: {
          formatter: function(val) {
            return val + " rpm";
          }
        }
      };
    } else if (this.title === 'Glucosa en la Sangre') {
      this.chartOptions.series = [
        {
          name: 'Glucosa en la Sangre',
          data: filteredData.map((metric) => metric.rate),
        },
      ];
      this.chartOptions.xaxis.categories = formattedCategories;
      this.chartOptions.colors = ['#3357FF'];
      this.chartOptions.tooltip = {
        ...this.chartOptions.tooltip,
        y: {
          formatter: function(val) {
            return val + " mg/dL";
          }
        }
      };
    } else if (this.title === 'Oxigeno en la sangre') {
      this.chartOptions.series = [
        {
          name: 'Oxigeno en la sangre',
          data: filteredData.map((metric) => metric.rate),
        },
      ];
      this.chartOptions.xaxis.categories = formattedCategories;
      this.chartOptions.colors = ['#9933FF'];
      this.chartOptions.tooltip = {
        ...this.chartOptions.tooltip,
        y: {
          formatter: function(val) {
            return val + "%";
          }
        }
      };
    }
  }

  // Formatea la fecha según el tipo de filtro seleccionado
  private formatDateForFilter(date: Date): string {
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
        return date.toLocaleDateString();
    }
  }

  filterByDay(date: Date): any[] {
    const day = date.toISOString().split('T')[0];
    return this.getMetrics().filter(
      (metric) => new Date(metric.date).toISOString().split('T')[0] === day
    );
  }

  filterByWeek(date: Date): any[] {
    const startOfWeek = this.getStartOfWeek(date);
    const endOfWeek = this.getEndOfWeek(date);
    return this.getMetrics().filter((metric) => {
      const metricDate = new Date(metric.date);
      return metricDate >= startOfWeek && metricDate <= endOfWeek;
    });
  }

  filterByMonth(date: Date): any[] {
    const month = date.getMonth();
    const year = date.getFullYear();
    return this.getMetrics().filter((metric) => {
      const metricDate = new Date(metric.date);
      return (
        metricDate.getMonth() === month && metricDate.getFullYear() === year
      );
    });
  }

  filterByYear(date: Date): any[] {
    const year = date.getFullYear();
    return this.getMetrics().filter(
      (metric) => new Date(metric.date).getFullYear() === year
    );
  }

  getStartOfWeek(date: Date): Date {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(start.setDate(diff));
  }

  getEndOfWeek(date: Date): Date {
    const startOfWeek = this.getStartOfWeek(date);
    return new Date(startOfWeek.setDate(startOfWeek.getDate() + 6));
  }

  getMetrics(): any[] {
    if (this.title === 'Presión Arterial') {
      return this.bloodPressureMetrics;
    } else if (this.title === 'Frecuencia Cardiaca') {
      return this.heartRateMetrics;
    } else if (this.title === 'Frecuencia Respiratoria') {
      return this.respiratoryRateMetrics;
    } else if (this.title === 'Glucosa en la Sangre') {
      return this.bloodGlucoseMetrics;
    } else if (this.title === 'Oxigeno en la sangre') {
      return this.bloodOxygenMetrics;
    }
    return [];
  }
}