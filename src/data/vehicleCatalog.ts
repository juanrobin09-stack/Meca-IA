export interface EngineOption {
  label: string
  fuel: string
  years: number[]
}

export interface ModelOption {
  name: string
  years: number[]
  engines: EngineOption[]
}

export interface BrandOption {
  brand: string
  models: ModelOption[]
}

const range = (start: number, end: number) =>
  Array.from({ length: end - start + 1 }, (_, i) => start + i)

export const VEHICLE_CATALOG: BrandOption[] = [
  {
    brand: 'Peugeot',
    models: [
      {
        name: '208',
        years: range(2012, 2026),
        engines: [
          { label: '1.2 PureTech 82/100/110', fuel: 'Essence', years: range(2012, 2026) },
          { label: '1.5 BlueHDi 100', fuel: 'Diesel', years: range(2018, 2024) },
          { label: 'e-208 electrique', fuel: 'Electrique', years: range(2019, 2026) },
        ],
      },
      {
        name: '308',
        years: range(2013, 2026),
        engines: [
          { label: '1.2 PureTech 110/130', fuel: 'Essence', years: range(2014, 2026) },
          { label: '1.5 BlueHDi 130', fuel: 'Diesel', years: range(2017, 2025) },
          { label: 'Hybrid 180/225', fuel: 'Hybride', years: range(2021, 2026) },
        ],
      },
      {
        name: '3008',
        years: range(2016, 2026),
        engines: [
          { label: '1.2 PureTech 130', fuel: 'Essence', years: range(2016, 2026) },
          { label: '1.5 BlueHDi 130', fuel: 'Diesel', years: range(2018, 2024) },
          { label: 'Hybrid 225/300', fuel: 'Hybride', years: range(2019, 2026) },
        ],
      },
    ],
  },
  {
    brand: 'Renault',
    models: [
      {
        name: 'Clio',
        years: range(2012, 2026),
        engines: [
          { label: '0.9 TCe 90', fuel: 'Essence', years: range(2012, 2019) },
          { label: '1.0 TCe 90/100', fuel: 'Essence', years: range(2019, 2026) },
          { label: '1.5 dCi 75/90/110', fuel: 'Diesel', years: range(2012, 2020) },
          { label: 'E-Tech hybride 140/145', fuel: 'Hybride', years: range(2020, 2026) },
        ],
      },
      {
        name: 'Megane',
        years: range(2012, 2024),
        engines: [
          { label: '1.2 TCe 115/130', fuel: 'Essence', years: range(2012, 2018) },
          { label: '1.3 TCe 115/140/160', fuel: 'Essence', years: range(2018, 2024) },
          { label: '1.5 dCi / Blue dCi 110/115', fuel: 'Diesel', years: range(2012, 2023) },
        ],
      },
      {
        name: 'Captur',
        years: range(2013, 2026),
        engines: [
          { label: '0.9 TCe 90', fuel: 'Essence', years: range(2013, 2019) },
          { label: '1.0 TCe 90/100', fuel: 'Essence', years: range(2019, 2026) },
          { label: '1.5 dCi / Blue dCi 90/115', fuel: 'Diesel', years: range(2013, 2021) },
          { label: 'E-Tech hybride / plug-in', fuel: 'Hybride', years: range(2020, 2026) },
        ],
      },
    ],
  },
  {
    brand: 'Citroën',
    models: [
      {
        name: 'C3',
        years: range(2010, 2026),
        engines: [
          { label: '1.2 PureTech 82/110', fuel: 'Essence', years: range(2013, 2026) },
          { label: '1.5 BlueHDi 100', fuel: 'Diesel', years: range(2018, 2024) },
          { label: '1.6 HDi / BlueHDi', fuel: 'Diesel', years: range(2010, 2018) },
        ],
      },
      {
        name: 'C4',
        years: range(2010, 2026),
        engines: [
          { label: '1.2 PureTech 100/130', fuel: 'Essence', years: range(2014, 2026) },
          { label: '1.5 BlueHDi 110/130', fuel: 'Diesel', years: range(2018, 2025) },
          { label: 'e-C4 electrique', fuel: 'Electrique', years: range(2020, 2026) },
        ],
      },
      {
        name: 'C5 Aircross',
        years: range(2018, 2026),
        engines: [
          { label: '1.2 PureTech 130', fuel: 'Essence', years: range(2018, 2026) },
          { label: '1.5 BlueHDi 130', fuel: 'Diesel', years: range(2018, 2024) },
          { label: 'Hybrid 180/225', fuel: 'Hybride', years: range(2020, 2026) },
        ],
      },
    ],
  },
  {
    brand: 'Dacia',
    models: [
      {
        name: 'Sandero',
        years: range(2012, 2026),
        engines: [
          { label: '0.9 TCe 90', fuel: 'Essence', years: range(2012, 2020) },
          { label: '1.0 TCe 90', fuel: 'Essence', years: range(2020, 2026) },
          { label: '1.5 dCi / Blue dCi', fuel: 'Diesel', years: range(2012, 2021) },
          { label: 'ECO-G 100 GPL', fuel: 'GPL', years: range(2020, 2026) },
        ],
      },
      {
        name: 'Duster',
        years: range(2010, 2026),
        engines: [
          { label: '1.0 TCe / ECO-G', fuel: 'GPL', years: range(2019, 2026) },
          { label: '1.3 TCe 130/150', fuel: 'Essence', years: range(2018, 2026) },
          { label: '1.5 dCi / Blue dCi', fuel: 'Diesel', years: range(2010, 2024) },
        ],
      },
    ],
  },
  {
    brand: 'Volkswagen',
    models: [
      {
        name: 'Golf',
        years: range(2012, 2026),
        engines: [
          { label: '1.0 TSI 110', fuel: 'Essence', years: range(2016, 2026) },
          { label: '1.4 / 1.5 TSI', fuel: 'Essence', years: range(2012, 2026) },
          { label: '1.6 / 2.0 TDI', fuel: 'Diesel', years: range(2012, 2024) },
          { label: 'GTE hybride rechargeable', fuel: 'Hybride', years: range(2014, 2026) },
        ],
      },
      {
        name: 'Polo',
        years: range(2010, 2026),
        engines: [
          { label: '1.0 MPI', fuel: 'Essence', years: range(2014, 2026) },
          { label: '1.0 TSI 95/115', fuel: 'Essence', years: range(2014, 2026) },
          { label: '1.4 / 1.6 TDI', fuel: 'Diesel', years: range(2010, 2021) },
        ],
      },
      {
        name: 'Tiguan',
        years: range(2011, 2026),
        engines: [
          { label: '1.4 / 1.5 TSI', fuel: 'Essence', years: range(2011, 2026) },
          { label: '2.0 TDI', fuel: 'Diesel', years: range(2011, 2025) },
          { label: 'eHybrid', fuel: 'Hybride', years: range(2021, 2026) },
        ],
      },
    ],
  },
  {
    brand: 'Toyota',
    models: [
      {
        name: 'Yaris',
        years: range(2011, 2026),
        engines: [
          { label: '1.0 VVT-i', fuel: 'Essence', years: range(2011, 2020) },
          { label: '1.5 VVT-i', fuel: 'Essence', years: range(2017, 2026) },
          { label: 'Hybrid 100/116', fuel: 'Hybride', years: range(2012, 2026) },
        ],
      },
      {
        name: 'Corolla',
        years: range(2019, 2026),
        engines: [
          { label: 'Hybrid 122/140', fuel: 'Hybride', years: range(2019, 2026) },
          { label: 'Hybrid 180/196', fuel: 'Hybride', years: range(2019, 2026) },
        ],
      },
      {
        name: 'RAV4',
        years: range(2013, 2026),
        engines: [
          { label: '2.0 VVT-i', fuel: 'Essence', years: range(2013, 2019) },
          { label: '2.5 Hybrid', fuel: 'Hybride', years: range(2016, 2026) },
          { label: 'Plug-in Hybrid', fuel: 'Hybride', years: range(2020, 2026) },
        ],
      },
    ],
  },
  {
    brand: 'Ford',
    models: [
      {
        name: 'Fiesta',
        years: range(2012, 2023),
        engines: [
          { label: '1.0 EcoBoost 100/125', fuel: 'Essence', years: range(2012, 2023) },
          { label: '1.5 TDCi', fuel: 'Diesel', years: range(2012, 2020) },
        ],
      },
      {
        name: 'Focus',
        years: range(2011, 2025),
        engines: [
          { label: '1.0 EcoBoost 100/125', fuel: 'Essence', years: range(2012, 2025) },
          { label: '1.5 EcoBoost', fuel: 'Essence', years: range(2014, 2022) },
          { label: '1.5 / 2.0 EcoBlue', fuel: 'Diesel', years: range(2018, 2024) },
        ],
      },
      {
        name: 'Kuga',
        years: range(2013, 2026),
        engines: [
          { label: '1.5 EcoBoost', fuel: 'Essence', years: range(2013, 2026) },
          { label: '1.5 / 2.0 EcoBlue', fuel: 'Diesel', years: range(2018, 2024) },
          { label: 'FHEV / PHEV hybride', fuel: 'Hybride', years: range(2020, 2026) },
        ],
      },
    ],
  },
  {
    brand: 'Opel',
    models: [
      {
        name: 'Corsa',
        years: range(2010, 2026),
        engines: [
          { label: '1.2 PureTech 75/100/130', fuel: 'Essence', years: range(2019, 2026) },
          { label: '1.5 Diesel 100', fuel: 'Diesel', years: range(2019, 2023) },
          { label: 'Corsa-e electrique', fuel: 'Electrique', years: range(2019, 2026) },
        ],
      },
      {
        name: 'Astra',
        years: range(2010, 2026),
        engines: [
          { label: '1.2 Turbo 110/130', fuel: 'Essence', years: range(2021, 2026) },
          { label: '1.5 Diesel 130', fuel: 'Diesel', years: range(2019, 2025) },
          { label: 'Hybrid 180/225', fuel: 'Hybride', years: range(2022, 2026) },
        ],
      },
    ],
  },
  {
    brand: 'BMW',
    models: [
      {
        name: 'Serie 1',
        years: range(2011, 2026),
        engines: [
          { label: '116i / 118i', fuel: 'Essence', years: range(2011, 2026) },
          { label: '116d / 118d / 120d', fuel: 'Diesel', years: range(2011, 2025) },
        ],
      },
      {
        name: 'Serie 3',
        years: range(2012, 2026),
        engines: [
          { label: '320i / 330i', fuel: 'Essence', years: range(2012, 2026) },
          { label: '318d / 320d', fuel: 'Diesel', years: range(2012, 2025) },
          { label: '330e hybride rechargeable', fuel: 'Hybride', years: range(2016, 2026) },
        ],
      },
    ],
  },
  {
    brand: 'Mercedes',
    models: [
      {
        name: 'Classe A',
        years: range(2012, 2026),
        engines: [
          { label: 'A180 / A200 essence', fuel: 'Essence', years: range(2012, 2026) },
          { label: 'A180d / A200d', fuel: 'Diesel', years: range(2012, 2025) },
          { label: 'A250e hybride rechargeable', fuel: 'Hybride', years: range(2019, 2026) },
        ],
      },
      {
        name: 'Classe C',
        years: range(2011, 2026),
        engines: [
          { label: 'C180 / C200 essence', fuel: 'Essence', years: range(2011, 2026) },
          { label: 'C200d / C220d', fuel: 'Diesel', years: range(2011, 2025) },
          { label: 'C300e hybride rechargeable', fuel: 'Hybride', years: range(2019, 2026) },
        ],
      },
    ],
  },
  {
    brand: 'Audi',
    models: [
      {
        name: 'A3',
        years: range(2012, 2026),
        engines: [
          { label: '1.0 / 1.4 / 1.5 TFSI', fuel: 'Essence', years: range(2012, 2026) },
          { label: '1.6 / 2.0 TDI', fuel: 'Diesel', years: range(2012, 2025) },
          { label: 'e-tron / TFSI e', fuel: 'Hybride', years: range(2014, 2026) },
        ],
      },
      {
        name: 'A4',
        years: range(2012, 2026),
        engines: [
          { label: '1.8 / 2.0 TFSI', fuel: 'Essence', years: range(2012, 2026) },
          { label: '2.0 TDI', fuel: 'Diesel', years: range(2012, 2025) },
        ],
      },
    ],
  },
  {
    brand: 'Fiat',
    models: [
      {
        name: '500',
        years: range(2008, 2026),
        engines: [
          { label: '1.2 69ch', fuel: 'Essence', years: range(2008, 2020) },
          { label: '0.9 TwinAir', fuel: 'Essence', years: range(2010, 2020) },
          { label: 'Hybrid 1.0', fuel: 'Hybride', years: range(2020, 2026) },
          { label: '500e electrique', fuel: 'Electrique', years: range(2020, 2026) },
        ],
      },
      {
        name: 'Tipo',
        years: range(2016, 2024),
        engines: [
          { label: '1.4 / 1.0 FireFly', fuel: 'Essence', years: range(2016, 2024) },
          { label: '1.3 / 1.6 Multijet', fuel: 'Diesel', years: range(2016, 2023) },
        ],
      },
    ],
  },
  {
    brand: 'Nissan',
    models: [
      {
        name: 'Qashqai',
        years: range(2010, 2026),
        engines: [
          { label: '1.2 DIG-T 115', fuel: 'Essence', years: range(2014, 2018) },
          { label: '1.3 DIG-T 140/160', fuel: 'Essence', years: range(2018, 2026) },
          { label: '1.5 dCi', fuel: 'Diesel', years: range(2010, 2020) },
          { label: 'e-Power hybride', fuel: 'Hybride', years: range(2022, 2026) },
        ],
      },
      {
        name: 'Juke',
        years: range(2010, 2026),
        engines: [
          { label: '1.0 DIG-T 114', fuel: 'Essence', years: range(2019, 2026) },
          { label: '1.5 dCi', fuel: 'Diesel', years: range(2010, 2019) },
          { label: 'Hybrid 143', fuel: 'Hybride', years: range(2022, 2026) },
        ],
      },
    ],
  },
  {
    brand: 'Hyundai',
    models: [
      {
        name: 'i20',
        years: range(2012, 2026),
        engines: [
          { label: '1.0 T-GDi', fuel: 'Essence', years: range(2015, 2026) },
          { label: '1.2 MPi', fuel: 'Essence', years: range(2012, 2026) },
        ],
      },
      {
        name: 'Tucson',
        years: range(2015, 2026),
        engines: [
          { label: '1.6 T-GDi', fuel: 'Essence', years: range(2015, 2026) },
          { label: '1.6 CRDi', fuel: 'Diesel', years: range(2018, 2023) },
          { label: 'Hybrid / Plug-in Hybrid', fuel: 'Hybride', years: range(2021, 2026) },
        ],
      },
    ],
  },
  {
    brand: 'Kia',
    models: [
      {
        name: 'Ceed',
        years: range(2012, 2026),
        engines: [
          { label: '1.0 / 1.4 / 1.5 T-GDi', fuel: 'Essence', years: range(2012, 2026) },
          { label: '1.6 CRDi', fuel: 'Diesel', years: range(2012, 2023) },
          { label: 'PHEV hybride rechargeable', fuel: 'Hybride', years: range(2020, 2026) },
        ],
      },
      {
        name: 'Sportage',
        years: range(2012, 2026),
        engines: [
          { label: '1.6 T-GDi', fuel: 'Essence', years: range(2015, 2026) },
          { label: '1.6 / 1.7 CRDi', fuel: 'Diesel', years: range(2012, 2023) },
          { label: 'Hybrid / Plug-in Hybrid', fuel: 'Hybride', years: range(2021, 2026) },
        ],
      },
    ],
  },
]

export const MANUAL_OPTION = 'Autre'
export const UNKNOWN_ENGINE = 'Je ne sais pas'

export function getBrandNames() {
  return [...VEHICLE_CATALOG.map((item) => item.brand), MANUAL_OPTION]
}

export function getBrand(brand: string) {
  return VEHICLE_CATALOG.find((item) => item.brand === brand)
}

export function getModels(brand: string) {
  const found = getBrand(brand)
  return found ? [...found.models.map((model) => model.name), MANUAL_OPTION] : []
}

export function getModel(brand: string, model: string) {
  return getBrand(brand)?.models.find((item) => item.name === model)
}

export function getEngineOptions(brand: string, model: string) {
  const found = getModel(brand, model)
  return found ? [UNKNOWN_ENGINE, ...found.engines.map((engine) => engine.label), MANUAL_OPTION] : []
}

export function getYears(brand: string, model: string, engine?: string) {
  const found = getModel(brand, model)
  if (!found) return range(1990, new Date().getFullYear() + 1).reverse()

  const engineOption = found.engines.find((item) => item.label === engine)
  const years = engineOption?.years ?? found.years
  return [...years].sort((a, b) => b - a)
}

export function getFuelForEngine(brand: string, model: string, engine: string) {
  return getModel(brand, model)?.engines.find((item) => item.label === engine)?.fuel
}
