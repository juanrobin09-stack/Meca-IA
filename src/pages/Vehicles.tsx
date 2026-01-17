import { useState, useEffect } from 'react'
import { Plus, Car, Pencil, Trash2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { PLANS } from '@/config/plans'
import PageTransition from '@/components/PageTransition'
import Sidebar from '@/components/Sidebar'
import { Link } from 'react-router-dom'

interface Vehicle {
  id: string
  name: string
  brand: string
  model: string
  year: number
  fuel_type: string
  mileage: number
  plate: string
}

const BRANDS = [
  'Peugeot',
  'Renault',
  'Citroen',
  'Dacia',
  'Volkswagen',
  'Toyota',
  'Ford',
  'Opel',
  'BMW',
  'Mercedes',
  'Audi',
  'Fiat',
  'Nissan',
  'Hyundai',
  'Kia',
]
const FUEL_TYPES = ['Essence', 'Diesel', 'Electrique', 'Hybride', 'GPL']

export default function Vehicles() {
  const { user } = useAuth()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)

  // For demo, assume premium tier - in real app, get from user profile
  const tier = 'premium' as const
  const plan = PLANS[tier]
  const maxVehicles = plan.maxVehicles
  const canAddVehicle = vehicles.length < maxVehicles

  useEffect(() => {
    fetchVehicles()
  }, [user])

  const fetchVehicles = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setVehicles(data)
      }
    } catch (err) {
      console.error('Error fetching vehicles:', err)
    }
    setLoading(false)
  }

  const handleSaveVehicle = async (vehicleData: Partial<Vehicle>) => {
    if (!user) return

    try {
      if (editingVehicle) {
        await supabase.from('vehicles').update(vehicleData).eq('id', editingVehicle.id)
      } else {
        await supabase.from('vehicles').insert({ ...vehicleData, user_id: user.id })
      }

      fetchVehicles()
      setShowAddModal(false)
      setEditingVehicle(null)
    } catch (err) {
      console.error('Error saving vehicle:', err)
    }
  }

  const handleDeleteVehicle = async (id: string) => {
    if (!confirm('Supprimer ce vehicule ?')) return

    try {
      await supabase.from('vehicles').delete().eq('id', id)
      fetchVehicles()
    } catch (err) {
      console.error('Error deleting vehicle:', err)
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-6 md:ml-64">
        <PageTransition>
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <Car className="h-8 w-8 text-blue-600" />
                  Mes vehicules
                </h1>
                <p className="text-muted-foreground mt-1">
                  {vehicles.length}/{maxVehicles === Infinity ? 'illimite' : maxVehicles} vehicules
                </p>
              </div>

              <Button onClick={() => setShowAddModal(true)} disabled={!canAddVehicle}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un vehicule
              </Button>
            </div>

            {!canAddVehicle && (
              <Card className="p-4 mb-6 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="font-medium text-amber-800 dark:text-amber-200">Limite atteinte</p>
                    <p className="text-sm text-amber-600 dark:text-amber-300">
                      Passe en {tier === 'premium' ? 'Pro' : 'Premium'} pour ajouter plus de vehicules.
                    </p>
                  </div>
                  <Button size="sm" variant="outline" className="ml-auto" asChild>
                    <Link to="/pricing">Upgrade</Link>
                  </Button>
                </div>
              </Card>
            )}

            {/* Liste des vehicules */}
            <div className="grid gap-4">
              {vehicles.map((vehicle) => (
                <Card key={vehicle.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <Car className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{vehicle.name}</h3>
                        <p className="text-muted-foreground">
                          {vehicle.brand} {vehicle.model} - {vehicle.year} - {vehicle.fuel_type}
                        </p>
                        {vehicle.plate && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {vehicle.plate} - {vehicle.mileage?.toLocaleString()} km
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingVehicle(vehicle)
                          setShowAddModal(true)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteVehicle(vehicle.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}

              {vehicles.length === 0 && !loading && (
                <Card className="p-12 text-center">
                  <Car className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="font-medium text-lg mb-2">Aucun vehicule</h3>
                  <p className="text-muted-foreground mb-4">Ajoute ton premier vehicule pour commencer</p>
                  <Button onClick={() => setShowAddModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un vehicule
                  </Button>
                </Card>
              )}
            </div>

            {/* Modal Ajout/Edit */}
            <VehicleModal
              open={showAddModal}
              onClose={() => {
                setShowAddModal(false)
                setEditingVehicle(null)
              }}
              onSave={handleSaveVehicle}
              vehicle={editingVehicle}
            />
          </div>
        </PageTransition>
      </main>
    </div>
  )
}

function VehicleModal({
  open,
  onClose,
  onSave,
  vehicle,
}: {
  open: boolean
  onClose: () => void
  onSave: (data: Partial<Vehicle>) => void
  vehicle: Vehicle | null
}) {
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    fuel_type: 'Essence',
    mileage: 0,
    plate: '',
  })

  useEffect(() => {
    if (vehicle) {
      setFormData({
        name: vehicle.name || '',
        brand: vehicle.brand || '',
        model: vehicle.model || '',
        year: vehicle.year || new Date().getFullYear(),
        fuel_type: vehicle.fuel_type || 'Essence',
        mileage: vehicle.mileage || 0,
        plate: vehicle.plate || '',
      })
    } else {
      setFormData({
        name: '',
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        fuel_type: 'Essence',
        mileage: 0,
        plate: '',
      })
    }
  }, [vehicle, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{vehicle ? 'Modifier le vehicule' : 'Ajouter un vehicule'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nom du vehicule</label>
            <Input
              placeholder="Ex: Ma 208, Voiture de Marie..."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Marque</label>
              <Select
                value={formData.brand}
                onValueChange={(v) => setFormData({ ...formData, brand: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Marque" />
                </SelectTrigger>
                <SelectContent>
                  {BRANDS.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Modele</label>
              <Input
                placeholder="208, Clio, C3..."
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Annee</label>
              <Input
                type="number"
                min={1990}
                max={new Date().getFullYear() + 1}
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Carburant</label>
              <Select
                value={formData.fuel_type}
                onValueChange={(v) => setFormData({ ...formData, fuel_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FUEL_TYPES.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Kilometrage</label>
              <Input
                type="number"
                placeholder="80000"
                value={formData.mileage}
                onChange={(e) =>
                  setFormData({ ...formData, mileage: parseInt(e.target.value) || 0 })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Plaque (optionnel)</label>
              <Input
                placeholder="AB-123-CD"
                value={formData.plate}
                onChange={(e) =>
                  setFormData({ ...formData, plate: e.target.value.toUpperCase() })
                }
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Annuler
            </Button>
            <Button type="submit" className="flex-1">
              {vehicle ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
