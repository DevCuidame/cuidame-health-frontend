import { Component, Input, OnInit } from '@angular/core';
import { Beneficiary } from 'src/app/core/interfaces/beneficiary.interface';
import { BeneficiaryService } from 'src/app/core/services/beneficiary.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-beneficiary-header',
  templateUrl: './beneficiary-header.component.html',
  styleUrls: ['./beneficiary-header.component.scss'],
})
export class BeneficiaryHeaderComponent implements OnInit {
  public environment = environment.url;
  public activeBeneficiary: Beneficiary | null = null;

  constructor(private beneficiaryService: BeneficiaryService) {}

  ngOnInit() {
    this.beneficiaryService.activeBeneficiary$.subscribe((beneficiary) => {
      this.activeBeneficiary = beneficiary;
    });
  }
}
