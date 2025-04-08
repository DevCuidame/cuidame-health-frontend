import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Beneficiary } from 'src/app/core/interfaces/beneficiary.interface';
import { BeneficiaryService } from 'src/app/core/services/beneficiary.service';
import { EditButtonComponent } from 'src/app/shared/components/edit-button/edit-button.component';
import { PrimaryCardComponent } from 'src/app/shared/components/primary-card/primary-card.component';
import { SecondaryCardComponent } from 'src/app/shared/components/secondary-card/secondary-card.component';
import { faSyringe } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-vacinations-list',
  imports: [CommonModule, EditButtonComponent, SecondaryCardComponent, FontAwesomeModule],

  templateUrl: './vacinations-list.component.html',
  styleUrls: ['./vacinations-list.component.scss'],
})
export class VacinationsListComponent implements OnInit {
  public activeBeneficiary: Beneficiary | null = null;
  public faSyringe = faSyringe

  constructor(private beneficiaryService: BeneficiaryService) {}

  ngOnInit() {
    this.beneficiaryService.activeBeneficiary$.subscribe((beneficiary) => {
      this.activeBeneficiary = beneficiary;
    });
  }
}
