import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import Sidebar from '@/components/Sidebar'
import PageTransition from '@/components/PageTransition'
import PaywallModal from '@/components/PaywallModal'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/hooks/useSubscription'
import { supabase } from '@/lib/supabase'
import {
  ArrowLeft,
  Send,
  Loader2,
  Plus,
  Car,
  Trash2,
  Clock,
  Sparkles,
  ChevronRight,
  User,
  X
} from 'lucide-react'

interface Vehicle {
  id: string
  brand: string
  model: string
  year: number
  mileage: number
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

const QUICK_ACTIONS = [
  { label: 'Voyant moteur', message: 'Pourquoi mon voyant moteur est allumé ?', icon: '💡' },
  { label: 'Bruit bizarre', message: 'Mon véhicule fait un bruit bizarre', icon: '🔊' },
  { label: 'Prix vidange', message: 'Combien coûte une vidange ?', icon: '💰' },
  { label: 'Freins', message: 'Quand changer mes plaquettes ?', icon: '🔧' },
]

export default function MechanicChat() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { isPremium } = useSubscription(profile)

  // State
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

  // Load vehicles, conversations and message count on mount
  useEffect(() => {
    if (user) {
      loadVehicles()
      loadConversations()
      loadDailyMessageCount()
    }
  }, [user])

  // Load daily message count
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

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Auto-resize textarea
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
        .select('id, brand, model, year, mileage')
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

    // Create conversation if none exists
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

    // Optimistic update
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

      // Add AI response
      const aiMsg: Message = {
        id: 'ai-' + Date.now(),
        conversation_id: conversationId,
        sender: 'ai',
        content: result.response,
        created_at: new Date().toISOString()
      }
      setMessages(prev => [...prev, aiMsg])

      // Update counts
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

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    })
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

  return (
    <PageTransition>
      <div className="min-h-screen bg-white dark:bg-neutral-950">
        <Sidebar />

        <main className="md:pl-64">
          <div className="h-[100dvh] md:h-screen flex flex-col">
            {/* Header - Style Claude/ChatGPT */}
            <header className="flex-shrink-0 border-b border-neutral-100 dark:border-neutral-900 bg-white dark:bg-neutral-950">
              <div className="px-4 py-3">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                  {/* Left */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => navigate('/app')}
                      className="md:hidden p-2 -ml-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
                    >
                      <ArrowLeft className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
                    </button>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                        <span className="text-sm">🔧</span>
                      </div>
                      <span className="font-medium text-neutral-900 dark:text-white">Alex</span>
                      {isPremium && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full">
                          PRO
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right */}
                  <div className="flex items-center gap-2">
                    {/* Counter */}
                    {!isPremium && messagesRemaining !== null && (
                      <span className="text-xs text-neutral-500">
                        {messagesRemaining}/10
                        {purchasedCredits > 0 && <span className="text-emerald-600"> +{purchasedCredits}</span>}
                      </span>
                    )}
                    {isPremium && (
                      <span className="text-xs text-amber-600 flex items-center gap-1">
                        <Sparkles className="h-3 w-3" /> Illimité
                      </span>
                    )}

                    {/* History */}
                    <button
                      onClick={() => setShowHistory(!showHistory)}
                      className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
                    >
                      <Clock className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
                    </button>

                    {/* New Chat */}
                    <button
                      onClick={createNewConversation}
                      className="p-2 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Vehicle Selector */}
                {vehicles.length > 0 && (
                  <div className="max-w-3xl mx-auto mt-2">
                    <Select
                      value={selectedVehicleId || '_none'}
                      onValueChange={(val) => setSelectedVehicleId(val === '_none' ? '' : val)}
                    >
                      <SelectTrigger className="w-auto h-8 text-xs border-0 bg-neutral-100 dark:bg-neutral-900 rounded-full px-3">
                        <div className="flex items-center gap-1.5">
                          <Car className="h-3.5 w-3.5 text-neutral-400" />
                          <SelectValue placeholder="Véhicule" />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="_none">Aucun véhicule</SelectItem>
                        {vehicles.map(v => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.brand} {v.model} ({v.year})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </header>

            {/* History Panel */}
            <AnimatePresence>
              {showHistory && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 z-40"
                    onClick={() => setShowHistory(false)}
                  />
                  <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="fixed right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white dark:bg-neutral-950 border-l border-neutral-200 dark:border-neutral-800 z-50 flex flex-col"
                  >
                    <div className="p-4 border-b border-neutral-100 dark:border-neutral-900 flex items-center justify-between">
                      <h2 className="font-medium text-neutral-900 dark:text-white">Historique</h2>
                      <button
                        onClick={() => setShowHistory(false)}
                        className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-900"
                      >
                        <X className="h-5 w-5 text-neutral-500" />
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-1">
                      {conversations.length === 0 ? (
                        <p className="text-sm text-neutral-500 text-center py-8">Aucune conversation</p>
                      ) : (
                        conversations.map(conv => (
                          <button
                            key={conv.id}
                            onClick={() => selectConversation(conv)}
                            className={`w-full p-3 rounded-xl text-left transition-colors group ${
                              currentConversation?.id === conv.id
                                ? 'bg-neutral-100 dark:bg-neutral-900'
                                : 'hover:bg-neutral-50 dark:hover:bg-neutral-900/50'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                                  {conv.title || 'Nouvelle conversation'}
                                </p>
                                <p className="text-xs text-neutral-500 mt-0.5">
                                  {formatDate(conv.updated_at)}
                                </p>
                              </div>
                              <button
                                onClick={(e) => deleteConversation(conv.id, e)}
                                className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-950 hover:text-red-600 transition-all"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
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

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-3xl mx-auto px-4 py-6 pb-36 md:pb-32">
                {messages.length === 0 && !loading ? (
                  /* Empty State */
                  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                    {/* Logo */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center mb-6 shadow-lg shadow-orange-500/20"
                    >
                      <span className="text-3xl">🔧</span>
                    </motion.div>

                    <motion.h1
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="text-xl font-semibold text-neutral-900 dark:text-white mb-2"
                    >
                      Salut, c'est Alex !
                    </motion.h1>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="text-neutral-500 text-sm mb-8"
                    >
                      Ton pote mécanicien, dispo 24h/24
                    </motion.p>

                    {/* Quick Actions */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="w-full max-w-md grid grid-cols-2 gap-2"
                    >
                      {QUICK_ACTIONS.map((action, i) => (
                        <button
                          key={i}
                          onClick={() => sendMessage(action.message)}
                          className="p-3 text-left text-sm text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors flex items-center gap-2 group"
                        >
                          <span>{action.icon}</span>
                          <span className="flex-1 truncate">{action.label}</span>
                          <ChevronRight className="h-4 w-4 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                        </button>
                      ))}
                    </motion.div>
                  </div>
                ) : (
                  /* Messages */
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
                      >
                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          msg.sender === 'ai'
                            ? 'bg-gradient-to-br from-orange-400 to-red-500'
                            : 'bg-neutral-200 dark:bg-neutral-800'
                        }`}>
                          {msg.sender === 'ai' ? (
                            <span className="text-sm">🔧</span>
                          ) : (
                            <User className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                          )}
                        </div>

                        {/* Message */}
                        <div className={`max-w-[80%] ${msg.sender === 'user' ? 'text-right' : ''}`}>
                          <div className={`inline-block px-4 py-2.5 rounded-2xl ${
                            msg.sender === 'user'
                              ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                              : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white'
                          }`}>
                            {msg.sender === 'ai' ? (
                              <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1">
                                <ReactMarkdown
                                  components={{
                                    p: ({ children }) => <p className="text-sm">{children}</p>,
                                    ul: ({ children }) => <ul className="list-disc list-inside text-sm my-1">{children}</ul>,
                                    li: ({ children }) => <li className="text-sm">{children}</li>,
                                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                                  }}
                                >
                                  {msg.content}
                                </ReactMarkdown>
                              </div>
                            ) : (
                              <p className="text-sm">{msg.content}</p>
                            )}
                          </div>
                          <p className="text-[10px] text-neutral-400 mt-1 px-1">
                            {formatTime(msg.created_at)}
                          </p>
                        </div>
                      </motion.div>
                    ))}

                    {/* Typing Indicator */}
                    {isTyping && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-3"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                          <span className="text-sm">🔧</span>
                        </div>
                        <div className="px-4 py-3 bg-neutral-100 dark:bg-neutral-900 rounded-2xl">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Error */}
                    {error && (
                      <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl text-sm text-red-600 dark:text-red-400">
                        {error}
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
            </div>

            {/* Input Area - Floating Style */}
            <div className="fixed bottom-0 left-0 right-0 md:left-64 pb-[72px] md:pb-4 px-4 bg-gradient-to-t from-white via-white dark:from-neutral-950 dark:via-neutral-950 to-transparent pt-6 z-40">
              <div className="max-w-3xl mx-auto">
                {/* Input Bar */}
                <div className="relative flex items-end gap-2 p-2 bg-neutral-100 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-lg shadow-neutral-200/50 dark:shadow-neutral-900/50">
                  {/* Textarea */}
                  <textarea
                    ref={textareaRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Message..."
                    disabled={isTyping}
                    rows={1}
                    className="flex-1 bg-transparent border-0 resize-none text-sm text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none focus:ring-0 py-2 px-3 max-h-32"
                    style={{ minHeight: '40px' }}
                  />

                  {/* Send Button */}
                  <Button
                    onClick={() => sendMessage()}
                    disabled={!inputMessage.trim() || isTyping}
                    size="icon"
                    className="h-10 w-10 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-40 flex-shrink-0"
                  >
                    {isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>

        <PaywallModal
          open={showPaywall}
          onOpenChange={setShowPaywall}
          mode="chat"
        />
      </div>
    </PageTransition>
  )
}
