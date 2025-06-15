# Supabase Edge Functions Deployment Guide

## 🚀 Stripe Integration Functions

Die folgenden Edge Functions müssen deployed werden für die vollständige Stripe Integration:

### 1. Create Checkout Session Function
```bash
supabase functions deploy create-checkout-session
```

### 2. Validate Checkout Session Function
```bash
supabase functions deploy validate-checkout-session
```

### 3. Stripe Webhook Handler
```bash
supabase functions deploy stripe-webhook
```

## 🔧 Environment Variables Setup

In deinem Supabase Dashboard unter **Project Settings > Edge Functions** musst du folgende Environment Variables setzen:

```bash
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ENVIRONMENT=development
```

## 🎯 Stripe Dashboard Setup

### 1. Webhook Endpoint erstellen
1. Gehe zu https://dashboard.stripe.com/webhooks
2. Klicke "Add endpoint"
3. URL: `https://your-project.supabase.co/functions/v1/stripe-webhook`
4. Wähle folgende Events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### 2. Webhook Secret kopieren
Nach der Erstellung des Webhooks erhältst du einen `Signing secret` - das ist dein `STRIPE_WEBHOOK_SECRET`.

## ✅ Testing

### 1. Test Kreditkarte (Stripe Test Mode)
```
Kartennummer: 4242 4242 4242 4242
Ablaufdatum: 12/34
CVC: 123
```

### 2. Funktions-Tests
```bash
# Test der create-checkout-session function
curl -X POST https://your-project.supabase.co/functions/v1/create-checkout-session \
  -H "Authorization: Bearer your-anon-key" \
  -H "Content-Type: application/json" \
  -d '{
    "priceInCents": 490,
    "planType": "premium",
    "userType": "owner",
    "userId": "test-user-id",
    "userEmail": "test@example.com",
    "planDisplayName": "Premium",
    "successUrl": "http://localhost:5174/payment/success?session_id={CHECKOUT_SESSION_ID}",
    "cancelUrl": "http://localhost:5174/mitgliedschaften?cancelled=true"
  }'
```

## 🔄 Complete Deployment Checklist

- [ ] `.env` Datei mit Stripe Test Keys erstellt
- [ ] Supabase Edge Functions deployed
- [ ] Supabase Environment Variables gesetzt
- [ ] Stripe Webhook erstellt und konfiguriert
- [ ] Test-Payment durchgeführt
- [ ] Success Page funktioniert
- [ ] Subscription wird korrekt in DB aktualisiert

## 🚀 Go Live Checklist (später)

Für den Live-Betrieb:
- [ ] Stripe Test Keys → Live Keys austauschen
- [ ] Webhook URL auf Production umstellen
- [ ] Environment von "development" → "production"
- [ ] Weitere Tests mit echten Karten (kleine Beträge) 