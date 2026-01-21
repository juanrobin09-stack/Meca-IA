import type { Handler } from '@netlify/functions'

interface TechnicalControl {
  date: string
  result: 'favorable' | 'defavorable' | 'contre-visite'
  mileage: number
  center: string
  defects: string[]
}

interface OwnerHistory {
  startDate: string
  endDate: string | null
  type: 'particulier' | 'professionnel'
  region: string
}

interface Accident {
  date: string
  type: string
  severity: 'leger' | 'moyen' | 'grave'
  repaired: boolean
}

interface Recall {
  date: string
  reason: string
  status: 'effectue' | 'en_attente'
  manufacturer: string
}

interface VehicleHistory {
  plate: string
  brand: string
  model: string
  year: number
  vin?: string
  firstRegistration: string

  // Données administratives
  administrative: {
    hasGage: boolean
    hasOpposition: boolean
    isStolenDeclared: boolean
    lastUpdate: string
  }

  // Contrôles techniques
  technicalControls: TechnicalControl[]

  // Historique propriétaires
  owners: OwnerHistory[]

  // Accidents déclarés
  accidents: Accident[]

  // Rappels constructeur
  recalls: Recall[]

  // Historique kilométrique
  mileageHistory: { date: string; mileage: number; source: string }[]

  // Score de confiance
  trustScore: number
  trustDetails: string[]
}

// Génère un historique réaliste basé sur la plaque et les infos véhicule
function generateVehicleHistory(plate: string, brand?: string, model?: string, year?: number): VehicleHistory {
  const currentYear = new Date().getFullYear()
  const vehicleYear = year || (currentYear - Math.floor(Math.random() * 15) - 2)
  const vehicleAge = currentYear - vehicleYear

  // Générer un VIN fictif mais réaliste
  const vinChars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789'
  let vin = ''
  for (let i = 0; i < 17; i++) {
    vin += vinChars[Math.floor(Math.random() * vinChars.length)]
  }

  // Date première immatriculation
  const firstRegMonth = Math.floor(Math.random() * 12) + 1
  const firstRegistration = `${vehicleYear}-${firstRegMonth.toString().padStart(2, '0')}-15`

  // Générer contrôles techniques (tous les 2 ans après 4 ans)
  const technicalControls: TechnicalControl[] = []
  const regions = ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Bordeaux', 'Nantes', 'Lille', 'Strasbourg']
  const defectTypes = [
    'Usure plaquettes avant',
    'Fuite légère direction assistée',
    'Jeu rotule de direction',
    'Usure pneu avant gauche',
    'Éclairage feu arrière défectueux',
    'Corrosion sous caisse',
    'Flexible de frein craquelé'
  ]

  if (vehicleAge >= 4) {
    const numControls = Math.floor((vehicleAge - 4) / 2) + 1
    let lastMileage = 15000 + Math.floor(Math.random() * 10000)

    for (let i = 0; i < Math.min(numControls, 6); i++) {
      const controlYear = vehicleYear + 4 + (i * 2)
      if (controlYear > currentYear) break

      const hasDefects = Math.random() > 0.7
      const isFavorable = Math.random() > 0.15

      const defects: string[] = []
      if (hasDefects) {
        const numDefects = Math.floor(Math.random() * 3) + 1
        for (let j = 0; j < numDefects; j++) {
          defects.push(defectTypes[Math.floor(Math.random() * defectTypes.length)])
        }
      }

      lastMileage += 15000 + Math.floor(Math.random() * 20000)

      technicalControls.push({
        date: `${controlYear}-${(Math.floor(Math.random() * 12) + 1).toString().padStart(2, '0')}-${(Math.floor(Math.random() * 28) + 1).toString().padStart(2, '0')}`,
        result: isFavorable ? 'favorable' : (Math.random() > 0.5 ? 'defavorable' : 'contre-visite'),
        mileage: lastMileage,
        center: `Contrôle Auto ${regions[Math.floor(Math.random() * regions.length)]}`,
        defects
      })
    }
  }

  // Générer historique propriétaires
  const numOwners = Math.min(Math.floor(vehicleAge / 3) + 1, 4)
  const owners: OwnerHistory[] = []
  let currentOwnerStart = vehicleYear

  for (let i = 0; i < numOwners; i++) {
    const isLast = i === numOwners - 1
    const duration = isLast ? 0 : Math.floor(Math.random() * 4) + 1

    owners.push({
      startDate: `${currentOwnerStart}-${(Math.floor(Math.random() * 12) + 1).toString().padStart(2, '0')}-01`,
      endDate: isLast ? null : `${currentOwnerStart + duration}-${(Math.floor(Math.random() * 12) + 1).toString().padStart(2, '0')}-01`,
      type: Math.random() > 0.8 ? 'professionnel' : 'particulier',
      region: regions[Math.floor(Math.random() * regions.length)]
    })

    currentOwnerStart += duration
  }

  // Accidents (probabilité faible)
  const accidents: Accident[] = []
  if (Math.random() > 0.75) {
    const accidentTypes = ['Collision arrière', 'Accrochage parking', 'Collision latérale', 'Choc avant léger']
    accidents.push({
      date: `${vehicleYear + Math.floor(Math.random() * vehicleAge)}-${(Math.floor(Math.random() * 12) + 1).toString().padStart(2, '0')}-${(Math.floor(Math.random() * 28) + 1).toString().padStart(2, '0')}`,
      type: accidentTypes[Math.floor(Math.random() * accidentTypes.length)],
      severity: Math.random() > 0.8 ? 'moyen' : 'leger',
      repaired: true
    })
  }

  // Rappels constructeur (probabilité moyenne)
  const recalls: Recall[] = []
  const recallReasons = [
    'Mise à jour logiciel système de freinage',
    'Vérification airbag passager',
    'Remplacement pompe à carburant',
    'Contrôle ceinture de sécurité',
    'Mise à jour calculateur moteur'
  ]

  if (Math.random() > 0.6) {
    recalls.push({
      date: `${vehicleYear + Math.floor(Math.random() * 3) + 1}-${(Math.floor(Math.random() * 12) + 1).toString().padStart(2, '0')}-01`,
      reason: recallReasons[Math.floor(Math.random() * recallReasons.length)],
      status: Math.random() > 0.2 ? 'effectue' : 'en_attente',
      manufacturer: brand || 'Constructeur'
    })
  }

  // Historique kilométrique
  const mileageHistory: { date: string; mileage: number; source: string }[] = []
  let currentMileage = 0
  const annualMileage = 12000 + Math.floor(Math.random() * 8000)

  for (let y = vehicleYear; y <= currentYear; y++) {
    currentMileage += annualMileage + Math.floor(Math.random() * 5000) - 2500
    if (currentMileage < 0) currentMileage = 0

    mileageHistory.push({
      date: `${y}-12-31`,
      mileage: currentMileage,
      source: y === vehicleYear ? 'Première immatriculation' :
              (Math.random() > 0.5 ? 'Contrôle technique' : 'Entretien concessionnaire')
    })
  }

  // Données administratives
  const administrative = {
    hasGage: Math.random() > 0.95,
    hasOpposition: Math.random() > 0.98,
    isStolenDeclared: false,
    lastUpdate: new Date().toISOString().split('T')[0]
  }

  // Calculer score de confiance
  let trustScore = 100
  const trustDetails: string[] = []

  // Pénalités
  if (accidents.length > 0) {
    trustScore -= 15 * accidents.length
    trustDetails.push(`${accidents.length} accident(s) déclaré(s)`)
  }

  if (administrative.hasGage) {
    trustScore -= 30
    trustDetails.push('Véhicule gagé')
  }

  if (administrative.hasOpposition) {
    trustScore -= 40
    trustDetails.push('Opposition administrative')
  }

  const failedControls = technicalControls.filter(tc => tc.result !== 'favorable').length
  if (failedControls > 0) {
    trustScore -= 5 * failedControls
    trustDetails.push(`${failedControls} contrôle(s) technique(s) défavorable(s)`)
  }

  if (recalls.some(r => r.status === 'en_attente')) {
    trustScore -= 10
    trustDetails.push('Rappel constructeur en attente')
  }

  if (owners.length > 3) {
    trustScore -= 5
    trustDetails.push('Nombreux propriétaires')
  }

  // Bonus
  if (accidents.length === 0 && failedControls === 0) {
    trustDetails.push('Historique sans incident')
  }

  if (trustScore >= 90 && trustDetails.length === 0) {
    trustDetails.push('Excellent historique')
  }

  trustScore = Math.max(0, Math.min(100, trustScore))

  return {
    plate: plate.toUpperCase(),
    brand: brand || 'Marque inconnue',
    model: model || 'Modèle inconnu',
    year: vehicleYear,
    vin,
    firstRegistration,
    administrative,
    technicalControls: technicalControls.sort((a, b) => b.date.localeCompare(a.date)),
    owners,
    accidents,
    recalls,
    mileageHistory,
    trustScore,
    trustDetails
  }
}

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  try {
    const body = JSON.parse(event.body || '{}')
    const { plate, brand, model, year } = body

    if (!plate) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Plaque d\'immatriculation requise' })
      }
    }

    console.log('Vehicle history request for:', plate)

    // Générer l'historique
    const history = generateVehicleHistory(plate, brand, model, year)

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(history)
    }

  } catch (error) {
    console.error('Vehicle history error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Erreur lors de la récupération de l\'historique',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}
