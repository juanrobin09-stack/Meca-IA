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
            {/* Header */}
            <div className="border-b bg-background p-4">
              <div className="container mx-auto max-w-4xl">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-xl">
                      🤖
                    </div>
                    <div>
                      <h1 className="font-bold text-lg flex items-center gap-2">
                        MecaIA Assistant
                        {isPremium && (
                          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-xs">
                            Premium
                          </Badge>
                        )}
                      </h1>
                      <div className="flex items-center gap-1 text-sm text-green-600">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        En ligne 24/7
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Vehicle selector */}
                    <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Sélectionner véhicule..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Aucun véhicule</SelectItem>
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

                    {/* Conversations toggle */}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowConversations(!showConversations)}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>

                    {/* New chat button */}
                    <Button onClick={createNewConversation}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nouveau
                    </Button>
                  </div>
                </div>

                {/* Messages remaining for free users */}
                {!isPremium && messagesRemaining !== null && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    {messagesRemaining > 0 ? (
                      <span className={messagesRemaining <= 3 ? 'text-amber-600' : ''}>
                        {messagesRemaining} message{messagesRemaining > 1 ? 's' : ''} gratuit{messagesRemaining > 1 ? 's' : ''} restant{messagesRemaining > 1 ? 's' : ''} ce mois
                      </span>
                    ) : (
                      <span className="text-red-600">
                        Limite atteinte - Passez Premium pour continuer
                      </span>
                    )}
                  </div>
                )}
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
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4">🔧</div>
                        <h2 className="text-xl font-bold mb-2">Bienvenue sur le Chat Mécanicien</h2>
                        <p className="text-muted-foreground mb-6">
                          Pose n'importe quelle question sur ta voiture, je suis là 24h/24 !
                        </p>

                        {/* Quick actions */}
                        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                          {QUICK_ACTIONS.map((action, i) => (
                            <Button
                              key={i}
                              variant="outline"
                              className="h-auto py-3 px-4 flex flex-col items-center gap-2"
                              onClick={() => sendMessage(action.message)}
                            >
                              <action.icon className="h-5 w-5 text-primary" />
                              <span className="text-sm">{action.label}</span>
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
                <div className="border-t bg-background p-4">
                  <div className="container mx-auto max-w-3xl">
                    <div className="flex gap-3">
                      <Textarea
                        ref={textareaRef}
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Posez votre question automobile..."
                        className="resize-none min-h-[44px] max-h-[150px]"
                        rows={1}
                        maxLength={1000}
                        disabled={isTyping}
                      />
                      <Button
                        onClick={() => sendMessage()}
                        disabled={!inputMessage.trim() || isTyping}
                        size="icon"
                        className="h-11 w-11 shrink-0"
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
                      <div className="flex flex-wrap gap-2 mt-3">
                        {QUICK_ACTIONS.slice(0, 2).map((action, i) => (
                          <Button
                            key={i}
                            variant="ghost"
                            size="sm"
                            className="text-xs"
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
