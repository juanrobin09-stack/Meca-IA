import { useState, useCallback, useRef } from 'react'
import { streamMessage, fetchChatResponse, type ChatMessage, type ChatOptions } from '@/lib/anthropic'
import type { Message, FinalDiagnosis } from '@/types'

export type DiagnosticPhase = 'collecting' | 'completed'

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [streamingContent, setStreamingContent] = useState('')
  const [finalDiagnosis, setFinalDiagnosis] = useState<FinalDiagnosis | null>(null)
  const [phase, setPhase] = useState<DiagnosticPhase>('collecting')
  const memoryContextRef = useRef<string | undefined>(undefined)
  const diagnosticIdRef = useRef<string | undefined>(undefined)

  // Set memory context for AI
  const setMemoryContext = useCallback((context: string | undefined) => {
    memoryContextRef.current = context
  }, [])

  // Set diagnostic ID for DB saving
  const setDiagnosticId = useCallback((id: string | undefined) => {
    diagnosticIdRef.current = id
  }, [])

  const sendMessage = useCallback(
    async (content: string, imageBase64?: string, forceFinalize?: boolean): Promise<Message | null> => {
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

        // Build options with all context
        const options: ChatOptions = {
          memoryContext: memoryContextRef.current,
          diagnosticId: diagnosticIdRef.current,
          forceFinalize
        }

        // Use the generator and capture the return value
        const generator = streamMessage(apiMessages, options)
        let result = await generator.next()

        while (!result.done) {
          fullResponse += result.value
          setStreamingContent(fullResponse)
          result = await generator.next()
        }

        // Get the final result with diagnosis info
        const streamResult = result.value
        if (streamResult) {
          fullResponse = streamResult.content
          if (streamResult.diagnosis) {
            setFinalDiagnosis(streamResult.diagnosis)
            setPhase('completed')
          }
          if (streamResult.phase) {
            setPhase(streamResult.phase)
          }
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

  // Force the AI to generate a diagnosis now
  const requestDiagnosis = useCallback(async (): Promise<Message | null> => {
    if (isLoading || messages.length < 2) return null

    setError(null)
    setIsLoading(true)
    setStreamingContent('')

    try {
      // Convert messages to ChatMessage format for API
      const apiMessages: ChatMessage[] = messages.map((m) => ({
        role: m.role,
        content: m.content,
        image: m.image?.startsWith('data:') ? m.image.split(',')[1] : m.image,
      }))

      // Add a prompt to trigger diagnosis
      apiMessages.push({
        role: 'user',
        content: 'Génère mon diagnostic maintenant avec les informations que tu as.'
      })

      const options: ChatOptions = {
        memoryContext: memoryContextRef.current,
        diagnosticId: diagnosticIdRef.current,
        forceFinalize: true
      }

      const response = await fetchChatResponse(apiMessages, options)

      if (response.diagnosis) {
        setFinalDiagnosis(response.diagnosis)
        setPhase('completed')
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.content,
        timestamp: new Date().toISOString(),
      }

      // Add the user request message
      const userRequestMessage: Message = {
        role: 'user',
        content: '🔍 Obtenir mon diagnostic',
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, userRequestMessage, assistantMessage])
      setIsLoading(false)

      return assistantMessage
    } catch (err) {
      console.error('Diagnosis request error:', err)
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      setIsLoading(false)
      return null
    }
  }, [messages, isLoading])

  const loadMessages = useCallback((msgs: Message[]) => {
    setMessages(msgs)
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
    setStreamingContent('')
    setFinalDiagnosis(null)
    setPhase('collecting')
  }, [])

  // Count user messages (for showing the diagnosis button)
  const userMessageCount = messages.filter(m => m.role === 'user').length

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
    setDiagnosticId,
    // New diagnosis-related exports
    finalDiagnosis,
    phase,
    requestDiagnosis,
    userMessageCount,
    canRequestDiagnosis: userMessageCount >= 2 && phase === 'collecting' && !isLoading,
  }
}
