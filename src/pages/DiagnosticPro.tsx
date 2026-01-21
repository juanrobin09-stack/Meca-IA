import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/hooks/useSubscription'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import PaywallModal from '@/components/PaywallModal'
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
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Erreur lors de la communication avec le serveur. Veuillez réessayer.'
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
          padding: '12px 16px',
          paddingTop: 'max(env(safe-area-inset-top), 12px)'
        }} className="bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', maxWidth: '900px', margin: '0 auto' }}>
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
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #3b82f6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)'
              }}>🔬</div>
              <div style={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                width: 14,
                height: 14,
                backgroundColor: '#22c55e',
                borderRadius: '50%',
                border: '2px solid #fff'
              }}></div>
            </div>

            {/* Title */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }} className="text-neutral-900 dark:text-white">
                Diagnostic PRO
                <span style={{
                  fontSize: 9,
                  fontWeight: 600,
                  padding: '2px 6px',
                  borderRadius: 4,
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                  color: '#fff'
                }}>AVANCÉ</span>
              </div>
              <div style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }} className="text-neutral-500 dark:text-neutral-400">
                <span>Expert auto</span>
                {sourcesCount > 0 && (
                  <span className="text-emerald-500">• {sourcesCount} sources</span>
                )}
              </div>
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

          {/* Pro features banner */}
          <div style={{ maxWidth: '900px', margin: '8px auto 0' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '8px 12px',
              borderRadius: 8,
              fontSize: 11,
              overflowX: 'auto'
            }} className="bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-400">
              <span>🔍 Recherche TSB</span>
              <span>•</span>
              <span>📷 Vision IA</span>
              <span>•</span>
              <span>💰 Prix vérifiés</span>
              <span>•</span>
              <span>📋 Rapport complet</span>
            </div>
          </div>
        </div>

        {/* MESSAGES */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: 16,
          WebkitOverflowScrolling: 'touch'
        }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            {messages.length === 0 ? (
              /* Empty State */
              <div style={{ textAlign: 'center', paddingTop: '10vh' }}>
                <div style={{
                  width: 72,
                  height: 72,
                  borderRadius: 18,
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #3b82f6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 36,
                  margin: '0 auto 20px',
                  boxShadow: '0 12px 32px rgba(139, 92, 246, 0.4)'
                }}>🔬</div>
                <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }} className="text-neutral-900 dark:text-white">
                  Diagnostic Professionnel
                </h2>
                <p style={{ marginBottom: 8, maxWidth: 400, margin: '0 auto 24px' }} className="text-neutral-500 dark:text-neutral-400">
                  Analyse approfondie avec recherche temps réel de TSB, prix et forums techniques
                </p>

                {/* Pro features */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 8,
                  maxWidth: 360,
                  margin: '0 auto 24px'
                }}>
                  {[
                    { icon: '🔍', text: 'TSB constructeur' },
                    { icon: '💰', text: 'Prix actualisés' },
                    { icon: '📷', text: 'Analyse photos' },
                    { icon: '📊', text: 'Rapport complet' }
                  ].map((feature, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 10,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 13
                      }}
                      className="bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-400"
                    >
                      <span>{feature.icon}</span>
                      <span>{feature.text}</span>
                    </div>
                  ))}
                </div>

                {/* Quick questions */}
                <div style={{ maxWidth: 400, margin: '0 auto' }}>
                  <p style={{ fontSize: 12, marginBottom: 12 }} className="text-neutral-400">
                    Questions fréquentes
                  </p>
                  {EXAMPLE_QUESTIONS.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(q.text)}
                      style={{
                        width: '100%',
                        padding: 14,
                        marginBottom: 8,
                        border: 'none',
                        borderRadius: 12,
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        transition: 'transform 0.2s'
                      }}
                      className="bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 active:scale-98"
                    >
                      <span style={{ fontSize: 20 }}>{q.icon}</span>
                      <span style={{ fontSize: 14 }} className="text-neutral-700 dark:text-neutral-300">{q.text}</span>
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
                    style={{
                      display: 'flex',
                      justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                      marginBottom: 16
                    }}
                  >
                    {message.role === 'assistant' && (
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        marginRight: 8,
                        flexShrink: 0
                      }}>🔬</div>
                    )}
                    <div
                      style={{
                        maxWidth: '80%',
                        padding: '12px 16px',
                        borderRadius: 16,
                        borderBottomLeftRadius: message.role === 'assistant' ? 4 : 16,
                        borderBottomRightRadius: message.role === 'user' ? 4 : 16
                      }}
                      className={message.role === 'user'
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200'
                      }
                    >
                      {/* Images */}
                      {message.images && message.images.length > 0 && (
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: message.images.length > 1 ? 'repeat(2, 1fr)' : '1fr',
                          gap: 8,
                          marginBottom: message.content ? 12 : 0
                        }}>
                          {message.images.map((img, j) => (
                            <img
                              key={j}
                              src={img}
                              alt={`Photo ${j + 1}`}
                              style={{
                                width: '100%',
                                borderRadius: 8,
                                maxHeight: 200,
                                objectFit: 'cover'
                              }}
                            />
                          ))}
                        </div>
                      )}
                      <p style={{ whiteSpace: 'pre-wrap', margin: 0, fontSize: 15, lineHeight: 1.5 }}>
                        {message.content}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Loading indicator */}
                {loading && (
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14
                    }}>🔬</div>
                    <div style={{ padding: '12px 16px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 8 }} className="bg-neutral-100 dark:bg-neutral-800">
                      {searching ? (
                        <>
                          <div style={{
                            width: 16,
                            height: 16,
                            border: '2px solid #8b5cf6',
                            borderTopColor: 'transparent',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                          }}></div>
                          <span className="text-violet-600 dark:text-violet-400" style={{ fontSize: 14 }}>Recherche en cours...</span>
                        </>
                      ) : (
                        <>
                          <div className="bounce-dot bg-neutral-400 dark:bg-neutral-500" style={{ width: 8, height: 8, borderRadius: '50%' }}></div>
                          <div className="bounce-dot bg-neutral-400 dark:bg-neutral-500" style={{ width: 8, height: 8, borderRadius: '50%', animationDelay: '0.1s' }}></div>
                          <div className="bounce-dot bg-neutral-400 dark:bg-neutral-500" style={{ width: 8, height: 8, borderRadius: '50%', animationDelay: '0.2s' }}></div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Final Diagnosis Card */}
                {finalDiagnosis && (
                  <div style={{ marginBottom: 16 }}>
                    <DiagnosticProResult diagnosis={finalDiagnosis} />
                  </div>
                )}

                {/* Request diagnosis button */}
                {messages.length >= 3 && !finalDiagnosis && !loading && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                    <button
                      onClick={requestFinalDiagnosis}
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
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                        color: '#fff',
                        boxShadow: '0 4px 16px rgba(139, 92, 246, 0.4)',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                      }}
                      className="hover:scale-105 active:scale-95"
                    >
                      <span>📋</span>
                      Obtenir mon diagnostic PRO
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
        }} className="bg-white dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 md:pb-4">
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
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 20,
                    flexShrink: 0,
                    opacity: (loading || selectedImages.length >= MAX_IMAGES) ? 0.4 : 1
                  }}
                  className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
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
                  placeholder="Décris ton problème en détail..."
                  disabled={loading}
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
                    opacity: loading ? 0.5 : 1
                  }}
                  className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500"
                />

                {/* Send button */}
                <button
                  type="submit"
                  disabled={(!input.trim() && selectedImages.length === 0) || loading}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                    border: 'none',
                    color: '#fff',
                    fontSize: 18,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    opacity: ((!input.trim() && selectedImages.length === 0) || loading) ? 0.5 : 1,
                    flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)'
                  }}
                >
                  {loading ? '⏳' : '➤'}
                </button>
              </div>
            </form>

            <p style={{ fontSize: 10, textAlign: 'center', marginTop: 8 }} className="text-neutral-400 dark:text-neutral-500">
              Diagnostic PRO avec recherche temps réel • À titre indicatif uniquement
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
