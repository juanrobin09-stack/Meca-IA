import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/hooks/useSubscription'
import { useDiagnostics } from '@/hooks/useDiagnostics'
import { useChat } from '@/hooks/useChat'
import { useConfetti } from '@/hooks/useConfetti'
import { AIMemoryService } from '@/services/aiMemoryService'
import Sidebar from '@/components/Sidebar'
import ChatMessage from '@/components/ChatMessage'
import PaywallModal from '@/components/PaywallModal'
import PlateScanner from '@/components/PlateScanner'
import { compressImage, validateImageFile } from '@/utils/imageCompression'
import type { Message } from '@/types'

interface VehicleInfo {
  plate: string
  brand: string
  model: string
  year: string
  fuel: string
}

const MAX_PHOTOS_PER_CONVERSATION = 2
const MAX_MESSAGES_PER_DIAGNOSTIC = 15

function isDiagnosticComplete(content: string): boolean {
  const hasEstimation = content.includes('Estimation') || content.includes('estimation')
  const hasDiagnostic = content.includes('Diagnostic') || content.includes('diagnostic')
  const hasPieces = content.includes('pièce') || content.includes('Pièce')
  return (hasEstimation && hasDiagnostic) || hasPieces
}

const EXAMPLE_QUESTIONS = [
  { text: 'Ma voiture fait un bruit au freinage', icon: '🔊' },
  { text: 'Voyant moteur allumé', icon: '🚨' },
  { text: "Fuite sous ma voiture", icon: '💧' }
]

export default function Chat() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, profile, refreshProfile } = useAuth()
  const { isPremium, diagnosticsRemaining, purchasedDiagnosticCredits, checkDiagnosticLimit, incrementDiagnosticCount } = useSubscription(profile)
  const { currentDiagnostic, createDiagnostic, addMessage, loadDiagnostic, setCurrentDiagnostic } = useDiagnostics(user?.id)
  const { messages, isLoading, error, streamingContent, sendMessage, loadMessages, clearMessages, setMemoryContext } = useChat()
  const { celebrate } = useConfetti()
  const hasConfettiedRef = useRef(false)
  const memoryLoadedRef = useRef(false)

  const [input, setInput] = useState('')
  const [showPaywall, setShowPaywall] = useState(false)
  const [isNewConversation, setIsNewConversation] = useState(true)
  const [currentRemaining, setCurrentRemaining] = useState<number>(diagnosticsRemaining)
  const [currentPurchasedCredits, setCurrentPurchasedCredits] = useState<number>(purchasedDiagnosticCredits)
  const [selectedImage, setSelectedImage] = useState<{ dataUrl: string; base64: string } | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showPlateScanner, setShowPlateScanner] = useState(false)
  const [scannedVehicle, setScannedVehicle] = useState<VehicleInfo | null>(null)

  const photosUsed = messages.filter(m => m.image).length
  const userMessagesCount = messages.filter(m => m.role === 'user').length
  const messagesRemaining = MAX_MESSAGES_PER_DIAGNOSTIC - userMessagesCount
  const isAtMessageLimit = !isPremium && userMessagesCount >= MAX_MESSAGES_PER_DIAGNOSTIC && !isNewConversation

  useEffect(() => {
    async function checkLimitOnLoad() {
      if (id) return

      const limitStatus = await checkDiagnosticLimit()
      setCurrentRemaining(limitStatus.remaining)
      setCurrentPurchasedCredits(limitStatus.purchasedCredits || 0)

      if (!limitStatus.canDiagnose && !limitStatus.isPremium) {
        setShowPaywall(true)
      }
    }

    if (user && profile) {
      checkLimitOnLoad()
    }
  }, [id, user, profile, checkDiagnosticLimit])

  useEffect(() => {
    async function loadMemory() {
      if (!user?.id || memoryLoadedRef.current) return

      try {
        const memory = await AIMemoryService.loadUserMemory(user.id)
        const memoryContext = AIMemoryService.generateContextForAI(memory)
        setMemoryContext(memoryContext)
        memoryLoadedRef.current = true
      } catch (err) {
        console.warn('[Chat] Failed to load AI memory:', err)
      }
    }

    loadMemory()
  }, [user?.id, setMemoryContext])

  useEffect(() => {
    if (id) {
      loadDiagnostic(id).then((diag) => {
        if (diag) {
          loadMessages(diag.conversation as Message[])
          setIsNewConversation(false)
        }
      }).catch(() => {
        navigate('/app/chat')
      })
    } else {
      clearMessages()
      setCurrentDiagnostic(null)
      setIsNewConversation(true)
    }
  }, [id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
  }, [input])

  useEffect(() => {
    if (hasConfettiedRef.current) return

    const lastMessage = messages[messages.length - 1]
    if (lastMessage?.role === 'assistant' && isDiagnosticComplete(lastMessage.content)) {
      hasConfettiedRef.current = true
      celebrate()
    }
  }, [messages, celebrate])

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    if (photosUsed >= MAX_PHOTOS_PER_CONVERSATION) {
      setImageError(`Maximum ${MAX_PHOTOS_PER_CONVERSATION} photos par conversation`)
      return
    }

    const validation = validateImageFile(file)
    if (!validation.valid) {
      setImageError(validation.error || 'Fichier invalide')
      return
    }

    setImageError(null)

    try {
      const compressed = await compressImage(file)
      setSelectedImage({
        dataUrl: compressed.dataUrl,
        base64: compressed.base64,
      })
    } catch (err) {
      console.error('Error compressing image:', err)
      setImageError('Erreur lors du traitement de l\'image')
    }
  }

  function removeSelectedImage() {
    setSelectedImage(null)
    setImageError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if ((!input.trim() && !selectedImage) || isLoading) return

    if (isAtMessageLimit) {
      setShowPaywall(true)
      return
    }

    const messageContent = input.trim() || (selectedImage ? 'Voici une photo de mon problème.' : '')
    const imageBase64 = selectedImage?.base64
    setInput('')
    setSelectedImage(null)

    if (isNewConversation) {
      const limitStatus = await checkDiagnosticLimit()

      if (!limitStatus.canDiagnose && !limitStatus.isPremium) {
        setShowPaywall(true)
        setInput(messageContent)
        return
      }
    }

    try {
      let diagnosticId = currentDiagnostic?.id

      if (!diagnosticId) {
        const diag = await createDiagnostic(messageContent)
        diagnosticId = diag.id
        setIsNewConversation(false)

        if (!isPremium) {
          await incrementDiagnosticCount()

          if (refreshProfile) {
            await refreshProfile()
          }

          setCurrentRemaining(prev => Math.max(0, prev - 1))
        }

        window.history.replaceState(null, '', `/app/chat/${diagnosticId}`)
      }

      const assistantMessage = await sendMessage(messageContent, imageBase64)

      if (assistantMessage && diagnosticId) {
        const userMessage: Message = {
          role: 'user',
          content: messageContent,
          timestamp: new Date().toISOString(),
          image: imageBase64 ? `data:image/jpeg;base64,${imageBase64}` : undefined,
        }
        await addMessage(diagnosticId, userMessage)
        await addMessage(diagnosticId, assistantMessage)
      }
    } catch (err) {
      console.error('Error sending message:', err)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  function handleVehicleConfirmed(vehicle: VehicleInfo) {
    setScannedVehicle(vehicle)
    if (!input.trim()) {
      setInput(`Ma ${vehicle.brand} ${vehicle.model} ${vehicle.year} (${vehicle.fuel}) a un problème: `)
    }
  }

  const displayRemaining = currentRemaining

  return (
    <div className="h-[100dvh] flex flex-col bg-white dark:bg-neutral-950 overflow-hidden">
      <Sidebar />

      <div className="md:pl-64 flex-1 flex flex-col overflow-hidden">
        {/* HEADER - Fixed top with safe area */}
        <header className="flex-shrink-0 bg-white dark:bg-neutral-950 border-b border-gray-200 dark:border-neutral-800 px-4 pt-safe-top pb-3">
          <div className="flex items-center justify-between h-12 max-w-3xl mx-auto">
            {/* Left: Back + Avatar + Name */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                onClick={() => navigate('/app')}
                className="md:hidden w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 -ml-1"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-neutral-950 rounded-full"></div>
              </div>

              <div className="min-w-0 flex-1">
                <h1 className="text-base font-semibold text-gray-900 dark:text-white truncate">Diagnostic IA</h1>
                <p className="text-xs text-gray-500 dark:text-neutral-400 truncate">Expert auto • En ligne</p>
              </div>
            </div>

            {/* Right: Counter */}
            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
              <div className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-neutral-800 text-xs font-medium text-gray-700 dark:text-neutral-300 whitespace-nowrap">
                {isPremium ? '∞' : isNewConversation ? `${displayRemaining}/2` : `${messagesRemaining} msg`}
                {currentPurchasedCredits > 0 && <span className="text-emerald-600"> +{currentPurchasedCredits}</span>}
              </div>
            </div>
          </div>

          {/* Scanned vehicle badge */}
          {scannedVehicle && (
            <div className="mt-2 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-full">
                <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-xs text-emerald-800 dark:text-emerald-300">
                  {scannedVehicle.brand} {scannedVehicle.model} • {scannedVehicle.year}
                </span>
                <button onClick={() => setScannedVehicle(null)} className="text-emerald-600 hover:text-emerald-800">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Warning near limit */}
          {!isPremium && !isNewConversation && messagesRemaining <= 3 && messagesRemaining > 0 && (
            <div className="mt-2 max-w-3xl mx-auto px-3 py-2 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg">
              <p className="text-xs text-orange-800 dark:text-orange-300">
                ⚠️ Plus que {messagesRemaining} message{messagesRemaining > 1 ? 's' : ''} pour ce diagnostic
              </p>
            </div>
          )}
        </header>

        {/* MESSAGES - Scrollable middle */}
        <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
            {messages.length === 0 && !streamingContent ? (
              /* Empty State */
              <div className="flex flex-col items-center justify-center min-h-[50vh] text-center py-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                  Comment puis-je t'aider ?
                </h2>
                <p className="text-sm text-gray-500 dark:text-neutral-400 mb-6">
                  Décris ton problème auto
                </p>

                {/* Scan plate button */}
                {!scannedVehicle && (
                  <button
                    onClick={() => setShowPlateScanner(true)}
                    className="mb-6 px-4 py-2 text-sm text-gray-600 dark:text-neutral-400 bg-gray-100 dark:bg-neutral-900 rounded-full hover:bg-gray-200 dark:hover:bg-neutral-800 transition-colors flex items-center gap-2 active:scale-98"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Scanner ma plaque
                  </button>
                )}

                {/* Quick actions */}
                <div className="w-full max-w-sm space-y-2">
                  {EXAMPLE_QUESTIONS.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(q.text)}
                      className="w-full p-3 text-left text-sm bg-gray-50 dark:bg-neutral-900 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-xl transition-colors flex items-center gap-3 active:scale-98"
                    >
                      <span className="text-lg">{q.icon}</span>
                      <span className="text-gray-700 dark:text-neutral-300">{q.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Messages */
              <>
                {messages.map((message, index) => (
                  <ChatMessage key={index} message={message} />
                ))}

                {streamingContent && (
                  <ChatMessage
                    message={{
                      role: 'assistant',
                      content: streamingContent,
                      timestamp: new Date().toISOString(),
                    }}
                    isStreaming
                  />
                )}

                {isLoading && !streamingContent && (
                  <div className="flex justify-start">
                    <div className="flex gap-2.5 max-w-[85%]">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm flex-shrink-0">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="bg-gray-100 dark:bg-neutral-800 rounded-2xl px-4 py-3">
                        <div className="flex gap-1.5">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl text-sm text-red-600 dark:text-red-400">
                    {error}
                  </div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </div>

        {/* INPUT BAR - Fixed bottom with safe area */}
        <div className="flex-shrink-0 bg-white dark:bg-neutral-950 border-t border-gray-200 dark:border-neutral-800 px-4 pt-3 pb-safe-bottom">
          <div className="max-w-3xl mx-auto">
            {/* Image preview */}
            {selectedImage && (
              <div className="mb-2">
                <div className="relative inline-block">
                  <img src={selectedImage.dataUrl} alt="Preview" className="h-16 rounded-lg" />
                  <button
                    onClick={removeSelectedImage}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full flex items-center justify-center"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {imageError && (
              <div className="mb-2 text-xs text-red-500">{imageError}</div>
            )}

            {/* Limit warning */}
            {isAtMessageLimit && (
              <div className="mb-2 px-3 py-2 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg text-xs text-orange-700 dark:text-orange-400 text-center">
                Limite atteinte · <button onClick={() => setShowPaywall(true)} className="underline font-medium">Passer Premium</button>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="flex items-end gap-2">
                {/* Photo button */}
                <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageSelect} className="hidden" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading || photosUsed >= MAX_PHOTOS_PER_CONVERSATION || isAtMessageLimit}
                  className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400 hover:bg-gray-200 dark:hover:bg-neutral-700 active:scale-95 transition-all disabled:opacity-40 flex-shrink-0"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>

                {/* Textarea */}
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isAtMessageLimit ? "Limite atteinte" : "Décris ton problème..."}
                    disabled={isLoading || isAtMessageLimit}
                    rows={1}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-base text-gray-900 dark:text-white placeholder-gray-500 disabled:opacity-50"
                    style={{
                      minHeight: '48px',
                      maxHeight: '120px',
                      fontSize: '16px'
                    }}
                  />
                </div>

                {/* Send button */}
                <button
                  type="submit"
                  disabled={(!input.trim() && !selectedImage) || isLoading || isAtMessageLimit}
                  className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none flex-shrink-0"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </div>
            </form>

            <p className="text-[10px] text-gray-400 text-center mt-2">
              Diagnostics à titre indicatif uniquement
            </p>
          </div>
        </div>
      </div>

      <PaywallModal open={showPaywall} onOpenChange={setShowPaywall} />
      <PlateScanner
        open={showPlateScanner}
        onOpenChange={setShowPlateScanner}
        onVehicleConfirmed={handleVehicleConfirmed}
      />
    </div>
  )
}
