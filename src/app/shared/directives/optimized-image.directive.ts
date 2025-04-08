// optimized-image.directive.ts
import { Directive, ElementRef, Input, OnInit } from '@angular/core';

@Directive({
  selector: 'img[appOptimizedImage]'
})
export class OptimizedImageDirective implements OnInit {
  @Input() appOptimizedImage: string = '';

  constructor(private el: ElementRef<HTMLImageElement>) {}

  ngOnInit() {
    const img = this.el.nativeElement;
    
    img.style.filter = 'blur(5px)';
    img.style.transition = 'filter 0.3s ease-out';
    
    img.onload = () => {
      img.style.filter = 'blur(0)';
    };

    img.onerror = () => {
      img.src = 'assets/images/placeholder-doctor.png';
    };
  }
}