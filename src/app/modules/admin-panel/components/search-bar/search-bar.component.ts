import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faFilter,
  faCaretDown,
  faCaretUp,
  faSearch,
} from '@fortawesome/free-solid-svg-icons';
@Component({
  selector: 'app-search-bar',
  imports: [CommonModule, FontAwesomeModule],

  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss'],
})
export class SearchBarComponent implements OnInit {
  @Input() public text: string = 'Tienes {highlight} de citas pendientes por asignar.';
  @Input() public highlighted: string = '';
  @Input() public fontWeight: string = '';
  public faFilter = faFilter;
  public faCaretDown = faCaretDown;
  public faCaretUp = faCaretUp;
  public faSearch = faSearch;

  public showDropdown = false;

  constructor() {}

  ngOnInit() {
    console.log("🚀 ~ SearchBarComponent ~ ngOnInit ~ as:", this.highlighted)
    
  }

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  get textParts(): string[] {
    return this.text.split('{highlight}');
  }
}
  