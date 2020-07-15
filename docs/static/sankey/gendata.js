var d3 = require("d3");

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

var rand = d3.random.logNormal(3, 2);

var data = quarters
  .map(function (q1) {
    return quarters
      .filter(function (q2) {
        return q1 !== q2;
      })
      .map(function (q2) {
        return "f-" + q1 + "," + "t-" + q2 + "," + rand().toPrecision(3);
      });
  })
  .reduce(function (memo, arr) {
    return memo.concat(arr);
  }, [])
  .join("\n");

process.stdout.write("source,target,value\n");
process.stdout.write(data);
