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
}

export class StripeService {
  /**
   * Erstelle eine Checkout Session
   */
  static async createCheckoutSession(data: CheckoutSessionData): Promise<CheckoutResult> {
    try {
      if (!config.stripe.isEnabled) {
        return { 
          success: false, 
          error: 'Stripe ist nicht konfiguriert. Bitte Umgebungsvariablen überprüfen.' 
        };
      }

      // Preis basierend auf Plan berechnen
      const priceInCents = getPriceInCents(data.plan);
      const planDisplayName = getPlanDisplayName(data.userType, data.plan === 'professional' ? 'premium' : data.plan);

      // Supabase Edge Function aufrufen für Checkout Session
      const { data: sessionData, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          priceInCents,
          planType: data.plan,
          userType: data.userType,
          userId: data.userId,
          userEmail: data.userEmail,
          planDisplayName,
          successUrl: `${config.app.url}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${config.app.url}/mitgliedschaften?cancelled=true`,
        }
      });

      if (error) {
        console.error('Error creating checkout session:', error);
        return { 
          success: false, 
          error: 'Fehler beim Erstellen der Checkout-Session' 
        };
      }

      return {
        success: true,
        sessionId: sessionData.sessionId
      };

    } catch (error) {
      console.error('Stripe checkout error:', error);
      return { 
        success: false, 
        error: 'Unerwarteter Fehler beim Checkout' 
      };
    }
  }

  /**
   * Weiterleitung zum Stripe Checkout
   */
  static async redirectToCheckout(sessionId: string): Promise<void> {
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
   * Kompletter Checkout Flow
   */
  static async startCheckout(data: CheckoutSessionData): Promise<void> {
    try {
      // 1. Checkout Session erstellen
      const result = await this.createCheckoutSession(data);
      
      if (!result.success || !result.sessionId) {
        throw new Error(result.error || 'Checkout Session konnte nicht erstellt werden');
      }

      // 2. Zum Stripe Checkout weiterleiten
      await this.redirectToCheckout(result.sessionId);
      
    } catch (error) {
      console.error('Checkout flow error:', error);
      throw error;
    }
  }

  /**
   * Validate Checkout Session (für Success Page)
   */
  static async validateCheckoutSession(sessionId: string): Promise<{
    success: boolean;
    session?: any;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('validate-checkout-session', {
        body: { sessionId }
      });

      if (error) {
        return { 
          success: false, 
          error: 'Session konnte nicht validiert werden' 
        };
      }

      return {
        success: true,
        session: data.session
      };

    } catch (error) {
      console.error('Session validation error:', error);
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