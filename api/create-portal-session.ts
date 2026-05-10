import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors, json } from './_cors'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-12-18.acacia' })
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })

  const { userId, customerId } = req.body as { userId?: string; customerId?: string }

  try {
    let stripeCustomerId = customerId

    if (userId && !customerId) {
      const { data: profile, error: dbError } = await supabase
        .from('profiles')
        .select('stripe_customer_id, subscription_status')
        .eq('id', userId)
        .single()

      if (dbError) return json(res, 500, { error: 'Database error' })

      if (!profile?.stripe_customer_id) {
        return json(res, 404, { error: 'NO_SUBSCRIPTION', message: 'Aucun abonnement Premium actif' })
      }

      stripeCustomerId = profile.stripe_customer_id
    }

    if (!stripeCustomerId) return json(res, 400, { error: 'Missing userId or customerId' })

    const origin = process.env.VITE_APP_URL || `https://${process.env.VERCEL_URL}` || 'http://localhost:5173'

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${origin}/app/settings`,
    })

    return json(res, 200, { url: session.url })
  } catch (error) {
    console.error('Portal session error:', error)
    return json(res, 500, { error: 'Failed to create portal session' })
  }
}
