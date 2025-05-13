import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-chat-floating',
  templateUrl: './chat-floating.component.html',
  styleUrls: ['./chat-floating.component.scss']
})
export class ChatFloatingComponent {

  @Input() onlineUsers: number = 0;
  @Input() isVisible: boolean = true;

  get message(): string {
    if (this.onlineUsers === 0) {
      return 'No hay usuarios en línea';
    } else if (this.onlineUsers === 1) {
      return 'Hay (1) un usuario en espera';
    } else {
      return `Hay (${this.onlineUsers}) usuarios en espera`;
    }
  }


  openChat() {
    alert('Iniciando chat...');
  }
}
