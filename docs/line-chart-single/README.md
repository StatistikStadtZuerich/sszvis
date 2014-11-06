# Einfache Liniendiagramme

> Liniendiagramme eignen sich zur Darstellung eines funktionellen Zusammenhangs zwischen zwei Merkmalen.

Liniendiagramme sollten nur verwendet werden, wenn genügend Datenpunkte vorhanden sind, da durch die Verbindung der Punkte der Eindruck vermittelt wird, dass es sich um kontinuierliche Daten handelt.

## sszvis.component.line

### Datenstruktur

Dieses Diagramm benötigt zwei Datenreihen, die einen Zusammenhang aufweisen.

### Konfiguration

Das Liniendiagramm benutzt intern [d3.svg.line](https://github.com/mbostock/d3/wiki/SVG-Shapes#line) und funktioniert analog dazu.

#### `line.x([x])`

Zugriffsfunktion, um *x*-Werte aus den Daten zu lesen.

#### `line.y([y])`

Zugriffsfunktion, um *y*-Werte aus den Daten zu lesen.

#### `line.stroke([stroke])`

String oder Funktion um die Strichfarbe zu setzen (Standard: Schwarz)

#### `line.strokeWidth([width])`

String oder Funktion um die Strichdicke zu setzen (Standard: 1)


### Diagramm

```project
{
    "name": "line-chart-single-basic",
    "files": {
        "index.html": {
            "source": "docs/line-chart-single/basic.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/line-chart-single/data/SL_quarterly.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 480
    }
}
```

## Anwendungsbeispiel: Interaktion

Basiert auf dem Standard-Diagramm, zeigt aber zusätzlich die Zahlenwerte an der Mausposition an.

```project
{
    "name": "line-chart-single-interactive",
    "files": {
        "index.html": {
            "source": "docs/line-chart-single/interactive.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/line-chart-single/data/SL_quarterly.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "height": 442,
        "width": 516
    }
}
```

## Anwendungsbeispiel: Anmerkungen

Zeigt eine Anmerkung an einem bestimmten Datenpunkt. Die Zeitachse zeigt Tage mit Monatskürzel.

```project
{
    "name": "line-chart-single-daily",
    "files": {
        "index.html": {
            "source": "docs/line-chart-single/daily.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/line-chart-single/data/SL_daily.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 450
    }
}
```

## Anwendungsbeispiel: Negative x-Werte

Zeigt negative x-Werte.

```project
{
    "name": "line-chart-single-negatives-x-axis",
    "files": {
        "index.html": {
            "source": "docs/line-chart-single/negatives-x-axis.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/line-chart-single/data/SL_negativesXAxis.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 450
    }
}
```

## Anwendungsbeispiel: Negative y-Werte

Zeigt negative y-Werte.

```project
{
    "name": "line-chart-single-percentage-negatives-y-axis",
    "files": {
        "index.html": {
            "source": "docs/line-chart-single/percentage-negatives-y-axis.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/line-chart-single/data/SL_Percentage_negativesYAxis.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 450
    }
}
```

