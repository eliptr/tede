# EventHub - Εφαρμογή Διαχείρισης Εκδηλώσεων & Κρατήσεων
## ΤΕΔ 2026 - Τμήμα Πληροφορικής & Τηλεπικοινωνιών

---

## Τεχνολογίες

| Στρώμα | Τεχνολογία |
|--------|-----------|
| Backend | NestJS (Node.js) + TypeORM |
| Frontend | Angular 17 + Angular Material |
| Βάση Δεδομένων | MySQL / MariaDB |
| Auth | JWT (JSON Web Tokens) + Passport.js |
| Χάρτης | Leaflet + OpenStreetMap |
| Export | XML (xml2js), JSON |

---

## Προαπαιτούμενα

- **Node.js** >= 18
- **npm** >= 9
- **MySQL / MariaDB** >= 8

---


---

## SSL/TLS — Κρυπτογράφηση (Απαίτηση Εκφώνησης)

Όλες οι αλληλεπιδράσεις κρυπτογραφούνται μέσω SSL/TLS.

### Development (self-signed certificate)
Τα πιστοποιητικά βρίσκονται έτοιμα στο `backend/ssl/`. Δεν χρειάζεται καμία επιπλέον ενέργεια.
- Backend: `https://localhost:3000`
- Frontend: `https://localhost:4200`

> ℹ️ Ο browser θα εμφανίσει προειδοποίηση για self-signed cert → πατήστε "Αποδοχή κινδύνου".

### Production (Let's Encrypt)
```bash
sudo certbot --nginx -d yourdomain.gr
# Ενημερώστε το .env:
# SSL_KEY_PATH=/etc/letsencrypt/live/yourdomain.gr/privkey.pem
# SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.gr/fullchain.pem
# Χρησιμοποιήστε το nginx.conf που παρέχεται
```

## Εγκατάσταση & Εκτέλεση

### 1. Βάση Δεδομένων

```sql
CREATE DATABASE ted2026 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Backend

```bash
cd backend
cp .env.example .env   # Επεξεργαστείτε τις τιμές DB_USER, DB_PASSWORD κ.λπ.
npm install
npm run start:dev      # Development mode (auto-reload)
# ή
npm run build && npm start   # Production
```

Το backend τρέχει στο **http://localhost:3000**

Κατά την πρώτη εκτέλεση δημιουργείται αυτόματα ο διαχειριστής:
- Username: `admin`
- Password: `Admin1234!`

### 3. Frontend

```bash
cd frontend
npm install
npm start   # Development (proxy στο localhost:3000)
# ή
npm run build   # Production build → dist/
```

Το frontend τρέχει στο **http://localhost:4200**

---

## Δομή Project

```
ted2026/
├── backend/
│   ├── src/
│   │   ├── auth/           # JWT Auth, login, register
│   │   ├── users/          # Διαχείριση χρηστών (admin)
│   │   ├── events/         # CRUD εκδηλώσεων
│   │   ├── bookings/       # Κρατήσεις εισιτηρίων
│   │   ├── messages/       # Σύστημα μηνυμάτων
│   │   ├── export/         # Εξαγωγή XML/JSON
│   │   ├── recommendations/  # BMF Algorithm
│   │   └── entities/       # TypeORM Entities
│   └── uploads/            # Αποθήκευση φωτογραφιών
└── frontend/
    └── src/app/
        ├── core/           # Auth service, API service, Guards
        └── features/
            ├── auth/       # Welcome, Login, Register
            ├── home/       # Home + Recommendations
            ├── events/     # List, Detail, Form, MyEvents
            ├── bookings/   # My Bookings
            ├── messages/   # Inbox, Sent, Compose
            └── admin/      # Dashboard, User management
```

---

## REST API Endpoints

| Method | Endpoint | Περιγραφή | Ρόλος |
|--------|----------|-----------|-------|
| POST | /auth/register | Εγγραφή | Όλοι |
| POST | /auth/login | Σύνδεση | Όλοι |
| GET | /auth/profile | Προφίλ | Auth |
| GET | /users | Λίστα χρηστών | Admin |
| PATCH | /users/:id/status | Αλλαγή κατάστασης | Admin |
| PATCH | /users/:id/role | Αλλαγή ρόλου | Admin |
| GET | /events | Λίστα εκδηλώσεων (με φίλτρα) | Όλοι |
| GET | /events/:id | Λεπτομέρειες εκδήλωσης | Όλοι |
| POST | /events | Δημιουργία εκδήλωσης | Organizer |
| PATCH | /events/:id | Ενημέρωση εκδήλωσης | Organizer |
| PATCH | /events/:id/publish | Δημοσίευση | Organizer |
| PATCH | /events/:id/cancel | Ακύρωση | Organizer |
| DELETE | /events/:id | Διαγραφή | Organizer |
| POST | /bookings | Νέα κράτηση | Attendee |
| GET | /bookings/my | Κρατήσεις χρήστη | Auth |
| GET | /messages/inbox | Εισερχόμενα | Auth |
| GET | /messages/sent | Απεσταλμένα | Auth |
| POST | /messages | Αποστολή μηνύματος | Auth |
| GET | /recommendations | Συστάσεις (BMF) | Auth |
| GET | /export/xml | Εξαγωγή XML | Admin |
| GET | /export/json | Εξαγωγή JSON | Admin |

---

## Αλγόριθμος Συστάσεων - Biased Matrix Factorization

Υλοποιείται από το μηδέν στο `recommendations.service.ts`.

**Μοντέλο:** `r̂(u,i) = μ + b_u + b_i + p_u · q_i`

- **μ** = global mean rating
- **b_u** = user bias  
- **b_i** = item (event) bias  
- **p_u, q_i** = latent factor vectors (K=10)

**Ratings:** Κράτηση = 5, Επίσκεψη σελίδας = 2

**Εκπαίδευση:** SGD με L2 regularization (30 epochs)

**Fallback:** Αν ο χρήστης δεν έχει ιστορικό → εμφανίζονται οι πιο δημοφιλείς εκδηλώσεις.

---

## Recommendation dataset import

The relational event dataset is intentionally not copied into the repository because
the CSV files are large. Keep them on disk and import them into MySQL with:

```bash
cd backend
npm run import:dataset
```

The importer reads these files from `DATASET_DIR`:

- `users.csv`
- `events.csv`
- `event_interest.csv`
- `event_attendees.csv`
- `user_friends.csv`

Tune the imported sample size in `backend/.env`:

```env
DATASET_DIR=C:\Users\elipe\Downloads\dataset\rel_event_csvs
DATASET_MAX_USERS=5000
DATASET_MAX_EVENTS=5000
DATASET_MAX_INTERACTIONS=50000
DATASET_MAX_FRIENDS=20000
DATASET_PASSWORD=Dataset1234!
```

Imported users can log in as `dataset_user_<external_user_id>` with the
`DATASET_PASSWORD`. The BMF service combines imported dataset ratings with live
application bookings and event views.

---

## Ρόλοι Χρηστών

| Ρόλος | Δυνατότητες |
|-------|------------|
| **ADMIN** | Διαχείριση χρηστών, εξαγωγή δεδομένων, όλες οι ενέργειες |
| **ORGANIZER** | Δημιουργία/διαχείριση εκδηλώσεων, messaging |
| **ATTENDEE** | Αναζήτηση εκδηλώσεων, κρατήσεις, messaging |
| **Επισκέπτης** | Πλοήγηση & αναζήτηση μόνο (χωρίς login) |

---

## Σχεδιαστικές Αποφάσεις

1. **Pessimistic locking** στη δημιουργία κρατήσεων για αποφυγή race conditions
2. **Soft delete** μηνυμάτων (flags `deleted_by_sender/receiver`)
3. **TypeORM synchronize: true** για development (χρησιμοποιήστε migrations σε production)
4. **Multer** για upload φωτογραφιών — αποθηκεύονται τοπικά στον φάκελο `uploads/`
5. Το **OpenStreetMap** (Leaflet) φορτώνεται μόνο όταν η εκδήλωση έχει συντεταγμένες
