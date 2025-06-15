import { loadStripe } from '@stripe/stripe-js';

// Stripe Publishable Key (Frontend)
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  console.warn('VITE_STRIPE_PUBLISHABLE_KEY is not set. Stripe functionality will be disabled.');
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
    url: import.meta.env.VITE_APP_URL || 'http://localhost:5174',
    environment: import.meta.env.VITE_ENVIRONMENT || 'development',
  },
  pricing: {
    // Preise in Cents (Stripe Standard)
    ownerPremium: parseInt(import.meta.env.VITE_STRIPE_PRICE_OWNER_PREMIUM || '490'),
    caretakerProfessional: parseInt(import.meta.env.VITE_STRIPE_PRICE_CARETAKER_PROFESSIONAL || '1290'),
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

// Environment checks
export const isDevelopment = config.app.environment === 'development';
export const isProduction = config.app.environment === 'production'; 