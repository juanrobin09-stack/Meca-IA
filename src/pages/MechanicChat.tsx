import { useState, useEffect, useRef, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import Sidebar from '@/components/Sidebar'
import PaywallModal from '@/components/PaywallModal'
import PremiumDisclaimer from '@/components/PremiumDisclaimer'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/hooks/useSubscription'
import { useUserLimits } from '@/hooks/useUserLimits'
import { supabase } from '@/lib/supabase'
import { compressImage, validateImageFile } from '@/utils/imageCompression'
import { useSoundEffects } from '@/hooks/useSoundEffects'

interface Vehicle {
  id: string
  brand: string
  model: string
  year: number
}

interface Conversation {
  id: string
  title: string | null
  vehicle_id: string | null
  updated_at: string
}

interface Message {
  id: string
  conversation_id: string
  sender: 'user' | 'ai'
  content: string
  created_at: string
}

export default function MechanicChat() {
  const { user, profile } = useAuth()
  const { isPremium } = useSubscription(profile)
  const userLimits = useUserLimits()
  const { playSend, playError, playClick } = useSoundEffects()

  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [messagesRemaining, setMessagesRemaining] = useState<number | null>(null)
  const [purchasedCredits, setPurchasedCredits] = useState<number>(0)
  const [showPaywall, setShowPaywall] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [selectedImage, setSelectedImage] = useState<{ dataUrl: string; base64: string } | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const FREE_MESSAGES_LIMIT = 10
  const MAX_PHOTOS_PER_CONVERSATION = 2
  const photosUsed = messages.filter(m => m.content.includes('[IMAGE]')).length

  useEffect(() => {
    if (user) {
      loadVehicles()
      loadConversations()
      loadDailyMessageCount()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Refresh user limits on mount
  useEffect(() => {
    userLimits.refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadDailyMessageCount = async () => {
    if (!user || isPremium) {
      setMessagesRemaining(null)
      return
    }

    try {
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)

      const [{ count }, { data: profileData }] = await Promise.all([
        supabase
          .from('chat_messages')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('sender', 'user')
          .gte('created_at', startOfDay.toISOString()),
        supabase
          .from('profiles')
          .select('purchased_chat_credits')
          .eq('id', user.id)
          .single()
      ])

      setMessagesRemaining(FREE_MESSAGES_LIMIT - (count || 0))
      setPurchasedCredits(profileData?.purchased_chat_credits || 0)
    } catch {
      setMessagesRemaining(FREE_MESSAGES_LIMIT)
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
  }, [inputMessage])

  const loadVehicles = async () => {
    const { data } = await supabase
      .from('vehicles')
      .select('id, brand, model, year')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
    setVehicles(data || [])
  }

  const loadConversations = async () => {
    const { data } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('user_id', user?.id)
      .order('updated_at', { ascending: false })
    setConversations(data || [])
  }

  const loadMessages = async (conversationId: string) => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
    setMessages(data || [])
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const sendMessage = useCallback(async (messageText?: string) => {
    const text = messageText || inputMessage.trim()
    const hasImage = !!selectedImage
    if ((!text && !hasImage) || isTyping) return

    let convId = currentConversation?.id

    if (!convId) {
      const { data } = await supabase
        .from('chat_conversations')
        .insert({ user_id: user?.id, vehicle_id: selectedVehicleId || null, title: (text || 'Photo').slice(0, 50) })
        .select()
        .single()
      if (data) {
        convId = data.id
        setCurrentConversation(data)
        setConversations(prev => [data, ...prev])
      }
    }

    if (!convId) return

    const messageContent = hasImage ? `[IMAGE]\n${text || 'Analyse cette image'}` : text
    setInputMessage('')
    setIsTyping(true)
    playSend()

    const tempMsg: Message = {
      id: 'temp-' + Date.now(),
      conversation_id: convId,
      sender: 'user',
      content: messageContent,
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, tempMsg])

    try {
      // Timeout de 90 secondes pour laisser le temps aux recherches web
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 90000)

      const response = await fetch('/.netlify/functions/mechanic-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          conversationId: convId,
          message: text || 'Analyse cette image',
          vehicleId: selectedVehicleId || null,
          image: hasImage ? selectedImage.base64 : undefined
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      const result = await response.json()

      // Gérer les erreurs retournées par le backend (même avec status 200)
      if (result.error === true) {
        // Afficher le message d'erreur comme réponse d'Alex
        const errorMsg: Message = {
          id: 'error-' + Date.now(),
          conversation_id: convId,
          sender: 'ai',
          content: result.response || "Désolé, un problème technique est survenu. Réessaie !",
          created_at: new Date().toISOString()
        }
        setMessages(prev => [...prev.filter(m => m.id !== tempMsg.id), tempMsg, errorMsg])
        return
      }

      if (!response.ok) {
        if (result.error === 'LIMIT_REACHED') {
          setShowPaywall(true)
          setMessages(prev => prev.filter(m => m.id !== tempMsg.id))
          return
        }
        throw new Error(result.error)
      }

      // Recharger les messages depuis la DB pour garantir la persistance
      await loadMessages(convId)
      await loadConversations()

      if (result.messagesRemaining !== undefined) setMessagesRemaining(result.messagesRemaining)
      if (result.purchasedCredits !== undefined) setPurchasedCredits(result.purchasedCredits)

      setSelectedImage(null)
    } catch (err) {
      const error = err as { name?: string }
      // Message d'erreur user-friendly
      playError()
      const errorMessage = error?.name === 'AbortError'
        ? "La réponse prend trop de temps. Réessaie avec une question plus simple !"
        : "Oups, un problème est survenu. Réessaie !"

      const errorMsg: Message = {
        id: 'error-' + Date.now(),
        conversation_id: convId,
        sender: 'ai',
        content: `Désolé, ${errorMessage} 🔧`,
        created_at: new Date().toISOString()
      }
      setMessages(prev => [...prev.filter(m => m.id !== tempMsg.id), tempMsg, errorMsg])
    } finally {
      setIsTyping(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputMessage, isTyping, currentConversation, user, selectedVehicleId, selectedImage])

  const QUICK_ACTIONS = [
    { label: 'Voyant moteur', message: 'Pourquoi mon voyant moteur est allumé ?', icon: '💡' },
    { label: 'Bruit bizarre', message: 'Mon véhicule fait un bruit bizarre', icon: '🔊' },
    { label: 'Prix vidange', message: 'Combien coûte une vidange ?', icon: '💰' },
    { label: 'Freins', message: 'Quand changer mes plaquettes ?', icon: '🔧' },
  ]

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
      }} className="md:ml-64 bg-neutral-950">

        {/* HEADER */}
        <div style={{
          flexShrink: 0,
          padding: '12px 16px',
          paddingTop: 'max(env(safe-area-inset-top), 12px)'
        }} className="bg-neutral-950/80 backdrop-blur-xl border-b border-white/[0.06]">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', maxWidth: '768px', margin: '0 auto' }}>
            {/* Avatar */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                boxShadow: '0 0 20px rgba(124,58,237,0.3)'
              }}>🔧</div>
              <div style={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                width: 12,
                height: 12,
                borderRadius: '50%',
                border: '2px solid #0a0a0a'
              }} className="bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.6)]"></div>
            </div>

            {/* Name */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="text-white text-base font-semibold tracking-tight">Alex</div>
              <div className="text-violet-400/80 text-xs">Mécanicien IA Expert</div>
            </div>

            {/* Counter */}
            {isPremium ? (
              <div style={{
                padding: '4px 10px',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 500,
                whiteSpace: 'nowrap'
              }} className="bg-violet-500/10 text-violet-400 border border-violet-500/20">
                Illimité
              </div>
            ) : (
              <div style={{
                padding: '4px 10px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 500,
                whiteSpace: 'nowrap'
              }} className="bg-white/[0.06] text-neutral-400 border border-white/[0.06]">
                {messagesRemaining !== null ? `${messagesRemaining}/10` : '...'}
                {purchasedCredits > 0 && <span className="text-emerald-500"> +{purchasedCredits}</span>}
              </div>
            )}

            {/* History button */}
            <button
              onClick={() => { playClick(); setShowHistory(!showHistory) }}
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
              className="bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] hover:bg-white/[0.1] transition-colors"
            >🕒</button>

            {/* New chat button */}
            <button
              onClick={() => { playClick(); setCurrentConversation(null); setMessages([]); setShowHistory(false) }}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                background: 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)',
                color: '#fff',
                boxShadow: '0 0 16px rgba(124,58,237,0.3)'
              }}
              className="hover:opacity-90 transition-opacity"
            >+</button>
          </div>

          {/* Vehicle selector */}
          {vehicles.length > 0 && (
            <div style={{ maxWidth: '768px', margin: '8px auto 0' }}>
              <select
                value={selectedVehicleId}
                onChange={e => setSelectedVehicleId(e.target.value)}
                style={{
                  height: 32,
                  padding: '0 12px',
                  borderRadius: 999,
                  fontSize: 12,
                  cursor: 'pointer'
                }}
                className="bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] text-neutral-300 appearance-auto"
              >
                <option value="">Aucun véhicule</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.year})</option>)}
              </select>
            </div>
          )}
        </div>

        {/* HISTORY PANEL */}
        {showHistory && (
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: 280,
            maxWidth: '80vw',
            zIndex: 50,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '-8px 0 32px rgba(0,0,0,0.4)',
            animation: 'slideInRight 0.2s ease-out'
          }} className="bg-neutral-900/95 backdrop-blur-xl border-l border-white/[0.06]">
            <div style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="border-b border-white/[0.06]">
              <span className="text-white font-semibold">Historique</span>
              <button onClick={() => setShowHistory(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }} className="text-neutral-500 hover:text-white transition-colors">×</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
              {conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => { setCurrentConversation(conv); loadMessages(conv.id); setShowHistory(false) }}
                  style={{
                    width: '100%',
                    padding: 12,
                    textAlign: 'left',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    marginBottom: 4
                  }}
                  className={currentConversation?.id === conv.id
                    ? 'bg-violet-500/15 border border-violet-500/20 text-white'
                    : 'bg-transparent hover:bg-white/[0.06] text-neutral-300 transition-colors'}
                >
                  <div style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {conv.title || 'Nouvelle conversation'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* MESSAGES */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: 16,
          WebkitOverflowScrolling: 'touch'
        }}>
          <div style={{ maxWidth: '768px', margin: '0 auto' }}>
            {/* Premium Disclaimer - shown only when no conversation started */}
            {messages.length === 0 && !userLimits.isPremium && (
              <PremiumDisclaimer feature="chat" className="mb-4" />
            )}

            {messages.length === 0 ? (
              /* Empty State */
              <div style={{ textAlign: 'center', paddingTop: '10vh' }}>
                <div style={{
                  width: 80,
                  height: 80,
                  borderRadius: 24,
                  background: 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 40,
                  margin: '0 auto 20px',
                  boxShadow: '0 12px 40px rgba(124,58,237,0.35), 0 0 60px rgba(124,58,237,0.15)'
                }}>🔧</div>
                <h2 className="text-white text-2xl font-bold tracking-tight mb-1">Salut, c'est Alex !</h2>
                <p className="text-neutral-500 text-base mb-8">Ton pote mécanicien, dispo 24h/24</p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, maxWidth: 340, margin: '0 auto' }}>
                  {QUICK_ACTIONS.map((action, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(action.message)}
                      style={{
                        padding: '14px 12px',
                        borderRadius: 14,
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10
                      }}
                      className="bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm hover:bg-white/[0.08] hover:border-violet-500/30 transition-all duration-200 group"
                    >
                      <span style={{ fontSize: 18, width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="bg-violet-500/10">{action.icon}</span>
                      <span className="text-neutral-300 text-sm group-hover:text-white transition-colors">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Messages */
              <>
                {messages.map(msg => (
                  <div key={msg.id} style={{
                    display: 'flex',
                    justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    marginBottom: 16
                  }}>
                    <div style={{
                      display: 'flex',
                      gap: 8,
                      maxWidth: '85%',
                      flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row'
                    }}>
                      {/* Avatar */}
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: msg.sender === 'ai'
                          ? 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)'
                          : 'linear-gradient(135deg, #06B6D4 0%, #22D3EE 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        flexShrink: 0
                      }}>
                        {msg.sender === 'ai' ? '🔧' : <span style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>{user?.email?.[0]?.toUpperCase() || 'U'}</span>}
                      </div>

                      {/* Bubble */}
                      <div style={{
                        padding: '10px 14px',
                        borderRadius: 16,
                        fontSize: 15,
                        lineHeight: 1.5,
                        wordBreak: 'break-word'
                      }} className={msg.sender === 'user'
                        ? 'bg-gradient-to-br from-violet-600 to-violet-500 text-white'
                        : 'bg-white/[0.06] border border-white/[0.08] backdrop-blur-sm text-neutral-100'}>
                        {msg.sender === 'ai' ? (
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => <p style={{ margin: '4px 0' }}>{children}</p>,
                              ul: ({ children }) => <ul style={{ margin: '4px 0', paddingLeft: 20 }}>{children}</ul>,
                              li: ({ children }) => <li style={{ margin: '2px 0' }}>{children}</li>,
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        ) : msg.content}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {isTyping && (
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14
                    }}>🔧</div>
                    <div style={{ padding: '12px 16px', borderRadius: 16, display: 'flex', gap: 4 }} className="bg-white/[0.06] border border-white/[0.08] backdrop-blur-sm">
                      <div className="bounce-dot bg-violet-400" style={{ width: 8, height: 8, borderRadius: '50%' }}></div>
                      <div className="bounce-dot bg-violet-400" style={{ width: 8, height: 8, borderRadius: '50%', animationDelay: '0.1s' }}></div>
                      <div className="bounce-dot bg-violet-400" style={{ width: 8, height: 8, borderRadius: '50%', animationDelay: '0.2s' }}></div>
                    </div>
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
        }} className="bg-neutral-950/80 backdrop-blur-xl border-t border-white/[0.06] md:pb-4">
          <div style={{ maxWidth: '768px', margin: '0 auto' }}>
            {/* Image preview */}
            {selectedImage && (
              <div style={{ marginBottom: 8, position: 'relative', display: 'inline-block' }}>
                <img src={selectedImage.dataUrl} alt="Preview" style={{ height: 80, borderRadius: 12 }} className="border-2 border-violet-500/40" />
                <button
                  onClick={() => setSelectedImage(null)}
                  style={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    border: 'none',
                    background: '#ef4444',
                    color: '#fff',
                    fontSize: 14,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >×</button>
              </div>
            )}

            {imageError && (
              <div style={{ fontSize: 12, marginBottom: 8 }} className="text-red-500">{imageError}</div>
            )}

            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              {/* Photo button */}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} style={{ display: 'none' }} />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isTyping || photosUsed >= MAX_PHOTOS_PER_CONVERSATION}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 20,
                  flexShrink: 0,
                  opacity: (isTyping || photosUsed >= MAX_PHOTOS_PER_CONVERSATION) ? 0.4 : 1
                }}
                className="bg-violet-500/10 text-violet-400 border border-violet-500/20 hover:bg-violet-500/20 transition-colors"
              >📷</button>

              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                placeholder="Message à Alex..."
                disabled={isTyping}
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
                  fontFamily: 'inherit'
                }}
                className="bg-white/[0.04] border border-white/[0.08] text-white placeholder-neutral-500 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all"
              />

              <button
                onClick={() => sendMessage()}
                disabled={(!inputMessage.trim() && !selectedImage) || isTyping}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)',
                  border: 'none',
                  color: '#fff',
                  fontSize: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  opacity: ((!inputMessage.trim() && !selectedImage) || isTyping) ? 0.5 : 1,
                  flexShrink: 0,
                  boxShadow: '0 4px 16px rgba(124,58,237,0.35)'
                }}
              >
                {isTyping ? '⏳' : '➤'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <PaywallModal open={showPaywall} onOpenChange={setShowPaywall} mode="chat" />
    </>
  )
}
