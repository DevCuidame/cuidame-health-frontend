import { Component, OnInit } from '@angular/core';
import { IonicModule, NavController } from '@ionic/angular';
import { Beneficiary } from 'src/app/core/interfaces/beneficiary.interface';
import { BeneficiaryHeaderComponent } from 'src/app/shared/components/beneficiary-header/beneficiary-header.component';
import { TabBarComponent } from 'src/app/shared/components/tab-bar/tab-bar.component';
import { BasicDataComponent } from 'src/app/shared/components/basic-data/basic-data.component';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { BeneficiaryService } from '../../../../core/services/beneficiary.service';
import { EditButtonComponent } from 'src/app/shared/components/edit-button/edit-button.component';

@Component({
  selector: 'app-home-beneficiary',
  standalone: true, 
  imports: [
    IonicModule,
    CommonModule,
    BeneficiaryHeaderComponent,
    TabBarComponent,
    BasicDataComponent,
    RouterModule,
    EditButtonComponent,
  ],
  templateUrl: './home-beneficiary.component.html',
  styleUrls: ['./home-beneficiary.component.scss'],
})
export class HomeBeneficiaryComponent implements OnInit {
  public activeBeneficiary: Beneficiary | null = null;
  public selectedOption: string = '';
  public showBasicData: boolean = true;

  public categories: { label: string; route: string }[] = [
    { label: 'Condiciones', route: 'conditions' },
    { label: 'Antecedentes', route: 'medical-history' },
    { label: 'Medicamentos & Alergias', route: 'medicaments-allergies' },
    { label: 'Vacunas', route: 'vacinations' }
  ];

  constructor(
    private beneficiaryService: BeneficiaryService,
    private navCtrl: NavController,
    private router: Router
  ) {}

  ngOnInit() {

    this.router.events.subscribe(() => {
      this.showBasicData = this.router.url === '/beneficiary/home';
    });


    this.beneficiaryService.activeBeneficiary$.subscribe((beneficiary) => {
      this.activeBeneficiary = beneficiary;
    });
    if (this.activeBeneficiary === null) {
      this.navCtrl.navigateRoot(['/home/dashboard']);
    }

    const currentRoute = this.router.url.split('/').pop();
    const foundCategory = this.categories.find(cat => cat.route === currentRoute);
    if (foundCategory) {
      this.selectedOption = foundCategory.route;
    }
  }

  isSelected(optionRoute: string): boolean {
    return this.selectedOption === optionRoute;
  }

  selectOption(optionRoute: string) {
    this.selectedOption = optionRoute;
    this.router.navigate(['/beneficiary/home', optionRoute]);
  }
}
