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
  // ─── PEUGEOT ───────────────────────────────────────────────────────────────
  {
    brand: 'Peugeot',
    models: [
      {
        name: '107',
        years: range(2005, 2014),
        engines: [
          { label: '1.0 68ch', fuel: 'Essence', years: range(2005, 2014) },
          { label: '1.4 HDi 54ch', fuel: 'Diesel', years: range(2005, 2014) },
        ],
      },
      {
        name: '108',
        years: range(2014, 2022),
        engines: [
          { label: '1.0 VTi 68/72ch', fuel: 'Essence', years: range(2014, 2022) },
          { label: 'e-108 électrique', fuel: 'Electrique', years: range(2019, 2022) },
        ],
      },
      {
        name: '206',
        years: range(1998, 2012),
        engines: [
          { label: '1.1 60ch', fuel: 'Essence', years: range(1998, 2009) },
          { label: '1.4 75ch', fuel: 'Essence', years: range(1998, 2012) },
          { label: '1.6 16v 110ch', fuel: 'Essence', years: range(2000, 2010) },
          { label: '1.4 HDi 70ch', fuel: 'Diesel', years: range(2001, 2010) },
          { label: '1.6 HDi 110ch', fuel: 'Diesel', years: range(2004, 2012) },
        ],
      },
      {
        name: '207',
        years: range(2006, 2015),
        engines: [
          { label: '1.4 VTi 95ch', fuel: 'Essence', years: range(2006, 2015) },
          { label: '1.6 THP 120/150ch', fuel: 'Essence', years: range(2007, 2015) },
          { label: '1.4 / 1.6 HDi', fuel: 'Diesel', years: range(2006, 2015) },
        ],
      },
      {
        name: '208',
        years: range(2012, 2026),
        engines: [
          { label: '1.2 PureTech 82ch', fuel: 'Essence', years: range(2012, 2019) },
          { label: '1.2 PureTech 100/110ch', fuel: 'Essence', years: range(2015, 2026) },
          { label: '1.5 BlueHDi 100ch', fuel: 'Diesel', years: range(2018, 2024) },
          { label: 'e-208 136/156ch électrique', fuel: 'Electrique', years: range(2019, 2026) },
        ],
      },
      {
        name: '301',
        years: range(2012, 2023),
        engines: [
          { label: '1.2 PureTech 82ch', fuel: 'Essence', years: range(2012, 2023) },
          { label: '1.6 BlueHDi 100ch', fuel: 'Diesel', years: range(2012, 2023) },
        ],
      },
      {
        name: '306',
        years: range(1993, 2002),
        engines: [
          { label: '1.4 75ch', fuel: 'Essence', years: range(1993, 2002) },
          { label: '1.6 101ch', fuel: 'Essence', years: range(1993, 2002) },
          { label: '1.8 / 2.0 16v', fuel: 'Essence', years: range(1993, 2002) },
          { label: '1.9 D / TD', fuel: 'Diesel', years: range(1993, 2002) },
          { label: '2.0 HDi 90ch', fuel: 'Diesel', years: range(1999, 2002) },
        ],
      },
      {
        name: '307',
        years: range(2001, 2008),
        engines: [
          { label: '1.4 16v 88ch', fuel: 'Essence', years: range(2001, 2008) },
          { label: '1.6 16v 110ch', fuel: 'Essence', years: range(2001, 2008) },
          { label: '2.0 16v 136ch', fuel: 'Essence', years: range(2001, 2008) },
          { label: '1.6 HDi 90/110ch', fuel: 'Diesel', years: range(2004, 2008) },
          { label: '2.0 HDi 90/110ch', fuel: 'Diesel', years: range(2001, 2008) },
        ],
      },
      {
        name: '308',
        years: range(2007, 2026),
        engines: [
          { label: '1.2 PureTech 110/130ch', fuel: 'Essence', years: range(2014, 2026) },
          { label: '1.6 THP 125/156ch', fuel: 'Essence', years: range(2007, 2017) },
          { label: '1.5 BlueHDi 100/130ch', fuel: 'Diesel', years: range(2017, 2025) },
          { label: '2.0 BlueHDi 150/180ch', fuel: 'Diesel', years: range(2013, 2021) },
          { label: 'Hybrid 180/225ch', fuel: 'Hybride', years: range(2021, 2026) },
          { label: 'e-308 électrique', fuel: 'Electrique', years: range(2023, 2026) },
        ],
      },
      {
        name: '408',
        years: range(2022, 2026),
        engines: [
          { label: '1.2 PureTech 130ch', fuel: 'Essence', years: range(2022, 2026) },
          { label: 'Hybrid 180/225ch', fuel: 'Hybride', years: range(2022, 2026) },
        ],
      },
      {
        name: '2008',
        years: range(2013, 2026),
        engines: [
          { label: '1.2 PureTech 100/130ch', fuel: 'Essence', years: range(2016, 2026) },
          { label: '1.5 BlueHDi 100/110ch', fuel: 'Diesel', years: range(2016, 2024) },
          { label: 'e-2008 électrique 136/156ch', fuel: 'Electrique', years: range(2019, 2026) },
        ],
      },
      {
        name: '3008',
        years: range(2008, 2026),
        engines: [
          { label: '1.2 PureTech 130ch', fuel: 'Essence', years: range(2016, 2026) },
          { label: '1.5 / 2.0 BlueHDi 130/180ch', fuel: 'Diesel', years: range(2016, 2024) },
          { label: 'Hybrid 225/300ch', fuel: 'Hybride', years: range(2019, 2026) },
          { label: 'e-3008 électrique 210/320ch', fuel: 'Electrique', years: range(2024, 2026) },
        ],
      },
      {
        name: '5008',
        years: range(2009, 2026),
        engines: [
          { label: '1.2 PureTech 130ch', fuel: 'Essence', years: range(2017, 2026) },
          { label: '1.5 / 2.0 BlueHDi 130/180ch', fuel: 'Diesel', years: range(2017, 2025) },
          { label: 'Hybrid 225/300ch', fuel: 'Hybride', years: range(2021, 2026) },
          { label: 'e-5008 électrique', fuel: 'Electrique', years: range(2024, 2026) },
        ],
      },
      {
        name: '508',
        years: range(2011, 2026),
        engines: [
          { label: '1.6 PureTech 180ch', fuel: 'Essence', years: range(2018, 2026) },
          { label: '2.0 BlueHDi 160/180ch', fuel: 'Diesel', years: range(2018, 2025) },
          { label: 'Hybrid 225/360ch', fuel: 'Hybride', years: range(2019, 2026) },
        ],
      },
      {
        name: 'Partner',
        years: range(2008, 2026),
        engines: [
          { label: '1.2 PureTech 110ch', fuel: 'Essence', years: range(2018, 2026) },
          { label: '1.5 BlueHDi 100/130ch', fuel: 'Diesel', years: range(2018, 2026) },
          { label: 'e-Partner électrique', fuel: 'Electrique', years: range(2021, 2026) },
        ],
      },
    ],
  },

  // ─── RENAULT ───────────────────────────────────────────────────────────────
  {
    brand: 'Renault',
    models: [
      {
        name: 'Twingo',
        years: range(1993, 2026),
        engines: [
          { label: '1.0 SCe 65/70ch', fuel: 'Essence', years: range(2014, 2026) },
          { label: '0.9 TCe 90ch', fuel: 'Essence', years: range(2014, 2022) },
          { label: 'Z.E. électrique 82ch', fuel: 'Electrique', years: range(2020, 2026) },
        ],
      },
      {
        name: 'Clio',
        years: range(1990, 2026),
        engines: [
          { label: '0.9 TCe 90ch', fuel: 'Essence', years: range(2012, 2019) },
          { label: '1.0 TCe 90/100ch', fuel: 'Essence', years: range(2019, 2026) },
          { label: '1.5 dCi 75/90/110ch', fuel: 'Diesel', years: range(2005, 2020) },
          { label: 'E-Tech Hybrid 140/145ch', fuel: 'Hybride', years: range(2020, 2026) },
        ],
      },
      {
        name: 'Megane',
        years: range(1995, 2025),
        engines: [
          { label: '1.2 TCe 115/130ch', fuel: 'Essence', years: range(2012, 2018) },
          { label: '1.3 TCe 115/140/160ch', fuel: 'Essence', years: range(2018, 2024) },
          { label: '1.5 dCi / Blue dCi 95/115ch', fuel: 'Diesel', years: range(2012, 2023) },
          { label: 'E-Tech Plug-in 160ch', fuel: 'Hybride', years: range(2020, 2024) },
          { label: 'Megane E-Tech électrique 130/218ch', fuel: 'Electrique', years: range(2022, 2026) },
        ],
      },
      {
        name: 'Scenic',
        years: range(1996, 2024),
        engines: [
          { label: '1.2 TCe 115/130ch', fuel: 'Essence', years: range(2013, 2022) },
          { label: '1.3 TCe 115/140ch', fuel: 'Essence', years: range(2018, 2022) },
          { label: '1.5 dCi / Blue dCi 110/115ch', fuel: 'Diesel', years: range(2003, 2022) },
          { label: 'E-Tech Hybrid 170ch', fuel: 'Hybride', years: range(2023, 2026) },
        ],
      },
      {
        name: 'Captur',
        years: range(2013, 2026),
        engines: [
          { label: '0.9 TCe 90ch', fuel: 'Essence', years: range(2013, 2019) },
          { label: '1.0 TCe 90/100ch', fuel: 'Essence', years: range(2019, 2026) },
          { label: '1.5 dCi / Blue dCi 90/115ch', fuel: 'Diesel', years: range(2013, 2021) },
          { label: 'E-Tech Hybrid 145ch', fuel: 'Hybride', years: range(2020, 2026) },
          { label: 'E-Tech Plug-in 160ch', fuel: 'Hybride', years: range(2020, 2026) },
        ],
      },
      {
        name: 'Kadjar',
        years: range(2015, 2023),
        engines: [
          { label: '1.2 / 1.3 TCe 130/140ch', fuel: 'Essence', years: range(2015, 2023) },
          { label: '1.5 / 1.7 Blue dCi 115/150ch', fuel: 'Diesel', years: range(2015, 2023) },
        ],
      },
      {
        name: 'Austral',
        years: range(2022, 2026),
        engines: [
          { label: '1.2 TCe 130/160ch', fuel: 'Essence', years: range(2022, 2026) },
          { label: 'E-Tech Hybrid 200ch', fuel: 'Hybride', years: range(2022, 2026) },
        ],
      },
      {
        name: 'Arkana',
        years: range(2021, 2026),
        engines: [
          { label: '1.3 TCe 140ch', fuel: 'Essence', years: range(2021, 2026) },
          { label: 'E-Tech Hybrid 145ch', fuel: 'Hybride', years: range(2021, 2026) },
        ],
      },
      {
        name: 'Zoe',
        years: range(2012, 2026),
        engines: [
          { label: 'R75 / R90 / R110 électrique', fuel: 'Electrique', years: range(2012, 2019) },
          { label: 'R135 électrique 52kWh', fuel: 'Electrique', years: range(2019, 2026) },
        ],
      },
      {
        name: 'Kangoo',
        years: range(1997, 2026),
        engines: [
          { label: '1.0 TCe 100ch', fuel: 'Essence', years: range(2021, 2026) },
          { label: '1.5 Blue dCi 95/115ch', fuel: 'Diesel', years: range(2008, 2026) },
          { label: 'E-Tech électrique', fuel: 'Electrique', years: range(2022, 2026) },
        ],
      },
      {
        name: 'Trafic',
        years: range(2001, 2026),
        engines: [
          { label: '1.6 / 2.0 dCi 90/120/145ch', fuel: 'Diesel', years: range(2001, 2026) },
          { label: 'E-Tech électrique', fuel: 'Electrique', years: range(2023, 2026) },
        ],
      },
      {
        name: 'Logan',
        years: range(2004, 2022),
        engines: [
          { label: '0.9 / 1.0 TCe 90ch', fuel: 'Essence', years: range(2013, 2022) },
          { label: '1.5 dCi 75/90ch', fuel: 'Diesel', years: range(2004, 2022) },
        ],
      },
    ],
  },

  // ─── CITROËN ───────────────────────────────────────────────────────────────
  {
    brand: 'Citroën',
    models: [
      {
        name: 'C1',
        years: range(2005, 2022),
        engines: [
          { label: '1.0 VTi 68/72ch', fuel: 'Essence', years: range(2005, 2022) },
          { label: '1.2 PureTech 82ch', fuel: 'Essence', years: range(2014, 2022) },
        ],
      },
      {
        name: 'C3',
        years: range(2002, 2026),
        engines: [
          { label: '1.2 PureTech 82/110ch', fuel: 'Essence', years: range(2013, 2026) },
          { label: '1.5 BlueHDi 100/102ch', fuel: 'Diesel', years: range(2016, 2024) },
          { label: 'ë-C3 électrique 113ch', fuel: 'Electrique', years: range(2024, 2026) },
        ],
      },
      {
        name: 'C3 Aircross',
        years: range(2017, 2026),
        engines: [
          { label: '1.2 PureTech 82/110/130ch', fuel: 'Essence', years: range(2017, 2026) },
          { label: '1.5 BlueHDi 100/110ch', fuel: 'Diesel', years: range(2017, 2024) },
        ],
      },
      {
        name: 'C4',
        years: range(2010, 2026),
        engines: [
          { label: '1.2 PureTech 100/130ch', fuel: 'Essence', years: range(2014, 2026) },
          { label: '1.5 BlueHDi 110/130ch', fuel: 'Diesel', years: range(2016, 2025) },
          { label: 'ë-C4 électrique 136/156ch', fuel: 'Electrique', years: range(2020, 2026) },
          { label: 'Hybrid 136/225ch', fuel: 'Hybride', years: range(2022, 2026) },
        ],
      },
      {
        name: 'C5 Aircross',
        years: range(2018, 2026),
        engines: [
          { label: '1.2 PureTech 130/155ch', fuel: 'Essence', years: range(2018, 2026) },
          { label: '1.5 BlueHDi 130ch', fuel: 'Diesel', years: range(2018, 2024) },
          { label: 'Hybrid 180/225ch', fuel: 'Hybride', years: range(2020, 2026) },
          { label: 'ë-C5 Aircross électrique', fuel: 'Electrique', years: range(2023, 2026) },
        ],
      },
      {
        name: 'C5 X',
        years: range(2022, 2026),
        engines: [
          { label: '1.2 PureTech 130ch', fuel: 'Essence', years: range(2022, 2026) },
          { label: 'Plug-in Hybrid 225ch', fuel: 'Hybride', years: range(2022, 2026) },
        ],
      },
      {
        name: 'Berlingo',
        years: range(1996, 2026),
        engines: [
          { label: '1.2 PureTech 110/130ch', fuel: 'Essence', years: range(2018, 2026) },
          { label: '1.5 BlueHDi 100/130ch', fuel: 'Diesel', years: range(2018, 2026) },
          { label: 'ë-Berlingo électrique', fuel: 'Electrique', years: range(2021, 2026) },
        ],
      },
      {
        name: 'Spacetourer',
        years: range(2016, 2024),
        engines: [
          { label: '1.6 / 2.0 BlueHDi 115/150/180ch', fuel: 'Diesel', years: range(2016, 2024) },
          { label: 'ë-Spacetourer électrique', fuel: 'Electrique', years: range(2020, 2024) },
        ],
      },
    ],
  },

  // ─── DACIA ─────────────────────────────────────────────────────────────────
  {
    brand: 'Dacia',
    models: [
      {
        name: 'Sandero',
        years: range(2008, 2026),
        engines: [
          { label: '0.9 TCe 90ch', fuel: 'Essence', years: range(2012, 2020) },
          { label: '1.0 SCe 65/75ch', fuel: 'Essence', years: range(2020, 2026) },
          { label: '1.0 TCe 90/100ch', fuel: 'Essence', years: range(2020, 2026) },
          { label: '1.5 dCi / Blue dCi 75/95ch', fuel: 'Diesel', years: range(2008, 2021) },
          { label: 'ECO-G 100 GPL', fuel: 'GPL', years: range(2020, 2026) },
        ],
      },
      {
        name: 'Logan',
        years: range(2004, 2022),
        engines: [
          { label: '0.9 TCe 90ch', fuel: 'Essence', years: range(2013, 2022) },
          { label: '1.0 SCe 75ch', fuel: 'Essence', years: range(2020, 2022) },
          { label: '1.5 dCi 75/90ch', fuel: 'Diesel', years: range(2004, 2022) },
        ],
      },
      {
        name: 'Duster',
        years: range(2010, 2026),
        engines: [
          { label: '1.0 TCe 90/100ch', fuel: 'Essence', years: range(2019, 2026) },
          { label: '1.3 TCe 130/150ch', fuel: 'Essence', years: range(2018, 2026) },
          { label: '1.5 dCi / Blue dCi 95/115ch', fuel: 'Diesel', years: range(2010, 2024) },
          { label: 'ECO-G 100 GPL', fuel: 'GPL', years: range(2021, 2026) },
        ],
      },
      {
        name: 'Lodgy',
        years: range(2012, 2022),
        engines: [
          { label: '1.0 TCe 100ch', fuel: 'Essence', years: range(2019, 2022) },
          { label: '1.5 dCi / Blue dCi 90/110ch', fuel: 'Diesel', years: range(2012, 2022) },
        ],
      },
      {
        name: 'Jogger',
        years: range(2022, 2026),
        engines: [
          { label: '1.0 TCe 110ch', fuel: 'Essence', years: range(2022, 2026) },
          { label: 'Hybrid 140ch', fuel: 'Hybride', years: range(2023, 2026) },
          { label: 'ECO-G 100 GPL', fuel: 'GPL', years: range(2022, 2026) },
        ],
      },
      {
        name: 'Spring',
        years: range(2021, 2026),
        engines: [
          { label: 'Électrique 33/48kWh 65/83ch', fuel: 'Electrique', years: range(2021, 2026) },
        ],
      },
    ],
  },

  // ─── DS AUTOMOBILES ────────────────────────────────────────────────────────
  {
    brand: 'DS Automobiles',
    models: [
      {
        name: 'DS3 / DS3 Crossback',
        years: range(2016, 2026),
        engines: [
          { label: '1.2 PureTech 100/130/155ch', fuel: 'Essence', years: range(2019, 2026) },
          { label: '1.5 BlueHDi 100/130ch', fuel: 'Diesel', years: range(2019, 2024) },
          { label: 'E-Tense électrique 136/156ch', fuel: 'Electrique', years: range(2019, 2026) },
        ],
      },
      {
        name: 'DS4',
        years: range(2021, 2026),
        engines: [
          { label: '1.2 PureTech 130ch', fuel: 'Essence', years: range(2021, 2026) },
          { label: '1.6 PureTech 225ch', fuel: 'Essence', years: range(2021, 2026) },
          { label: '1.5 BlueHDi 130ch', fuel: 'Diesel', years: range(2021, 2025) },
          { label: 'E-Tense 225/300ch', fuel: 'Hybride', years: range(2021, 2026) },
        ],
      },
      {
        name: 'DS7',
        years: range(2017, 2026),
        engines: [
          { label: '1.2 PureTech 130ch', fuel: 'Essence', years: range(2017, 2026) },
          { label: '1.5 BlueHDi 130ch', fuel: 'Diesel', years: range(2017, 2024) },
          { label: 'E-Tense 4x4 300/360ch', fuel: 'Hybride', years: range(2019, 2026) },
        ],
      },
      {
        name: 'DS9',
        years: range(2021, 2026),
        engines: [
          { label: 'E-Tense 225/360ch', fuel: 'Hybride', years: range(2021, 2026) },
        ],
      },
    ],
  },

  // ─── VOLKSWAGEN ────────────────────────────────────────────────────────────
  {
    brand: 'Volkswagen',
    models: [
      {
        name: 'Polo',
        years: range(2001, 2026),
        engines: [
          { label: '1.0 MPI 65/75/80ch', fuel: 'Essence', years: range(2014, 2026) },
          { label: '1.0 TSI 95/110/115ch', fuel: 'Essence', years: range(2014, 2026) },
          { label: '1.4 / 1.6 TDI 80/95ch', fuel: 'Diesel', years: range(2009, 2021) },
        ],
      },
      {
        name: 'Golf',
        years: range(1998, 2026),
        engines: [
          { label: '1.0 TSI 110ch', fuel: 'Essence', years: range(2016, 2026) },
          { label: '1.4 TSI / eTSI 125/150ch', fuel: 'Essence', years: range(2012, 2026) },
          { label: '1.5 TSI / eTSI 130/150ch', fuel: 'Essence', years: range(2017, 2026) },
          { label: '1.6 TDI 90/105/115ch', fuel: 'Diesel', years: range(2009, 2020) },
          { label: '2.0 TDI 115/150ch', fuel: 'Diesel', years: range(2012, 2026) },
          { label: 'GTE Plug-in Hybrid 245ch', fuel: 'Hybride', years: range(2014, 2026) },
          { label: 'e-Golf électrique', fuel: 'Electrique', years: range(2014, 2020) },
        ],
      },
      {
        name: 'Golf Sportsvan',
        years: range(2014, 2020),
        engines: [
          { label: '1.0 / 1.4 TSI', fuel: 'Essence', years: range(2014, 2020) },
          { label: '1.6 / 2.0 TDI', fuel: 'Diesel', years: range(2014, 2020) },
        ],
      },
      {
        name: 'T-Cross',
        years: range(2019, 2026),
        engines: [
          { label: '1.0 TSI 95/115ch', fuel: 'Essence', years: range(2019, 2026) },
          { label: '1.5 TSI 150ch', fuel: 'Essence', years: range(2019, 2026) },
        ],
      },
      {
        name: 'T-Roc',
        years: range(2017, 2026),
        engines: [
          { label: '1.0 TSI 110/115ch', fuel: 'Essence', years: range(2017, 2026) },
          { label: '1.5 TSI 150ch', fuel: 'Essence', years: range(2017, 2026) },
          { label: '2.0 TDI 115/150ch', fuel: 'Diesel', years: range(2017, 2024) },
        ],
      },
      {
        name: 'Tiguan',
        years: range(2007, 2026),
        engines: [
          { label: '1.4 / 1.5 TSI 130/150ch', fuel: 'Essence', years: range(2011, 2026) },
          { label: '2.0 TSI 190/220/245ch', fuel: 'Essence', years: range(2011, 2026) },
          { label: '2.0 TDI 115/150/190ch', fuel: 'Diesel', years: range(2007, 2025) },
          { label: 'eHybrid 245ch', fuel: 'Hybride', years: range(2021, 2026) },
        ],
      },
      {
        name: 'Touareg',
        years: range(2002, 2026),
        engines: [
          { label: '3.0 TSI V6 340/340ch', fuel: 'Essence', years: range(2018, 2026) },
          { label: '3.0 TDI V6 231/286ch', fuel: 'Diesel', years: range(2010, 2025) },
          { label: 'eHybrid 462ch', fuel: 'Hybride', years: range(2020, 2026) },
        ],
      },
      {
        name: 'Passat',
        years: range(2000, 2026),
        engines: [
          { label: '1.4 / 1.5 TSI 125/150ch', fuel: 'Essence', years: range(2014, 2026) },
          { label: '2.0 TSI 190/220ch', fuel: 'Essence', years: range(2014, 2026) },
          { label: '2.0 TDI 120/150/190ch', fuel: 'Diesel', years: range(2014, 2026) },
          { label: 'GTE Plug-in Hybrid 218ch', fuel: 'Hybride', years: range(2015, 2026) },
        ],
      },
      {
        name: 'Touran',
        years: range(2003, 2026),
        engines: [
          { label: '1.0 / 1.4 / 1.5 TSI', fuel: 'Essence', years: range(2015, 2026) },
          { label: '1.6 / 2.0 TDI', fuel: 'Diesel', years: range(2003, 2026) },
        ],
      },
      {
        name: 'ID.3',
        years: range(2020, 2026),
        engines: [
          { label: 'Électrique 45/58/77kWh 150/204ch', fuel: 'Electrique', years: range(2020, 2026) },
        ],
      },
      {
        name: 'ID.4',
        years: range(2021, 2026),
        engines: [
          { label: 'Électrique 52/77kWh 150/204ch', fuel: 'Electrique', years: range(2021, 2026) },
          { label: 'GTX 4Motion 299ch', fuel: 'Electrique', years: range(2021, 2026) },
        ],
      },
    ],
  },

  // ─── BMW ───────────────────────────────────────────────────────────────────
  {
    brand: 'BMW',
    models: [
      {
        name: 'Serie 1',
        years: range(2004, 2026),
        engines: [
          { label: '116i / 118i 109/136/140ch', fuel: 'Essence', years: range(2004, 2026) },
          { label: '120i 184ch', fuel: 'Essence', years: range(2015, 2026) },
          { label: '116d / 118d / 120d', fuel: 'Diesel', years: range(2004, 2025) },
        ],
      },
      {
        name: 'Serie 2',
        years: range(2014, 2026),
        engines: [
          { label: '218i / 220i 136/184ch', fuel: 'Essence', years: range(2014, 2026) },
          { label: '218d / 220d 150/190ch', fuel: 'Diesel', years: range(2014, 2025) },
          { label: 'Active Tourer Hybrid', fuel: 'Hybride', years: range(2015, 2026) },
        ],
      },
      {
        name: 'Serie 3',
        years: range(1998, 2026),
        engines: [
          { label: '318i / 320i 136/184ch', fuel: 'Essence', years: range(2005, 2026) },
          { label: '330i 258ch', fuel: 'Essence', years: range(2015, 2026) },
          { label: '318d / 320d 150/190ch', fuel: 'Diesel', years: range(2005, 2025) },
          { label: '330e Plug-in Hybrid', fuel: 'Hybride', years: range(2016, 2026) },
        ],
      },
      {
        name: 'Serie 5',
        years: range(2003, 2026),
        engines: [
          { label: '520i / 523i / 530i', fuel: 'Essence', years: range(2003, 2026) },
          { label: '520d / 525d / 530d', fuel: 'Diesel', years: range(2003, 2025) },
          { label: '530e / 545e Plug-in Hybrid', fuel: 'Hybride', years: range(2017, 2026) },
          { label: 'i5 électrique 250/340ch', fuel: 'Electrique', years: range(2023, 2026) },
        ],
      },
      {
        name: 'X1',
        years: range(2009, 2026),
        engines: [
          { label: 'sDrive18i / xDrive20i 140/192ch', fuel: 'Essence', years: range(2009, 2026) },
          { label: 'sDrive18d / xDrive20d 150ch', fuel: 'Diesel', years: range(2009, 2025) },
          { label: 'xDrive25e Plug-in Hybrid', fuel: 'Hybride', years: range(2020, 2026) },
          { label: 'iX1 électrique 313ch', fuel: 'Electrique', years: range(2022, 2026) },
        ],
      },
      {
        name: 'X3',
        years: range(2003, 2026),
        engines: [
          { label: 'xDrive20i / 30i 184/252ch', fuel: 'Essence', years: range(2010, 2026) },
          { label: 'xDrive20d / 30d 190/286ch', fuel: 'Diesel', years: range(2003, 2025) },
          { label: 'xDrive30e Plug-in Hybrid', fuel: 'Hybride', years: range(2020, 2026) },
          { label: 'iX3 électrique 286ch', fuel: 'Electrique', years: range(2020, 2026) },
        ],
      },
      {
        name: 'X5',
        years: range(2000, 2026),
        engines: [
          { label: 'xDrive40i 340ch', fuel: 'Essence', years: range(2018, 2026) },
          { label: 'xDrive30d / 40d 249/340ch', fuel: 'Diesel', years: range(2006, 2025) },
          { label: 'xDrive45e Plug-in Hybrid', fuel: 'Hybride', years: range(2019, 2026) },
        ],
      },
      {
        name: 'i3',
        years: range(2013, 2022),
        engines: [
          { label: 'Électrique 60/94Ah 170/184ch', fuel: 'Electrique', years: range(2013, 2022) },
        ],
      },
    ],
  },

  // ─── MERCEDES ──────────────────────────────────────────────────────────────
  {
    brand: 'Mercedes',
    models: [
      {
        name: 'Classe A',
        years: range(2004, 2026),
        engines: [
          { label: 'A160 / A180 / A200 essence', fuel: 'Essence', years: range(2012, 2026) },
          { label: 'A180d / A200d diesel', fuel: 'Diesel', years: range(2012, 2025) },
          { label: 'A250e Plug-in Hybrid', fuel: 'Hybride', years: range(2019, 2026) },
        ],
      },
      {
        name: 'Classe B',
        years: range(2005, 2026),
        engines: [
          { label: 'B160 / B180 / B200 essence', fuel: 'Essence', years: range(2011, 2026) },
          { label: 'B180d / B200d diesel', fuel: 'Diesel', years: range(2011, 2025) },
          { label: 'B250e Plug-in Hybrid', fuel: 'Hybride', years: range(2019, 2026) },
        ],
      },
      {
        name: 'Classe C',
        years: range(2000, 2026),
        engines: [
          { label: 'C180 / C200 / C300 essence', fuel: 'Essence', years: range(2007, 2026) },
          { label: 'C200d / C220d diesel', fuel: 'Diesel', years: range(2007, 2025) },
          { label: 'C300e / C300de Hybrid', fuel: 'Hybride', years: range(2019, 2026) },
        ],
      },
      {
        name: 'Classe E',
        years: range(2002, 2026),
        engines: [
          { label: 'E200 / E220 / E300 essence', fuel: 'Essence', years: range(2009, 2026) },
          { label: 'E200d / E220d / E300d diesel', fuel: 'Diesel', years: range(2009, 2025) },
          { label: 'E300e / E300de Hybrid', fuel: 'Hybride', years: range(2019, 2026) },
        ],
      },
      {
        name: 'GLA',
        years: range(2014, 2026),
        engines: [
          { label: 'GLA180 / GLA200 essence', fuel: 'Essence', years: range(2014, 2026) },
          { label: 'GLA180d / GLA200d diesel', fuel: 'Diesel', years: range(2014, 2025) },
          { label: 'GLA250e Plug-in Hybrid', fuel: 'Hybride', years: range(2020, 2026) },
          { label: 'EQA 250/350 électrique', fuel: 'Electrique', years: range(2021, 2026) },
        ],
      },
      {
        name: 'GLC',
        years: range(2015, 2026),
        engines: [
          { label: 'GLC200 / GLC300 essence', fuel: 'Essence', years: range(2015, 2026) },
          { label: 'GLC200d / GLC300d diesel', fuel: 'Diesel', years: range(2015, 2025) },
          { label: 'GLC300e Plug-in Hybrid', fuel: 'Hybride', years: range(2019, 2026) },
          { label: 'EQC 400 électrique', fuel: 'Electrique', years: range(2019, 2026) },
        ],
      },
      {
        name: 'Vito',
        years: range(2003, 2026),
        engines: [
          { label: '119 CDI / 116 CDI diesel', fuel: 'Diesel', years: range(2003, 2026) },
          { label: 'eVito électrique', fuel: 'Electrique', years: range(2019, 2026) },
        ],
      },
    ],
  },

  // ─── AUDI ──────────────────────────────────────────────────────────────────
  {
    brand: 'Audi',
    models: [
      {
        name: 'A1',
        years: range(2010, 2026),
        engines: [
          { label: '1.0 / 1.4 TFSI 95/125ch', fuel: 'Essence', years: range(2010, 2026) },
          { label: '1.6 TDI 90/116ch', fuel: 'Diesel', years: range(2010, 2022) },
        ],
      },
      {
        name: 'A3',
        years: range(2003, 2026),
        engines: [
          { label: '1.0 / 1.4 / 1.5 TFSI 116/150ch', fuel: 'Essence', years: range(2012, 2026) },
          { label: '2.0 TFSI 190/230ch', fuel: 'Essence', years: range(2012, 2026) },
          { label: '1.6 / 2.0 TDI 90/116/150ch', fuel: 'Diesel', years: range(2012, 2025) },
          { label: '40 TFSI e Plug-in Hybrid', fuel: 'Hybride', years: range(2019, 2026) },
          { label: 'e-tron électrique', fuel: 'Electrique', years: range(2021, 2026) },
        ],
      },
      {
        name: 'A4',
        years: range(2000, 2026),
        engines: [
          { label: '1.4 / 1.8 / 2.0 TFSI 150/190ch', fuel: 'Essence', years: range(2012, 2026) },
          { label: '2.0 TDI 136/150/190ch', fuel: 'Diesel', years: range(2012, 2025) },
          { label: '55 TFSI e Plug-in Hybrid', fuel: 'Hybride', years: range(2020, 2026) },
        ],
      },
      {
        name: 'A6',
        years: range(1994, 2026),
        engines: [
          { label: '2.0 TFSI 190/252ch', fuel: 'Essence', years: range(2011, 2026) },
          { label: '2.0 / 3.0 TDI 150/204/286ch', fuel: 'Diesel', years: range(2011, 2025) },
          { label: '55 TFSI e / 50 TFSIe Hybrid', fuel: 'Hybride', years: range(2019, 2026) },
        ],
      },
      {
        name: 'Q3',
        years: range(2011, 2026),
        engines: [
          { label: '1.4 / 1.5 TFSI 125/150ch', fuel: 'Essence', years: range(2011, 2026) },
          { label: '2.0 TFSI 190/230ch', fuel: 'Essence', years: range(2011, 2026) },
          { label: '2.0 TDI 120/150ch', fuel: 'Diesel', years: range(2011, 2025) },
          { label: '45 TFSI e Plug-in Hybrid', fuel: 'Hybride', years: range(2020, 2026) },
        ],
      },
      {
        name: 'Q5',
        years: range(2008, 2026),
        engines: [
          { label: '2.0 / 3.0 TFSI 190/340ch', fuel: 'Essence', years: range(2008, 2026) },
          { label: '2.0 / 3.0 TDI 163/204/286ch', fuel: 'Diesel', years: range(2008, 2025) },
          { label: '55 TFSI e Plug-in Hybrid', fuel: 'Hybride', years: range(2020, 2026) },
        ],
      },
      {
        name: 'Q7',
        years: range(2006, 2026),
        engines: [
          { label: '3.0 TFSI V6 333/380ch', fuel: 'Essence', years: range(2015, 2026) },
          { label: '3.0 TDI V6 231/286ch', fuel: 'Diesel', years: range(2006, 2025) },
          { label: '60 TFSI e Plug-in Hybrid', fuel: 'Hybride', years: range(2019, 2026) },
        ],
      },
      {
        name: 'e-tron',
        years: range(2019, 2026),
        engines: [
          { label: 'e-tron 50 300ch électrique', fuel: 'Electrique', years: range(2019, 2026) },
          { label: 'e-tron 55 408ch électrique', fuel: 'Electrique', years: range(2019, 2026) },
          { label: 'Q8 e-tron 55 408ch', fuel: 'Electrique', years: range(2023, 2026) },
        ],
      },
    ],
  },

  // ─── SEAT ──────────────────────────────────────────────────────────────────
  {
    brand: 'Seat',
    models: [
      {
        name: 'Ibiza',
        years: range(2002, 2026),
        engines: [
          { label: '1.0 MPI 75/80ch', fuel: 'Essence', years: range(2015, 2026) },
          { label: '1.0 TSI 95/115ch', fuel: 'Essence', years: range(2015, 2026) },
          { label: '1.6 TDI 80/95ch', fuel: 'Diesel', years: range(2008, 2021) },
        ],
      },
      {
        name: 'Leon',
        years: range(2005, 2026),
        engines: [
          { label: '1.0 TSI 110ch', fuel: 'Essence', years: range(2018, 2026) },
          { label: '1.4 / 1.5 eTSI 130/150ch', fuel: 'Essence', years: range(2012, 2026) },
          { label: '2.0 TSI FR 190/300ch', fuel: 'Essence', years: range(2012, 2026) },
          { label: '1.6 / 2.0 TDI 90/115/150ch', fuel: 'Diesel', years: range(2012, 2024) },
          { label: 'e-Hybrid 204/245ch', fuel: 'Hybride', years: range(2021, 2026) },
        ],
      },
      {
        name: 'Arona',
        years: range(2017, 2026),
        engines: [
          { label: '1.0 TSI 95/110/115ch', fuel: 'Essence', years: range(2017, 2026) },
          { label: '1.5 TSI 150ch', fuel: 'Essence', years: range(2018, 2026) },
          { label: '1.6 TDI 95ch', fuel: 'Diesel', years: range(2017, 2021) },
        ],
      },
      {
        name: 'Ateca',
        years: range(2016, 2026),
        engines: [
          { label: '1.0 / 1.4 / 1.5 TSI 115/150ch', fuel: 'Essence', years: range(2016, 2026) },
          { label: '2.0 TSI 190/300ch', fuel: 'Essence', years: range(2016, 2026) },
          { label: '1.6 / 2.0 TDI 95/115/150ch', fuel: 'Diesel', years: range(2016, 2024) },
        ],
      },
      {
        name: 'Tarraco',
        years: range(2018, 2026),
        engines: [
          { label: '1.4 / 1.5 TSI 150ch', fuel: 'Essence', years: range(2018, 2026) },
          { label: '2.0 TDI 150/190ch', fuel: 'Diesel', years: range(2018, 2025) },
          { label: 'e-Hybrid 245ch', fuel: 'Hybride', years: range(2021, 2026) },
        ],
      },
    ],
  },

  // ─── SKODA ─────────────────────────────────────────────────────────────────
  {
    brand: 'Skoda',
    models: [
      {
        name: 'Fabia',
        years: range(2007, 2026),
        engines: [
          { label: '1.0 MPI 65/75ch', fuel: 'Essence', years: range(2014, 2026) },
          { label: '1.0 TSI 95/115ch', fuel: 'Essence', years: range(2014, 2026) },
          { label: '1.4 TDI / 1.6 TDI', fuel: 'Diesel', years: range(2007, 2021) },
        ],
      },
      {
        name: 'Octavia',
        years: range(2004, 2026),
        engines: [
          { label: '1.0 / 1.4 / 1.5 TSI 110/130/150ch', fuel: 'Essence', years: range(2013, 2026) },
          { label: '2.0 TSI RS 230/245ch', fuel: 'Essence', years: range(2013, 2026) },
          { label: '1.6 / 2.0 TDI 90/115/150ch', fuel: 'Diesel', years: range(2004, 2025) },
          { label: 'iV Plug-in Hybrid 204/245ch', fuel: 'Hybride', years: range(2020, 2026) },
        ],
      },
      {
        name: 'Scala',
        years: range(2019, 2026),
        engines: [
          { label: '1.0 TSI 115ch', fuel: 'Essence', years: range(2019, 2026) },
          { label: '1.5 TSI 150ch', fuel: 'Essence', years: range(2019, 2026) },
          { label: '2.0 TDI 116ch', fuel: 'Diesel', years: range(2019, 2024) },
        ],
      },
      {
        name: 'Kamiq',
        years: range(2019, 2026),
        engines: [
          { label: '1.0 TSI 95/110/115ch', fuel: 'Essence', years: range(2019, 2026) },
          { label: '1.5 TSI 150ch', fuel: 'Essence', years: range(2019, 2026) },
          { label: '2.0 TDI 115ch', fuel: 'Diesel', years: range(2019, 2024) },
        ],
      },
      {
        name: 'Karoq',
        years: range(2017, 2026),
        engines: [
          { label: '1.0 / 1.4 / 1.5 TSI 115/150ch', fuel: 'Essence', years: range(2017, 2026) },
          { label: '2.0 TDI 116/150ch', fuel: 'Diesel', years: range(2017, 2025) },
        ],
      },
      {
        name: 'Kodiaq',
        years: range(2016, 2026),
        engines: [
          { label: '1.4 / 1.5 TSI 125/150ch', fuel: 'Essence', years: range(2016, 2026) },
          { label: '2.0 TSI 180/220ch', fuel: 'Essence', years: range(2016, 2026) },
          { label: '2.0 TDI 115/150/190ch', fuel: 'Diesel', years: range(2016, 2025) },
          { label: 'iV Plug-in Hybrid 204/245ch', fuel: 'Hybride', years: range(2021, 2026) },
        ],
      },
      {
        name: 'Superb',
        years: range(2008, 2026),
        engines: [
          { label: '1.4 / 1.5 / 2.0 TSI 150/190ch', fuel: 'Essence', years: range(2015, 2026) },
          { label: '2.0 TDI 120/150/190ch', fuel: 'Diesel', years: range(2008, 2025) },
          { label: 'iV Plug-in Hybrid 218ch', fuel: 'Hybride', years: range(2020, 2026) },
        ],
      },
    ],
  },

  // ─── OPEL ──────────────────────────────────────────────────────────────────
  {
    brand: 'Opel',
    models: [
      {
        name: 'Corsa',
        years: range(2000, 2026),
        engines: [
          { label: '1.2 PureTech 75/100/130ch', fuel: 'Essence', years: range(2019, 2026) },
          { label: '1.4 75/90/100ch', fuel: 'Essence', years: range(2006, 2019) },
          { label: '1.3 / 1.5 CDTI diesel', fuel: 'Diesel', years: range(2019, 2023) },
          { label: 'Corsa-e électrique 136/156ch', fuel: 'Electrique', years: range(2019, 2026) },
        ],
      },
      {
        name: 'Astra',
        years: range(2004, 2026),
        engines: [
          { label: '1.2 / 1.4 Turbo 110/150ch', fuel: 'Essence', years: range(2015, 2026) },
          { label: '1.5 / 2.0 Diesel 105/122/130ch', fuel: 'Diesel', years: range(2019, 2025) },
          { label: 'Plug-in Hybrid 180/225ch', fuel: 'Hybride', years: range(2022, 2026) },
          { label: 'Astra Electric 156ch', fuel: 'Electrique', years: range(2023, 2026) },
        ],
      },
      {
        name: 'Mokka',
        years: range(2012, 2026),
        engines: [
          { label: '1.2 Turbo 100/130ch', fuel: 'Essence', years: range(2020, 2026) },
          { label: '1.4 Turbo 120/140ch', fuel: 'Essence', years: range(2012, 2020) },
          { label: '1.5 / 1.6 CDTI diesel', fuel: 'Diesel', years: range(2012, 2022) },
          { label: 'Mokka-e électrique 136/156ch', fuel: 'Electrique', years: range(2021, 2026) },
        ],
      },
      {
        name: 'Grandland',
        years: range(2017, 2026),
        engines: [
          { label: '1.2 Turbo 130ch', fuel: 'Essence', years: range(2017, 2026) },
          { label: '1.5 BlueHDi 130ch', fuel: 'Diesel', years: range(2017, 2024) },
          { label: 'Plug-in Hybrid 224/300ch', fuel: 'Hybride', years: range(2020, 2026) },
          { label: 'Électrique 213/240ch', fuel: 'Electrique', years: range(2024, 2026) },
        ],
      },
      {
        name: 'Vivaro',
        years: range(2001, 2026),
        engines: [
          { label: '2.0 BlueHDi 120/145ch', fuel: 'Diesel', years: range(2019, 2026) },
          { label: 'Vivaro-e électrique', fuel: 'Electrique', years: range(2020, 2026) },
        ],
      },
    ],
  },

  // ─── MINI ──────────────────────────────────────────────────────────────────
  {
    brand: 'MINI',
    models: [
      {
        name: 'Mini 3 portes',
        years: range(2001, 2026),
        engines: [
          { label: 'One / Cooper 75/136ch', fuel: 'Essence', years: range(2001, 2026) },
          { label: 'Cooper S 178/192ch', fuel: 'Essence', years: range(2006, 2026) },
          { label: 'One D / Cooper D 95/115ch', fuel: 'Diesel', years: range(2003, 2025) },
          { label: 'SE Cooper électrique', fuel: 'Electrique', years: range(2019, 2026) },
        ],
      },
      {
        name: 'Mini Clubman',
        years: range(2007, 2024),
        engines: [
          { label: 'One / Cooper 102/136ch', fuel: 'Essence', years: range(2007, 2024) },
          { label: 'Cooper S 192ch', fuel: 'Essence', years: range(2007, 2024) },
          { label: 'Cooper D / SD diesel', fuel: 'Diesel', years: range(2007, 2024) },
        ],
      },
      {
        name: 'Mini Countryman',
        years: range(2010, 2026),
        engines: [
          { label: 'One / Cooper 102/136ch', fuel: 'Essence', years: range(2010, 2026) },
          { label: 'Cooper S 178/192ch', fuel: 'Essence', years: range(2010, 2026) },
          { label: 'Cooper D / SD 110/150ch', fuel: 'Diesel', years: range(2010, 2025) },
          { label: 'Cooper SE All4 Hybrid', fuel: 'Hybride', years: range(2017, 2026) },
          { label: 'SE électrique 204/313ch', fuel: 'Electrique', years: range(2024, 2026) },
        ],
      },
    ],
  },

  // ─── TOYOTA ────────────────────────────────────────────────────────────────
  {
    brand: 'Toyota',
    models: [
      {
        name: 'Aygo / Aygo X',
        years: range(2005, 2026),
        engines: [
          { label: '1.0 VVT-i 72ch', fuel: 'Essence', years: range(2005, 2014) },
          { label: '1.0 VVT-i 69/72ch', fuel: 'Essence', years: range(2014, 2026) },
        ],
      },
      {
        name: 'Yaris',
        years: range(2001, 2026),
        engines: [
          { label: '1.0 VVT-i 69/72ch', fuel: 'Essence', years: range(2001, 2020) },
          { label: '1.5 VVT-i / Dynamic Force', fuel: 'Essence', years: range(2017, 2026) },
          { label: 'Hybrid 100/116ch', fuel: 'Hybride', years: range(2012, 2026) },
          { label: 'GR Yaris 261ch', fuel: 'Essence', years: range(2020, 2026) },
        ],
      },
      {
        name: 'Yaris Cross',
        years: range(2021, 2026),
        engines: [
          { label: '1.5 Hybrid 116ch', fuel: 'Hybride', years: range(2021, 2026) },
          { label: '1.5 Hybrid AWD-i 130ch', fuel: 'Hybride', years: range(2021, 2026) },
        ],
      },
      {
        name: 'Corolla',
        years: range(2002, 2026),
        engines: [
          { label: '1.2 Turbo 116ch', fuel: 'Essence', years: range(2019, 2026) },
          { label: 'Hybrid 122/140ch', fuel: 'Hybride', years: range(2019, 2026) },
          { label: 'Hybrid 196ch GR Sport', fuel: 'Hybride', years: range(2021, 2026) },
        ],
      },
      {
        name: 'C-HR',
        years: range(2016, 2026),
        engines: [
          { label: '1.2 Turbo 116ch', fuel: 'Essence', years: range(2016, 2022) },
          { label: 'Hybrid 122/140ch', fuel: 'Hybride', years: range(2016, 2026) },
          { label: 'Plug-in Hybrid 223ch', fuel: 'Hybride', years: range(2023, 2026) },
        ],
      },
      {
        name: 'RAV4',
        years: range(2000, 2026),
        engines: [
          { label: '2.0 VVT-i 151ch', fuel: 'Essence', years: range(2013, 2019) },
          { label: '2.5 Hybrid AWD 218ch', fuel: 'Hybride', years: range(2016, 2026) },
          { label: 'Plug-in Hybrid AWD 306ch', fuel: 'Hybride', years: range(2020, 2026) },
        ],
      },
      {
        name: 'Prius',
        years: range(2004, 2026),
        engines: [
          { label: 'Hybrid 122/136ch', fuel: 'Hybride', years: range(2004, 2026) },
          { label: 'Plug-in Hybrid 122/223ch', fuel: 'Hybride', years: range(2012, 2026) },
        ],
      },
      {
        name: 'bZ4X',
        years: range(2022, 2026),
        engines: [
          { label: 'Électrique FWD 204ch', fuel: 'Electrique', years: range(2022, 2026) },
          { label: 'Électrique AWD 218ch', fuel: 'Electrique', years: range(2022, 2026) },
        ],
      },
      {
        name: 'Land Cruiser',
        years: range(1996, 2026),
        engines: [
          { label: '2.8 D-4D 204ch', fuel: 'Diesel', years: range(2015, 2026) },
          { label: '3.0 D-4D 190ch', fuel: 'Diesel', years: range(2002, 2015) },
          { label: '4.0 V6 VVT-i 276ch', fuel: 'Essence', years: range(2009, 2021) },
        ],
      },
      {
        name: 'Hilux',
        years: range(2005, 2026),
        engines: [
          { label: '2.4 D-4D 150ch', fuel: 'Diesel', years: range(2015, 2026) },
          { label: '2.8 D-4D 177/204ch', fuel: 'Diesel', years: range(2015, 2026) },
        ],
      },
    ],
  },

  // ─── NISSAN ────────────────────────────────────────────────────────────────
  {
    brand: 'Nissan',
    models: [
      {
        name: 'Micra',
        years: range(2003, 2023),
        engines: [
          { label: '1.0 IG-T 92/100ch', fuel: 'Essence', years: range(2017, 2023) },
          { label: '0.9 DIG-T 90ch', fuel: 'Essence', years: range(2017, 2022) },
          { label: '1.5 dCi 90ch', fuel: 'Diesel', years: range(2017, 2023) },
        ],
      },
      {
        name: 'Juke',
        years: range(2010, 2026),
        engines: [
          { label: '1.0 DIG-T 114ch', fuel: 'Essence', years: range(2019, 2026) },
          { label: '1.5 dCi 110ch', fuel: 'Diesel', years: range(2010, 2019) },
          { label: 'Hybrid 143ch', fuel: 'Hybride', years: range(2022, 2026) },
        ],
      },
      {
        name: 'Qashqai',
        years: range(2007, 2026),
        engines: [
          { label: '1.2 DIG-T 115ch', fuel: 'Essence', years: range(2014, 2018) },
          { label: '1.3 DIG-T MHEV 140/158ch', fuel: 'Essence', years: range(2018, 2026) },
          { label: '1.5 dCi 110/115ch', fuel: 'Diesel', years: range(2007, 2020) },
          { label: 'e-Power Hybrid 190ch', fuel: 'Hybride', years: range(2022, 2026) },
        ],
      },
      {
        name: 'X-Trail',
        years: range(2001, 2026),
        engines: [
          { label: '1.3 DIG-T 158ch', fuel: 'Essence', years: range(2021, 2026) },
          { label: '2.0 dCi 130/177ch', fuel: 'Diesel', years: range(2007, 2021) },
          { label: 'e-Power Hybrid AWD', fuel: 'Hybride', years: range(2022, 2026) },
        ],
      },
      {
        name: 'Leaf',
        years: range(2011, 2026),
        engines: [
          { label: 'Électrique 24/30kWh 109ch', fuel: 'Electrique', years: range(2011, 2017) },
          { label: 'Électrique 40kWh 150ch', fuel: 'Electrique', years: range(2018, 2026) },
          { label: 'Électrique 62kWh 217ch', fuel: 'Electrique', years: range(2019, 2026) },
        ],
      },
    ],
  },

  // ─── HYUNDAI ───────────────────────────────────────────────────────────────
  {
    brand: 'Hyundai',
    models: [
      {
        name: 'i20',
        years: range(2008, 2026),
        engines: [
          { label: '1.0 T-GDi 100/120ch', fuel: 'Essence', years: range(2014, 2026) },
          { label: '1.2 MPi 84ch', fuel: 'Essence', years: range(2008, 2026) },
          { label: '1.4 / 1.6 CRDi 90ch', fuel: 'Diesel', years: range(2009, 2021) },
          { label: 'N Line 1.0 T-GDi 120ch', fuel: 'Essence', years: range(2021, 2026) },
        ],
      },
      {
        name: 'i30',
        years: range(2007, 2026),
        engines: [
          { label: '1.0 / 1.4 T-GDi 100/140ch', fuel: 'Essence', years: range(2017, 2026) },
          { label: '1.6 T-GDi 204ch N Line', fuel: 'Essence', years: range(2017, 2026) },
          { label: '1.6 CRDi 110/136ch', fuel: 'Diesel', years: range(2011, 2024) },
          { label: 'Hybrid 140ch', fuel: 'Hybride', years: range(2020, 2026) },
        ],
      },
      {
        name: 'Tucson',
        years: range(2004, 2026),
        engines: [
          { label: '1.6 T-GDi 150/180ch', fuel: 'Essence', years: range(2015, 2026) },
          { label: '1.6 / 2.0 CRDi 115/136ch', fuel: 'Diesel', years: range(2015, 2023) },
          { label: 'Hybrid / Plug-in Hybrid 230ch', fuel: 'Hybride', years: range(2021, 2026) },
        ],
      },
      {
        name: 'Kona',
        years: range(2017, 2026),
        engines: [
          { label: '1.0 T-GDi 120ch', fuel: 'Essence', years: range(2017, 2026) },
          { label: '1.6 T-GDi 198ch', fuel: 'Essence', years: range(2017, 2026) },
          { label: '1.6 CRDi 115/136ch', fuel: 'Diesel', years: range(2017, 2023) },
          { label: 'Hybrid 141ch', fuel: 'Hybride', years: range(2020, 2026) },
          { label: 'Électrique 39/64kWh 136/204ch', fuel: 'Electrique', years: range(2018, 2026) },
        ],
      },
      {
        name: 'IONIQ 5',
        years: range(2021, 2026),
        engines: [
          { label: 'Électrique 58/77kWh RWD 170/218ch', fuel: 'Electrique', years: range(2021, 2026) },
          { label: 'Électrique 77kWh AWD 325ch', fuel: 'Electrique', years: range(2021, 2026) },
        ],
      },
      {
        name: 'Santa Fe',
        years: range(2006, 2026),
        engines: [
          { label: '2.5 GDi T 190/281ch', fuel: 'Essence', years: range(2020, 2026) },
          { label: '2.0 / 2.2 CRDi 150/200ch', fuel: 'Diesel', years: range(2006, 2024) },
          { label: 'Plug-in Hybrid 4WD 265ch', fuel: 'Hybride', years: range(2021, 2026) },
        ],
      },
    ],
  },

  // ─── KIA ───────────────────────────────────────────────────────────────────
  {
    brand: 'Kia',
    models: [
      {
        name: 'Picanto',
        years: range(2004, 2026),
        engines: [
          { label: '1.0 MPI 67/69ch', fuel: 'Essence', years: range(2011, 2026) },
          { label: '1.2 DOHC 84ch', fuel: 'Essence', years: range(2011, 2026) },
          { label: '1.0 T-GDi 100/120ch', fuel: 'Essence', years: range(2017, 2026) },
        ],
      },
      {
        name: 'Ceed',
        years: range(2007, 2026),
        engines: [
          { label: '1.0 / 1.4 T-GDi 100/140ch', fuel: 'Essence', years: range(2012, 2026) },
          { label: '1.6 T-GDi 201ch GT', fuel: 'Essence', years: range(2018, 2026) },
          { label: '1.6 CRDi 115/136ch', fuel: 'Diesel', years: range(2012, 2024) },
          { label: 'Plug-in Hybrid 141ch', fuel: 'Hybride', years: range(2020, 2026) },
        ],
      },
      {
        name: 'Sportage',
        years: range(2004, 2026),
        engines: [
          { label: '1.6 T-GDi 150/180ch', fuel: 'Essence', years: range(2015, 2026) },
          { label: '1.6 / 2.0 CRDi 115/136ch', fuel: 'Diesel', years: range(2015, 2024) },
          { label: 'Hybrid / Plug-in Hybrid 215/265ch', fuel: 'Hybride', years: range(2021, 2026) },
        ],
      },
      {
        name: 'Niro',
        years: range(2016, 2026),
        engines: [
          { label: 'Hybrid 141ch', fuel: 'Hybride', years: range(2016, 2026) },
          { label: 'Plug-in Hybrid 141ch', fuel: 'Hybride', years: range(2017, 2026) },
          { label: 'Électrique 64kWh 204ch', fuel: 'Electrique', years: range(2019, 2026) },
        ],
      },
      {
        name: 'EV6',
        years: range(2021, 2026),
        engines: [
          { label: 'Électrique 58/77kWh RWD 170/228ch', fuel: 'Electrique', years: range(2021, 2026) },
          { label: 'Électrique 77kWh AWD 325ch', fuel: 'Electrique', years: range(2021, 2026) },
          { label: 'GT AWD 585ch', fuel: 'Electrique', years: range(2022, 2026) },
        ],
      },
      {
        name: 'Sorento',
        years: range(2002, 2026),
        engines: [
          { label: '1.6 T-GDi 177ch', fuel: 'Essence', years: range(2020, 2026) },
          { label: '2.2 CRDi 200ch', fuel: 'Diesel', years: range(2015, 2024) },
          { label: 'Plug-in Hybrid AWD 265ch', fuel: 'Hybride', years: range(2021, 2026) },
        ],
      },
    ],
  },

  // ─── HONDA ─────────────────────────────────────────────────────────────────
  {
    brand: 'Honda',
    models: [
      {
        name: 'Jazz',
        years: range(2002, 2026),
        engines: [
          { label: '1.2 i-VTEC 90ch', fuel: 'Essence', years: range(2008, 2020) },
          { label: '1.5 i-MMD Hybrid 109ch', fuel: 'Hybride', years: range(2020, 2026) },
        ],
      },
      {
        name: 'Civic',
        years: range(2001, 2026),
        engines: [
          { label: '1.0 i-VTEC Turbo 129ch', fuel: 'Essence', years: range(2017, 2021) },
          { label: '1.5 i-VTEC Turbo 182ch', fuel: 'Essence', years: range(2017, 2026) },
          { label: '2.0 i-MMD Hybrid 184ch', fuel: 'Hybride', years: range(2022, 2026) },
        ],
      },
      {
        name: 'HR-V',
        years: range(2015, 2026),
        engines: [
          { label: '1.5 i-VTEC 130ch', fuel: 'Essence', years: range(2015, 2022) },
          { label: '1.5 e-HEV Hybrid 131ch', fuel: 'Hybride', years: range(2021, 2026) },
        ],
      },
      {
        name: 'CR-V',
        years: range(2002, 2026),
        engines: [
          { label: '1.5 VTEC Turbo 173/193ch', fuel: 'Essence', years: range(2018, 2026) },
          { label: '2.0 i-MMD Hybrid AWD 184ch', fuel: 'Hybride', years: range(2018, 2026) },
          { label: 'Plug-in Hybrid 184ch', fuel: 'Hybride', years: range(2023, 2026) },
        ],
      },
      {
        name: 'e:Ny1',
        years: range(2023, 2026),
        engines: [
          { label: 'Électrique 68kWh 204ch', fuel: 'Electrique', years: range(2023, 2026) },
        ],
      },
    ],
  },

  // ─── MAZDA ─────────────────────────────────────────────────────────────────
  {
    brand: 'Mazda',
    models: [
      {
        name: 'Mazda2',
        years: range(2007, 2026),
        engines: [
          { label: '1.5 Skyactiv-G 75/90/115ch', fuel: 'Essence', years: range(2014, 2026) },
          { label: 'Hybrid 116ch (Toyota)', fuel: 'Hybride', years: range(2022, 2026) },
        ],
      },
      {
        name: 'Mazda3',
        years: range(2003, 2026),
        engines: [
          { label: '1.5 / 2.0 Skyactiv-G 100/122/150ch', fuel: 'Essence', years: range(2014, 2026) },
          { label: '2.0 Skyactiv-X 186ch', fuel: 'Essence', years: range(2019, 2026) },
          { label: '1.8 Skyactiv-D 116ch', fuel: 'Diesel', years: range(2019, 2025) },
          { label: 'e-Skyactiv Mild Hybrid', fuel: 'Hybride', years: range(2021, 2026) },
        ],
      },
      {
        name: 'Mazda6',
        years: range(2002, 2023),
        engines: [
          { label: '2.0 Skyactiv-G 145/165ch', fuel: 'Essence', years: range(2012, 2023) },
          { label: '2.5 Skyactiv-G 194ch', fuel: 'Essence', years: range(2015, 2023) },
          { label: '2.2 Skyactiv-D 150/184ch', fuel: 'Diesel', years: range(2012, 2023) },
        ],
      },
      {
        name: 'CX-3',
        years: range(2015, 2023),
        engines: [
          { label: '2.0 Skyactiv-G 121/150ch', fuel: 'Essence', years: range(2015, 2023) },
          { label: '1.8 Skyactiv-D 116ch', fuel: 'Diesel', years: range(2015, 2023) },
        ],
      },
      {
        name: 'CX-30',
        years: range(2019, 2026),
        engines: [
          { label: '2.0 Skyactiv-G 122/150ch', fuel: 'Essence', years: range(2019, 2026) },
          { label: '2.0 Skyactiv-X 186ch', fuel: 'Essence', years: range(2019, 2026) },
          { label: 'e-Skyactiv 2.0 Mild Hybrid', fuel: 'Hybride', years: range(2021, 2026) },
        ],
      },
      {
        name: 'CX-5',
        years: range(2012, 2026),
        engines: [
          { label: '2.0 Skyactiv-G 165ch', fuel: 'Essence', years: range(2012, 2026) },
          { label: '2.5 Skyactiv-G 194ch', fuel: 'Essence', years: range(2017, 2026) },
          { label: '2.2 Skyactiv-D 150/184ch', fuel: 'Diesel', years: range(2012, 2025) },
        ],
      },
      {
        name: 'MX-5',
        years: range(1989, 2026),
        engines: [
          { label: '1.5 Skyactiv-G 132ch', fuel: 'Essence', years: range(2015, 2026) },
          { label: '2.0 Skyactiv-G 160/184ch', fuel: 'Essence', years: range(2015, 2026) },
        ],
      },
    ],
  },

  // ─── SUZUKI ────────────────────────────────────────────────────────────────
  {
    brand: 'Suzuki',
    models: [
      {
        name: 'Swift',
        years: range(2004, 2026),
        engines: [
          { label: '1.0 Boosterjet 111ch', fuel: 'Essence', years: range(2018, 2026) },
          { label: '1.2 DualJet Mild Hybrid 83/90ch', fuel: 'Hybride', years: range(2018, 2026) },
        ],
      },
      {
        name: 'Vitara',
        years: range(2015, 2026),
        engines: [
          { label: '1.4 Boosterjet 129/140ch', fuel: 'Essence', years: range(2015, 2026) },
          { label: '1.5 Mild Hybrid 102ch', fuel: 'Hybride', years: range(2021, 2026) },
        ],
      },
      {
        name: 'S-Cross',
        years: range(2013, 2026),
        engines: [
          { label: '1.0 / 1.4 Boosterjet 111/129ch', fuel: 'Essence', years: range(2013, 2026) },
          { label: '1.5 Hybrid 140ch', fuel: 'Hybride', years: range(2022, 2026) },
        ],
      },
      {
        name: 'Jimny',
        years: range(1998, 2026),
        engines: [
          { label: '1.3 80ch', fuel: 'Essence', years: range(1998, 2018) },
          { label: '1.5 102ch', fuel: 'Essence', years: range(2018, 2026) },
        ],
      },
      {
        name: 'Ignis',
        years: range(2016, 2026),
        engines: [
          { label: '1.2 DualJet Mild Hybrid 83/90ch', fuel: 'Hybride', years: range(2016, 2026) },
        ],
      },
    ],
  },

  // ─── MITSUBISHI ────────────────────────────────────────────────────────────
  {
    brand: 'Mitsubishi',
    models: [
      {
        name: 'ASX',
        years: range(2010, 2026),
        engines: [
          { label: '1.0 / 1.3 Turbo 109/140ch', fuel: 'Essence', years: range(2022, 2026) },
          { label: '1.6 MIVEC 117ch', fuel: 'Essence', years: range(2010, 2022) },
          { label: 'Hybrid 140ch (Renault Kaptur)', fuel: 'Hybride', years: range(2023, 2026) },
        ],
      },
      {
        name: 'Eclipse Cross',
        years: range(2017, 2026),
        engines: [
          { label: '1.5 Turbo 163ch', fuel: 'Essence', years: range(2017, 2022) },
          { label: 'Plug-in Hybrid 188ch', fuel: 'Hybride', years: range(2021, 2026) },
        ],
      },
      {
        name: 'Outlander',
        years: range(2003, 2026),
        engines: [
          { label: '2.0 MIVEC 150ch', fuel: 'Essence', years: range(2007, 2022) },
          { label: '2.0 Plug-in Hybrid 200ch', fuel: 'Hybride', years: range(2014, 2026) },
          { label: '2.5 Plug-in Hybrid AWD 248ch', fuel: 'Hybride', years: range(2022, 2026) },
        ],
      },
      {
        name: 'L200',
        years: range(2006, 2026),
        engines: [
          { label: '2.2 DI-D 150/154ch', fuel: 'Diesel', years: range(2015, 2026) },
          { label: '2.4 DI-D 150/180ch', fuel: 'Diesel', years: range(2015, 2026) },
        ],
      },
    ],
  },

  // ─── FORD ──────────────────────────────────────────────────────────────────
  {
    brand: 'Ford',
    models: [
      {
        name: 'Fiesta',
        years: range(2002, 2023),
        engines: [
          { label: '1.0 EcoBoost 100/125ch', fuel: 'Essence', years: range(2012, 2023) },
          { label: '1.1 Ti-VCT 75/85ch', fuel: 'Essence', years: range(2017, 2023) },
          { label: '1.5 TDCi 85/100ch', fuel: 'Diesel', years: range(2012, 2020) },
          { label: 'ST 1.5 EcoBoost 200ch', fuel: 'Essence', years: range(2013, 2022) },
        ],
      },
      {
        name: 'Focus',
        years: range(2004, 2025),
        engines: [
          { label: '1.0 EcoBoost 100/125ch', fuel: 'Essence', years: range(2012, 2025) },
          { label: '1.5 EcoBoost 150/182ch', fuel: 'Essence', years: range(2014, 2025) },
          { label: '2.0 EcoBlue TDCi 115/150ch', fuel: 'Diesel', years: range(2011, 2024) },
          { label: 'ST 2.3 EcoBoost 280ch', fuel: 'Essence', years: range(2019, 2025) },
        ],
      },
      {
        name: 'Puma',
        years: range(2019, 2026),
        engines: [
          { label: '1.0 EcoBoost mHEV 125/155ch', fuel: 'Hybride', years: range(2019, 2026) },
          { label: 'ST 1.5 EcoBoost 200ch', fuel: 'Essence', years: range(2020, 2026) },
        ],
      },
      {
        name: 'Kuga',
        years: range(2008, 2026),
        engines: [
          { label: '1.5 EcoBoost 120/150ch', fuel: 'Essence', years: range(2013, 2026) },
          { label: '2.0 EcoBlue TDCi 120/150ch', fuel: 'Diesel', years: range(2016, 2024) },
          { label: 'Hybrid / PHEV 180/225ch', fuel: 'Hybride', years: range(2020, 2026) },
        ],
      },
      {
        name: 'EcoSport',
        years: range(2014, 2024),
        engines: [
          { label: '1.0 EcoBoost 100/125ch', fuel: 'Essence', years: range(2014, 2024) },
          { label: '1.5 TDCi 100ch', fuel: 'Diesel', years: range(2014, 2020) },
        ],
      },
      {
        name: 'Mondeo',
        years: range(2007, 2022),
        engines: [
          { label: '1.5 / 2.0 EcoBoost 160/203ch', fuel: 'Essence', years: range(2014, 2022) },
          { label: '2.0 TDCi 120/150/180ch', fuel: 'Diesel', years: range(2007, 2022) },
          { label: 'HEV Hybrid 187ch', fuel: 'Hybride', years: range(2015, 2022) },
        ],
      },
      {
        name: 'Mustang Mach-E',
        years: range(2021, 2026),
        engines: [
          { label: 'Électrique 75/99kWh 269/351ch', fuel: 'Electrique', years: range(2021, 2026) },
          { label: 'GT Électrique 487ch', fuel: 'Electrique', years: range(2021, 2026) },
        ],
      },
      {
        name: 'Transit',
        years: range(2006, 2026),
        engines: [
          { label: '2.0 EcoBlue 105/130/170ch', fuel: 'Diesel', years: range(2016, 2026) },
          { label: 'E-Transit électrique 184ch', fuel: 'Electrique', years: range(2022, 2026) },
        ],
      },
    ],
  },

  // ─── VOLVO ─────────────────────────────────────────────────────────────────
  {
    brand: 'Volvo',
    models: [
      {
        name: 'XC40',
        years: range(2018, 2026),
        engines: [
          { label: 'B3 / B4 petrol 163/197ch', fuel: 'Essence', years: range(2018, 2026) },
          { label: 'T5 / Recharge Plug-in Hybrid', fuel: 'Hybride', years: range(2020, 2026) },
          { label: 'Recharge électrique 231/408ch', fuel: 'Electrique', years: range(2020, 2026) },
        ],
      },
      {
        name: 'XC60',
        years: range(2008, 2026),
        engines: [
          { label: 'B4 / B5 petrol 197/250ch', fuel: 'Essence', years: range(2017, 2026) },
          { label: 'B4d / B5d diesel 197ch', fuel: 'Diesel', years: range(2017, 2025) },
          { label: 'T6 / T8 Recharge Plug-in Hybrid', fuel: 'Hybride', years: range(2017, 2026) },
        ],
      },
      {
        name: 'XC90',
        years: range(2002, 2026),
        engines: [
          { label: 'B5 petrol 250ch', fuel: 'Essence', years: range(2015, 2026) },
          { label: 'B5d diesel 235ch', fuel: 'Diesel', years: range(2015, 2025) },
          { label: 'T8 Recharge Plug-in Hybrid 455ch', fuel: 'Hybride', years: range(2015, 2026) },
        ],
      },
      {
        name: 'V40',
        years: range(2012, 2019),
        engines: [
          { label: 'T2 / T3 122/152ch', fuel: 'Essence', years: range(2012, 2019) },
          { label: 'D2 / D3 diesel 120/150ch', fuel: 'Diesel', years: range(2012, 2019) },
        ],
      },
      {
        name: 'V60',
        years: range(2010, 2026),
        engines: [
          { label: 'B3 / B4 163/197ch', fuel: 'Essence', years: range(2018, 2026) },
          { label: 'B4d / B5d diesel 197ch', fuel: 'Diesel', years: range(2018, 2025) },
          { label: 'T6 / T8 Recharge Plug-in Hybrid', fuel: 'Hybride', years: range(2018, 2026) },
        ],
      },
    ],
  },

  // ─── FIAT ──────────────────────────────────────────────────────────────────
  {
    brand: 'Fiat',
    models: [
      {
        name: '500',
        years: range(2007, 2026),
        engines: [
          { label: '1.2 69ch', fuel: 'Essence', years: range(2007, 2020) },
          { label: '0.9 TwinAir 85/105ch', fuel: 'Essence', years: range(2010, 2020) },
          { label: '1.0 Hybrid 70ch', fuel: 'Hybride', years: range(2020, 2026) },
          { label: '500e électrique 118ch', fuel: 'Electrique', years: range(2020, 2026) },
        ],
      },
      {
        name: 'Panda',
        years: range(2003, 2026),
        engines: [
          { label: '0.9 TwinAir 65/85ch', fuel: 'Essence', years: range(2010, 2021) },
          { label: '1.0 Hybrid 70ch', fuel: 'Hybride', years: range(2020, 2026) },
          { label: '1.2 69ch', fuel: 'Essence', years: range(2003, 2020) },
          { label: '1.3 Multijet 75/85ch', fuel: 'Diesel', years: range(2003, 2021) },
          { label: 'Panda Cross 1.3 Multijet 4x4', fuel: 'Diesel', years: range(2014, 2021) },
        ],
      },
      {
        name: '500X',
        years: range(2014, 2026),
        engines: [
          { label: '1.0 / 1.3 Firefly 120/150ch', fuel: 'Essence', years: range(2018, 2026) },
          { label: '2.0 MultiJet 136ch', fuel: 'Diesel', years: range(2014, 2020) },
          { label: '1.5 Hybrid 130ch', fuel: 'Hybride', years: range(2022, 2026) },
        ],
      },
      {
        name: 'Tipo',
        years: range(2015, 2024),
        engines: [
          { label: '1.0 / 1.4 FireFly 100/120ch', fuel: 'Essence', years: range(2015, 2024) },
          { label: '1.3 / 1.6 Multijet 95/120ch', fuel: 'Diesel', years: range(2015, 2023) },
        ],
      },
      {
        name: 'Ducato',
        years: range(2006, 2026),
        engines: [
          { label: '2.0 / 2.3 Multijet 115/130/160ch', fuel: 'Diesel', years: range(2011, 2026) },
          { label: 'e-Ducato électrique', fuel: 'Electrique', years: range(2021, 2026) },
        ],
      },
    ],
  },

  // ─── ALFA ROMEO ────────────────────────────────────────────────────────────
  {
    brand: 'Alfa Romeo',
    models: [
      {
        name: 'Giulietta',
        years: range(2010, 2020),
        engines: [
          { label: '1.4 TB 120/170ch', fuel: 'Essence', years: range(2010, 2020) },
          { label: '1.6 / 2.0 JTDm 105/120/150ch', fuel: 'Diesel', years: range(2010, 2020) },
          { label: 'QV 1750 TBi 240ch', fuel: 'Essence', years: range(2010, 2020) },
        ],
      },
      {
        name: 'Giulia',
        years: range(2016, 2026),
        engines: [
          { label: '2.0 Turbo 200/280ch', fuel: 'Essence', years: range(2016, 2026) },
          { label: '2.2 Diesel 160/190ch', fuel: 'Diesel', years: range(2016, 2024) },
          { label: 'Quadrifoglio 2.9 V6 520ch', fuel: 'Essence', years: range(2016, 2026) },
        ],
      },
      {
        name: 'Stelvio',
        years: range(2017, 2026),
        engines: [
          { label: '2.0 Turbo 200/280ch', fuel: 'Essence', years: range(2017, 2026) },
          { label: '2.2 Diesel 160/190ch', fuel: 'Diesel', years: range(2017, 2024) },
          { label: 'Quadrifoglio 2.9 V6 520ch', fuel: 'Essence', years: range(2017, 2026) },
        ],
      },
      {
        name: 'Tonale',
        years: range(2022, 2026),
        engines: [
          { label: '1.5 Hybrid 130/160ch', fuel: 'Hybride', years: range(2022, 2026) },
          { label: '1.3 Plug-in Hybrid 280ch', fuel: 'Hybride', years: range(2022, 2026) },
        ],
      },
    ],
  },

  // ─── JEEP ──────────────────────────────────────────────────────────────────
  {
    brand: 'Jeep',
    models: [
      {
        name: 'Renegade',
        years: range(2014, 2026),
        engines: [
          { label: '1.0 / 1.3 Turbo 120/150/180ch', fuel: 'Essence', years: range(2018, 2026) },
          { label: '2.0 MultiJet 120ch', fuel: 'Diesel', years: range(2014, 2022) },
          { label: '4xe Plug-in Hybrid 190/240ch', fuel: 'Hybride', years: range(2020, 2026) },
        ],
      },
      {
        name: 'Compass',
        years: range(2017, 2026),
        engines: [
          { label: '1.3 Turbo 130/150/180ch', fuel: 'Essence', years: range(2017, 2026) },
          { label: '2.0 MultiJet 140/170ch', fuel: 'Diesel', years: range(2017, 2024) },
          { label: '4xe Plug-in Hybrid 190/240ch', fuel: 'Hybride', years: range(2020, 2026) },
        ],
      },
      {
        name: 'Avenger',
        years: range(2023, 2026),
        engines: [
          { label: '1.2 Turbo 100ch', fuel: 'Essence', years: range(2023, 2026) },
          { label: 'Électrique 156ch', fuel: 'Electrique', years: range(2023, 2026) },
          { label: 'e-Hybrid 136ch', fuel: 'Hybride', years: range(2023, 2026) },
        ],
      },
    ],
  },

  // ─── LAND ROVER ────────────────────────────────────────────────────────────
  {
    brand: 'Land Rover',
    models: [
      {
        name: 'Range Rover Evoque',
        years: range(2011, 2026),
        engines: [
          { label: '1.5 P160 / P300e Hybrid', fuel: 'Hybride', years: range(2019, 2026) },
          { label: '2.0 D180 / D200 diesel', fuel: 'Diesel', years: range(2011, 2025) },
          { label: '2.0 P200 / P250 petrol', fuel: 'Essence', years: range(2019, 2026) },
        ],
      },
      {
        name: 'Range Rover Sport',
        years: range(2005, 2026),
        engines: [
          { label: '2.0 P300 / P400e Hybrid', fuel: 'Hybride', years: range(2018, 2026) },
          { label: '3.0 D250 / D350 diesel', fuel: 'Diesel', years: range(2017, 2025) },
          { label: '4.4 P530 BMW V8', fuel: 'Essence', years: range(2022, 2026) },
        ],
      },
      {
        name: 'Defender',
        years: range(2020, 2026),
        engines: [
          { label: '2.0 D200 diesel 200ch', fuel: 'Diesel', years: range(2020, 2026) },
          { label: '3.0 D250 / D300 diesel', fuel: 'Diesel', years: range(2020, 2026) },
          { label: '2.0 P300 / P400e Hybrid', fuel: 'Hybride', years: range(2021, 2026) },
        ],
      },
      {
        name: 'Discovery Sport',
        years: range(2014, 2026),
        engines: [
          { label: '1.5 P160 / P200 petrol', fuel: 'Essence', years: range(2020, 2026) },
          { label: '2.0 D150 / D165 diesel', fuel: 'Diesel', years: range(2014, 2025) },
          { label: 'P300e Plug-in Hybrid', fuel: 'Hybride', years: range(2020, 2026) },
        ],
      },
    ],
  },

  // ─── TESLA ─────────────────────────────────────────────────────────────────
  {
    brand: 'Tesla',
    models: [
      {
        name: 'Model 3',
        years: range(2019, 2026),
        engines: [
          { label: 'Standard Range RWD 283ch', fuel: 'Electrique', years: range(2019, 2026) },
          { label: 'Long Range AWD 440ch', fuel: 'Electrique', years: range(2019, 2026) },
          { label: 'Performance AWD 460ch', fuel: 'Electrique', years: range(2019, 2026) },
        ],
      },
      {
        name: 'Model Y',
        years: range(2021, 2026),
        engines: [
          { label: 'RWD 286ch', fuel: 'Electrique', years: range(2021, 2026) },
          { label: 'Long Range AWD 453ch', fuel: 'Electrique', years: range(2021, 2026) },
          { label: 'Performance AWD 476ch', fuel: 'Electrique', years: range(2021, 2026) },
        ],
      },
      {
        name: 'Model S',
        years: range(2013, 2026),
        engines: [
          { label: 'Long Range AWD 670ch', fuel: 'Electrique', years: range(2013, 2026) },
          { label: 'Plaid tri-moteur 1020ch', fuel: 'Electrique', years: range(2021, 2026) },
        ],
      },
      {
        name: 'Model X',
        years: range(2016, 2026),
        engines: [
          { label: 'Long Range AWD 670ch', fuel: 'Electrique', years: range(2016, 2026) },
          { label: 'Plaid tri-moteur 1020ch', fuel: 'Electrique', years: range(2021, 2026) },
        ],
      },
    ],
  },

  // ─── PORSCHE ───────────────────────────────────────────────────────────────
  {
    brand: 'Porsche',
    models: [
      {
        name: 'Macan',
        years: range(2014, 2026),
        engines: [
          { label: '2.0 Turbo 245/265ch', fuel: 'Essence', years: range(2014, 2024) },
          { label: 'GTS 2.9 V6 380ch', fuel: 'Essence', years: range(2018, 2024) },
          { label: 'Électrique 4 / 4S / Turbo', fuel: 'Electrique', years: range(2024, 2026) },
        ],
      },
      {
        name: 'Cayenne',
        years: range(2002, 2026),
        engines: [
          { label: '3.0 V6 340ch', fuel: 'Essence', years: range(2017, 2026) },
          { label: '3.0 Diesel 262ch', fuel: 'Diesel', years: range(2010, 2020) },
          { label: 'E-Hybrid 462/680ch', fuel: 'Hybride', years: range(2014, 2026) },
        ],
      },
      {
        name: 'Taycan',
        years: range(2019, 2026),
        engines: [
          { label: '4 / 4S électrique 408/476ch', fuel: 'Electrique', years: range(2019, 2026) },
          { label: 'Turbo / Turbo S 680/761ch', fuel: 'Electrique', years: range(2019, 2026) },
        ],
      },
    ],
  },

  // ─── LEXUS ─────────────────────────────────────────────────────────────────
  {
    brand: 'Lexus',
    models: [
      {
        name: 'UX',
        years: range(2019, 2026),
        engines: [
          { label: 'UX 250h Hybrid 184ch', fuel: 'Hybride', years: range(2019, 2026) },
          { label: 'UX 300e électrique 204ch', fuel: 'Electrique', years: range(2020, 2026) },
        ],
      },
      {
        name: 'NX',
        years: range(2014, 2026),
        engines: [
          { label: 'NX 300h Hybrid 197ch', fuel: 'Hybride', years: range(2014, 2021) },
          { label: 'NX 350h Hybrid 244ch', fuel: 'Hybride', years: range(2021, 2026) },
          { label: 'NX 450h+ Plug-in Hybrid 309ch', fuel: 'Hybride', years: range(2021, 2026) },
        ],
      },
      {
        name: 'RX',
        years: range(2003, 2026),
        engines: [
          { label: 'RX 450h Hybrid 313ch', fuel: 'Hybride', years: range(2009, 2022) },
          { label: 'RX 500h F Sport 371ch', fuel: 'Hybride', years: range(2022, 2026) },
          { label: 'RX 450h+ Plug-in Hybrid 309ch', fuel: 'Hybride', years: range(2022, 2026) },
        ],
      },
      {
        name: 'CT 200h',
        years: range(2011, 2022),
        engines: [
          { label: 'CT 200h Hybrid 136ch', fuel: 'Hybride', years: range(2011, 2022) },
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
  if (!found) return Array.from({ length: new Date().getFullYear() + 2 - 1990 }, (_, i) => new Date().getFullYear() + 1 - i)

  const engineOption = found.engines.find((item) => item.label === engine)
  const years = engineOption?.years ?? found.years
  return [...years].sort((a, b) => b - a)
}

export function getFuelForEngine(brand: string, model: string, engine: string) {
  return getModel(brand, model)?.engines.find((item) => item.label === engine)?.fuel
}
