# Line Chart

## Simple Line Chart

### Datenformat

Dieses Chart benötigt zwei Datenreihen:

* x-Achse
* y-Achse

### Konfiguration

Es stehen folgende Konfigurationsmöglichkeiten zur Verfügung:

* `xAxis` – eine `d3`-Achsenfunktion
* `yAxis` – eine `d3`-Achsenfunktion

## Simple Line Chart

Ein Liniendiagramm eignet sich, um die – meistens zeitliche – Veränderung eines Wertes darzustellen.

```project
{
    "index": "docs/simple-line-chart/quarterly.html",
    "readme": "docs/simple-line-chart/README.md",
    "files": [
        "docs/simple-line-chart/data/SL_quarterly.csv"
    ],
    "size": {
        "width": 500,
        "height": 480
    }
}
```

## Interaktiv

```project
{
    "index": "docs/simple-line-chart/interactive.html",
    "readme": "docs/simple-line-chart/README.md",
    "files": [
        "docs/simple-line-chart/data/SL_quarterly.csv"
    ],
    "size": {
        "height": 442,
        "width": 516
    }
}
```

## Statisch

```project
{
    "index": "docs/simple-line-chart/daily.html",
    "readme": "docs/simple-line-chart/README.md",
    "files": [
        "docs/simple-line-chart/data/SL_daily.csv"
    ],
    "size": {
        "width": 500,
        "height": 450
    }
}
```

```project
{
    "index": "docs/simple-line-chart/negatives-x-axis.html",
    "readme": "docs/simple-line-chart/README.md",
    "files": [
        "docs/simple-line-chart/data/SL_negativesXAxis.csv"
    ],
    "size": {
        "width": 500,
        "height": 450
    }
}
```

```project
{
    "index": "docs/simple-line-chart/percentage-negatives-y-axis.html",
    "readme": "docs/simple-line-chart/README.md",
    "files": [
        "docs/simple-line-chart/data/SL_Percentage_negativesYAxis.csv"
    ],
    "size": {
        "width": 500,
        "height": 450
    }
}
```

