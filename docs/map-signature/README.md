# Signature Maps

## Bubble Map

The "bubble map" concept is a map with sized circle data overlays for each map entity. The map shapes should be rendered with the standard map class for the type you want, and then the circles overhead are rendered as an "anchored shape".

## sszvis.map.anchoredCircles

This is an "anchored shape" used to render circles above map entities.

### Data Structures 

### Configuration

## Bubble Map of Statistische Zonen

```project
{
    "name": "map-bubble-statzone",
    "files": {
        "index.html": {
            "source": "docs/map-signature/signature-statzone.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/map-signature/data/births_year_statisticalZones.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "docs/fallback.png",
        "d3.js": "vendor/d3/d3.min.js",
        "topojson.js": "vendor/topojson/topojson.js",
        "map.js": "map-modules/sszvis-map-zurich-statistischezonen.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 542
    }
}
```

## Bubble Map of Statistische Quartiere

```project
{
    "name": "map-bubble-statquart",
    "files": {
        "index.html": {
            "source": "docs/map-signature/signature-statisticalquarters.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/map-signature/data/fake_statistical_quarters.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "docs/fallback.png",
        "d3.js": "vendor/d3/d3.min.js",
        "topojson.js": "vendor/topojson/topojson.js",
        "map.js": "map-modules/sszvis-map-zurich-statistischequartiere.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 542
    }
}
```
