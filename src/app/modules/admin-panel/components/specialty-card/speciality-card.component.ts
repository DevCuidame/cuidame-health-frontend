import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, ElementRef, AfterViewInit } from '@angular/core';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-speciality-card',
  imports: [CommonModule],
  templateUrl: './speciality-card.component.html',
  styleUrls: ['./speciality-card.component.scss'],
})
export class SpecialityCardComponent implements OnInit, AfterViewInit {
  @Input() speciality: string = 'Prueba';
  @Input() image!: string;
  @Input() lowResImage: string = '';

  public api = environment.url;
  public imageLoaded = false;

  constructor(private el: ElementRef) {}

  ngOnInit() {
  }

  ngAfterViewInit() {
    const highResImg = this.el.nativeElement.querySelector('.high-res');
    if (highResImg) {
      highResImg.onload = () => {
        this.imageLoaded = true;
      };
    }
  }
}