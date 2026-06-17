import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule,
    MatSnackBarModule, MatProgressSpinnerModule, MatIconModule,
  ],
  template: `
    <div class="auth-container">
      <mat-card class="auth-card">
        <mat-card-header>
          <mat-icon mat-card-avatar color="primary">login</mat-icon>
          <mat-card-title>Σύνδεση</mat-card-title>
          <mat-card-subtitle>Συνδεθείτε στον λογαριασμό σας</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="submit()">
            <mat-form-field class="full-width">
              <mat-label>Όνομα χρήστη</mat-label>
              <input matInput formControlName="username" autocomplete="username">
              <mat-icon matSuffix>person</mat-icon>
            </mat-form-field>

            <mat-form-field class="full-width">
              <mat-label>Κωδικός</mat-label>
              <input matInput [type]="hidePass ? 'password' : 'text'" formControlName="password">
              <button mat-icon-button matSuffix type="button" (click)="hidePass = !hidePass">
                <mat-icon>{{ hidePass ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
            </mat-form-field>

            <button mat-raised-button color="primary" type="submit" class="full-width submit-btn"
                    [disabled]="form.invalid || loading">
              <mat-spinner diameter="20" *ngIf="loading"></mat-spinner>
              <span *ngIf="!loading">Σύνδεση</span>
            </button>
          </form>
        </mat-card-content>

        <mat-card-actions>
          <p>Δεν έχετε λογαριασμό; <a routerLink="/register">Εγγραφείτε εδώ</a></p>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .auth-container { display: flex; justify-content: center; align-items: center; min-height: 70vh; padding: 16px; }
    .auth-card { width: 100%; max-width: 420px; padding: 16px; }
    .submit-btn { margin-top: 8px; height: 44px; }
    mat-card-actions { text-align: center; padding: 8px 16px; }
  `],
})
export class LoginComponent {
  form = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });
  loading = false;
  hidePass = true;

  constructor(private fb: FormBuilder, private auth: AuthService, private snack: MatSnackBar, private router: Router) {}

  submit() {
    if (this.form.invalid) return;
    this.loading = true;
    const { username, password } = this.form.value;
    this.auth.login(username!, password!).subscribe({
      next: (res) => {
        this.loading = false;
        const role = res.user.role;
        this.router.navigate(role === 'ADMIN' ? ['/admin'] : ['/home']);
      },
      error: (err) => {
        this.loading = false;
        this.snack.open(err.error?.message || 'Σφάλμα σύνδεσης', 'OK', { duration: 4000, panelClass: 'snack-error' });
      },
    });
  }
}
