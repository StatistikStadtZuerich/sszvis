import { Array } from "effect";

export type Sample = {
  readonly key: string;
  readonly label: string;
  readonly hint: string;
  readonly csv: string;
};

export const samples: Array.NonEmptyReadonlyArray<Sample> = [
  {
    key: "beschaeftigte-sektor",
    label: "Employees by sector",
    hint: "A number per category.",
    csv: [
      "Sektor,Anzahl",
      "Gastgewerbe,20892",
      "Chemie und Metall,5389",
      "Baugewerbe,17567",
      "Handel,42196",
      "Verkehr,21005",
      "Information,15304",
    ].join("\n"),
  },
  {
    key: "zu-und-wegzuege",
    label: "Arrivals and departures",
    hint: "A number per date, split into two series.",
    csv: [
      "Datum,Kategorie,Anzahl",
      "01.01.2018,Zuzüge,26572",
      "01.01.2018,Wegzüge,24131",
      "01.01.2019,Zuzüge,26814",
      "01.01.2019,Wegzüge,25002",
      "01.01.2020,Zuzüge,23990",
      "01.01.2020,Wegzüge,25880",
      "01.01.2021,Zuzüge,27431",
      "01.01.2021,Wegzüge,24677",
      "01.01.2022,Zuzüge,29110",
      "01.01.2022,Wegzüge,25314",
    ].join("\n"),
  },
  {
    key: "regen-november",
    label: "Rainfall in November",
    hint: "A number per date, one series.",
    csv: [
      "Datum,Regen",
      "01.11.2013,0",
      "02.11.2013,278",
      "03.11.2013,590",
      "04.11.2013,524",
      "05.11.2013,412",
      "06.11.2013,601",
      "07.11.2013,0",
      "08.11.2013,164",
      "09.11.2013,222",
      "10.11.2013,691",
    ].join("\n"),
  },
  {
    key: "zupendler-sektor",
    label: "Commuters by sector",
    hint: "A number per category, with long labels.",
    csv: [
      "Sektor,Zupendler",
      "Landwirtschaft,933",
      "Nahrungsmittel und Papier,5389",
      "Maschinen und Geräte,3262",
      "Gross- und Detailhandel,20892",
      "Gastgewerbe,8135",
      "Finanzsektor,39517",
      /* Quoted because the name contains the delimiter, which the CSV parser and the editor both round-trip. */
      '"Immobilien, Informatik",33145',
      "Gesundheits- und Sozialwesen,41139",
    ].join("\n"),
  },
  {
    key: "berufsfeld-jahr",
    label: "Occupations by decade",
    hint: "A number per category and series, for stacking or grouping.",
    csv: [
      "Jahr,Berufsfeld,Anzahl",
      "1980,Qualifizierte nicht-manuelle Berufe,47582",
      "1990,Qualifizierte nicht-manuelle Berufe,48913",
      "2000,Qualifizierte nicht-manuelle Berufe,45223",
      "2010,Qualifizierte nicht-manuelle Berufe,49900",
      "1980,Intermediäre Berufe,16540",
      "1990,Intermediäre Berufe,40701",
      "2000,Intermediäre Berufe,39557",
      "2010,Intermediäre Berufe,61400",
      "1980,Akademische Berufe und oberes Kader,18871",
      "1990,Akademische Berufe und oberes Kader,27902",
      "2000,Akademische Berufe und oberes Kader,28866",
      "2010,Akademische Berufe und oberes Kader,36700",
      "1980,Qualifizierte manuelle Berufe,14573",
      "1990,Qualifizierte manuelle Berufe,11959",
      "2000,Qualifizierte manuelle Berufe,8280",
      "2010,Qualifizierte manuelle Berufe,7200",
    ].join("\n"),
  },
];

export const sampleFor = (key: string): Sample =>
  samples.find((sample) => sample.key === key) ?? samples[0];

export const isPristine = (csv: string): boolean => samples.some((sample) => sample.csv === csv);
