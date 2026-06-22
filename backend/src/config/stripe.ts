import Stripe from 'stripe';
import { config } from './env';

let stripe: Stripe | null = null;

if (config.stripeSecretKey) {
  stripe = new Stripe(config.stripeSecretKey, {
    apiVersion: '2024-11-20.acacia',
  });
}

export { stripe };
