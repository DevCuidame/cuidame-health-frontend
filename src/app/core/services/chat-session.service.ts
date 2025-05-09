import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, map, Observable, Subject } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { environment } from 'src/environments/environment';

export interface ChatMessage {
  id?: string;
  sessionId: string;
  sender: 'user' | 'bot';
  content: string;
  timestamp: Date;
  type?: 'text' | 'options' | 'validation' | 'confirmation';
  options?: Array<{
    id: string;
    text: string;
    value: string;
  }>;
}

export interface ChatSession {
  id: string;
  status: 'active' | 'completed' | 'expired';
  messages: ChatMessage[];
  step?:
    | 'document'
    | 'city'
    | 'specialty'
    | 'professional'
    | 'date'
    | 'time'
    | 'confirmation';
}

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private apiUrl = environment.url;
  private wsUrl = environment.wsUrl;

  private socket$!: WebSocketSubject<any>;
  private sessionSubject = new BehaviorSubject<ChatSession | null>(null);
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  private isTypingSubject = new BehaviorSubject<boolean>(false);
  private reconnectionAttempts = 0;
  private maxReconnectionAttempts = 5;

  session$ = this.sessionSubject.asObservable();
  messages$ = this.messagesSubject.asObservable();
  isTyping$ = this.isTypingSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadSessionFromStorage();
  }

  private loadSessionFromStorage(): void {
    const sessionId = localStorage.getItem('chatSessionId');
    console.log("🚀 ~ ChatService ~ loadSessionFromStorage ~ sessionId:", sessionId)
    if (sessionId) {
      this.getSession(sessionId).subscribe(
        (response: any) => {
          // Ajustar la estructura para manejar la respuesta correctamente
          const session: ChatSession = {
            id: response.data?.sessionId || sessionId,
            status: response.data?.status || 'active',
            messages: response.data?.messages || []
          };
          
          this.sessionSubject.next(session);
          this.messagesSubject.next(session.messages);
          this.connectWebSocket(sessionId);
        },
        error => {
          console.error('Error loading session:', error);
          localStorage.removeItem('chatSessionId');
          // No crear sesión automáticamente aquí
        }
      );
    }
  }

  createSession(): Observable<string> {
    return new Observable(observer => {
      this.http.post<{data: {sessionId: string}}>(`${this.apiUrl}api/chat/session`, {}).subscribe(
        (response: any) => {
          const sessionId = response.data?.sessionId;
          if (sessionId) {
            localStorage.setItem('chatSessionId', sessionId);
            this.connectWebSocket(sessionId);
            observer.next(sessionId);
            observer.complete();
          } else {
            observer.error(new Error('No session ID received'));
          }
        },
        error => {
          console.error('Error creating session:', error);
          observer.error(error);
        }
      );
    });
  }

  getSession(sessionId: string): Observable<ChatSession> {
    return this.http.get<{data: any}>(`${this.apiUrl}/api/chat/session/${sessionId}`).pipe(
      map(response => {
        if (response.data) {
          return {
            id: response.data.sessionId,
            status: 'active',
            messages: response.data.messages || []
          };
        }
        throw new Error('Invalid session data');
      })
    );
  }

  sendMessage(content: string): void {
    console.log("🚀 ~ ChatService ~ sendMessage ~ content:", content)
    const sessionId = this.sessionSubject.value?.id;
    console.log('🚀 ~ ChatService ~ sendMessage ~ sessionId:', sessionId);
    if (!sessionId) {
      console.error('No active session');
      return;
    }

    const message: ChatMessage = {
      sessionId,
      sender: 'user',
      content,
      timestamp: new Date(),
    };

    // Add message to local state
    const currentMessages = this.messagesSubject.value;
    this.messagesSubject.next([...currentMessages, message]);

    // Show typing indicator
    this.isTypingSubject.next(true);

    // Send via WebSocket if connected
    if (this.socket$ && !this.socket$.closed) {
      const wsMessage = {
        type: 'message',
        sessionId,
        message: content,
      };
      
      // Agregar este console.log para mostrar lo que se envía al WebSocket
      console.log('📤 Enviando al WebSocket:', wsMessage);
      
      this.socket$.next(wsMessage);
    } else {
      console.log('🔄 Fallback a HTTP - WebSocket no conectado');
      
      // Fallback to HTTP if WebSocket is not connected
      const httpPayload = {
        sessionId,
        content,
      };
      
      // También puedes mostrar lo que se envía via HTTP
      console.log('📤 Enviando via HTTP:', httpPayload);
      
      this.http
        .post<{ success: boolean }>(`${this.apiUrl}api/chat/message`, httpPayload)
        .subscribe(
          () => {
            // HTTP fallback doesn't provide real-time responses,
            // so we'll need to fetch the updated session after sending
            this.getSession(sessionId).subscribe((session) => {
              this.sessionSubject.next(session);
              this.messagesSubject.next(session.messages);
              this.isTypingSubject.next(false);
            });
          },
          (error) => {
            console.error('Error sending message:', error);
            this.isTypingSubject.next(false);
          }
        );
    }
  }

  connectWebSocket(sessionId: string): void {
    if (this.socket$ && !this.socket$.closed) {
      this.socket$.complete();
    }
    
    this.socket$ = webSocket({
      url: `${this.wsUrl}`,  // Solo la URL base
      openObserver: {
        next: () => {
          console.log('WebSocket connection established');
          this.reconnectionAttempts = 0;
          
          // Initialize session
          this.socket$.next({
            type: 'init',
            sessionId
          });
        }
      },
      closeObserver: {
        next: () => {
          console.log('WebSocket connection closed');
          this.handleDisconnection(sessionId);
        }
      }
    });
    
    this.socket$.subscribe(
      (message) => this.handleSocketMessage(message),
      (error) => this.handleSocketError(error, sessionId),
      () => console.log('WebSocket connection completed')
    );
  }

  private handleSocketMessage(message: any): void {
    console.log('🚀 ~ ChatService ~ handleSocketMessage ~ message:', message);
    switch (message.type) {
      case 'connection':
        console.log('Connection confirmed:', message.message);
        break;

      case 'init':
        // Ajustar la estructura esperada del mensaje
        if (message.sessionId && message.messages) {
          const session: ChatSession = {
            id: message.sessionId,
            status: 'active',
            messages: message.messages || [],
          };
          this.sessionSubject.next(session);
          this.messagesSubject.next(message.messages || []);
        }
        break;

      case 'message':
        // Verificar la estructura del mensaje antes de usarlo
        if (message.messages) {
          const currentMessages = this.messagesSubject.value;
          const newMessages = Array.isArray(message.messages)
            ? message.messages
            : [message.messages];
          this.messagesSubject.next([...currentMessages, ...newMessages]);
        }
        this.isTypingSubject.next(false);

        // Update session if provided
        if (message.session) {
          this.sessionSubject.next(message.session);
        }
        break;

      case 'error':
        console.error('WebSocket error:', message.message);
        this.isTypingSubject.next(false);
        break;

      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  private handleSocketError(error: any, sessionId: string): void {
    console.error('WebSocket error:', error);
    this.isTypingSubject.next(false);
    this.handleDisconnection(sessionId);
  }

  private handleDisconnection(sessionId: string): void {
    if (this.reconnectionAttempts < this.maxReconnectionAttempts) {
      this.reconnectionAttempts++;
      console.log(
        `Attempting to reconnect (${this.reconnectionAttempts}/${this.maxReconnectionAttempts})...`
      );

      // Exponential backoff for reconnection
      setTimeout(() => {
        this.connectWebSocket(sessionId);
      }, Math.pow(2, this.reconnectionAttempts) * 1000);
    } else {
      console.error('Maximum reconnection attempts reached');
    }
  }

  resetSession(): void {
    localStorage.removeItem('chatSessionId');
    if (this.socket$ && !this.socket$.closed) {
      this.socket$.complete();
    }
    this.sessionSubject.next(null);
    this.messagesSubject.next([]);
  }
}
