import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import * as L from 'leaflet';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatChipsModule,
    MatFormFieldModule, MatSelectModule, MatInputModule, MatDividerModule,
    MatSnackBarModule, MatDialogModule, MatProgressSpinnerModule, MatTableModule,
  ],
  template: `
    <div class="container" *ngIf="event">
      <!-- Header -->
      <div class="event-header">
        <div class="header-info">
          <div class="categories">
            <mat-chip *ngFor="let cat of event.categories">{{ cat.category }}</mat-chip>
            <span class="status-chip {{ event.status }}">{{ event.status }}</span>
          </div>
          <h1>{{ event.title }}</h1>
          <p class="event-type">{{ event.event_type }}</p>
        </div>
      </div>

      <!-- Photos -->
      <div class="photo-gallery" *ngIf="event.photos?.length">
        <img *ngFor="let p of event.photos" [src]="'/api/uploads/' + p.filename" [alt]="event.title">
      </div>

      <div class="detail-grid">
        <!-- Left: Info -->
        <div class="info-col">
          <mat-card class="info-card">
            <mat-card-content>
              <div class="info-row">
                <mat-icon>calendar_today</mat-icon>
                <div>
                  <strong>Έναρξη:</strong> {{ event.start_datetime | date:'dd/MM/yyyy HH:mm' }}<br>
                  <strong>Λήξη:</strong> {{ event.end_datetime | date:'dd/MM/yyyy HH:mm' }}
                </div>
              </div>
              <mat-divider></mat-divider>
              <div class="info-row">
                <mat-icon>place</mat-icon>
                <div>
                  <strong>{{ event.venue }}</strong><br>
                  {{ event.address }}, {{ event.city }}, {{ event.country }}
                </div>
              </div>
              <mat-divider></mat-divider>
              <div class="info-row">
                <mat-icon>people</mat-icon>
                <div><strong>Χωρητικότητα:</strong> {{ event.capacity }} άτομα</div>
              </div>
              <mat-divider></mat-divider>
              <div class="info-row">
                <mat-icon>person</mat-icon>
                <div>
                  <strong>Διοργανωτής:</strong>
                  {{ event.organizer?.first_name }} {{ event.organizer?.last_name }}
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Description -->
          <mat-card class="info-card">
            <mat-card-header><mat-card-title>Περιγραφή</mat-card-title></mat-card-header>
            <mat-card-content>
              <p class="description">{{ event.description }}</p>
            </mat-card-content>
          </mat-card>

          <!-- Map -->
          <mat-card class="info-card" *ngIf="event.latitude">
            <mat-card-header><mat-card-title>Χάρτης</mat-card-title></mat-card-header>
            <mat-card-content>
              <div id="map" class="map-container"></div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Right: Booking -->
        <div class="booking-col">
          <mat-card class="booking-card" *ngIf="event.status === 'PUBLISHED' && auth.hasRole('ATTENDEE','ORGANIZER','ADMIN')">
            <mat-card-header>
              <mat-card-title>Κράτηση Εισιτηρίων</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <form [formGroup]="bookingForm" (ngSubmit)="confirmBooking()">
                <mat-form-field class="full-width">
                  <mat-label>Τύπος Εισιτηρίου</mat-label>
                  <mat-select formControlName="ticket_type_id">
                    <mat-option *ngFor="let tt of event.ticket_types" [value]="tt.id">
                      {{ tt.name }} — {{ tt.price | currency:'EUR':'symbol':'1.2-2' }}
                      ({{ tt.available }} διαθέσιμα)
                    </mat-option>
                  </mat-select>
                </mat-form-field>
                <mat-form-field class="full-width">
                  <mat-label>Πλήθος Εισιτηρίων</mat-label>
                  <input matInput type="number" formControlName="number_of_tickets" min="1">
                </mat-form-field>
                <div class="total-cost" *ngIf="totalCost > 0">
                  Σύνολο: <strong>{{ totalCost | currency:'EUR':'symbol':'1.2-2' }}</strong>
                </div>
                <button mat-raised-button color="primary" type="submit" class="full-width"
                        [disabled]="bookingForm.invalid || bookingLoading">
                  <mat-progress-spinner *ngIf="bookingLoading" diameter="20" mode="indeterminate"></mat-progress-spinner>
                  <mat-icon *ngIf="!bookingLoading">confirmation_number</mat-icon>
                  {{ bookingLoading ? 'Υποβολή...' : 'Κράτηση' }}
                </button>
              </form>
            </mat-card-content>
          </mat-card>

          <mat-card class="booking-card cancelled-notice" *ngIf="event.status === 'CANCELLED'">
            <mat-card-content>
              <mat-icon color="warn">cancel</mat-icon>
              <p>Η εκδήλωση έχει ακυρωθεί. Δεν είναι δυνατή η πραγματοποίηση κρατήσεων.</p>
            </mat-card-content>
          </mat-card>

          <mat-card class="booking-card" *ngIf="!auth.isLoggedIn()">
            <mat-card-content class="login-prompt">
              <mat-icon>lock</mat-icon>
              <p>Συνδεθείτε για να κάνετε κράτηση.</p>
              <a mat-raised-button color="primary" routerLink="/login">Σύνδεση</a>
            </mat-card-content>
          </mat-card>

          <!-- Ticket types summary -->
          <mat-card class="info-card">
            <mat-card-header><mat-card-title>Τύποι Εισιτηρίων</mat-card-title></mat-card-header>
            <mat-card-content>
              <table mat-table [dataSource]="event.ticket_types" class="ticket-table">
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Τύπος</th>
                  <td mat-cell *matCellDef="let t">{{ t.name }}</td>
                </ng-container>
                <ng-container matColumnDef="price">
                  <th mat-header-cell *matHeaderCellDef>Τιμή</th>
                  <td mat-cell *matCellDef="let t">{{ t.price | currency:'EUR':'symbol':'1.2-2' }}</td>
                </ng-container>
                <ng-container matColumnDef="available">
                  <th mat-header-cell *matHeaderCellDef>Διαθέσιμα</th>
                  <td mat-cell *matCellDef="let t">{{ t.available }}/{{ t.quantity }}</td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="['name','price','available']"></tr>
                <tr mat-row *matRowDef="let row; columns: ['name','price','available']"></tr>
              </table>
            </mat-card-content>
          </mat-card>

          <!-- Contact organizer -->
          <mat-card class="info-card" *ngIf="auth.isLoggedIn()">
            <mat-card-header><mat-card-title>Επικοινωνία</mat-card-title></mat-card-header>
            <mat-card-content>
              <form [formGroup]="msgForm" (ngSubmit)="sendMessage()">
                <mat-form-field class="full-width">
                  <mat-label>Μήνυμα προς Διοργανωτή</mat-label>
                  <textarea matInput formControlName="content" rows="3"></textarea>
                </mat-form-field>
                <button mat-stroked-button color="primary" type="submit" [disabled]="msgForm.invalid">
                  <mat-icon>send</mat-icon> Αποστολή
                </button>
              </form>
            </mat-card-content>
          </mat-card>
        </div>
      </div>
    </div>

    <div *ngIf="!event && !loading" class="not-found">
      <mat-icon>event_busy</mat-icon>
      <h2>Η εκδήλωση δεν βρέθηκε</h2>
      <a mat-button routerLink="/events">← Πίσω στις εκδηλώσεις</a>
    </div>
    <div *ngIf="loading" class="spinner-center"><mat-progress-spinner mode="indeterminate" diameter="48"></mat-progress-spinner></div>
  `,
  styles: [`
    .event-header { margin-bottom: 24px; }
    .event-header h1 { font-size: 2rem; margin: 8px 0; }
    .event-type { color: #666; font-size: 1rem; }
    .categories { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; align-items: center; }
    .photo-gallery { display: flex; gap: 8px; overflow-x: auto; margin-bottom: 24px; }
    .photo-gallery img { height: 200px; border-radius: 8px; object-fit: cover; }
    .detail-grid { display: grid; grid-template-columns: 1fr 380px; gap: 24px; }
    @media (max-width: 900px) { .detail-grid { grid-template-columns: 1fr; } }
    .info-card, .booking-card { margin-bottom: 16px; }
    .info-row { display: flex; align-items: flex-start; gap: 16px; padding: 12px 0; }
    .info-row mat-icon { color: #303f9f; flex-shrink: 0; margin-top: 2px; }
    .description { line-height: 1.8; color: #333; }
    .map-container { height: 300px; border-radius: 8px; overflow: hidden; }
    .total-cost { font-size: 1.1rem; text-align: right; margin: 8px 0; color: #333; }
    .cancelled-notice mat-card-content { display: flex; align-items: center; gap: 12px; color: #c62828; }
    .login-prompt { text-align: center; padding: 16px; }
    .login-prompt mat-icon { font-size: 48px; width: 48px; height: 48px; color: #999; display: block; margin: 0 auto 8px; }
    .ticket-table { width: 100%; }
    .not-found, .spinner-center { text-align: center; padding: 64px; }
    .not-found mat-icon { font-size: 64px; width: 64px; height: 64px; color: #999; display: block; margin: 0 auto 16px; }
  `],
})
export class EventDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  event: any = null;
  loading = true;
  bookingLoading = false;
  private map: L.Map | null = null;

  bookingForm = this.fb.group({
    ticket_type_id: [null, Validators.required],
    number_of_tickets: [1, [Validators.required, Validators.min(1)]],
  });

  msgForm = this.fb.group({ content: ['', Validators.required] });

  get totalCost(): number {
    const ttId = this.bookingForm.value.ticket_type_id;
    const n = this.bookingForm.value.number_of_tickets || 0;
    if (!ttId || !this.event) return 0;
    const tt = this.event.ticket_types.find((t: any) => t.id === ttId);
    return tt ? Number(tt.price) * n : 0;
  }

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    public auth: AuthService,
    private fb: FormBuilder,
    private snack: MatSnackBar,
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getEvent(id).subscribe({
      next: (e) => { this.event = e; this.loading = false; setTimeout(() => this.initMap(), 200); },
      error: () => { this.loading = false; },
    });
  }

  ngAfterViewInit() {}

  ngOnDestroy() { this.map?.remove(); }

  private initMap() {
    if (!this.event?.latitude || this.map) return;
    const lat = Number(this.event.latitude);
    const lng = Number(this.event.longitude);

    this.map = L.map('map').setView([lat, lng], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);

    const icon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
    });
    L.marker([lat, lng], { icon })
      .addTo(this.map)
      .bindPopup(`<b>${this.event.venue}</b><br>${this.event.address}`)
      .openPopup();
  }

confirmBooking() {
  if (this.bookingForm.invalid) return;

  const payload = {
    event_id: Number(this.event?.id),
    ticket_type_id: Number(this.bookingForm.value.ticket_type_id),
    number_of_tickets: Number(this.bookingForm.value.number_of_tickets),
  };

  console.log('booking payload', payload);

  if (
    !Number.isInteger(payload.event_id) ||
    !Number.isInteger(payload.ticket_type_id) ||
    !Number.isInteger(payload.number_of_tickets)
  ) {
    this.snack.open('Λάθος στοιχεία κράτησης', 'OK', {
      duration: 4000,
      panelClass: 'snack-error',
    });
    return;
  }

  const confirmed = window.confirm(
    `Επιβεβαίωση κράτησης:\n` +
    `${payload.number_of_tickets} εισιτήριο(α)\n` +
    `Σύνολο: ${this.totalCost.toFixed(2)} €\n\n` +
    `Η κράτηση δεν μπορεί να ακυρωθεί μετά την υποβολή.`
  );

  if (!confirmed) return;

  this.bookingLoading = true;

  this.api.createBooking(payload).subscribe({
    next: () => {
      this.bookingLoading = false;
      this.snack.open('Η κράτηση πραγματοποιήθηκε επιτυχώς!', 'OK', {
        duration: 4000,
        panelClass: 'snack-success',
      });
      this.api.getEvent(this.event.id).subscribe((e) => (this.event = e));
    },
    error: (err) => {
      this.bookingLoading = false;
      console.error('booking error', err);
      this.snack.open(
        err.error?.message || 'Σφάλμα κράτησης',
        'OK',
        { duration: 5000, panelClass: 'snack-error' },
      );
    },
  });
}

sendMessage() {
  if (this.msgForm.invalid) return;

  const payload = {
    receiver_id: Number(this.event?.organizer?.id ?? this.event?.organizer_id),
    content: String(this.msgForm.value.content || '').trim(),
    event_id: Number(this.event?.id),
  };

  console.log('message payload', payload);

  if (!Number.isInteger(payload.receiver_id) || payload.receiver_id <= 0) {
    this.snack.open('Δεν βρέθηκε ο διοργανωτής της εκδήλωσης', 'OK', {
      duration: 4000,
      panelClass: 'snack-error',
    });
    return;
  }

  if (!payload.content) {
    this.snack.open('Το μήνυμα είναι κενό', 'OK', {
      duration: 3000,
      panelClass: 'snack-error',
    });
    return;
  }

  this.api.sendMessage(payload).subscribe({
    next: () => {
      this.msgForm.reset();
      this.snack.open('Το μήνυμα στάλθηκε!', 'OK', {
        duration: 3000,
        panelClass: 'snack-success',
      });
    },
    error: (err) => {
      console.error('message error', err);
      this.snack.open(
        err.error?.message || 'Σφάλμα αποστολής μηνύματος',
        'OK',
        { duration: 3000, panelClass: 'snack-error' },
      );
    },
  });
}
}
