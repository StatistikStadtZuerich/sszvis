# Geburten

> Spezialgrafiken für Webartikel Geburten

## Spezialgrafiken

### Area Charts pro Kontinent

```project
{
    "name": "spezial-geburten-nationen",
    "files": {
        "index.html": {
            "source": "docs/website/geburten/nationen.html",
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
        "height": 469
    }
}
```
### Map mit Slider

```project
{
    "name": "spezial-geburten-ziffer",
    "files": {
        "index.html": {
            "source": "docs/website/geburten/map-geburtenziffer.html",
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
        "height": 592
    }
}
```