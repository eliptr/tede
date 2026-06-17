import { Injectable } from '@angular/core';
import { ApiService } from '../../core/services/api.service';

@Injectable({ providedIn: 'root' })
export class MessagesService {
  constructor(private api: ApiService) {}
  sendMessage(body: any) { return this.api.sendMessage(body); }
}
