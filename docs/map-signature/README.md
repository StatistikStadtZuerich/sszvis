# Signature Maps

> This component can be used to create maps with sized circle data overlays

## sszvis.dot

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
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "docs/fallback.png",
        "d3.js": "vendor/d3/d3.min.js",
        "topojson.js": "vendor/topojson/topojson.js",
        "map.js": "map-modules/sszvis-map-zurich-statistischezonen.js"
    },
    "sourceView": ["index.html"],
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
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "docs/fallback.png",
        "d3.js": "vendor/d3/d3.min.js",
        "topojson.js": "vendor/topojson/topojson.js",
        "map.js": "map-modules/sszvis-map-zurich-statistischequartiere.js"
    },
    "sourceView": ["index.html"],
    "size": {
        "width": 516,
        "height": 542
    }
}
```
