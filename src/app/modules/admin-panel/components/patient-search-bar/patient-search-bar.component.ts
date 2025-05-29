import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { environment } from 'src/environments/environment';
@Component({
  selector: 'app-patient-search-bar',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './patient-search-bar.component.html',
  styleUrls: ['./patient-search-bar.component.scss'],
})
export class PatientSearchBarComponent implements OnInit {
  @Input() public first_name: string = '';
  @Input() public last_name: string = '';
  @Input() public image_path: string = '';
  @Input() public bs64: string = '';
  @Input() public appointmentType: string = '';
  @Input() public showBar: boolean = true;
  @Input() public cityName: string = '';
  @Input() public ticketNumber: string = '';

  @Output() searchTermChanged = new EventEmitter<string>();

  public environment = environment.url;
  public faSearch = faSearch;
  public processedImagePath: string = '';

  ngOnInit(): void {
    this.processedImagePath = this.getProcessedImagePath();
  }

  /**
   * Obtener la ruta de imagen procesada
   */
  private getProcessedImagePath(): string {
    if (this.bs64 && this.bs64.trim() !== '') {
      // Agregar prefijo si no lo tiene
      if (!this.bs64.startsWith('data:image')) {
        return `data:image/jpeg;base64,${this.bs64}`;
      }
      return this.bs64;
    }
  
    if (!this.image_path || this.image_path.trim() === '') {
      return 'assets/images/default_user.png';
    }
  
    if (this.image_path.startsWith('http://') || this.image_path.startsWith('https://')) {
      return this.image_path;
    }
  
    if (this.image_path.startsWith('assets/')) {
      return this.image_path;
    }
  
    return this.environment + this.image_path;
  }
  
  

  /**
   * Obtener el nombre completo del paciente
   */
  public getFullName(): string {
    const firstName = this.first_name?.trim() || '';
    const lastName = this.last_name?.trim() || '';
    
    if (!firstName && !lastName) {
      return 'Paciente sin nombre';
    }
    
    return `${firstName} ${lastName}`.trim();
  }

  /**
   * Manejar cambios en el término de búsqueda
   */
  onSearchTermChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target && typeof target.value === 'string') {
      const searchTerm = target.value.trim();
      this.searchTermChanged.emit(searchTerm);
    }
  }

  /**
   * Manejar errores de carga de imagen
   */
  onImageError(): void {
    this.processedImagePath = 'assets/images/default_user.png';
  }
}
