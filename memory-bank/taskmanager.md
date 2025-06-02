# Tigube v2 - Taskmanager

## Offene Aufgaben nach Priorität

### 🔴 Kritische Aufgaben (Hohe Priorität)

#### SearchPage-Implementierung
- [ ] Suchergebnisse-Anzeige
- [ ] Betreuer-Cards
- [ ] Filter-Sidebar
- [ ] Sortierungsoptionen
- [ ] Pagination
- [ ] "Keine Ergebnisse"-State
- [ ] Loading-States

#### Mock-Daten-System
- [ ] Betreuer-Datenmodell definieren
- [ ] Mock-Daten für Betreuer erstellen (20-30 Mock-Betreuer)
- [ ] Mock-API-Layer
- [ ] Daten-Utilities

#### Betreuer-Profil-Seite
- [ ] Profil-Layout
- [ ] Betreuer-Informationen
- [ ] Service-Details
- [ ] Verfügbarkeitskalender
- [ ] Bewertungen-Sektion
- [ ] Kontakt-Formular
- [ ] Buchungs-Button

### 🟡 Wichtige Aufgaben (Mittlere Priorität)

#### Authentifizierung
- [ ] Supabase Auth Setup
- [ ] Login-Formular
- [ ] Registrierungs-Formular
- [ ] Passwort-Reset
- [ ] Protected Routes mit JWT-Validierung
- [ ] User Context/State
- [ ] Logout-Funktionalität
- [ ] Row Level Security Policies

#### Backend-Integration
- [ ] Supabase-Projekt erstellen und konfigurieren
- [ ] Environment Variables für Supabase URL und API-Keys einrichten
- [ ] PostgreSQL-Datenbank-Schema definieren
- [ ] Supabase Client Integration
- [ ] API-Service-Layer
- [ ] Error-Handling
- [ ] Loading-States
- [ ] Real-time Subscriptions

#### Erweiterte UI-Komponenten
- [ ] Navigation-Header
- [ ] Footer
- [ ] Breadcrumbs
- [ ] Tabs
- [ ] Accordions
- [ ] Tooltips
- [ ] Notifications/Toasts
- [ ] Button-Komponente erweitern
- [ ] Card-Komponenten für Betreuer
- [ ] Form-Komponenten standardisieren

#### Homepage-Erweiterungen
- [ ] Weitere Sektionen (Features, Testimonials, etc.)

### 🟢 Nice-to-Have Aufgaben (Niedrige Priorität)

#### Erweiterte Suchfunktionen
- [ ] Geocoding für Standortsuche
- [ ] Kartenansicht
- [ ] Radius-Suche
- [ ] Gespeicherte Suchen
- [ ] Suchvorschläge
- [ ] Erweiterte Filter (Preis, Bewertung, etc.)
- [ ] Sortierungsoptionen

#### Buchungssystem
- [ ] Buchungsanfragen
- [ ] Kalender-Integration
- [ ] Zahlungsabwicklung
- [ ] Buchungsbestätigungen
- [ ] Stornierungen

#### Bewertungssystem
- [ ] Bewertungen abgeben
- [ ] Bewertungen anzeigen
- [ ] Durchschnittsbewertungen
- [ ] Bewertungsfilter

#### Mobile Optimierung
- [ ] Progressive Web App Features
- [ ] Offline-Funktionalität
- [ ] Push-Benachrichtigungen

#### Testing
- [ ] Testing-Framework integrieren (Jest/Vitest)
- [ ] Unit-Tests implementieren
- [ ] Integration-Tests
- [ ] E2E-Tests

#### CI/CD
- [ ] CI/CD-Pipeline aufsetzen

## Sprint-Planung

### Sprint 1: Grundlegende Suchfunktionalität (1-2 Wochen)
1. **Mock-Daten erstellen** (2-3 Tage)
   - Betreuer-Datenmodell
   - 20-30 Mock-Betreuer
   - Service-Kategorien

2. **SearchPage implementieren** (3-4 Tage)
   - Suchergebnisse anzeigen
   - Grundlegende Filterung
   - Responsive Design

3. **Betreuer-Cards entwickeln** (1-2 Tage)
   - Card-Komponente
   - Betreuer-Informationen
   - Link zu Profil

### Sprint 2: Betreuer-Profile (1-2 Wochen)
1. **BetreuerProfilePage** (4-5 Tage)
   - Vollständiges Profil-Layout
   - Alle Betreuer-Informationen
   - Responsive Design

2. **Navigation verbessern** (1-2 Tage)
   - Header-Navigation
   - Breadcrumbs
   - Footer

### Sprint 3: Backend-Integration (2-3 Wochen)
1. **Supabase Setup** (2-3 Tage)
   - Projekt-Konfiguration
   - PostgreSQL-Schema
   - Supabase Client Integration
   - Row Level Security

2. **Authentifizierung** (3-4 Tage)
   - Login/Register mit Supabase Auth
   - Protected Routes mit JWT
   - User-State Management
   - Real-time Subscriptions

## Offene Fragen und Entscheidungen

### Geschäftsmodell
- [ ] Wie wird die Plattform monetarisiert?
- [ ] Provisionsmodell für Buchungen?
- [ ] Premium-Features für Betreuer?

### Verifizierung
- [ ] Wie werden Betreuer verifiziert?
- [ ] Welche Dokumente sind erforderlich?
- [ ] Automatisierte vs. manuelle Prüfung?

### Rechtliche Aspekte
- [ ] Haftungsfragen bei Schäden
- [ ] Versicherungsschutz
- [ ] Datenschutz-Compliance (DSGVO)

### Skalierung
- [ ] Geografische Expansion
- [ ] Mehrsprachigkeit
- [ ] Performance bei hoher Nutzerzahl

## Technische Schulden

- [ ] Mock-Daten fehlen
- [ ] Unvollständige Komponenten
- [ ] Fehlende Tests

---

*Letzte Aktualisierung: Automatisch generiert aus progress.md und activeContext.md*