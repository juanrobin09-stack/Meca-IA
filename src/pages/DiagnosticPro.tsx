import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/hooks/useSubscription'
import { useUserLimits } from '@/hooks/useUserLimits'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import PaywallModal from '@/components/PaywallModal'
import PremiumDisclaimer from '@/components/PremiumDisclaimer'
import DiagnosticProResult from '@/components/DiagnosticProResult'
import { compressImage, validateImageFile } from '@/utils/imageCompression'
import type { FinalDiagnosisPro } from '@/types'

interface Message {
  role: 'user' | 'assistant'
  content: string
  images?: string[]
}

const MAX_IMAGES = 3

const EXAMPLE_QUESTIONS = [
  { text: 'Ma voiture fait un bruit de grincement', icon: '🔊' },
  { text: 'Voyant moteur allumé, code P0420', icon: '🚨' },
  { text: "Problème de démarrage à froid", icon: '❄️' },
  { text: 'Surconsommation de carburant', icon: '⛽' }
]

export default function DiagnosticPro() {
  const navigate = useNavigate()
  const { user, profile, refreshProfile } = useAuth()
  const { isPremium, diagnosticsRemaining, purchasedDiagnosticCredits, checkDiagnosticLimit } = useSubscription(profile)
  const userLimits = useUserLimits()

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [finalDiagnosis, setFinalDiagnosis] = useState<FinalDiagnosisPro | null>(null)
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [selectedImages, setSelectedImages] = useState<{ dataUrl: string; base64: string }[]>([])
  const [imageError, setImageError] = useState<string | null>(null)
  const [showPaywall, setShowPaywall] = useState(false)
  const [sourcesCount, setSources] = useState(0)

  const [currentRemaining, setCurrentRemaining] = useState<number>(diagnosticsRemaining)
  const [currentPurchasedCredits, setCurrentPurchasedCredits] = useState<number>(purchasedDiagnosticCredits)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const limitCheckedRef = useRef(false)

  // Check limits on load
  useEffect(() => {
    async function checkLimitOnLoad() {
      if (limitCheckedRef.current) return
      limitCheckedRef.current = true

      if (refreshProfile) {
        await refreshProfile()
      }

      const limitStatus = await checkDiagnosticLimit()
      setCurrentRemaining(limitStatus.remaining)
      setCurrentPurchasedCredits(limitStatus.purchasedCredits || 0)

      if (!limitStatus.canDiagnose && !limitStatus.isPremium) {
        setShowPaywall(true)
      }
    }
    if (user && profile) checkLimitOnLoad()
  }, [user, profile, checkDiagnosticLimit, refreshProfile])

  // Sync counters
  useEffect(() => {
    if (!isPremium) {
      setCurrentRemaining(diagnosticsRemaining)
      setCurrentPurchasedCredits(purchasedDiagnosticCredits)
    }
  }, [isPremium, diagnosticsRemaining, purchasedDiagnosticCredits])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
  }, [input])

  // Refresh user limits on mount
  useEffect(() => {
    userLimits.refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return
    if (fileInputRef.current) fileInputRef.current.value = ''

    const filesToProcess = Array.from(files).slice(0, MAX_IMAGES - selectedImages.length)

    for (const file of filesToProcess) {
      const validation = validateImageFile(file)
      if (!validation.valid) {
        setImageError(validation.error || 'Fichier invalide')
        return
      }
    }

    setImageError(null)

    try {
      const newImages = await Promise.all(
        filesToProcess.map(async (file) => {
          const compressed = await compressImage(file)
          return { dataUrl: compressed.dataUrl, base64: compressed.base64 }
        })
      )
      setSelectedImages(prev => [...prev, ...newImages].slice(0, MAX_IMAGES))
    } catch {
      setImageError('Erreur lors du traitement des images')
    }
  }

  async function sendMessage() {
    if ((!input.trim() && selectedImages.length === 0) || loading) return

    // Check limits for new session
    if (!sessionId) {
      const limitStatus = await checkDiagnosticLimit()
      if (!limitStatus.canDiagnose && !limitStatus.isPremium) {
        setShowPaywall(true)
        return
      }
    }

    const messageContent = input.trim() || 'Voici des photos de mon problème.'
    const imagesBase64 = selectedImages.map(img => img.base64)

    // Add user message immediately
    const userMessage: Message = {
      role: 'user',
      content: messageContent,
      images: selectedImages.length > 0 ? selectedImages.map(img => img.dataUrl) : undefined
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setSelectedImages([])
    setLoading(true)
    setSearching(false)

    try {
      // Get session token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Not authenticated')
      }

      const response = await fetch('/.netlify/functions/diagnostic-pro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          message: messageContent,
          userId: user?.id,
          sessionId,
          images: imagesBase64
        })
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.limitReached) {
          setShowPaywall(true)
          // Remove the user message we just added
          setMessages(prev => prev.slice(0, -1))
          return
        }
        throw new Error(data.error || 'Erreur serveur')
      }

      // Update session ID
      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId)
        // Update counters
        if (!isPremium && data.usage) {
          setCurrentRemaining(Math.max(0, data.usage.limit - data.usage.diagnosticsUsed))
        }
      }

      // Add assistant message
      if (data.response) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.response
        }])
      }

      // Handle final diagnosis
      if (data.finalDiagnosis) {
        setFinalDiagnosis(data.finalDiagnosis)
      }

      // Update sources count
      if (data.sourcesCount) {
        setSources(data.sourcesCount)
      }

      // Check if searching
      if (data.searching) {
        setSearching(true)
      }

    } catch (error) {
      console.error('[DiagnosticPro] Error:', error)
      const errorMessage = error instanceof Error && error.message !== 'Erreur serveur'
        ? error.message
        : 'Erreur lors de la communication avec le serveur. Veuillez réessayer dans quelques instants.'
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: errorMessage
      }])
    } finally {
      setLoading(false)
    }
  }

  async function requestFinalDiagnosis() {
    if (loading) return
    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Not authenticated')
      }

      setMessages(prev => [...prev, {
        role: 'user',
        content: 'Génère mon diagnostic final avec toutes les informations collectées.'
      }])

      const response = await fetch('/.netlify/functions/diagnostic-pro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          message: 'Génère mon diagnostic final avec toutes les informations collectées.',
          userId: user?.id,
          sessionId,
          forceFinalize: true
        })
      })

      const data = await response.json()

      if (data.response) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.response
        }])
      }

      if (data.finalDiagnosis) {
        setFinalDiagnosis(data.finalDiagnosis)
      }

      if (data.sourcesCount) {
        setSources(data.sourcesCount)
      }

    } catch (error) {
      console.error('[DiagnosticPro] Error:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    sendMessage()
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
          paddingTop: 'max(env(safe-area-inset-top), 8px)'
        }} className="px-3 py-2 md:px-4 md:py-3 bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2 md:gap-3 max-w-[900px] mx-auto">
            {/* Back button (mobile) */}
            <button
              onClick={() => navigate('/app')}
              className="md:hidden w-8 h-8 rounded-full flex items-center justify-center text-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
            >←</button>

            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 md:w-11 md:h-11 rounded-full overflow-hidden"
                style={{
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)'
                }}>
                <img src="/logo-icon.svg" alt="Meca IA" className="w-full h-full" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-neutral-950"></div>
            </div>

            {/* Title */}
            <div className="flex-1 min-w-0">
              <div className="text-sm md:text-base font-bold flex items-center gap-1.5 text-neutral-900 dark:text-white">
                <span className="truncate">Diagnostic PRO</span>
              </div>
              <div className="text-[10px] md:text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                <span>Expert auto</span>
                {sourcesCount > 0 && (
                  <span className="text-emerald-500">• {sourcesCount} sources</span>
                )}
              </div>
            </div>

            {/* Counter */}
            <div className="px-2 py-1 rounded-full text-[10px] md:text-xs font-medium whitespace-nowrap bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
              {isPremium ? '∞' : `${currentRemaining}/2`}
              {currentPurchasedCredits > 0 && <span className="text-emerald-500"> +{currentPurchasedCredits}</span>}
            </div>
          </div>

                  </div>

        {/* MESSAGES */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch'
        }} className="p-3 md:p-4">
          <div className="max-w-[900px] mx-auto">
            {/* Premium Disclaimer - shown only when no conversation started */}
            {messages.length === 0 && !userLimits.isPremium && (
              <PremiumDisclaimer feature="diagnostic" className="mb-4" />
            )}

            {messages.length === 0 ? (
              /* Empty State */
              <div className="text-center pt-[5vh] md:pt-[10vh]">
                <div className="w-14 h-14 md:w-[72px] md:h-[72px] rounded-xl md:rounded-2xl mx-auto mb-4 md:mb-5 overflow-hidden"
                  style={{
                    boxShadow: '0 12px 32px rgba(139, 92, 246, 0.4)'
                  }}>
                  <img src="/logo-icon.svg" alt="Meca IA" className="w-full h-full" />
                </div>
                <h2 className="text-lg md:text-[22px] font-bold mb-1 md:mb-2 text-neutral-900 dark:text-white">
                  Diagnostic
                </h2>
                <p className="text-xs md:text-sm max-w-[300px] md:max-w-[400px] mx-auto mb-4 md:mb-6 text-neutral-500 dark:text-neutral-400">
                  Analyse approfondie avec TSB, prix vérifiés et rapport complet
                </p>

                {/* Pro features */}
                <div className="grid grid-cols-2 gap-1.5 md:gap-2 max-w-[280px] md:max-w-[360px] mx-auto mb-4 md:mb-6">
                  {[
                    { icon: '🔍', text: 'TSB' },
                    { icon: '💰', text: 'Prix' },
                    { icon: '📷', text: 'Photos' },
                    { icon: '📊', text: 'Rapport' }
                  ].map((feature, i) => (
                    <div
                      key={i}
                      className="py-2 px-2.5 md:py-2.5 md:px-3 rounded-lg flex items-center gap-1.5 md:gap-2 text-[11px] md:text-[13px] bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-400"
                    >
                      <span>{feature.icon}</span>
                      <span>{feature.text}</span>
                    </div>
                  ))}
                </div>

                {/* Quick questions */}
                <div className="max-w-[340px] md:max-w-[400px] mx-auto">
                  <p className="text-[10px] md:text-xs mb-2 md:mb-3 text-neutral-400">
                    Questions fréquentes
                  </p>
                  {EXAMPLE_QUESTIONS.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(q.text)}
                      className="w-full py-2.5 px-3 md:py-3.5 md:px-4 mb-1.5 md:mb-2 rounded-xl text-left flex items-center gap-2 md:gap-3 transition-transform bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 active:scale-[0.98]"
                    >
                      <span className="text-base md:text-xl">{q.icon}</span>
                      <span className="text-xs md:text-sm text-neutral-700 dark:text-neutral-300">{q.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Messages */
              <>
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex mb-3 md:mb-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-full overflow-hidden mr-2 flex-shrink-0">
                        <img src="/logo-icon.svg" alt="Meca IA" className="w-full h-full" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] md:max-w-[80%] px-3 py-2 md:px-4 md:py-3 rounded-2xl ${
                        message.role === 'assistant' ? 'rounded-bl-sm' : 'rounded-br-sm'
                      } ${message.role === 'user'
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200'
                      }`}
                    >
                      {/* Images */}
                      {message.images && message.images.length > 0 && (
                        <div className={`grid gap-1.5 md:gap-2 ${message.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} ${message.content ? 'mb-2 md:mb-3' : ''}`}>
                          {message.images.map((img, j) => (
                            <img
                              key={j}
                              src={img}
                              alt={`Photo ${j + 1}`}
                              className="w-full rounded-lg max-h-[150px] md:max-h-[200px] object-cover"
                            />
                          ))}
                        </div>
                      )}
                      <p className="whitespace-pre-wrap m-0 text-sm md:text-[15px] leading-relaxed">
                        {message.content}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Loading indicator */}
                {loading && (
                  <div className="flex gap-2 mb-3 md:mb-4">
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-full overflow-hidden flex-shrink-0">
                      <img src="/logo-icon.svg" alt="Meca IA" className="w-full h-full" />
                    </div>
                    <div className="px-3 py-2 md:px-4 md:py-3 rounded-2xl flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800">
                      {searching ? (
                        <>
                          <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-violet-600 dark:text-violet-400 text-xs md:text-sm">Recherche...</span>
                        </>
                      ) : (
                        <>
                          <div className="bounce-dot w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-neutral-400 dark:bg-neutral-500"></div>
                          <div className="bounce-dot w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-neutral-400 dark:bg-neutral-500" style={{ animationDelay: '0.1s' }}></div>
                          <div className="bounce-dot w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-neutral-400 dark:bg-neutral-500" style={{ animationDelay: '0.2s' }}></div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Final Diagnosis Card */}
                {finalDiagnosis && (
                  <div className="mb-3 md:mb-4">
                    <DiagnosticProResult diagnosis={finalDiagnosis} />
                  </div>
                )}

                {/* Request diagnosis button */}
                {messages.length >= 3 && !finalDiagnosis && !loading && (
                  <div className="flex justify-center mb-3 md:mb-4">
                    <button
                      onClick={requestFinalDiagnosis}
                      className="px-4 py-2.5 md:px-6 md:py-3 rounded-full text-xs md:text-sm font-semibold flex items-center gap-2 text-white hover:scale-105 active:scale-95 transition-transform"
                      style={{
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                        boxShadow: '0 4px 16px rgba(139, 92, 246, 0.4)'
                      }}
                    >
                      <span>📋</span>
                      <span className="hidden xs:inline">Obtenir mon</span> diagnostic PRO
                    </button>
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
        }} className="bg-white dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 md:p-4 md:pb-4">
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            {/* Images preview */}
            {selectedImages.length > 0 && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                {selectedImages.map((img, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img
                      src={img.dataUrl}
                      alt={`Preview ${i + 1}`}
                      style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover' }}
                    />
                    <button
                      onClick={() => setSelectedImages(prev => prev.filter((_, j) => j !== i))}
                      style={{
                        position: 'absolute',
                        top: -6,
                        right: -6,
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        backgroundColor: '#ef4444',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >×</button>
                  </div>
                ))}
              </div>
            )}

            {imageError && (
              <div style={{ fontSize: 12, marginBottom: 8 }} className="text-red-500">{imageError}</div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                {/* Photo button */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading || selectedImages.length >= MAX_IMAGES}
                  style={{
                    borderRadius: '50%',
                    border: 'none',
                    cursor: 'pointer',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: (loading || selectedImages.length >= MAX_IMAGES) ? 0.4 : 1
                  }}
                  className="w-10 h-10 md:w-12 md:h-12 text-lg md:text-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                >📷</button>

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
                  disabled={loading}
                  rows={1}
                  style={{
                    flex: 1,
                    borderRadius: 20,
                    fontSize: 16,
                    resize: 'none',
                    maxHeight: 100,
                    outline: 'none',
                    fontFamily: 'inherit',
                    opacity: loading ? 0.5 : 1
                  }}
                  className="p-2.5 md:p-3 min-h-[40px] md:min-h-[48px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500"
                />

                {/* Send button */}
                <button
                  type="submit"
                  disabled={(!input.trim() && selectedImages.length === 0) || loading}
                  style={{
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                    border: 'none',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    opacity: ((!input.trim() && selectedImages.length === 0) || loading) ? 0.5 : 1,
                    flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)'
                  }}
                  className="w-10 h-10 md:w-12 md:h-12 text-base md:text-lg"
                >
                  {loading ? '⏳' : '➤'}
                </button>
              </div>
            </form>

            <p className="text-[9px] md:text-[10px] text-center mt-1.5 md:mt-2 text-neutral-400 dark:text-neutral-500">
              Diagnostic PRO • À titre indicatif
            </p>
          </div>
        </div>
      </div>

      <PaywallModal
        open={showPaywall}
        onOpenChange={async (open) => {
          setShowPaywall(open)
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

      <style>{`
        .bounce-dot {
          animation: bounce 0.6s ease-in-out infinite;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}
