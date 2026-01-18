import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import Sidebar from '@/components/Sidebar'
import PageTransition from '@/components/PageTransition'
import PaywallModal from '@/components/PaywallModal'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  Disc,
  Trash2,
  Clock
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
  { icon: Lightbulb, label: 'Voyant moteur', message: 'Pourquoi mon voyant moteur est allumé ?' },
  { icon: Volume2, label: 'Bruit bizarre', message: 'Mon véhicule fait un bruit bizarre au démarrage' },
  { icon: Euro, label: 'Prix vidange', message: 'Combien coûte une vidange pour ma voiture ?' },
  { icon: Disc, label: 'Freins', message: 'Quand dois-je changer mes plaquettes de frein ?' },
]

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

  // Load daily message count for free users
  const loadDailyMessageCount = async () => {
    if (!user || isPremium) {
      setMessagesRemaining(null)
      return
    }

    try {
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)

      const { count } = await supabase
        .from('chat_messages')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('sender', 'user')
        .gte('created_at', startOfDay.toISOString())

      const used = count || 0
      setMessagesRemaining(FREE_MESSAGES_LIMIT - used)
    } catch (err) {
      console.error('Error loading message count:', err)
      setMessagesRemaining(FREE_MESSAGES_LIMIT)
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

      // Update remaining messages
      if (result.messagesRemaining !== null && result.messagesRemaining !== undefined) {
        setMessagesRemaining(result.messagesRemaining)
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
      <div className="min-h-screen bg-muted/40">
        <Sidebar />

        <main className="md:pl-64 pb-20 md:pb-0">
          <div className="h-screen md:h-[calc(100vh-0px)] flex flex-col">
            {/* Header - Modern Premium Design */}
            <div className="border-b bg-gradient-to-r from-background via-background to-primary/5 p-3 sm:p-4">
              <div className="container mx-auto max-w-4xl">
                {/* Mobile: Stacked layout */}
                <div className="flex items-center justify-between gap-2 sm:gap-4">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    {/* Premium Robot Avatar */}
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-primary to-violet-600 rounded-xl sm:rounded-2xl blur-md opacity-60 animate-pulse" />
                      <div className="relative w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 via-primary to-violet-600 flex items-center justify-center shadow-lg">
                        <div className="text-2xl sm:text-3xl">🤖</div>
                        {/* Status indicator */}
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-green-500 rounded-full border-2 border-background">
                          <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75" />
                        </div>
                      </div>
                    </div>

                    <div className="min-w-0">
                      <h1 className="font-bold text-lg sm:text-xl flex items-center gap-2">
                        <span className="bg-gradient-to-r from-primary via-blue-600 to-violet-600 bg-clip-text text-transparent">
                          MECAI
                        </span>
                        {isPremium && (
                          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] sm:text-xs shrink-0 shadow-sm">
                            ✨ Premium
                          </Badge>
                        )}
                      </h1>
                      <div className="flex items-center gap-1.5 text-xs sm:text-sm">
                        <span className="text-green-600 dark:text-green-400 font-medium">En ligne</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">Répond instantanément</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    {/* Conversations toggle */}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowConversations(!showConversations)}
                      className="h-9 w-9 sm:h-10 sm:w-10"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>

                    {/* New chat button */}
                    <Button onClick={createNewConversation} size="sm" className="h-9 sm:h-10 px-2.5 sm:px-4">
                      <Plus className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Nouveau</span>
                    </Button>
                  </div>
                </div>

                {/* Vehicle selector - Full width on mobile */}
                <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2">
                  <Select
                    value={selectedVehicleId || '_none'}
                    onValueChange={(val) => setSelectedVehicleId(val === '_none' ? '' : val)}
                  >
                    <SelectTrigger className="w-full sm:w-[200px] h-10">
                      <SelectValue placeholder="Sélectionner véhicule..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">Aucun véhicule</SelectItem>
                      {vehicles.map(v => (
                        <SelectItem key={v.id} value={v.id}>
                          <div className="flex items-center gap-2">
                            <Car className="h-4 w-4" />
                            {v.brand} {v.model} ({v.year})
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Messages counter */}
                  <div className="flex items-center gap-2">
                    {isPremium ? (
                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                        <MessageSquare className="h-3 w-3 mr-1" />
                        Illimité
                      </Badge>
                    ) : messagesRemaining !== null ? (
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium ${
                        messagesRemaining === 0
                          ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                          : messagesRemaining <= 3
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
                      }`}>
                        <MessageSquare className="h-3.5 w-3.5" />
                        {messagesRemaining > 0 ? (
                          <span>{messagesRemaining}/{FREE_MESSAGES_LIMIT} aujourd'hui</span>
                        ) : (
                          <span>Limite atteinte</span>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            {/* Main content area */}
            <div className="flex-1 flex overflow-hidden">
              {/* Conversations sidebar */}
              <AnimatePresence>
                {showConversations && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 280, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="border-r bg-background overflow-hidden"
                  >
                    <div className="p-4 h-full overflow-y-auto">
                      <h2 className="font-semibold mb-4 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Historique
                      </h2>

                      {conversations.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          Aucune conversation
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {conversations.map(conv => (
                            <motion.div
                              key={conv.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className={`p-3 rounded-lg cursor-pointer transition-colors group ${
                                currentConversation?.id === conv.id
                                  ? 'bg-primary/10 border border-primary'
                                  : 'bg-muted hover:bg-muted/80'
                              }`}
                              onClick={() => selectConversation(conv)}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">
                                    {conv.title || 'Nouvelle conversation'}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatDate(conv.updated_at)}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => deleteConversation(conv.id, e)}
                                >
                                  <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500" />
                                </Button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Messages area */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="container mx-auto max-w-3xl space-y-4">
                    {messages.length === 0 && !loading ? (
                      <div className="text-center py-8 sm:py-12 px-4">
                        {/* Premium Robot Animation */}
                        <div className="relative inline-block mb-6">
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-primary to-violet-600 rounded-3xl blur-xl opacity-40 animate-pulse scale-110" />
                          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-blue-500 via-primary to-violet-600 flex items-center justify-center shadow-2xl mx-auto">
                            <span className="text-4xl sm:text-5xl">🤖</span>
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-3 border-background flex items-center justify-center">
                            <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75" />
                          </div>
                        </div>

                        <h2 className="text-xl sm:text-2xl font-bold mb-2 bg-gradient-to-r from-primary via-blue-600 to-violet-600 bg-clip-text text-transparent">
                          Salut, je suis MECAI !
                        </h2>
                        <p className="text-sm sm:text-base text-muted-foreground mb-8 max-w-sm mx-auto">
                          Ton assistant mécanique IA disponible 24h/24. Pose-moi n'importe quelle question sur ta voiture !
                        </p>

                        {/* Quick actions - 2x2 grid with modern style */}
                        <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-sm sm:max-w-md mx-auto">
                          {QUICK_ACTIONS.map((action, i) => (
                            <motion.button
                              key={i}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="group relative overflow-hidden rounded-xl border bg-card p-4 text-left shadow-sm transition-all hover:shadow-md hover:border-primary/50"
                              onClick={() => sendMessage(action.message)}
                            >
                              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                              <div className="relative flex flex-col items-center gap-2">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                  <action.icon className="h-5 w-5 text-primary" />
                                </div>
                                <span className="text-xs sm:text-sm font-medium">{action.label}</span>
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <>
                        {messages.map((msg, index) => (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
                          >
                            {/* Avatar */}
                            {msg.sender === 'ai' ? (
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 via-primary to-violet-600 flex items-center justify-center shrink-0 shadow-sm">
                                <span className="text-sm">🤖</span>
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                <span className="text-sm">👤</span>
                              </div>
                            )}

                            {/* Message bubble */}
                            <div className={`max-w-[80%] ${msg.sender === 'user' ? 'text-right' : ''}`}>
                              <Card className={`inline-block ${
                                msg.sender === 'user'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}>
                                <CardContent className="p-3">
                                  {msg.sender === 'ai' ? (
                                    <div className="prose prose-sm max-w-none dark:prose-invert">
                                      <ReactMarkdown
                                        components={{
                                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                          ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                                          li: ({ children }) => <li className="mb-1">{children}</li>,
                                          strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                                        }}
                                      >
                                        {msg.content}
                                      </ReactMarkdown>
                                    </div>
                                  ) : (
                                    <p>{msg.content}</p>
                                  )}
                                </CardContent>
                              </Card>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatTime(msg.created_at)}
                              </p>
                            </div>
                          </motion.div>
                        ))}

                        {/* Typing indicator */}
                        {isTyping && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex gap-3"
                          >
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 via-primary to-violet-600 flex items-center justify-center shadow-sm">
                              <span className="text-sm">🤖</span>
                            </div>
                            <Card className="bg-muted">
                              <CardContent className="p-3">
                                <div className="flex gap-1">
                                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        )}

                        <div ref={messagesEndRef} />
                      </>
                    )}
                  </div>
                </div>

                {/* Error message */}
                {error && (
                  <div className="px-4">
                    <div className="container mx-auto max-w-3xl">
                      <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
                        <AlertTriangle className="h-4 w-4" />
                        {error}
                      </div>
                    </div>
                  </div>
                )}

                {/* Input area */}
                <div className="border-t bg-background p-3 sm:p-4 pb-safe">
                  <div className="container mx-auto max-w-3xl">
                    <div className="flex gap-2 sm:gap-3">
                      <Textarea
                        ref={textareaRef}
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Pose ta question..."
                        className="resize-none min-h-[48px] max-h-[120px] sm:max-h-[150px] text-base"
                        rows={1}
                        maxLength={1000}
                        disabled={isTyping}
                      />
                      <Button
                        onClick={() => sendMessage()}
                        disabled={!inputMessage.trim() || isTyping}
                        size="icon"
                        className="h-12 w-12 shrink-0 touch-feedback"
                      >
                        {isTyping ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Send className="h-5 w-5" />
                        )}
                      </Button>
                    </div>

                    {/* Quick actions when there are messages */}
                    {messages.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2 sm:mt-3">
                        {QUICK_ACTIONS.slice(0, 2).map((action, i) => (
                          <Button
                            key={i}
                            variant="ghost"
                            size="sm"
                            className="text-xs h-8 px-2 sm:px-3"
                            onClick={() => sendMessage(action.message)}
                            disabled={isTyping}
                          >
                            <action.icon className="h-3 w-3 mr-1" />
                            {action.label}
                          </Button>
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
