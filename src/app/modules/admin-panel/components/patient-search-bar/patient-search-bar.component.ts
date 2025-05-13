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
  @Input() public firstTime: boolean = false;
  @Input() public cityName: string = '';
  @Input() public ticketNumber: string = '';

  @Output() searchTermChanged = new EventEmitter<string>();

  public environment = environment.url;

  public faSearch = faSearch;

  ngOnInit(): void {
    if (!this.image_path) {
      this.image_path = 'assets/images/default_user.png';
    }else {
      this.image_path = this.environment + this.image_path; 
    }
  }

  onSearchTermChange(event: any) {
    this.searchTermChanged.emit(event.target.value);
  }
}
