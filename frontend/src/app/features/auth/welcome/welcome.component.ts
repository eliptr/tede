import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule],
  template: `
    <div class="hero">
      <div class="hero-content">
        <mat-icon class="hero-icon">event</mat-icon>
        <h1>Καλώς ήρθατε στο EventHub</h1>
        <p>Ανακαλύψτε, διοργανώστε και κάντε κράτηση για εκδηλώσεις σε όλη την Ελλάδα</p>
        <div class="hero-actions">
          <a mat-raised-button color="primary" routerLink="/register">
            <mat-icon>person_add</mat-icon> Εγγραφή
          </a>
          <a mat-raised-button color="accent" routerLink="/login">
            <mat-icon>login</mat-icon> Σύνδεση
          </a>
          <a mat-stroked-button routerLink="/events" style="color:white; border-color:white">
            <mat-icon>search</mat-icon> Εκδηλώσεις
          </a>
        </div>
      </div>
    </div>

    <div class="features container">
      <div class="feature-card">
        <mat-icon>event_available</mat-icon>
        <h3>Δημιουργήστε Εκδηλώσεις</h3>
        <p>Οργανώστε συναυλίες, σεμινάρια, αθλητικές εκδηλώσεις και πολλά άλλα.</p>
      </div>
      <div class="feature-card">
        <mat-icon>confirmation_number</mat-icon>
        <h3>Κάντε Κρατήσεις</h3>
        <p>Εύκολη κράτηση εισιτηρίων για τις αγαπημένες σας εκδηλώσεις.</p>
      </div>
      <div class="feature-card">
        <mat-icon>recommend</mat-icon>
        <h3>Εξατομικευμένες Συστάσεις</h3>
        <p>Αλγόριθμος AI που προτείνει εκδηλώσεις βάσει των ενδιαφερόντων σας.</p>
      </div>
    </div>
  `,
  styles: [`
    .hero {
      background: linear-gradient(135deg, #303f9f 0%, #1a237e 100%);
      color: white;
      padding: 80px 16px;
      text-align: center;
    }
    .hero-icon { font-size: 72px; width: 72px; height: 72px; opacity: 0.9; }
    .hero h1 { font-size: 2.5rem; margin: 16px 0 8px; }
    .hero p { font-size: 1.1rem; opacity: 0.85; margin-bottom: 32px; }
    .hero-actions { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 24px;
      padding: 48px 16px;
    }
    .feature-card {
      text-align: center;
      padding: 32px 24px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    .feature-card mat-icon { font-size: 48px; width: 48px; height: 48px; color: #303f9f; }
    .feature-card h3 { font-size: 1.2rem; margin: 16px 0 8px; }
    .feature-card p { color: #666; line-height: 1.6; }
  `],
})
export class WelcomeComponent {}
