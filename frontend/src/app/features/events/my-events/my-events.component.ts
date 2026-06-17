import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { MessagesService } from '../../messages/messages.service';

@Component({
  selector: 'app-my-events',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    MatCardModule, MatButtonModule, MatIconModule, MatTableModule,
    MatChipsModule, MatSnackBarModule, MatProgressSpinnerModule,
    MatDialogModule, MatMenuModule, MatTabsModule, MatPaginatorModule,
  ],
  template: `
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">Οι Εκδηλώσεις μου</h1>
        <a mat-raised-button color="primary" routerLink="/events/new">
          <mat-icon>add</mat-icon> Νέα Εκδήλωση
        </a>
      </div>

      <div *ngIf="loading" class="spinner-center">
        <mat-progress-spinner mode="indeterminate" diameter="48"></mat-progress-spinner>
      </div>

      <div *ngIf="!loading && events.length === 0" class="empty-state">
        <mat-icon>event_note</mat-icon>
        <h3>Δεν έχετε δημιουργήσει εκδηλώσεις ακόμη</h3>
        <a mat-raised-button color="primary" routerLink="/events/new">Δημιουργία πρώτης εκδήλωσης</a>
      </div>

      <div class="events-table-wrap" *ngIf="!loading && events.length > 0">
        <table mat-table [dataSource]="events" class="mat-elevation-z2">
          <ng-container matColumnDef="title">
            <th mat-header-cell *matHeaderCellDef>Τίτλος</th>
            <td mat-cell *matCellDef="let e">
              <a [routerLink]="['/events', e.id]">{{ e.title }}</a>
            </td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Κατάσταση</th>
            <td mat-cell *matCellDef="let e">
              <span class="status-chip {{ e.status }}">{{ e.status }}</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="date">
            <th mat-header-cell *matHeaderCellDef>Ημερομηνία</th>
            <td mat-cell *matCellDef="let e">{{ e.start_datetime | date:'dd/MM/yyyy' }}</td>
          </ng-container>
          <ng-container matColumnDef="city">
            <th mat-header-cell *matHeaderCellDef>Πόλη</th>
            <td mat-cell *matCellDef="let e">{{ e.city }}</td>
          </ng-container>
          <ng-container matColumnDef="capacity">
            <th mat-header-cell *matHeaderCellDef>Χωρητικότητα</th>
            <td mat-cell *matCellDef="let e">{{ e.capacity }}</td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Ενέργειες</th>
            <td mat-cell *matCellDef="let e">
              <button mat-icon-button [matMenuTriggerFor]="menu">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #menu="matMenu">
                <a mat-menu-item [routerLink]="['/events', e.id]">
                  <mat-icon>visibility</mat-icon> Προβολή
                </a>
                <a mat-menu-item [routerLink]="['/events', e.id, 'edit']" *ngIf="e.status !== 'CANCELLED'">
                  <mat-icon>edit</mat-icon> Επεξεργασία
                </a>
                <button mat-menu-item *ngIf="e.status === 'DRAFT'" (click)="publish(e)">
                  <mat-icon>publish</mat-icon> Δημοσίευση
                </button>
                <button mat-menu-item (click)="viewBookings(e)">
                  <mat-icon>confirmation_number</mat-icon> Κρατήσεις
                </button>
                <button mat-menu-item *ngIf="e.status === 'PUBLISHED'" (click)="cancel(e)" color="warn">
                  <mat-icon color="warn">cancel</mat-icon> Ακύρωση
                </button>
                <button mat-menu-item *ngIf="e.status === 'DRAFT'" (click)="delete(e)" color="warn">
                  <mat-icon color="warn">delete</mat-icon> Διαγραφή
                </button>
              </mat-menu>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns"></tr>
        </table>
        <mat-paginator
          *ngIf="eventsTotal > 0"
          [length]="eventsTotal"
          [pageIndex]="eventPageIndex"
          [pageSize]="eventPageSize"
          [pageSizeOptions]="[5, 10, 25, 50]"
          showFirstLastButtons
          (page)="onEventsPage($event)">
        </mat-paginator>
      </div>

      <!-- Bookings panel -->
      <div *ngIf="selectedEvent" class="bookings-panel mat-elevation-z2">
        <div class="bookings-header">
          <h2>Κρατήσεις: {{ selectedEvent.title }}</h2>
          <button mat-icon-button (click)="closeBookings()">
            <mat-icon>close</mat-icon>
          </button>
        </div>
        <div *ngIf="bookingsLoading" class="spinner-center">
          <mat-progress-spinner mode="indeterminate" diameter="32"></mat-progress-spinner>
        </div>
        <div *ngIf="!bookingsLoading && bookings.length === 0" class="empty-msg">
          Δεν υπάρχουν κρατήσεις ακόμη.
        </div>
        <table mat-table [dataSource]="bookings" *ngIf="!bookingsLoading && bookings.length > 0" class="bookings-table">
          <ng-container matColumnDef="attendee">
            <th mat-header-cell *matHeaderCellDef>Χρήστης</th>
            <td mat-cell *matCellDef="let b">{{ b.attendee?.first_name }} {{ b.attendee?.last_name }}</td>
          </ng-container>
          <ng-container matColumnDef="ticket">
            <th mat-header-cell *matHeaderCellDef>Εισιτήριο</th>
            <td mat-cell *matCellDef="let b">{{ b.ticket_type?.name }}</td>
          </ng-container>
          <ng-container matColumnDef="num">
            <th mat-header-cell *matHeaderCellDef>Πλήθος</th>
            <td mat-cell *matCellDef="let b">{{ b.number_of_tickets }}</td>
          </ng-container>
          <ng-container matColumnDef="cost">
            <th mat-header-cell *matHeaderCellDef>Κόστος</th>
            <td mat-cell *matCellDef="let b">{{ b.total_cost | currency:'EUR':'symbol':'1.2-2' }}</td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Κατάσταση</th>
            <td mat-cell *matCellDef="let b"><span class="status-chip {{ b.status }}">{{ b.status }}</span></td>
          </ng-container>
          <ng-container matColumnDef="date">
            <th mat-header-cell *matHeaderCellDef>Ημ/νία</th>
            <td mat-cell *matCellDef="let b">{{ b.time | date:'dd/MM/yyyy HH:mm' }}</td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="bookingCols"></tr>
          <tr mat-row *matRowDef="let row; columns: bookingCols"></tr>
        </table>
        <mat-paginator
          *ngIf="!bookingsLoading && bookingsTotal > 0"
          [length]="bookingsTotal"
          [pageIndex]="bookingPageIndex"
          [pageSize]="bookingPageSize"
          [pageSizeOptions]="[5, 10, 25, 50]"
          showFirstLastButtons
          (page)="onBookingsPage($event)">
        </mat-paginator>

        <button mat-stroked-button *ngIf="selectedEvent.status === 'CANCELLED'"
                (click)="notifyAll()" style="margin-top:12px">
          <mat-icon>notification_important</mat-icon> Ειδοποίηση όλων για ακύρωση
        </button>
      </div>
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .spinner-center { display: flex; justify-content: center; padding: 48px; }
    .empty-state { text-align: center; padding: 48px; color: #999; }
    .empty-state mat-icon { font-size: 64px; width: 64px; height: 64px; display: block; margin: 0 auto 16px; }
    .events-table-wrap { overflow-x: auto; }
    table { width: 100%; }
    .bookings-panel { margin-top: 32px; padding: 20px; border-radius: 8px; background: white; }
    .bookings-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .bookings-header h2 { margin: 0; font-size: 1.2rem; }
    .bookings-table { width: 100%; }
    .empty-msg { color: #999; padding: 16px 0; }
  `],
})
export class MyEventsComponent implements OnInit {
  events: any[] = [];
  eventsTotal = 0;
  eventPageIndex = 0;
  eventPageSize = 10;
  loading = true;
  selectedEvent: any = null;
  bookings: any[] = [];
  bookingsTotal = 0;
  bookingPageIndex = 0;
  bookingPageSize = 10;
  bookingsLoading = false;
  columns = ['title', 'status', 'date', 'city', 'capacity', 'actions'];
  bookingCols = ['attendee', 'ticket', 'num', 'cost', 'status', 'date'];

  constructor(
    private api: ApiService,
    public auth: AuthService,
    private snack: MatSnackBar,
    private router: Router,
  ) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.api.getMyEvents(this.eventPageIndex + 1, this.eventPageSize).subscribe({
      next: (data) => {
        this.events = Array.isArray(data) ? data : data.events;
        this.eventsTotal = Array.isArray(data) ? data.length : data.total;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  onEventsPage(event: PageEvent) {
    this.eventPageIndex = event.pageIndex;
    this.eventPageSize = event.pageSize;
    this.load();
  }

  publish(e: any) {
    if (!confirm(`Δημοσίευση εκδήλωσης "${e.title}";`)) return;
    this.api.publishEvent(e.id).subscribe({
      next: () => { this.snack.open('Δημοσιεύτηκε!', 'OK', { duration: 3000, panelClass: 'snack-success' }); this.load(); },
      error: (err) => this.snack.open(err.error?.message || 'Σφάλμα', 'OK', { duration: 4000, panelClass: 'snack-error' }),
    });
  }

  cancel(e: any) {
    if (!confirm(`Ακύρωση εκδήλωσης "${e.title}"; Η ενέργεια δεν αναιρείται.`)) return;
    this.api.cancelEvent(e.id).subscribe({
      next: () => { this.snack.open('Ακυρώθηκε.', 'OK', { duration: 3000 }); this.load(); },
      error: (err) => this.snack.open(err.error?.message || 'Σφάλμα', 'OK', { duration: 4000, panelClass: 'snack-error' }),
    });
  }

  delete(e: any) {
    if (!confirm(`Διαγραφή εκδήλωσης "${e.title}";`)) return;
    this.api.deleteEvent(e.id).subscribe({
      next: () => { this.snack.open('Διαγράφηκε.', 'OK', { duration: 3000 }); this.load(); },
      error: (err) => this.snack.open(err.error?.message || 'Σφάλμα', 'OK', { duration: 4000, panelClass: 'snack-error' }),
    });
  }

  viewBookings(e: any) {
    this.selectedEvent = e;
    this.bookingPageIndex = 0;
    this.loadBookings();
    setTimeout(() => document.querySelector('.bookings-panel')?.scrollIntoView({ behavior: 'smooth' }), 100);
  }

  closeBookings() {
    this.selectedEvent = null;
    this.bookings = [];
    this.bookingsTotal = 0;
    this.bookingPageIndex = 0;
  }

  onBookingsPage(event: PageEvent) {
    this.bookingPageIndex = event.pageIndex;
    this.bookingPageSize = event.pageSize;
    this.loadBookings();
  }

  loadBookings() {
    if (!this.selectedEvent) return;

    this.bookingsLoading = true;
    this.api.getEventBookings(this.selectedEvent.id, this.bookingPageIndex + 1, this.bookingPageSize).subscribe({
      next: (data) => {
        this.bookings = Array.isArray(data) ? data : data.bookings;
        this.bookingsTotal = Array.isArray(data) ? data.length : data.total;
        this.bookingsLoading = false;
      },
      error: () => { this.bookingsLoading = false; },
    });
  }

  async notifyAll() {
    const msg = prompt('Μήνυμα ακύρωσης προς όλους τους χρήστες με κράτηση:',
      `Η εκδήλωση "${this.selectedEvent?.title}" έχει ακυρωθεί. Λυπούμαστε για την ταλαιπωρία.`);
    if (!msg || !this.selectedEvent) return;

    const receivers = [...await this.loadAllBookingReceivers()];
    if (!receivers.length) return;

    let sent = 0;
    receivers.forEach((uid) => {
      this.api.sendMessage({ receiver_id: uid, content: msg, event_id: this.selectedEvent.id })
        .subscribe(() => { sent++; if (sent === receivers.length) this.snack.open('Μηνύματα εστάλησαν!', 'OK', { duration: 3000, panelClass: 'snack-success' }); });
    });
  }

  private async loadAllBookingReceivers() {
    const receivers = new Set<number>();
    const pageSize = 100;
    let page = 1;
    let total = 0;

    do {
      const data = await firstValueFrom(this.api.getEventBookings(this.selectedEvent.id, page, pageSize));
      const pageBookings = Array.isArray(data) ? data : data.bookings;
      total = Array.isArray(data) ? pageBookings.length : data.total;
      pageBookings.forEach((booking: any) => receivers.add(booking.attendee_id));
      page += 1;
    } while ((page - 1) * pageSize < total);

    return receivers;
  }
}
