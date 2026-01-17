import { useState, useEffect } from 'react'
import { Bell, Plus, Calendar, Gauge, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import PageTransition from '@/components/PageTransition'
import Sidebar from '@/components/Sidebar'

interface Reminder {
  id: string
  type: string
  due_date: string
  due_mileage?: number
  vehicle?: {
    name: string
    brand: string
    model: string
  }
}

const REMINDER_TYPES = [
  { id: 'vidange', label: 'Vidange', icon: '🛢️' },
  { id: 'ct', label: 'Controle technique', icon: '📋' },
  { id: 'pneus', label: 'Changement pneus', icon: '🔘' },
  { id: 'freins', label: 'Plaquettes freins', icon: '🛑' },
  { id: 'distribution', label: 'Courroie distribution', icon: '⚙️' },
  { id: 'climatisation', label: 'Recharge clim', icon: '❄️' },
  { id: 'batterie', label: 'Batterie', icon: '🔋' },
]

export default function Reminders() {
  const { user } = useAuth()
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [user])

  const fetchData = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('maintenance_reminders')
        .select('*, vehicle:vehicles(*)')
        .eq('user_id', user.id)
        .eq('is_completed', false)
        .order('due_date', { ascending: true })

      if (!error && data) {
        setReminders(data)
      }
    } catch (err) {
      console.error('Error fetching reminders:', err)
    }
    setLoading(false)
  }

  const getUrgency = (dueDate: string) => {
    const days = Math.floor(
      (new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    )
    if (days < 0) return { label: 'En retard', color: 'bg-red-500' }
    if (days <= 7) return { label: 'Urgent', color: 'bg-orange-500' }
    if (days <= 30) return { label: 'Bientot', color: 'bg-yellow-500' }
    return { label: 'OK', color: 'bg-green-500' }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const markCompleted = async (id: string) => {
    try {
      await supabase
        .from('maintenance_reminders')
        .update({ is_completed: true, completed_at: new Date().toISOString() })
        .eq('id', id)
      fetchData()
    } catch (err) {
      console.error('Error marking completed:', err)
    }
  }

  const urgentReminders = reminders.filter((r) => {
    const days = Math.floor(
      (new Date(r.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    )
    return days <= 7
  })

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-6 md:ml-64">
        <PageTransition>
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <Bell className="h-8 w-8 text-blue-600" />
                  Rappels entretien
                </h1>
                <p className="text-muted-foreground mt-1">Ne rate plus jamais un entretien</p>
              </div>

              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un rappel
              </Button>
            </div>

            {/* Rappels urgents */}
            {urgentReminders.length > 0 && (
              <Card className="p-4 mb-6 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800">
                <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                  Entretiens urgents
                </h3>
                <p className="text-sm text-red-600 dark:text-red-300">
                  Tu as des entretiens a faire dans les 7 prochains jours !
                </p>
              </Card>
            )}

            {/* Liste des rappels */}
            <div className="space-y-4">
              {reminders.map((reminder) => {
                const urgency = getUrgency(reminder.due_date)
                const type = REMINDER_TYPES.find((t) => t.id === reminder.type)

                return (
                  <Card key={reminder.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-3xl">{type?.icon || '🔧'}</div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">
                              {type?.label || reminder.type}
                            </h3>
                            <Badge className={urgency.color}>{urgency.label}</Badge>
                          </div>
                          <p className="text-muted-foreground text-sm">
                            {reminder.vehicle?.name} - {reminder.vehicle?.brand}{' '}
                            {reminder.vehicle?.model}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(reminder.due_date)}
                            </span>
                            {reminder.due_mileage && (
                              <span className="flex items-center gap-1">
                                <Gauge className="h-4 w-4" />
                                {reminder.due_mileage.toLocaleString()} km
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <Button variant="outline" size="sm" onClick={() => markCompleted(reminder.id)}>
                        <Check className="h-4 w-4 mr-1" />
                        Fait
                      </Button>
                    </div>
                  </Card>
                )
              })}

              {reminders.length === 0 && !loading && (
                <Card className="p-12 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="font-medium text-lg mb-2">Aucun rappel</h3>
                  <p className="text-muted-foreground mb-4">Configure tes rappels d'entretien</p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un rappel
                  </Button>
                </Card>
              )}
            </div>
          </div>
        </PageTransition>
      </main>
    </div>
  )
}
