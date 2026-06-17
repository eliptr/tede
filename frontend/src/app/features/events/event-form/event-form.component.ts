import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-event-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatChipsModule, MatSnackBarModule, MatProgressSpinnerModule, MatDividerModule,
  ],
  template: `
    <div class="container">
      <h1 class="page-title">{{ isEdit ? 'Επεξεργασία' : 'Νέα' }} Εκδήλωση</h1>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <mat-card class="form-card">
          <mat-card-header><mat-card-title>Βασικές Πληροφορίες</mat-card-title></mat-card-header>
          <mat-card-content>
            <mat-form-field class="full-width">
              <mat-label>Τίτλος *</mat-label>
              <input matInput formControlName="title">
            </mat-form-field>

            <mat-form-field class="full-width">
              <mat-label>Τύπος Εκδήλωσης *</mat-label>
              <input matInput formControlName="event_type" placeholder="π.χ. Συναυλία, Σεμινάριο, Αθλητική εκδήλωση">
            </mat-form-field>

            <!-- Categories chips -->
            <div class="chips-field">
              <label>Κατηγορίες *</label>
              <mat-chip-grid #chipGrid>
                <mat-chip-row *ngFor="let cat of categories" (removed)="removeCategory(cat)">
                  {{ cat }}
                  <button matChipRemove><mat-icon>cancel</mat-icon></button>
                </mat-chip-row>
                <input placeholder="Προσθήκη κατηγορίας..."
                       [matChipInputFor]="chipGrid"
                       [matChipInputSeparatorKeyCodes]="separatorKeys"
                       (matChipInputTokenEnd)="addCategory($event)">
              </mat-chip-grid>
            </div>

            <mat-form-field class="full-width">
              <mat-label>Περιγραφή *</mat-label>
              <textarea matInput formControlName="description" rows="4"></textarea>
            </mat-form-field>

            <mat-form-field class="full-width">
              <mat-label>Χωρητικότητα *</mat-label>
              <input matInput type="number" formControlName="capacity" min="1">
            </mat-form-field>
          </mat-card-content>
        </mat-card>

        <mat-card class="form-card">
          <mat-card-header><mat-card-title>Τόπος & Χρόνος</mat-card-title></mat-card-header>
          <mat-card-content>
            <mat-form-field class="full-width">
              <mat-label>Χώρος (Venue) *</mat-label>
              <input matInput formControlName="venue">
            </mat-form-field>
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
                <mat-label>Χώρα *</mat-label>
                <input matInput formControlName="country">
              </mat-form-field>
            </div>
            <div class="row-2">
              <mat-form-field>
                <mat-label>Γεωγρ. Πλάτος</mat-label>
                <input matInput type="number" formControlName="latitude" placeholder="π.χ. 37.9838">
              </mat-form-field>
              <mat-form-field>
                <mat-label>Γεωγρ. Μήκος</mat-label>
                <input matInput type="number" formControlName="longitude" placeholder="π.χ. 23.7275">
              </mat-form-field>
            </div>
            <div class="row-2">
              <mat-form-field>
                <mat-label>Έναρξη *</mat-label>
                <input matInput type="datetime-local" formControlName="start_datetime">
              </mat-form-field>
              <mat-form-field>
                <mat-label>Λήξη *</mat-label>
                <input matInput type="datetime-local" formControlName="end_datetime">
              </mat-form-field>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Ticket Types -->
        <mat-card class="form-card">
          <mat-card-header>
            <mat-card-title>Τύποι Εισιτηρίων</mat-card-title>
            <button mat-icon-button type="button" (click)="addTicketType()" matTooltip="Προσθήκη τύπου">
              <mat-icon>add_circle</mat-icon>
            </button>
          </mat-card-header>
          <mat-card-content>
            <div class="capacity-hint" *ngIf="totalTickets > 0">
              Σύνολο εισιτηρίων: <strong>{{ totalTickets }}</strong> /
              Χωρητικότητα: <strong>{{ form.get('capacity')?.value || 0 }}</strong>
              <span class="over-capacity" *ngIf="totalTickets > (form.get('capacity')?.value || 0)">
                ⚠️ Υπέρβαση χωρητικότητας!
              </span>
            </div>

            <div formArrayName="ticket_types">
              <div *ngFor="let tt of ticketTypesArray.controls; let i = index"
                   [formGroupName]="i" class="ticket-row">
                <mat-form-field>
                  <mat-label>Ονομασία *</mat-label>
                  <input matInput formControlName="name" placeholder="π.χ. Γενική είσοδος">
                </mat-form-field>
                <mat-form-field>
                  <mat-label>Τιμή (€) *</mat-label>
                  <input matInput type="number" formControlName="price" min="0">
                </mat-form-field>
                <mat-form-field>
                  <mat-label>Πλήθος *</mat-label>
                  <input matInput type="number" formControlName="quantity" min="1">
                </mat-form-field>
                <button mat-icon-button type="button" color="warn"
                        (click)="removeTicketType(i)" [disabled]="ticketTypesArray.length === 1">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Photos (only on create) -->
        <mat-card class="form-card" *ngIf="!isEdit">
          <mat-card-header><mat-card-title>Φωτογραφίες (προαιρετικά)</mat-card-title></mat-card-header>
          <mat-card-content>
            <input type="file" multiple accept="image/*" (change)="onFilesSelected($event)" #fileInput style="display:none">
            <button mat-stroked-button type="button" (click)="fileInput.click()">
              <mat-icon>upload</mat-icon> Επιλογή φωτογραφιών
            </button>
            <div class="photo-preview" *ngIf="selectedFiles.length > 0">
              <span>{{ selectedFiles.length }} αρχείο(α) επιλεγμένα</span>
            </div>
          </mat-card-content>
        </mat-card>

        <div class="form-actions">
          <button mat-stroked-button type="button" (click)="router.navigate(['/my-events'])">Ακύρωση</button>
          <button mat-raised-button color="primary" type="submit" [disabled]="submitting || categories.length === 0">
            <mat-progress-spinner *ngIf="submitting" diameter="20" mode="indeterminate"></mat-progress-spinner>
            {{ submitting ? 'Αποθήκευση...' : (isEdit ? 'Αποθήκευση' : 'Δημιουργία') }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .form-card { margin-bottom: 20px; }
    mat-card-header { display: flex; align-items: center; }
    .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .ticket-row { display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 12px; align-items: center; margin-bottom: 8px; }
    .chips-field { margin-bottom: 16px; }
    .chips-field label { font-size: 0.85rem; color: #666; display: block; margin-bottom: 8px; }
    .form-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 8px; }
    .capacity-hint { padding: 8px 12px; background: #f5f5f5; border-radius: 4px; margin-bottom: 12px; font-size: 0.9rem; }
    .over-capacity { color: #e53935; font-weight: 600; margin-left: 8px; }
    .photo-preview { margin-top: 8px; color: #666; }
  `],
})
export class EventFormComponent implements OnInit {
  isEdit = false;
  eventId: number | null = null;
  submitting = false;
  categories: string[] = [];
  selectedFiles: File[] = [];
  separatorKeys = [ENTER, COMMA];

  form = this.fb.group({
    title: ['', Validators.required],
    event_type: ['', Validators.required],
    description: ['', Validators.required],
    capacity: [1, [Validators.required, Validators.min(1)]],
    venue: ['', Validators.required],
    address: ['', Validators.required],
    city: ['', Validators.required],
    country: ['Greece', Validators.required],
    latitude: [null],
    longitude: [null],
    start_datetime: ['', Validators.required],
    end_datetime: ['', Validators.required],
    ticket_types: this.fb.array([]),
  });

  get ticketTypesArray(): FormArray {
    return this.form.get('ticket_types') as FormArray;
  }

  get totalTickets(): number {
    return this.ticketTypesArray.controls.reduce((s, c) => s + (Number(c.get('quantity')?.value) || 0), 0);
  }

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    public router: Router,
    private route: ActivatedRoute,
    private snack: MatSnackBar,
  ) {}

  ngOnInit() {
    this.addTicketType();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.eventId = Number(id);
      this.api.getEvent(this.eventId).subscribe((e) => this.patchEvent(e));
    }
  }

  patchEvent(e: any) {
    this.categories = e.categories.map((c: any) => c.category);
    this.form.patchValue({
      title: e.title, event_type: e.event_type, description: e.description,
      capacity: e.capacity, venue: e.venue, address: e.address,
      city: e.city, country: e.country, latitude: e.latitude, longitude: e.longitude,
      start_datetime: this.toLocal(e.start_datetime),
      end_datetime: this.toLocal(e.end_datetime),
    });
    this.ticketTypesArray.clear();
    e.ticket_types.forEach((t: any) => this.addTicketType(t));
  }

  private toLocal(dt: string): string {
    if (!dt) return '';
    return new Date(dt).toISOString().slice(0, 16);
  }

  addTicketType(data?: any) {
    this.ticketTypesArray.push(this.fb.group({
      name: [data?.name || '', Validators.required],
      price: [data?.price || 0, [Validators.required, Validators.min(0)]],
      quantity: [data?.quantity || 1, [Validators.required, Validators.min(1)]],
    }));
  }

  removeTicketType(i: number) { this.ticketTypesArray.removeAt(i); }

  addCategory(e: MatChipInputEvent) {
    const val = (e.value || '').trim();
    if (val && !this.categories.includes(val)) this.categories.push(val);
    e.chipInput!.clear();
  }

  removeCategory(cat: string) {
    this.categories = this.categories.filter((c) => c !== cat);
  }

  onFilesSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    this.selectedFiles = Array.from(input.files || []);
  }

  submit() {
    if (this.form.invalid || this.categories.length === 0) return;
    this.submitting = true;
    const body = { ...this.form.value, categories: this.categories };

    const req = this.isEdit
      ? this.api.updateEvent(this.eventId!, body)
      : this.api.createEvent(body);

    req.subscribe({
      next: async (event) => {
        if (!this.isEdit && this.selectedFiles.length > 0) {
          const fl = this.selectedFiles.reduce((dt, f) => { dt.append('photos', f); return dt; }, new FormData());
          // upload photos via FileList workaround
          const files = this.selectedFiles;
          const fileList = {
            length: files.length,
            item: (i: number) => files[i],
            [Symbol.iterator]: function* () { for (const f of files) yield f; },
          } as any;
          await this.api.uploadEventPhotos(event.id, fileList).toPromise().catch(() => {});
        }
        this.submitting = false;
        this.snack.open(this.isEdit ? 'Εκδήλωση ενημερώθηκε!' : 'Εκδήλωση δημιουργήθηκε!', 'OK',
          { duration: 3000, panelClass: 'snack-success' });
        this.router.navigate(['/my-events']);
      },
      error: (err) => {
        this.submitting = false;
        this.snack.open(err.error?.message || 'Σφάλμα', 'OK', { duration: 4000, panelClass: 'snack-error' });
      },
    });
  }
}
