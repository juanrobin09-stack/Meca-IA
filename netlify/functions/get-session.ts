import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
})

export async function handler(event: { queryStringParameters: Record<string, string> | null }) {
  const sessionId = event.queryStringParameters?.session_id

  if (!sessionId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing session_id' }),
    }
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        payment_status: session.payment_status,
        mode: session.mode,
        customer: session.customer,
        subscription: session.subscription,
        client_reference_id: session.client_reference_id,
        productType: session.metadata?.productType || 'subscription',
      }),
    }
  } catch (error) {
    console.error('Session retrieval error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to retrieve session' }),
    }
  }
}
