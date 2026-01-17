import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
})

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
)

interface WebhookEvent {
  body: string
  headers: Record<string, string>
}

export async function handler(event: WebhookEvent) {
  const sig = event.headers['stripe-signature']
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !webhookSecret) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing signature or webhook secret' }),
    }
  }

  let stripeEvent: Stripe.Event

  try {
    stripeEvent = stripe.webhooks.constructEvent(event.body, sig, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid signature' }),
    }
  }

  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        const session = stripeEvent.data.object as Stripe.Checkout.Session
        const userId = session.client_reference_id || session.metadata?.userId

        if (!userId) {
          console.error('No userId found in session')
          break
        }

        if (session.mode === 'subscription') {
          // Subscription payment - activate premium
          await supabase
            .from('profiles')
            .update({
              subscription_status: 'premium',
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
            })
            .eq('id', userId)
        } else if (session.mode === 'payment') {
          // One-time payment - just track it, user already used the diagnostic
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
        const customerId = subscription.customer as string

        // Find user by customer ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (profile) {
          const status = subscription.status === 'active' ? 'premium' : 'free'
          await supabase
            .from('profiles')
            .update({ subscription_status: status })
            .eq('id', profile.id)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = stripeEvent.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Downgrade user to free
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (profile) {
          await supabase
            .from('profiles')
            .update({
              subscription_status: 'free',
              stripe_subscription_id: null,
            })
            .eq('id', profile.id)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = stripeEvent.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        // Could send notification to user here
        console.log('Payment failed for customer:', customerId)
        break
      }

      default:
        console.log('Unhandled event type:', stripeEvent.type)
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true }),
    }
  } catch (error) {
    console.error('Webhook processing error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Webhook processing failed' }),
    }
  }
}
