import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule,
    MatChipsModule, MatPaginatorModule, MatProgressSpinnerModule, MatExpansionModule,
  ],
  template: `
    <div class="container">
      <h1 class="page-title">Εκδηλώσεις</h1>

      <!-- Filters -->
      <mat-expansion-panel class="filter-panel">
        <mat-expansion-panel-header>
          <mat-icon>filter_list</mat-icon>&nbsp; Φίλτρα Αναζήτησης
        </mat-expansion-panel-header>
        <form [formGroup]="filterForm" class="filter-form" (ngSubmit)="applyFilters()">
          <mat-form-field>
            <mat-label>Τίτλος</mat-label>
            <input matInput formControlName="title">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
          <mat-form-field>
            <mat-label>Κατηγορία</mat-label>
            <mat-select formControlName="category">
              <mat-option value="">Όλες</mat-option>
              <mat-option *ngFor="let cat of categories" [value]="cat">{{ cat }}</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field>
            <mat-label>Πόλη</mat-label>
            <input matInput formControlName="city">
          </mat-form-field>
          <mat-form-field>
            <mat-label>Από ημερομηνία</mat-label>
            <input matInput [matDatepicker]="dpFrom" formControlName="date_from">
            <mat-datepicker-toggle matSuffix [for]="dpFrom"></mat-datepicker-toggle>
            <mat-datepicker #dpFrom></mat-datepicker>
          </mat-form-field>
          <mat-form-field>
            <mat-label>Έως ημερομηνία</mat-label>
            <input matInput [matDatepicker]="dpTo" formControlName="date_to">
            <mat-datepicker-toggle matSuffix [for]="dpTo"></mat-datepicker-toggle>
            <mat-datepicker #dpTo></mat-datepicker>
          </mat-form-field>
          <mat-form-field>
            <mat-label>Τιμή από (€)</mat-label>
            <input matInput type="number" formControlName="price_min">
          </mat-form-field>
          <mat-form-field>
            <mat-label>Τιμή έως (€)</mat-label>
            <input matInput type="number" formControlName="price_max">
          </mat-form-field>
          <div class="filter-actions">
            <button mat-stroked-button type="button" (click)="resetFilters()">
              <mat-icon>clear</mat-icon> Καθαρισμός
            </button>
            <button mat-raised-button color="primary" type="submit">
              <mat-icon>search</mat-icon> Αναζήτηση
            </button>
          </div>
        </form>
      </mat-expansion-panel>

      <!-- Results -->
      <div class="results-header">
        <span *ngIf="!loading">{{ total }} εκδηλώσεις βρέθηκαν</span>
        <span *ngIf="activeTitleFilter" class="active-filter">Τίτλος: "{{ activeTitleFilter }}"</span>
      </div>

      <div *ngIf="loading" class="spinner-center">
        <mat-progress-spinner mode="indeterminate" diameter="48"></mat-progress-spinner>
      </div>

      <div *ngIf="!loading && events.length === 0" class="empty-state">
        <mat-icon>event_busy</mat-icon>
        <h3>Δεν βρέθηκαν εκδηλώσεις</h3>
        <p>Δοκιμάστε διαφορετικά κριτήρια αναζήτησης.</p>
      </div>

      <div class="card-grid" *ngIf="!loading">
        <mat-card class="event-card" *ngFor="let event of events" [routerLink]="['/events', event.id]">
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
            <p class="event-type">{{ event.event_type }}</p>
            <p class="meta"><mat-icon>place</mat-icon> {{ event.venue }}, {{ event.city }}</p>
            <p class="meta"><mat-icon>calendar_today</mat-icon> {{ event.start_datetime | date:'dd/MM/yyyy HH:mm' }}</p>
            <p class="meta"><mat-icon>people</mat-icon> Χωρητικότητα: {{ event.capacity }}</p>
            <p class="price" *ngIf="event.ticket_types?.length">
              Από {{ getMinPrice(event.ticket_types) | currency:'EUR':'symbol':'1.2-2' }}
            </p>
          </mat-card-content>
          <mat-card-actions>
            <button mat-button color="primary" [routerLink]="['/events', event.id]">
              <mat-icon>info</mat-icon> Λεπτομέρειες
            </button>
          </mat-card-actions>
        </mat-card>
      </div>

      <mat-paginator
        *ngIf="total > pageSize"
        [length]="total"
        [pageSize]="pageSize"
        [pageIndex]="pageIndex"
        [pageSizeOptions]="[6, 12, 24]"
        (page)="onPageChange($event)">
      </mat-paginator>
    </div>
  `,
  styles: [`
    .filter-panel { margin-bottom: 24px; }
    .filter-form { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; padding: 16px 0; }
    .filter-actions { grid-column: 1 / -1; display: flex; gap: 8px; justify-content: flex-end; }
    .results-header { color: #666; margin-bottom: 12px; display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
    .active-filter { color: #303f9f; font-weight: 500; }
    .spinner-center { display: flex; justify-content: center; padding: 64px; }
    .empty-state { text-align: center; padding: 64px; color: #999; }
    .empty-state mat-icon { font-size: 64px; width: 64px; height: 64px; display: block; margin: 0 auto 16px; }
    .event-card { cursor: pointer; transition: box-shadow 0.2s, transform 0.2s; }
    .event-card:hover { box-shadow: 0 6px 24px rgba(0,0,0,0.15); transform: translateY(-2px); }
    .event-img { height: 180px; overflow: hidden; border-radius: 12px 12px 0 0; }
    .event-img img { width: 100%; height: 100%; object-fit: cover; }
    .event-img.placeholder { background: linear-gradient(135deg, #303f9f, #5c6bc0);
      display: flex; align-items: center; justify-content: center; }
    .event-img.placeholder mat-icon { font-size: 56px; width: 56px; height: 56px; color: rgba(255,255,255,0.7); }
    .categories { display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 8px; }
    h3 { font-size: 1.05rem; font-weight: 500; margin: 8px 0 4px; }
    .event-type { color: #666; font-size: 0.85rem; margin: 0 0 8px; }
    .meta { display: flex; align-items: center; gap: 4px; color: #666; font-size: 0.85rem; margin: 3px 0; }
    .meta mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .price { color: #303f9f; font-weight: 600; font-size: 1rem; margin-top: 8px; }
    mat-paginator { margin-top: 24px; }
  `],
})
export class EventListComponent implements OnInit {
  events: any[] = [];
  categories: string[] = [];
  total = 0;
  loading = false;
  pageIndex = 0;
  pageSize = 12;
  activeTitleFilter = '';

  filterForm = this.fb.group({
    title: [''],
    category: [''],
    city: [''],
    date_from: [null],
    date_to: [null],
    price_min: [null],
    price_max: [null],
  });

  constructor(private api: ApiService, public auth: AuthService, private fb: FormBuilder) {}

  ngOnInit() {
    this.api.getCategories().subscribe((cats) => this.categories = cats);
    this.filterForm.valueChanges
      .pipe(debounceTime(300))
      .subscribe(() => {
        this.pageIndex = 0;
        this.load();
      });
    this.load();
  }

  load() {
    this.loading = true;
    const filter = this.buildFilter();
    this.activeTitleFilter = filter.title || '';

    this.api.getEvents(filter).subscribe({
      next: (res) => { this.events = res.events; this.total = res.total; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  private buildFilter() {
    const f = this.filterForm.value;
    const filter: any = { page: this.pageIndex + 1, limit: this.pageSize };
    const title = this.cleanText(f.title);
    const category = this.cleanText(f.category);
    const city = this.cleanText(f.city);
    const priceMin = this.cleanNumber(f.price_min);
    const priceMax = this.cleanNumber(f.price_max);

    if (title) filter.title = title;
    if (category) filter.category = category;
    if (city) filter.city = city;
    if (f.date_from) filter.date_from = this.toIsoDate(f.date_from);
    if (f.date_to) filter.date_to = this.toIsoDate(f.date_to);
    if (priceMin !== undefined) filter.price_min = priceMin;
    if (priceMax !== undefined) filter.price_max = priceMax;

    return filter;
  }

  private cleanText(value: unknown) {
    const text = String(value ?? '').trim();
    return text || undefined;
  }

  private cleanNumber(value: unknown) {
    if (value === null || value === undefined || value === '') return undefined;
    const number = Number(value);
    return Number.isFinite(number) ? number : undefined;
  }

  private toIsoDate(value: unknown) {
    const date = new Date(value as any);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  }

  applyFilters() { this.pageIndex = 0; this.load(); }
  resetFilters() { this.filterForm.reset(); this.pageIndex = 0; this.load(); }
  onPageChange(e: PageEvent) { this.pageIndex = e.pageIndex; this.pageSize = e.pageSize; this.load(); }
  getMinPrice(tts: any[]): number { return Math.min(...tts.map((t) => Number(t.price))); }
}
