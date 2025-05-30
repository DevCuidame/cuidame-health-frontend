import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked, OnDestroy, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Observable, Subscription } from 'rxjs';
import { tap, take } from 'rxjs/operators';
import { ChatMessage, ChatService, ChatSession } from 'src/app/core/services/chat-session.service';
import { TabBarComponent } from 'src/app/shared/components/tab-bar/tab-bar.component';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule, TabBarComponent],
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, AfterViewChecked, OnDestroy {
  @ViewChild('chatContainer') chatContainer!: ElementRef;
  
  chatForm: FormGroup;
  messages$!: Observable<ChatMessage[]>;
  session$!: Observable<ChatSession | null>;
  isTyping$!: Observable<boolean>;
  
  private subscriptions: Subscription[] = [];
  private sessionInitialized = false;
  
  // Responsive properties
  isDesktop = false;
  isMobile = false;
  screenWidth = 0;

  constructor(
    private chatService: ChatService,
    private fb: FormBuilder
  ) {
    this.chatForm = this.fb.group({
      message: ['', Validators.required]
    });
    this.checkScreenSize();
  }
  
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }
  
  private checkScreenSize(): void {
    this.screenWidth = window.innerWidth;
    this.isDesktop = this.screenWidth >= 768;
    this.isMobile = this.screenWidth < 768;
  }
  
  ngOnInit(): void {
    this.messages$ = this.chatService.messages$.pipe(
      tap(() => {
        setTimeout(() => this.scrollToBottom(), 0);
      })
    );
    
    this.session$ = this.chatService.session$;
    this.isTyping$ = this.chatService.isTyping$;
    
    // Suscribirse a la sesión SOLO UNA VEZ
    const sessionSub = this.session$.pipe(take(1)).subscribe(session => {
      if (!session && !this.sessionInitialized) {
        this.sessionInitialized = true;
        this.initializeChat();
      } else if (session) {
        this.sessionInitialized = true;
        console.log('Session already exists:', session.id);
      }
    });
    
    this.subscriptions.push(sessionSub);
  }
  
  ngOnDestroy(): void {
    // Limpiar suscripciones para evitar memory leaks
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }
  
  scrollToBottom(): void {
    if (this.chatContainer) {
      const element = this.chatContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }
  
  initializeChat(): void {
    if (this.sessionInitialized) return;
    
    console.log('🚀 Initializing new chat session...');
    
    const createSub = this.chatService.createSession().subscribe(
      sessionId => {
        console.log('✅ Chat session created:', sessionId);
        this.sessionInitialized = true;
      },
      error => {
        console.error('❌ Error creating chat session:', error);
        this.sessionInitialized = false; // Permitir retry en caso de error
      }
    );
    
    this.subscriptions.push(createSub);
  }
  
  sendMessage(): void {
    if (this.chatForm.valid) {
      const message = this.chatForm.get('message')?.value ?? '';
      if (message.trim()) {
        this.chatService.sendMessage(message.trim());
        this.chatForm.reset({ message: '' });
      }
    }
  }
  
  selectOption(option: any): void {
    if (option?.value) {
      this.chatService.sendMessage(option.value);
    }
  }
  
  getMessageClasses(message: ChatMessage): any {
    return {
      'user-message': message.sender === 'user',
      'bot-message': message.sender === 'bot',
      'options-message': message.type === 'options',
      'validation-message': message.type === 'validation',
      'confirmation-message': message.type === 'confirmation',
      'is-desktop': this.isDesktop,
      'is-mobile': this.isMobile
    };
  }
  
  getContainerClasses(): any {
    return {
      'desktop-layout': this.isDesktop,
      'mobile-layout': this.isMobile,
      'tablet-layout': this.screenWidth >= 481 && this.screenWidth < 768
    };
  }
  
  trackByFn(index: number, item: ChatMessage): string {
    return item.id || `${item.sender}-${item.timestamp}-${index}`;
  }

  // Método para reiniciar el chat manualmente si es necesario
  resetChat(): void {
    this.sessionInitialized = false;
    this.chatService.resetSession();
    this.initializeChat();
  }
}