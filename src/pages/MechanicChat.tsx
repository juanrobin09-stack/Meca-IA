import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import Sidebar from '@/components/Sidebar'
import PageTransition from '@/components/PageTransition'
import PaywallModal from '@/components/PaywallModal'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/hooks/useSubscription'
import { supabase } from '@/lib/supabase'
import {
  MessageSquare,
  Send,
  Loader2,
  Plus,
  Car,
  AlertTriangle,
  Lightbulb,
  Volume2,
  Euro,
  Wrench,
  Trash2,
  Clock,
  Sparkles,
  ChevronRight,
  User,
  Bot
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
  { icon: Lightbulb, label: 'Voyant moteur', message: 'Pourquoi mon voyant moteur est allumé ?', emoji: '💡' },
  { icon: Volume2, label: 'Bruit bizarre', message: 'Mon véhicule fait un bruit bizarre au démarrage', emoji: '🔊' },
  { icon: Euro, label: 'Prix vidange', message: 'Combien coûte une vidange pour ma voiture ?', emoji: '💰' },
  { icon: Wrench, label: 'Freins', message: 'Quand dois-je changer mes plaquettes de frein ?', emoji: '🔧' },
]

// Premium animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] } }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

export default function MechanicChat() {
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
  const [showConversations, setShowConversations] = useState(false)

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

  // Load daily message count and purchased credits for free users
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
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px'
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
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .insert({
          user_id: user.id,
          vehicle_id: selectedVehicleId || null,
          title: null
        })
        .select()
        .single()

      if (error) throw error

      setCurrentConversation(data)
      setMessages([])
      setConversations(prev => [data, ...prev])
      setShowConversations(false)
    } catch (err) {
      console.error('Error creating conversation:', err)
    }
  }

  const selectConversation = async (conversation: Conversation) => {
    setCurrentConversation(conversation)
    if (conversation.vehicle_id) {
      setSelectedVehicleId(conversation.vehicle_id)
    }
    await loadMessages(conversation.id)
    setShowConversations(false)
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

    // Optimistic update - add user message immediately
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
          // Remove optimistic message
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

      // Update remaining messages and purchased credits
      if (result.messagesRemaining !== null && result.messagesRemaining !== undefined) {
        setMessagesRemaining(result.messagesRemaining)
      }
      if (result.purchasedCredits !== null && result.purchasedCredits !== undefined) {
        setPurchasedCredits(result.purchasedCredits)
      }

      // Reload conversations to update title/timestamp
      loadConversations()

    } catch (err: any) {
      console.error('Send error:', err)
      setError(err.message || 'Erreur lors de l\'envoi du message')
      // Remove optimistic message on error
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
      <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
        <Sidebar />

        <main className="md:pl-64 pb-20 md:pb-0">
          <div className="h-screen md:h-[calc(100vh-0px)] flex flex-col">
            {/* Premium Minimalist Header */}
            <header className="relative border-b border-neutral-200/60 dark:border-neutral-800/60 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl">
              <div className="px-4 sm:px-6 lg:px-8 py-4">
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center justify-between">
                    {/* Left - Avatar & Info */}
                    <div className="flex items-center gap-4">
                      {/* Premium Avatar */}
                      <div className="relative">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 via-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                          <span className="text-xl">🔧</span>
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-neutral-950" />
                      </div>

                      <div>
                        <h1 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                          Alex
                          {isPremium && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full">
                              <Sparkles className="w-2.5 h-2.5" />
                              PRO
                            </span>
                          )}
                        </h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          Ton mécanicien personnel
                        </p>
                      </div>
                    </div>

                    {/* Right - Actions */}
                    <div className="flex items-center gap-2">
                      {/* History Toggle */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowConversations(!showConversations)}
                        className="h-9 px-3 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors duration-200"
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Historique</span>
                      </Button>

                      {/* New Chat */}
                      <Button
                        onClick={createNewConversation}
                        size="sm"
                        className="h-9 px-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 rounded-xl font-medium transition-all duration-200"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Nouveau
                      </Button>
                    </div>
                  </div>

                  {/* Vehicle Selector & Credits - Subtle Row */}
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Select
                      value={selectedVehicleId || '_none'}
                      onValueChange={(val) => setSelectedVehicleId(val === '_none' ? '' : val)}
                    >
                      <SelectTrigger className="w-auto min-w-[180px] h-9 text-sm border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-xl hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors duration-200">
                        <div className="flex items-center gap-2">
                          <Car className="h-3.5 w-3.5 text-neutral-400" />
                          <SelectValue placeholder="Mon véhicule" />
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

                    {/* Credits Display - Minimal */}
                    {!isPremium && messagesRemaining !== null && (
                      <div className="flex items-center gap-2">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg ${
                          messagesRemaining === 0 && purchasedCredits === 0
                            ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400'
                            : messagesRemaining <= 3 && purchasedCredits === 0
                              ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400'
                              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                        }`}>
                          <MessageSquare className="h-3 w-3" />
                          {messagesRemaining > 0 ? (
                            <span>{messagesRemaining} restants</span>
                          ) : purchasedCredits > 0 ? (
                            <span>0 gratuit</span>
                          ) : (
                            <span>Limite atteinte</span>
                          )}
                        </div>
                        {purchasedCredits > 0 && (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
                            +{purchasedCredits} crédit{purchasedCredits > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
              {/* Conversations Sidebar - Premium Slide */}
              <AnimatePresence>
                {showConversations && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 320, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="border-r border-neutral-200/60 dark:border-neutral-800/60 bg-white dark:bg-neutral-950 overflow-hidden"
                  >
                    <div className="p-4 h-full overflow-y-auto">
                      <h2 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4 px-2">
                        Conversations
                      </h2>

                      {conversations.length === 0 ? (
                        <div className="text-center py-16">
                          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                            <MessageSquare className="h-5 w-5 text-neutral-400" />
                          </div>
                          <p className="text-sm text-neutral-500">
                            Aucune conversation
                          </p>
                        </div>
                      ) : (
                        <motion.div
                          variants={staggerContainer}
                          initial="hidden"
                          animate="visible"
                          className="space-y-1"
                        >
                          {conversations.map(conv => (
                            <motion.button
                              key={conv.id}
                              variants={fadeInUp}
                              className={`w-full p-3 rounded-xl text-left transition-all duration-200 group ${
                                currentConversation?.id === conv.id
                                  ? 'bg-neutral-100 dark:bg-neutral-800'
                                  : 'hover:bg-neutral-50 dark:hover:bg-neutral-900'
                              }`}
                              onClick={() => selectConversation(conv)}
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
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 dark:hover:bg-red-950 hover:text-red-600 rounded-lg"
                                  onClick={(e) => deleteConversation(conv.id, e)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </motion.button>
                          ))}
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Messages Area */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto">
                  <div className="max-w-3xl mx-auto px-4 py-8">
                    {messages.length === 0 && !loading ? (
                      /* Empty State - Premium Hero */
                      <motion.div
                        className="text-center py-16"
                        initial="hidden"
                        animate="visible"
                        variants={staggerContainer}
                      >
                        {/* Avatar */}
                        <motion.div variants={fadeInUp} className="mb-8">
                          <div className="relative inline-block">
                            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-400 via-orange-500 to-red-500 flex items-center justify-center shadow-2xl shadow-orange-500/30">
                              <span className="text-4xl">🔧</span>
                            </div>
                            <motion.div
                              className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-[#fafafa] dark:border-[#0a0a0a] flex items-center justify-center"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.5, type: 'spring' }}
                            >
                              <span className="text-white text-[10px]">✓</span>
                            </motion.div>
                          </div>
                        </motion.div>

                        {/* Text */}
                        <motion.div variants={fadeInUp}>
                          <h2 className="text-2xl sm:text-3xl font-semibold text-neutral-900 dark:text-white mb-2">
                            Salut, c'est Alex ! 👋
                          </h2>
                          <p className="text-neutral-500 dark:text-neutral-400 text-lg max-w-md mx-auto">
                            Ton pote mécanicien, dispo 24h/24.
                          </p>
                        </motion.div>

                        {/* Quick Actions - Premium Grid */}
                        <motion.div
                          variants={fadeInUp}
                          className="mt-12 grid grid-cols-2 gap-3 max-w-md mx-auto"
                        >
                          {QUICK_ACTIONS.map((action, i) => (
                            <motion.button
                              key={i}
                              whileHover={{ scale: 1.02, y: -2 }}
                              whileTap={{ scale: 0.98 }}
                              className="group relative p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 text-left hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-lg hover:shadow-neutral-200/50 dark:hover:shadow-neutral-900/50 transition-all duration-300"
                              onClick={() => sendMessage(action.message)}
                            >
                              <span className="text-2xl mb-2 block">{action.emoji}</span>
                              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                {action.label}
                              </span>
                              <ChevronRight className="absolute bottom-4 right-4 h-4 w-4 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </motion.button>
                          ))}
                        </motion.div>

                        {/* Features */}
                        <motion.div
                          variants={fadeInUp}
                          className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-neutral-500"
                        >
                          {[
                            { label: 'Réponses instantanées', color: 'bg-emerald-500' },
                            { label: 'Conseils personnalisés', color: 'bg-blue-500' },
                            { label: 'Disponible 24/7', color: 'bg-purple-500' },
                          ].map((feature, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full ${feature.color}`} />
                              <span>{feature.label}</span>
                            </div>
                          ))}
                        </motion.div>
                      </motion.div>
                    ) : (
                      /* Messages List - Premium Bubbles */
                      <div className="space-y-6">
                        {messages.map((msg, index) => (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.02 }}
                            className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
                          >
                            {/* Avatar */}
                            <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${
                              msg.sender === 'ai'
                                ? 'bg-gradient-to-br from-orange-400 to-red-500'
                                : 'bg-neutral-200 dark:bg-neutral-800'
                            }`}>
                              {msg.sender === 'ai' ? (
                                <Bot className="h-4 w-4 text-white" />
                              ) : (
                                <User className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                              )}
                            </div>

                            {/* Message */}
                            <div className={`max-w-[75%] ${msg.sender === 'user' ? 'text-right' : ''}`}>
                              <div className={`inline-block px-4 py-3 rounded-2xl ${
                                msg.sender === 'user'
                                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                                  : 'bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60'
                              }`}>
                                {msg.sender === 'ai' ? (
                                  <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-li:my-0.5">
                                    <ReactMarkdown
                                      components={{
                                        p: ({ children }) => <p className="text-neutral-700 dark:text-neutral-300">{children}</p>,
                                        ul: ({ children }) => <ul className="list-disc list-inside">{children}</ul>,
                                        li: ({ children }) => <li className="text-neutral-700 dark:text-neutral-300">{children}</li>,
                                        strong: ({ children }) => <strong className="font-semibold text-neutral-900 dark:text-white">{children}</strong>,
                                      }}
                                    >
                                      {msg.content}
                                    </ReactMarkdown>
                                  </div>
                                ) : (
                                  <p className="text-sm">{msg.content}</p>
                                )}
                              </div>
                              <p className="text-[11px] text-neutral-400 mt-1.5 px-1">
                                {formatTime(msg.created_at)}
                              </p>
                            </div>
                          </motion.div>
                        ))}

                        {/* Typing Indicator - Minimal */}
                        {isTyping && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex gap-3"
                          >
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                              <Bot className="h-4 w-4 text-white" />
                            </div>
                            <div className="px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl">
                              <div className="flex gap-1">
                                <span className="w-2 h-2 rounded-full bg-neutral-300 dark:bg-neutral-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-2 h-2 rounded-full bg-neutral-300 dark:bg-neutral-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-2 h-2 rounded-full bg-neutral-300 dark:bg-neutral-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                              </div>
                            </div>
                          </motion.div>
                        )}

                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="px-4">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="max-w-3xl mx-auto p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl flex items-center gap-3 text-sm text-red-700 dark:text-red-400"
                    >
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      {error}
                    </motion.div>
                  </div>
                )}

                {/* Input Area - Premium Minimal */}
                <div className="border-t border-neutral-200/60 dark:border-neutral-800/60 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl p-4 pb-safe">
                  <div className="max-w-3xl mx-auto">
                    <div className="flex gap-3 items-end">
                      <div className="flex-1 relative">
                        <Textarea
                          ref={textareaRef}
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                          onKeyDown={handleKeyPress}
                          placeholder="Écris à Alex..."
                          className="resize-none min-h-[48px] max-h-[150px] text-sm border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 rounded-xl focus:border-neutral-300 dark:focus:border-neutral-700 focus:ring-0 transition-colors duration-200"
                          rows={1}
                          maxLength={1000}
                          disabled={isTyping}
                        />
                      </div>
                      <Button
                        onClick={() => sendMessage()}
                        disabled={!inputMessage.trim() || isTyping}
                        size="icon"
                        className="h-12 w-12 shrink-0 rounded-xl bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-100 text-white dark:text-neutral-900 disabled:opacity-40 transition-all duration-200"
                      >
                        {isTyping ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Send className="h-5 w-5" />
                        )}
                      </Button>
                    </div>

                    {/* Quick Actions Pills - When messages exist */}
                    {messages.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {QUICK_ACTIONS.slice(0, 3).map((action, i) => (
                          <button
                            key={i}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors duration-200 disabled:opacity-50"
                            onClick={() => sendMessage(action.message)}
                            disabled={isTyping}
                          >
                            <span>{action.emoji}</span>
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
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
