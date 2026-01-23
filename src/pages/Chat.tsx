import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/hooks/useSubscription'
import { useDiagnostics } from '@/hooks/useDiagnostics'
import { useChat } from '@/hooks/useChat'
import { AIMemoryService } from '@/services/aiMemoryService'
import Sidebar from '@/components/Sidebar'
import ChatMessage from '@/components/ChatMessage'
import PaywallModal from '@/components/PaywallModal'
import PlateScanner from '@/components/PlateScanner'
import DiagnosticResult from '@/components/DiagnosticResult'
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
// Note: No message limit per diagnostic - users get unlimited messages within a diagnostic session
// The only limit is: 2 diagnostics/month for free users

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
  const {
    messages,
    isLoading,
    error,
    streamingContent,
    sendMessage,
    loadMessages,
    clearMessages,
    setMemoryContext,
    setDiagnosticId,
    finalDiagnosis,
    phase,
    requestDiagnosis,
    canRequestDiagnosis
  } = useChat()
  const memoryLoadedRef = useRef(false)
  const limitCheckedRef = useRef(false)

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
  // No message limit per diagnostic - unlimited conversation within a session

  // Sync counter with profile changes
  useEffect(() => {
    if (!isPremium) {
      setCurrentRemaining(diagnosticsRemaining) // eslint-disable-line react-hooks/set-state-in-effect
      setCurrentPurchasedCredits(purchasedDiagnosticCredits)  
    }
  }, [isPremium, diagnosticsRemaining, purchasedDiagnosticCredits])

  useEffect(() => {
    async function checkLimitOnLoad() {
      // Skip if loading existing diagnostic or already checked
      if (id || limitCheckedRef.current) return
      limitCheckedRef.current = true

      // Refresh profile to get latest data (important after returning from payment)
      if (refreshProfile) {
        await refreshProfile()
      }

      const limitStatus = await checkDiagnosticLimit()
      setCurrentRemaining(limitStatus.remaining)
      setCurrentPurchasedCredits(limitStatus.purchasedCredits || 0)

      // Only show paywall if user truly cannot diagnose (no free remaining AND no purchased credits)
      if (!limitStatus.canDiagnose && !limitStatus.isPremium) {
        setShowPaywall(true)
      }
    }
    if (user && profile) checkLimitOnLoad()
  }, [id, user, profile, checkDiagnosticLimit, refreshProfile])

  // Reset the check flag when navigating to a new chat (no id)
  useEffect(() => {
    if (!id) {
      limitCheckedRef.current = false
    }
  }, [id])

  useEffect(() => {
    async function loadMemory() {
      if (!user?.id || memoryLoadedRef.current) return
      try {
        const memory = await AIMemoryService.loadUserMemory(user.id)
        const memoryContext = AIMemoryService.generateContextForAI(memory)
        setMemoryContext(memoryContext)
        memoryLoadedRef.current = true
      } catch { /* Memory loading is optional */ }
    }
    loadMemory()
  }, [user?.id, setMemoryContext])

  useEffect(() => {
    if (id) {
      setDiagnosticId(id)
      loadDiagnostic(id).then((diag) => {
        if (diag) {
          // Ensure conversation is a valid array
          const conversation = Array.isArray(diag.conversation) ? diag.conversation : []
          loadMessages(conversation as Message[])
          setIsNewConversation(false)
        }
      }).catch((err) => {
        console.error('Error loading diagnostic:', err)
        navigate('/app/chat')
      })
    } else {
      clearMessages()
      setCurrentDiagnostic(null)
      setDiagnosticId(undefined)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsNewConversation(true)
    }
  }, [id, loadDiagnostic, loadMessages, navigate, clearMessages, setCurrentDiagnostic, setDiagnosticId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
  }, [input])

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
      let diagId = currentDiagnostic?.id
      if (!diagId) {
        const diag = await createDiagnostic(messageContent)
        diagId = diag.id
        setDiagnosticId(diagId)
        setIsNewConversation(false)
        if (!isPremium) {
          // Determine which credit type will be used BEFORE incrementing
          const willUsePurchasedCredit = currentRemaining <= 0 && currentPurchasedCredits > 0

          await incrementDiagnosticCount()
          if (refreshProfile) await refreshProfile()

          // Update the correct counter based on which credit was used
          if (willUsePurchasedCredit) {
            setCurrentPurchasedCredits(prev => Math.max(0, prev - 1))
          } else {
            setCurrentRemaining(prev => Math.max(0, prev - 1))
          }
        }
        window.history.replaceState(null, '', `/app/chat/${diagId}`)
      }

      const assistantMessage = await sendMessage(messageContent, imageBase64)
      if (assistantMessage && diagId) {
        const userMessage: Message = {
          role: 'user',
          content: messageContent,
          timestamp: new Date().toISOString(),
          image: imageBase64 ? `data:image/jpeg;base64,${imageBase64}` : undefined,
        }
        await addMessage(diagId, userMessage)
        await addMessage(diagId, assistantMessage)
      }
    } catch { /* Saving messages failed, non-critical */ }
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
                overflow: 'hidden',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <img src="/logo-icon.svg" alt="Meca IA" style={{ width: '100%', height: '100%' }} />
              </div>
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
              <div style={{ fontSize: 16, fontWeight: 600 }} className="text-neutral-900 dark:text-white">Diagnostic Pro</div>
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
              {isPremium ? '∞' : `${currentRemaining}/2 diag`}
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
                  overflow: 'hidden',
                  margin: '0 auto 16px',
                  boxShadow: '0 8px 24px rgba(59,130,246,0.3)'
                }}>
                  <img src="/logo-icon.svg" alt="Meca IA" style={{ width: '100%', height: '100%' }} />
                </div>
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
                      overflow: 'hidden'
                    }}>
                      <img src="/logo-icon.svg" alt="Meca IA" style={{ width: '100%', height: '100%' }} />
                    </div>
                    <div style={{ padding: '12px 16px', borderRadius: 16, display: 'flex', gap: 4 }} className="bg-neutral-100 dark:bg-neutral-800">
                      <div className="bounce-dot bg-neutral-400 dark:bg-neutral-500" style={{ width: 8, height: 8, borderRadius: '50%' }}></div>
                      <div className="bounce-dot bg-neutral-400 dark:bg-neutral-500" style={{ width: 8, height: 8, borderRadius: '50%', animationDelay: '0.1s' }}></div>
                      <div className="bounce-dot bg-neutral-400 dark:bg-neutral-500" style={{ width: 8, height: 8, borderRadius: '50%', animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                )}

                {/* Final Diagnosis Card */}
                {finalDiagnosis && phase === 'completed' && (
                  <div style={{ marginBottom: 16 }}>
                    <DiagnosticResult diagnosis={finalDiagnosis} />
                  </div>
                )}

                {/* Request Diagnosis Button */}
                {canRequestDiagnosis && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16, marginTop: 8 }}>
                    <button
                      onClick={async () => {
                        const result = await requestDiagnosis()
                        if (result && currentDiagnostic?.id) {
                          const userMsg: Message = {
                            role: 'user',
                            content: '🔍 Obtenir mon diagnostic',
                            timestamp: new Date().toISOString()
                          }
                          await addMessage(currentDiagnostic.id, userMsg)
                          await addMessage(currentDiagnostic.id, result)
                        }
                      }}
                      style={{
                        padding: '12px 24px',
                        borderRadius: 999,
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 14,
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                        color: '#fff',
                        boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                      }}
                      className="hover:scale-105 active:scale-95"
                    >
                      <span>🔍</span>
                      Obtenir mon diagnostic
                    </button>
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

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                {/* Photo button */}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} style={{ display: 'none' }} />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading || photosUsed >= MAX_PHOTOS_PER_CONVERSATION}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 20,
                    flexShrink: 0,
                    opacity: (isLoading || photosUsed >= MAX_PHOTOS_PER_CONVERSATION) ? 0.4 : 1
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
                  placeholder="Décris ton problème..."
                  disabled={isLoading}
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
                    opacity: isLoading ? 0.5 : 1
                  }}
                  className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500"
                />

                {/* Send button */}
                <button
                  type="submit"
                  disabled={(!input.trim() && !selectedImage) || isLoading}
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
                    opacity: ((!input.trim() && !selectedImage) || isLoading) ? 0.5 : 1,
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

      <PaywallModal
        open={showPaywall}
        onOpenChange={async (open) => {
          setShowPaywall(open)
          // When closing the paywall, refresh profile to get updated credits (in case user purchased)
          if (!open && refreshProfile) {
            const freshProfile = await refreshProfile()
            if (freshProfile) {
              const freeRemaining = Math.max(0, 2 - (freshProfile.free_diagnostics_used || 0))
              const purchasedCredits = freshProfile.purchased_diagnostic_credits || 0
              setCurrentRemaining(freeRemaining)
              setCurrentPurchasedCredits(purchasedCredits)
            }
          }
        }}
      />
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
