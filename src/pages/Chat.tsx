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
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip } from '@/components/ui/tooltip'
import { ArrowLeft, Send, Loader2, Wrench, Camera, X, Car, CheckCircle2, HelpCircle, AlertTriangle } from 'lucide-react'
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
const MAX_MESSAGES_PER_DIAGNOSTIC = 15 // Limit per diagnostic session (for non-premium users)

// Detect if diagnostic is complete (has all key sections)
function isDiagnosticComplete(content: string): boolean {
  const hasEstimation = content.includes('Estimation') || content.includes('estimation')
  const hasDiagnostic = content.includes('Diagnostic') || content.includes('diagnostic')
  const hasPieces = content.includes('pièce') || content.includes('Pièce')
  return (hasEstimation && hasDiagnostic) || hasPieces
}

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
      // Only check for new conversations (no ID in URL)
      if (id) {
        return
      }

      console.log('[Chat] Checking limit on page load...')
      const limitStatus = await checkDiagnosticLimit()
      console.log('[Chat] Limit status:', limitStatus)

      setCurrentRemaining(limitStatus.remaining)
      setCurrentPurchasedCredits(limitStatus.purchasedCredits || 0)

      if (!limitStatus.canDiagnose && !limitStatus.isPremium) {
        console.log('[Chat] User has no remaining diagnostics, showing paywall')
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
        console.log('[Chat] Loading AI memory for user...')
        const memory = await AIMemoryService.loadUserMemory(user.id)
        const memoryContext = AIMemoryService.generateContextForAI(memory)
        setMemoryContext(memoryContext)
        memoryLoadedRef.current = true
        console.log('[Chat] AI memory loaded successfully')
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

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    // Check if max photos reached
    if (photosUsed >= MAX_PHOTOS_PER_CONVERSATION) {
      setImageError(`Maximum ${MAX_PHOTOS_PER_CONVERSATION} photos par conversation`)
      return
    }

    // Validate file
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

    // Check message limit for existing conversations (non-premium only)
    if (isAtMessageLimit) {
      setShowPaywall(true)
      return
    }

    const messageContent = input.trim() || (selectedImage ? 'Voici une photo de mon problème.' : '')
    const imageBase64 = selectedImage?.base64
    setInput('')
    setSelectedImage(null)

    // Check limits for new conversations (double-check before sending)
    if (isNewConversation) {
      const limitStatus = await checkDiagnosticLimit()
      console.log('[Chat] handleSubmit - Limit check:', limitStatus)

      if (!limitStatus.canDiagnose && !limitStatus.isPremium) {
        setShowPaywall(true)
        setInput(messageContent) // Restore input
        return
      }
    }

    try {
      let diagnosticId = currentDiagnostic?.id

      // Create new diagnostic if needed
      if (!diagnosticId) {
        const diag = await createDiagnostic(messageContent)
        diagnosticId = diag.id
        setIsNewConversation(false)

        // Increment counter for free users after first message
        if (!isPremium) {
          console.log('[Chat] Incrementing diagnostic counter...')
          const success = await incrementDiagnosticCount()
          console.log('[Chat] Increment result:', success)

          // Refresh profile to get updated counter
          if (refreshProfile) {
            await refreshProfile()
          }

          // Update local remaining count
          setCurrentRemaining(prev => Math.max(0, prev - 1))
        }

        // Update URL without triggering navigation
        window.history.replaceState(null, '', `/app/chat/${diagnosticId}`)
      }

      // Send message and get response (with optional image)
      const assistantMessage = await sendMessage(messageContent, imageBase64)

      if (assistantMessage && diagnosticId) {
        // Save user message
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
    // Pre-fill input with vehicle context
    if (!input.trim()) {
      setInput(`Ma ${vehicle.brand} ${vehicle.model} ${vehicle.year} (${vehicle.fuel}) a un problème: `)
    }
  }

  // Display remaining from fresh check if available, otherwise from profile
  const displayRemaining = currentRemaining

  return (
    <PageTransition>
    <div className="min-h-screen bg-background flex flex-col">
      <Sidebar />

      <div className="md:pl-64 flex-1 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/50">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/app')}
                className="md:hidden rounded-xl"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Wrench className="h-5 w-5 text-white" />
                </div>
                <div>
                  <span className="font-bold text-lg">MECAI</span>
                  <p className="text-xs text-muted-foreground -mt-0.5">Diagnostic Auto IA</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {photosUsed > 0 && (
                <Badge variant="outline" className="text-xs rounded-lg px-2 py-1">
                  <Camera className="h-3 w-3 mr-1" />
                  {photosUsed}/{MAX_PHOTOS_PER_CONVERSATION}
                </Badge>
              )}
              {isPremium ? (
                <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 shadow-lg shadow-amber-500/30 px-3 py-1 rounded-lg">
                  ✨ Illimité
                </Badge>
              ) : (
                <div className="flex items-center gap-2">
                  {/* Show messages remaining during active diagnostic */}
                  {!isNewConversation && (
                    <Tooltip content={`${messagesRemaining} messages restants pour ce diagnostic`}>
                      <Badge
                        variant={messagesRemaining <= 3 ? "destructive" : "outline"}
                        className={`cursor-help text-xs rounded-lg px-2 py-1 ${messagesRemaining <= 3 ? 'bg-red-500 text-white border-0' : 'border-amber-400 text-amber-600 bg-amber-50 dark:bg-amber-950'}`}
                      >
                        {messagesRemaining <= 3 && <AlertTriangle className="h-3 w-3 mr-1" />}
                        {messagesRemaining}/{MAX_MESSAGES_PER_DIAGNOSTIC} msg
                      </Badge>
                    </Tooltip>
                  )}
                  {isNewConversation && (
                    <Tooltip content="Tu as 2 diagnostics gratuits par mois. Passe Premium pour illimité !">
                      <Badge variant="secondary" className="cursor-help flex items-center gap-1.5 rounded-lg px-3 py-1 bg-gray-100 dark:bg-gray-800">
                        <span className="font-semibold">{displayRemaining}/2</span>
                        <span className="text-muted-foreground">restants</span>
                        <HelpCircle className="h-3 w-3 text-muted-foreground" />
                      </Badge>
                    </Tooltip>
                  )}
                  {currentPurchasedCredits > 0 && (
                    <Badge className="bg-gradient-to-r from-green-400 to-emerald-500 text-white border-0 shadow-md rounded-lg px-2 py-1">
                      +{currentPurchasedCredits} crédit{currentPurchasedCredits > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Disclaimer - discret */}
        <div className="px-4 py-2 bg-gradient-to-r from-blue-50/50 via-transparent to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20 border-b border-border/30">
          <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1.5">
            <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-[10px]">i</span>
            Diagnostics à titre indicatif uniquement
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 pb-32">
          {messages.length === 0 && !streamingContent && (
            <div className="flex flex-col items-center justify-center min-h-[70vh] text-center py-8 px-4">
              {/* Background decorative elements */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-40 right-10 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-500/3 to-purple-500/3 rounded-full blur-3xl" />
              </div>

              {/* Scanned vehicle card */}
              {scannedVehicle ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8 w-full max-w-md z-10"
                >
                  <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 border-green-200 dark:border-green-800 shadow-lg shadow-green-500/10">
                    <CardContent className="flex items-center gap-4 py-5 px-6">
                      <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="text-left flex-1">
                        <p className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">Véhicule identifié</p>
                        <p className="font-bold text-lg">{scannedVehicle.brand} {scannedVehicle.model}</p>
                        <p className="text-sm text-muted-foreground">{scannedVehicle.year} • {scannedVehicle.plate} • {scannedVehicle.fuel}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-green-600 hover:text-green-700 hover:bg-green-100"
                        onClick={() => setScannedVehicle(null)}
                      >
                        Changer
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8 z-10"
                >
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-full px-6 py-6 border-2 border-dashed border-primary/30 hover:border-primary/60 hover:bg-primary/5 transition-all duration-300 group"
                    onClick={() => setShowPlateScanner(true)}
                  >
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-3 group-hover:bg-primary/20 transition-colors">
                      <Car className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">Scanner ma plaque</p>
                      <p className="text-xs text-muted-foreground">Optionnel - Pour un diagnostic plus précis</p>
                    </div>
                  </Button>
                </motion.div>
              )}

              {/* Main hero section */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="relative z-10"
              >
                {/* Animated logo */}
                <motion.div
                  className="relative mx-auto mb-6"
                  animate={{
                    boxShadow: ['0 0 0 0 rgba(59, 130, 246, 0.4)', '0 0 0 20px rgba(59, 130, 246, 0)', '0 0 0 0 rgba(59, 130, 246, 0)']
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 flex items-center justify-center shadow-xl shadow-blue-500/30">
                    <motion.div
                      animate={{ rotate: [0, -10, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    >
                      <Wrench className="h-12 w-12 text-white" />
                    </motion.div>
                  </div>
                  {/* Floating particles */}
                  <motion.div
                    className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-yellow-400"
                    animate={{ y: [-5, 5, -5], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <motion.div
                    className="absolute -bottom-1 -left-3 h-3 w-3 rounded-full bg-green-400"
                    animate={{ y: [5, -5, 5], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                  />
                </motion.div>

                <motion.h1
                  className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Salut !
                </motion.h1>
                <motion.p
                  className="text-lg md:text-xl text-muted-foreground max-w-md mx-auto mb-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Décris-moi ton problème de voiture
                </motion.p>
                <motion.p
                  className="text-base text-muted-foreground/80"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  et je t'aide à diagnostiquer
                </motion.p>

                {/* Photo hint */}
                <motion.div
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 border border-blue-100 dark:border-blue-900"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="h-6 w-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Camera className="h-3 w-3 text-blue-600" />
                  </div>
                  <span className="text-sm text-blue-700 dark:text-blue-300">Tu peux aussi envoyer une photo !</span>
                </motion.div>
              </motion.div>

              {/* Example suggestions */}
              <motion.div
                className="mt-10 w-full max-w-2xl z-10"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <p className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">Exemples de questions</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { text: 'Ma 208 fait un bruit au freinage', icon: '🔊', color: 'from-orange-500/10 to-red-500/10 hover:from-orange-500/20 hover:to-red-500/20 border-orange-200 dark:border-orange-900' },
                    { text: 'Voyant moteur allumé sur ma Clio', icon: '🚨', color: 'from-yellow-500/10 to-orange-500/10 hover:from-yellow-500/20 hover:to-orange-500/20 border-yellow-200 dark:border-yellow-900' },
                    { text: "Fuite d'huile sous ma voiture", icon: '💧', color: 'from-blue-500/10 to-cyan-500/10 hover:from-blue-500/20 hover:to-cyan-500/20 border-blue-200 dark:border-blue-900' }
                  ].map((example, index) => (
                    <motion.button
                      key={example.text}
                      className={`group relative p-4 rounded-2xl bg-gradient-to-br ${example.color} border backdrop-blur-sm transition-all duration-300 text-left hover:scale-[1.02] hover:shadow-lg`}
                      onClick={() => setInput(example.text)}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="text-2xl mb-2 block">{example.icon}</span>
                      <span className="text-sm font-medium text-foreground/90 group-hover:text-foreground transition-colors">
                        {example.text}
                      </span>
                      <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Send className="h-4 w-4 text-primary" />
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Features highlight */}
              <motion.div
                className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span>Réponse instantanée</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <span>Estimation des coûts</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-purple-500" />
                  <span>Conseils personnalisés</span>
                </div>
              </motion.div>
            </div>
          )}

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
              className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 rounded-2xl border border-blue-100 dark:border-blue-900 max-w-sm"
            >
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
                <Loader2 className="h-5 w-5 animate-spin text-white" />
              </div>
              <div>
                <p className="font-medium text-sm">MECAI analyse...</p>
                <p className="text-xs text-muted-foreground">Diagnostic en cours</p>
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 text-sm bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/50 dark:to-pink-950/50 border border-red-200 dark:border-red-900 rounded-2xl flex items-center gap-3"
            >
              <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center shrink-0">
                <X className="h-4 w-4 text-red-600" />
              </div>
              <span className="text-red-700 dark:text-red-400">{error}</span>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-gradient-to-t from-background via-background to-background/80 backdrop-blur-xl border-t border-border/50 p-4 pb-20 md:pb-4">
          {/* Message limit reached warning */}
          {isAtMessageLimit && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto mb-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 border border-amber-200 dark:border-amber-800 rounded-2xl shadow-lg shadow-amber-500/10"
            >
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <span className="font-semibold">Limite de messages atteinte</span>
              </div>
              <p className="text-sm text-amber-600 dark:text-amber-500 mt-2 ml-10">
                Tu as atteint les {MAX_MESSAGES_PER_DIAGNOSTIC} messages pour ce diagnostic.{' '}
                <button
                  className="underline font-semibold hover:text-amber-700"
                  onClick={() => setShowPaywall(true)}
                >
                  Passe Premium
                </button>{' '}
                ou{' '}
                <button
                  className="underline font-semibold hover:text-amber-700"
                  onClick={() => navigate('/app/chat')}
                >
                  commence un nouveau diagnostic
                </button>
                .
              </p>
            </motion.div>
          )}

          {/* Image preview */}
          {selectedImage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-3xl mx-auto mb-3"
            >
              <div className="relative inline-block">
                <img
                  src={selectedImage.dataUrl}
                  alt="Preview"
                  className="max-h-32 rounded-xl border-2 border-primary/20 shadow-lg"
                />
                <motion.button
                  type="button"
                  onClick={removeSelectedImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg hover:bg-red-600 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="h-3 w-3" />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Image error */}
          {imageError && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-3xl mx-auto mb-3"
            >
              <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/50 px-4 py-2 rounded-xl">{imageError}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="flex gap-3 items-end p-2 bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-100 dark:border-gray-800 shadow-xl shadow-gray-200/50 dark:shadow-gray-900/50 transition-all duration-300 focus-within:border-primary/50 focus-within:shadow-primary/10">
              {/* Photo upload button */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageSelect}
                className="hidden"
              />
              <Tooltip content={isAtMessageLimit ? 'Limite de messages atteinte' : (photosUsed >= MAX_PHOTOS_PER_CONVERSATION ? 'Maximum de photos atteint' : 'Envoie une photo pour un diagnostic plus précis')}>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading || photosUsed >= MAX_PHOTOS_PER_CONVERSATION || isAtMessageLimit}
                    className="shrink-0 h-10 w-10 rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Camera className="h-5 w-5" />
                  </Button>
                </motion.div>
              </Tooltip>

              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isAtMessageLimit ? "Limite atteinte" : "Décris ton problème..."}
                className="min-h-[44px] max-h-32 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base placeholder:text-muted-foreground/60"
                rows={1}
                disabled={isLoading || isAtMessageLimit}
              />

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  type="submit"
                  size="icon"
                  disabled={(!input.trim() && !selectedImage) || isLoading || isAtMessageLimit}
                  className="shrink-0 h-10 w-10 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:shadow-none transition-all duration-300"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </motion.div>
            </div>
          </form>
        </div>
      </div>

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
