import type { VercelRequest, VercelResponse } from '@vercel/node'

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

export function handleCors(req: VercelRequest, res: VercelResponse): boolean {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v))
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return true
  }
  return false
}

export function json(res: VercelResponse, status: number, data: unknown) {
  return res.status(status).json(data)
}
