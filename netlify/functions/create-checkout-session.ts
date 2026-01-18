import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

// Log env vars status at cold start
console.log('Checkout session env check:', {
  hasStripeKey: !!STRIPE_SECRET_KEY,
  hasSupabaseUrl: !!SUPABASE_URL,
  hasSupabaseServiceKey: !!SUPABASE_SERVICE_KEY,
})

const stripe = new Stripe(STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
})

const supabase = createClient(
  SUPABASE_URL || '',
  SUPABASE_SERVICE_KEY || ''
)

type ProductType = 'subscription' | 'diagnostic' | 'devis' | 'chat' | 'video'

interface RequestBody {
  priceId: string
  mode: 'subscription' | 'payment'
  userId: string
  plan?: 'monthly' | 'yearly'
  productType?: ProductType
}

interface WebhookEvent {
  body: string | null
  headers: Record<string, string>
  httpMethod: string
}

export async function handler(event: WebhookEvent) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  }

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  if (!event.body) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Missing request body' }),
    }
  }

  try {
    const { priceId, mode, userId, plan, productType } = JSON.parse(event.body) as RequestBody

    console.log('Checkout request:', { priceId, mode, userId, plan, productType })

    if (!priceId || !mode || !userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields: priceId, mode, userId' }),
      }
    }

    // Validate env vars at runtime
    if (!STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY is not configured')
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Stripe is not configured on the server' }),
      }
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      console.error('Supabase is not configured')
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Database is not configured on the server' }),
      }
    }

    // 1. Get user profile from Supabase
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, stripe_customer_id, subscription_status')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('Profile error:', profileError)
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'User not found' }),
      }
    }

    // 2. Check if already premium
    if (profile.subscription_status === 'premium') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'User is already Premium' }),
      }
    }

    // 3. Get or create Stripe customer
    let customerId = profile.stripe_customer_id

    if (!customerId) {
      // Get user email from auth
      const { data: authData } = await supabase.auth.admin.getUserById(userId)
      const email = authData?.user?.email

      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: email || undefined,
        metadata: {
          supabase_user_id: userId,
        },
      })
      customerId = customer.id

      // Save customer ID to profile
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId)
    }

    const origin = process.env.URL || 'http://localhost:5173'

    // 4. Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?cancelled=true`,
      client_reference_id: userId,
      metadata: {
        userId,
        plan: plan || 'monthly',
        productType: productType || 'subscription',
      },
      subscription_data: mode === 'subscription' ? {
        metadata: {
          user_id: userId,
          plan: plan || 'monthly',
        },
      } : undefined,
      billing_address_collection: 'required',
      allow_promotion_codes: true,
      locale: 'fr',
    })

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        sessionId: session.id,
        url: session.url,
      }),
    }
  } catch (error: any) {
    console.error('Stripe session error:', error)
    const errorMessage = error?.message || error?.raw?.message || 'Unknown error'
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: errorMessage,
        type: error?.type || 'unknown',
        code: error?.code || 'unknown'
      }),
    }
  }
}
