import { useState, useEffect, useRef, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import Sidebar from '@/components/Sidebar'
import PaywallModal from '@/components/PaywallModal'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/hooks/useSubscription'
import { supabase } from '@/lib/supabase'

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

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const FREE_MESSAGES_LIMIT = 10

  useEffect(() => {
    if (user) {
      loadVehicles()
      loadConversations()
      loadDailyMessageCount()
    }
  }, [user])

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

  const sendMessage = useCallback(async (messageText?: string) => {
    const text = messageText || inputMessage.trim()
    if (!text || isTyping) return

    let convId = currentConversation?.id

    if (!convId) {
      const { data } = await supabase
        .from('chat_conversations')
        .insert({ user_id: user?.id, vehicle_id: selectedVehicleId || null, title: text.slice(0, 50) })
        .select()
        .single()
      if (data) {
        convId = data.id
        setCurrentConversation(data)
        setConversations(prev => [data, ...prev])
      }
    }

    if (!convId) return

    setInputMessage('')
    setIsTyping(true)

    const tempMsg: Message = {
      id: 'temp-' + Date.now(),
      conversation_id: convId,
      sender: 'user',
      content: text,
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, tempMsg])

    try {
      const response = await fetch('/.netlify/functions/mechanic-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, conversationId: convId, message: text, vehicleId: selectedVehicleId || null })
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.error === 'LIMIT_REACHED') {
          setShowPaywall(true)
          setMessages(prev => prev.filter(m => m.id !== tempMsg.id))
          return
        }
        throw new Error(result.error)
      }

      setMessages(prev => [...prev, { id: 'ai-' + Date.now(), conversation_id: convId!, sender: 'ai', content: result.response, created_at: new Date().toISOString() }])

      if (result.messagesRemaining !== undefined) setMessagesRemaining(result.messagesRemaining)
      if (result.purchasedCredits !== undefined) setPurchasedCredits(result.purchasedCredits)

      loadConversations()
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id))
    } finally {
      setIsTyping(false)
    }
  }, [inputMessage, isTyping, currentConversation, user, selectedVehicleId])

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
      }} className="md:ml-64 bg-white dark:bg-neutral-950">

        {/* HEADER */}
        <div style={{
          flexShrink: 0,
          padding: '12px 16px',
          paddingTop: 'max(env(safe-area-inset-top), 12px)'
        }} className="bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', maxWidth: '768px', margin: '0 auto' }}>
            {/* Avatar */}
            <div style={{
              position: 'relative',
              flexShrink: 0
            }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #f97316 0%, #f43f5e 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>🔧</div>
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
              <div style={{ fontSize: 16, fontWeight: 600 }} className="text-neutral-900 dark:text-white">Alex</div>
              <div style={{ fontSize: 12 }} className="text-neutral-500 dark:text-neutral-400">Ton mécanicien • En ligne</div>
            </div>

            {/* Counter */}
            <div style={{
              padding: '4px 10px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 500,
              whiteSpace: 'nowrap'
            }} className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
              {isPremium ? '∞' : messagesRemaining !== null ? `${messagesRemaining}/10` : '...'}
              {purchasedCredits > 0 && <span className="text-emerald-500"> +{purchasedCredits}</span>}
            </div>

            {/* History button */}
            <button
              onClick={() => setShowHistory(!showHistory)}
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
              className="bg-neutral-100 dark:bg-neutral-800"
            >🕒</button>

            {/* New chat button */}
            <button
              onClick={() => { setCurrentConversation(null); setMessages([]); setShowHistory(false) }}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20
              }}
              className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
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
                  border: 'none',
                  fontSize: 12,
                  cursor: 'pointer'
                }}
                className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
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
            boxShadow: '-4px 0 12px rgba(0,0,0,0.1)'
          }} className="bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800">
            <div style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="border-b border-neutral-200 dark:border-neutral-800">
              <span style={{ fontWeight: 600 }} className="text-neutral-900 dark:text-white">Historique</span>
              <button onClick={() => setShowHistory(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }} className="text-neutral-600 dark:text-neutral-400">×</button>
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
                  className={currentConversation?.id === conv.id ? 'bg-neutral-100 dark:bg-neutral-800' : 'bg-transparent hover:bg-neutral-50 dark:hover:bg-neutral-800'}
                >
                  <div style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} className="text-neutral-900 dark:text-white">
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
            {messages.length === 0 ? (
              /* Empty State */
              <div style={{ textAlign: 'center', paddingTop: '15vh' }}>
                <div style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  background: 'linear-gradient(135deg, #f97316 0%, #f43f5e 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 32,
                  margin: '0 auto 16px',
                  boxShadow: '0 8px 24px rgba(249,115,22,0.3)'
                }}>🔧</div>
                <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }} className="text-neutral-900 dark:text-white">Salut, c'est Alex !</h2>
                <p style={{ marginBottom: 24 }} className="text-neutral-500 dark:text-neutral-400">Ton pote mécanicien, dispo 24h/24</p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, maxWidth: 320, margin: '0 auto' }}>
                  {QUICK_ACTIONS.map((action, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(action.message)}
                      style={{
                        padding: 12,
                        border: 'none',
                        borderRadius: 12,
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                      }}
                      className="bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                    >
                      <span>{action.icon}</span>
                      <span style={{ fontSize: 13 }} className="text-neutral-700 dark:text-neutral-300">{action.label}</span>
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
                        background: msg.sender === 'ai' ? 'linear-gradient(135deg, #f97316 0%, #f43f5e 100%)' : 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        flexShrink: 0
                      }}>
                        {msg.sender === 'ai' ? '🔧' : <span style={{ color: '#fff', fontWeight: 500 }}>{user?.email?.[0]?.toUpperCase() || 'U'}</span>}
                      </div>

                      {/* Bubble */}
                      <div style={{
                        padding: '10px 14px',
                        borderRadius: 16,
                        fontSize: 15,
                        lineHeight: 1.5,
                        wordBreak: 'break-word'
                      }} className={msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white'}>
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
                      background: 'linear-gradient(135deg, #f97316 0%, #f43f5e 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14
                    }}>🔧</div>
                    <div style={{ padding: '12px 16px', borderRadius: 16, display: 'flex', gap: 4 }} className="bg-neutral-100 dark:bg-neutral-800">
                      <div className="bounce-dot bg-neutral-400 dark:bg-neutral-500" style={{ width: 8, height: 8, borderRadius: '50%' }}></div>
                      <div className="bounce-dot bg-neutral-400 dark:bg-neutral-500" style={{ width: 8, height: 8, borderRadius: '50%', animationDelay: '0.1s' }}></div>
                      <div className="bounce-dot bg-neutral-400 dark:bg-neutral-500" style={{ width: 8, height: 8, borderRadius: '50%', animationDelay: '0.2s' }}></div>
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
        }} className="bg-white dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 md:pb-4">
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', maxWidth: '768px', margin: '0 auto' }}>
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
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500"
            />

            <button
              onClick={() => sendMessage()}
              disabled={!inputMessage.trim() || isTyping}
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #f97316 0%, #f43f5e 100%)',
                border: 'none',
                color: '#fff',
                fontSize: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                opacity: (!inputMessage.trim() || isTyping) ? 0.5 : 1,
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(249,115,22,0.3)'
              }}
            >
              {isTyping ? '⏳' : '➤'}
            </button>
          </div>
        </div>
      </div>

      <PaywallModal open={showPaywall} onOpenChange={setShowPaywall} mode="chat" />

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
