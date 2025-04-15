import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  faAddressBook,
  faUserInjured,
  faSyringe,
  faBriefcase,
  faFileWaveform,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Router, NavigationEnd, Event } from '@angular/router';
import { NavController } from '@ionic/angular';
import { Subscription, filter } from 'rxjs';

@Component({
  selector: 'app-home-options',
  standalone: true,
  imports: [FontAwesomeModule, CommonModule],
  templateUrl: './home-options.component.html',
  styleUrls: ['./home-options.component.scss'],
})
export class HomeOptionsComponent implements OnInit, OnDestroy {
  public faAddressBook = faAddressBook;
  public faUserInjured = faUserInjured;
  public faSyringe = faSyringe;
  public faBriefcase = faBriefcase;
  public faFileWaveform = faFileWaveform;
  
  public isVisible = true;
  public isAnimating = false;
  
  private routerSubscription: Subscription = new Subscription();
  
  private hideOnUrls: string[] = [
    '/beneficiary/home/parameters',
    '/beneficiary/home/control-medicaments',
    '/beneficiary/home/services',
  ];

  constructor(private navCtrl: NavController, private router: Router) {}

  ngOnInit() {
    this.checkCurrentUrl(this.router.url);
    
    this.routerSubscription = this.router.events
      .pipe(filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.checkCurrentUrl(event.url);
      });
  }
  
  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }
  

  private checkCurrentUrl(url: string) {
    const shouldHide = this.hideOnUrls.some(hideUrl => url.includes(hideUrl));
    
    if (shouldHide !== !this.isVisible) {
      this.isAnimating = true;
      this.isVisible = !shouldHide;
      
      setTimeout(() => {
        this.isAnimating = false;
      }, 500); 
    }
  }

  selectOption(option: string) {
    this.isVisible = false;
    this.isAnimating = true;
    
    setTimeout(() => {
      if (option === 'parameters') {
        this.navCtrl.navigateForward('/beneficiary/home/parameters');
      } else if (option === 'medicament') {
        this.navCtrl.navigateForward('/beneficiary/home/control-medicaments');
      } else if (option === 'servicehealth') {
        this.navCtrl.navigateForward('/beneficiary/home/services');
      }
    }, 150);
  }
}