import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    MatCardModule, MatButtonModule, MatIconModule, MatChipsModule,
    MatProgressSpinnerModule, MatPaginatorModule,
  ],
  template: `
    <div class="container">
      <div class="welcome-header">
        <h1>Γεια σου, {{ auth.currentUser()?.first_name }}! 👋</h1>
        <p>Ανακαλύψτε νέες εκδηλώσεις ή διαχειριστείτε τις δικές σας.</p>
      </div>

      <!-- Quick actions -->
      <div class="quick-actions">
        <a mat-raised-button color="primary" routerLink="/events">
          <mat-icon>search</mat-icon> Αναζήτηση Εκδηλώσεων
        </a>
        <ng-container *ngIf="auth.hasRole('ORGANIZER','ADMIN')">
          <a mat-raised-button color="accent" routerLink="/events/new">
            <mat-icon>add</mat-icon> Νέα Εκδήλωση
          </a>
          <a mat-stroked-button routerLink="/my-events">
            <mat-icon>event_note</mat-icon> Οι Εκδηλώσεις μου
          </a>
        </ng-container>
        <a mat-stroked-button routerLink="/bookings">
          <mat-icon>confirmation_number</mat-icon> Οι Κρατήσεις μου
        </a>
        <a mat-stroked-button routerLink="/messages">
          <mat-icon>mail</mat-icon> Μηνύματα
        </a>
      </div>

      <!-- Recommendations -->
      <section class="recommendations">
        <h2><mat-icon>recommend</mat-icon> Προτεινόμενες Εκδηλώσεις</h2>
        <p class="section-sub">Βασισμένες στο ιστορικό και τα ενδιαφέροντά σας</p>

        <div *ngIf="loadingRec" class="spinner-center">
          <mat-spinner diameter="40"></mat-spinner>
        </div>

        <div *ngIf="!loadingRec && recommendations.length === 0" class="empty-state">
          <mat-icon>event_busy</mat-icon>
          <p>Δεν υπάρχουν διαθέσιμες συστάσεις ακόμη. Εξερευνήστε εκδηλώσεις για να ξεκινήσει ο αλγόριθμος!</p>
        </div>

        <div class="card-grid" *ngIf="!loadingRec && recommendations.length > 0">
          <mat-card class="event-card" *ngFor="let event of recommendations" [routerLink]="['/events', event.id]">
            <div class="event-img" *ngIf="event.photos?.length > 0">
              <img [src]="'/api/uploads/' + event.photos[0].filename" [alt]="event.title">
            </div>
            <div class="event-img placeholder" *ngIf="!event.photos?.length">
              <mat-icon>event</mat-icon>
            </div>
            <mat-card-content>
              <div class="categories">
                <mat-chip *ngFor="let cat of event.categories?.slice(0,2)">{{ cat.category }}</mat-chip>
              </div>
              <h3>{{ event.title }}</h3>
              <p class="meta">
                <mat-icon>place</mat-icon> {{ event.city }}, {{ event.country }}
              </p>
              <p class="meta">
                <mat-icon>calendar_today</mat-icon> {{ event.start_datetime | date:'dd/MM/yyyy HH:mm' }}
              </p>
              <p class="price" *ngIf="event.ticket_types?.length">
                Από {{ getMinPrice(event.ticket_types) | currency:'EUR':'symbol':'1.2-2' }}
              </p>
            </mat-card-content>
          </mat-card>
        </div>

        <mat-paginator
          *ngIf="!loadingRec && recommendations.length > 0"
          [length]="recommendationsTotal"
          [pageIndex]="recommendationPageIndex"
          [pageSize]="recommendationPageSize"
          [pageSizeOptions]="[3, 6, 12, 24]"
          showFirstLastButtons
          (page)="onRecommendationsPage($event)">
        </mat-paginator>
      </section>
    </div>
  `,
  styles: [`
    .welcome-header { margin-bottom: 24px; }
    .welcome-header h1 { font-size: 1.8rem; color: #303f9f; margin-bottom: 4px; }
    .quick-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 40px; }
    .recommendations h2 { display: flex; align-items: center; gap: 8px; color: #303f9f; font-size: 1.4rem; }
    .section-sub { color: #666; margin-top: -8px; margin-bottom: 20px; }
    .spinner-center { display: flex; justify-content: center; padding: 32px; }
    .empty-state { text-align: center; padding: 32px; color: #999; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .event-card { cursor: pointer; transition: box-shadow 0.2s; }
    .event-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
    .event-img { height: 160px; overflow: hidden; border-radius: 12px 12px 0 0; }
    .event-img img { width: 100%; height: 100%; object-fit: cover; }
    .event-img.placeholder { background: linear-gradient(135deg, #303f9f, #5c6bc0);
      display: flex; align-items: center; justify-content: center; }
    .event-img.placeholder mat-icon { font-size: 48px; width: 48px; height: 48px; color: rgba(255,255,255,0.7); }
    .categories { display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 8px; }
    h3 { font-size: 1rem; margin: 8px 0; font-weight: 500; }
    .meta { display: flex; align-items: center; gap: 4px; color: #666; font-size: 0.85rem; margin: 4px 0; }
    .meta mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .price { color: #303f9f; font-weight: 600; font-size: 1rem; margin-top: 8px; }
    mat-paginator { margin-top: 20px; background: transparent; }
  `],
})
export class HomeComponent implements OnInit {
  recommendations: any[] = [];
  private allRecommendations: any[] = [];
  recommendationsTotal = 0;
  recommendationPageIndex = 0;
  recommendationPageSize = 6;
  loadingRec = true;

  constructor(public auth: AuthService, private api: ApiService) {}

  ngOnInit() {
    this.loadRecommendations();
  }

  loadRecommendations() {
    this.loadingRec = true;
    this.api.getRecommendations(this.recommendationPageIndex + 1, this.recommendationPageSize).subscribe({
      next: (data) => {
        if (Array.isArray(data)) {
          this.allRecommendations = data;
          this.recommendationsTotal = data.length;
          this.recommendations = this.sliceRecommendations(data);
        } else {
          this.allRecommendations = [];
          this.recommendations = data.events || [];
          this.recommendationsTotal = data.total || this.recommendations.length;
        }

        this.loadingRec = false;
      },
      error: () => { this.loadingRec = false; },
    });
  }

  onRecommendationsPage(event: PageEvent) {
    this.recommendationPageIndex = event.pageIndex;
    this.recommendationPageSize = event.pageSize;

    if (this.allRecommendations.length > 0) {
      this.recommendations = this.sliceRecommendations(this.allRecommendations);
      return;
    }

    this.loadRecommendations();
  }

  private sliceRecommendations(events: any[]) {
    const start = this.recommendationPageIndex * this.recommendationPageSize;
    return events.slice(start, start + this.recommendationPageSize);
  }

  getMinPrice(ticketTypes: any[]): number {
    return Math.min(...ticketTypes.map((t) => Number(t.price)));
  }
}
