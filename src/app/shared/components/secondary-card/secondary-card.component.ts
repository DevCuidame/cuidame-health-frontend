import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-secondary-card',
  imports: [CommonModule],
  templateUrl: './secondary-card.component.html',
  styleUrls: ['./secondary-card.component.scss'],
})
export class SecondaryCardComponent implements OnInit {
  constructor() {}

  ngOnInit() {}
}
