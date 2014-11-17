# Bar Chart

## Simple Horizontal Bar Chart

### Datenformat

Dieses Chart benötigt zwei Datenreihen:

* x-Achse
* y-Achse

### Konfiguration

Es stehen folgende Konfigurationsmöglichkeiten zur Verfügung:

* `xAxis` - eine `d3`-Achsenfunktion
* `yAxis` - eine `d3`-Achsenfunktion

## Beispiele

```project
{
    "name": "simple-horizontal-bar-chart-13-categories",
    "files": {
        "index.html": {
            "source": "docs/simple-horizontal-bar-chart/13-categories.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/simple-horizontal-bar-chart/data/SHB_13Categories.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 700
    }
}
```

```project
{
    "name": "simple-horizontal-bar-chart-basic-percent",
    "files": {
        "index.html": {
            "source": "docs/simple-horizontal-bar-chart/basic-percent.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/simple-horizontal-bar-chart/data/SHB_basic_percent.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 656
    }
}
```

```project
{
    "name": "simple-horizontal-bar-chart-long-names",
    "files": {
        "index.html": {
            "source": "docs/simple-horizontal-bar-chart/long-names.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/simple-horizontal-bar-chart/data/SHB_13Categories_longNames.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 620
    }
}
```

```project
{
    "name": "simple-horizontal-bar-chart-missing",
    "files": {
        "index.html": {
            "source": "docs/simple-horizontal-bar-chart/missing.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/simple-horizontal-bar-chart/data/S_missing.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 460
    }
}
```
