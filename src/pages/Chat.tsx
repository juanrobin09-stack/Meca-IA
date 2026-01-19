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
import { Textarea } from '@/components/ui/textarea'
import { Tooltip } from '@/components/ui/tooltip'
import {
  ArrowLeft,
  Send,
  Loader2,
  Camera,
  X,
  Car,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Cpu,
  ChevronRight,
  Zap,
  Shield,
  Clock
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

// Premium animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const } }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

// Detect if diagnostic is complete
function isDiagnosticComplete(content: string): boolean {
  const hasEstimation = content.includes('Estimation') || content.includes('estimation')
  const hasDiagnostic = content.includes('Diagnostic') || content.includes('diagnostic')
  const hasPieces = content.includes('pièce') || content.includes('Pièce')
  return (hasEstimation && hasDiagnostic) || hasPieces
}

// Example questions
const EXAMPLE_QUESTIONS = [
  { text: 'Ma 208 fait un bruit au freinage', emoji: '🔊', category: 'Bruit suspect' },
  { text: 'Voyant moteur allumé sur ma Clio', emoji: '🚨', category: 'Voyant allumé' },
  { text: "Fuite d'huile sous ma voiture", emoji: '💧', category: 'Fuite liquide' }
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
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
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
      <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
        <Sidebar />

        <main className="md:pl-64">
          <div className="h-[100dvh] md:h-screen flex flex-col overflow-hidden">
            {/* Mobile-Optimized Header */}
            <header className="flex-shrink-0 border-b border-neutral-200/60 dark:border-neutral-800/60 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-xl">
              <div className="px-3 sm:px-6 py-2.5 sm:py-4">
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center justify-between gap-2">
                    {/* Left - Back & Logo */}
                    <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate('/app')}
                        className="md:hidden h-8 w-8 sm:h-9 sm:w-9 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex-shrink-0"
                      >
                        <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>

                      {/* Avatar - smaller on mobile */}
                      <div className="relative flex-shrink-0">
                        <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                          <Cpu className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-neutral-950" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h1 className="text-sm sm:text-lg font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5 sm:gap-2 truncate">
                          Diagnostic IA
                          {isPremium && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full flex-shrink-0">
                              <Sparkles className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                              PRO
                            </span>
                          )}
                        </h1>
                        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 truncate">
                          Expert auto
                        </p>
                      </div>
                    </div>

                    {/* Right - Status Badges */}
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                      {photosUsed > 0 && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                          <Camera className="h-3 w-3" />
                          {photosUsed}/{MAX_PHOTOS_PER_CONVERSATION}
                        </div>
                      )}

                      {isPremium ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/50">
                          <Sparkles className="h-3 w-3" />
                          Illimité
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {!isNewConversation && (
                            <Tooltip content={`${messagesRemaining} messages restants`}>
                              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg cursor-help ${
                                messagesRemaining <= 3
                                  ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400'
                                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                              }`}>
                                {messagesRemaining <= 3 && <AlertTriangle className="h-3 w-3" />}
                                {messagesRemaining} msg
                              </div>
                            </Tooltip>
                          )}
                          {isNewConversation && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                              {displayRemaining}/2 restants
                            </div>
                          )}
                          {currentPurchasedCredits > 0 && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
                              +{currentPurchasedCredits}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Disclaimer - Subtle */}
              <div className="border-t border-neutral-100 dark:border-neutral-900 bg-neutral-50/50 dark:bg-neutral-900/50 px-4 py-2">
                <p className="text-[11px] text-neutral-500 text-center flex items-center justify-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 text-[9px] font-bold">i</span>
                  Diagnostics à titre indicatif uniquement
                </p>
              </div>
            </header>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-8 pb-44 md:pb-8">
                {messages.length === 0 && !streamingContent ? (
                  /* Empty State - Premium Hero */
                  <motion.div
                    className="text-center py-8"
                    initial="hidden"
                    animate="visible"
                    variants={staggerContainer}
                  >
                    {/* Scanned Vehicle Card */}
                    {scannedVehicle ? (
                      <motion.div
                        variants={fadeInUp}
                        className="mb-10 max-w-md mx-auto"
                      >
                        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/60 rounded-2xl">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                              <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="flex-1 text-left">
                              <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Véhicule identifié</p>
                              <p className="text-base font-semibold text-neutral-900 dark:text-white">{scannedVehicle.brand} {scannedVehicle.model}</p>
                              <p className="text-sm text-neutral-500">{scannedVehicle.year} • {scannedVehicle.plate}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-lg"
                              onClick={() => setScannedVehicle(null)}
                            >
                              Changer
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div variants={fadeInUp} className="mb-8">
                        <button
                          className="inline-flex items-center gap-3 px-5 py-3 bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-lg transition-all duration-300 group"
                          onClick={() => setShowPlateScanner(true)}
                        >
                          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                            <Car className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-medium text-neutral-900 dark:text-white">Scanner ma plaque</p>
                            <p className="text-xs text-neutral-500">Optionnel • Diagnostic plus précis</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-neutral-400 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </motion.div>
                    )}

                    {/* Hero Section */}
                    <motion.div variants={fadeInUp} className="mb-12">
                      {/* Premium Logo */}
                      <div className="relative inline-block mb-6">
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-blue-500/30">
                          <Cpu className="h-10 w-10 text-white" />
                        </div>
                        <motion.div
                          className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-[#fafafa] dark:border-[#0a0a0a] flex items-center justify-center"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.5, type: 'spring' }}
                        >
                          <span className="text-white text-[10px]">✓</span>
                        </motion.div>
                      </div>

                      <h2 className="text-2xl sm:text-3xl font-semibold text-neutral-900 dark:text-white mb-2">
                        Diagnostic Intelligent
                      </h2>
                      <p className="text-neutral-500 dark:text-neutral-400 text-lg max-w-md mx-auto">
                        Décris ton problème, je t'aide à comprendre.
                      </p>

                      {/* Photo hint */}
                      <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/60 rounded-full">
                        <Camera className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm text-blue-700 dark:text-blue-300">Tu peux aussi envoyer une photo</span>
                      </div>
                    </motion.div>

                    {/* Example Questions - Premium Grid */}
                    <motion.div variants={fadeInUp} className="mb-12">
                      <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-4">Exemples</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
                        {EXAMPLE_QUESTIONS.map((example, i) => (
                          <motion.button
                            key={i}
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            className="group relative p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 text-left hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-lg hover:shadow-neutral-200/50 dark:hover:shadow-neutral-900/50 transition-all duration-300"
                            onClick={() => setInput(example.text)}
                          >
                            <span className="text-2xl mb-2 block">{example.emoji}</span>
                            <p className="text-xs text-neutral-400 mb-1">{example.category}</p>
                            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 line-clamp-2">
                              {example.text}
                            </p>
                            <ChevronRight className="absolute bottom-4 right-4 h-4 w-4 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>

                    {/* Features - Minimal */}
                    <motion.div
                      variants={fadeInUp}
                      className="flex flex-wrap justify-center gap-6 text-sm text-neutral-500"
                    >
                      {[
                        { icon: Zap, label: 'Réponse instantanée' },
                        { icon: Shield, label: 'Estimation des coûts' },
                        { icon: Clock, label: 'Conseils personnalisés' },
                      ].map((feature, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <feature.icon className="h-4 w-4 text-neutral-400" />
                          <span>{feature.label}</span>
                        </div>
                      ))}
                    </motion.div>
                  </motion.div>
                ) : (
                  /* Messages List */
                  <div className="space-y-1">
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
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-3"
                      >
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
                          <Cpu className="h-4 w-4 text-white" />
                        </div>
                        <div className="px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                            <span className="text-sm text-neutral-600 dark:text-neutral-400">Analyse en cours...</span>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {error && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl flex items-center gap-3 text-sm text-red-700 dark:text-red-400"
                      >
                        <X className="h-4 w-4 shrink-0" />
                        {error}
                      </motion.div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Input Area - Fixed on mobile, above bottom nav */}
          <div className="fixed bottom-[64px] md:bottom-0 left-0 right-0 md:left-64 border-t border-neutral-200/60 dark:border-neutral-800/60 bg-white dark:bg-neutral-950 z-40">
            <div className="max-w-3xl mx-auto p-2.5 sm:p-4">
              {/* Message Limit Warning */}
              {isAtMessageLimit && (
                <div className="mb-2 p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-700 dark:text-amber-400">
                  Limite atteinte - <button className="underline font-medium" onClick={() => setShowPaywall(true)}>Passer Premium</button>
                </div>
              )}

              {/* Image Preview */}
              {selectedImage && (
                <div className="mb-2">
                  <div className="relative inline-block">
                    <img src={selectedImage.dataUrl} alt="Preview" className="max-h-16 rounded-lg border border-neutral-200 dark:border-neutral-800" />
                    <button type="button" onClick={removeSelectedImage} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* Image Error */}
              {imageError && (
                <div className="mb-2 text-xs text-red-600 bg-red-50 dark:bg-red-950/30 px-2 py-1.5 rounded-lg">{imageError}</div>
              )}

              {/* Input */}
              <form onSubmit={handleSubmit}>
                <div className="flex gap-2 items-end p-1.5 sm:p-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl">
                  <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageSelect} className="hidden" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading || photosUsed >= MAX_PHOTOS_PER_CONVERSATION || isAtMessageLimit}
                    className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg text-neutral-500"
                  >
                    <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>

                  <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isAtMessageLimit ? "Limite atteinte" : "Ton problème..."}
                    className="min-h-[40px] max-h-20 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base sm:text-sm"
                    rows={1}
                    disabled={isLoading || isAtMessageLimit}
                  />

                  <Button
                    type="submit"
                    size="icon"
                    disabled={(!input.trim() && !selectedImage) || isLoading || isAtMessageLimit}
                    className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 disabled:opacity-40"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </form>
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
