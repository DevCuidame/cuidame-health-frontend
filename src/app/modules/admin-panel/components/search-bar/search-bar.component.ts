import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import {
  faFilter,
  faCaretDown,
  faCaretUp,
  faSearch,
} from '@fortawesome/free-solid-svg-icons';
@Component({
  selector: 'app-search-bar',
  imports: [CommonModule, FontAwesomeModule, FormsModule],
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss'],
})
export class SearchBarComponent implements OnInit, OnDestroy {
  @Input() public text: string = 'Tienes {highlight} de citas pendientes por asignar.';
  @Input() public highlighted: string = '';
  @Input() public fontWeight: string = '';
  
  @Output() searchChange = new EventEmitter<string>();
  @Output() filterChange = new EventEmitter<any>();
  
  public faFilter = faFilter;
  public faCaretDown = faCaretDown;
  public faCaretUp = faCaretUp;
  public faSearch = faSearch;

  public showDropdown = false;
  public searchTerm = '';
  public selectedFilters = {
    specialty: '',
    status: '',
    dateRange: ''
  };
  
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor() {}

  ngOnInit() {
    // Configurar debounce para la búsqueda
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.searchChange.emit(searchTerm);
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchInput(event: any) {
    this.searchTerm = event.target.value;
    this.searchSubject.next(this.searchTerm);
  }

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  applyFilter(filterType: string, value: string) {
    this.selectedFilters = { ...this.selectedFilters, [filterType]: value };
    this.filterChange.emit(this.selectedFilters);
    this.showDropdown = false;
  }

  clearFilters() {
    this.selectedFilters = {
      specialty: '',
      status: '',
      dateRange: ''
    };
    this.searchTerm = '';
    this.searchChange.emit('');
    this.filterChange.emit(this.selectedFilters);
  }

  get textParts(): string[] {
    return this.text.split('{highlight}');
  }
}
  