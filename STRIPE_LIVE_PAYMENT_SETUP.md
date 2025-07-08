# 🚀 Live Payment Links Setup - Tigube Production

## Problem behoben: Upgrade in Live-Umgebung

Das System verwendet jetzt **Environment Variables** statt hardcodierte Test-Links.

## 📋 Benötigte Environment Variables für Live

### 1. **Stripe Keys**
```bash
# Live Stripe Keys für echte Zahlungen
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51234567890abcdef...
VITE_STRIPE_SECRET_KEY=sk_live_51234567890abcdef...

# ODER Test Keys für Demo (wenn Kunden testen sollen)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51234567890abcdef...
VITE_STRIPE_SECRET_KEY=sk_test_51234567890abcdef...
```

### 2. **Payment Links**
```bash
# Live Payment Links (erstelle diese in deinem Stripe Dashboard)
VITE_STRIPE_PAYMENT_LINK_OWNER_PREMIUM=https://buy.stripe.com/live_xxxxxxxxxxxxx
VITE_STRIPE_PAYMENT_LINK_CARETAKER_PROFESSIONAL=https://buy.stripe.com/live_xxxxxxxxxxxxx

# Fallback: Test Payment Links (für Demo)
VITE_STRIPE_PAYMENT_LINK_OWNER_PREMIUM=https://buy.stripe.com/test_00w9AU8GVfV897Q8gJ2oE00
VITE_STRIPE_PAYMENT_LINK_CARETAKER_PROFESSIONAL=https://buy.stripe.com/test_9B66oIbT7dN03NwgNf2oE01
```

### 3. **App Configuration**
```bash
# Deine Live Domain
VITE_APP_URL=https://tigube.vercel.app
VITE_ENVIRONMENT=production
```

## 🛠️ Stripe Dashboard - Payment Links erstellen

### Schritt 1: Owner Premium Link (€4,90/Monat)

1. **Stripe Dashboard** → **Payment Links** → **Create payment link**
2. **Product Configuration**:
   - Name: `Tigube Premium Plan`
   - Price: `€4.90 EUR` - **Recurring: Monthly**
   - Description: `Tierbesitzer Premium Mitgliedschaft`
3. **Settings**:
   - **Success URL**: `https://tigube.vercel.app/dashboard-owner?payment_success=true&plan=premium&user_type=owner`
   - **Cancel URL**: `https://tigube.vercel.app/mitgliedschaften?cancelled=true`
   - **Collect customer information**: ✅ Email address
   - **Allow promotion codes**: ✅ (optional)
4. **Save** → Kopiere die generierte URL: `https://buy.stripe.com/live_xxxxxxxxxxxxx`

### Schritt 2: Caretaker Professional Link (€12,90/Monat)

1. **Neuer Payment Link**:
   - Name: `Tigube Professional Plan`
   - Price: `€12.90 EUR` - **Recurring: Monthly**
   - Description: `Betreuer Professional Mitgliedschaft`
2. **Settings**:
   - **Success URL**: `https://tigube.vercel.app/dashboard-caretaker?payment_success=true&plan=professional&user_type=caretaker`
   - **Cancel URL**: `https://tigube.vercel.app/mitgliedschaften?cancelled=true`
3. **Save** → Kopiere die URL

## 🔧 Deployment (Vercel)

### Option 1: Vercel Dashboard
1. **Vercel Dashboard** → Dein Projekt → **Settings** → **Environment Variables**
2. Füge alle obigen Variables hinzu
3. **Redeploy** das Projekt

### Option 2: Vercel CLI
```bash
# Environment Variables setzen
vercel env add VITE_STRIPE_PUBLISHABLE_KEY
vercel env add VITE_STRIPE_SECRET_KEY
vercel env add VITE_STRIPE_PAYMENT_LINK_OWNER_PREMIUM
vercel env add VITE_STRIPE_PAYMENT_LINK_CARETAKER_PROFESSIONAL
vercel env add VITE_APP_URL
vercel env add VITE_ENVIRONMENT

# Projekt deployen
vercel --prod
```

## ✅ Testing nach Deployment

### 1. **Browser Console Check**
```javascript
// Öffne https://tigube.vercel.app und in der Browser Console:
console.log('Stripe Config:', {
  publishableKey: window.__STRIPE_CONFIG__?.publishableKey?.substring(0, 12) + '...',
  environment: window.__APP_CONFIG__?.environment,
  paymentLinksConfigured: true
});
```

### 2. **Upgrade Flow testen**
1. **Registriere/Login** als Owner oder Caretaker
2. **Gehe zu Mitgliedschaften** (`/mitgliedschaften`)
3. **Klicke "Upgrade"** - sollte zu Stripe Payment Link weiterleiten
4. **Verwende Test-Karte**: `4242 4242 4242 4242` (wenn Test-Keys)
5. **Nach Success**: Zurück zum Dashboard mit Success Modal

### 3. **Error Handling prüfen**
```javascript
// Falls Fehler auftreten, schaue in Browser Console
// Das System zeigt jetzt detaillierte Fehler für Missing Environment Variables
```

## 🔄 Umschalten zwischen Test und Live

### Test-Modus (für Kunde-Demos):
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_STRIPE_PAYMENT_LINK_OWNER_PREMIUM=https://buy.stripe.com/test_...
```
→ Zeigt automatisch Test-Hinweise im UI

### Live-Modus (echte Zahlungen):
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_STRIPE_PAYMENT_LINK_OWNER_PREMIUM=https://buy.stripe.com/live_...
```
→ Keine Test-Hinweise, echte Zahlungen

## 🚨 Häufige Probleme & Lösungen

### ❌ "Payment Link nicht konfiguriert"
**Lösung**: Environment Variable `VITE_STRIPE_PAYMENT_LINK_*` fehlt
```bash
# Prüfe Vercel Environment Variables
vercel env ls
```

### ❌ "Stripe ist nicht konfiguriert"
**Lösung**: `VITE_STRIPE_PUBLISHABLE_KEY` fehlt
```bash
# Setze Publishable Key
vercel env add VITE_STRIPE_PUBLISHABLE_KEY
```

### ❌ Weiterleitung auf `localhost`
**Lösung**: Success URLs in Stripe Payment Links aktualisieren
- Alte URL: `http://localhost:5173/dashboard-owner...`
- Neue URL: `https://tigube.vercel.app/dashboard-owner...`

### ❌ "undefined" in Payment Link
**Lösung**: Environment Variable wurde als String "undefined" gesetzt
```bash
# Lösche und setze neu
vercel env rm VITE_STRIPE_PAYMENT_LINK_OWNER_PREMIUM
vercel env add VITE_STRIPE_PAYMENT_LINK_OWNER_PREMIUM
```

## 🎯 Next Steps nach Fix

1. ✅ **Environment Variables setzen** (siehe oben)
2. ✅ **Payment Links in Stripe erstellen** 
3. ✅ **Vercel redeploy**
4. ✅ **Upgrade Flow testen**
5. ✅ **Kunden informieren** dass Upgrades jetzt funktionieren

Das System ist jetzt **production-ready** und unterstützt sowohl Test- als auch Live-Zahlungen! 🚀 