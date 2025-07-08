import { stripePromise, config, getPriceInCents, getPlanDisplayName } from './stripeConfig';
import { supabase } from '../supabase/client';

export interface CheckoutSessionData {
  userType: 'owner' | 'caretaker';
  plan: 'premium' | 'professional';
  userId: string;
  userEmail: string;
}

export interface CheckoutResult {
  success: boolean;
  error?: string;
  sessionId?: string;
  checkoutUrl?: string;
}

// Payment Link URLs
const PAYMENT_LINKS = {
  owner_premium: 'https://buy.stripe.com/test_00w9AU8GVfV897Q8gJ2oE00',
  caretaker_professional: 'https://buy.stripe.com/test_9B66oIbT7dN03NwgNf2oE01'
} as const;

// Cache für die erstellten Price IDs
let cachedPriceIds: {
  ownerPremium?: string;
  caretakerProfessional?: string;
} = {};

export class StripeService {
  /**
   * NEUE METHODE: Erstelle Payment Link URL mit Parametern
   */
  static createPaymentLinkUrl(data: CheckoutSessionData): string {
    console.log('🔗 Creating Payment Link URL for:', data);

    // Bestimme den richtigen Payment Link
    let baseUrl = '';
    if (data.userType === 'owner' && data.plan === 'premium') {
      baseUrl = PAYMENT_LINKS.owner_premium;
    } else if (data.userType === 'caretaker' && data.plan === 'professional') {
      baseUrl = PAYMENT_LINKS.caretaker_professional;
      if (!baseUrl) {
        throw new Error('Payment Link für Caretaker Professional noch nicht erstellt');
      }
    } else {
      throw new Error('Ungültige Kombination von userType und plan');
    }

    // URL-Parameter hinzufügen - KORREKTE STRIPE PARAMETER
    const urlParams = new URLSearchParams();
    
    // ✅ KORREKTER Parameter: prefilled_email (laut Stripe Dokumentation)
    // ✅ Automatisches URL-Encoding durch URLSearchParams
    urlParams.set('prefilled_email', data.userEmail);
    
    // ✅ Client Reference ID für User-Tracking
    urlParams.set('client_reference_id', data.userId);
    
    // ✅ Locale auf Deutsch setzen
    urlParams.set('locale', 'de');
    
    // Finale URL zusammenbauen
    const finalUrl = `${baseUrl}?${urlParams.toString()}`;
    
    console.log('✅ Payment Link URL created:', finalUrl);
    console.log('📧 Email parameter:', {
      originalEmail: data.userEmail,
      encodedEmail: urlParams.get('prefilled_email'),
      fullParams: urlParams.toString()
    });
    
    return finalUrl;
  }

  /**
   * NEUE HAUPTMETHODE: Starte Checkout mit Payment Link
   */
  static async startCheckoutWithPaymentLink(data: CheckoutSessionData): Promise<void> {
    try {
      console.log('🔄 Starting checkout with Payment Link:', data);
      
      if (!config.stripe.isEnabled) {
        throw new Error('Stripe ist nicht konfiguriert');
      }

      // Payment Link URL erstellen
      const paymentUrl = this.createPaymentLinkUrl(data);
      
      // Direkt zur Payment Link URL weiterleiten
      console.log('🔀 Redirecting to Payment Link:', paymentUrl);
      window.location.href = paymentUrl;
      
    } catch (error) {
      console.error('❌ Payment Link checkout error:', error);
      throw error;
    }
  }

  /**
   * ÜBERGANGS-METHODE: Verwende Payment Link statt FDW
   */
  static async startCheckout(data: CheckoutSessionData): Promise<void> {
    console.log('🔄 StripeService.startCheckout - using Payment Link method');
    return this.startCheckoutWithPaymentLink(data);
  }

  /**
   * Hole oder erstelle Stripe Price IDs (Beta-Version mit Environment Variables)
   */
  static async getStripePriceIds(): Promise<{
    ownerPremium: string;
    caretakerProfessional: string;
  }> {
    // Verwende Cache wenn verfügbar
    if (cachedPriceIds.ownerPremium && cachedPriceIds.caretakerProfessional) {
      console.log('📦 Using cached price IDs:', cachedPriceIds);
      return {
        ownerPremium: cachedPriceIds.ownerPremium,
        caretakerProfessional: cachedPriceIds.caretakerProfessional
      };
    }

    try {
      console.log('🔍 Getting Stripe price IDs for beta testing...');

      // Zuerst versuchen, aus Lookup-Tabelle zu laden (für künftige FDW-Integration)
      try {
        const { data: priceData, error } = await (supabase as any)
          .from('stripe_price_lookup')
          .select('user_type, plan_type, stripe_price_id')
          .in('user_type', ['owner', 'caretaker'])
          .in('plan_type', ['premium', 'professional']);

        if (!error && priceData && priceData.length >= 2) {
          const ownerPremium = priceData.find((p: any) => p.user_type === 'owner' && p.plan_type === 'premium')?.stripe_price_id;
          const caretakerProfessional = priceData.find((p: any) => p.user_type === 'caretaker' && p.plan_type === 'professional')?.stripe_price_id;

                     // Nur verwenden wenn echte Price IDs (nicht Beta-Placeholders)
           if (ownerPremium && caretakerProfessional && 
               !ownerPremium.includes('beta') && !caretakerProfessional.includes('beta')) {
             const validPriceIds = { ownerPremium, caretakerProfessional };
             cachedPriceIds = validPriceIds;
             console.log('✅ Using real Stripe price IDs from database:', validPriceIds);
             return validPriceIds;
           }
        }
      } catch (dbError) {
        console.log('📝 Database lookup failed, using environment variables...');
      }

            // Fallback: Verwende Environment Variables als Price IDs (Beta-Modus)
      const ownerPremium = import.meta.env.VITE_STRIPE_PRICE_OWNER_PREMIUM;
      const caretakerProfessional = import.meta.env.VITE_STRIPE_PRICE_CARETAKER_PROFESSIONAL;

      console.log('🔍 Environment variables check:', {
        ownerPremium,
        caretakerProfessional,
        ownerStartsWithPrice: ownerPremium?.startsWith('price_'),
        caretakerStartsWithPrice: caretakerProfessional?.startsWith('price_')
      });

      // Wenn Environment Variables vorhanden sind, verwende sie direkt
      if (ownerPremium && caretakerProfessional) {
        // Prüfe ob es echte Price IDs sind (beginnen mit price_)
        if (ownerPremium.startsWith('price_') && caretakerProfessional.startsWith('price_')) {
          const validPriceIds = {
            ownerPremium,
            caretakerProfessional
          };
          cachedPriceIds = validPriceIds;
          console.log('✅ Using environment variable price IDs:', validPriceIds);
          return validPriceIds;
        }
        
        // Fallback: Sind es nur Beträge in Cents?
        const ownerCents = parseInt(ownerPremium);
        const caretakerCents = parseInt(caretakerProfessional);
        
        if (!isNaN(ownerCents) && !isNaN(caretakerCents)) {
          console.log('💰 Environment variables contain prices in cents, not price IDs');
          throw new Error('Environment Variables enthalten Preise in Cents statt Price IDs. Bitte setze echte Stripe Price IDs (beginnen mit price_) in die Environment Variables.');
        }
        
        // Fallback: Unbekanntes Format
        console.log('❓ Unknown format for environment variables');
        throw new Error('Environment Variables haben unbekanntes Format. Erwarte Price IDs beginnend mit "price_".');
      }

      // Keine Environment Variables gefunden
      console.log('⚠️ No price IDs found in environment variables');
      throw new Error('Keine Stripe Price IDs in Environment Variables gefunden. Bitte konfiguriere VITE_STRIPE_PRICE_OWNER_PREMIUM und VITE_STRIPE_PRICE_CARETAKER_PROFESSIONAL.');

    } catch (error) {
      console.error('❌ Error getting Stripe price IDs:', error);
      throw new Error(`Fehler beim Laden der Stripe Price IDs: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    }
  }

  /**
   * LEGACY: Erstelle eine Checkout Session - STRIPE FDW INTEGRATION (BETA)
   * Diese Methode wird nicht mehr verwendet, aber für Referenz beibehalten
   */
  static async createCheckoutSession(data: CheckoutSessionData): Promise<CheckoutResult> {
    try {
      console.log('⚠️ LEGACY METHOD: createCheckoutSession - consider using Payment Links instead');
      console.log('🔧 Creating Stripe checkout session for BETA testing...');
      if (!config.stripe.isEnabled) {
        console.error('❌ Stripe not enabled:', config.stripe);
        return { 
          success: false, 
          error: 'Stripe ist nicht konfiguriert. Bitte Umgebungsvariablen überprüfen.' 
        };
      }

      // Preis basierend auf Plan berechnen
      const priceInCents = getPriceInCents(data.plan);
      const planDisplayName = getPlanDisplayName(data.userType, data.plan === 'professional' ? 'premium' : data.plan);
      
      console.log('💰 Pricing info:', { priceInCents, planDisplayName });

      // Hole Stripe Price IDs aus der Lookup-Tabelle
      const priceIds = await this.getStripePriceIds();
      
      const priceId = data.userType === 'owner' && data.plan === 'premium' 
        ? priceIds.ownerPremium
        : priceIds.caretakerProfessional;

      console.log('💳 Using Stripe Price ID:', priceId);

      // Erstelle Checkout Session über Stripe FDW
      console.log('🚀 Creating checkout session via Stripe FDW...');
      
      const successUrl = `${config.app.url}/payment/success?session_id={CHECKOUT_SESSION_ID}&beta=true`;
      const cancelUrl = `${config.app.url}/mitgliedschaften?cancelled=true`;

      try {
        // Erstelle Checkout Session direkt über die FDW
        const { data: sessionResult, error: sessionError } = await (supabase as any)
          .from('checkout_sessions')
          .insert({
            mode: 'subscription',
            line_items: [{
              price: priceId,
              quantity: 1
            }],
            success_url: successUrl,
            cancel_url: cancelUrl,
            customer_email: data.userEmail,
            metadata: {
              userId: data.userId,
              planType: data.plan,
              userType: data.userType
            }
          })
          .select('id, url')
          .single();

        if (sessionError) {
          console.error('❌ FDW session creation error:', sessionError);
          return {
            success: false,
            error: `Stripe FDW Fehler: ${sessionError.message}`
          };
        }

        if (!sessionResult?.id || !sessionResult?.url) {
          console.error('❌ Invalid session result from FDW:', sessionResult);
          return {
            success: false,
            error: 'Ungültige Session-Daten von Stripe FDW erhalten'
          };
        }

        console.log('✅ Checkout session created via FDW:', sessionResult.id);

        // Leite zur Checkout URL weiter
        window.location.href = sessionResult.url;

        return {
          success: true,
          sessionId: sessionResult.id,
          checkoutUrl: sessionResult.url
        };

      } catch (fdwError) {
        console.error('❌ FDW Error:', fdwError);
        return {
          success: false,
          error: `FDW Fehler: ${fdwError instanceof Error ? fdwError.message : 'Unbekannter FDW-Fehler'}`
        };
      }

    } catch (error) {
      console.error('❌ Stripe checkout error:', error);
      return { 
        success: false, 
        error: `Unerwarteter Fehler beim Checkout: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}` 
      };
    }
  }

  /**
   * Weiterleitung zum Stripe Checkout - ECHTER CHECKOUT
   */
  static async redirectToCheckout(sessionId: string): Promise<void> {
    console.log('🔀 Redirecting to REAL Stripe checkout with sessionId:', sessionId);
    
    const stripe = await stripePromise;
    
    if (!stripe) {
      throw new Error('Stripe konnte nicht geladen werden');
    }

    const { error } = await stripe.redirectToCheckout({
      sessionId: sessionId
    });

    if (error) {
      console.error('Stripe redirect error:', error);
      throw new Error('Fehler beim Weiterleiten zum Checkout');
    }
  }

  /**
   * Validate Checkout Session (für Success Page) - STRIPE FDW INTEGRATION
   */
  static async validateCheckoutSession(sessionId: string): Promise<{
    success: boolean;
    session?: any;
    error?: string;
  }> {
    try {
      console.log('🔍 Validating checkout session via Stripe FDW:', sessionId);

      // Session direkt aus der Stripe FDW abrufen
      const { data: sessionData, error: sessionError } = await (supabase as any)
        .from('checkout_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError) {
        console.error('❌ Error retrieving session from FDW:', sessionError);
        return { 
          success: false, 
          error: 'Session konnte nicht aus der Stripe-Datenbank abgerufen werden' 
        };
      }

      if (!sessionData) {
        console.error('❌ No session data found for ID:', sessionId);
        return { 
          success: false, 
          error: 'Session nicht gefunden' 
        };
      }

      console.log('✅ Session retrieved from Stripe FDW:', {
        id: sessionData.id,
        status: sessionData.status,
        amount_total: sessionData.amount_total,
        customer_email: sessionData.customer_email,
        client_reference_id: sessionData.client_reference_id,
        metadata: sessionData.metadata
      });

      // Session-Status prüfen
      if (sessionData.status !== 'complete') {
        console.warn('⚠️ Session is not complete:', sessionData.status);
        return { 
          success: false, 
          error: `Zahlung noch nicht abgeschlossen (Status: ${sessionData.status})` 
        };
      }

      return {
        success: true,
        session: sessionData
      };

    } catch (error) {
      console.error('❌ Session validation error:', error);
      return { 
        success: false, 
        error: 'Unerwarteter Fehler bei der Validierung' 
      };
    }
  }

  /**
   * Helper: Check if Stripe is ready
   */
  static isStripeReady(): boolean {
    return config.stripe.isEnabled;
  }

  /**
   * Helper: Get test card info for development
   */
  static getTestCardInfo() {
    if (!config.stripe.isEnabled) return null;
    
    return {
      number: '4242424242424242',
      expiry: '12/34',
      cvc: '123',
      description: 'Test-Kreditkarte für Entwicklung'
    };
  }
} 