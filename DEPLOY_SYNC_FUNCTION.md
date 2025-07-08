# 🚀 Deploy Sync Function - Fehlerbehebung

## Problem
Die Edge Function `sync-checkout-session` existierte nicht, wodurch Checkout Sessions nicht in die `subscriptions` Tabelle synchronisiert wurden.

## 🔧 Lösung

### 1. **Database Migration deployen:**
```bash
# Neue Migration anwenden
supabase db push

# Oder spezifische Migration
supabase migration up --file 20250202000001_add_sync_checkout_session_function.sql
```

### 2. **Edge Function deployen:**
```bash
# Edge Function hochladen
supabase functions deploy sync-checkout-session

# Oder alle Functions
supabase functions deploy
```

### 3. **Environment Variables prüfen:**
```bash
# In Supabase Dashboard > Settings > Edge Functions
SUPABASE_URL=your-project-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 🧪 **Testen der Funktion:**

### **Via Browser Console:**
```javascript
// Test der Edge Function direkt
const response = await fetch('https://your-project.supabase.co/functions/v1/sync-checkout-session', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your-anon-key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    checkout_session_id: 'cs_test_deine_session_id'
  })
});

const result = await response.json();
console.log('Result:', result);
```

### **Via SQL Console:**
```sql
-- Direkt in Supabase SQL Editor testen
SELECT sync_checkout_session_to_subscription('cs_test_deine_session_id');

-- Prüfen ob Subscription erstellt wurde
SELECT * FROM subscriptions WHERE stripe_checkout_session_id = 'cs_test_deine_session_id';
```

## 🔍 **Debugging:**

### **Logs checken:**
```bash
# Edge Function Logs
supabase functions logs sync-checkout-session

# Database Logs in Supabase Dashboard
# Settings > Logs > Postgres Logs
```

### **Häufige Probleme:**

1. **"Function not found"** → Edge Function noch nicht deployed
2. **"Checkout session not found"** → Session ID existiert nicht in checkout_sessions Tabelle
3. **"Permission denied"** → Service Role Key fehlt oder falsch

## ✅ **Erfolgreich wenn:**

1. **Edge Function deployed** ✅
2. **Database Function verfügbar** ✅  
3. **Migration angewendet** ✅
4. **Test-Aufruf erfolgreich** ✅
5. **Subscription in DB erstellt** ✅

## 🎯 **Next Steps:**

Nach erfolgreichem Deployment sollte der Payment-Flow automatisch funktionieren:
1. User macht Payment über Stripe
2. Stripe leitet zu Dashboard weiter
3. `usePaymentSuccess` Hook ruft Edge Function auf
4. Edge Function synct Daten in `subscriptions` Tabelle
5. User Premium Features werden automatisch aktiviert

Prüfe die Logs wenn es immer noch nicht funktioniert! 🚀 