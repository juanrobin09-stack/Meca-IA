import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import type { VercelRequest, VercelResponse } from '@vercel/node'

// Vercel doit recevoir le corps brut pour valider la signature Stripe
export const config = { api: { bodyParser: false } }

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-12-18.acacia' })
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
)

async function getRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const sig = req.headers['stripe-signature'] as string
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !webhookSecret) {
    return res.status(400).json({ error: 'Missing signature or webhook secret' })
  }

  let stripeEvent: Stripe.Event
  try {
    const rawBody = await getRawBody(req)
    stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return res.status(400).json({ error: 'Invalid signature' })
  }

  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        const session = stripeEvent.data.object as Stripe.Checkout.Session
        const userId = session.client_reference_id || session.metadata?.userId
        if (!userId) break

        if (session.mode === 'subscription') {
          await supabase.from('profiles').update({
            subscription_status: 'premium',
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
          }).eq('id', userId)
        } else if (session.mode === 'payment') {
          await supabase.from('payments').insert({
            user_id: userId,
            stripe_payment_id: session.payment_intent as string,
            amount: session.amount_total || 299,
            currency: session.currency || 'eur',
            payment_type: 'one_time',
            status: 'succeeded',
          })
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = stripeEvent.data.object as Stripe.Subscription
        const { data: profile } = await supabase
          .from('profiles').select('id').eq('stripe_customer_id', subscription.customer as string).single()
        if (profile) {
          await supabase.from('profiles').update({
            subscription_status: subscription.status === 'active' ? 'premium' : 'free',
          }).eq('id', profile.id)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = stripeEvent.data.object as Stripe.Subscription
        const { data: profile } = await supabase
          .from('profiles').select('id').eq('stripe_customer_id', subscription.customer as string).single()
        if (profile) {
          await supabase.from('profiles').update({
            subscription_status: 'free',
            stripe_subscription_id: null,
          }).eq('id', profile.id)
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = stripeEvent.data.object as Stripe.Invoice
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
          const userId = subscription.metadata.user_id
          if (userId) {
            await supabase.from('profiles').update({
              subscription_status: 'premium',
              stripe_subscription_id: invoice.subscription as string,
            }).eq('id', userId)
          }
        }
        break
      }

      case 'customer.subscription.created': {
        const subscription = stripeEvent.data.object as Stripe.Subscription
        const userId = subscription.metadata.user_id
        if (userId) {
          await supabase.from('profiles').update({
            subscription_status: 'premium',
            stripe_customer_id: subscription.customer as string,
            stripe_subscription_id: subscription.id,
          }).eq('id', userId)
        }
        break
      }

      default:
        console.log('Unhandled event type:', stripeEvent.type)
    }

    return res.status(200).json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return res.status(500).json({ error: 'Webhook processing failed' })
  }
}
