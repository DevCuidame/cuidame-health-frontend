import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Beneficiary } from 'src/app/core/interfaces/beneficiary.interface';
import { BeneficiaryService } from 'src/app/core/services/beneficiary.service';
import { EditButtonComponent } from 'src/app/shared/components/edit-button/edit-button.component';
import { PrimaryCardComponent } from 'src/app/shared/components/primary-card/primary-card.component';
import { faPills } from '@fortawesome/free-solid-svg-icons';
import { SecondaryCardComponent } from 'src/app/shared/components/secondary-card/secondary-card.component';

@Component({
  selector: 'app-medicaments-allergies-list',
  imports: [ CommonModule, EditButtonComponent, FontAwesomeModule, SecondaryCardComponent],

  templateUrl: './medicaments-allergies-list.component.html',
  styleUrls: ['./medicaments-allergies-list.component.scss'],
})
export class MedicamentsAllergiesListComponent implements OnInit {
  public activeBeneficiary: Beneficiary | null = null;
  public faPills = faPills

  public severityText: { [key: string]: string } = {
    MILD: 'Leve',
    MODERATE: 'Moderado',
    SEVERE: 'Severo'
  };
  

  constructor(private beneficiaryService: BeneficiaryService) {}

  ngOnInit() {
    this.beneficiaryService.activeBeneficiary$.subscribe((beneficiary) => {
      this.activeBeneficiary = beneficiary;
    });
  }
}
