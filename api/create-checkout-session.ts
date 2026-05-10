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

  const { priceId, mode, userId, plan } = req.body as {
    priceId: string
    mode: 'subscription' | 'payment'
    userId: string
    plan?: 'monthly' | 'yearly'
  }

  if (!priceId || !mode || !userId) {
    return json(res, 400, { error: 'Missing required fields: priceId, mode, userId' })
  }

  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, stripe_customer_id, subscription_status')
      .eq('id', userId)
      .single()

    if (profileError) return json(res, 404, { error: 'User not found' })
    if (profile.subscription_status === 'premium') return json(res, 400, { error: 'User is already Premium' })

    let customerId = profile.stripe_customer_id

    if (!customerId) {
      const { data: authData } = await supabase.auth.admin.getUserById(userId)
      const customer = await stripe.customers.create({
        email: authData?.user?.email || undefined,
        metadata: { supabase_user_id: userId },
      })
      customerId = customer.id
      await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', userId)
    }

    const origin = process.env.VITE_APP_URL || `https://${process.env.VERCEL_URL}` || 'http://localhost:5173'

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?cancelled=true`,
      client_reference_id: userId,
      metadata: { userId, plan: plan || 'monthly' },
      subscription_data: mode === 'subscription' ? { metadata: { user_id: userId, plan: plan || 'monthly' } } : undefined,
      billing_address_collection: 'required',
      allow_promotion_codes: true,
      locale: 'fr',
    })

    return json(res, 200, { sessionId: session.id, url: session.url })
  } catch (error) {
    console.error('Stripe session error:', error)
    return json(res, 500, { error: 'Failed to create checkout session' })
  }
}
