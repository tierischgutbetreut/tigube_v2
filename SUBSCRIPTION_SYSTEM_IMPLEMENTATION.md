# Tigube Subscription System - Implementation Dokumentation

## 🎯 Übersicht

Das Subscription System verbindet Stripe Payment Links mit Supabase und verwaltet automatisch User Premium Features basierend auf aktiven Abonnements.

## 📊 Database Schema

### `subscriptions` Tabelle

```sql
CREATE TABLE public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Stripe IDs für Verknüpfung
    stripe_customer_id TEXT, -- cus_xxxxx
    stripe_subscription_id TEXT, -- sub_xxxxx  
    stripe_checkout_session_id TEXT, -- cs_xxxxx
    
    -- Subscription Details
    plan_type TEXT NOT NULL CHECK (plan_type IN ('premium', 'professional')),
    user_type TEXT NOT NULL CHECK (user_type IN ('owner', 'caretaker')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'unpaid')),
    
    -- Preise und Metadaten
    amount_paid_cents INTEGER, -- 490 für Premium, 1290 für Professional
    currency TEXT DEFAULT 'eur',
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Zeitstempel
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ends_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Eindeutige aktive Subscriptions pro User
    UNIQUE(user_id, plan_type)
);
```

### `user_subscription_status` View

```sql
CREATE VIEW user_subscription_status AS
SELECT 
    u.id as user_id,
    u.user_type,
    s.plan_type,
    s.status as subscription_status,
    s.stripe_customer_id,
    s.stripe_subscription_id,
    s.amount_paid_cents,
    s.started_at,
    s.ends_at,
    CASE 
        WHEN s.status = 'active' THEN TRUE 
        ELSE FALSE 
    END as is_premium_active,
    s.created_at as subscription_created_at
FROM users u
LEFT JOIN subscriptions s ON u.id = s.user_id 
    AND s.status = 'active';
```

## ⚙️ Core Functions

### `sync_checkout_session_to_subscription()`

**Zweck**: Synchronisiert Stripe checkout_sessions mit der subscriptions Tabelle

**Parameter**: 
- `p_checkout_session_id` (TEXT): Die Stripe Checkout Session ID

**Funktionalität**:
1. Lädt checkout_session Daten von Stripe FDW
2. Extrahiert User-ID aus `client_reference_id`
3. Bestimmt Plan-Type basierend auf `amount_total`:
   - 490 Cent = Owner Premium (€4.90)
   - 1290 Cent = Caretaker Professional (€12.90)
4. Erstellt oder aktualisiert Subscription-Eintrag
5. Trigger automatische User Premium Features Update

### `update_user_premium_features()`

**Zweck**: Aktualisiert User Premium Features basierend auf aktiven Subscriptions

**Parameter**:
- `p_user_id` (UUID): Die User-ID

**Features Updates**:
- **Owner Premium**: `max_contact_requests = -1`, `show_ads = FALSE`
- **Caretaker Professional**: `max_bookings = -1`, `premium_badge = TRUE`, `search_priority = 10`, `show_ads = FALSE`
- **Kein Abo**: Reset auf Free Tier (limits = 3, ads = true, etc.)

## 🚀 Edge Function: `sync-checkout-session`

**Endpoint**: `/functions/v1/sync-checkout-session`

**Request**:
```json
{
  "checkout_session_id": "cs_test_xxxxx"
}
```

**Response**:
```json
{
  "success": true,
  "subscription_id": "uuid",
  "checkout_session_id": "cs_test_xxxxx"
}
```

**Integration**: Wird automatisch vom `usePaymentSuccess` Hook aufgerufen

## 🎭 Frontend Integration

### `usePaymentSuccess` Hook

**Funktionalität**:
1. Erkennt Payment Success Parameter in URL
2. Ruft Edge Function auf um Checkout Session zu synchronisieren
3. Validiert Session über StripeService
4. Zeigt PaymentSuccessModal mit korrekten Plan-Details
5. Bereinigt URL Parameter nach Modal-Schließung

**URL Parameter**:
- `session_id`: Stripe Checkout Session ID (bevorzugt)
- `payment_success=true`: Fallback für URL-basierte Success
- `plan`: premium|professional (Fallback)
- `user_type`: owner|caretaker (Fallback)

### `PaymentSuccessModal` Komponente

**Features**:
- Plan-spezifische Icons und Farben
- Feature-Liste für gekauften Plan
- Bestätigungs-E-Mail Anzeige
- "Dashboard weiter nutzen" Button

### `subscriptionStatusService`

**Methoden**:
- `getCurrentUserSubscriptionStatus()`: Aktuelle User Subscription
- `getUserSubscriptionStatus(userId)`: Spezifische User Subscription
- `hasActivePlan(userId, planType)`: Check für aktiven Plan
- `getUserActiveSubscriptions(userId)`: Alle aktiven Subscriptions
- `syncCheckoutSession(sessionId)`: Manuelle Synchronisierung
- `getSubscriptionAnalytics()`: Admin Analytics

## 💰 Payment Flow

### 1. Stripe Payment Link Konfiguration

**Owner Premium**: `https://buy.stripe.com/test_00w9AU8GVfV897Q8gJ2oE00`
**Caretaker Professional**: `https://buy.stripe.com/test_9B66oIbT7dN03NwgNf2oE01`

**URL Parameter**:
- `prefilled_email`: User E-Mail für Vorausfüllung
- `client_reference_id`: User-ID für Zuordnung
- `locale=de`: Deutsche Sprache

### 2. Success URL Flow

**Produktions-URLs**:
- Owner: `https://tigube.vercel.app/dashboard-owner?payment_success=true&plan=premium&user_type=owner`
- Caretaker: `https://tigube.vercel.app/dashboard-caretaker?payment_success=true&plan=professional&user_type=caretaker`

### 3. Automatische Synchronisierung

1. User landet auf Dashboard mit Success-Parametern
2. `usePaymentSuccess` Hook erkennt Parameter
3. Edge Function wird aufgerufen → checkout_session wird synchronisiert
4. Subscription wird erstellt/aktualisiert
5. User Premium Features werden automatisch aktiviert
6. PaymentSuccessModal wird angezeigt
7. URL wird bereinigt

## 🔧 Administration

### Subscription Status Überprüfung

```sql
-- Alle aktiven Subscriptions
SELECT * FROM user_subscription_status WHERE is_premium_active = true;

-- Spezifische User Subscription
SELECT * FROM user_subscription_status WHERE user_id = 'user-uuid';

-- Subscription Analytics
SELECT 
    plan_type,
    COUNT(*) as count,
    SUM(amount_paid_cents) as revenue_cents
FROM subscriptions 
WHERE status = 'active'
GROUP BY plan_type;
```

### Manuelle Synchronisierung

```sql
-- Einzelne Session synchronisieren
SELECT sync_checkout_session_to_subscription('cs_test_xxxxx');

-- Alle paid Sessions synchronisieren
SELECT 
    id,
    sync_checkout_session_to_subscription(id) as subscription_id
FROM checkout_sessions 
WHERE attrs->>'payment_status' = 'paid';
```

### User Premium Features Reset

```sql
-- User Features aktualisieren
SELECT update_user_premium_features('user-uuid');

-- Alle User mit aktiven Subscriptions aktualisieren
SELECT update_user_premium_features(user_id)
FROM subscriptions 
WHERE status = 'active';
```

## 🚨 Trigger & Automation

### Subscription Trigger

```sql
CREATE TRIGGER subscriptions_update_user_features
    AFTER INSERT OR UPDATE OR DELETE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_user_features();
```

**Funktionalität**: Automatische User Premium Features Update bei Subscription-Änderungen

## 📈 Monitoring & Analytics

### Key Metrics

- **Total Subscriptions**: Anzahl aller Subscriptions
- **Active Subscriptions**: Anzahl aktiver Subscriptions  
- **Revenue**: Gesamtumsatz in Cent
- **Plan Distribution**: Premium vs Professional
- **User Type Distribution**: Owner vs Caretaker

### Admin Dashboard Integration

Das System ist bereit für Integration in das Admin Dashboard mit:
- Real-time Subscription Status
- Revenue Analytics
- User Premium Feature Monitoring
- Manual Subscription Management

## 🔒 Security & RLS

### Row Level Security

```sql
-- Users können nur eigene Subscriptions sehen
CREATE POLICY "Users can view own subscriptions" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Service Role kann alles verwalten (für Webhooks)
CREATE POLICY "Service role can manage subscriptions" ON subscriptions
    FOR ALL USING (auth.role() = 'service_role');
```

### Edge Function Security

- Authentifizierung über Supabase Service Role Key
- Input Validation für checkout_session_id
- Error Handling und Logging

## ✅ Status & Testing

### ✅ Implementiert
- [x] Database Schema & Functions
- [x] Edge Function für Synchronisierung
- [x] Frontend Payment Success Modal
- [x] Automatische User Premium Features
- [x] Subscription Status Service
- [x] RLS Policies & Security

### ✅ Getestet
- [x] Checkout Session Synchronisierung
- [x] User Premium Features Update  
- [x] Payment Success Modal Flow
- [x] URL Parameter Handling
- [x] Edge Function Deployment

### 🔄 Produktionsbereit

Das System ist vollständig implementiert und bereit für den Produktionseinsatz. Alle Komponenten funktionieren zusammen und das System synchronisiert automatisch Stripe Payments mit User Subscriptions. 