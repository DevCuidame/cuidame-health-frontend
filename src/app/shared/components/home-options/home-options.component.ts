import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  faAddressBook,
  faUserInjured,
  faSyringe,
  faBriefcase,
  faFileWaveform,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-home-options',
  standalone: true,
  imports: [FontAwesomeModule, CommonModule],
  templateUrl: './home-options.component.html',
  styleUrls: ['./home-options.component.scss'],
})
export class HomeOptionsComponent implements OnInit {

  public faAddressBook = faAddressBook;
  public faUserInjured = faUserInjured;
  public faSyringe = faSyringe;
  public faBriefcase = faBriefcase;
  public faFileWaveform = faFileWaveform;

  ngOnInit() {}

  selectOption(option: string) {}
}
