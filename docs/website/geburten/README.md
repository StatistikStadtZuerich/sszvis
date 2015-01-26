# Geburten

> Grafiken für Webartikel Geburten

## Grafiken Geburten

### ☆ Small multiples pro Kontinent

```project
{
    "name": "geburten-nationen-multiples",
    "files": {
        "index.html": {
            "source": "docs/website/geburten/nationen_small_multiples.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/website/geburten/data/Nationen.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "docs/fallback.png",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 820
    }
}
```

### ☆ Stacked area chart pro Kontinent

```project
{
    "name": "geburten-nationen-area",
    "files": {
        "index.html": {
            "source": "docs/website/geburten/nationen_stacked.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/website/geburten/data/Nationen.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "docs/fallback.png",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 571
    }
}
```


### ☆ Geburtenziffer

Coordinated Map Line Chart mit Slider

```project
{
    "name": "cml-geburten-ziffer",
    "files": {
        "index.html": {
            "source": "docs/website/geburten/cml-geburtenziffer.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/website/geburten/data/Geburtenziffer.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "docs/fallback.png",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 688
    }
}
```