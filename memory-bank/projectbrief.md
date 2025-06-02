# Project Brief: Tigube v2 - Haustierbetreuungsplattform

## Projektübersicht

Tigube v2 ist eine moderne Web-Plattform zur Vermittlung von Haustierbetreuungsdiensten. Die Anwendung verbindet Haustierbesitzer mit vertrauenswürdigen Tierbetreuern in ihrer Nähe.

## Kernfunktionalitäten

### Hauptfeatures
- **Suchfunktion**: Benutzer können nach verschiedenen Betreuungsdiensten suchen
- **Standortbasierte Suche**: PLZ/Ort-basierte Filterung
- **Terminplanung**: Von/Bis-Datum für Betreuungszeiten
- **Service-Kategorien**: 
  - Hundebetreuung
  - Hundetagesbetreuung
  - Katzenbetreuung
  - Gassi-Service
  - Hausbesuche
  - Haussitting
- **Betreuer-Profile**: Detaillierte Profile der Tierbetreuer
- **Benutzerregistrierung**: Registrierung und Anmeldung für Nutzer

### Seitenstruktur
- Homepage mit Suchfunktion
- Suchseite mit Ergebnissen
- Betreuer-Profilseiten
- Registrierung/Anmeldung
- Rechtliche Seiten (Impressum, Datenschutz, AGB)
- Über uns, Kontakt, Hilfe

## Technische Basis

### Frontend-Stack
- **React 18** mit TypeScript
- **Vite** als Build-Tool
- **React Router** für Navigation
- **Tailwind CSS** für Styling
- **Lucide React** für Icons
- **Headless UI** für UI-Komponenten

### State Management & Utilities
- **Zustand** für State Management
- **date-fns** für Datumsverarbeitung
- **clsx** und **tailwind-merge** für CSS-Klassen

### Backend/Services
- **Supabase** für Backend-Services (Authentifizierung, Datenbank, API)
- Vollständige Backend-as-a-Service Lösung

## Projektstruktur

```
src/
├── components/
│   ├── layout/     # Layout-Komponenten
│   └── ui/         # UI-Komponenten
├── pages/          # Seiten-Komponenten
├── data/           # Mock-Daten
└── lib/            # Utilities
```

## Zielgruppe

### Primäre Nutzer
1. **Haustierbesitzer**: Suchen vertrauensvolle Betreuung für ihre Tiere
2. **Tierbetreuer**: Bieten ihre Dienste an und verwalten Profile

## Geschäftsziele

1. **Vertrauen schaffen**: Sichere Vermittlung zwischen Besitzern und Betreuern
2. **Benutzerfreundlichkeit**: Intuitive Suche und Buchung
3. **Lokale Vernetzung**: Regionale Tierbetreuer-Community aufbauen
4. **Qualitätssicherung**: Verifizierte und bewertete Betreuer

## Aktuelle Version

- **Version**: 0.1.0
- **Status**: Entwicklung
- **Plattform**: Web (React SPA)
- **Deployment**: Vite-basiert

## Nächste Schritte

1. Vollständige Implementierung der Suchfunktionalität
2. Integration der Backend-Services (Supabase)
3. Betreuer-Profil-Management
4. Buchungs- und Zahlungssystem
5. Bewertungs- und Feedback-System