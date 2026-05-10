import Stripe from 'stripe'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors, json } from './_cors'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-12-18.acacia' })

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return

  const sessionId = req.query.session_id as string
  if (!sessionId) return json(res, 400, { error: 'Missing session_id' })

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    return json(res, 200, {
      payment_status: session.payment_status,
      mode: session.mode,
      customer: session.customer,
      subscription: session.subscription,
      client_reference_id: session.client_reference_id,
    })
  } catch (error) {
    console.error('Session retrieval error:', error)
    return json(res, 500, { error: 'Failed to retrieve session' })
  }
}
