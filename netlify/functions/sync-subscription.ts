import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
})

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
)

interface SyncEvent {
  body: string
  headers: Record<string, string>
}

export async function handler(event: SyncEvent) {
  // Only allow POST
  if (event.headers['content-type']?.includes('application/json') === false) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid content type' }),
    }
  }

  try {
    const { userId, email } = JSON.parse(event.body || '{}')

    if (!userId || !email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing userId or email' }),
      }
    }

    console.log(`[sync-subscription] Syncing for user ${userId} (${email})`)

    // Search for customer by email in Stripe
    const customers = await stripe.customers.list({
      email: email,
      limit: 1,
    })

    if (customers.data.length === 0) {
      console.log(`[sync-subscription] No Stripe customer found for ${email}`)
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          status: 'free',
          message: 'Aucun abonnement Stripe trouvé',
        }),
      }
    }

    const customer = customers.data[0]
    console.log(`[sync-subscription] Found customer ${customer.id}`)

    // Get active subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 1,
    })

    let newStatus = 'free'
    let subscriptionId = null

    if (subscriptions.data.length > 0) {
      const subscription = subscriptions.data[0]
      newStatus = 'premium'
      subscriptionId = subscription.id
      console.log(`[sync-subscription] Found active subscription ${subscription.id}`)
    } else {
      // Check for trialing subscriptions too
      const trialingSubscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        status: 'trialing',
        limit: 1,
      })

      if (trialingSubscriptions.data.length > 0) {
        const subscription = trialingSubscriptions.data[0]
        newStatus = 'premium'
        subscriptionId = subscription.id
        console.log(`[sync-subscription] Found trialing subscription ${subscription.id}`)
      }
    }

    // Update Supabase profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        subscription_status: newStatus,
        stripe_customer_id: customer.id,
        stripe_subscription_id: subscriptionId,
      })
      .eq('id', userId)

    if (updateError) {
      console.error(`[sync-subscription] Update error:`, updateError)
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to update profile' }),
      }
    }

    console.log(`[sync-subscription] Updated user ${userId} to ${newStatus}`)

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        status: newStatus,
        customerId: customer.id,
        subscriptionId,
        message: newStatus === 'premium'
          ? 'Abonnement Premium activé !'
          : 'Aucun abonnement actif trouvé',
      }),
    }
  } catch (error) {
    console.error('[sync-subscription] Error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    }
  }
}
