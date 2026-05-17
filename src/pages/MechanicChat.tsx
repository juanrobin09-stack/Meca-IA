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

  // Load vehicles and conversations on mount
  useEffect(() => {
    if (user) {
      loadVehicles()
      loadConversations()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

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
      const response = await fetch('/api/mechanic-chat', {
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

    } catch (err) {
      console.error('Send error:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'envoi du message')
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id))
    } finally {
      setIsTyping(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-950 dark:via-blue-950/20 dark:to-indigo-950/30">
        <Sidebar />

        <main className="md:pl-64 pb-20 md:pb-0">
          <div className="h-screen md:h-[calc(100vh-0px)] flex flex-col">
            {/* Header — glassmorphism */}
            <div className="border-b border-blue-100/60 dark:border-blue-900/40 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-3 sm:p-4 sticky top-0 z-10">
              <div className="container mx-auto max-w-4xl">
                <div className="flex items-center justify-between gap-2 sm:gap-4">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center text-lg sm:text-xl shrink-0 shadow-lg shadow-blue-500/30">
                      🤖
                    </div>
                    <div className="min-w-0">
                      <h1 className="font-bold text-base sm:text-lg flex items-center gap-2 truncate">
                        <span className="truncate bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">MECAI</span>
                        {isPremium && (
                          <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 text-[10px] sm:text-xs shrink-0 shadow-md">
                            ✨ Premium
                          </Badge>
                        )}
                      </h1>
                      <div className="flex items-center gap-1.5 text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse shadow-md shadow-emerald-500/50" />
                        <span className="font-medium">En ligne 24/7</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowConversations(!showConversations)}
                      className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl border-blue-200 dark:border-blue-900 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-400 transition-all"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>

                    <Button
                      onClick={createNewConversation}
                      size="sm"
                      className="h-9 sm:h-10 px-3 sm:px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/20 transition-all"
                    >
                      <Plus className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Nouveau</span>
                    </Button>
                  </div>
                </div>

                {/* Vehicle selector - Full width on mobile */}
                <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2">
                  <Select
                    value={selectedVehicleId || '__none__'}
                    onValueChange={(v) => setSelectedVehicleId(v === '__none__' ? '' : v)}
                  >
                    <SelectTrigger className="w-full sm:w-[220px] h-10 bg-background/80 backdrop-blur-sm border-blue-200 dark:border-blue-900 hover:border-blue-400 dark:hover:border-blue-700 transition-colors">
                      <SelectValue placeholder="Sélectionner véhicule..." />
                    </SelectTrigger>
                    <SelectContent side="bottom" sideOffset={4} avoidCollisions={false}>
                      <SelectItem value="__none__" className="text-muted-foreground italic">
                        Aucun véhicule sélectionné
                      </SelectItem>
                      {vehicles.map(v => (
                        <SelectItem key={v.id} value={v.id}>
                          <div className="flex items-center gap-2">
                            <Car className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">{v.brand} {v.model}</span>
                            <span className="text-muted-foreground text-xs">({v.year})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Messages remaining for free users - daily limit */}
                  {!isPremium && messagesRemaining !== null && (
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      {messagesRemaining > 0 ? (
                        <span className={messagesRemaining <= 3 ? 'text-amber-600 font-medium' : ''}>
                          {messagesRemaining}/10 message{messagesRemaining > 1 ? 's' : ''} restant{messagesRemaining > 1 ? 's' : ''} aujourd'hui
                        </span>
                      ) : (
                        <span className="text-red-600 font-medium">
                          Limite du jour atteinte - Reviens demain ou passe Premium
                        </span>
                      )}
                    </div>
                  )}
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
                        <div className="text-5xl sm:text-6xl mb-4">🔧</div>
                        <h2 className="text-lg sm:text-xl font-bold mb-2">Bienvenue sur le Chat Mécanicien</h2>
                        <p className="text-sm sm:text-base text-muted-foreground mb-6 max-w-xs sm:max-w-none mx-auto">
                          Pose n'importe quelle question sur ta voiture, je suis là 24h/24 !
                        </p>

                        {/* Quick actions - 2x2 grid */}
                        <div className="grid grid-cols-2 gap-2 sm:gap-3 max-w-sm sm:max-w-md mx-auto">
                          {QUICK_ACTIONS.map((action, i) => (
                            <Button
                              key={i}
                              variant="outline"
                              className="h-auto py-3 px-3 sm:px-4 flex flex-col items-center gap-1.5 sm:gap-2 text-left touch-feedback"
                              onClick={() => sendMessage(action.message)}
                            >
                              <action.icon className="h-5 w-5 text-primary" />
                              <span className="text-xs sm:text-sm">{action.label}</span>
                            </Button>
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
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                              msg.sender === 'ai'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}>
                              {msg.sender === 'ai' ? '🤖' : '👤'}
                            </div>

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
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                              🤖
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
