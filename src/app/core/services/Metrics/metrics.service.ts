import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

const url = environment.url;

@Injectable({
  providedIn: 'root'
})
export class MetricsService {

  constructor(private http: HttpClient) {}

  getBloodPressureData(patientId: number): Observable<any> {
    return this.http.get(`${url}api/blood-pressure/patient/${patientId}`);
  }

  getBloodGlucoseData(patientId: number): Observable<any> {
    return this.http.get(`${url}api/blood-glucose/patient/${patientId}`);
  }

  getBloodOxygenData(patientId: number): Observable<any> {
    return this.http.get(`${url}api/blood-oxygen/patient/${patientId}`);
  }

  getHeartRateData(patientId: number): Observable<any> {
    return this.http.get(`${url}api/heart-rate/patient/${patientId}`);
  }

  getRespiratoryRateData(patientId: number): Observable<any> {
    return this.http.get(`${url}api/respiratory-rate/patient/${patientId}`);
  }

  

  addBloodPressureData(data: any): Observable<any> {
    return this.http.post(`${url}api/blood-pressure`, data);
  }

  addBloodGlucoseData(data: any): Observable<any> {
    return this.http.post(`${url}api/blood-glucose`, data);
  }

  addBloodOxygenData(data: any): Observable<any> {
    return this.http.post(`${url}api/blood-oxygen`, data);
  }

  addHeartRateData(data: any): Observable<any> {
    return this.http.post(`${url}api/heart-rate`, data);
  }

  addRespiratoryRateData(data: any): Observable<any> {
    return this.http.post(`${url}api/respiratory-rate`, data);
  }

  //update

  updateBloodPressureData(data: any, id: any): Observable<any> {
    return this.http.put(`${url}api/blood-pressure/${id}`, data);
  }

  updateBloodGlucoseData(data: any, id: any): Observable<any> {
    return this.http.put(`${url}api/blood-glucose/${id}`, data);
  }

  updateBloodOxygenData(data: any, id: any): Observable<any> {
    return this.http.put(`${url}api/blood-oxygen/${id}`, data);
  }

  updateHeartRateData(data: any, id: any): Observable<any> {
    return this.http.put(`${url}api/heart-rate/${id}`, data);
  }

  updateRespiratoryRateData(data: any, id: any): Observable<any> {
    return this.http.put(`${url}api/respiratory-rate/${id}`, data);
  }

    //delete

    deleteBloodPressureData(id: any): Observable<any> {
      return this.http.delete(`${url}api/blood-pressure/${id}`);
    }
  
    deleteBloodGlucoseData(id: any): Observable<any> {
      return this.http.delete(`${url}api/blood-glucose/${id}`);
    }
  
    deleteBloodOxygenData(id: any): Observable<any> {
      return this.http.delete(`${url}api/blood-oxygen/${id}`);
    }
  
    deleteHeartRateData(id: any): Observable<any> {
      return this.http.delete(`${url}api/heart-rate/${id}`);
    }
  
    deleteRespiratoryRateData(id: any): Observable<any> {
      return this.http.delete(`${url}api/respiratory-rate/${id}`);
    }

  private option = '';

  getMetric(): string {
    return this.option;
  }

  setMetric(metric: string) {
    this.option = metric;
  }

}
