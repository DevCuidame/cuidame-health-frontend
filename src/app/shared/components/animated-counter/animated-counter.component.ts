import { Component, Input, OnInit, OnChanges, SimpleChanges, OnDestroy, ElementRef, Renderer2, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-animated-counter',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './animated-counter.component.html',
  styleUrls: ['./animated-counter.component.scss'],
})
export class AnimatedCounterComponent implements OnInit, OnChanges, OnDestroy {
  // Inputs for customization
  @Input() targetValue: number = 0;
  @Input() duration: number = 1500;  // Animation duration in ms
  @Input() prefix: string = '';      // Text before the number (e.g., "$")
  @Input() suffix: string = '';      // Text after the number (e.g., "%")
  @Input() label: string = '';       // Label text (e.g., "Beneficiarios")
  @Input() showProgress: boolean = true;  // Whether to show progress bar
  @Input() style: 'linear' | 'circular' = 'linear';  // Counter style
  @Input() showConfetti: boolean = false;  // Trigger confetti at completion
  @Input() formatNumber: boolean = false;  // Format with commas (1,234)
  @Input() decimalPlaces: number = 0;      // Number of decimal places to show

  // Internal state
  public currentValue: number = 0;
  public displayValue: string = '0';
  private countAnimationId: number | null = null;
  private animationStartTime: number = 0;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.startAnimation();
  }

  ngOnChanges(changes: SimpleChanges) {
    // If target value changes, restart animation
    if (changes['targetValue'] && !changes['targetValue'].firstChange) {
      this.startAnimation();
    }
  }

  ngOnDestroy() {
    // Cancel animation if component is destroyed
    if (this.countAnimationId !== null) {
      cancelAnimationFrame(this.countAnimationId);
    }
  }

  startAnimation() {
    // Cancel any existing animation
    if (this.countAnimationId !== null) {
      cancelAnimationFrame(this.countAnimationId);
    }
    
    // Reset to zero
    this.currentValue = 0;
    this.updateDisplayValue();
    this.animationStartTime = performance.now();
    
    // Start the animation frame loop
    this.countAnimationId = requestAnimationFrame(this.updateAnimation.bind(this));
  }

  updateAnimation(timestamp: number) {
    // Calculate animation progress (0 to 1)
    const elapsed = timestamp - this.animationStartTime;
    const progress = Math.min(elapsed / this.duration, 1);
    
    // Apply easing function for smoother animation
    const easedProgress = this.easeOutQuad(progress);
    
    // Use different precision based on if we want decimals
    if (this.decimalPlaces > 0) {
      // Calculate with decimal points
      const factor = Math.pow(10, this.decimalPlaces);
      this.currentValue = Math.round(easedProgress * this.targetValue * factor) / factor;
    } else {
      // Calculate with integers
      this.currentValue = Math.min(
        Math.floor(easedProgress * this.targetValue), 
        this.targetValue
      );
    }
    
    this.updateDisplayValue();
    this.cdRef.detectChanges();
    
    // Continue animation if not finished
    if (progress < 1) {
      this.countAnimationId = requestAnimationFrame(this.updateAnimation.bind(this));
    } else {
      // Animation completed
      this.countAnimationId = null;
      
      // Trigger confetti if enabled and we have a positive value
      if (this.showConfetti && this.targetValue > 0) {
        this.triggerConfetti();
      }
    }
  }

  // Format display value according to options
  updateDisplayValue() {
    let value = this.currentValue;
    let formattedValue: string;
    
    if (this.formatNumber) {
      formattedValue = this.formatNumberWithCommas(value);
    } else if (this.decimalPlaces > 0) {
      formattedValue = value.toFixed(this.decimalPlaces);
    } else {
      formattedValue = value.toString();
    }
    
    this.displayValue = `${this.prefix}${formattedValue}${this.suffix}`;
  }

  // Easing function for smoother animation
  easeOutQuad(t: number): number {
    return t * (2 - t);
  }

  // Format number with commas
  formatNumberWithCommas(value: number): string {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: this.decimalPlaces,
      maximumFractionDigits: this.decimalPlaces
    });
  }

  // Calculate progress percentage for bar/circle
  get progressPercentage(): number {
    if (this.targetValue === 0) return 0;
    return (this.currentValue / this.targetValue) * 100;
  }

  // Get circular progress style
  get circularProgressStyle() {
    return {
      background: `conic-gradient(var(--ion-color-secondary) ${this.progressPercentage * 3.6}deg, #f2f2f2 0deg)`
    };
  }

  // Add confetti animation
  triggerConfetti() {
    const confettiContainer = document.createElement('div');
    this.renderer.addClass(confettiContainer, 'confetti-container');
    this.renderer.appendChild(document.body, confettiContainer);
    
    // Create confetti particles
    const colors = ['#FFC107', '#2196F3', '#4CAF50', '#FF5722', '#9C27B0'];
    const particleCount = Math.min(50, this.targetValue * 5);
    
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      this.renderer.addClass(particle, 'confetti');
      
      // Random styling
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = Math.random() * 10 + 5;
      const left = Math.random() * 100;
      
      this.renderer.setStyle(particle, 'background-color', color);
      this.renderer.setStyle(particle, 'width', `${size}px`);
      this.renderer.setStyle(particle, 'height', `${size}px`);
      this.renderer.setStyle(particle, 'left', `${left}%`);
      this.renderer.setStyle(particle, 'animation-delay', `${Math.random() * 2}s`);
      this.renderer.setStyle(particle, 'animation-duration', `${Math.random() * 3 + 2}s`);
      
      this.renderer.appendChild(confettiContainer, particle);
    }
    
    // Remove confetti after animation completes
    setTimeout(() => {
      if (confettiContainer && confettiContainer.parentNode) {
        confettiContainer.parentNode.removeChild(confettiContainer);
      }
    }, 5000);
  }
}