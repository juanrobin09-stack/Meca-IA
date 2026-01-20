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
    if (user && profile) checkLimitOnLoad()
  }, [id, user, profile, checkDiagnosticLimit])

  useEffect(() => {
    async function loadMemory() {
      if (!user?.id || memoryLoadedRef.current) return
      try {
        const memory = await AIMemoryService.loadUserMemory(user.id)
        const memoryContext = AIMemoryService.generateContextForAI(memory)
        setMemoryContext(memoryContext)
        memoryLoadedRef.current = true
      } catch {}
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
      }).catch(() => navigate('/app/chat'))
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
    if (fileInputRef.current) fileInputRef.current.value = ''
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
      setSelectedImage({ dataUrl: compressed.dataUrl, base64: compressed.base64 })
    } catch {
      setImageError('Erreur lors du traitement de l\'image')
    }
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
          if (refreshProfile) await refreshProfile()
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
    } catch {}
  }

  function handleVehicleConfirmed(vehicle: VehicleInfo) {
    setScannedVehicle(vehicle)
    if (!input.trim()) {
      setInput(`Ma ${vehicle.brand} ${vehicle.model} ${vehicle.year} (${vehicle.fuel}) a un problème: `)
    }
  }

  return (
    <>
      <Sidebar />

      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column'
      }} className="md:ml-64 bg-white dark:bg-neutral-950">

        {/* HEADER */}
        <div style={{
          flexShrink: 0,
          padding: '12px 16px',
          paddingTop: 'max(env(safe-area-inset-top), 12px)'
        }} className="bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', maxWidth: '768px', margin: '0 auto' }}>
            {/* Back button (mobile) */}
            <button
              onClick={() => navigate('/app')}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16
              }}
              className="md:hidden bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
            >←</button>

            {/* Avatar */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>🔬</div>
              <div style={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                width: 12,
                height: 12,
                backgroundColor: '#22c55e',
                borderRadius: '50%',
                border: '2px solid #fff'
              }}></div>
            </div>

            {/* Name */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 600 }} className="text-neutral-900 dark:text-white">Diagnostic IA</div>
              <div style={{ fontSize: 12 }} className="text-neutral-500 dark:text-neutral-400">Expert auto • En ligne</div>
            </div>

            {/* Counter */}
            <div style={{
              padding: '4px 10px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 500,
              whiteSpace: 'nowrap'
            }} className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
              {isPremium ? '∞' : isNewConversation ? `${currentRemaining}/2` : `${messagesRemaining} msg`}
              {currentPurchasedCredits > 0 && <span className="text-emerald-500"> +{currentPurchasedCredits}</span>}
            </div>
          </div>

          {/* Scanned vehicle */}
          {scannedVehicle && (
            <div style={{ maxWidth: '768px', margin: '8px auto 0' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 12px',
                borderRadius: 999,
                fontSize: 12
              }} className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400">
                ✓ {scannedVehicle.brand} {scannedVehicle.model} • {scannedVehicle.year}
                <button onClick={() => setScannedVehicle(null)} className="text-emerald-600 dark:text-emerald-400" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>×</button>
              </div>
            </div>
          )}
        </div>

        {/* MESSAGES */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: 16,
          WebkitOverflowScrolling: 'touch'
        }}>
          <div style={{ maxWidth: '768px', margin: '0 auto' }}>
            {messages.length === 0 && !streamingContent ? (
              /* Empty State */
              <div style={{ textAlign: 'center', paddingTop: '15vh' }}>
                <div style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 32,
                  margin: '0 auto 16px',
                  boxShadow: '0 8px 24px rgba(59,130,246,0.3)'
                }}>🔬</div>
                <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }} className="text-neutral-900 dark:text-white">Comment puis-je t'aider ?</h2>
                <p style={{ marginBottom: 24 }} className="text-neutral-500 dark:text-neutral-400">Décris ton problème auto</p>

                {/* Scan plate button */}
                {!scannedVehicle && (
                  <button
                    onClick={() => setShowPlateScanner(true)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 999,
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 14,
                      marginBottom: 24,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                    className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                  >
                    📷 Scanner ma plaque
                  </button>
                )}

                {/* Quick actions */}
                <div style={{ maxWidth: 320, margin: '0 auto' }}>
                  {EXAMPLE_QUESTIONS.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(q.text)}
                      style={{
                        width: '100%',
                        padding: 12,
                        marginBottom: 8,
                        border: 'none',
                        borderRadius: 12,
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12
                      }}
                      className="bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                    >
                      <span style={{ fontSize: 18 }}>{q.icon}</span>
                      <span style={{ fontSize: 14 }} className="text-neutral-700 dark:text-neutral-300">{q.text}</span>
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
                    message={{ role: 'assistant', content: streamingContent, timestamp: new Date().toISOString() }}
                    isStreaming
                  />
                )}

                {isLoading && !streamingContent && (
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14
                    }}>🔬</div>
                    <div style={{ padding: '12px 16px', borderRadius: 16, display: 'flex', gap: 4 }} className="bg-neutral-100 dark:bg-neutral-800">
                      <div className="bounce-dot bg-neutral-400 dark:bg-neutral-500" style={{ width: 8, height: 8, borderRadius: '50%' }}></div>
                      <div className="bounce-dot bg-neutral-400 dark:bg-neutral-500" style={{ width: 8, height: 8, borderRadius: '50%', animationDelay: '0.1s' }}></div>
                      <div className="bounce-dot bg-neutral-400 dark:bg-neutral-500" style={{ width: 8, height: 8, borderRadius: '50%', animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                )}

                {error && (
                  <div style={{ padding: 12, backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, fontSize: 14, color: '#dc2626', marginBottom: 16 }}>
                    {error}
                  </div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </div>

        {/* INPUT BAR */}
        <div style={{
          flexShrink: 0,
          padding: '12px 16px',
          paddingBottom: 'max(env(safe-area-inset-bottom), 100px)'
        }} className="bg-white dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 md:pb-4">
          <div style={{ maxWidth: '768px', margin: '0 auto' }}>
            {/* Image preview */}
            {selectedImage && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img src={selectedImage.dataUrl} alt="Preview" style={{ height: 64, borderRadius: 8 }} />
                  <button
                    onClick={() => setSelectedImage(null)}
                    style={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      backgroundColor: '#111',
                      color: '#fff',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 14
                    }}
                  >×</button>
                </div>
              </div>
            )}

            {imageError && (
              <div style={{ fontSize: 12, marginBottom: 8 }} className="text-red-500">{imageError}</div>
            )}

            {isAtMessageLimit && (
              <div style={{
                padding: 8,
                borderRadius: 8,
                fontSize: 12,
                textAlign: 'center',
                marginBottom: 8
              }} className="bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400">
                Limite atteinte · <button onClick={() => setShowPaywall(true)} className="text-amber-700 dark:text-amber-400 font-semibold underline" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>Passer Premium</button>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                {/* Photo button */}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} style={{ display: 'none' }} />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading || photosUsed >= MAX_PHOTOS_PER_CONVERSATION || isAtMessageLimit}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 20,
                    flexShrink: 0,
                    opacity: (isLoading || photosUsed >= MAX_PHOTOS_PER_CONVERSATION || isAtMessageLimit) ? 0.4 : 1
                  }}
                  className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                >+</button>

                {/* Textarea */}
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmit(e)
                    }
                  }}
                  placeholder={isAtMessageLimit ? "Limite atteinte" : "Décris ton problème..."}
                  disabled={isLoading || isAtMessageLimit}
                  rows={1}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: 20,
                    fontSize: 16,
                    resize: 'none',
                    minHeight: 48,
                    maxHeight: 120,
                    outline: 'none',
                    fontFamily: 'inherit',
                    opacity: (isLoading || isAtMessageLimit) ? 0.5 : 1
                  }}
                  className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500"
                />

                {/* Send button */}
                <button
                  type="submit"
                  disabled={(!input.trim() && !selectedImage) || isLoading || isAtMessageLimit}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                    border: 'none',
                    color: '#fff',
                    fontSize: 18,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    opacity: ((!input.trim() && !selectedImage) || isLoading || isAtMessageLimit) ? 0.5 : 1,
                    flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(59,130,246,0.3)'
                  }}
                >
                  {isLoading ? '⏳' : '➤'}
                </button>
              </div>
            </form>

            <p style={{ fontSize: 10, textAlign: 'center', marginTop: 8 }} className="text-neutral-400 dark:text-neutral-500">
              Diagnostics à titre indicatif uniquement
            </p>
          </div>
        </div>
      </div>

      <PaywallModal open={showPaywall} onOpenChange={setShowPaywall} />
      <PlateScanner open={showPlateScanner} onOpenChange={setShowPlateScanner} onVehicleConfirmed={handleVehicleConfirmed} />

      <style>{`
        .bounce-dot {
          animation: bounce 0.6s ease-in-out infinite;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </>
  )
}
