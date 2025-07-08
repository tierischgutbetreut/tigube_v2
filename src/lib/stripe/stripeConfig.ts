import { loadStripe } from '@stripe/stripe-js';

// Stripe Configuration with Environment Variables
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripeSecretKey = import.meta.env.VITE_STRIPE_SECRET_KEY; // Used for Stripe FDW integration
const stripeWebhookSecret = import.meta.env.VITE_STRIPE_WEBHOOK_SECRET; // Not used in frontend, but for reference

// Pricing from Environment Variables with fallbacks
const ownerPremiumPrice = import.meta.env.VITE_STRIPE_PRICE_OWNER_PREMIUM;
const caretakerProfessionalPrice = import.meta.env.VITE_STRIPE_PRICE_CARETAKER_PROFESSIONAL;

// Debug logging for Stripe configuration
console.log('[Stripe Config] Environment check:', {
  hasPublishableKey: !!stripePublishableKey,
  publishableKeyPreview: stripePublishableKey ? `${stripePublishableKey.substring(0, 12)}...` : 'missing',
  hasOwnerPremiumPrice: !!ownerPremiumPrice,
  hasCaretakerProfessionalPrice: !!caretakerProfessionalPrice,
  ownerPremiumPrice: ownerPremiumPrice,
  caretakerProfessionalPrice: caretakerProfessionalPrice
});

if (!stripePublishableKey) {
  console.warn('[Stripe Config] VITE_STRIPE_PUBLISHABLE_KEY is not set. Stripe functionality will be disabled.');
}

if (!ownerPremiumPrice || !caretakerProfessionalPrice) {
  console.warn('[Stripe Config] Pricing environment variables are missing. Using default prices.');
}

// Initialize Stripe
export const stripePromise = stripePublishableKey 
  ? loadStripe(stripePublishableKey)
  : null;

// App Configuration
export const config = {
  stripe: {
    publishableKey: stripePublishableKey,
    isEnabled: !!stripePublishableKey,
  },
  app: {
    url: import.meta.env.VITE_APP_URL || window.location.origin,
    environment: import.meta.env.VITE_ENVIRONMENT || 'development',
  },
  pricing: {
    // Preise in Cents (Stripe Standard) - mit Fallback-Werten
    ownerPremium: (() => {
      if (ownerPremiumPrice && ownerPremiumPrice.startsWith('price_')) {
        // Ist eine echte Price ID - verwende 490 Cents als Fallback für Display
        return 490; // €4.90
      }
      return parseInt(ownerPremiumPrice || '490'); // €4.90 default
    })(),
    caretakerProfessional: (() => {
      if (caretakerProfessionalPrice && caretakerProfessionalPrice.startsWith('price_')) {
        // Ist eine echte Price ID - verwende 1290 Cents als Fallback für Display
        return 1290; // €12.90
      }
      return parseInt(caretakerProfessionalPrice || '1290'); // €12.90 default
    })()
  }
};

// Pricing Helper
export const getPriceInCents = (plan: 'premium' | 'professional'): number => {
  switch (plan) {
    case 'premium':
      return config.pricing.ownerPremium;
    case 'professional':
      return config.pricing.caretakerProfessional;
    default:
      return 0;
  }
};

// Format price for display
export const formatPrice = (cents: number): string => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
};

// Get plan display name
export const getPlanDisplayName = (userType: 'owner' | 'caretaker', plan: 'basic' | 'premium'): string => {
  if (plan === 'basic') return 'Starter';
  
  return userType === 'owner' ? 'Premium' : 'Professional';
};

// Get plan price for display - VERBESSERT
export const getPlanPrice = (userType: 'owner' | 'caretaker', plan: 'basic' | 'premium'): string => {
  if (plan === 'basic') return 'Kostenlos';
  
  const cents = userType === 'owner' ? config.pricing.ownerPremium : config.pricing.caretakerProfessional;
  const formattedPrice = formatPrice(cents);
  
  // Debug logging
  console.log(`[getPlanPrice] ${userType} ${plan}: ${cents} cents = ${formattedPrice}`);
  
  return formattedPrice;
};

// Environment checks
export const isDevelopment = config.app.environment === 'development';
export const isProduction = config.app.environment === 'production';

// Check if we're using Stripe test keys (works in both dev and production)
export const isStripeTestMode = stripePublishableKey?.includes('pk_test_') || false;
export const isStripeLiveMode = stripePublishableKey?.includes('pk_live_') || false;

// Production readiness check
export const getProductionReadiness = () => {
  const checks = {
    hasLiveKeys: isStripeLiveMode,
    hasPaymentLinks: !!(import.meta.env.VITE_STRIPE_PAYMENT_LINK_OWNER_PREMIUM && import.meta.env.VITE_STRIPE_PAYMENT_LINK_CARETAKER_PROFESSIONAL),
    hasValidAppUrl: !config.app.url.includes('localhost'),
    environment: config.app.environment
  };
  
  const isReady = isProduction ? (checks.hasLiveKeys && checks.hasPaymentLinks && checks.hasValidAppUrl) : true;
  
  return {
    ...checks,
    isReady,
    warnings: [
      ...(isProduction && !checks.hasLiveKeys ? ['⚠️ Production läuft mit Test-Keys'] : []),
      ...(isProduction && !checks.hasPaymentLinks ? ['⚠️ Payment Links fehlen für Production'] : []),
      ...(isProduction && !checks.hasValidAppUrl ? ['⚠️ App URL ist noch localhost'] : [])
    ]
  };
};

// Production mode warning for test keys
if (isProduction && isStripeTestMode) {
  console.warn('🚨 [Stripe Config] WARNUNG: Production-Environment verwendet Test-Keys! Echte Zahlungen sind nicht möglich.');
}

// Log final configuration with pricing details
const productionReadiness = getProductionReadiness();
console.log('[Stripe Config] Final configuration:', {
  isEnabled: config.stripe.isEnabled,
  environment: config.app.environment,
  stripeMode: isStripeLiveMode ? 'LIVE' : isStripeTestMode ? 'TEST' : 'UNKNOWN',
  productionReady: productionReadiness.isReady,
  warnings: productionReadiness.warnings,
  ownerPremiumPrice: formatPrice(config.pricing.ownerPremium),
  caretakerProfessionalPrice: formatPrice(config.pricing.caretakerProfessional),
  appUrl: config.app.url,
  pricing: {
    ownerPremiumCents: config.pricing.ownerPremium,
    caretakerProfessionalCents: config.pricing.caretakerProfessional
  }
}); 