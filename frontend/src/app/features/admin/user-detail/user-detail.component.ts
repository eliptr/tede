import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    MatCardModule, MatButtonModule, MatIconModule, MatSnackBarModule,
    MatProgressSpinnerModule, MatDividerModule,
  ],
  template: `
    <div class="container" *ngIf="user">
      <div class="page-header">
        <a mat-button routerLink="/admin/users">
          <mat-icon>arrow_back</mat-icon> Πίσω
        </a>
        <h1 class="page-title">Στοιχεία Χρήστη</h1>
      </div>

      <mat-card class="user-card">
        <mat-card-header>
          <mat-icon mat-card-avatar style="font-size:48px;width:48px;height:48px;color:#303f9f">account_circle</mat-icon>
          <mat-card-title>{{ user.first_name }} {{ user.last_name }}</mat-card-title>
          <mat-card-subtitle>
            &#64;{{ user.username }} &bull;
            <span class="status-chip {{ user.status }}">{{ user.status }}</span> &bull;
            {{ user.role }}
          </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <div class="info-grid">
            <div class="info-item">
              <mat-icon>email</mat-icon>
              <div><label>Email</label><span>{{ user.email }}</span></div>
            </div>
            <div class="info-item">
              <mat-icon>phone</mat-icon>
              <div><label>Τηλέφωνο</label><span>{{ user.phone }}</span></div>
            </div>
            <div class="info-item">
              <mat-icon>place</mat-icon>
              <div><label>Διεύθυνση</label><span>{{ user.address }}, {{ user.city }}, {{ user.country }}</span></div>
            </div>
            <div class="info-item">
              <mat-icon>receipt</mat-icon>
              <div><label>ΑΦΜ</label><span>{{ user.afm }}</span></div>
            </div>
            <div class="info-item">
              <mat-icon>calendar_today</mat-icon>
              <div><label>Εγγραφή</label><span>{{ user.created_at | date:'dd/MM/yyyy HH:mm' }}</span></div>
            </div>
          </div>
        </mat-card-content>

        <mat-card-actions *ngIf="user.status === 'PENDING'">
          <button mat-raised-button color="primary" (click)="approve()">
            <mat-icon>check_circle</mat-icon> Έγκριση Αίτησης
          </button>
          <button mat-stroked-button color="warn" (click)="reject()">
            <mat-icon>cancel</mat-icon> Απόρριψη Αίτησης
          </button>
        </mat-card-actions>
      </mat-card>
    </div>

    <div *ngIf="loading" class="spinner-center">
      <mat-progress-spinner mode="indeterminate" diameter="48"></mat-progress-spinner>
    </div>
  `,
  styles: [`
    .page-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .user-card { max-width: 600px; }
    .info-grid { display: flex; flex-direction: column; gap: 16px; margin-top: 16px; }
    .info-item { display: flex; align-items: flex-start; gap: 16px; }
    .info-item mat-icon { color: #303f9f; flex-shrink: 0; }
    .info-item div { display: flex; flex-direction: column; gap: 2px; }
    .info-item label { font-size: 0.75rem; color: #999; text-transform: uppercase; }
    .info-item span { font-size: 0.95rem; }
    .spinner-center { display: flex; justify-content: center; padding: 64px; }
    mat-card-actions { padding: 16px; display: flex; gap: 12px; }
  `],
})
export class UserDetailComponent implements OnInit {
  user: any = null;
  loading = true;

  constructor(private route: ActivatedRoute, private api: ApiService, private snack: MatSnackBar) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getUser(id).subscribe({
      next: (u) => { this.user = u; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  approve() {
    this.api.updateUserStatus(this.user.id, 'APPROVED').subscribe(() => {
      this.user.status = 'APPROVED';
      this.snack.open('Εγκρίθηκε!', 'OK', { duration: 3000, panelClass: 'snack-success' });
    });
  }

  reject() {
    if (!confirm('Απόρριψη αίτησης;')) return;
    this.api.updateUserStatus(this.user.id, 'REJECTED').subscribe(() => {
      this.user.status = 'REJECTED';
      this.snack.open('Απορρίφθηκε.', 'OK', { duration: 3000 });
    });
  }
}
