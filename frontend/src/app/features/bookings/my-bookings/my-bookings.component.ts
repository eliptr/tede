import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/services/api.service';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-my-bookings',
  standalone: true,
imports: [
  CommonModule,
  RouterLink,
  MatCardModule,
  MatButtonModule,
  MatIconModule,
  MatTableModule,
  MatChipsModule,
  MatProgressSpinnerModule,
  MatDividerModule,
],
  template: `
    <div class="container">
      <h1 class="page-title">Οι Κρατήσεις μου</h1>

      <div *ngIf="loading" class="spinner-center">
        <mat-progress-spinner mode="indeterminate" diameter="48"></mat-progress-spinner>
      </div>

      <div *ngIf="!loading && bookings.length === 0" class="empty-state">
        <mat-icon>confirmation_number</mat-icon>
        <h3>Δεν έχετε πραγματοποιήσει κρατήσεις ακόμη</h3>
        <a mat-raised-button color="primary" routerLink="/events">Εξερευνήστε εκδηλώσεις</a>
      </div>

      <div class="card-grid" *ngIf="!loading && bookings.length > 0">
        <mat-card *ngFor="let b of bookings" class="booking-card">
          <div class="event-img" *ngIf="b.event?.photos?.length > 0">
            <img [src]="'/api/uploads/' + b.event.photos[0].filename" [alt]="b.event.title">
          </div>
          <div class="event-img placeholder" *ngIf="!b.event?.photos?.length">
            <mat-icon>event</mat-icon>
          </div>
          <mat-card-content>
            <div class="booking-status">
              <span class="status-chip {{ b.status }}">{{ b.status }}</span>
            </div>
            <h3>{{ b.event?.title }}</h3>
            <p class="meta"><mat-icon>place</mat-icon> {{ b.event?.city }}, {{ b.event?.country }}</p>
            <p class="meta"><mat-icon>calendar_today</mat-icon> {{ b.event?.start_datetime | date:'dd/MM/yyyy HH:mm' }}</p>
            <mat-divider style="margin: 8px 0"></mat-divider>
            <p class="meta"><mat-icon>confirmation_number</mat-icon> {{ b.ticket_type?.name }}</p>
            <p class="meta"><mat-icon>group</mat-icon> {{ b.number_of_tickets }} εισιτήριο(α)</p>
            <p class="total-cost">{{ b.total_cost | currency:'EUR':'symbol':'1.2-2' }}</p>
            <p class="booking-date">Κράτηση: {{ b.time | date:'dd/MM/yyyy HH:mm' }}</p>
          </mat-card-content>
          <mat-card-actions>
            <a mat-button color="primary" [routerLink]="['/events', b.event_id]">
              <mat-icon>info</mat-icon> Εκδήλωση
            </a>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .spinner-center { display: flex; justify-content: center; padding: 64px; }
    .empty-state { text-align: center; padding: 64px; color: #999; }
    .empty-state mat-icon { font-size: 64px; width: 64px; height: 64px; display: block; margin: 0 auto 16px; }
    .booking-card { overflow: hidden; }
    .event-img { height: 140px; overflow: hidden; border-radius: 12px 12px 0 0; }
    .event-img img { width: 100%; height: 100%; object-fit: cover; }
    .event-img.placeholder { background: linear-gradient(135deg, #303f9f, #5c6bc0);
      display: flex; align-items: center; justify-content: center; }
    .event-img.placeholder mat-icon { font-size: 48px; width: 48px; height: 48px; color: rgba(255,255,255,0.7); }
    .booking-status { margin-bottom: 8px; }
    h3 { font-size: 1rem; font-weight: 500; margin: 4px 0; }
    .meta { display: flex; align-items: center; gap: 4px; color: #666; font-size: 0.85rem; margin: 3px 0; }
    .meta mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .total-cost { color: #303f9f; font-weight: 700; font-size: 1.1rem; margin: 8px 0 4px; }
    .booking-date { color: #999; font-size: 0.8rem; }
  `],
})
export class MyBookingsComponent implements OnInit {
  bookings: any[] = [];
  loading = true;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getMyBookings().subscribe({
      next: (data) => { this.bookings = data; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }
}
