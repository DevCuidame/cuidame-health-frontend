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
    | 'appointmentType'
    // | 'professional'
    // | 'date'
    // | 'time'
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
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  
  // Variables de control para evitar bucles
  private reconnectionAttempts = 0;
  private maxReconnectionAttempts = 3; // Reducido
  private reconnectionTimer?: any;
  private isConnecting = false;
  private sessionInitialized = false;

  session$ = this.sessionSubject.asObservable();
  messages$ = this.messagesSubject.asObservable();
  isTyping$ = this.isTypingSubject.asObservable();
  connectionStatus$ = this.connectionStatusSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadSessionFromStorage();
  }

  private loadSessionFromStorage(): void {
    if (this.sessionInitialized) return;

    const sessionId = localStorage.getItem('chatSessionId');
    if (sessionId) {
      console.log('📱 Loading existing session:', sessionId);
      
      this.getSession(sessionId).subscribe(
        (response: any) => {
          const session: ChatSession = {
            id: response.data?.sessionId || sessionId,
            status: response.data?.status || 'active',
            messages: response.data?.messages || [],
          };

          this.sessionSubject.next(session);
          this.messagesSubject.next(session.messages);
          this.sessionInitialized = true;
          
          // Solo conectar WebSocket si no está ya conectando
          if (!this.isConnecting && !this.connectionStatusSubject.value) {
            this.connectWebSocket(sessionId);
          }
        },
        (error) => {
          console.error('Error loading session:', error);
          localStorage.removeItem('chatSessionId');
          this.sessionInitialized = true;
        }
      );
    } else {
      this.sessionInitialized = true;
    }
  }

  createSession(): Observable<string> {
    return new Observable((observer) => {
      this.http
        .post<{ data: { sessionId: string } }>(
          `${this.apiUrl}api/chat/session`,
          {}
        )
        .subscribe(
          (response: any) => {
            const sessionId = response.data?.sessionId;
            if (sessionId) {
              localStorage.setItem('chatSessionId', sessionId);
              
              // Crear sesión local
              const session: ChatSession = {
                id: sessionId,
                status: 'active',
                messages: response.data?.messages || []
              };
              
              this.sessionSubject.next(session);
              this.messagesSubject.next(session.messages);
              this.sessionInitialized = true;
              
              // Conectar WebSocket solo si no está conectando
              if (!this.isConnecting) {
                this.connectWebSocket(sessionId);
              }
              
              observer.next(sessionId);
              observer.complete();
            } else {
              observer.error(new Error('No session ID received'));
            }
          },
          (error) => {
            console.error('Error creating session:', error);
            observer.error(error);
          }
        );
    });
  }

  getSession(sessionId: string): Observable<ChatSession> {
    return this.http
      .get<{ data: any }>(`${this.apiUrl}api/chat/session/${sessionId}`)
      .pipe(
        map((response) => {
          if (response.data) {
            return {
              id: response.data.sessionId,
              status: 'active',
              messages: response.data.messages || [],
            };
          }
          throw new Error('Invalid session data');
        })
      );
  }

  sendMessage(content: string): void {
    const sessionId = this.sessionSubject.value?.id;
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

    // Add message to local state immediately
    const currentMessages = this.messagesSubject.value;
    this.messagesSubject.next([...currentMessages, message]);

    // Show typing indicator
    this.isTypingSubject.next(true);

    // Send via WebSocket if connected, otherwise fallback to HTTP
    if (this.socket$ && !this.socket$.closed && this.connectionStatusSubject.value) {
      const wsMessage = {
        type: 'message',
        sessionId,
        message: content,
      };

      console.log('📤 Sending to WebSocket:', wsMessage);

      try {
        this.socket$.next(wsMessage);
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        this.fallbackToHttp(sessionId, content);
      }
    } else {
      console.log('🔄 Fallback to HTTP - WebSocket not connected');
      this.fallbackToHttp(sessionId, content);
    }
  }

  private fallbackToHttp(sessionId: string, content: string): void {
    const httpPayload = {
      sessionId,
      content,
    };

    console.log('📤 Sending via HTTP:', httpPayload);

    this.http
      .post<{ success: boolean }>(`${this.apiUrl}api/chat/message`, httpPayload)
      .subscribe(
        () => {
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

  connectWebSocket(sessionId: string): void {
    // Prevenir múltiples conexiones simultáneas
    if (this.isConnecting) {
      console.log('🔄 WebSocket connection already in progress');
      return;
    }

    this.isConnecting = true;

    // Clear any existing reconnection timer
    if (this.reconnectionTimer) {
      clearTimeout(this.reconnectionTimer);
      this.reconnectionTimer = undefined;
    }

    // Close existing connection
    if (this.socket$ && !this.socket$.closed) {
      this.socket$.complete();
    }

    console.log('🔗 Attempting WebSocket connection to:', this.wsUrl);

    this.socket$ = webSocket({
      url: this.wsUrl,
      openObserver: {
        next: () => {
          console.log('✅ WebSocket connection established');
          this.connectionStatusSubject.next(true);
          this.reconnectionAttempts = 0;
          this.isConnecting = false;

          // Initialize session
          this.socket$.next({
            type: 'init',
            sessionId,
          });
        },
      },
      closeObserver: {
        next: (event) => {
          console.log('❌ WebSocket connection closed:', event);
          this.connectionStatusSubject.next(false);
          this.isConnecting = false;
          
          // Solo intentar reconexión si fue una desconexión inesperada
          if (event.code !== 1000 && event.code !== 1001) {
            this.handleDisconnection(sessionId);
          }
        },
      },
    });

    this.socket$.subscribe(
      (message) => this.handleSocketMessage(message),
      (error) => {
        console.error('WebSocket error:', error);
        this.connectionStatusSubject.next(false);
        this.isConnecting = false;
        this.handleSocketError(error, sessionId);
      },
      () => {
        console.log('WebSocket connection completed');
        this.connectionStatusSubject.next(false);
        this.isConnecting = false;
      }
    );
  }

  private handleSocketMessage(message: any): void {
    console.log('📥 WebSocket message received:', message);

    switch (message.type) {
      case 'connection':
        console.log('Connection confirmed:', message.message);
        break;

      case 'init':
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
        if (message.messages) {
          const currentMessages = this.messagesSubject.value;
          const newMessages = Array.isArray(message.messages)
            ? message.messages
            : [message.messages];
          this.messagesSubject.next([...currentMessages, ...newMessages]);
        }
        this.isTypingSubject.next(false);

        if (message.session) {
          this.sessionSubject.next(message.session);
        }
        break;

      case 'error':
        console.error('WebSocket error message:', message.message);
        this.isTypingSubject.next(false);
        break;

      case 'pong':
        // Handle ping/pong for connection health
        break;

      default:
        console.warn('Unknown WebSocket message type:', message.type);
    }
  }

  private handleSocketError(error: any, sessionId: string): void {
    console.error('WebSocket error:', error);
    this.connectionStatusSubject.next(false);
    this.isTypingSubject.next(false);
    this.isConnecting = false;
    this.handleDisconnection(sessionId);
  }

  private handleDisconnection(sessionId: string): void {
    // Evitar reconexiones infinitas
    if (this.reconnectionAttempts >= this.maxReconnectionAttempts) {
      console.error('❌ Maximum reconnection attempts reached');
      this.connectionStatusSubject.next(false);
      return;
    }

    // No intentar reconectar si ya está reconectando
    if (this.isConnecting) {
      return;
    }

    this.reconnectionAttempts++;
    const delay = Math.min(Math.pow(2, this.reconnectionAttempts) * 1000, 10000); // Max 10 segundos

    console.log(
      `🔄 Attempting to reconnect (${this.reconnectionAttempts}/${this.maxReconnectionAttempts}) in ${delay}ms...`
    );

    this.reconnectionTimer = setTimeout(() => {
      if (!this.isConnecting && !this.connectionStatusSubject.value) {
        this.connectWebSocket(sessionId);
      }
    }, delay);
  }

  resetSession(): void {
    // Limpiar flags de control
    this.sessionInitialized = false;
    this.isConnecting = false;
    this.reconnectionAttempts = 0;
    
    // Limpiar storage y conexiones
    localStorage.removeItem('chatSessionId');
    
    if (this.socket$ && !this.socket$.closed) {
      this.socket$.complete();
    }
    
    if (this.reconnectionTimer) {
      clearTimeout(this.reconnectionTimer);
      this.reconnectionTimer = undefined;
    }
    
    // Reset subjects
    this.sessionSubject.next(null);
    this.messagesSubject.next([]);
    this.connectionStatusSubject.next(false);
  }

  testConnection(): void {
    if (this.socket$ && !this.socket$.closed && this.connectionStatusSubject.value) {
      this.socket$.next({ type: 'ping' });
    }
  }
}