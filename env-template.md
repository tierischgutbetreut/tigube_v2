# Environment Variables Setup für Stripe Integration

## 📋 .env Datei erstellen

Erstelle eine `.env` Datei im Root-Verzeichnis mit folgenden Variablen:

```bash
# Supabase Configuration (bereits vorhanden)
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Stripe Configuration (Test Mode - NEU)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# App Configuration
VITE_APP_URL=http://localhost:5174
VITE_ENVIRONMENT=development

# Pricing Configuration (in cents)
VITE_STRIPE_PRICE_OWNER_PREMIUM=490
VITE_STRIPE_PRICE_CARETAKER_PROFESSIONAL=1290
```

## 🔑 Stripe Test Keys beschaffen

1. Gehe zu https://dashboard.stripe.com/
2. Stelle sicher, dass du im **Test Mode** bist (Toggle oben rechts)
3. Gehe zu **Developers > API keys**
4. Kopiere:
   - **Publishable key** (beginnt mit `pk_test_`)
   - **Secret key** (beginnt mit `sk_test_`)

## ⚡ Next Steps

Nach dem Setup der `.env` Datei können wir mit der Stripe Integration fortfahren! 