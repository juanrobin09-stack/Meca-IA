import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  created_at: string
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
  const [error, setError] = useState<string | null>(null)
  const [messagesRemaining, setMessagesRemaining] = useState<number | null>(null)
  const [purchasedCredits, setPurchasedCredits] = useState<number>(0)
  const [showPaywall, setShowPaywall] = useState(false)
  const [loading, setLoading] = useState(true)
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
      setPurchasedCredits(0)
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

      const used = count || 0
      setMessagesRemaining(FREE_MESSAGES_LIMIT - used)
      setPurchasedCredits(profileData?.purchased_chat_credits || 0)
    } catch (err) {
      console.error('Error loading message count:', err)
      setMessagesRemaining(FREE_MESSAGES_LIMIT)
      setPurchasedCredits(0)
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
    try {
      const { data } = await supabase
        .from('vehicles')
        .select('id, brand, model, year')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      setVehicles(data || [])
    } catch (err) {
      console.error('Error loading vehicles:', err)
    }
  }

  const loadConversations = async () => {
    try {
      const { data } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false })

      setConversations(data || [])
      setLoading(false)
    } catch (err) {
      console.error('Error loading conversations:', err)
      setLoading(false)
    }
  }

  const loadMessages = async (conversationId: string) => {
    try {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      setMessages(data || [])
    } catch (err) {
      console.error('Error loading messages:', err)
    }
  }

  const createNewConversation = async () => {
    setCurrentConversation(null)
    setMessages([])
    setShowHistory(false)
  }

  const selectConversation = async (conversation: Conversation) => {
    setCurrentConversation(conversation)
    if (conversation.vehicle_id) {
      setSelectedVehicleId(conversation.vehicle_id)
    }
    await loadMessages(conversation.id)
    setShowHistory(false)
  }

  const deleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation()

    try {
      await supabase
        .from('chat_conversations')
        .delete()
        .eq('id', convId)

      setConversations(prev => prev.filter(c => c.id !== convId))

      if (currentConversation?.id === convId) {
        setCurrentConversation(null)
        setMessages([])
      }
    } catch (err) {
      console.error('Error deleting conversation:', err)
    }
  }

  const sendMessage = useCallback(async (messageText?: string) => {
    const text = messageText || inputMessage.trim()
    if (!text || isTyping) return

    if (!currentConversation) {
      const { data, error } = await supabase
        .from('chat_conversations')
        .insert({
          user_id: user?.id,
          vehicle_id: selectedVehicleId || null,
          title: text.slice(0, 50)
        })
        .select()
        .single()

      if (error) {
        setError('Erreur lors de la création de la conversation')
        return
      }

      setCurrentConversation(data)
      setConversations(prev => [data, ...prev])
    }

    const conversationId = currentConversation?.id || (await supabase
      .from('chat_conversations')
      .select('id')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()).data?.id

    if (!conversationId) return

    setInputMessage('')
    setIsTyping(true)
    setError(null)

    const tempUserMsg: Message = {
      id: 'temp-user-' + Date.now(),
      conversation_id: conversationId,
      sender: 'user',
      content: text,
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, tempUserMsg])

    try {
      const response = await fetch('/.netlify/functions/mechanic-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          conversationId,
          message: text,
          vehicleId: selectedVehicleId || null
        })
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.error === 'LIMIT_REACHED') {
          setShowPaywall(true)
          setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id))
          return
        }
        throw new Error(result.error || 'Erreur serveur')
      }

      const aiMsg: Message = {
        id: 'ai-' + Date.now(),
        conversation_id: conversationId,
        sender: 'ai',
        content: result.response,
        created_at: new Date().toISOString()
      }
      setMessages(prev => [...prev, aiMsg])

      if (result.messagesRemaining !== null && result.messagesRemaining !== undefined) {
        setMessagesRemaining(result.messagesRemaining)
      }
      if (result.purchasedCredits !== null && result.purchasedCredits !== undefined) {
        setPurchasedCredits(result.purchasedCredits)
      }

      loadConversations()

    } catch (err: any) {
      console.error('Send error:', err)
      setError(err.message || 'Erreur lors de l\'envoi')
      setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id))
    } finally {
      setIsTyping(false)
    }
  }, [inputMessage, isTyping, currentConversation, user, selectedVehicleId])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return "Aujourd'hui"
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hier'
    }
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  const QUICK_ACTIONS = [
    { label: 'Voyant moteur', message: 'Pourquoi mon voyant moteur est allumé ?', icon: '💡' },
    { label: 'Bruit bizarre', message: 'Mon véhicule fait un bruit bizarre', icon: '🔊' },
    { label: 'Prix vidange', message: 'Combien coûte une vidange ?', icon: '💰' },
    { label: 'Freins', message: 'Quand changer mes plaquettes ?', icon: '🔧' },
  ]

  return (
    <div className="h-[100dvh] flex flex-col bg-white dark:bg-neutral-950 overflow-hidden">
      <Sidebar />

      <div className="md:pl-64 flex-1 flex flex-col overflow-hidden">
        {/* HEADER - Fixed top with safe area */}
        <header className="flex-shrink-0 bg-white dark:bg-neutral-950 border-b border-gray-200 dark:border-neutral-800 px-4 pt-safe-top pb-3">
          <div className="flex items-center justify-between h-12 max-w-3xl mx-auto">
            {/* Left: Avatar + Name */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center shadow-sm">
                  <span className="text-xl">🔧</span>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-neutral-950 rounded-full"></div>
              </div>

              <div className="min-w-0 flex-1">
                <h1 className="text-base font-semibold text-gray-900 dark:text-white truncate">Alex</h1>
                <p className="text-xs text-gray-500 dark:text-neutral-400 truncate">Ton mécanicien • En ligne</p>
              </div>
            </div>

            {/* Right: Counter + History + New */}
            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
              <div className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-neutral-800 text-xs font-medium text-gray-700 dark:text-neutral-300 whitespace-nowrap">
                {isPremium ? '∞' : messagesRemaining !== null ? `${messagesRemaining}/10` : '...'}
                {purchasedCredits > 0 && <span className="text-emerald-600"> +{purchasedCredits}</span>}
              </div>

              <button
                onClick={() => setShowHistory(!showHistory)}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 active:bg-gray-200 dark:active:bg-neutral-700 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>

              <button
                onClick={createNewConversation}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-neutral-200 active:scale-95 transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>

          {/* Vehicle selector */}
          {vehicles.length > 0 && (
            <div className="mt-2 max-w-3xl mx-auto">
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="h-8 px-3 text-xs bg-gray-100 dark:bg-neutral-800 border-0 rounded-full text-gray-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Aucun véhicule</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.year})</option>
                ))}
              </select>
            </div>
          )}

          {/* Warning bar if near limit */}
          {!isPremium && messagesRemaining !== null && messagesRemaining <= 3 && messagesRemaining > 0 && (
            <div className="mt-2 max-w-3xl mx-auto px-3 py-2 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg">
              <p className="text-xs text-orange-800 dark:text-orange-300">
                ⚠️ Plus que {messagesRemaining} message{messagesRemaining > 1 ? 's' : ''} gratuit{messagesRemaining > 1 ? 's' : ''} aujourd'hui
              </p>
            </div>
          )}
        </header>

        {/* History Panel */}
        <AnimatePresence>
          {showHistory && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-40 md:pl-64"
                onClick={() => setShowHistory(false)}
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white dark:bg-neutral-950 border-l border-gray-200 dark:border-neutral-800 z-50 flex flex-col"
              >
                <div className="p-4 border-b border-gray-100 dark:border-neutral-900 flex items-center justify-between">
                  <h2 className="font-medium text-gray-900 dark:text-white">Historique</h2>
                  <button
                    onClick={() => setShowHistory(false)}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800"
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-1">
                  {conversations.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">Aucune conversation</p>
                  ) : (
                    conversations.map(conv => (
                      <button
                        key={conv.id}
                        onClick={() => selectConversation(conv)}
                        className={`w-full p-3 rounded-xl text-left transition-colors group ${
                          currentConversation?.id === conv.id
                            ? 'bg-gray-100 dark:bg-neutral-800'
                            : 'hover:bg-gray-50 dark:hover:bg-neutral-900'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {conv.title || 'Nouvelle conversation'}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {formatDate(conv.updated_at)}
                            </p>
                          </div>
                          <button
                            onClick={(e) => deleteConversation(conv.id, e)}
                            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-950 hover:text-red-600 transition-all"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* MESSAGES - Scrollable middle */}
        <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
            {messages.length === 0 && !loading ? (
              /* Empty State */
              <div className="flex flex-col items-center justify-center min-h-[50vh] text-center py-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center mb-4 shadow-lg">
                  <span className="text-3xl">🔧</span>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                  Salut, c'est Alex !
                </h2>
                <p className="text-sm text-gray-500 dark:text-neutral-400 mb-6">
                  Ton pote mécanicien, dispo 24h/24
                </p>

                <div className="w-full max-w-sm grid grid-cols-2 gap-2">
                  {QUICK_ACTIONS.map((action, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(action.message)}
                      className="p-3 text-left text-sm bg-gray-50 dark:bg-neutral-900 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-xl transition-colors flex items-center gap-2 active:scale-98"
                    >
                      <span>{action.icon}</span>
                      <span className="truncate text-gray-700 dark:text-neutral-300">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Messages */
              <>
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex gap-2.5 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
                        msg.sender === 'ai'
                          ? 'bg-gradient-to-br from-orange-500 to-rose-500'
                          : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                      }`}>
                        {msg.sender === 'ai' ? (
                          <span className="text-sm">🔧</span>
                        ) : (
                          <span className="text-xs font-medium text-white">
                            {user?.email?.[0]?.toUpperCase() || 'U'}
                          </span>
                        )}
                      </div>

                      {/* Bubble */}
                      <div className={`rounded-2xl px-4 py-2.5 ${
                        msg.sender === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white'
                      }`}>
                        {msg.sender === 'ai' ? (
                          <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1">
                            <ReactMarkdown
                              components={{
                                p: ({ children }) => <p className="text-sm leading-relaxed">{children}</p>,
                                ul: ({ children }) => <ul className="list-disc list-inside text-sm my-1">{children}</ul>,
                                li: ({ children }) => <li className="text-sm">{children}</li>,
                                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="flex gap-2.5 max-w-[85%]">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center shadow-sm flex-shrink-0">
                        <span className="text-sm">🔧</span>
                      </div>
                      <div className="bg-gray-100 dark:bg-neutral-800 rounded-2xl px-4 py-3">
                        <div className="flex gap-1.5">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl text-sm text-red-600 dark:text-red-400">
                    {error}
                  </div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </div>

        {/* INPUT BAR - Fixed bottom with safe area */}
        <div className="flex-shrink-0 bg-white dark:bg-neutral-950 border-t border-gray-200 dark:border-neutral-800 px-4 pt-3 pb-safe-bottom">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-2">
              {/* Textarea */}
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Message à Alex..."
                  disabled={isTyping}
                  rows={1}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 text-base text-gray-900 dark:text-white placeholder-gray-500 disabled:opacity-50"
                  style={{
                    minHeight: '48px',
                    maxHeight: '120px',
                    fontSize: '16px'
                  }}
                />
              </div>

              {/* Send button */}
              <button
                onClick={() => sendMessage()}
                disabled={isTyping || !inputMessage.trim()}
                className="w-12 h-12 bg-gradient-to-br from-orange-500 to-rose-500 rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none flex-shrink-0"
              >
                {isTyping ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <PaywallModal
        open={showPaywall}
        onOpenChange={setShowPaywall}
        mode="chat"
      />
    </div>
  )
}
