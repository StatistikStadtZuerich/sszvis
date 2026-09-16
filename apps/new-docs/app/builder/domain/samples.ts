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
];

export const sampleFor = (key: string): Sample =>
  samples.find((sample) => sample.key === key) ?? samples[0];

export const isPristine = (csv: string): boolean => samples.some((sample) => sample.csv === csv);
