# System Patterns: Tigube v2

## Systemarchitektur

### Frontend-Architektur

#### React SPA (Single Page Application)
- **Framework**: React 18 mit TypeScript
- **Build-Tool**: Vite für schnelle Entwicklung und Builds
- **Routing**: React Router DOM für clientseitiges Routing
- **State Management**: Zustand für globalen State + AuthContext für User-Session

#### Komponentenarchitektur
```
src/
├── components/
│   ├── auth/             # Authentication Components (ProtectedRoute)
│   ├── chat/             # Chat-System (ChatWindow, MessageBubble, etc.)
│   ├── layout/           # Layout-Komponenten (Header, Footer, Navigation)
│   └── ui/               # UI-Komponenten (Subscription, Feature Gates, etc.)
├── pages/                # Seiten-Komponenten (Route-Handler)
├── hooks/                # Custom Hooks (useFeatureAccess, useSubscription)
├── lib/
│   ├── auth/             # AuthContext, Subscription Hooks
│   ├── services/         # Business Logic Services
│   ├── stripe/           # Payment Integration
│   └── supabase/         # Database Layer
└── App.tsx               # Haupt-App-Komponente mit Routing
```

### Design Patterns

#### 1. Lazy Loading Pattern
```typescript
// Alle Seiten werden lazy geladen für bessere Performance
const HomePage = lazy(() => import('./pages/HomePage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
```

#### 2. Layout Pattern
- Zentrale Layout-Komponente umhüllt alle Seiten
- Konsistente Navigation und Footer
- Responsive Design durch Tailwind CSS
- Protected Routes mit Authentication-Checks

#### 3. Feature Gate Pattern
```typescript
// Feature-Zugriff durch Service-Layer
const { hasAccess, usage, limit } = useFeatureAccess('contact_requests');

if (!hasAccess) {
  return <UpgradePrompt feature="contact_requests" />;
}
```

#### 4. Subscription Management Pattern
```typescript
// Zentralisierte Subscription-Logik
const { subscription, refreshSubscription } = useSubscription();
const isFeatureEnabled = subscription?.plan_type === 'premium';
```

### Styling-Architektur

#### Tailwind CSS Utility-First
- **Vorteile**: Konsistente Design-Tokens, schnelle Entwicklung
- **Konfiguration**: tailwind.config.js für Custom-Themes
- **Responsive Design**: Mobile-First Approach
- **Component Libraries**: Headless UI für komplexe Komponenten

#### CSS-Klassen-Management
- **clsx**: Bedingte Klassen-Zusammenstellung
- **tailwind-merge**: Konfliktauflösung bei Tailwind-Klassen

### State Management Architecture

#### AuthContext Pattern
```typescript
// Zentraler Authentication State mit Subscription Integration
interface AuthContextType {
  user: User | null;
  subscription: SubscriptionInfo | null;
  refreshSubscription: () => Promise<void>;
  signOut: () => Promise<void>;
}
```

#### Zustand Store Pattern
- Globaler State für:
  - Suchfilter und Ergebnisse
  - Betreuer-Daten Cache
  - UI-State (Loading, Errors)

#### Local State Pattern
- React useState für:
  - Formular-Inputs
  - Komponenten-spezifische UI-States
  - Temporäre Daten (z.B. Chat-Input)

### Routing-Architektur

#### Route-Struktur
```typescript
/                         # HomePage
/suche                   # SearchPage
/betreuer/:id            # BetreuerProfilePage
/owner/:userId           # OwnerPublicProfilePage (Protected)
/nachrichten             # MessagesPage (Protected)
/dashboard               # Owner/Caretaker Dashboard (Protected)
/mitgliedschaften        # PricingPage
/payment/success         # PaymentSuccessPage
/debug/subscriptions     # Admin Debug Tools
/debug/subscription-status # User Debug Tools
/registrieren            # RegisterPage
/anmelden               # LoginPage
*                        # NotFoundPage
```

#### Protected Route Pattern
```typescript
// Authentication-basierte Route-Protection
<Route 
  path="/nachrichten" 
  element={
    <ProtectedRoute>
      <MessagesPage />
    </ProtectedRoute>
  } 
/>
```

### Backend-Integration Patterns

#### Service Layer Architecture
```typescript
// Abstraktionsschicht für alle Backend-Operationen
class SubscriptionService {
  async getSubscription(userId: string): Promise<SubscriptionInfo>
  async trackFeatureUsage(feature: string): Promise<void>
  async checkFeatureAccess(feature: string): Promise<FeatureAccessResult>
}
```

#### Database Integration
- **Supabase**: PostgreSQL mit Row Level Security
- **Real-time**: Live-Updates für Chat und Notifications
- **Edge Functions**: Server-side Logic für Payments
- **TypeScript Integration**: Auto-generated Types aus Database Schema

### Payment Integration Patterns

#### Stripe Integration Architecture
```typescript
// Sichere Payment-Flows mit Server-side Validation
class StripeService {
  async createCheckoutSession(planType: string): Promise<{ url: string }>
  async validatePayment(sessionId: string): Promise<PaymentResult>
}
```

#### Edge Functions Pattern
```typescript
// Supabase Edge Functions für sichere Server-side Operations
/supabase/functions/
├── create-checkout-session/    # Stripe Checkout Creation
├── validate-checkout-session/  # Payment Validation  
└── stripe-webhook/            # Webhook Event Handling
```

### Security Patterns

#### Row Level Security (RLS)
```sql
-- Beispiel: Subscription-Zugriff nur für eigene Daten
CREATE POLICY "Users can read own subscription" ON subscriptions
FOR SELECT USING (auth.uid() = user_id);
```

#### Feature Gate Security
- **Client-side Gates**: UI-Blocking für bessere UX
- **Server-side Validation**: Sichere Feature-Zugriffskontrolle
- **Usage Tracking**: Automatische Limit-Überwachung

#### API Security
- **JWT Authentication**: Supabase Auth für sichere API-Calls
- **Rate Limiting**: Schutz vor Missbrauch
- **Input Validation**: Client- und Server-seitige Validierung

### Performance Patterns

#### Subscription Caching
```typescript
// In-Memory Caching für häufige Feature-Checks
const subscriptionCache = new Map<string, SubscriptionInfo>();
```

#### Code Splitting
- Lazy Loading für alle Routen
- Dynamic Imports für große Libraries (Stripe)
- Chunk-basierte Builds durch Vite

#### Database Optimization
- Indizes für häufige Subscription-Queries
- Optimierte RLS-Policies für Performance
- Connection Pooling durch Supabase

### Subscription System Patterns

#### Feature Matrix Pattern
```typescript
interface FeatureMatrix {
  [planType: string]: {
    [feature: string]: {
      enabled: boolean;
      limit?: number;
      resetPeriod?: 'monthly' | 'annually';
    }
  }
}
```

#### Usage Tracking Pattern
```typescript
// Automatisches Tracking von Feature-Nutzung
async function trackFeatureUsage(feature: string, userId: string) {
  await usageTrackingService.increment(feature, userId);
  await checkUsageLimits(feature, userId);
}
```

#### Beta Protection Pattern
```typescript
// Temporäre Feature-Freischaltung während Beta-Phase
const isBetaActive = new Date() < new Date('2025-10-31');
const hasAccess = isBetaActive || subscription.hasFeature(feature);
```

### Error Handling Patterns

#### Payment Error Handling
```typescript
// Graceful Degradation bei Payment-Fehlern
try {
  await createCheckoutSession();
} catch (error) {
  // Fallback zu lokaler Feature-Beschränkung
  showUpgradePrompt();
}
```

#### Feature Gate Error Handling
```typescript
// User-freundliche Error-Messages
if (!hasFeatureAccess) {
  return (
    <UpgradePrompt 
      feature="advanced_search"
      message="Erweiterte Filter sind nur für Premium-Mitglieder verfügbar"
    />
  );
}
```

### Component Design Patterns

#### Subscription-aware Components
```typescript
// Komponenten mit eingebauter Feature-Gate-Logik
function AdvancedFilters() {
  const { hasAccess } = useFeatureAccess('advanced_search');
  
  if (!hasAccess) {
    return <FeatureLockedPreview />;
  }
  
  return <FullFeatureComponent />;
}
```

#### Progressive Enhancement
- Basis-Features für alle User verfügbar
- Premium-Features als Upgrade-Optionen
- Seamless Transition zwischen Feature-Levels

### Data Flow Architecture

#### Subscription State Flow
1. **Login** → Load Subscription → Update AuthContext
2. **Feature Check** → Cache Lookup → Database Validation
3. **Usage Tracking** → Real-time Update → Limit Enforcement
4. **Payment** → Stripe Webhook → Subscription Update → Context Refresh

#### Real-time Updates
- **Chat Messages**: Instant delivery mit Supabase Subscriptions
- **Subscription Changes**: Live-Updates nach Payment
- **Feature Limits**: Real-time Usage-Counter-Updates

### Testing Patterns

#### Subscription Testing
```typescript
// Mock-Subscriptions für verschiedene Test-Szenarien
const mockSubscriptions = {
  starter: { plan_type: 'starter', features: ['basic_search'] },
  premium: { plan_type: 'premium', features: ['basic_search', 'advanced_search'] }
};
```

#### Payment Testing
- Stripe Test-Cards für verschiedene Szenarien
- Mock-Webhooks für Edge Function Testing
- Subscription State Mocking für Frontend-Tests