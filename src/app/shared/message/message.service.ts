import { Injectable } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  constructor(private msg: NzMessageService) {}

  showSuccess(message: string): void {
    this.msg.success(message);  // Success message
  }

  showError(message: string): void {
    this.msg.error(message);  // Error message
  }

  showInfo(message: string): void {
    this.msg.info(message);  // Info message
  }

  showWarning(message: string): void {
    this.msg.warning(message);  // Warning message
  }
}
