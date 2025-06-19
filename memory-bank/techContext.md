# Tech Context: Tigube v2

## Technologie-Stack

### Frontend-Technologien

#### Core Framework
- **React 18.3**: Moderne React-Features mit Concurrent Features
- **TypeScript 5.2**: Strikte Typisierung für bessere Code-Qualität
- **Vite 5.1**: Schneller Dev-Server und optimierte Builds
- **React Router DOM 6**: Declarative Routing mit Lazy Loading

#### Styling & UI
- **Tailwind CSS 3.4**: Utility-First CSS Framework
- **Headless UI**: Accessible UI-Komponenten ohne Styling
- **Lucide React**: Moderne Icon-Library
- **clsx + tailwind-merge**: Intelligente CSS-Klassen-Komposition

#### State Management
- **Zustand 4.5**: Lightweight State Management für globalen State
- **React Context**: AuthContext für User-Session und Subscription-State
- **Custom Hooks**: useSubscription, useFeatureAccess, useCurrentUsage

### Backend & Database

#### Backend-as-a-Service
- **Supabase**: PostgreSQL + Authentication + Real-time + Edge Functions
- **PostgreSQL 15**: Relationale Datenbank mit Row Level Security
- **Supabase Auth**: JWT-basierte Authentifizierung mit Social Logins
- **Supabase Real-time**: WebSocket-basierte Live-Updates

#### Database Schema
```sql
-- Core Tables
users                    # Benutzerprofile mit street-Feld
conversations           # Chat-Gespräche
messages                # Chat-Nachrichten
owner_caretaker_connections  # Betreuer-Client-Verbindungen

-- Subscription System (NEU)
subscriptions           # User-Subscriptions mit Plan-Info
usage_tracking          # Feature-Nutzung und Limits
caretaker_images        # Image-Upload-Tracking
billing_history         # Payment-Historie
owner_preferences       # Datenschutz-Einstellungen mit share_settings
```

#### Row Level Security (RLS)
- Vollständige RLS-Policies für alle Tabellen
- User-basierte Zugriffskontrolle
- Sichere Multi-Tenant-Architektur

### Payment Integration

#### Stripe Integration
- **@stripe/stripe-js**: Frontend Stripe SDK
- **Stripe API**: Server-side Payment Processing
- **Pricing**: Owner Premium €4,90/Monat, Caretaker Professional €12,90/Monat
- **Test Environment**: Vollständig konfiguriert mit Test-Karten

#### Supabase Edge Functions (Deno Runtime)
```typescript
/supabase/functions/
├── create-checkout-session/    # Stripe Checkout Session Creation
├── validate-checkout-session/  # Payment Success Validation
└── stripe-webhook/            # Webhook Event Handling
```

#### Payment Security
- Server-side Session Creation für sichere Checkout-URLs
- Webhook-Signatur-Validierung für Event-Authenticity
- Automatic Subscription Updates nach erfolgreicher Zahlung

### Development Tools

#### Code-Qualität
- **ESLint**: Code-Linting mit React/TypeScript Rules
- **TypeScript Strict Mode**: Maximale Type-Safety
- **Vite Dev Tools**: Hot Module Replacement für schnelle Entwicklung

#### Database-Integration
- **Supabase CLI**: Database Migrations und Type Generation
- **Auto-generated Types**: TypeScript-Definitionen aus Database Schema
- **Database Migrations**: Versionierte Schema-Änderungen

### Hosting & Deployment

#### Frontend Hosting
- **Vercel**: Primäre Hosting-Plattform (konfiguriert)
- **Alternative**: Netlify für Backup-Deployment
- **CDN**: Automatische Asset-Optimierung und Caching

#### Backend Infrastructure
- **Supabase Cloud**: Managed PostgreSQL + Auth + Functions
- **Edge Functions**: Global deployment für niedrige Latenz
- **Real-time Infrastructure**: WebSocket-Handling durch Supabase

### Environment Configuration

#### Environment Variables
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Stripe Configuration (NEU)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...           # Server-side only
STRIPE_WEBHOOK_SECRET=whsec_...         # Edge Functions only
```

#### Build Configuration
- **Vite Config**: Optimized für Production-Builds
- **TypeScript Config**: Strict-Mode mit Path-Mapping
- **Tailwind Config**: Custom Design-System-Integration

### Dependencies

#### Core Dependencies
```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^6.21.0",
  "typescript": "^5.2.2",
  "@supabase/supabase-js": "^2.38.0",
  "zustand": "^4.5.0"
}
```

#### UI & Styling
```json
{
  "tailwindcss": "^3.4.0",
  "@headlessui/react": "^1.7.17",
  "lucide-react": "^0.298.0",
  "clsx": "^2.0.0",
  "tailwind-merge": "^2.2.0"
}
```

#### Payment Integration (NEU)
```json
{
  "@stripe/stripe-js": "^2.0.0",
  "stripe": "^14.0.0"
}
```

#### Development Dependencies
```json
{
  "@types/react": "^18.2.43",
  "@types/react-dom": "^18.2.17",
  "@vitejs/plugin-react": "^4.2.1",
  "vite": "^5.1.0",
  "eslint": "^8.55.0"
}
```

### Subscription System Architecture

#### Feature Matrix System
```typescript
interface FeatureMatrix {
  owner: {
    starter: { contact_requests: { limit: 3 }, reviews: { enabled: false } },
    premium: { contact_requests: { unlimited: true }, reviews: { enabled: true } }
  },
  caretaker: {
    starter: { environment_images: { limit: 0 } },
    professional: { environment_images: { limit: 6 }, premium_badge: { enabled: true } }
  }
}
```

#### Usage Tracking
- **Real-time Tracking**: Automatische Feature-Nutzung-Verfolgung
- **Monthly Limits**: Reset-Logic für monatliche Limits
- **Beta Protection**: Alle Limits während Beta-Phase (bis 31.10.2025) aufgehoben

#### Services Architecture
```typescript
// Service Layer für Business Logic
SubscriptionService     # Subscription Management
FeatureGateService     # Feature-Zugriffskontrolle  
UsageTrackingService   # Feature-Nutzung-Tracking
StripeService          # Payment Processing
```

### Database Performance

#### Optimizations
- **Indizes**: Optimierte Queries für Subscription- und Chat-Tabellen
- **Connection Pooling**: Supabase-managed für hohe Concurrent-Users
- **Real-time Subscriptions**: Effiziente WebSocket-Verbindungen

#### Migrations
```sql
-- Beispiel: Subscription System Migration
20250129000000_create_subscription_system.sql
-- Street Field Integration
20250113_owner_caretaker_connections.sql
20250114_add_share_settings.sql
```

### Security Implementation

#### Authentication Security
- **JWT Tokens**: Sichere Session-Management
- **Row Level Security**: Database-Level Access Control
- **Rate Limiting**: Schutz vor Missbrauch (30s Limit für Profil-Zugriffe)

#### Payment Security
- **Server-side Processing**: Alle kritischen Payment-Operationen
- **Webhook Validation**: Stripe-Signatur-Verifizierung
- **Secure Environment Variables**: Keine Secrets im Client-Code

#### Data Privacy
- **GDPR Compliance**: Datenschutz-konforme Datenverarbeitung
- **Share Settings**: Granulare Kontrolle über Datenfreigabe
- **Secure Deletion**: Vollständige Chat-Löschung mit CASCADE

### Development Workflow

#### Local Development
```bash
# Setup
npm install
npm run dev                    # Vite Dev Server (Port 5174)

# Database
npx supabase start            # Local Supabase Instance
npx supabase db reset         # Reset Database with Migrations
npx supabase gen types typescript --local > src/lib/supabase/database.types.ts

# Edge Functions  
npx supabase functions serve  # Local Functions Development
```

#### Production Deployment
```bash
# Frontend Build
npm run build                 # Optimized Production Build
npm run preview              # Preview Production Build

# Database Deployment
npx supabase db push         # Apply Migrations to Production
npx supabase functions deploy # Deploy Edge Functions
```

### Performance Characteristics

#### Bundle Size
- **Initial Bundle**: ~250KB (gzipped)
- **Lazy Loaded Routes**: 20-50KB per Page
- **Stripe SDK**: Dynamically loaded nur bei Payment-Flow

#### Runtime Performance
- **Feature Checks**: < 50ms (mit in-memory Caching)
- **Database Queries**: < 100ms (optimierte Indizes)
- **Real-time Updates**: < 200ms (WebSocket-basiert)
- **Payment Processing**: < 2s (Stripe Checkout Session)

### Monitoring & Debugging

#### Debug Tools
- **`/debug/subscriptions`**: Admin-Dashboard für Subscription-Management
- **`/debug/subscription-status`**: User-Dashboard für detaillierte Status-Anzeige
- **Supabase Dashboard**: Real-time Database und Auth Monitoring
- **Stripe Dashboard**: Payment und Subscription Analytics

#### Error Handling
- **React Error Boundaries**: Graceful Component-Error-Recovery
- **API Error Handling**: Structured Error-Responses mit User-freundlichen Messages
- **Payment Error Recovery**: Fallback-Strategien bei Stripe-Fehlern
- **Real-time Connection Recovery**: Automatische Reconnection bei WebSocket-Drops