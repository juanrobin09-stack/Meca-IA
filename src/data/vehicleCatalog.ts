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
          // 308 Phase 1 (2007-2013)
          { label: '1.4 VTi 95ch (308 I)', fuel: 'Essence', years: range(2007, 2013) },
          { label: '1.6 VTi 120ch (308 I)', fuel: 'Essence', years: range(2007, 2013) },
          { label: '1.6 THP 150/175/200ch (308 I)', fuel: 'Essence', years: range(2007, 2013) },
          { label: '1.6 HDi 90/110ch (308 I)', fuel: 'Diesel', years: range(2007, 2013) },
          { label: '2.0 HDi 136/140/163ch (308 I)', fuel: 'Diesel', years: range(2007, 2013) },
          // 308 II (2013-2021)
          { label: '1.2 PureTech 110/130ch', fuel: 'Essence', years: range(2014, 2026) },
          { label: '1.6 THP 125/156ch', fuel: 'Essence', years: range(2007, 2017) },
          { label: '1.5 BlueHDi 100/130ch', fuel: 'Diesel', years: range(2017, 2025) },
          { label: '2.0 BlueHDi 150/180ch', fuel: 'Diesel', years: range(2013, 2021) },
          // 308 III (2021+)
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
        years: range(1996, 2026),
        engines: [
          { label: '1.4 75ch (Partner I)', fuel: 'Essence', years: range(1996, 2008) },
          { label: '1.6 16v 110ch (Partner I)', fuel: 'Essence', years: range(2002, 2008) },
          { label: '1.9 D 70ch (Partner I)', fuel: 'Diesel', years: range(1996, 2008) },
          { label: '1.6 HDi 75/90ch (Partner II)', fuel: 'Diesel', years: range(2008, 2018) },
          { label: '1.2 PureTech 110ch', fuel: 'Essence', years: range(2018, 2026) },
          { label: '1.5 BlueHDi 100/130ch', fuel: 'Diesel', years: range(2018, 2026) },
          { label: 'e-Partner électrique', fuel: 'Electrique', years: range(2021, 2026) },
        ],
      },
      {
        name: '1007',
        years: range(2005, 2009),
        engines: [
          { label: '1.4 75ch', fuel: 'Essence', years: range(2005, 2009) },
          { label: '1.6 16v 110ch', fuel: 'Essence', years: range(2005, 2009) },
          { label: '1.4 HDi 70ch', fuel: 'Diesel', years: range(2005, 2009) },
        ],
      },
      {
        name: '4007',
        years: range(2007, 2012),
        engines: [
          { label: '2.2 HDi 156ch', fuel: 'Diesel', years: range(2007, 2012) },
          { label: '2.4 MIVEC 170ch', fuel: 'Essence', years: range(2007, 2012) },
        ],
      },
      {
        name: '4008',
        years: range(2012, 2017),
        engines: [
          { label: '1.6 VTi 115ch', fuel: 'Essence', years: range(2012, 2017) },
          { label: '1.6 / 1.8 HDi 115/150ch', fuel: 'Diesel', years: range(2012, 2017) },
        ],
      },
      {
        name: 'RCZ',
        years: range(2010, 2015),
        engines: [
          { label: '1.6 THP 156/200/270ch', fuel: 'Essence', years: range(2010, 2015) },
          { label: '2.0 HDi 163ch', fuel: 'Diesel', years: range(2010, 2015) },
        ],
      },
      {
        name: 'Bipper',
        years: range(2008, 2018),
        engines: [
          { label: '1.4 75ch', fuel: 'Essence', years: range(2008, 2014) },
          { label: '1.3 HDi 75ch', fuel: 'Diesel', years: range(2008, 2018) },
          { label: '1.4 HDi 70ch', fuel: 'Diesel', years: range(2008, 2014) },
        ],
      },
      {
        name: 'Expert',
        years: range(1996, 2026),
        engines: [
          { label: '2.0 HDi 95/110/120/138ch (Expert II)', fuel: 'Diesel', years: range(2007, 2016) },
          { label: '1.5 / 2.0 BlueHDi (Expert III)', fuel: 'Diesel', years: range(2016, 2026) },
          { label: 'e-Expert électrique', fuel: 'Electrique', years: range(2020, 2026) },
        ],
      },
      {
        name: 'Boxer',
        years: range(1994, 2026),
        engines: [
          { label: '2.0 / 2.2 HDi 110/130/150ch', fuel: 'Diesel', years: range(2002, 2024) },
          { label: '2.3 / 3.0 HDi 130/180ch', fuel: 'Diesel', years: range(2006, 2024) },
          { label: 'e-Boxer électrique', fuel: 'Electrique', years: range(2021, 2026) },
        ],
      },
      {
        name: '405',
        years: range(1987, 1997),
        engines: [
          { label: '1.4 75ch', fuel: 'Essence', years: range(1987, 1997) },
          { label: '1.6 88/89ch', fuel: 'Essence', years: range(1987, 1997) },
          { label: '1.9 16v Mi16 / T16', fuel: 'Essence', years: range(1989, 1995) },
          { label: '1.9 D / TD 64/92ch', fuel: 'Diesel', years: range(1987, 1997) },
        ],
      },
      {
        name: '406',
        years: range(1995, 2004),
        engines: [
          { label: '1.8 16v 116ch', fuel: 'Essence', years: range(1995, 2004) },
          { label: '2.0 16v / Turbo 132/147ch', fuel: 'Essence', years: range(1995, 2004) },
          { label: '3.0 V6 190ch', fuel: 'Essence', years: range(1997, 2004) },
          { label: '1.9 TD 90ch', fuel: 'Diesel', years: range(1995, 2000) },
          { label: '2.0 / 2.2 HDi 90/110/136ch', fuel: 'Diesel', years: range(1999, 2004) },
        ],
      },
      {
        name: '407',
        years: range(2004, 2011),
        engines: [
          { label: '1.8 16v 116/125ch', fuel: 'Essence', years: range(2004, 2011) },
          { label: '2.0 16v 140ch', fuel: 'Essence', years: range(2004, 2011) },
          { label: '3.0 V6 211ch', fuel: 'Essence', years: range(2004, 2011) },
          { label: '1.6 HDi 110ch', fuel: 'Diesel', years: range(2004, 2011) },
          { label: '2.0 HDi 136/140ch', fuel: 'Diesel', years: range(2004, 2011) },
          { label: '2.2 / 2.7 V6 HDi 170/204ch', fuel: 'Diesel', years: range(2005, 2011) },
        ],
      },
      {
        name: '607',
        years: range(1999, 2010),
        engines: [
          { label: '2.2 16v 158ch', fuel: 'Essence', years: range(1999, 2010) },
          { label: '3.0 V6 207/210ch', fuel: 'Essence', years: range(1999, 2010) },
          { label: '2.0 / 2.2 HDi 110/136/170ch', fuel: 'Diesel', years: range(1999, 2010) },
          { label: '2.7 V6 HDi 204ch', fuel: 'Diesel', years: range(2005, 2010) },
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
          // Twingo 1 (1993-2007)
          { label: '1.2 8v 55/60ch (Twingo 1)', fuel: 'Essence', years: range(1993, 2007) },
          { label: '1.2 16v 75ch (Twingo 1)', fuel: 'Essence', years: range(2000, 2007) },
          // Twingo 2 (2007-2014)
          { label: '1.2 16v 60/75ch (Twingo 2)', fuel: 'Essence', years: range(2007, 2014) },
          { label: '1.2 TCe 100ch (Twingo 2)', fuel: 'Essence', years: range(2007, 2014) },
          { label: '1.6 16v RS 133ch (Twingo 2)', fuel: 'Essence', years: range(2008, 2013) },
          { label: '1.5 dCi 65/85ch (Twingo 2)', fuel: 'Diesel', years: range(2007, 2014) },
          // Twingo 3 (2014-2026)
          { label: '1.0 SCe 65/70ch', fuel: 'Essence', years: range(2014, 2026) },
          { label: '0.9 TCe 90ch', fuel: 'Essence', years: range(2014, 2022) },
          { label: 'Z.E. électrique 82ch', fuel: 'Electrique', years: range(2020, 2026) },
        ],
      },
      {
        name: 'Clio',
        years: range(1990, 2026),
        engines: [
          // Clio 1 (1990-1998)
          { label: '1.2 60ch (Clio 1)', fuel: 'Essence', years: range(1990, 1998) },
          { label: '1.4 75/80ch (Clio 1)', fuel: 'Essence', years: range(1990, 1998) },
          { label: '1.8 16v 135ch (Clio 1 Williams)', fuel: 'Essence', years: range(1993, 1996) },
          { label: '1.9 D 64ch (Clio 1)', fuel: 'Diesel', years: range(1991, 1998) },
          // Clio 2 (1998-2012)
          { label: '1.2 8v/16v 60/75ch (Clio 2)', fuel: 'Essence', years: range(1998, 2012) },
          { label: '1.4 16v 98ch (Clio 2)', fuel: 'Essence', years: range(1998, 2008) },
          { label: '1.6 16v 110ch (Clio 2 RS)', fuel: 'Essence', years: range(1999, 2008) },
          { label: '2.0 16v 172/182ch (Clio 2 RS)', fuel: 'Essence', years: range(2000, 2006) },
          { label: '1.5 dCi 65/80/100ch (Clio 2)', fuel: 'Diesel', years: range(2001, 2012) },
          // Clio 3 (2005-2014)
          { label: '1.2 16v 75ch (Clio 3)', fuel: 'Essence', years: range(2005, 2014) },
          { label: '1.2 TCe 100ch (Clio 3)', fuel: 'Essence', years: range(2007, 2014) },
          { label: '1.6 16v 110ch (Clio 3)', fuel: 'Essence', years: range(2005, 2014) },
          { label: '2.0 16v 200ch (Clio 3 RS)', fuel: 'Essence', years: range(2006, 2014) },
          { label: '1.5 dCi 70/85/105ch (Clio 3)', fuel: 'Diesel', years: range(2005, 2014) },
          // Clio 4 (2012-2019) + Clio 5 (2019-2026)
          { label: '0.9 TCe 90ch', fuel: 'Essence', years: range(2012, 2019) },
          { label: '1.0 TCe 90/100ch', fuel: 'Essence', years: range(2019, 2026) },
          { label: '1.5 dCi 75/90/110ch', fuel: 'Diesel', years: range(2012, 2020) },
          { label: 'E-Tech Hybrid 140/145ch', fuel: 'Hybride', years: range(2020, 2026) },
        ],
      },
      {
        name: 'Megane',
        years: range(1995, 2026),
        engines: [
          // Megane 1 (1995-2002)
          { label: '1.4 8v 75ch (Megane 1)', fuel: 'Essence', years: range(1995, 2002) },
          { label: '1.6 16v 110ch (Megane 1)', fuel: 'Essence', years: range(1996, 2002) },
          { label: '2.0 16v 140ch (Megane 1 Coupé)', fuel: 'Essence', years: range(1996, 2002) },
          { label: '1.9 D / dTi 65/100ch (Megane 1)', fuel: 'Diesel', years: range(1995, 2002) },
          // Megane 2 (2002-2009)
          { label: '1.4 16v 98ch (Megane 2)', fuel: 'Essence', years: range(2002, 2009) },
          { label: '1.6 16v 113ch (Megane 2)', fuel: 'Essence', years: range(2002, 2009) },
          { label: '2.0 16v 135/165ch (Megane 2)', fuel: 'Essence', years: range(2002, 2009) },
          { label: '2.0 16v Turbo 224/230ch (Megane 2 RS)', fuel: 'Essence', years: range(2004, 2009) },
          { label: '1.5 dCi 80/100/105ch (Megane 2)', fuel: 'Diesel', years: range(2002, 2009) },
          { label: '1.9 dCi 110/120ch (Megane 2)', fuel: 'Diesel', years: range(2002, 2009) },
          { label: '2.0 dCi 150ch (Megane 2)', fuel: 'Diesel', years: range(2005, 2009) },
          // Megane 3 (2008-2016)
          { label: '1.6 16v 100/110ch (Megane 3)', fuel: 'Essence', years: range(2008, 2016) },
          { label: '1.2 TCe 115/130ch', fuel: 'Essence', years: range(2012, 2018) },
          { label: '2.0 16v Turbo 250/265ch (Megane 3 RS)', fuel: 'Essence', years: range(2009, 2016) },
          { label: '1.5 dCi 90/105/110ch (Megane 3)', fuel: 'Diesel', years: range(2008, 2016) },
          { label: '1.9 / 2.0 dCi 130/160ch (Megane 3)', fuel: 'Diesel', years: range(2008, 2016) },
          // Megane 4 (2016-2024) + Megane E-Tech (2022+)
          { label: '1.3 TCe 115/140/160ch', fuel: 'Essence', years: range(2018, 2024) },
          { label: '1.5 dCi / Blue dCi 95/115ch', fuel: 'Diesel', years: range(2016, 2023) },
          { label: 'E-Tech Plug-in 160ch', fuel: 'Hybride', years: range(2020, 2024) },
          { label: 'Megane E-Tech électrique 130/218ch', fuel: 'Electrique', years: range(2022, 2026) },
        ],
      },
      {
        name: 'Scenic',
        years: range(1996, 2026),
        engines: [
          // Scenic 1 (1996-2003)
          { label: '1.6 16v 110ch (Scenic 1)', fuel: 'Essence', years: range(1996, 2003) },
          { label: '2.0 16v 140ch (Scenic 1)', fuel: 'Essence', years: range(1996, 2003) },
          { label: '1.9 dTi / dCi 100/105ch (Scenic 1)', fuel: 'Diesel', years: range(1999, 2003) },
          // Scenic 2 (2003-2009)
          { label: '1.6 16v 115ch (Scenic 2)', fuel: 'Essence', years: range(2003, 2009) },
          { label: '2.0 16v 135ch (Scenic 2)', fuel: 'Essence', years: range(2003, 2009) },
          { label: '1.5 dCi 85/100/105ch (Scenic 2)', fuel: 'Diesel', years: range(2003, 2009) },
          { label: '1.9 / 2.0 dCi 130/150ch (Scenic 2)', fuel: 'Diesel', years: range(2003, 2009) },
          // Scenic 3 (2009-2016)
          { label: '1.6 16v 110ch (Scenic 3)', fuel: 'Essence', years: range(2009, 2016) },
          { label: '1.2 TCe 115/130ch', fuel: 'Essence', years: range(2013, 2022) },
          { label: '1.5 dCi 95/110ch (Scenic 3)', fuel: 'Diesel', years: range(2009, 2016) },
          { label: '1.9 dCi 130ch (Scenic 3)', fuel: 'Diesel', years: range(2009, 2014) },
          // Scenic 4 (2016-2022) + Scenic E-Tech (2023+)
          { label: '1.3 TCe 115/140ch', fuel: 'Essence', years: range(2018, 2022) },
          { label: '1.5 dCi / Blue dCi 110/115ch', fuel: 'Diesel', years: range(2016, 2022) },
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
      {
        name: 'Espace',
        years: range(1996, 2026),
        engines: [
          { label: '2.0 16v 140ch (Espace III/IV)', fuel: 'Essence', years: range(1996, 2014) },
          { label: '3.0 V6 24v 190ch (Espace III/IV)', fuel: 'Essence', years: range(1996, 2010) },
          { label: '1.9 dCi 120ch (Espace IV)', fuel: 'Diesel', years: range(2002, 2010) },
          { label: '2.0 / 2.2 dCi 130/150/175ch (Espace IV)', fuel: 'Diesel', years: range(2002, 2014) },
          { label: '3.0 V6 dCi 180/210ch (Espace IV)', fuel: 'Diesel', years: range(2002, 2014) },
          { label: '1.6 dCi 130/160ch (Espace V)', fuel: 'Diesel', years: range(2015, 2023) },
          { label: '2.0 dCi 200ch (Espace V)', fuel: 'Diesel', years: range(2015, 2020) },
          { label: '1.8 TCe 225ch (Espace V)', fuel: 'Essence', years: range(2019, 2023) },
          { label: 'E-Tech Hybrid 200ch (Espace VI)', fuel: 'Hybride', years: range(2023, 2026) },
        ],
      },
      {
        name: 'Laguna',
        years: range(1994, 2015),
        engines: [
          { label: '1.6 16v 110ch (Laguna I/II/III)', fuel: 'Essence', years: range(1994, 2015) },
          { label: '1.8 16v / 2.0 16v 120/140ch', fuel: 'Essence', years: range(1994, 2015) },
          { label: '2.0 IDE / Turbo 170/205ch', fuel: 'Essence', years: range(2001, 2015) },
          { label: '3.0 V6 207ch (Laguna II)', fuel: 'Essence', years: range(2001, 2007) },
          { label: '1.9 dTi / dCi 100/110/120ch', fuel: 'Diesel', years: range(1996, 2010) },
          { label: '2.0 dCi 130/150/180/205ch', fuel: 'Diesel', years: range(2005, 2015) },
          { label: '1.5 dCi 110ch (Laguna III)', fuel: 'Diesel', years: range(2007, 2015) },
          { label: '3.0 V6 dCi 240ch (Laguna III)', fuel: 'Diesel', years: range(2008, 2015) },
        ],
      },
      {
        name: 'Modus',
        years: range(2004, 2012),
        engines: [
          { label: '1.2 16v 75ch', fuel: 'Essence', years: range(2004, 2012) },
          { label: '1.4 16v 98ch', fuel: 'Essence', years: range(2004, 2012) },
          { label: '1.6 16v 113ch', fuel: 'Essence', years: range(2004, 2008) },
          { label: '1.5 dCi 65/85/106ch', fuel: 'Diesel', years: range(2004, 2012) },
        ],
      },
      {
        name: 'Master',
        years: range(1997, 2026),
        engines: [
          { label: '2.2 / 2.5 dCi 90/120/150ch (Master II)', fuel: 'Diesel', years: range(2000, 2010) },
          { label: '2.3 dCi 100/125/145/170ch (Master III)', fuel: 'Diesel', years: range(2010, 2026) },
          { label: 'Master Z.E. électrique', fuel: 'Electrique', years: range(2018, 2026) },
        ],
      },
      {
        name: 'Vel Satis',
        years: range(2001, 2009),
        engines: [
          { label: '2.0 / 3.5 V6 24v 165/241ch', fuel: 'Essence', years: range(2001, 2009) },
          { label: '2.2 / 3.0 V6 dCi 150/177ch', fuel: 'Diesel', years: range(2001, 2009) },
        ],
      },
      {
        name: 'Twizy',
        years: range(2012, 2020),
        engines: [
          { label: 'Z.E. 45 / 80 électrique', fuel: 'Electrique', years: range(2012, 2020) },
        ],
      },
      {
        name: 'Avantime',
        years: range(2001, 2003),
        engines: [
          { label: '3.0 V6 207ch', fuel: 'Essence', years: range(2001, 2003) },
          { label: '2.2 dCi 150ch', fuel: 'Diesel', years: range(2001, 2003) },
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
          // C3 I (2002-2009)
          { label: '1.1 60ch (C3 I)', fuel: 'Essence', years: range(2002, 2009) },
          { label: '1.4 8v/16v 73/90ch (C3 I)', fuel: 'Essence', years: range(2002, 2009) },
          { label: '1.6 16v 110ch (C3 I)', fuel: 'Essence', years: range(2002, 2009) },
          { label: '1.4 HDi 70/90ch (C3 I)', fuel: 'Diesel', years: range(2002, 2009) },
          { label: '1.6 HDi 90/110ch (C3 I)', fuel: 'Diesel', years: range(2005, 2009) },
          // C3 II (2009-2016)
          { label: '1.1 60ch (C3 II)', fuel: 'Essence', years: range(2009, 2013) },
          { label: '1.4 VTi 95ch (C3 II)', fuel: 'Essence', years: range(2009, 2016) },
          { label: '1.6 VTi 120ch (C3 II)', fuel: 'Essence', years: range(2009, 2016) },
          { label: '1.4 / 1.6 HDi 70/90/110ch (C3 II)', fuel: 'Diesel', years: range(2009, 2016) },
          // C3 III (2016+) + ë-C3
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
        years: range(2004, 2026),
        engines: [
          // C4 I (2004-2010)
          { label: '1.4 16v 90ch (C4 I)', fuel: 'Essence', years: range(2004, 2010) },
          { label: '1.6 16v 110ch (C4 I)', fuel: 'Essence', years: range(2004, 2010) },
          { label: '2.0 16v 138ch (C4 I)', fuel: 'Essence', years: range(2004, 2010) },
          { label: '1.6 HDi 90/110ch (C4 I)', fuel: 'Diesel', years: range(2004, 2010) },
          { label: '2.0 HDi 138ch (C4 I)', fuel: 'Diesel', years: range(2004, 2010) },
          // C4 II (2010-2018)
          { label: '1.4 VTi 95ch (C4 II)', fuel: 'Essence', years: range(2010, 2018) },
          { label: '1.6 VTi 120ch (C4 II)', fuel: 'Essence', years: range(2010, 2018) },
          { label: '1.6 THP 150/156ch (C4 II)', fuel: 'Essence', years: range(2010, 2018) },
          { label: '1.6 HDi 90/110/115ch (C4 II)', fuel: 'Diesel', years: range(2010, 2018) },
          { label: '2.0 HDi 150/163ch (C4 II)', fuel: 'Diesel', years: range(2010, 2018) },
          // C4 III (2020+)
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
      {
        name: 'Saxo',
        years: range(1996, 2004),
        engines: [
          { label: '1.0i 50ch', fuel: 'Essence', years: range(1996, 2003) },
          { label: '1.1i 60ch', fuel: 'Essence', years: range(1996, 2004) },
          { label: '1.4i 75ch', fuel: 'Essence', years: range(1996, 2004) },
          { label: '1.6 16v 90/120ch VTS', fuel: 'Essence', years: range(1996, 2003) },
          { label: '1.5 D 57ch', fuel: 'Diesel', years: range(1996, 2003) },
        ],
      },
      {
        name: 'Xsara',
        years: range(1997, 2006),
        engines: [
          { label: '1.4 8v 75ch', fuel: 'Essence', years: range(1997, 2006) },
          { label: '1.6 16v 110ch', fuel: 'Essence', years: range(2000, 2006) },
          { label: '1.8 16v 117ch', fuel: 'Essence', years: range(1997, 2002) },
          { label: '2.0 16v 137ch', fuel: 'Essence', years: range(1997, 2005) },
          { label: '2.0 16v VTS 167ch', fuel: 'Essence', years: range(2000, 2005) },
          { label: '1.9 D / TD 70/90ch', fuel: 'Diesel', years: range(1997, 2002) },
          { label: '2.0 HDi 90/110ch', fuel: 'Diesel', years: range(2000, 2006) },
        ],
      },
      {
        name: 'Xsara Picasso',
        years: range(1999, 2012),
        engines: [
          { label: '1.6 16v 110ch', fuel: 'Essence', years: range(1999, 2012) },
          { label: '1.8 16v 117ch', fuel: 'Essence', years: range(1999, 2005) },
          { label: '2.0 16v 138ch', fuel: 'Essence', years: range(2000, 2005) },
          { label: '1.6 HDi 92/110ch', fuel: 'Diesel', years: range(2004, 2012) },
          { label: '2.0 HDi 90ch', fuel: 'Diesel', years: range(2000, 2008) },
        ],
      },
      {
        name: 'C2',
        years: range(2003, 2010),
        engines: [
          { label: '1.1 60ch', fuel: 'Essence', years: range(2003, 2010) },
          { label: '1.4 16v 75/88ch', fuel: 'Essence', years: range(2003, 2010) },
          { label: '1.6 16v 110/125ch VTS', fuel: 'Essence', years: range(2003, 2010) },
          { label: '1.4 HDi 70ch', fuel: 'Diesel', years: range(2003, 2010) },
          { label: '1.6 HDi 90/110ch', fuel: 'Diesel', years: range(2005, 2010) },
        ],
      },
      {
        name: 'C5',
        years: range(2001, 2017),
        engines: [
          { label: '1.8 16v 117/125ch (C5 I/II)', fuel: 'Essence', years: range(2001, 2010) },
          { label: '2.0 16v 136/143ch (C5 I/II)', fuel: 'Essence', years: range(2001, 2010) },
          { label: '3.0 V6 24v 207/210ch (C5)', fuel: 'Essence', years: range(2001, 2008) },
          { label: '1.6 THP 156ch (C5 II)', fuel: 'Essence', years: range(2010, 2017) },
          { label: '1.6 HDi 110/115ch (C5)', fuel: 'Diesel', years: range(2004, 2017) },
          { label: '2.0 HDi 110/138/140/163ch (C5)', fuel: 'Diesel', years: range(2001, 2017) },
          { label: '2.2 / 3.0 V6 HDi 170/200/240ch', fuel: 'Diesel', years: range(2002, 2017) },
        ],
      },
      {
        name: 'C6',
        years: range(2005, 2012),
        engines: [
          { label: '3.0 V6 215ch', fuel: 'Essence', years: range(2005, 2012) },
          { label: '2.2 / 2.7 V6 HDi 170/200/204ch', fuel: 'Diesel', years: range(2005, 2012) },
          { label: '3.0 V6 HDi 240ch', fuel: 'Diesel', years: range(2009, 2012) },
        ],
      },
      {
        name: 'C8',
        years: range(2002, 2014),
        engines: [
          { label: '2.0 16v 140ch', fuel: 'Essence', years: range(2002, 2014) },
          { label: '2.0 / 2.2 HDi 110/136/170ch', fuel: 'Diesel', years: range(2002, 2014) },
        ],
      },
      {
        name: 'Jumper',
        years: range(1994, 2026),
        engines: [
          { label: '2.0 / 2.2 HDi 110/130/150ch', fuel: 'Diesel', years: range(2002, 2024) },
          { label: '2.3 / 3.0 HDi 130/180ch', fuel: 'Diesel', years: range(2006, 2024) },
          { label: 'ë-Jumper électrique', fuel: 'Electrique', years: range(2021, 2026) },
        ],
      },
      {
        name: 'Jumpy',
        years: range(1995, 2026),
        engines: [
          { label: '2.0 HDi 95/110/120/138ch (Jumpy II)', fuel: 'Diesel', years: range(2007, 2016) },
          { label: '1.5 / 2.0 BlueHDi (Jumpy III)', fuel: 'Diesel', years: range(2016, 2026) },
          { label: 'ë-Jumpy électrique', fuel: 'Electrique', years: range(2020, 2026) },
        ],
      },
      {
        name: 'Nemo',
        years: range(2008, 2018),
        engines: [
          { label: '1.4 75ch', fuel: 'Essence', years: range(2008, 2014) },
          { label: '1.3 HDi 75ch', fuel: 'Diesel', years: range(2008, 2018) },
          { label: '1.4 HDi 70ch', fuel: 'Diesel', years: range(2008, 2014) },
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
        years: range(1994, 2026),
        engines: [
          // Polo III (6N, 1994-2001)
          { label: '1.0 8v 50ch (Polo III)', fuel: 'Essence', years: range(1994, 2001) },
          { label: '1.4 8v 60ch (Polo III)', fuel: 'Essence', years: range(1994, 2001) },
          { label: '1.6 8v 75/100ch (Polo III)', fuel: 'Essence', years: range(1994, 2001) },
          { label: '1.9 SDi/D 64ch (Polo III)', fuel: 'Diesel', years: range(1994, 2001) },
          // Polo IV (9N, 2001-2009)
          { label: '1.2 12v 55/64ch (Polo IV)', fuel: 'Essence', years: range(2001, 2009) },
          { label: '1.4 16v 75ch (Polo IV)', fuel: 'Essence', years: range(2001, 2009) },
          { label: '1.6 16v 105ch (Polo IV)', fuel: 'Essence', years: range(2001, 2009) },
          { label: '1.4 / 1.9 TDI 75/100/130ch (Polo IV)', fuel: 'Diesel', years: range(2001, 2009) },
          // Polo V (6R/6C, 2009-2017)
          { label: '1.2 12v 60/70ch (Polo V)', fuel: 'Essence', years: range(2009, 2014) },
          { label: '1.2 TSI 90/105ch (Polo V)', fuel: 'Essence', years: range(2009, 2014) },
          { label: '1.4 16v 85ch (Polo V)', fuel: 'Essence', years: range(2009, 2014) },
          { label: '1.4 TSI 140/180ch (Polo V GTI)', fuel: 'Essence', years: range(2010, 2017) },
          { label: '1.6 / 1.9 TDI 75/90/105ch (Polo V)', fuel: 'Diesel', years: range(2009, 2017) },
          // Polo VI (AW, 2017+)
          { label: '1.0 MPI 65/75/80ch', fuel: 'Essence', years: range(2014, 2026) },
          { label: '1.0 TSI 95/110/115ch', fuel: 'Essence', years: range(2014, 2026) },
          { label: '1.4 / 1.6 TDI 80/95ch', fuel: 'Diesel', years: range(2009, 2021) },
          { label: '2.0 TSI GTI 200/207ch (Polo VI GTI)', fuel: 'Essence', years: range(2017, 2026) },
        ],
      },
      {
        name: 'Golf',
        years: range(1991, 2026),
        engines: [
          // Golf 3 (1991-1997)
          { label: '1.4 8v 60ch (Golf 3)', fuel: 'Essence', years: range(1991, 1997) },
          { label: '1.6 8v 75ch (Golf 3)', fuel: 'Essence', years: range(1991, 1997) },
          { label: '1.8 8v 90ch (Golf 3)', fuel: 'Essence', years: range(1991, 1997) },
          { label: '2.0 GTI 16v 150ch (Golf 3)', fuel: 'Essence', years: range(1992, 1997) },
          { label: '1.9 D / TDI 64/90ch (Golf 3)', fuel: 'Diesel', years: range(1991, 1997) },
          // Golf 4 (1997-2004)
          { label: '1.4 16v 75ch (Golf 4)', fuel: 'Essence', years: range(1997, 2004) },
          { label: '1.6 16v 100/105ch (Golf 4)', fuel: 'Essence', years: range(1997, 2004) },
          { label: '1.8 T 150/180ch (Golf 4 GTI)', fuel: 'Essence', years: range(1997, 2004) },
          { label: '1.9 SDI 68ch (Golf 4)', fuel: 'Diesel', years: range(1997, 2004) },
          { label: '1.9 TDI 90/100/115/130ch (Golf 4)', fuel: 'Diesel', years: range(1997, 2004) },
          // Golf 5 (2003-2009)
          { label: '1.4 16v / FSI 75/90ch (Golf 5)', fuel: 'Essence', years: range(2003, 2009) },
          { label: '1.4 TSI 122/170ch (Golf 5)', fuel: 'Essence', years: range(2007, 2009) },
          { label: '1.6 FSI / MPI 102/115ch (Golf 5)', fuel: 'Essence', years: range(2003, 2009) },
          { label: '2.0 TSI GTI 200/230ch (Golf 5)', fuel: 'Essence', years: range(2004, 2009) },
          { label: '1.9 TDI 90/105ch (Golf 5)', fuel: 'Diesel', years: range(2003, 2009) },
          { label: '2.0 TDI 140/170ch (Golf 5)', fuel: 'Diesel', years: range(2003, 2009) },
          // Golf 6 (2008-2012)
          { label: '1.2 TSI 85/105ch (Golf 6)', fuel: 'Essence', years: range(2008, 2012) },
          { label: '1.4 TSI 122/160ch (Golf 6)', fuel: 'Essence', years: range(2008, 2012) },
          { label: '2.0 TSI GTI 210ch (Golf 6 GTI)', fuel: 'Essence', years: range(2008, 2012) },
          { label: '1.6 TDI 90/105ch (Golf 6)', fuel: 'Diesel', years: range(2008, 2012) },
          { label: '2.0 TDI 140/170ch (Golf 6)', fuel: 'Diesel', years: range(2008, 2012) },
          // Golf 7 (2012-2020)
          { label: '1.0 TSI 110ch', fuel: 'Essence', years: range(2016, 2026) },
          { label: '1.4 TSI / eTSI 125/150ch', fuel: 'Essence', years: range(2012, 2026) },
          { label: '1.5 TSI / eTSI 130/150ch', fuel: 'Essence', years: range(2017, 2026) },
          { label: '1.6 TDI 90/105/115ch', fuel: 'Diesel', years: range(2009, 2020) },
          { label: '2.0 TDI 115/150ch', fuel: 'Diesel', years: range(2012, 2026) },
          // Golf 8 + variantes électrifiées
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
      {
        name: 'Sharan',
        years: range(1995, 2022),
        engines: [
          { label: '1.8 / 2.0 8v 115/140ch (Sharan I)', fuel: 'Essence', years: range(1995, 2010) },
          { label: '1.4 / 2.0 TSI 150/200ch (Sharan II)', fuel: 'Essence', years: range(2010, 2022) },
          { label: '1.9 TDI 90/115/130ch (Sharan I)', fuel: 'Diesel', years: range(1996, 2010) },
          { label: '2.0 TDI 110/140/170/184ch (Sharan II)', fuel: 'Diesel', years: range(2010, 2022) },
        ],
      },
      {
        name: 'Caddy',
        years: range(2004, 2026),
        engines: [
          { label: '1.6 / 1.4 TSI 102/125ch', fuel: 'Essence', years: range(2004, 2020) },
          { label: '1.9 / 2.0 TDI 75/105/140/170ch', fuel: 'Diesel', years: range(2004, 2020) },
          { label: '2.0 TDI 102/122ch (Caddy V)', fuel: 'Diesel', years: range(2020, 2026) },
          { label: 'Caddy California / Maxi', fuel: 'Diesel', years: range(2010, 2026) },
        ],
      },
      {
        name: 'Up',
        years: range(2011, 2024),
        engines: [
          { label: '1.0 60/75ch', fuel: 'Essence', years: range(2011, 2024) },
          { label: '1.0 TSI 90/115ch (Up GTI)', fuel: 'Essence', years: range(2018, 2024) },
          { label: 'e-Up électrique', fuel: 'Electrique', years: range(2013, 2024) },
        ],
      },
      {
        name: 'Crafter',
        years: range(2006, 2026),
        engines: [
          { label: '2.0 / 2.5 TDI 109/136/163ch (Crafter I)', fuel: 'Diesel', years: range(2006, 2016) },
          { label: '2.0 TDI 102/140/177ch (Crafter II)', fuel: 'Diesel', years: range(2016, 2026) },
          { label: 'e-Crafter électrique', fuel: 'Electrique', years: range(2018, 2026) },
        ],
      },
      {
        name: 'Beetle / New Beetle',
        years: range(1998, 2019),
        engines: [
          { label: '1.4 / 1.6 / 2.0 16v 75/100/115ch', fuel: 'Essence', years: range(1998, 2010) },
          { label: '1.2 / 1.4 / 1.8 TSI 105/160/220ch', fuel: 'Essence', years: range(2011, 2019) },
          { label: '1.9 TDI 90/100/105ch (New Beetle)', fuel: 'Diesel', years: range(1998, 2010) },
          { label: '1.6 / 2.0 TDI 105/140ch (Beetle)', fuel: 'Diesel', years: range(2011, 2019) },
        ],
      },
      {
        name: 'Scirocco',
        years: range(2008, 2017),
        engines: [
          { label: '1.4 TSI 122/160ch', fuel: 'Essence', years: range(2008, 2017) },
          { label: '2.0 TSI 200/220/280ch (R)', fuel: 'Essence', years: range(2008, 2017) },
          { label: '2.0 TDI 140/170/184ch', fuel: 'Diesel', years: range(2008, 2017) },
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
        years: range(1996, 2026),
        engines: [
          // A3 8L (1996-2003)
          { label: '1.6 8v 101ch (A3 8L)', fuel: 'Essence', years: range(1996, 2003) },
          { label: '1.8 / 1.8T 125/150/180ch (A3 8L)', fuel: 'Essence', years: range(1996, 2003) },
          { label: '1.9 TDI 90/110/130ch (A3 8L)', fuel: 'Diesel', years: range(1996, 2003) },
          // A3 8P (2003-2013)
          { label: '1.4 TFSI 125ch (A3 8P)', fuel: 'Essence', years: range(2007, 2013) },
          { label: '1.6 FSI / MPI 102/115ch (A3 8P)', fuel: 'Essence', years: range(2003, 2013) },
          { label: '1.8 / 2.0 TFSI 160/200/265ch (A3 8P)', fuel: 'Essence', years: range(2003, 2013) },
          { label: '1.6 TDI 90/105ch (A3 8P)', fuel: 'Diesel', years: range(2009, 2013) },
          { label: '1.9 / 2.0 TDI 105/140/170ch (A3 8P)', fuel: 'Diesel', years: range(2003, 2013) },
          // A3 8V (2012-2020) + A3 8Y (2020+)
          { label: '1.0 / 1.4 / 1.5 TFSI 116/150ch', fuel: 'Essence', years: range(2012, 2026) },
          { label: '2.0 TFSI 190/230ch', fuel: 'Essence', years: range(2012, 2026) },
          { label: '1.6 / 2.0 TDI 90/116/150ch', fuel: 'Diesel', years: range(2012, 2025) },
          { label: 'S3 2.0 TFSI 300/310ch', fuel: 'Essence', years: range(2013, 2026) },
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
      {
        name: 'A5',
        years: range(2007, 2026),
        engines: [
          { label: '1.8 / 2.0 TFSI 170/211/252/265ch', fuel: 'Essence', years: range(2007, 2026) },
          { label: '3.2 V6 FSI 265ch', fuel: 'Essence', years: range(2007, 2012) },
          { label: '2.0 TDI 143/170/177/190ch', fuel: 'Diesel', years: range(2008, 2026) },
          { label: '3.0 V6 TDI 240/272/286ch', fuel: 'Diesel', years: range(2008, 2024) },
          { label: 'S5 3.0 TFSI 333/354ch', fuel: 'Essence', years: range(2007, 2024) },
          { label: 'RS5 4.2 V8 / 2.9 V6 450ch', fuel: 'Essence', years: range(2010, 2024) },
        ],
      },
      {
        name: 'A7',
        years: range(2010, 2026),
        engines: [
          { label: '2.0 / 3.0 TFSI 245/333/340ch', fuel: 'Essence', years: range(2010, 2026) },
          { label: '3.0 TDI 204/245/272/286ch', fuel: 'Diesel', years: range(2010, 2025) },
          { label: 'S7 / RS7 4.0 V8 / 3.0 V6', fuel: 'Essence', years: range(2013, 2026) },
          { label: '55 TFSI e Plug-in Hybrid', fuel: 'Hybride', years: range(2020, 2026) },
        ],
      },
      {
        name: 'A8',
        years: range(2002, 2026),
        engines: [
          { label: '3.0 / 4.2 V8 TFSI 290/371ch', fuel: 'Essence', years: range(2002, 2026) },
          { label: '6.0 W12 450/500ch', fuel: 'Essence', years: range(2003, 2017) },
          { label: '3.0 / 4.2 TDI 232/258/385ch', fuel: 'Diesel', years: range(2003, 2024) },
        ],
      },
      {
        name: 'Q2',
        years: range(2016, 2026),
        engines: [
          { label: '1.0 / 1.4 / 1.5 TFSI 116/150ch', fuel: 'Essence', years: range(2016, 2026) },
          { label: '2.0 TFSI 190ch / SQ2 300ch', fuel: 'Essence', years: range(2017, 2026) },
          { label: '1.6 / 2.0 TDI 116/150ch', fuel: 'Diesel', years: range(2016, 2024) },
        ],
      },
      {
        name: 'Q4 e-tron',
        years: range(2021, 2026),
        engines: [
          { label: 'Q4 35/40 e-tron 170/204ch', fuel: 'Electrique', years: range(2021, 2026) },
          { label: 'Q4 50 e-tron quattro 299ch', fuel: 'Electrique', years: range(2021, 2026) },
        ],
      },
      {
        name: 'Q8',
        years: range(2018, 2026),
        engines: [
          { label: '3.0 V6 TFSI 286/340ch', fuel: 'Essence', years: range(2018, 2026) },
          { label: 'SQ8 / RS Q8 4.0 V8 507/600ch', fuel: 'Essence', years: range(2019, 2026) },
          { label: '3.0 V6 TDI 231/286ch', fuel: 'Diesel', years: range(2018, 2024) },
          { label: '60 TFSI e Plug-in Hybrid 462ch', fuel: 'Hybride', years: range(2020, 2026) },
        ],
      },
      {
        name: 'TT',
        years: range(1998, 2024),
        engines: [
          { label: '1.8 T 150/180/225ch (TT 8N)', fuel: 'Essence', years: range(1998, 2006) },
          { label: '3.2 V6 250ch (TT 8N/8J)', fuel: 'Essence', years: range(2003, 2010) },
          { label: '2.0 TFSI 200/211/272/310ch', fuel: 'Essence', years: range(2006, 2024) },
          { label: '2.5 TFSI RS 340/400ch', fuel: 'Essence', years: range(2009, 2024) },
          { label: '2.0 TDI 170/184ch', fuel: 'Diesel', years: range(2008, 2024) },
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
      {
        name: 'Alhambra',
        years: range(1995, 2020),
        engines: [
          { label: '2.0 16v / 1.8 T 115/150ch (Alhambra I)', fuel: 'Essence', years: range(1995, 2010) },
          { label: '1.4 / 2.0 TSI 150/200ch (Alhambra II)', fuel: 'Essence', years: range(2010, 2020) },
          { label: '1.9 TDI 90/115/130ch (Alhambra I)', fuel: 'Diesel', years: range(1996, 2010) },
          { label: '2.0 TDI 110/140/170/184ch (Alhambra II)', fuel: 'Diesel', years: range(2010, 2020) },
        ],
      },
      {
        name: 'Mii',
        years: range(2012, 2021),
        engines: [
          { label: '1.0 60/75ch', fuel: 'Essence', years: range(2012, 2020) },
          { label: 'Mii electric', fuel: 'Electrique', years: range(2020, 2021) },
        ],
      },
      {
        name: 'Toledo',
        years: range(1991, 2019),
        engines: [
          { label: '1.6 / 1.8 / 2.0 16v (Toledo I/II/III)', fuel: 'Essence', years: range(1991, 2009) },
          { label: '1.2 / 1.4 TSI 86/122ch (Toledo IV)', fuel: 'Essence', years: range(2012, 2019) },
          { label: '1.6 TDI 105ch (Toledo IV)', fuel: 'Diesel', years: range(2012, 2019) },
          { label: '1.9 / 2.0 TDI (Toledo II/III)', fuel: 'Diesel', years: range(1999, 2009) },
        ],
      },
      {
        name: 'Cordoba',
        years: range(1993, 2009),
        engines: [
          { label: '1.4 / 1.6 16v 75/100ch', fuel: 'Essence', years: range(1993, 2009) },
          { label: '1.8T / 2.0 / 2.0 16v (Cordoba GTI)', fuel: 'Essence', years: range(1996, 2002) },
          { label: '1.9 SDI / TDI 64/100/130ch', fuel: 'Diesel', years: range(1996, 2009) },
        ],
      },
      {
        name: 'Altea',
        years: range(2004, 2015),
        engines: [
          { label: '1.4 / 1.6 / 2.0 16v', fuel: 'Essence', years: range(2004, 2015) },
          { label: '1.4 / 1.8 TSI 125/160ch', fuel: 'Essence', years: range(2007, 2015) },
          { label: '2.0 FSI / TFSI 150/200ch', fuel: 'Essence', years: range(2004, 2015) },
          { label: '1.6 / 1.9 / 2.0 TDI 90/105/140/170ch', fuel: 'Diesel', years: range(2004, 2015) },
        ],
      },
      {
        name: 'Exeo',
        years: range(2009, 2013),
        engines: [
          { label: '1.6 / 1.8 / 2.0 TSI 102/160/200ch', fuel: 'Essence', years: range(2009, 2013) },
          { label: '2.0 TDI 120/143/170ch', fuel: 'Diesel', years: range(2009, 2013) },
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
        years: range(2001, 2026),
        engines: [
          { label: '1.8 / 2.0 / 2.8 V6 (Superb I)', fuel: 'Essence', years: range(2001, 2008) },
          { label: '1.4 / 1.8 / 2.0 TSI (Superb II)', fuel: 'Essence', years: range(2008, 2015) },
          { label: '1.4 / 1.5 / 2.0 TSI 150/190ch', fuel: 'Essence', years: range(2015, 2026) },
          { label: '1.9 / 2.0 TDI (Superb I/II)', fuel: 'Diesel', years: range(2001, 2015) },
          { label: '2.0 TDI 120/150/190ch', fuel: 'Diesel', years: range(2015, 2025) },
          { label: 'iV Plug-in Hybrid 218ch', fuel: 'Hybride', years: range(2020, 2026) },
        ],
      },
      {
        name: 'Yeti',
        years: range(2009, 2017),
        engines: [
          { label: '1.2 / 1.4 / 1.8 TSI 105/122/160ch', fuel: 'Essence', years: range(2009, 2017) },
          { label: '1.6 / 2.0 TDI 105/110/140/170ch', fuel: 'Diesel', years: range(2009, 2017) },
        ],
      },
      {
        name: 'Roomster',
        years: range(2006, 2015),
        engines: [
          { label: '1.2 / 1.4 / 1.6 16v 70/86/105ch', fuel: 'Essence', years: range(2006, 2015) },
          { label: '1.2 TSI 86/105ch', fuel: 'Essence', years: range(2010, 2015) },
          { label: '1.4 / 1.9 / 1.6 TDI 80/90/105ch', fuel: 'Diesel', years: range(2006, 2015) },
        ],
      },
      {
        name: 'Rapid',
        years: range(2012, 2019),
        engines: [
          { label: '1.2 / 1.4 TSI 86/122ch', fuel: 'Essence', years: range(2012, 2019) },
          { label: '1.0 TSI 95/110ch', fuel: 'Essence', years: range(2015, 2019) },
          { label: '1.4 / 1.6 TDI 90/105ch', fuel: 'Diesel', years: range(2012, 2019) },
        ],
      },
      {
        name: 'Citigo',
        years: range(2012, 2020),
        engines: [
          { label: '1.0 60/75ch', fuel: 'Essence', years: range(2012, 2020) },
          { label: 'Citigo-e iV électrique', fuel: 'Electrique', years: range(2019, 2020) },
        ],
      },
      {
        name: 'Enyaq',
        years: range(2021, 2026),
        engines: [
          { label: 'Enyaq iV 50/60/80 électrique', fuel: 'Electrique', years: range(2021, 2026) },
          { label: 'Enyaq RS iV 4x4 299ch', fuel: 'Electrique', years: range(2022, 2026) },
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
          { label: '1.9 / 2.0 CDTI (Vivaro A)', fuel: 'Diesel', years: range(2001, 2014) },
          { label: '1.6 BiTurbo CDTI 120/140ch (Vivaro B)', fuel: 'Diesel', years: range(2014, 2019) },
          { label: '2.0 BlueHDi 120/145ch', fuel: 'Diesel', years: range(2019, 2026) },
          { label: 'Vivaro-e électrique', fuel: 'Electrique', years: range(2020, 2026) },
        ],
      },
      {
        name: 'Meriva',
        years: range(2003, 2017),
        engines: [
          { label: '1.4 16v 90ch (Meriva A/B)', fuel: 'Essence', years: range(2003, 2017) },
          { label: '1.6 16v 100/115ch (Meriva A)', fuel: 'Essence', years: range(2003, 2010) },
          { label: '1.4 Turbo 120/140ch (Meriva B)', fuel: 'Essence', years: range(2010, 2017) },
          { label: '1.3 CDTI 75/95ch', fuel: 'Diesel', years: range(2003, 2017) },
          { label: '1.6 / 1.7 CDTI 100/110/130ch', fuel: 'Diesel', years: range(2005, 2017) },
        ],
      },
      {
        name: 'Zafira',
        years: range(1999, 2019),
        engines: [
          { label: '1.6 16v 105/115ch (Zafira A/B)', fuel: 'Essence', years: range(1999, 2014) },
          { label: '1.8 16v 125ch (Zafira A/B)', fuel: 'Essence', years: range(1999, 2014) },
          { label: '2.0 / 2.2 16v 147ch', fuel: 'Essence', years: range(1999, 2014) },
          { label: '2.0 Turbo 192/200ch OPC', fuel: 'Essence', years: range(2001, 2010) },
          { label: '1.4 Turbo 140ch (Zafira Tourer)', fuel: 'Essence', years: range(2011, 2019) },
          { label: '1.6 / 1.7 / 1.9 CDTI 100/120/150ch', fuel: 'Diesel', years: range(2002, 2014) },
          { label: '1.6 / 2.0 CDTI 110/130/170ch (Zafira Tourer)', fuel: 'Diesel', years: range(2011, 2019) },
        ],
      },
      {
        name: 'Insignia',
        years: range(2008, 2022),
        engines: [
          { label: '1.4 / 1.6 / 1.8 16v 140/170ch', fuel: 'Essence', years: range(2008, 2017) },
          { label: '2.0 Turbo 220/250/325ch', fuel: 'Essence', years: range(2008, 2022) },
          { label: '1.4 / 1.5 / 1.6 Turbo 140/170/200ch (Insignia B)', fuel: 'Essence', years: range(2017, 2022) },
          { label: '1.6 / 2.0 CDTI 110/130/170/195ch', fuel: 'Diesel', years: range(2008, 2017) },
          { label: '1.6 / 2.0 Diesel 110/170/210ch (Insignia B)', fuel: 'Diesel', years: range(2017, 2022) },
        ],
      },
      {
        name: 'Antara',
        years: range(2006, 2015),
        engines: [
          { label: '2.4 16v 140/167ch', fuel: 'Essence', years: range(2006, 2015) },
          { label: '3.2 V6 227ch', fuel: 'Essence', years: range(2006, 2011) },
          { label: '2.0 / 2.2 CDTI 127/150/184ch', fuel: 'Diesel', years: range(2006, 2015) },
        ],
      },
      {
        name: 'Adam',
        years: range(2013, 2019),
        engines: [
          { label: '1.2 / 1.4 16v 70/87/100ch', fuel: 'Essence', years: range(2013, 2019) },
          { label: '1.0 Turbo 90/115ch', fuel: 'Essence', years: range(2014, 2019) },
        ],
      },
      {
        name: 'Karl',
        years: range(2015, 2019),
        engines: [
          { label: '1.0 73ch', fuel: 'Essence', years: range(2015, 2019) },
        ],
      },
      {
        name: 'Combo',
        years: range(2001, 2026),
        engines: [
          { label: '1.6 / 1.7 / 2.0 CDTI 95/110ch (Combo D)', fuel: 'Diesel', years: range(2011, 2018) },
          { label: '1.2 PureTech 110ch (Combo E)', fuel: 'Essence', years: range(2018, 2026) },
          { label: '1.5 BlueHDi 100/130ch (Combo E)', fuel: 'Diesel', years: range(2018, 2026) },
          { label: 'Combo-e électrique', fuel: 'Electrique', years: range(2021, 2026) },
        ],
      },
      {
        name: 'Crossland',
        years: range(2017, 2024),
        engines: [
          { label: '1.2 Turbo 110/130ch', fuel: 'Essence', years: range(2017, 2024) },
          { label: '1.5 / 1.6 CDTI 99/120ch', fuel: 'Diesel', years: range(2017, 2024) },
        ],
      },
      {
        name: 'Movano',
        years: range(1998, 2026),
        engines: [
          { label: '2.3 / 2.5 / 3.0 CDTI 100/120/146/180ch', fuel: 'Diesel', years: range(2010, 2024) },
          { label: 'Movano-e électrique', fuel: 'Electrique', years: range(2022, 2026) },
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
          { label: '2.5 D-4D 120/144ch (Hilux VII)', fuel: 'Diesel', years: range(2005, 2015) },
          { label: '3.0 D-4D 171ch (Hilux VII)', fuel: 'Diesel', years: range(2007, 2015) },
          { label: '2.4 D-4D 150ch', fuel: 'Diesel', years: range(2015, 2026) },
          { label: '2.8 D-4D 177/204ch', fuel: 'Diesel', years: range(2015, 2026) },
        ],
      },
      {
        name: 'Auris',
        years: range(2007, 2019),
        engines: [
          { label: '1.33 Dual VVT-i 99ch', fuel: 'Essence', years: range(2009, 2019) },
          { label: '1.4 / 1.6 VVT-i 97/124/132ch', fuel: 'Essence', years: range(2007, 2019) },
          { label: '1.2 Turbo 116ch (Auris II)', fuel: 'Essence', years: range(2015, 2019) },
          { label: 'Hybride HSD 136ch', fuel: 'Hybride', years: range(2010, 2019) },
          { label: '1.4 / 2.0 D-4D 90/124/143ch', fuel: 'Diesel', years: range(2007, 2019) },
          { label: '1.6 D-4D 112ch (Auris II)', fuel: 'Diesel', years: range(2015, 2019) },
        ],
      },
      {
        name: 'Avensis',
        years: range(1997, 2018),
        engines: [
          { label: '1.6 / 1.8 / 2.0 VVT-i 110/147/152ch', fuel: 'Essence', years: range(1997, 2018) },
          { label: '2.4 VVT-i 163ch', fuel: 'Essence', years: range(2003, 2009) },
          { label: '2.0 / 2.2 D-4D 116/126/150/177ch', fuel: 'Diesel', years: range(2003, 2018) },
          { label: '1.6 / 2.0 D-4D 112/124/143ch', fuel: 'Diesel', years: range(2009, 2018) },
        ],
      },
      {
        name: 'Verso',
        years: range(2009, 2018),
        engines: [
          { label: '1.6 / 1.8 VVT-i 132/147ch', fuel: 'Essence', years: range(2009, 2018) },
          { label: '2.0 / 2.2 D-4D 124/150/177ch', fuel: 'Diesel', years: range(2009, 2018) },
        ],
      },
      {
        name: 'Verso-S',
        years: range(2010, 2016),
        engines: [
          { label: '1.33 Dual VVT-i 99ch', fuel: 'Essence', years: range(2010, 2016) },
          { label: '1.4 D-4D 90ch', fuel: 'Diesel', years: range(2010, 2016) },
        ],
      },
      {
        name: 'iQ',
        years: range(2009, 2015),
        engines: [
          { label: '1.0 / 1.33 VVT-i 68/98ch', fuel: 'Essence', years: range(2009, 2015) },
          { label: '1.4 D-4D 90ch', fuel: 'Diesel', years: range(2009, 2014) },
        ],
      },
      {
        name: 'Proace',
        years: range(2013, 2026),
        engines: [
          { label: '1.6 / 2.0 HDi 90/125/150ch (Proace I)', fuel: 'Diesel', years: range(2013, 2016) },
          { label: '1.5 / 2.0 BlueHDi (Proace II)', fuel: 'Diesel', years: range(2016, 2026) },
          { label: 'Proace Electric', fuel: 'Electrique', years: range(2021, 2026) },
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
          { label: '2.2 TDCi 100/125/140ch', fuel: 'Diesel', years: range(2006, 2016) },
          { label: '2.0 EcoBlue 105/130/170ch', fuel: 'Diesel', years: range(2016, 2026) },
          { label: 'E-Transit électrique 184ch', fuel: 'Electrique', years: range(2022, 2026) },
        ],
      },
      {
        name: 'Ka',
        years: range(1996, 2021),
        engines: [
          { label: '1.3 50/60ch (Ka I)', fuel: 'Essence', years: range(1996, 2008) },
          { label: '1.2 8v 69ch (Ka II)', fuel: 'Essence', years: range(2008, 2016) },
          { label: '1.3 TDCi 75ch (Ka II)', fuel: 'Diesel', years: range(2008, 2016) },
          { label: '1.2 / 1.5 Ti-VCT (Ka+)', fuel: 'Essence', years: range(2016, 2021) },
        ],
      },
      {
        name: 'C-Max',
        years: range(2003, 2019),
        engines: [
          { label: '1.6 / 1.8 / 2.0 16v 100/125/145ch', fuel: 'Essence', years: range(2003, 2010) },
          { label: '1.0 EcoBoost 100/125ch', fuel: 'Essence', years: range(2012, 2019) },
          { label: '1.6 EcoBoost 150/182ch', fuel: 'Essence', years: range(2010, 2019) },
          { label: '1.5 / 1.6 / 1.8 / 2.0 TDCi', fuel: 'Diesel', years: range(2003, 2019) },
        ],
      },
      {
        name: 'S-Max',
        years: range(2006, 2024),
        engines: [
          { label: '2.0 / 2.3 16v 145/162ch', fuel: 'Essence', years: range(2006, 2015) },
          { label: '2.5 Turbo 220ch', fuel: 'Essence', years: range(2006, 2014) },
          { label: '1.5 / 2.0 EcoBoost 160/240ch', fuel: 'Essence', years: range(2015, 2024) },
          { label: '1.8 / 2.0 / 2.2 TDCi 115/140/200ch', fuel: 'Diesel', years: range(2006, 2024) },
          { label: 'Hybrid 190ch', fuel: 'Hybride', years: range(2021, 2024) },
        ],
      },
      {
        name: 'Galaxy',
        years: range(2006, 2023),
        engines: [
          { label: '2.0 16v 145ch', fuel: 'Essence', years: range(2006, 2015) },
          { label: '2.0 EcoBoost 200/240ch', fuel: 'Essence', years: range(2015, 2023) },
          { label: '1.8 / 2.0 / 2.2 TDCi 125/140/200ch', fuel: 'Diesel', years: range(2006, 2023) },
          { label: 'Hybrid 190ch', fuel: 'Hybride', years: range(2021, 2023) },
        ],
      },
      {
        name: 'B-Max',
        years: range(2012, 2017),
        engines: [
          { label: '1.0 EcoBoost 100/125ch', fuel: 'Essence', years: range(2012, 2017) },
          { label: '1.4 / 1.6 16v Ti-VCT', fuel: 'Essence', years: range(2012, 2017) },
          { label: '1.5 / 1.6 TDCi', fuel: 'Diesel', years: range(2012, 2017) },
        ],
      },
      {
        name: 'Tourneo Connect',
        years: range(2002, 2026),
        engines: [
          { label: '1.0 EcoBoost 100ch', fuel: 'Essence', years: range(2014, 2022) },
          { label: '1.5 / 1.6 / 1.8 TDCi', fuel: 'Diesel', years: range(2002, 2022) },
          { label: '2.0 EcoBlue (gen 3)', fuel: 'Diesel', years: range(2022, 2026) },
        ],
      },
      {
        name: 'Tourneo Custom',
        years: range(2012, 2026),
        engines: [
          { label: '2.0 / 2.2 TDCi 100/125/155ch', fuel: 'Diesel', years: range(2012, 2026) },
          { label: 'E-Tourneo Custom électrique', fuel: 'Electrique', years: range(2024, 2026) },
        ],
      },
      {
        name: 'Ranger',
        years: range(2011, 2026),
        engines: [
          { label: '2.2 TDCi 125/150ch', fuel: 'Diesel', years: range(2011, 2019) },
          { label: '2.0 EcoBlue 130/170/213ch', fuel: 'Diesel', years: range(2019, 2026) },
          { label: '3.2 / 3.0 V6 TDCi 200/240ch', fuel: 'Diesel', years: range(2011, 2026) },
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
      {
        name: 'Punto',
        years: range(1999, 2018),
        engines: [
          { label: '1.2 8v 60ch (Punto II/III)', fuel: 'Essence', years: range(1999, 2018) },
          { label: '1.4 8v/16v 77/95ch', fuel: 'Essence', years: range(2003, 2018) },
          { label: '1.4 T-Jet 120/135ch (Abarth)', fuel: 'Essence', years: range(2007, 2018) },
          { label: '1.6 16v Sporting 100ch', fuel: 'Essence', years: range(1999, 2003) },
          { label: '1.3 Multijet 70/75/85ch', fuel: 'Diesel', years: range(2003, 2018) },
          { label: '1.9 JTD 80/100ch (Punto II)', fuel: 'Diesel', years: range(1999, 2005) },
        ],
      },
      {
        name: 'Bravo',
        years: range(2007, 2015),
        engines: [
          { label: '1.4 16v 90ch', fuel: 'Essence', years: range(2007, 2015) },
          { label: '1.4 T-Jet 120/150ch', fuel: 'Essence', years: range(2007, 2015) },
          { label: '1.6 / 2.0 Multijet 105/120/165ch', fuel: 'Diesel', years: range(2007, 2015) },
        ],
      },
      {
        name: 'Stilo',
        years: range(2001, 2010),
        engines: [
          { label: '1.2 16v 80ch', fuel: 'Essence', years: range(2001, 2007) },
          { label: '1.4 16v 90ch', fuel: 'Essence', years: range(2003, 2010) },
          { label: '1.6 16v 103ch', fuel: 'Essence', years: range(2001, 2010) },
          { label: '1.8 16v 133ch', fuel: 'Essence', years: range(2001, 2010) },
          { label: '2.4 20v Abarth 170ch', fuel: 'Essence', years: range(2001, 2007) },
          { label: '1.9 JTD / Multijet 80/100/115/140ch', fuel: 'Diesel', years: range(2001, 2010) },
        ],
      },
      {
        name: 'Doblo',
        years: range(2001, 2024),
        engines: [
          { label: '1.4 / 1.6 16v 90/110ch', fuel: 'Essence', years: range(2001, 2022) },
          { label: '1.3 Multijet 75/85/95ch', fuel: 'Diesel', years: range(2005, 2022) },
          { label: '1.6 / 2.0 Multijet 105/120/135ch', fuel: 'Diesel', years: range(2001, 2022) },
          { label: '1.5 BlueHDi (Doblo III)', fuel: 'Diesel', years: range(2022, 2024) },
          { label: 'e-Doblo électrique', fuel: 'Electrique', years: range(2022, 2024) },
        ],
      },
      {
        name: '500L',
        years: range(2012, 2022),
        engines: [
          { label: '0.9 TwinAir 105ch', fuel: 'Essence', years: range(2012, 2018) },
          { label: '1.4 16v 95ch', fuel: 'Essence', years: range(2012, 2022) },
          { label: '1.4 T-Jet 120ch', fuel: 'Essence', years: range(2012, 2022) },
          { label: '1.3 / 1.6 Multijet 85/105/120ch', fuel: 'Diesel', years: range(2012, 2022) },
        ],
      },
      {
        name: 'Linea',
        years: range(2007, 2015),
        engines: [
          { label: '1.4 8v / 16v 77/95ch', fuel: 'Essence', years: range(2007, 2015) },
          { label: '1.4 T-Jet 120ch', fuel: 'Essence', years: range(2007, 2015) },
          { label: '1.3 Multijet 90ch', fuel: 'Diesel', years: range(2007, 2015) },
          { label: '1.6 Multijet 105/120ch', fuel: 'Diesel', years: range(2007, 2015) },
        ],
      },
      {
        name: 'Croma',
        years: range(2005, 2011),
        engines: [
          { label: '2.2 16v 147ch', fuel: 'Essence', years: range(2005, 2011) },
          { label: '1.8 Mjet 140ch', fuel: 'Diesel', years: range(2005, 2008) },
          { label: '1.9 / 2.4 Multijet 120/150/200ch', fuel: 'Diesel', years: range(2005, 2011) },
        ],
      },
      {
        name: 'Multipla',
        years: range(1998, 2010),
        engines: [
          { label: '1.6 16v 95/103ch', fuel: 'Essence', years: range(1998, 2010) },
          { label: '1.6 Bipower (essence/GPL)', fuel: 'Essence', years: range(2000, 2004) },
          { label: '1.9 JTD / Multijet 105/116ch', fuel: 'Diesel', years: range(1998, 2010) },
        ],
      },
      {
        name: 'Sedici',
        years: range(2006, 2014),
        engines: [
          { label: '1.6 16v 107/120ch', fuel: 'Essence', years: range(2006, 2014) },
          { label: '1.9 / 2.0 Multijet 120/135ch', fuel: 'Diesel', years: range(2006, 2014) },
        ],
      },
      {
        name: 'Idea',
        years: range(2003, 2012),
        engines: [
          { label: '1.2 / 1.4 16v 80/95ch', fuel: 'Essence', years: range(2003, 2012) },
          { label: '1.3 Multijet 70/90ch', fuel: 'Diesel', years: range(2003, 2012) },
          { label: '1.9 Multijet 100ch', fuel: 'Diesel', years: range(2003, 2008) },
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
