# System Patterns: Tigube v2

## Systemarchitektur

### Frontend-Architektur

#### React SPA (Single Page Application)
- **Framework**: React 18 mit TypeScript
- **Build-Tool**: Vite für schnelle Entwicklung und Builds
- **Routing**: React Router DOM für clientseitiges Routing
- **State Management**: Zustand für globalen State

#### Komponentenarchitektur
```
src/
├── components/
│   ├── layout/          # Layout-Komponenten (Header, Footer, Navigation)
│   └── ui/              # Wiederverwendbare UI-Komponenten
├── pages/               # Seiten-Komponenten (Route-Handler)
├── data/                # Mock-Daten und API-Interfaces
├── lib/                 # Utility-Funktionen
└── App.tsx              # Haupt-App-Komponente mit Routing
```

### Design Patterns

#### 1. Lazy Loading Pattern
```typescript
// Alle Seiten werden lazy geladen für bessere Performance
const HomePage = lazy(() => import('./pages/HomePage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
```

#### 2. Layout Pattern
- Zentrale Layout-Komponente umhüllt alle Seiten
- Konsistente Navigation und Footer
- Responsive Design durch Tailwind CSS

#### 3. Form Handling Pattern
- Kontrollierte Komponenten für Formulare
- Event-Handler für Form-Submission
- URL-Parameter für Suchfilter

#### 4. Component Composition
- Kleine, wiederverwendbare UI-Komponenten
- Props-basierte Konfiguration
- Separation of Concerns

### Styling-Architektur

#### Tailwind CSS Utility-First
- **Vorteile**: Konsistente Design-Tokens, schnelle Entwicklung
- **Konfiguration**: tailwind.config.js für Custom-Themes
- **Responsive Design**: Mobile-First Approach
- **Component Libraries**: Headless UI für komplexe Komponenten

#### CSS-Klassen-Management
- **clsx**: Bedingte Klassen-Zusammenstellung
- **tailwind-merge**: Konfliktauflösung bei Tailwind-Klassen

### State Management

#### Zustand Store Pattern
- Globaler State für:
  - Benutzer-Authentifizierung
  - Suchfilter
  - Betreuer-Daten
  - UI-State (Loading, Errors)

#### Local State Pattern
- React useState für:
  - Formular-Inputs
  - Komponenten-spezifische UI-States
  - Temporäre Daten

### Routing-Architektur

#### Route-Struktur
```typescript
/                    # HomePage
/suche              # SearchPage
/betreuer/:id       # BetreuerProfilePage
/registrieren       # RegisterPage
/anmelden          # LoginPage
/impressum         # ImpressumPage
/datenschutz       # DatenschutzPage
/agb               # AgbPage
/ueber-uns         # AboutPage
/kontakt           # ContactPage
/hilfe             # HelpPage
*                  # NotFoundPage
```

#### URL-Parameter Pattern
- Query-Parameter für Suchfilter
- Dynamic Routes für Betreuer-Profile
- Programmatische Navigation mit useNavigate

### Backend-Integration

#### Service Layer Pattern
- **Supabase**: Hauptbackend für Authentifizierung und PostgreSQL-Datenbank
- **Supabase Client**: JavaScript-Client für API-Calls
- API-Abstraktionsschicht für Backend-Calls
- Real-time Subscriptions für Live-Updates

### Performance Patterns

#### Code Splitting
- Lazy Loading für alle Routen
- Suspense mit LoadingSpinner
- Chunk-basierte Builds durch Vite

#### Asset Optimization
- SVG-Icons durch Lucide React
- Optimierte Bilder in public/Image/
- Vite-basierte Asset-Optimierung

### Error Handling Patterns

#### Error Boundaries
- React Error Boundaries für Komponenten-Fehler
- Fallback-UI für fehlerhafte Komponenten

#### Form Validation
- Client-seitige Validierung
- Required-Felder für kritische Inputs
- User-freundliche Fehlermeldungen

### Development Patterns

#### TypeScript Integration
- Strikte Typisierung für alle Komponenten
- Interface-Definitionen für Props
- Type-sichere API-Calls

#### ESLint Configuration
- React-spezifische Linting-Regeln
- TypeScript ESLint Integration
- Code-Qualitäts-Standards

### Komponentendesign-Prinzipien

#### 1. Single Responsibility
- Jede Komponente hat eine klare Aufgabe
- UI-Komponenten sind rein präsentational
- Business-Logik in Custom Hooks

#### 2. Composition over Inheritance
- Komponenten-Komposition statt Vererbung
- Props-basierte Konfiguration
- Render Props und Children Pattern

#### 3. Accessibility First
- Semantisches HTML
- ARIA-Labels und Rollen
- Keyboard-Navigation
- Screen-Reader-Unterstützung

### Datenfluss-Architektur

#### Unidirektionaler Datenfluss
1. **State** → Komponenten-Props
2. **Events** → State-Updates
3. **Re-Rendering** → UI-Updates

#### API-Integration Pattern
```typescript
// Typische API-Call-Struktur
const fetchBetreuer = async (filters: SearchFilters) => {
  // API-Call mit Error Handling
  // State-Update
  // Loading-State-Management
};
```

### Security Patterns

#### Input Sanitization
- Validierung aller Benutzereingaben
- XSS-Schutz durch React's eingebaute Mechanismen
- CSRF-Schutz durch Backend-Integration

#### Authentication Flow
- Supabase Authentication mit Row Level Security
- Protected Routes mit JWT-Token-Validierung
- Session-Management über Supabase Client
- Automatische Token-Refresh