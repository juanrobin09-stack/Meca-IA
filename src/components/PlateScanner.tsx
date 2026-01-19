import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Camera, Loader2, Car, CheckCircle2 } from 'lucide-react'
import { compressImage, validateImageFile } from '@/utils/imageCompression'

interface VehicleInfo {
  plate: string
  brand: string
  model: string
  year: string
  fuel: string
}

interface PlateScannerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onVehicleConfirmed: (vehicle: VehicleInfo) => void
}

const BRANDS = ['Peugeot', 'Renault', 'Citroën', 'Dacia', 'Volkswagen', 'Toyota', 'Ford', 'Opel', 'Fiat', 'BMW', 'Mercedes', 'Audi', 'Nissan', 'Hyundai', 'Kia', 'Autre']
const FUELS = ['Essence', 'Diesel', 'Hybride', 'Électrique', 'GPL']

// Normaliser la marque pour correspondre à notre liste
function normalizeBrand(brand: string | null): string {
  if (!brand) return 'Autre'
  const normalized = brand.trim()
  // Chercher une correspondance dans BRANDS (insensible à la casse)
  const found = BRANDS.find(b => b.toLowerCase() === normalized.toLowerCase())
  return found || 'Autre'
}

// Normaliser le carburant
function normalizeFuel(fuel: string | null): string {
  if (!fuel) return 'Essence'
  const lower = fuel.toLowerCase()
  if (lower.includes('diesel')) return 'Diesel'
  if (lower.includes('electri')) return 'Électrique'
  if (lower.includes('hybrid')) return 'Hybride'
  if (lower.includes('gpl')) return 'GPL'
  return 'Essence'
}

export default function PlateScanner({ open, onOpenChange, onVehicleConfirmed }: PlateScannerProps) {
  const [step, setStep] = useState<'upload' | 'confirm'>('upload')
  const [isScanning, setIsScanning] = useState(false)
  const [plateNumber, setPlateNumber] = useState('')
  const [vehicle, setVehicle] = useState<VehicleInfo>({
    plate: '',
    brand: 'Peugeot',
    model: '',
    year: new Date().getFullYear().toString(),
    fuel: 'Essence',
  })
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (fileInputRef.current) fileInputRef.current.value = ''
    setError(null)

    const validation = validateImageFile(file)
    if (!validation.valid) {
      setError(validation.error || 'Fichier invalide')
      return
    }

    setIsScanning(true)

    try {
      const compressed = await compressImage(file)

      // Call secure Netlify function (API key is server-side only)
      const response = await fetch('/.netlify/functions/scan-plate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: compressed.base64,
          mediaType: 'image/jpeg',
        }),
      })

      if (!response.ok) throw new Error('API error')

      const data = await response.json()
      const extractedPlate = data.plate

      if (!extractedPlate || extractedPlate === 'NON_DETECTE' || extractedPlate.length < 5) {
        setError("Plaque non détectée. Réessaie avec une photo plus nette.")
        return
      }

      setPlateNumber(extractedPlate)

      // Pré-remplir toutes les infos détectées
      setVehicle({
        plate: extractedPlate,
        brand: normalizeBrand(data.brand),
        model: data.model || '',
        year: data.year?.toString() || new Date().getFullYear().toString(),
        fuel: normalizeFuel(data.fuel),
      })

      setStep('confirm')
    } catch (err) {
      console.error('Scan error:', err)
      setError("Erreur lors du scan. Réessaie.")
    } finally {
      setIsScanning(false)
    }
  }

  function handleConfirm() {
    if (!vehicle.model.trim()) {
      setError('Indique le modèle de ton véhicule')
      return
    }
    onVehicleConfirmed(vehicle)
    handleClose()
  }

  function handleClose() {
    setStep('upload')
    setPlateNumber('')
    setVehicle({
      plate: '',
      brand: 'Peugeot',
      model: '',
      year: new Date().getFullYear().toString(),
      fuel: 'Essence',
    })
    setError(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            {step === 'upload' ? 'Scanner ta plaque' : 'Confirme ton véhicule'}
          </DialogTitle>
          <DialogDescription>
            {step === 'upload'
              ? 'Prends une photo de ton véhicule - on détecte la plaque ET le modèle'
              : 'Vérifie les informations détectées et complète si nécessaire'
            }
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' ? (
          <div className="space-y-4">
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
              {isScanning ? (
                <div className="space-y-2">
                  <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Analyse en cours...</p>
                </div>
              ) : (
                <>
                  <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="font-medium">Prendre une photo</p>
                  <p className="text-sm text-muted-foreground">de ta plaque d'immatriculation</p>
                </>
              )}
            </div>

            {error && <p className="text-sm text-red-600 text-center">{error}</p>}

            <Button variant="ghost" className="w-full" onClick={handleClose}>
              Annuler
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Plate & vehicle detected */}
            <Card className="bg-green-50 border-green-200">
              <CardContent className="py-4">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-green-800">Plaque détectée</p>
                    <p className="font-mono font-bold text-lg">{plateNumber}</p>
                  </div>
                </div>
                {vehicle.model && (
                  <div className="mt-2 pt-2 border-t border-green-200 text-sm text-green-700">
                    ✨ Véhicule identifié : <strong>{vehicle.brand} {vehicle.model}</strong>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Vehicle form */}
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="brand">Marque</Label>
                  <select
                    id="brand"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={vehicle.brand}
                    onChange={(e) => setVehicle((prev) => ({ ...prev, brand: e.target.value }))}
                  >
                    {BRANDS.map((brand) => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Modèle *</Label>
                  <Input
                    id="model"
                    placeholder="ex: 208, Clio..."
                    value={vehicle.model}
                    onChange={(e) => setVehicle((prev) => ({ ...prev, model: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">Année</Label>
                  <Input
                    id="year"
                    type="number"
                    min="1990"
                    max={new Date().getFullYear()}
                    value={vehicle.year}
                    onChange={(e) => setVehicle((prev) => ({ ...prev, year: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fuel">Carburant</Label>
                  <select
                    id="fuel"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={vehicle.fuel}
                    onChange={(e) => setVehicle((prev) => ({ ...prev, fuel: e.target.value }))}
                  >
                    {FUELS.map((fuel) => (
                      <option key={fuel} value={fuel}>{fuel}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep('upload')}>
                Rescanner
              </Button>
              <Button className="flex-1" onClick={handleConfirm}>
                Continuer
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
