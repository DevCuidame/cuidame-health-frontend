import { Component, Input, OnInit, SimpleChanges, ViewChild } from '@angular/core';
// import {
//   ChartComponent,
//   ApexAxisChartSeries,
//   ApexChart,
//   ApexXAxis,
//   ApexDataLabels,
//   ApexTooltip,
//   ApexStroke,
//   ApexTitleSubtitle,
// } from 'ng-apexcharts';
import { MetricsFilterService } from 'src/app/core/services/Metrics/metricsFilter.service';

export type ChartOptions = {
  // series: ApexAxisChartSeries;
  // chart: ApexChart;
  // xaxis: ApexXAxis;
  // stroke: ApexStroke;
  // tooltip: ApexTooltip;
  // dataLabels: ApexDataLabels;
  // title: ApexTitleSubtitle;
  colors?: string[];
};

@Component({
  selector: 'app-metrics-chart',
  templateUrl: './metrics-chart.component.html',
  styleUrls: ['./metrics-chart.component.scss'],
})
export class MetricsChartComponent implements OnInit {
  @Input() title!: string;
  @Input() bloodPressureMetrics: any[] = [];
  @Input() bloodGlucoseMetrics: any[] = [];
  @Input() bloodOxygenMetrics: any[] = [];
  @Input() heartRateMetrics: any[] = [];
  @Input() respiratoryRateMetrics: any[] = [];

  // @ViewChild('chart') chart: ChartComponent;
  // public chartOptions: Partial<ChartOptions>;
  public currentFilter: 'day' | 'week' | 'month' | 'year' = 'day';
  public currentPeriod: Date = new Date();
  // public currentPeriodLabel: string;


  ngOnInit(): void {
    this.updateChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // if (changes.bloodPressureMetrics || changes.bloodGlucoseMetrics ||
    //     changes.bloodOxygenMetrics || changes.heartRateMetrics || 
    //     changes.respiratoryRateMetrics) {
    //   this.updateChart();
    // }
  }

  constructor(private metricsFilterService: MetricsFilterService) {}

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
    let filteredData: any[];
    let xCategories: string[];

    // Filtrar los datos según el filtro seleccionado
    // if (this.currentFilter === 'day') {
    //   this.currentPeriodLabel = this.currentPeriod.toLocaleDateString();
    //   filteredData = this.filterByDay(this.currentPeriod);
    //   this.metricsFilterService.updateFilteredMetrics(filteredData);
    // } else if (this.currentFilter === 'week') {
    //   this.currentPeriodLabel = `Semana del ${this.getStartOfWeek(
    //     this.currentPeriod
    //   ).toLocaleDateString()}`;
    //   filteredData = this.filterByWeek(this.currentPeriod);
    //   this.metricsFilterService.updateFilteredMetrics(filteredData);
    // } else if (this.currentFilter === 'month') {
    //   this.currentPeriodLabel = this.currentPeriod.toLocaleString('default', {
    //     month: 'long',
    //     year: 'numeric',
    //   });
    //   filteredData = this.filterByMonth(this.currentPeriod);
    //   this.metricsFilterService.updateFilteredMetrics(filteredData);
    // } else if (this.currentFilter === 'year') {
    //   this.currentPeriodLabel = this.currentPeriod.getFullYear().toString();
    //   filteredData = this.filterByYear(this.currentPeriod);
    //   this.metricsFilterService.updateFilteredMetrics(filteredData);
    // }

    // Si no hay datos filtrados, mostrar un mensaje o una gráfica vacía
    // if (filteredData.length === 0) {
    //   this.chartOptions = {
    //     series: [],
    //     chart: {
    //       height: 350,
    //       type: 'area',
    //       animations: {
    //         enabled: true,
    //         easing: 'easeinout',
    //         speed: 800,
    //         animateGradually: {
    //           enabled: true,
    //           delay: 150,
    //         },
    //         dynamicAnimation: {
    //           enabled: true,
    //           speed: 350,
    //         },
    //       },
    //     },
    //     title: {
    //       text: 'No hay datos disponibles',
    //       align: 'center',
    //       style: {
    //         fontSize: '16px',
    //         fontWeight: 'bold',
    //         color: '#666',
    //       },
    //     },
    //     xaxis: {
    //       categories: [],
    //     },
    //   };
    //   return;
    // }

    const formatDate = (dateString: string): string => {
      const options: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      };
      return new Date(dateString).toLocaleDateString(undefined, options);
    };

    // const formattedCategories = filteredData.map((metric) =>
    //   formatDate(metric.date)
    // );

    // Actualizar la gráfica con los datos filtrados
    // if (this.title === 'Presión Arterial') {
    //   this.chartOptions = {
    //     series: [
    //       {
    //         name: 'Sistólica',
    //         data: filteredData.map((metric) => metric.systolic),
    //       },
    //       {
    //         name: 'Diastólica',
    //         data: filteredData.map((metric) => metric.diastolic),
    //       },
    //     ],
    //     chart: {
    //       height: 350,
    //       type: 'area',
    //       animations: {
    //         enabled: true,
    //         easing: 'easeinout',
    //         speed: 800,
    //         animateGradually: {
    //           enabled: true,
    //           delay: 150,
    //         },
    //         dynamicAnimation: {
    //           enabled: true,
    //           speed: 350,
    //         },
    //       },
    //     },
    //     dataLabels: {
    //       enabled: false,
    //     },
    //     stroke: {
    //       curve: 'smooth',
    //     },
    //     xaxis: {
    //       categories: formattedCategories,
    //       labels: {
    //         formatter: (value) => formatDate(value),
    //       },
    //     },
    //     title: {
    //       text: "",
    //       align: 'left',
    //       margin: 20,
    //       style: {
    //         fontSize: '20px',
    //         fontWeight: 'bold',
    //         color: '#236596',
    //       },
    //     },
    //     colors: ['#236596', '#F58418'],
    //   };
    // } else if (this.title === 'Frecuencia Cardiaca') {
    //   this.chartOptions = {
    //     series: [
    //       {
    //         name: 'Frecuencia Cardiaca',
    //         data: filteredData.map((metric) => metric.rate),
    //       },
    //     ],
    //     chart: {
    //       type: 'area',
    //       height: 350,
    //       animations: {
    //         enabled: true,
    //         easing: 'easeinout',
    //         speed: 800,
    //         animateGradually: {
    //           enabled: true,
    //           delay: 150,
    //         },
    //         dynamicAnimation: {
    //           enabled: true,
    //           speed: 350,
    //         },
    //       },
    //     },
    //     dataLabels: {
    //       enabled: false,
    //     },
    //     stroke: {
    //       curve: 'smooth',
    //     },
    //     xaxis: {
    //       categories: formattedCategories,
    //       labels: {
    //         formatter: (value) => formatDate(value),
    //       },
    //     },
    //     title: {
    //       text: "",
    //       align: 'center',
    //       margin: 20,
    //       style: {
    //         fontSize: '20px',
    //         fontWeight: 'bold',
    //         color: '#236596',
    //       },
    //     },
    //     colors: ['#FF5733', '#33FF57', '#3357FF'],
    //   };
    // } else if (this.title === 'Frecuencia Respiratoria') {
    //   this.chartOptions = {
    //     series: [
    //       {
    //         name: 'Frecuencia Respiratoria',
    //         data: filteredData.map((metric) => metric.rate),
    //       },
    //     ],
    //     chart: {
    //       type: 'area',
    //       height: 350,
    //       animations: {
    //         enabled: true,
    //         easing: 'easeinout',
    //         speed: 800,
    //         animateGradually: {
    //           enabled: true,
    //           delay: 150,
    //         },
    //         dynamicAnimation: {
    //           enabled: true,
    //           speed: 350,
    //         },
    //       },
    //     },
    //     dataLabels: {
    //       enabled: false,
    //     },
    //     stroke: {
    //       curve: 'smooth',
    //     },
    //     xaxis: {
    //       categories: formattedCategories,
    //       labels: {
    //         formatter: (value) => formatDate(value),
    //       },
    //     },
    //     title: {
    //       text: "",
    //       align: 'left',
    //       margin: 20,
    //       style: {
    //         fontSize: '20px',
    //         fontWeight: 'bold',
    //         color: '#236596',
    //       },
    //     },
    //     colors: ['#FF5733', '#33FF57', '#3357FF'],
    //   };
    // } else if (this.title === 'Glucosa en la Sangre') {
    //   this.chartOptions = {
    //     series: [
    //       {
    //         name: 'Glucosa en la Sangre',
    //         data: filteredData.map((metric) => metric.rate),
    //       },
    //     ],
    //     chart: {
    //       type: 'area',
    //       height: 350,
    //       animations: {
    //         enabled: true,
    //         easing: 'easeinout',
    //         speed: 800,
    //         animateGradually: {
    //           enabled: true,
    //           delay: 150,
    //         },
    //         dynamicAnimation: {
    //           enabled: true,
    //           speed: 350,
    //         },
    //       },
    //     },
    //     dataLabels: {
    //       enabled: false,
    //     },
    //     stroke: {
    //       curve: 'smooth',
    //     },
    //     xaxis: {
    //       categories: formattedCategories,
    //       labels: {
    //         formatter: (value) => formatDate(value),
    //       },
    //     },
    //     title: {
    //       text: "",
    //       align: 'left',
    //       margin: 20,
    //       style: {
    //         fontSize: '20px',
    //         fontWeight: 'bold',
    //         color: '#236596',
    //       },
    //     },
    //     colors: ['#FF5733', '#33FF57', '#3357FF'],
    //   };
    // }
    // else if (this.title === 'Oxigeno en la sangre') {
    //   this.chartOptions = {
    //     series: [
    //       {
    //         name: 'Oxigeno en la sangre',
    //         data: filteredData.map((metric) => metric.rate),
    //       },
    //     ],
    //     chart: {
    //       type: 'area',
    //       height: 350,
    //       animations: {
    //         enabled: true,
    //         easing: 'easeinout',
    //         speed: 800,
    //         animateGradually: {
    //           enabled: true,
    //           delay: 150,
    //         },
    //         dynamicAnimation: {
    //           enabled: true,
    //           speed: 350,
    //         },
    //       },
    //     },
    //     dataLabels: {
    //       enabled: false,
    //     },
    //     stroke: {
    //       curve: 'smooth',
    //     },
    //     xaxis: {
    //       categories: formattedCategories,
    //       labels: {
    //         formatter: (value) => formatDate(value),
    //       },
    //     },
    //     title: {
    //       text: "",
    //       align: 'center',
    //       margin: 20,
    //       style: {
    //         fontSize: '20px',
    //         fontWeight: 'bold',
    //         color: '#236596',
    //       },
    //     },
    //     colors: ['#FF5733', '#33FF57', '#3357FF'],
    //   };
    // }
  }

  filterByDay(date: Date): any[] {
    const day = date.toLocaleDateString();
    return this.getMetrics().filter(
      (metric) => new Date(metric.date).toLocaleDateString() === day
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
