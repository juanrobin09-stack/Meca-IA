import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
})

interface RequestBody {
  priceId: string
  mode: 'subscription' | 'payment'
  userId: string
}

export async function handler(event: { body: string | null }) {
  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing request body' }),
    }
  }

  try {
    const { priceId, mode, userId } = JSON.parse(event.body) as RequestBody

    if (!priceId || !mode || !userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' }),
      }
    }

    const origin = process.env.URL || 'http://localhost:5173'

    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/app`,
      client_reference_id: userId,
      metadata: { userId },
    })

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: session.id,
        url: session.url,
      }),
    }
  } catch (error) {
    console.error('Stripe session error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to create checkout session' }),
    }
  }
}
