import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatTabsModule,
    MatListModule, MatFormFieldModule, MatInputModule, MatSnackBarModule,
    MatDividerModule, MatProgressSpinnerModule, MatBadgeModule,
  ],
  template: `
    <div class="container">
      <h1 class="page-title">Μηνύματα</h1>

      <mat-tab-group>
        <!-- Inbox -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>inbox</mat-icon>&nbsp; Εισερχόμενα
            <span class="unread-badge" *ngIf="unread > 0">{{ unread }}</span>
          </ng-template>
          <div class="tab-content">
            <div *ngIf="loadingInbox" class="spinner-center">
              <mat-progress-spinner mode="indeterminate" diameter="36"></mat-progress-spinner>
            </div>
            <div *ngIf="!loadingInbox && inbox.length === 0" class="empty-state">
              <mat-icon>mail_outline</mat-icon>
              <p>Δεν υπάρχουν εισερχόμενα μηνύματα</p>
            </div>
            <mat-list *ngIf="!loadingInbox">
              <mat-list-item *ngFor="let msg of inbox"
                             class="msg-item" [class.unread]="!msg.is_read"
                             (click)="openMsg(msg, 'inbox')">
                <mat-icon matListItemIcon>{{ msg.is_read ? 'drafts' : 'mail' }}</mat-icon>
                <div matListItemTitle>
                  <strong>{{ msg.sender?.first_name }} {{ msg.sender?.last_name }}</strong>
                  <span class="msg-date">{{ msg.sent_at | date:'dd/MM/yy HH:mm' }}</span>
                </div>
                <div matListItemLine class="msg-preview">{{ msg.content | slice:0:80 }}{{ msg.content?.length > 80 ? '...' : '' }}</div>
                <div matListItemMeta>
                  <button mat-icon-button (click)="deleteMsg(msg, 'inbox', $event)" matTooltip="Διαγραφή">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </mat-list-item>
            </mat-list>
          </div>
        </mat-tab>

        <!-- Sent -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>send</mat-icon>&nbsp; Απεσταλμένα
          </ng-template>
          <div class="tab-content">
            <div *ngIf="loadingSent" class="spinner-center">
              <mat-progress-spinner mode="indeterminate" diameter="36"></mat-progress-spinner>
            </div>
            <div *ngIf="!loadingSent && sent.length === 0" class="empty-state">
              <mat-icon>send</mat-icon>
              <p>Δεν υπάρχουν απεσταλμένα μηνύματα</p>
            </div>
            <mat-list *ngIf="!loadingSent">
              <mat-list-item *ngFor="let msg of sent" class="msg-item" (click)="openMsg(msg, 'sent')">
                <mat-icon matListItemIcon>send</mat-icon>
                <div matListItemTitle>
                  <strong>Προς: {{ msg.receiver?.first_name }} {{ msg.receiver?.last_name }}</strong>
                  <span class="msg-date">{{ msg.sent_at | date:'dd/MM/yy HH:mm' }}</span>
                </div>
                <div matListItemLine class="msg-preview">{{ msg.content | slice:0:80 }}{{ msg.content?.length > 80 ? '...' : '' }}</div>
                <div matListItemMeta>
                  <button mat-icon-button (click)="deleteMsg(msg, 'sent', $event)" matTooltip="Διαγραφή">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </mat-list-item>
            </mat-list>
          </div>
        </mat-tab>

        <!-- Compose -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>create</mat-icon>&nbsp; Σύνταξη
          </ng-template>
          <div class="tab-content compose-form">
            <form [formGroup]="composeForm" (ngSubmit)="send()">
              <mat-form-field class="full-width">
                <mat-label>ID Παραλήπτη</mat-label>
                <input matInput type="number" formControlName="receiver_id">
                <mat-hint>Εισάγετε το ID χρήστη παραλήπτη</mat-hint>
              </mat-form-field>
              <mat-form-field class="full-width">
                <mat-label>Μήνυμα *</mat-label>
                <textarea matInput formControlName="content" rows="5"></textarea>
              </mat-form-field>
              <button mat-raised-button color="primary" type="submit" [disabled]="composeForm.invalid">
                <mat-icon>send</mat-icon> Αποστολή
              </button>
            </form>
          </div>
        </mat-tab>
      </mat-tab-group>

      <!-- Message detail overlay -->
      <mat-card class="msg-detail" *ngIf="selectedMsg">
        <mat-card-header>
          <mat-card-title>
            <span *ngIf="selectedFolder === 'inbox'">
              Από: {{ selectedMsg.sender?.first_name }} {{ selectedMsg.sender?.last_name }}
            </span>
            <span *ngIf="selectedFolder === 'sent'">
              Προς: {{ selectedMsg.receiver?.first_name }} {{ selectedMsg.receiver?.last_name }}
            </span>
          </mat-card-title>
          <mat-card-subtitle>{{ selectedMsg.sent_at | date:'dd/MM/yyyy HH:mm' }}</mat-card-subtitle>
          <button mat-icon-button (click)="selectedMsg = null" style="margin-left:auto">
            <mat-icon>close</mat-icon>
          </button>
        </mat-card-header>
        <mat-card-content>
          <p style="white-space: pre-wrap; line-height: 1.7">{{ selectedMsg.content }}</p>
        </mat-card-content>
        <mat-card-actions *ngIf="selectedFolder === 'inbox'">
          <button mat-button color="primary" (click)="replyTo(selectedMsg)">
            <mat-icon>reply</mat-icon> Απάντηση
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .tab-content { padding: 16px 0; }
    .compose-form { max-width: 600px; }
    .msg-item { cursor: pointer; border-bottom: 1px solid #f0f0f0; }
    .msg-item:hover { background: #f5f5f5; }
    .msg-item.unread { background: #e8eaf6; }
    .msg-date { font-size: 0.8rem; color: #999; margin-left: 8px; }
    .msg-preview { color: #666; font-size: 0.85rem; }
    .empty-state { text-align: center; padding: 48px; color: #999; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; display: block; margin: 0 auto 12px; }
    .spinner-center { display: flex; justify-content: center; padding: 32px; }
    .msg-detail { margin-top: 24px; }
    mat-card-header { display: flex; align-items: center; }
  `],
})
export class MessagesComponent implements OnInit {
  inbox: any[] = [];
  sent: any[] = [];
  loadingInbox = true;
  loadingSent = true;
  unread = 0;
  selectedMsg: any = null;
  selectedFolder: 'inbox' | 'sent' = 'inbox';

  composeForm = this.fb.group({
    receiver_id: [null, Validators.required],
    content: ['', Validators.required],
  });

  constructor(private api: ApiService, public auth: AuthService, private fb: FormBuilder, private snack: MatSnackBar) {}

  ngOnInit() { this.loadAll(); }

  loadAll() {
    this.api.getInbox().subscribe((data) => {
      this.inbox = data; this.loadingInbox = false;
      this.unread = data.filter((m) => !m.is_read).length;
    });
    this.api.getSent().subscribe((data) => { this.sent = data; this.loadingSent = false; });
  }

  openMsg(msg: any, folder: 'inbox' | 'sent') {
    this.selectedMsg = msg;
    this.selectedFolder = folder;
    if (folder === 'inbox' && !msg.is_read) {
      this.api.markRead(msg.id).subscribe(() => { msg.is_read = true; this.unread = Math.max(0, this.unread - 1); });
    }
  }

  deleteMsg(msg: any, folder: 'inbox' | 'sent', e: Event) {
    e.stopPropagation();
    const req = folder === 'inbox' ? this.api.deleteInboxMessage(msg.id) : this.api.deleteSentMessage(msg.id);
    req.subscribe(() => {
      if (folder === 'inbox') this.inbox = this.inbox.filter((m) => m.id !== msg.id);
      else this.sent = this.sent.filter((m) => m.id !== msg.id);
      if (this.selectedMsg?.id === msg.id) this.selectedMsg = null;
      this.snack.open('Διαγράφηκε', 'OK', { duration: 2000 });
    });
  }

  send() {
    if (this.composeForm.invalid) return;
    this.api.sendMessage(this.composeForm.value).subscribe({
      next: () => {
        this.composeForm.reset();
        this.snack.open('Στάλθηκε!', 'OK', { duration: 3000, panelClass: 'snack-success' });
        this.api.getSent().subscribe((d) => this.sent = d);
      },
      error: (err) => this.snack.open(err.error?.message || 'Σφάλμα', 'OK', { duration: 4000, panelClass: 'snack-error' }),
    });
  }

  replyTo(msg: any) {
    this.composeForm.patchValue({ receiver_id: msg.sender?.id });
    this.selectedMsg = null;
  }
}
