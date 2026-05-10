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

  // Read true SSE stream from the API
  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    // Normalise \r\n to \n so splitting works for both Unix and Windows line-endings
    const lines = buffer.replace(/\r\n/g, '\n').split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const payload = line.slice(6).trim()
      if (payload === '[DONE]') return
      try {
        const { text } = JSON.parse(payload)
        if (text) yield text
      } catch { /* incomplete chunk, skip */ }
    }
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
