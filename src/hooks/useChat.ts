import { useState, useCallback, useRef } from 'react'
import { streamMessage, type ChatMessage, type ChatOptions } from '@/lib/anthropic'
import type { Message } from '@/types'

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [streamingContent, setStreamingContent] = useState('')
  const memoryContextRef = useRef<string | undefined>(undefined)

  // Set memory context for AI
  const setMemoryContext = useCallback((context: string | undefined) => {
    memoryContextRef.current = context
  }, [])

  const sendMessage = useCallback(
    async (content: string, imageBase64?: string): Promise<Message | null> => {
      if (isLoading) return null

      setError(null)
      setIsLoading(true)
      setStreamingContent('')

      const userMessage: Message = {
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
        image: imageBase64 ? `data:image/jpeg;base64,${imageBase64}` : undefined,
      }

      setMessages((prev) => [...prev, userMessage])

      try {
        let fullResponse = ''

        // Convert messages to ChatMessage format for API
        const apiMessages: ChatMessage[] = [...messages, userMessage].map((m) => ({
          role: m.role,
          content: m.content,
          // Extract base64 data from data URL if present
          image: m.image?.startsWith('data:') ? m.image.split(',')[1] : m.image,
        }))

        // Pass memory context if available
        const options: ChatOptions | undefined = memoryContextRef.current
          ? { memoryContext: memoryContextRef.current }
          : undefined

        for await (const chunk of streamMessage(apiMessages, options)) {
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
    setMemoryContext,
  }
}
