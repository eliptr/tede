import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    MatCardModule, MatButtonModule, MatIconModule, MatSnackBarModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="container">
      <h1 class="page-title">Πίνακας Διαχείρισης</h1>

      <!-- Stats -->
      <div class="stats-grid">
        <mat-card class="stat-card">
          <mat-icon>people</mat-icon>
          <div class="stat-value">{{ stats.totalUsers }}</div>
          <div class="stat-label">Σύνολο Χρηστών</div>
        </mat-card>
        <mat-card class="stat-card warn">
          <mat-icon>pending</mat-icon>
          <div class="stat-value">{{ stats.pendingUsers }}</div>
          <div class="stat-label">Αιτήσεις Εγγραφής</div>
        </mat-card>
        <mat-card class="stat-card primary">
          <mat-icon>event</mat-icon>
          <div class="stat-value">{{ stats.totalEvents }}</div>
          <div class="stat-label">Σύνολο Εκδηλώσεων</div>
        </mat-card>
        <mat-card class="stat-card success">
          <mat-icon>confirmation_number</mat-icon>
          <div class="stat-value">{{ stats.totalBookings }}</div>
          <div class="stat-label">Σύνολο Κρατήσεων</div>
        </mat-card>
      </div>

      <!-- Quick Actions -->
      <div class="admin-actions">
        <mat-card>
          <mat-card-header><mat-card-title>Διαχείριση Χρηστών</mat-card-title></mat-card-header>
          <mat-card-content>
            <p>Έγκριση/απόρριψη αιτήσεων εγγραφής, διαχείριση ρόλων.</p>
          </mat-card-content>
          <mat-card-actions>
            <a mat-raised-button color="primary" routerLink="/admin/users">
              <mat-icon>manage_accounts</mat-icon> Διαχείριση Χρηστών
            </a>
          </mat-card-actions>
        </mat-card>

        <mat-card>
          <mat-card-header><mat-card-title>Εξαγωγή Δεδομένων</mat-card-title></mat-card-header>
          <mat-card-content>
            <p>Εξαγωγή όλων των εκδηλώσεων σε μορφή XML ή JSON.</p>
          </mat-card-content>
          <mat-card-actions>
            <button mat-raised-button color="accent" (click)="exportXml()" [disabled]="exporting">
              <mat-icon>code</mat-icon> XML
            </button>
            <button mat-raised-button (click)="exportJson()" [disabled]="exporting" style="margin-left:8px">
              <mat-icon>data_object</mat-icon> JSON
            </button>
          </mat-card-actions>
        </mat-card>

        <mat-card>
          <mat-card-header><mat-card-title>Εκδηλώσεις</mat-card-title></mat-card-header>
          <mat-card-content><p>Προβολή όλων των εκδηλώσεων της πλατφόρμας.</p></mat-card-content>
          <mat-card-actions>
            <a mat-raised-button routerLink="/events">
              <mat-icon>event</mat-icon> Προβολή Εκδηλώσεων
            </a>
          </mat-card-actions>
        </mat-card>
      </div>

      <!-- Pending users quick list -->
      <mat-card *ngIf="pendingUsers.length > 0" class="pending-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon color="warn">notifications_active</mat-icon>
            Εκκρεμείς Αιτήσεις ({{ pendingUsers.length }})
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div *ngFor="let u of pendingUsers" class="pending-user">
            <div class="user-info">
              <strong>{{ u.first_name }} {{ u.last_name }}</strong>
              <span>{{ u.username }} · {{ u.email }}</span>
            </div>
            <div class="user-actions">
              <button mat-raised-button color="primary" (click)="approve(u)">
                <mat-icon>check</mat-icon> Έγκριση
              </button>
              <button mat-stroked-button color="warn" (click)="reject(u)">
                <mat-icon>close</mat-icon> Απόρριψη
              </button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; margin-bottom: 32px; }
    .stat-card { text-align: center; padding: 24px 16px; }
    .stat-card mat-icon { font-size: 40px; width: 40px; height: 40px; color: #666; }
    .stat-card.warn mat-icon { color: #f57c00; }
    .stat-card.primary mat-icon { color: #303f9f; }
    .stat-card.success mat-icon { color: #2e7d32; }
    .stat-value { font-size: 2.5rem; font-weight: 700; margin: 8px 0 4px; }
    .stat-label { color: #666; font-size: 0.9rem; }
    .admin-actions { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; margin-bottom: 32px; }
    .pending-card { margin-top: 8px; }
    .pending-card mat-card-title { display: flex; align-items: center; gap: 8px; }
    .pending-user { display: flex; justify-content: space-between; align-items: center;
      padding: 12px 0; border-bottom: 1px solid #f0f0f0; }
    .pending-user:last-child { border-bottom: none; }
    .user-info { display: flex; flex-direction: column; gap: 2px; }
    .user-info span { color: #666; font-size: 0.85rem; }
    .user-actions { display: flex; gap: 8px; }
  `],
})
export class AdminDashboardComponent implements OnInit {
  stats = { totalUsers: 0, pendingUsers: 0, totalEvents: 0, totalBookings: 0 };
  pendingUsers: any[] = [];
  exporting = false;

  constructor(private api: ApiService, private snack: MatSnackBar) {}

  ngOnInit() {
    this.api.getUsers(1, 100).subscribe((res) => {
      this.stats.totalUsers = res.total;
    });
    this.api.getPendingUsers().subscribe((users) => {
      this.pendingUsers = users;
      this.stats.pendingUsers = users.length;
    });
    this.api.getEvents({ limit: 1 }).subscribe((res) => {
      this.stats.totalEvents = res.total;
    });
    this.api.getMyBookings().subscribe({ next: () => {}, error: () => {} });
  }

  approve(u: any) {
    this.api.updateUserStatus(u.id, 'APPROVED').subscribe(() => {
      this.pendingUsers = this.pendingUsers.filter((x) => x.id !== u.id);
      this.stats.pendingUsers--;
      this.snack.open(`${u.username} εγκρίθηκε!`, 'OK', { duration: 3000, panelClass: 'snack-success' });
    });
  }

  reject(u: any) {
    if (!confirm(`Απόρριψη αίτησης "${u.username}";`)) return;
    this.api.updateUserStatus(u.id, 'REJECTED').subscribe(() => {
      this.pendingUsers = this.pendingUsers.filter((x) => x.id !== u.id);
      this.stats.pendingUsers--;
      this.snack.open(`${u.username} απορρίφθηκε.`, 'OK', { duration: 3000 });
    });
  }

  exportXml() {
    this.exporting = true;
    this.api.exportXml().subscribe((blob) => {
      this.download(blob, 'events.xml'); this.exporting = false;
    });
  }

  exportJson() {
    this.exporting = true;
    this.api.exportJson().subscribe((blob) => {
      this.download(blob, 'events.json'); this.exporting = false;
    });
  }

  private download(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }
}
