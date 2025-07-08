# Stripe Test-Modus in Production

## Für Kunden-Tests in der Live-Umgebung

Um deinen Kunden den Payment-Prozess in der Live-Umgebung zu zeigen, musst du diese Environment Variables setzen:

### 🔧 Required Environment Variables

```bash
# Stripe Test Keys (pk_test_... und sk_test_...)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51234567890abcdef...
VITE_STRIPE_SECRET_KEY=sk_test_51234567890abcdef...

# Stripe Payment Links (Test Mode)
VITE_STRIPE_PRICE_OWNER_PREMIUM=price_1234567890abcdef  # Test Price ID für Owner Premium
VITE_STRIPE_PRICE_CARETAKER_PROFESSIONAL=price_1234567890abcdef  # Test Price ID für Caretaker Professional

# App Configuration
VITE_APP_URL=https://your-production-domain.com
VITE_ENVIRONMENT=production
```

### 📱 Was passiert dann:

#### ✅ **Kunden können testen:**
- Payment-Prozess durchlaufen mit Test-Kreditkarte
- Alle UI-Flows erleben
- Success-Modals und Dashboard-Updates sehen
- Subscription-Management über Stripe Portal

#### 🔒 **Sicherheit:**
- **Keine echten Zahlungen** - alles über Stripe Test-System
- Test-Karte: `4242 4242 4242 4242`
- Test-Mode Hinweise werden automatisch angezeigt
- Stripe Test Keys erkannt durch `pk_test_` Prefix

#### 🎯 **UI-Hinweise für Kunden:**
```
🔒 Stripe Test-Modus aktiv
Sichere Test-Umgebung - keine echten Zahlungen

Test-Modus: Nutze Karte 4242 4242 4242 4242 für Test-Zahlungen
```

### 🚀 **Für echte Zahlungen später:**

1. **Live Keys setzen:**
   ```bash
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
   VITE_STRIPE_SECRET_KEY=sk_live_...
   ```

2. **Live Payment Links erstellen:**
   ```bash
   VITE_STRIPE_PRICE_OWNER_PREMIUM=price_live_...
   VITE_STRIPE_PRICE_CARETAKER_PROFESSIONAL=price_live_...
   ```

3. **Test-Hinweise verschwinden automatisch** ✨

### 💡 **Deployment:**

Für **Vercel/Netlify** einfach Environment Variables im Dashboard setzen.  
Die App erkennt automatisch Test vs. Live Keys und passt das UI entsprechend an.

### 🧪 **Test-Kreditkarten:**

```
Erfolgreiche Zahlung: 4242 4242 4242 4242
Fehlgeschlagene Zahlung: 4000 0000 0000 0002
3D Secure: 4000 0025 0000 3155
```

Das System ist so konfiguriert, dass Kunden den kompletten Payment-Flow in Production testen können, ohne dass echte Zahlungen stattfinden! 🎉 