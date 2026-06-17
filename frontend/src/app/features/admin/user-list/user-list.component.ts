import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatTableModule,
    MatChipsModule, MatSnackBarModule, MatPaginatorModule, MatProgressSpinnerModule, MatSelectModule,
  ],
  template: `
    <div class="container">
      <h1 class="page-title">Διαχείριση Χρηστών</h1>

      <div *ngIf="loading" class="spinner-center">
        <mat-progress-spinner mode="indeterminate" diameter="48"></mat-progress-spinner>
      </div>

      <div class="table-wrap" *ngIf="!loading">
        <table mat-table [dataSource]="users" class="mat-elevation-z2">
          <ng-container matColumnDef="id">
            <th mat-header-cell *matHeaderCellDef>ID</th>
            <td mat-cell *matCellDef="let u">{{ u.id }}</td>
          </ng-container>
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Ονοματεπώνυμο</th>
            <td mat-cell *matCellDef="let u">
              <a [routerLink]="['/admin/users', u.id]">{{ u.first_name }} {{ u.last_name }}</a>
            </td>
          </ng-container>
          <ng-container matColumnDef="username">
            <th mat-header-cell *matHeaderCellDef>Username</th>
            <td mat-cell *matCellDef="let u">{{ u.username }}</td>
          </ng-container>
          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef>Email</th>
            <td mat-cell *matCellDef="let u">{{ u.email }}</td>
          </ng-container>
          <ng-container matColumnDef="role">
            <th mat-header-cell *matHeaderCellDef>Ρόλος</th>
            <td mat-cell *matCellDef="let u">
              <mat-select [(ngModel)]="u.role" (ngModelChange)="updateRole(u, $event)" style="width:130px">
                <mat-option value="ATTENDEE">Συμμετέχων</mat-option>
                <mat-option value="ORGANIZER">Διοργανωτής</mat-option>
                <mat-option value="ADMIN">Διαχειριστής</mat-option>
              </mat-select>
            </td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Κατάσταση</th>
            <td mat-cell *matCellDef="let u">
              <span class="status-chip {{ u.status }}">{{ u.status }}</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Ενέργειες</th>
            <td mat-cell *matCellDef="let u">
              <button mat-icon-button color="primary" (click)="approve(u)"
                      *ngIf="u.status === 'PENDING'" matTooltip="Έγκριση">
                <mat-icon>check_circle</mat-icon>
              </button>
              <button mat-icon-button color="warn" (click)="reject(u)"
                      *ngIf="u.status === 'PENDING'" matTooltip="Απόρριψη">
                <mat-icon>cancel</mat-icon>
              </button>
              <a mat-icon-button [routerLink]="['/admin/users', u.id]" matTooltip="Λεπτομέρειες">
                <mat-icon>visibility</mat-icon>
              </a>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns"
              [class.pending-row]="row.status === 'PENDING'"></tr>
        </table>

        <mat-paginator [length]="total" [pageSize]="limit" [pageSizeOptions]="[10, 20, 50]"
                       (page)="onPage($event)"></mat-paginator>
      </div>
    </div>
  `,
  styles: [`
    .table-wrap { overflow-x: auto; }
    table { width: 100%; }
    .spinner-center { display: flex; justify-content: center; padding: 64px; }
    .pending-row { background: #fff8e1; }
  `],
})
export class UserListComponent implements OnInit {
  users: any[] = [];
  total = 0;
  page = 1;
  limit = 20;
  loading = true;
  columns = ['id', 'name', 'username', 'email', 'role', 'status', 'actions'];

  constructor(private api: ApiService, private snack: MatSnackBar) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.api.getUsers(this.page, this.limit).subscribe({
      next: (res) => { this.users = res.users; this.total = res.total; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  onPage(e: PageEvent) { this.page = e.pageIndex + 1; this.limit = e.pageSize; this.load(); }

  approve(u: any) {
    this.api.updateUserStatus(u.id, 'APPROVED').subscribe(() => {
      u.status = 'APPROVED';
      this.snack.open('Εγκρίθηκε!', 'OK', { duration: 3000, panelClass: 'snack-success' });
    });
  }

  reject(u: any) {
    if (!confirm(`Απόρριψη "${u.username}";`)) return;
    this.api.updateUserStatus(u.id, 'REJECTED').subscribe(() => {
      u.status = 'REJECTED';
      this.snack.open('Απορρίφθηκε.', 'OK', { duration: 3000 });
    });
  }

  updateRole(u: any, role: string) {
    this.api.updateUserRole(u.id, role).subscribe(() => {
      this.snack.open('Ρόλος ενημερώθηκε!', 'OK', { duration: 2000, panelClass: 'snack-success' });
    });
  }
}
