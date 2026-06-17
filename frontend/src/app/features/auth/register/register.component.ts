import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule,
    MatSnackBarModule, MatStepperModule, MatIconModule,
  ],
  template: `
    <div class="auth-container">
      <mat-card class="register-card">
        <mat-card-header>
          <mat-icon mat-card-avatar color="primary">person_add</mat-icon>
          <mat-card-title>Εγγραφή</mat-card-title>
          <mat-card-subtitle>Δημιουργήστε νέο λογαριασμό</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <div *ngIf="!success">
            <mat-stepper [linear]="true" #stepper>
              <!-- Step 1: Account -->
              <mat-step [stepControl]="accountForm" label="Στοιχεία Λογαριασμού">
                <form [formGroup]="accountForm">
                  <mat-form-field class="full-width">
                    <mat-label>Όνομα χρήστη *</mat-label>
                    <input matInput formControlName="username">
                    <mat-error *ngIf="accountForm.get('username')?.invalid">Υποχρεωτικό πεδίο</mat-error>
                  </mat-form-field>
                  <mat-form-field class="full-width">
                    <mat-label>Κωδικός *</mat-label>
                    <input matInput type="password" formControlName="password">
                    <mat-error *ngIf="accountForm.get('password')?.hasError('minlength')">Τουλάχιστον 8 χαρακτήρες</mat-error>
                  </mat-form-field>
                  <mat-form-field class="full-width">
                    <mat-label>Επιβεβαίωση κωδικού *</mat-label>
                    <input matInput type="password" formControlName="confirmPassword">
                    <mat-error *ngIf="accountForm.hasError('mismatch')">Οι κωδικοί δεν ταιριάζουν</mat-error>
                  </mat-form-field>
                  <div class="step-actions">
                    <button mat-raised-button color="primary" matStepperNext
                            [disabled]="accountForm.invalid">Επόμενο</button>
                  </div>
                </form>
              </mat-step>

              <!-- Step 2: Personal -->
              <mat-step [stepControl]="personalForm" label="Προσωπικά Στοιχεία">
                <form [formGroup]="personalForm">
                  <div class="row-2">
                    <mat-form-field>
                      <mat-label>Όνομα *</mat-label>
                      <input matInput formControlName="first_name">
                    </mat-form-field>
                    <mat-form-field>
                      <mat-label>Επώνυμο *</mat-label>
                      <input matInput formControlName="last_name">
                    </mat-form-field>
                  </div>
                  <mat-form-field class="full-width">
                    <mat-label>Email *</mat-label>
                    <input matInput type="email" formControlName="email">
                    <mat-error *ngIf="personalForm.get('email')?.invalid">Μη έγκυρο email</mat-error>
                  </mat-form-field>
                  <mat-form-field class="full-width">
                    <mat-label>Τηλέφωνο *</mat-label>
                    <input matInput formControlName="phone">
                  </mat-form-field>
                  <mat-form-field class="full-width">
                    <mat-label>ΑΦΜ *</mat-label>
                    <input matInput formControlName="afm">
                  </mat-form-field>
                  <div class="step-actions">
                    <button mat-button matStepperPrevious>Πίσω</button>
                    <button mat-raised-button color="primary" matStepperNext
                            [disabled]="personalForm.invalid">Επόμενο</button>
                  </div>
                </form>
              </mat-step>

              <!-- Step 3: Address -->
              <mat-step [stepControl]="addressForm" label="Διεύθυνση">
                <form [formGroup]="addressForm">
                  <mat-form-field class="full-width">
                    <mat-label>Διεύθυνση *</mat-label>
                    <input matInput formControlName="address">
                  </mat-form-field>
                  <div class="row-2">
                    <mat-form-field>
                      <mat-label>Πόλη *</mat-label>
                      <input matInput formControlName="city">
                    </mat-form-field>
                    <mat-form-field>
                      <mat-label>ΤΚ</mat-label>
                      <input matInput formControlName="zip">
                    </mat-form-field>
                  </div>
                  <mat-form-field class="full-width">
                    <mat-label>Χώρα *</mat-label>
                    <input matInput formControlName="country">
                  </mat-form-field>
                  <div class="step-actions">
                    <button mat-button matStepperPrevious>Πίσω</button>
                    <button mat-raised-button color="primary" (click)="submit()" [disabled]="addressForm.invalid || loading">
                      {{ loading ? 'Υποβολή...' : 'Εγγραφή' }}
                    </button>
                  </div>
                </form>
              </mat-step>
            </mat-stepper>
          </div>

          <!-- Success -->
          <div *ngIf="success" class="success-msg">
            <mat-icon color="primary" style="font-size:64px;width:64px;height:64px">check_circle</mat-icon>
            <h2>Η εγγραφή σας υποβλήθηκε!</h2>
            <p>Η αίτησή σας εκκρεμεί έγκριση από τον διαχειριστή.<br>Θα ειδοποιηθείτε μόλις εγκριθεί.</p>
            <a mat-raised-button color="primary" routerLink="/login">Σύνδεση</a>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .auth-container { display: flex; justify-content: center; padding: 24px 16px; }
    .register-card { width: 100%; max-width: 560px; padding: 16px; }
    .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .step-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
    .success-msg { text-align: center; padding: 32px; }
    .success-msg mat-icon { color: #43a047; margin-bottom: 16px; }
  `],
})
export class RegisterComponent {
  success = false;
  loading = false;

  accountForm = this.fb.group({
    username: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
  }, { validators: this.passwordMatch });

  personalForm = this.fb.group({
    first_name: ['', Validators.required],
    last_name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    afm: ['', Validators.required],
  });

  addressForm = this.fb.group({
    address: ['', Validators.required],
    city: ['', Validators.required],
    country: ['Greece', Validators.required],
    zip: [''],
  });

  constructor(private fb: FormBuilder, private api: ApiService, private snack: MatSnackBar) {}

  passwordMatch(group: AbstractControl) {
    const p = group.get('password')?.value;
    const c = group.get('confirmPassword')?.value;
    return p === c ? null : { mismatch: true };
  }

  submit() {
    if (this.addressForm.invalid) return;
    this.loading = true;
    const body = {
      ...this.accountForm.value,
      ...this.personalForm.value,
      ...this.addressForm.value,
    };
    delete (body as any).confirmPassword;
    this.api.register(body).subscribe({
      next: () => { this.loading = false; this.success = true; },
      error: (err) => {
        this.loading = false;
        this.snack.open(err.error?.message || 'Σφάλμα εγγραφής', 'OK', { duration: 4000, panelClass: 'snack-error' });
      },
    });
  }
}
