# Tech Context: Tigube v2

## Technologie-Stack

### Frontend-Framework
- **React 18.3.1**: Moderne React-Version mit Concurrent Features
- **TypeScript 5.5.3**: Statische Typisierung für bessere Code-Qualität
- **Vite 5.4.2**: Schneller Build-Tool und Dev-Server

### UI & Styling
- **Tailwind CSS 3.4.1**: Utility-First CSS Framework
- **Headless UI 1.7.17**: Unstyled, accessible UI-Komponenten
- **Lucide React 0.344.0**: Moderne Icon-Library
- **PostCSS 8.4.35**: CSS-Postprocessing
- **Autoprefixer 10.4.18**: Automatische Vendor-Prefixes

### Routing & Navigation
- **React Router DOM 6.20.0**: Client-seitiges Routing
- **React Router**: Deklaratives Routing für React

### State Management
- **Zustand 4.4.6**: Leichtgewichtige State-Management-Library
- **React Hooks**: Eingebaute State-Management-Patterns

### Utilities
- **clsx 2.0.0**: Bedingte CSS-Klassen-Zusammenstellung
- **tailwind-merge 2.0.0**: Intelligente Tailwind-Klassen-Zusammenführung
- **date-fns 3.0.0**: Moderne Datums-Utility-Library

### Backend & Services
- **Supabase 2.23.4**: Backend-as-a-Service
  - Authentication (Row Level Security)
  - PostgreSQL Database
  - Real-time Subscriptions
  - Edge Functions
  - Storage
  - Auto-generated APIs

## Development Setup

### Build-System
- **Vite**: Entwicklungsserver und Build-Tool
- **ES Modules**: Native ES-Module-Unterstützung
- **Hot Module Replacement**: Schnelle Entwicklung
- **TypeScript**: Integrierte TS-Unterstützung

### Code-Qualität
- **ESLint 9.9.1**: JavaScript/TypeScript Linting
- **TypeScript ESLint 8.3.0**: TypeScript-spezifische Regeln
- **React ESLint Plugins**:
  - eslint-plugin-react-hooks 5.1.0-rc.0
  - eslint-plugin-react-refresh 0.4.11

### Package Management
- **npm**: Standard Node.js Package Manager
- **package-lock.json**: Deterministische Dependency-Versionen

## Entwicklungsumgebung

### Verfügbare Scripts
```json
{
  "dev": "vite",           // Entwicklungsserver starten
  "build": "vite build",   // Produktions-Build erstellen
  "lint": "eslint .",      // Code-Linting ausführen
  "preview": "vite preview" // Build-Preview lokal testen
}
```

### Development Server
- **Port**: 5174 (Standard Vite-Port)
- **Hot Reload**: Automatische Browser-Aktualisierung
- **TypeScript**: Live-Typ-Checking
- **ESLint**: Live-Linting-Feedback

## Projektstruktur

### Verzeichnis-Layout
```
tigube_v2/
├── public/                 # Statische Assets
│   ├── Image/
│   │   └── Logos/         # Logo-Dateien
│   ├── favicon.png        # Favicon
│   └── favicon.png.svg    # SVG-Favicon
├── src/
│   ├── components/        # React-Komponenten
│   │   ├── layout/       # Layout-Komponenten
│   │   └── ui/           # UI-Komponenten
│   ├── pages/            # Seiten-Komponenten
│   ├── data/             # Mock-Daten
│   ├── lib/              # Utility-Funktionen
│   ├── App.tsx           # Haupt-App-Komponente
│   ├── main.tsx          # App-Entry-Point
│   ├── index.css         # Globale Styles
│   └── vite-env.d.ts     # Vite-Typ-Definitionen
├── memory-bank/          # Projekt-Dokumentation
└── Konfigurationsdateien
```

### Konfigurationsdateien
- **vite.config.ts**: Vite-Konfiguration
- **tailwind.config.js**: Tailwind-CSS-Konfiguration
- **postcss.config.js**: PostCSS-Konfiguration
- **tsconfig.json**: TypeScript-Hauptkonfiguration
- **tsconfig.app.json**: App-spezifische TS-Konfiguration
- **tsconfig.node.json**: Node.js-spezifische TS-Konfiguration
- **eslint.config.js**: ESLint-Konfiguration

## Technische Constraints

### Browser-Unterstützung
- **Moderne Browser**: Chrome, Firefox, Safari, Edge (aktuelle Versionen)
- **ES2020+**: Moderne JavaScript-Features
- **CSS Grid & Flexbox**: Moderne Layout-Techniken

### Performance-Anforderungen
- **Bundle-Größe**: Optimiert durch Code-Splitting
- **Loading-Zeit**: Lazy Loading für Routen
- **Runtime-Performance**: React 18 Concurrent Features

### Accessibility
- **WCAG 2.1**: Web Content Accessibility Guidelines
- **Semantic HTML**: Strukturiertes Markup
- **Keyboard Navigation**: Vollständige Tastatur-Unterstützung
- **Screen Reader**: Kompatibilität mit Assistive Technologies

## Dependencies-Management

### Produktions-Dependencies
```json
{
  "@headlessui/react": "^1.7.17",
  "@supabase/supabase-js": "^2.23.4",
  "clsx": "^2.0.0",
  "date-fns": "^3.0.0",
  "lucide-react": "^0.344.0",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^6.20.0",
  "tailwind-merge": "^2.0.0",
  "zustand": "^4.4.6"
}
```

### Entwicklungs-Dependencies
```json
{
  "@eslint/js": "^9.9.1",
  "@types/react": "^18.3.5",
  "@types/react-dom": "^18.3.0",
  "@vitejs/plugin-react": "^4.3.1",
  "autoprefixer": "^10.4.18",
  "eslint": "^9.9.1",
  "globals": "^15.9.0",
  "postcss": "^8.4.35",
  "supabase": "^2.23.4",
  "tailwindcss": "^3.4.1",
  "typescript": "^5.5.3",
  "vite": "^5.4.2"
}
```

## Deployment-Strategie

### Build-Prozess
1. **TypeScript-Kompilierung**: TS → JS
2. **Bundle-Erstellung**: Vite-Build
3. **Asset-Optimierung**: Minification, Compression
4. **Code-Splitting**: Automatische Chunk-Erstellung

### Hosting-Optionen
- **Vercel/Netlify**: Primäre Static-Hosting-Option
- **Supabase Edge Functions**: Serverless Functions
- **CDN**: Globale Asset-Verteilung

## Sicherheitsüberlegungen

### Frontend-Sicherheit
- **XSS-Schutz**: React's eingebaute Sanitization
- **HTTPS**: Sichere Datenübertragung
- **Environment Variables**: Sichere API-Key-Verwaltung
- **Content Security Policy**: CSP-Header für zusätzlichen Schutz

### API-Sicherheit
- **Supabase Row Level Security (RLS)**: Backend-Zugriffskontrolle
- **Supabase Auth**: Sichere Benutzer-Authentifizierung
- **CORS**: Cross-Origin-Request-Kontrolle
- **JWT-basierte Authentifizierung**: Sichere Token-Verwaltung