import { loadStripe } from '@stripe/stripe-js'

const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY

if (!stripePublicKey) {
  console.warn('Stripe public key not configured. Please add VITE_STRIPE_PUBLIC_KEY to your .env file.')
}

export const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null

export const STRIPE_PRICES = {
  PREMIUM_MONTHLY: import.meta.env.VITE_STRIPE_PRICE_MONTHLY || 'price_monthly',
  PREMIUM_YEARLY: import.meta.env.VITE_STRIPE_PRICE_YEARLY || 'price_yearly',
  PAY_PER_DEVIS: import.meta.env.VITE_STRIPE_PRICE_DEVIS || 'price_devis',
}

export type ProductType = 'subscription' | 'diagnostic' | 'devis' | 'chat' | 'video'

export async function createCheckoutSession(
  priceId: string,
  isSubscription: boolean,
  userId: string,
  plan?: 'monthly' | 'yearly',
  productType?: ProductType
) {
  // Detect plan from priceId if not provided
  const detectedPlan = plan || (priceId === STRIPE_PRICES.PREMIUM_YEARLY ? 'yearly' : 'monthly')

  // Detect product type from priceId if not provided
  let detectedProductType: ProductType = productType || 'subscription'
  if (!isSubscription && !productType) {
    if (priceId === STRIPE_PRICES.PAY_PER_DEVIS) {
      detectedProductType = 'devis'
    }
  }

  const response = await fetch('/.netlify/functions/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      priceId,
      mode: isSubscription ? 'subscription' : 'payment',
      userId,
      plan: detectedPlan,
      productType: detectedProductType,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create checkout session')
  }

  const { url } = await response.json()

  if (url) {
    window.location.href = url
  } else {
    throw new Error('No checkout URL received')
  }
}

export async function getCustomerPortalUrl(customerId: string): Promise<string> {
  const response = await fetch('/.netlify/functions/create-portal-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerId }),
  })

  if (!response.ok) {
    const data = await response.json()
    if (data.error === 'NO_SUBSCRIPTION') {
      throw new Error('NO_SUBSCRIPTION')
    }
    throw new Error('Failed to create portal session')
  }

  const { url } = await response.json()
  return url
}

export async function getCustomerPortalUrlByUserId(userId: string): Promise<string> {
  const response = await fetch('/.netlify/functions/create-portal-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  })

  if (!response.ok) {
    const data = await response.json()
    if (data.error === 'NO_SUBSCRIPTION') {
      throw new Error('NO_SUBSCRIPTION')
    }
    throw new Error('Failed to create portal session')
  }

  const { url } = await response.json()
  return url
}
