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
    "name": "simple-line-chart-quarterly",
    "files": {
        "index.html": {
            "source": "docs/simple-line-chart/quarterly.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/simple-line-chart/data/SL_quarterly.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 500,
        "height": 480
    }
}
```

## Interaktiv

```project
{
    "name": "simple-line-chart-interactive",
    "files": {
        "index.html": {
            "source": "docs/simple-line-chart/interactive.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/simple-line-chart/data/SL_quarterly.csv",
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

## Statisch

```project
{
    "name": "simple-line-chart-daily",
    "files": {
        "index.html": {
            "source": "docs/simple-line-chart/daily.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/simple-line-chart/data/SL_daily.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 500,
        "height": 450
    }
}
```

```project
{
    "name": "simple-line-chart-negatives-x-axis",
    "files": {
        "index.html": {
            "source": "docs/simple-line-chart/negatives-x-axis.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/simple-line-chart/data/SL_negativesXAxis.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 500,
        "height": 450
    }
}
```

```project
{
    "name": "simple-line-chart-percentage-negatives-y-axis",
    "files": {
        "index.html": {
            "source": "docs/simple-line-chart/percentage-negatives-y-axis.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/simple-line-chart/data/SL_Percentage_negativesYAxis.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 500,
        "height": 450
    }
}
```

