import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
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
import PageTransition from '@/components/PageTransition'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  Send,
  Loader2,
  Plus,
  X,
  Car,
  CheckCircle2,
  Sparkles,
  Cpu,
  ChevronRight
} from 'lucide-react'
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

// Detect if diagnostic is complete
function isDiagnosticComplete(content: string): boolean {
  const hasEstimation = content.includes('Estimation') || content.includes('estimation')
  const hasDiagnostic = content.includes('Diagnostic') || content.includes('diagnostic')
  const hasPieces = content.includes('pièce') || content.includes('Pièce')
  return (hasEstimation && hasDiagnostic) || hasPieces
}

// Example questions - simples
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

  // Count photos used in this conversation
  const photosUsed = messages.filter(m => m.image).length

  // Count user messages in this conversation
  const userMessagesCount = messages.filter(m => m.role === 'user').length
  const messagesRemaining = MAX_MESSAGES_PER_DIAGNOSTIC - userMessagesCount
  const isAtMessageLimit = !isPremium && userMessagesCount >= MAX_MESSAGES_PER_DIAGNOSTIC && !isNewConversation

  // Check limit on page load for new conversations
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

  // Load AI memory context for the user
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

  // Load existing diagnostic if ID provided
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

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
  }, [input])

  // Trigger confetti when diagnostic is complete
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
    <PageTransition>
      <div className="min-h-screen bg-white dark:bg-neutral-950">
        <Sidebar />

        <main className="md:pl-64">
          <div className="h-[100dvh] md:h-screen flex flex-col">
            {/* Header - Style Claude/ChatGPT */}
            <header className="flex-shrink-0 border-b border-neutral-100 dark:border-neutral-900 bg-white dark:bg-neutral-950">
              <div className="px-4 py-3">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                  {/* Left */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => navigate('/app')}
                      className="md:hidden p-2 -ml-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
                    >
                      <ArrowLeft className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
                    </button>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
                        <Cpu className="h-4 w-4 text-white" />
                      </div>
                      <span className="font-medium text-neutral-900 dark:text-white">Diagnostic IA</span>
                      {isPremium && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full">
                          PRO
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right - Counter */}
                  <div className="flex items-center gap-2">
                    {!isPremium && (
                      <span className="text-xs text-neutral-500">
                        {isNewConversation ? `${displayRemaining}/2` : `${messagesRemaining} msg`}
                        {currentPurchasedCredits > 0 && <span className="text-emerald-600"> +{currentPurchasedCredits}</span>}
                      </span>
                    )}
                    {isPremium && (
                      <span className="text-xs text-amber-600 flex items-center gap-1">
                        <Sparkles className="h-3 w-3" /> Illimité
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </header>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-3xl mx-auto px-4 py-6 pb-36 md:pb-32">
                {messages.length === 0 && !streamingContent ? (
                  /* Empty State - Clean */}
                  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                    {/* Scanned Vehicle */}
                    {scannedVehicle && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/60 rounded-xl inline-flex items-center gap-3"
                      >
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        <span className="text-sm text-emerald-800 dark:text-emerald-300">
                          {scannedVehicle.brand} {scannedVehicle.model} • {scannedVehicle.year}
                        </span>
                        <button onClick={() => setScannedVehicle(null)} className="text-emerald-600 hover:text-emerald-800">
                          <X className="h-4 w-4" />
                        </button>
                      </motion.div>
                    )}

                    {/* Logo */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20"
                    >
                      <Cpu className="h-8 w-8 text-white" />
                    </motion.div>

                    <motion.h1
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="text-xl font-semibold text-neutral-900 dark:text-white mb-2"
                    >
                      Comment puis-je t'aider ?
                    </motion.h1>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="text-neutral-500 text-sm mb-8"
                    >
                      Décris ton problème auto
                    </motion.p>

                    {/* Quick scan button */}
                    {!scannedVehicle && (
                      <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        onClick={() => setShowPlateScanner(true)}
                        className="mb-8 px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-900 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors flex items-center gap-2"
                      >
                        <Car className="h-4 w-4" />
                        Scanner ma plaque
                      </motion.button>
                    )}

                    {/* Example Questions - Style ChatGPT */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="w-full max-w-md space-y-2"
                    >
                      {EXAMPLE_QUESTIONS.map((q, i) => (
                        <button
                          key={i}
                          onClick={() => setInput(q.text)}
                          className="w-full p-3 text-left text-sm text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors flex items-center gap-3 group"
                        >
                          <span className="text-lg">{q.icon}</span>
                          <span className="flex-1">{q.text}</span>
                          <ChevronRight className="h-4 w-4 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </motion.div>
                  </div>
                ) : (
                  /* Messages */
                  <div className="space-y-4">
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
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center flex-shrink-0">
                          <Cpu className="h-4 w-4 text-white" />
                        </div>
                        <div className="px-4 py-3 bg-neutral-100 dark:bg-neutral-900 rounded-2xl">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '300ms' }} />
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
                  </div>
                )}
              </div>
            </div>

            {/* Input Area - Floating Style Claude/ChatGPT */}
            <div className="fixed bottom-0 left-0 right-0 md:left-64 pb-[72px] md:pb-4 px-4 bg-gradient-to-t from-white via-white dark:from-neutral-950 dark:via-neutral-950 to-transparent pt-6 z-40">
              <div className="max-w-3xl mx-auto">
                {/* Image Preview */}
                {selectedImage && (
                  <div className="mb-2 flex justify-start">
                    <div className="relative inline-block">
                      <img src={selectedImage.dataUrl} alt="Preview" className="h-16 rounded-lg" />
                      <button
                        onClick={removeSelectedImage}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full flex items-center justify-center"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}

                {imageError && (
                  <div className="mb-2 text-xs text-red-500">{imageError}</div>
                )}

                {/* Limit Warning */}
                {isAtMessageLimit && (
                  <div className="mb-2 p-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-xs text-amber-700 dark:text-amber-400 text-center">
                    Limite atteinte · <button onClick={() => setShowPaywall(true)} className="underline font-medium">Passer Premium</button>
                  </div>
                )}

                {/* Input Bar - Style Claude */}
                <form onSubmit={handleSubmit}>
                  <div className="relative flex items-end gap-2 p-2 bg-neutral-100 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-lg shadow-neutral-200/50 dark:shadow-neutral-900/50">
                    {/* Photo Button */}
                    <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageSelect} className="hidden" />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading || photosUsed >= MAX_PHOTOS_PER_CONVERSATION || isAtMessageLimit}
                      className="p-2 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-xl transition-colors disabled:opacity-40"
                    >
                      <Plus className="h-5 w-5" />
                    </button>

                    {/* Textarea */}
                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={isAtMessageLimit ? "Limite atteinte" : "Message..."}
                      disabled={isLoading || isAtMessageLimit}
                      rows={1}
                      className="flex-1 bg-transparent border-0 resize-none text-sm text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none focus:ring-0 py-2 px-1 max-h-32"
                      style={{ minHeight: '40px' }}
                    />

                    {/* Send Button */}
                    <Button
                      type="submit"
                      size="icon"
                      disabled={(!input.trim() && !selectedImage) || isLoading || isAtMessageLimit}
                      className="h-10 w-10 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-40 disabled:hover:bg-neutral-900 dark:disabled:hover:bg-white flex-shrink-0"
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                </form>

                {/* Disclaimer */}
                <p className="text-[10px] text-neutral-400 text-center mt-2">
                  Diagnostics à titre indicatif uniquement
                </p>
              </div>
            </div>
          </div>
        </main>

        <PaywallModal open={showPaywall} onOpenChange={setShowPaywall} />
        <PlateScanner
          open={showPlateScanner}
          onOpenChange={setShowPlateScanner}
          onVehicleConfirmed={handleVehicleConfirmed}
        />
      </div>
    </PageTransition>
  )
}
