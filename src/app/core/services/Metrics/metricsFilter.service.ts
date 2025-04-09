// metrics-filter.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MetricsFilterService {
  private filteredMetricsSource = new BehaviorSubject<any[]>([]);
  filteredMetrics$ = this.filteredMetricsSource.asObservable();

  updateFilteredMetrics(metrics: any[]) {
    this.filteredMetricsSource.next(metrics);
  }
}
