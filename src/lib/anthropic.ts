import { supabase } from './supabase'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  image?: string // Base64 data (without data URL prefix) for images
}

const API_BASE = '/api'

async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ?? null
}

export async function sendMessage(messages: ChatMessage[]): Promise<string> {
  const token = await getAuthToken()

  if (!token) {
    throw new Error('User not authenticated')
  }

  const response = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ messages, stream: false }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Chat API error:', error)
    throw new Error('Failed to get response from AI')
  }

  const data = await response.json()
  return data.content
}

export async function* streamMessage(messages: ChatMessage[]): AsyncGenerator<string> {
  const token = await getAuthToken()

  if (!token) {
    throw new Error('User not authenticated')
  }

  // Note: Netlify functions don't support true streaming
  // So we fetch the complete response and yield it
  const response = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ messages, stream: true }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Chat API error:', error)
    throw new Error('Failed to get response from AI')
  }

  const data = await response.json()

  // Simulate streaming by yielding chunks of the response
  const text = data.content
  const chunkSize = 10
  for (let i = 0; i < text.length; i += chunkSize) {
    yield text.slice(i, i + chunkSize)
    // Small delay to simulate streaming effect
    await new Promise(resolve => setTimeout(resolve, 10))
  }
}

export async function analyzeQuote(imageBase64: string): Promise<string> {
  const token = await getAuthToken()

  if (!token) {
    throw new Error('User not authenticated')
  }

  const response = await fetch(`${API_BASE}/analyze-quote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ imageBase64 }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Quote analysis API error:', error)
    throw new Error('Failed to analyze quote')
  }

  const data = await response.json()
  return data.content
}
