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
import { getEngineOptions, getFuelForEngine, getModel, getModels, getYears, MANUAL_OPTION, UNKNOWN_ENGINE } from '@/data/vehicleCatalog'

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

export default function Vehicles() {
  const { user, profile } = useAuth()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [showScanner, setShowScanner] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get tier from user profile subscription status
  const isPremium = profile?.subscription_status === 'premium'
  const tier = isPremium ? 'premium' : 'free'
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

      if (error) throw error
      if (data) {
        setVehicles(data)
      }
    } catch (err) {
      console.error('Error fetching vehicles:', err)
      setError(err instanceof Error ? err.message : 'Impossible de charger les vehicules.')
    }
    setLoading(false)
  }

  const handleSaveVehicle = async (vehicleData: Partial<Vehicle>) => {
    if (!user) return

    try {
      setError(null)
      if (editingVehicle) {
        const { error } = await supabase.from('vehicles').update(vehicleData).eq('id', editingVehicle.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('vehicles').insert({ ...vehicleData, user_id: user.id })
        if (error) throw error
      }

      fetchVehicles()
      setShowAddModal(false)
      setEditingVehicle(null)
    } catch (err) {
      console.error('Error saving vehicle:', err)
      setError(err instanceof Error ? err.message : 'Impossible d enregistrer le vehicule.')
    }
  }

  const handleDeleteVehicle = async (id: string) => {
    if (!confirm('Supprimer ce véhicule ?')) return

    try {
      setError(null)
      const { error } = await supabase.from('vehicles').delete().eq('id', id)
      if (error) throw error
      fetchVehicles()
    } catch (err) {
      console.error('Error deleting vehicle:', err)
      setError(err instanceof Error ? err.message : 'Impossible de supprimer le vehicule.')
    }
  }

  const handleScanComplete = (scannedVehicle: { plate: string; brand: string; model: string; year: string; fuel: string }) => {
    // Save vehicle from scanner
    handleSaveVehicle({
      name: `${scannedVehicle.brand} ${scannedVehicle.model}`,
      brand: scannedVehicle.brand,
      model: scannedVehicle.model,
      year: parseInt(scannedVehicle.year) || new Date().getFullYear(),
      fuel_type: scannedVehicle.fuel,
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
                  {vehicles.length}/{maxVehicles === Infinity ? 'illimité' : maxVehicles} véhicules
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

            {error && (
              <Card className="p-4 mb-6 bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-800 dark:text-red-200">Erreur</p>
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                  </div>
                </div>
              </Card>
            )}

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
                  <p className="text-muted-foreground mb-4">Ajoute ton premier véhicule pour commencer</p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Button variant="outline" onClick={() => setShowScanner(true)}>
                      <Camera className="h-4 w-4 mr-2" />
                      Scanner ma plaque
                    </Button>
                    <Button onClick={() => setShowAddModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter manuellement
                    </Button>
                  </div>
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
  onOpenScanner,
}: {
  open: boolean
  onClose: () => void
  onSave: (data: Partial<Vehicle>) => void
  vehicle: Vehicle | null
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

  const handleBrandChange = (brand: string) => {
    const firstModel = getModels(brand).find((model) => model !== MANUAL_OPTION) ?? ''
    const firstEngine = getEngineOptions(brand, firstModel).find((engine) => engine !== UNKNOWN_ENGINE && engine !== MANUAL_OPTION) ?? ''
    const firstYear = getYears(brand, firstModel, firstEngine)[0] ?? new Date().getFullYear()
    const fuel = getFuelForEngine(brand, firstModel, firstEngine) ?? formData.fuel_type
    setFormData({
      ...formData,
      brand,
      model: firstModel,
      year: firstYear,
      fuel_type: fuel,
      name: formData.name || `${brand} ${firstModel}`.trim(),
    })
  }

  const handleModelChange = (model: string) => {
    const firstEngine = getEngineOptions(formData.brand, model).find((engine) => engine !== UNKNOWN_ENGINE && engine !== MANUAL_OPTION) ?? ''
    const firstYear = getYears(formData.brand, model, firstEngine)[0] ?? formData.year
    const fuel = getFuelForEngine(formData.brand, model, firstEngine) ?? formData.fuel_type
    setFormData({
      ...formData,
      model,
      year: firstYear,
      fuel_type: fuel,
      name: formData.name || `${formData.brand} ${model}`.trim(),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{vehicle ? 'Modifier le véhicule' : 'Ajouter un véhicule'}</DialogTitle>
        </DialogHeader>

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
                onValueChange={handleBrandChange}
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
              {getModels(formData.brand).length > 0 ? (
                <Select
                  value={formData.model}
                  onValueChange={handleModelChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Modele" />
                  </SelectTrigger>
                  <SelectContent>
                    {getModels(formData.brand).map((model) => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  placeholder="208, Clio, C3..."
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Année</label>
              {getModel(formData.brand, formData.model) ? (
                <Select
                  value={String(formData.year)}
                  onValueChange={(v) => setFormData({ ...formData, year: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getYears(formData.brand, formData.model).map((year) => (
                      <SelectItem key={year} value={String(year)}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type="number"
                  min={1990}
                  max={new Date().getFullYear() + 1}
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                />
              )}
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
