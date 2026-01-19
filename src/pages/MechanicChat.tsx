import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import Sidebar from '@/components/Sidebar'
import Logo from '@/components/Logo'
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
  Wrench,
  Trash2,
  Clock,
  Sparkles,
  Zap,
  History
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
  { icon: Lightbulb, label: 'Voyant moteur', message: 'Pourquoi mon voyant moteur est allumé ?', color: 'from-amber-500 to-orange-500' },
  { icon: Volume2, label: 'Bruit bizarre', message: 'Mon véhicule fait un bruit bizarre au démarrage', color: 'from-blue-500 to-cyan-500' },
  { icon: Euro, label: 'Prix vidange', message: 'Combien coûte une vidange pour ma voiture ?', color: 'from-green-500 to-emerald-500' },
  { icon: Wrench, label: 'Freins', message: 'Quand dois-je changer mes plaquettes de frein ?', color: 'from-violet-500 to-purple-500' },
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

      // Get message count and purchased credits in parallel
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50/20 dark:from-gray-950 dark:via-blue-950/20 dark:to-violet-950/10">
        <Sidebar />

        <main className="md:pl-64 pb-20 md:pb-0">
          <div className="h-screen md:h-[calc(100vh-0px)] flex flex-col">
            {/* Header - Ultra Modern Glass Design */}
            <div className="relative overflow-hidden">
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-indigo-600/5 to-violet-600/5" />
              <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-violet-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

              <div className="relative border-b backdrop-blur-xl bg-background/80 p-4 sm:p-5">
                <div className="container mx-auto max-w-4xl">
                  <div className="flex items-center justify-between gap-4">
                    {/* Bot Avatar & Info */}
                    <div className="flex items-center gap-4">
                      {/* Animated Avatar */}
                      <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
                        <div className="relative">
                          <Logo size="lg" showText={false} />
                        </div>
                        {/* Online indicator */}
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-background shadow-lg">
                          <span className="absolute inset-0.5 rounded-full bg-emerald-400 animate-ping opacity-75" />
                        </div>
                      </div>

                      <div>
                        <h1 className="font-bold text-xl sm:text-2xl flex items-center gap-2 flex-wrap">
                          <span className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent">
                            Alex, ton mécanicien
                          </span>
                          {isPremium && (
                            <Badge variant="premium" className="text-xs">
                              ✨ Premium
                            </Badge>
                          )}
                        </h1>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">En ligne</span>
                          </span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Zap className="h-3.5 w-3.5" />
                            Ton pote mécanicien 24/7
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowConversations(!showConversations)}
                        className="h-10 w-10 rounded-xl border-2 hover:border-primary/50 hover:bg-primary/5 transition-all"
                      >
                        <History className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={createNewConversation}
                        className="h-10 px-4 rounded-xl bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:from-orange-600 hover:via-red-600 hover:to-pink-600 shadow-lg shadow-orange-500/25 transition-all hover:shadow-orange-500/40"
                      >
                        <Plus className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline font-medium">Nouveau</span>
                      </Button>
                    </div>
                  </div>

                  {/* Vehicle & Credits Row */}
                  <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <Select
                      value={selectedVehicleId || '_none'}
                      onValueChange={(val) => setSelectedVehicleId(val === '_none' ? '' : val)}
                    >
                      <SelectTrigger className="w-full sm:w-[220px] h-11 rounded-xl border-2 hover:border-primary/50 transition-colors">
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-muted-foreground" />
                          <SelectValue placeholder="Sélectionner véhicule..." />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_none">Aucun véhicule</SelectItem>
                        {vehicles.map(v => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.brand} {v.model} ({v.year})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Credits Badge */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {isPremium ? (
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-violet-500/10 border border-indigo-500/20">
                          <Sparkles className="h-4 w-4 text-indigo-500" />
                          <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                            Illimité
                          </span>
                        </div>
                      ) : messagesRemaining !== null ? (
                        <>
                          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${
                            messagesRemaining === 0 && purchasedCredits === 0
                              ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400 border border-red-200 dark:border-red-800'
                              : messagesRemaining <= 3 && purchasedCredits === 0
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                          }`}>
                            <MessageSquare className="h-4 w-4" />
                            {messagesRemaining > 0 ? (
                              <span>{messagesRemaining}/{FREE_MESSAGES_LIMIT} gratuits</span>
                            ) : purchasedCredits > 0 ? (
                              <span>0 gratuit</span>
                            ) : (
                              <span>Limite atteinte</span>
                            )}
                          </div>
                          {purchasedCredits > 0 && (
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                              <span>+{purchasedCredits} crédit{purchasedCredits > 1 ? 's' : ''}</span>
                            </div>
                          )}
                        </>
                      ) : null}
                    </div>
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
                    animate={{ width: 300, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="border-r bg-background/80 backdrop-blur-xl overflow-hidden"
                  >
                    <div className="p-4 h-full overflow-y-auto">
                      <h2 className="font-semibold mb-4 flex items-center gap-2 text-lg">
                        <Clock className="h-5 w-5 text-indigo-500" />
                        Historique
                      </h2>

                      {conversations.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
                            <MessageSquare className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Aucune conversation
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {conversations.map(conv => (
                            <motion.div
                              key={conv.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              whileHover={{ scale: 1.02 }}
                              className={`p-4 rounded-xl cursor-pointer transition-all group ${
                                currentConversation?.id === conv.id
                                  ? 'bg-gradient-to-r from-blue-500/10 to-violet-500/10 border-2 border-indigo-500/30 shadow-sm'
                                  : 'bg-muted/50 hover:bg-muted border-2 border-transparent'
                              }`}
                              onClick={() => selectConversation(conv)}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">
                                    {conv.title || 'Nouvelle conversation'}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {formatDate(conv.updated_at)}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950"
                                  onClick={(e) => deleteConversation(conv.id, e)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
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
                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                  <div className="container mx-auto max-w-3xl space-y-6">
                    {messages.length === 0 && !loading ? (
                      <div className="text-center py-8 sm:py-16 px-4">
                        {/* Hero Logo */}
                        <motion.div
                          className="relative inline-block mb-8"
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: 'spring', duration: 0.8 }}
                        >
                          <div className="absolute -inset-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 rounded-full blur-2xl opacity-20 animate-pulse" />
                          <div className="relative mx-auto">
                            <Logo size="lg" showText={false} className="w-24 h-24 sm:w-28 sm:h-28 [&_svg]:w-full [&_svg]:h-full" />
                          </div>
                          <div className="absolute -bottom-1 right-0 w-7 h-7 bg-emerald-500 rounded-full border-3 border-background shadow-lg flex items-center justify-center">
                            <span className="absolute inset-1 rounded-full bg-emerald-400 animate-ping opacity-75" />
                            <span className="relative w-2.5 h-2.5 rounded-full bg-emerald-300" />
                          </div>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                            <span className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent">
                              Salut, c'est Alex ! 🔧
                            </span>
                          </h2>
                          <p className="text-base sm:text-lg text-muted-foreground mb-10 max-w-md mx-auto">
                            Ton pote mécanicien, dispo 24h/24.
                            <br />
                            <span className="text-sm">Pose-moi n'importe quelle question sur ta caisse !</span>
                          </p>
                        </motion.div>

                        {/* Quick actions - Modern Cards */}
                        <motion.div
                          className="grid grid-cols-2 gap-4 max-w-lg mx-auto"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                        >
                          {QUICK_ACTIONS.map((action, i) => (
                            <motion.button
                              key={i}
                              whileHover={{ scale: 1.03, y: -2 }}
                              whileTap={{ scale: 0.98 }}
                              className="group relative overflow-hidden rounded-2xl border-2 border-transparent bg-card p-5 text-left shadow-lg hover:shadow-xl transition-all hover:border-orange-500/30"
                              onClick={() => sendMessage(action.message)}
                            >
                              {/* Gradient overlay on hover */}
                              <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-5 transition-opacity`} />

                              <div className="relative flex flex-col items-center gap-3">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                                  <action.icon className="h-6 w-6 text-white" />
                                </div>
                                <span className="text-sm font-semibold">{action.label}</span>
                              </div>
                            </motion.button>
                          ))}
                        </motion.div>
                      </div>
                    ) : (
                      <>
                        {messages.map((msg, index) => (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className={`flex gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
                          >
                            {/* Avatar */}
                            {msg.sender === 'ai' ? (
                              <div className="relative shrink-0">
                                <Logo size="sm" showText={false} className="w-10 h-10 [&_svg]:w-10 [&_svg]:h-10" />
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center shrink-0 shadow-sm">
                                <span className="text-lg">👤</span>
                              </div>
                            )}

                            {/* Message bubble */}
                            <div className={`max-w-[80%] ${msg.sender === 'user' ? 'text-right' : ''}`}>
                              <Card className={`inline-block shadow-md ${
                                msg.sender === 'user'
                                  ? 'bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 text-white border-0'
                                  : 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-2 border-orange-200/50 dark:border-orange-800/50'
                              }`}>
                                <CardContent className="p-4">
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
                                    <p className="text-white">{msg.content}</p>
                                  )}
                                </CardContent>
                              </Card>
                              <p className="text-xs text-muted-foreground mt-2 px-1">
                                {formatTime(msg.created_at)}
                              </p>
                            </div>
                          </motion.div>
                        ))}

                        {/* Typing indicator */}
                        {isTyping && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex gap-4"
                          >
                            <Logo size="sm" showText={false} className="w-10 h-10 [&_svg]:w-10 [&_svg]:h-10 shrink-0" />
                            <Card className="bg-card border-2 shadow-md">
                              <CardContent className="p-4">
                                <div className="flex gap-1.5">
                                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '300ms' }} />
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
                  <div className="px-4 sm:px-6">
                    <div className="container mx-auto max-w-3xl">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-red-50 dark:bg-red-950/50 border-2 border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 text-sm text-red-700 dark:text-red-300"
                      >
                        <AlertTriangle className="h-5 w-5 shrink-0" />
                        {error}
                      </motion.div>
                    </div>
                  </div>
                )}

                {/* Input area - Modern Floating Design */}
                <div className="border-t bg-background/80 backdrop-blur-xl p-4 sm:p-5 pb-safe">
                  <div className="container mx-auto max-w-3xl">
                    <div className="flex gap-3">
                      <div className="flex-1 relative">
                        <Textarea
                          ref={textareaRef}
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                          onKeyDown={handleKeyPress}
                          placeholder="Parle à Alex... 💬"
                          className="resize-none min-h-[52px] max-h-[150px] text-base rounded-2xl border-2 pr-4 focus:border-orange-500 transition-colors"
                          rows={1}
                          maxLength={1000}
                          disabled={isTyping}
                        />
                      </div>
                      <Button
                        onClick={() => sendMessage()}
                        disabled={!inputMessage.trim() || isTyping}
                        size="icon"
                        className="h-[52px] w-[52px] shrink-0 rounded-2xl bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:from-orange-600 hover:via-red-600 hover:to-pink-600 shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all"
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
                        {QUICK_ACTIONS.slice(0, 3).map((action, i) => (
                          <Button
                            key={i}
                            variant="outline"
                            size="sm"
                            className="text-xs h-9 px-3 rounded-xl border-2 hover:border-orange-500/50 hover:bg-orange-500/5 transition-all"
                            onClick={() => sendMessage(action.message)}
                            disabled={isTyping}
                          >
                            <action.icon className="h-3.5 w-3.5 mr-1.5" />
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
