import { Component, Input, OnInit } from '@angular/core';
import { User } from 'src/app/core/interfaces/auth.interface';
import { Beneficiary } from 'src/app/core/interfaces/beneficiary.interface';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faAddressCard,
  faCakeCandles,
  faHouse,
  faMap,
  faVenusMars,
  faPhone,
  faCity,
  faCross,
  faDroplet,
  faBriefcaseMedical,
  faHospital
} from '@fortawesome/free-solid-svg-icons';
import { PrimaryCardComponent } from '../primary-card/primary-card.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-basic-data',
  templateUrl: './basic-data.component.html',
  styleUrls: ['./basic-data.component.scss'],
  standalone: true,
  imports: [FontAwesomeModule, PrimaryCardComponent, CommonModule],
})
export class BasicDataComponent implements OnInit {
  @Input() public user: User | null = null;
  @Input() public beneficiary: Beneficiary | null = null;
  @Input() public fontColor: string = '';
  @Input() public iconColor: string = '';
  @Input() public opacity: string = '';
  @Input() public maxHeight: string = '';

  public selectedEntity: any | null = null;

  // 👇 Definimos las variables para los iconos
  public faAddressCard = faAddressCard;
  public faCakeCandles = faCakeCandles;
  public faHouse = faHouse;
  public faMap = faMap;
  public faVenusMars = faVenusMars;
  public faPhone = faPhone;
  public faCity = faCity;
  public faCross = faCross;
  public faDroplet = faDroplet;
  public faBriefcaseMedical = faBriefcaseMedical;
  public faHospital = faHospital;

  constructor() {}

  ngOnInit() {
    this.selectedEntity = this.beneficiary;
  }
}
