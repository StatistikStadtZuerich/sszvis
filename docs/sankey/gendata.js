import { randomLogNormal } from "d3";

var quarters = [
  "Affoltern",
  "Albisrieden",
  "Alt-Wiedikon",
  "Altstetten",
  "Enge",
  "Fluntern",
  "Friesenberg",
  "Gewerbeschule",
  "Hard",
  "Hirslanden",
  "Hirzenbach",
  "Hochschulen",
  "Hottingen",
  "Höngg",
  "Langstrasse",
  "Leimbach",
  "Lindenhof",
  "Mühlebach",
  "Oberstrass",
  "Oerlikon",
  "Rathaus",
  "Schwamendingen-Mitte",
  "Seebach",
  "Sihlfeld",
  "Unterstrass",
  "Wipkingen",
  "Witikon",
  "Wollishofen",
  "Saatlen",
  "Weinegg",
  "Werd",
  "City",
  "Escher Wyss",
  "Seefeld",
];

var rand = randomLogNormal(3, 2);

var data = quarters
  .flatMap((q1) =>
    quarters
      .filter((q2) => q1 !== q2)
      .map((q2) => "f-" + q1 + "," + "t-" + q2 + "," + rand().toPrecision(3))
  )
  .join("\n");

process.stdout.write("source,target,value\n");
process.stdout.write(data);
