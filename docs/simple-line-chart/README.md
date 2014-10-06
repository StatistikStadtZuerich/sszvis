# Line Chart

## Simple Line Chart

Ein Liniendiagramm eignet sich, um die – meistens zeitliche – Veränderung eines Wertes darzustellen.

```project
{
    "index": "docs/simple-line-chart/index.html",
    "readme": "docs/simple-line-chart/README.md",
    "files": [
        "docs/simple-line-chart/data.csv"
    ],
    "size": {
        "width": 500,
        "height": 480
    }
}
```

[Projekt herunterladen](docs/simple-line-chart/simple-line-chart.zip) (ZIP. Nicht mehr aktuell, wird in Zukunft automatisch generiert)

### Datenformat

Dieses Chart benötigt zwei Datenreihen:

* x-Achse
* y-Achse

### Konfiguration

Es stehen folgende Konfigurationsmöglichkeiten zur Verfügung:

* `xAxis` – eine `d3`-Achsenfunktion
* `yAxis` – eine `d3`-Achsenfunktion

## Interaktiv

```project
{
    "index": "docs/simple-line-chart/interactive.html",
    "size": {
        "height": 442,
        "width": 516
    }
}
```
