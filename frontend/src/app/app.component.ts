import { Component, OnInit, computed, signal, effect } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthService } from './core/services/auth.service';
import { ApiService } from './core/services/api.service';
import { interval } from 'rxjs';
import { switchMap, startWith, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive, CommonModule,
    MatToolbarModule, MatButtonModule, MatIconModule, MatMenuModule, MatBadgeModule,
  ],
  template: `
    <mat-toolbar color="primary" class="navbar">
      <a routerLink="/" class="brand">
        <mat-icon>event</mat-icon>
        <span>EventHub</span>
      </a>

      <span class="spacer"></span>

      <ng-container *ngIf="!auth.isLoggedIn()">
        <a mat-button routerLink="/events">Εκδηλώσεις</a>
        <a mat-button routerLink="/login">Σύνδεση</a>
        <a mat-raised-button color="accent" routerLink="/register">Εγγραφή</a>
      </ng-container>

      <ng-container *ngIf="auth.isLoggedIn()">
        <a mat-button routerLink="/home">Αρχική</a>
        <a mat-button routerLink="/events">Εκδηλώσεις</a>

        <ng-container *ngIf="auth.hasRole('ORGANIZER','ADMIN')">
          <a mat-button routerLink="/my-events">Οι Εκδηλώσεις μου</a>
        </ng-container>

        <ng-container *ngIf="auth.hasRole('ADMIN')">
          <a mat-button routerLink="/admin">Διαχείριση</a>
        </ng-container>

        <a mat-button routerLink="/bookings">
          <mat-icon>confirmation_number</mat-icon>
        </a>

        <a mat-button routerLink="/messages">
          <mat-icon [matBadge]="unreadCount() || null" matBadgeColor="warn" matBadgeSize="small">
            mail
          </mat-icon>
        </a>

        <button mat-button [matMenuTriggerFor]="userMenu">
          <mat-icon>account_circle</mat-icon>
          {{ auth.currentUser()?.first_name }}
          <mat-icon>arrow_drop_down</mat-icon>
        </button>
        <mat-menu #userMenu="matMenu">
          <button mat-menu-item (click)="auth.logout()">
            <mat-icon>logout</mat-icon> Αποσύνδεση
          </button>
        </mat-menu>
      </ng-container>
    </mat-toolbar>

    <main class="main-content">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    .navbar { position: sticky; top: 0; z-index: 1000; }
    .brand { display: flex; align-items: center; gap: 8px; color: white;
             text-decoration: none; font-size: 1.2rem; font-weight: 500; }
    .spacer { flex: 1; }
    .main-content { min-height: calc(100vh - 64px); padding: 24px 0; }
  `],
})
export class AppComponent implements OnInit {
  unreadCount = signal(0);

  constructor(public auth: AuthService, private api: ApiService) {
    effect(() => {
      if (this.auth.isLoggedIn()) this.startPolling();
    });
  }

  ngOnInit() {}

  private startPolling() {
    interval(30000).pipe(
      startWith(0),
      switchMap(() => this.api.getUnreadCount().pipe(catchError(() => of({ count: 0 })))),
    ).subscribe((res) => this.unreadCount.set(res.count));
  }
}
