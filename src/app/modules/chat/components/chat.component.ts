import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ChatMessage, ChatService, ChatSession } from 'src/app/core/services/chat-session.service';
import { TabBarComponent } from 'src/app/shared/components/tab-bar/tab-bar.component';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule, TabBarComponent],
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, AfterViewChecked {
  @ViewChild('chatContainer') chatContainer!: ElementRef;
  
  chatForm: FormGroup;
  messages$!: Observable<ChatMessage[]>;
  session$!: Observable<ChatSession | null>;
  isTyping$!: Observable<boolean>;
  
  constructor(
    private chatService: ChatService,
    private fb: FormBuilder
  ) {
    this.chatForm = this.fb.group({
      message: ['', Validators.required]
    });
  }
  
  ngOnInit(): void {
    this.messages$ = this.chatService.messages$.pipe(
      tap(() => {
        setTimeout(() => this.scrollToBottom(), 0);
      })
    );
    
    this.session$ = this.chatService.session$;
    this.isTyping$ = this.chatService.isTyping$;
    
    // Esperar un momento para que el servicio intente cargar la sesión
    setTimeout(() => {
      this.session$.subscribe(session => {
        if (!session) {
          this.initializeChat();
        }
      });
    }, 100);
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
    this.chatService.createSession().subscribe(
      sessionId => {
        console.log('Chat session created:', sessionId);
      },
      error => {
        console.error('Error creating chat session:', error);
      }
    );
  }
  
  sendMessage(): void {
    if (this.chatForm.valid) {
      const message = this.chatForm.get('message')?.value ?? '';
      this.chatService.sendMessage(message);
      this.chatForm.reset({ message: '' });
    }
  }
  
  selectOption(option: any): void {
    this.chatService.sendMessage(option.value);
  }
  

  
  getMessageClasses(message: ChatMessage): any {
    return {
      'user-message': message.sender === 'user',
      'bot-message': message.sender === 'bot',
      'options-message': message.type === 'options',
      'validation-message': message.type === 'validation',
      'confirmation-message': message.type === 'confirmation'
    };
  }
  
  trackByFn(index: number, item: ChatMessage): string {
    return item.id || String(index);
  }
}