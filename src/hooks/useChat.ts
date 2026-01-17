import { useState, useCallback } from 'react'
import { streamMessage } from '@/lib/anthropic'
import type { Message } from '@/types'

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [streamingContent, setStreamingContent] = useState('')

  const sendMessage = useCallback(
    async (content: string): Promise<Message | null> => {
      if (isLoading) return null

      setError(null)
      setIsLoading(true)
      setStreamingContent('')

      const userMessage: Message = {
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, userMessage])

      try {
        let fullResponse = ''

        for await (const chunk of streamMessage([...messages, userMessage])) {
          fullResponse += chunk
          setStreamingContent(fullResponse)
        }

        const assistantMessage: Message = {
          role: 'assistant',
          content: fullResponse,
          timestamp: new Date().toISOString(),
        }

        setMessages((prev) => [...prev, assistantMessage])
        setStreamingContent('')
        setIsLoading(false)

        return assistantMessage
      } catch (err) {
        console.error('Chat error:', err)
        setError(err instanceof Error ? err.message : 'Une erreur est survenue')
        setIsLoading(false)
        return null
      }
    },
    [messages, isLoading]
  )

  const loadMessages = useCallback((msgs: Message[]) => {
    setMessages(msgs)
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
    setStreamingContent('')
  }, [])

  return {
    messages,
    isLoading,
    error,
    streamingContent,
    sendMessage,
    loadMessages,
    clearMessages,
    setMessages,
  }
}
