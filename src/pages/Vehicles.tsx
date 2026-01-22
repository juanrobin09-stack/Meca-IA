import { useState, useEffect } from 'react'
import { Plus, Car, Pencil, Trash2, AlertCircle, Camera } from 'lucide-react'
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
import PlateScanner from '@/components/PlateScanner'
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
  'Citroën',
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
const FUEL_TYPES = ['Essence', 'Diesel', 'Électrique', 'Hybride', 'GPL']

// Convertir fuel_type DB (minuscules) vers affichage (majuscules)
const fuelTypeToDisplay = (dbValue: string | undefined): string => {
  if (!dbValue) return 'Essence'
  const map: Record<string, string> = {
    'essence': 'Essence',
    'diesel': 'Diesel',
    'electrique': 'Électrique',
    'hybride': 'Hybride',
    'gpl': 'GPL',
    'autre': 'Essence'
  }
  return map[dbValue.toLowerCase()] || 'Essence'
}

export default function Vehicles() {
  const { user, profile } = useAuth()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [showScanner, setShowScanner] = useState(false)

  // Get tier from user profile subscription status
  const isPremium = profile?.subscription_status === 'premium'
  const tier = isPremium ? 'premium' : 'free'
  const plan = PLANS[tier]
  const maxVehicles = plan.maxVehicles
  const canAddVehicle = vehicles.length < maxVehicles

  const fetchVehicles = async () => {
    if (!user) {
      console.log('[Vehicles] No user, skipping fetch')
      setLoading(false)
      return
    }

    console.log('[Vehicles] Fetching vehicles for user:', user.id)

    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[Vehicles] Error fetching:', error)
      } else {
        console.log('[Vehicles] Fetched', data?.length || 0, 'vehicles:', data)
        setVehicles(data || [])
      }
    } catch (err) {
      console.error('[Vehicles] Exception:', err)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchVehicles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const [saveError, setSaveError] = useState<string | null>(null)

  const handleSaveVehicle = async (vehicleData: Partial<Vehicle>) => {
    if (!user) {
      console.log('[Vehicles] No user, cannot save')
      return
    }
    setSaveError(null)

    console.log('[Vehicles] Saving vehicle:', vehicleData)

    try {
      let error, data
      if (editingVehicle) {
        console.log('[Vehicles] Updating vehicle:', editingVehicle.id)
        const result = await supabase
          .from('vehicles')
          .update(vehicleData)
          .eq('id', editingVehicle.id)
          .select()
        error = result.error
        data = result.data
      } else {
        console.log('[Vehicles] Inserting new vehicle for user:', user.id)
        const result = await supabase
          .from('vehicles')
          .insert({ ...vehicleData, user_id: user.id })
          .select()
        error = result.error
        data = result.data
      }

      console.log('[Vehicles] Save result:', { error, data })

      if (error) {
        console.error('[Vehicles] Supabase error:', error)
        setSaveError(error.message || 'Erreur lors de la sauvegarde')
        return
      }

      console.log('[Vehicles] Vehicle saved successfully:', data)
      await fetchVehicles()
      setShowAddModal(false)
      setEditingVehicle(null)
    } catch (err) {
      console.error('[Vehicles] Exception:', err)
      setSaveError('Erreur inattendue lors de la sauvegarde')
    }
  }

  const handleDeleteVehicle = async (id: string) => {
    if (!confirm('Supprimer ce véhicule ?')) return

    try {
      await supabase.from('vehicles').delete().eq('id', id)
      fetchVehicles()
    } catch (err) {
      console.error('Error deleting vehicle:', err)
    }
  }

  const handleScanComplete = (scannedVehicle: { plate: string; brand: string; model: string; year: string; fuel: string }) => {
    // Save vehicle from scanner - convert fuel to lowercase for DB constraint
    const fuelLower = scannedVehicle.fuel.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    handleSaveVehicle({
      name: `${scannedVehicle.brand} ${scannedVehicle.model}`,
      brand: scannedVehicle.brand,
      model: scannedVehicle.model,
      year: parseInt(scannedVehicle.year) || new Date().getFullYear(),
      fuel_type: fuelLower,
      plate: scannedVehicle.plate,
      mileage: 0,
    })
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-4 md:p-6 md:ml-64 pb-24 md:pb-6">
        <PageTransition>
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                  <Car className="h-7 w-7 md:h-8 md:w-8 text-blue-600" />
                  Mes véhicules
                </h1>
                <p className="text-muted-foreground mt-1">
                  {isPremium
                    ? `${vehicles.length} véhicule${vehicles.length !== 1 ? 's' : ''} • Illimité`
                    : `${vehicles.length}/${maxVehicles} véhicule${maxVehicles !== 1 ? 's' : ''}`
                  }
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowScanner(true)}
                  disabled={!canAddVehicle}
                  className="flex-1 sm:flex-none"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Scanner plaque</span>
                  <span className="sm:hidden">Scanner</span>
                </Button>
                <Button
                  onClick={() => setShowAddModal(true)}
                  disabled={!canAddVehicle}
                  className="flex-1 sm:flex-none"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Ajouter</span>
                  <span className="sm:hidden">Ajouter</span>
                </Button>
              </div>
            </div>

            {!canAddVehicle && (
              <Card className="p-4 mb-6 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-amber-800 dark:text-amber-200">Limite atteinte</p>
                    <p className="text-sm text-amber-600 dark:text-amber-300">
                      {isPremium ? 'Tu as atteint la limite de 5 véhicules.' : 'Passe en Premium pour ajouter plus de véhicules.'}
                    </p>
                  </div>
                  {!isPremium && (
                    <Button size="sm" variant="outline" asChild>
                      <Link to="/pricing">Upgrade</Link>
                    </Button>
                  )}
                </div>
              </Card>
            )}

            {/* Liste des véhicules */}
            <div className="grid gap-4">
              {vehicles.map((vehicle) => (
                <Card key={vehicle.id} className="p-4 md:p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 md:gap-4 min-w-0">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center shrink-0">
                        <Car className="h-5 w-5 md:h-6 md:w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-base md:text-lg truncate">{vehicle.name}</h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {vehicle.brand} {vehicle.model} - {vehicle.year} - {vehicle.fuel_type}
                        </p>
                        {vehicle.plate && (
                          <p className="text-xs md:text-sm text-muted-foreground mt-1">
                            {vehicle.plate} - {vehicle.mileage?.toLocaleString()} km
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-1 md:gap-2 shrink-0">
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
                <Card className="p-8 md:p-12 text-center">
                  <Car className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="font-medium text-lg mb-2">Aucun véhicule</h3>
                  <p className="text-muted-foreground">Utilise les boutons ci-dessus pour ajouter ton premier véhicule</p>
                </Card>
              )}
            </div>

            {/* Modal Ajout/Edit */}
            <VehicleModal
              open={showAddModal}
              onClose={() => {
                setShowAddModal(false)
                setEditingVehicle(null)
                setSaveError(null)
              }}
              onSave={handleSaveVehicle}
              vehicle={editingVehicle}
              error={saveError}
              onOpenScanner={() => {
                setShowAddModal(false)
                setShowScanner(true)
              }}
            />

            {/* Plate Scanner Modal */}
            <PlateScanner
              open={showScanner}
              onOpenChange={setShowScanner}
              onVehicleConfirmed={handleScanComplete}
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
  error,
  onOpenScanner,
}: {
  open: boolean
  onClose: () => void
  onSave: (data: Partial<Vehicle>) => void
  vehicle: Vehicle | null
  error: string | null
  onOpenScanner: () => void
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        name: vehicle.name || '',
        brand: vehicle.brand || '',
        model: vehicle.model || '',
        year: vehicle.year || new Date().getFullYear(),
        fuel_type: fuelTypeToDisplay(vehicle.fuel_type),
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
    // Convertir fuel_type en minuscules pour la DB
    const dataToSave = {
      ...formData,
      fuel_type: formData.fuel_type.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') // 'Électrique' -> 'electrique'
    }
    onSave(dataToSave)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{vehicle ? 'Modifier le véhicule' : 'Ajouter un véhicule'}</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {!vehicle && (
          <Button variant="outline" className="w-full mb-4" onClick={onOpenScanner}>
            <Camera className="h-4 w-4 mr-2" />
            Scanner ma plaque d'immatriculation
          </Button>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nom du véhicule</label>
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
              <label className="block text-sm font-medium mb-1">Modèle</label>
              <Input
                placeholder="208, Clio, C3..."
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Année</label>
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
              <label className="block text-sm font-medium mb-1">Kilométrage</label>
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
