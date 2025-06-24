# Tigube v2 - Pet Care Platform

Eine moderne Plattform zur Vermittlung zwischen Haustierbesitzern und Tierbetreuern.

## 🚨 WICHTIG: E-Mail-Änderung Problem lösen

**Problem:** E-Mail-Änderung führt zu Logout und funktioniert nicht.

**Ursache:** Supabase Redirect-URLs sind nicht konfiguriert!

### ✅ Lösung - Supabase Dashboard konfigurieren:

1. **Gehe zu Ihrem Supabase Dashboard**
2. **Navigiere zu: Authentication → URL Configuration** 
3. **Füge diese Redirect URLs hinzu:**

```
# Development URLs:
http://localhost:5173/**
http://localhost:5174/**
http://127.0.0.1:5173/**

# Production URLs (ersetze mit Ihrer Domain):
https://yourdomain.com/**
https://www.yourdomain.com/**
```

4. **Setze die Site URL:**
   - Development: `http://localhost:5173`
   - Production: `https://yourdomain.com`

### 🔍 So testest du es:

1. Starte den Dev-Server: `npm run dev`
2. Gehe zu Dashboard → Einstellungen → E-Mail ändern
3. In der Debug-Sektion siehst du die URLs die konfiguriert werden müssen
4. Ändere deine E-Mail
5. Prüfe dein Postfach und klicke den Link
6. Du solltest zu localhost zurückgeleitet werden UND eingeloggt bleiben

---

## 🚀 Quick Start

### Installation

```bash
# Repository klonen
git clone [repository-url]
cd tigube_v2

# Dependencies installieren
npm install

# Environment Setup
cp .env.example .env
# Bearbeite .env mit deinen Supabase Credentials

# Development Server starten
npm run dev
```

### Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🏗️ Technologie Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS + Headless UI
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **State Management:** Zustand
- **Icons:** Lucide React
- **Routing:** React Router v6

## 📁 Projekt Struktur

```
src/
├── components/          # Wiederverwendbare UI-Komponenten
├── pages/              # Seiten-Komponenten
├── lib/                # Utilities, Services, Hooks
├── data/               # Mock-Daten und Konstanten
└── hooks/              # Custom React Hooks
```

## 🔧 Verfügbare Scripts

```bash
npm run dev          # Development Server
npm run build        # Production Build
npm run preview      # Preview Build
npm run lint         # ESLint
```

## 🚀 Deployment

Die Anwendung kann auf Vercel, Netlify oder anderen Static-Hosting-Anbietern deployed werden:

```bash
npm run build
# Deploye den dist/ Ordner
```

## 📝 Features

### Für Haustierbesitzer:
- ✅ Profil-Management mit Haustier-Verwaltung
- ✅ Betreuer-Suche und Kontaktaufnahme  
- ✅ Dashboard mit gespeicherten Betreuern
- ✅ Chat-System für Kommunikation
- ✅ Datenschutz-Einstellungen

### Für Betreuer:
- ✅ Detailliertes Profil mit Services
- ✅ Verfügbarkeits-Kalender
- ✅ Kunden-Management
- ✅ Bewertungssystem
- ✅ Premium-Features für gewerbliche Anbieter

### Technische Features:
- ✅ Responsive Design (Mobile-First)
- ✅ TypeScript für Type Safety
- ✅ Real-time Chat mit Supabase
- ✅ Bild-Upload und -Verwaltung
- ✅ Sichere Authentifizierung
- ✅ Row Level Security (RLS)

## 🔐 Sicherheit

- Alle API-Anfragen sind authentifiziert
- Row Level Security auf Datenbankebene
- Input-Validierung client- und serverseitig
- Sichere Datei-Uploads
- HTTPS-only in Produktion

## 🤝 Entwicklung

### Coding Standards:
- TypeScript Strict Mode
- ESLint Konfiguration
- Functional Components mit Hooks
- Tailwind CSS Utilities
- Responsive Design

### Git Workflow:
- Main Branch für Produktion
- Feature Branches für Entwicklung
- Commit-Messages auf Deutsch

## 📞 Support

Bei Problemen mit der E-Mail-Funktionalität:
1. Prüfe die Supabase Redirect-URL Konfiguration (siehe oben)
2. Schaue in die Browser-Konsole für Debug-Informationen
3. Prüfe das Supabase Dashboard für Auth-Logs

tigube_v2
