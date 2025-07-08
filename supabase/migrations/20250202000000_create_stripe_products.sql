-- Migration: Erstelle Stripe-Produkte und Preise via Foreign Data Wrapper
-- Diese Migration erstellt die Produkte direkt in Stripe über die FDW-Integration

-- 1. Owner Premium Produkt erstellen
DO $$
DECLARE
    owner_product_id TEXT;
    owner_price_id TEXT;
    caretaker_product_id TEXT;
    caretaker_price_id TEXT;
BEGIN
    -- Owner Premium Produkt
    INSERT INTO stripe_wrapper.products (name, description, type)
    VALUES ('Tigube Owner Premium', 'Premium-Mitgliedschaft für Haustierbesitzer mit erweiterten Features', 'service')
    ON CONFLICT (name) DO UPDATE SET 
        description = EXCLUDED.description,
        updated = NOW()
    RETURNING id INTO owner_product_id;

    -- Owner Premium Preis (€4.90/Monat)
    INSERT INTO stripe_wrapper.prices (
        product, 
        unit_amount, 
        currency, 
        recurring_interval, 
        recurring_interval_count,
        nickname
    )
    VALUES (owner_product_id, 490, 'eur', 'month', 1, 'Owner Premium Monthly')
    ON CONFLICT (product, unit_amount, currency) DO UPDATE SET 
        recurring_interval = EXCLUDED.recurring_interval,
        updated = NOW()
    RETURNING id INTO owner_price_id;

    -- Caretaker Professional Produkt
    INSERT INTO stripe_wrapper.products (name, description, type)
    VALUES ('Tigube Caretaker Professional', 'Professional-Mitgliedschaft für Tierbetreuer mit allen Premium-Features', 'service')
    ON CONFLICT (name) DO UPDATE SET 
        description = EXCLUDED.description,
        updated = NOW()
    RETURNING id INTO caretaker_product_id;

    -- Caretaker Professional Preis (€12.90/Monat)
    INSERT INTO stripe_wrapper.prices (
        product, 
        unit_amount, 
        currency, 
        recurring_interval, 
        recurring_interval_count,
        nickname
    )
    VALUES (caretaker_product_id, 1290, 'eur', 'month', 1, 'Caretaker Professional Monthly')
    ON CONFLICT (product, unit_amount, currency) DO UPDATE SET 
        recurring_interval = EXCLUDED.recurring_interval,
        updated = NOW()
    RETURNING id INTO caretaker_price_id;

    -- Logging für Debug-Zwecke
    RAISE NOTICE 'Stripe products created successfully:';
    RAISE NOTICE 'Owner Premium Product ID: %', owner_product_id;
    RAISE NOTICE 'Owner Premium Price ID: %', owner_price_id;
    RAISE NOTICE 'Caretaker Professional Product ID: %', caretaker_product_id;
    RAISE NOTICE 'Caretaker Professional Price ID: %', caretaker_price_id;

END $$;

-- Tabelle für Price ID Lookup erstellen (falls FDW-Queries kompliziert werden)
CREATE TABLE IF NOT EXISTS stripe_price_lookup (
    id SERIAL PRIMARY KEY,
    user_type TEXT NOT NULL,
    plan_type TEXT NOT NULL,
    stripe_price_id TEXT NOT NULL,
    stripe_product_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_type, plan_type)
);

-- RLS für stripe_price_lookup
ALTER TABLE stripe_price_lookup ENABLE ROW LEVEL SECURITY;

-- Policy: Jeder kann die Preise lesen (für Checkout)
CREATE POLICY "Anyone can read stripe prices" ON stripe_price_lookup
    FOR SELECT USING (true);

-- Policy: Nur Service Role kann Preise schreiben
CREATE POLICY "Service role can manage stripe prices" ON stripe_price_lookup
    FOR ALL USING (auth.role() = 'service_role');

-- Funktion zum Synchronisieren der Price IDs
CREATE OR REPLACE FUNCTION sync_stripe_price_ids()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    owner_product_row RECORD;
    owner_price_row RECORD;
    caretaker_product_row RECORD;
    caretaker_price_row RECORD;
BEGIN
    -- Owner Premium
    SELECT * INTO owner_product_row 
    FROM stripe_wrapper.products 
    WHERE name = 'Tigube Owner Premium' 
    LIMIT 1;

    IF FOUND THEN
        SELECT * INTO owner_price_row 
        FROM stripe_wrapper.prices 
        WHERE product = owner_product_row.id AND unit_amount = 490 
        LIMIT 1;

        IF FOUND THEN
            INSERT INTO stripe_price_lookup (user_type, plan_type, stripe_price_id, stripe_product_id)
            VALUES ('owner', 'premium', owner_price_row.id, owner_product_row.id)
            ON CONFLICT (user_type, plan_type) 
            DO UPDATE SET 
                stripe_price_id = EXCLUDED.stripe_price_id,
                stripe_product_id = EXCLUDED.stripe_product_id,
                updated_at = NOW();
        END IF;
    END IF;

    -- Caretaker Professional
    SELECT * INTO caretaker_product_row 
    FROM stripe_wrapper.products 
    WHERE name = 'Tigube Caretaker Professional' 
    LIMIT 1;

    IF FOUND THEN
        SELECT * INTO caretaker_price_row 
        FROM stripe_wrapper.prices 
        WHERE product = caretaker_product_row.id AND unit_amount = 1290 
        LIMIT 1;

        IF FOUND THEN
            INSERT INTO stripe_price_lookup (user_type, plan_type, stripe_price_id, stripe_product_id)
            VALUES ('caretaker', 'professional', caretaker_price_row.id, caretaker_product_row.id)
            ON CONFLICT (user_type, plan_type) 
            DO UPDATE SET 
                stripe_price_id = EXCLUDED.stripe_price_id,
                stripe_product_id = EXCLUDED.stripe_product_id,
                updated_at = NOW();
        END IF;
    END IF;
END;
$$;

-- Initial sync ausführen
SELECT sync_stripe_price_ids(); 