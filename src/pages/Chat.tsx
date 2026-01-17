import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/hooks/useSubscription'
import { useDiagnostics } from '@/hooks/useDiagnostics'
import { useChat } from '@/hooks/useChat'
import Sidebar from '@/components/Sidebar'
import ChatMessage from '@/components/ChatMessage'
import PaywallModal from '@/components/PaywallModal'
import PlateScanner from '@/components/PlateScanner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Send, Loader2, Wrench, Sparkles, Camera, X, Car, CheckCircle2 } from 'lucide-react'
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

export default function Chat() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, profile, refreshProfile } = useAuth()
  const { isPremium, diagnosticsRemaining, checkDiagnosticLimit, incrementDiagnosticCount } = useSubscription(profile)
  const { currentDiagnostic, createDiagnostic, addMessage, loadDiagnostic, setCurrentDiagnostic } = useDiagnostics(user?.id)
  const { messages, isLoading, error, streamingContent, sendMessage, loadMessages, clearMessages } = useChat()

  const [input, setInput] = useState('')
  const [showPaywall, setShowPaywall] = useState(false)
  const [isNewConversation, setIsNewConversation] = useState(true)
  const [currentRemaining, setCurrentRemaining] = useState<number>(diagnosticsRemaining)
  const [selectedImage, setSelectedImage] = useState<{ dataUrl: string; base64: string } | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showPlateScanner, setShowPlateScanner] = useState(false)
  const [scannedVehicle, setScannedVehicle] = useState<VehicleInfo | null>(null)

  // Count photos used in this conversation
  const photosUsed = messages.filter(m => m.image).length

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

      if (!limitStatus.canDiagnose && !limitStatus.isPremium) {
        console.log('[Chat] User has no remaining diagnostics, showing paywall')
        setShowPaywall(true)
      }
    }

    if (user && profile) {
      checkLimitOnLoad()
    }
  }, [id, user, profile, checkDiagnosticLimit])

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
    <div className="min-h-screen bg-background flex flex-col">
      <Sidebar />

      <div className="md:pl-64 flex-1 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background border-b">
          <div className="flex items-center justify-between h-14 px-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/app')}
                className="md:hidden"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Wrench className="h-4 w-4 text-primary" />
                </div>
                <span className="font-semibold">MecaIA</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {photosUsed > 0 && (
                <Badge variant="outline" className="text-xs">
                  <Camera className="h-3 w-3 mr-1" />
                  {photosUsed}/{MAX_PHOTOS_PER_CONVERSATION}
                </Badge>
              )}
              {isPremium ? (
                <Badge variant="premium">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Premium
                </Badge>
              ) : (
                <Badge variant="secondary">
                  {displayRemaining}/2 restants
                </Badge>
              )}
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 pb-32">
          {messages.length === 0 && !streamingContent && (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              {/* Scanned vehicle card */}
              {scannedVehicle ? (
                <Card className="mb-6 w-full max-w-sm bg-green-50 border-green-200">
                  <CardContent className="flex items-center gap-3 py-4">
                    <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                    <div className="text-left">
                      <p className="text-sm text-green-800">Véhicule identifié</p>
                      <p className="font-semibold">{scannedVehicle.brand} {scannedVehicle.model} {scannedVehicle.year}</p>
                      <p className="text-sm text-muted-foreground">{scannedVehicle.plate} • {scannedVehicle.fuel}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto"
                      onClick={() => setScannedVehicle(null)}
                    >
                      Changer
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Button
                  variant="outline"
                  className="mb-6"
                  onClick={() => setShowPlateScanner(true)}
                >
                  <Car className="h-4 w-4 mr-2" />
                  Scanner ma plaque (optionnel)
                </Button>
              )}

              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Wrench className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Salut !</h2>
              <p className="text-muted-foreground max-w-sm">
                Décris-moi ton problème de voiture et je t'aide à diagnostiquer.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                <Camera className="h-4 w-4 inline mr-1" />
                Tu peux aussi envoyer une photo !
              </p>
              <div className="mt-6 space-y-2 text-sm text-muted-foreground">
                <p>Exemples:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {[
                    'Ma 208 fait un bruit au freinage',
                    "Voyant moteur allumé sur ma Clio",
                    "Fuite d'huile sous ma voiture"
                  ].map((example) => (
                    <button
                      key={example}
                      className="px-3 py-1.5 bg-muted rounded-full hover:bg-muted/80 transition-colors"
                      onClick={() => setInput(example)}
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
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
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">MecaIA réfléchit...</span>
            </div>
          )}

          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-background border-t p-4 pb-20 md:pb-4">
          {/* Image preview */}
          {selectedImage && (
            <div className="max-w-3xl mx-auto mb-3">
              <div className="relative inline-block">
                <img
                  src={selectedImage.dataUrl}
                  alt="Preview"
                  className="max-h-32 rounded-lg border"
                />
                <button
                  type="button"
                  onClick={removeSelectedImage}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}

          {/* Image error */}
          {imageError && (
            <div className="max-w-3xl mx-auto mb-3">
              <p className="text-sm text-red-600">{imageError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex gap-2 max-w-3xl mx-auto">
            {/* Photo upload button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || photosUsed >= MAX_PHOTOS_PER_CONVERSATION}
              className="shrink-0"
              title={photosUsed >= MAX_PHOTOS_PER_CONVERSATION ? 'Maximum de photos atteint' : 'Ajouter une photo'}
            >
              <Camera className="h-4 w-4" />
            </Button>

            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Décris ton problème..."
              className="min-h-[44px] max-h-32 resize-none"
              rows={1}
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={(!input.trim() && !selectedImage) || isLoading}
              className="shrink-0"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
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
  )
}
