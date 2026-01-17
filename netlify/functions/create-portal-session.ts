import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
})

interface RequestBody {
  customerId: string
}

export async function handler(event: { body: string | null }) {
  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing request body' }),
    }
  }

  try {
    const { customerId } = JSON.parse(event.body) as RequestBody

    if (!customerId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing customerId' }),
      }
    }

    const origin = process.env.URL || 'http://localhost:5173'

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/app/account`,
    })

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: session.url }),
    }
  } catch (error) {
    console.error('Portal session error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to create portal session' }),
    }
  }
}
