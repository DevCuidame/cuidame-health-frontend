import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule, AlertController, NavController } from '@ionic/angular';
import { User } from 'src/app/core/interfaces/auth.interface';
import { Beneficiary } from 'src/app/core/interfaces/beneficiary.interface';
import { Plan } from 'src/app/core/interfaces/plan.interface';
import { BeneficiaryService } from 'src/app/core/services/beneficiary.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-beneficiary-card',
  imports: [IonicModule],
  templateUrl: './beneficiary-card.component.html',
  styleUrls: ['./beneficiary-card.component.scss'],
})
export class BeneficiaryCardComponent implements OnInit {
  @Input() beneficiaries: Beneficiary[] = [];
  public environment = environment.url;
  public beneficiaryCount: number = 0;
  public maxBeneficiaries: number = 5;
  @Input() plan?: Plan;

  constructor(
    private router: Router,
    private alertCtrl: AlertController,
    private beneficiaryService: BeneficiaryService,
    private navCtrl: NavController,
  ) {}

  ngOnInit() {
  
  }

  goToBeneficiary(beneficiary: Beneficiary) {
    this.beneficiaryService.setActiveBeneficiary({...beneficiary})
    this.navCtrl.navigateForward(['/beneficiary/home'])
  }

  get sortedBeneficiaries(): Beneficiary[] {
    return [...this.beneficiaries].sort((a, b) =>
      a.nombre.localeCompare(b.nombre)
    );
  }
  
  get isIndividualPlan(): boolean {
    return this.plan?.code?.includes('INDIVIDUAL') || false;
  }

  get hasPlan(): boolean {
    return !!this.plan;
  }

  async createBeneficiary() {
  
    this.router.navigate(['/beneficiary/add'], { queryParams: { new: true } });
  }
}