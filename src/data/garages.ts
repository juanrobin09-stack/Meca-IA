export interface Garage {
  id: number
  name: string
  address: string
  city: string
  postalCode: string
  rating: number
  reviews: number
  specialties: string[]
  priceLevel: '€' | '€€' | '€€€'
  recommended: boolean
  phone: string
}

export const GARAGES: Garage[] = [
  // Paris
  {
    id: 1,
    name: "Garage du Centre",
    address: "15 rue de Rivoli",
    city: "Paris",
    postalCode: "75001",
    rating: 4.8,
    reviews: 234,
    specialties: ["Peugeot", "Citroën"],
    priceLevel: "€€",
    recommended: true,
    phone: "01 42 XX XX XX"
  },
  {
    id: 2,
    name: "Auto Service Nation",
    address: "78 avenue de la Nation",
    city: "Paris",
    postalCode: "75012",
    rating: 4.5,
    reviews: 156,
    specialties: ["Toutes marques"],
    priceLevel: "€€",
    recommended: false,
    phone: "01 43 XX XX XX"
  },
  {
    id: 3,
    name: "Speedy Paris Bastille",
    address: "23 boulevard Beaumarchais",
    city: "Paris",
    postalCode: "75011",
    rating: 4.1,
    reviews: 312,
    specialties: ["Toutes marques"],
    priceLevel: "€€€",
    recommended: false,
    phone: "01 48 XX XX XX"
  },

  // Lyon
  {
    id: 4,
    name: "Garage Lyonnais",
    address: "45 cours Lafayette",
    city: "Lyon",
    postalCode: "69003",
    rating: 4.9,
    reviews: 189,
    specialties: ["Renault", "Dacia"],
    priceLevel: "€",
    recommended: true,
    phone: "04 72 XX XX XX"
  },
  {
    id: 5,
    name: "Auto Presqu'île",
    address: "12 rue de la République",
    city: "Lyon",
    postalCode: "69002",
    rating: 4.4,
    reviews: 98,
    specialties: ["Toutes marques"],
    priceLevel: "€€",
    recommended: false,
    phone: "04 78 XX XX XX"
  },

  // Marseille
  {
    id: 6,
    name: "Garage du Vieux Port",
    address: "89 rue de Rome",
    city: "Marseille",
    postalCode: "13001",
    rating: 4.7,
    reviews: 145,
    specialties: ["Peugeot", "Renault"],
    priceLevel: "€€",
    recommended: true,
    phone: "04 91 XX XX XX"
  },
  {
    id: 7,
    name: "MecaPro Marseille",
    address: "56 boulevard Baille",
    city: "Marseille",
    postalCode: "13005",
    rating: 4.3,
    reviews: 87,
    specialties: ["Toutes marques"],
    priceLevel: "€",
    recommended: false,
    phone: "04 91 XX XX XX"
  },

  // Bordeaux
  {
    id: 8,
    name: "Garage Martin Auto",
    address: "12 rue de la Paix",
    city: "Bordeaux",
    postalCode: "33000",
    rating: 4.8,
    reviews: 127,
    specialties: ["Peugeot", "Citroën"],
    priceLevel: "€€",
    recommended: true,
    phone: "05 56 XX XX XX"
  },
  {
    id: 9,
    name: "Speedy Bordeaux Centre",
    address: "45 cours de l'Intendance",
    city: "Bordeaux",
    postalCode: "33000",
    rating: 4.2,
    reviews: 89,
    specialties: ["Toutes marques"],
    priceLevel: "€€€",
    recommended: false,
    phone: "05 56 XX XX XX"
  },

  // Toulouse
  {
    id: 10,
    name: "Auto Toulouse Centre",
    address: "34 rue Alsace-Lorraine",
    city: "Toulouse",
    postalCode: "31000",
    rating: 4.6,
    reviews: 167,
    specialties: ["Renault", "Dacia"],
    priceLevel: "€€",
    recommended: true,
    phone: "05 61 XX XX XX"
  },
  {
    id: 11,
    name: "Garage du Capitole",
    address: "8 place du Capitole",
    city: "Toulouse",
    postalCode: "31000",
    rating: 4.4,
    reviews: 92,
    specialties: ["Toutes marques"],
    priceLevel: "€€",
    recommended: false,
    phone: "05 61 XX XX XX"
  },

  // Nantes
  {
    id: 12,
    name: "Nantes Auto Service",
    address: "67 rue de Strasbourg",
    city: "Nantes",
    postalCode: "44000",
    rating: 4.7,
    reviews: 134,
    specialties: ["Peugeot", "Citroën", "Renault"],
    priceLevel: "€",
    recommended: true,
    phone: "02 40 XX XX XX"
  },
  {
    id: 13,
    name: "Garage de l'Erdre",
    address: "23 quai de Versailles",
    city: "Nantes",
    postalCode: "44000",
    rating: 4.3,
    reviews: 78,
    specialties: ["Toutes marques"],
    priceLevel: "€€",
    recommended: false,
    phone: "02 40 XX XX XX"
  },
]

export const CITIES = [...new Set(GARAGES.map(g => g.city))].sort()

export const SPECIALTIES = [
  "Toutes marques",
  "Peugeot",
  "Renault",
  "Citroën",
  "Dacia",
]
