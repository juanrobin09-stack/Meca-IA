import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
})

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
)

interface RequestBody {
  userId?: string
  customerId?: string
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
    const { userId, customerId } = JSON.parse(event.body) as RequestBody

    let stripeCustomerId = customerId

    // Si userId fourni, récupérer le customer ID depuis la DB
    if (userId && !customerId) {
      const { data: profile, error: dbError } = await supabase
        .from('profiles')
        .select('stripe_customer_id, subscription_status')
        .eq('id', userId)
        .single()

      if (dbError) {
        console.error('Database error:', dbError)
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Database error' }),
        }
      }

      if (!profile?.stripe_customer_id) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            error: 'NO_SUBSCRIPTION',
            message: 'Aucun abonnement Premium actif',
          }),
        }
      }

      stripeCustomerId = profile.stripe_customer_id
    }

    if (!stripeCustomerId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing userId or customerId' }),
      }
    }

    const origin = process.env.URL || 'http://localhost:5173'

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${origin}/app/settings`,
    })

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ url: session.url }),
    }
  } catch (error) {
    console.error('Portal session error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to create portal session' }),
    }
  }
}
