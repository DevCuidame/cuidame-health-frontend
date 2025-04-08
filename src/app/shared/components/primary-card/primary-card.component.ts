import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-primary-card',
  imports: [CommonModule],
  templateUrl: './primary-card.component.html',
  styleUrls: ['./primary-card.component.scss'],
})
export class PrimaryCardComponent  implements OnInit {
  @Input() maxHeight: string = '240px';
  @Input() minHeight: string = '';
  @Input() padding: string = '';

  constructor() { }

  ngOnInit() {}

}
