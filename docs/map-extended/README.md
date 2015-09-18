# Extended Map Functionality

> These generators extend the capabilities of the sszvis.map package.

## sszvis.map

### Data structures

### Configuration

## Grundkarte der Stadt Zürcher Quartiere mit Neubausiedlungen

```project
{
    "name": "map-quartiere-neubau",
    "files": {
        "index.html": {
            "source": "docs/map-extended/quartiere-neubau.html",
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

## Topografische Grundkarte der Stadt Zürich

```project
{
    "name": "map-topographic",
    "files": {
        "index.html": {
            "source": "docs/map-extended/topolayer-stadtkreise.html",
            "template": "docs/template.html"
        },
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "docs/fallback.png",
        "d3.js": "vendor/d3/d3.min.js",
        "topojson.js": "vendor/topojson/topojson.js",
        "map.js": "map-modules/sszvis-map-zurich-stadtkreise.js"
    },
    "sourceView": ["index.html"],
    "size": {
        "width": 516,
        "height": 542
    }
}
```

## Topografische Grundkarte der Stadt Zürich mit Neubausiedlungen

## Statische Rasterkarte als Bins mit topografischer Hintergrundkarte.

## Statische Rasterkarte als Verlauf mit topografischer Hintergrundkarte

```project
{
    "name": "map-raster",
    "files": {
        "index.html": {
            "source": "docs/map-extended/rastermap-gradient.html",
            "template": "docs/template.html"
        },
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "docs/fallback.png",
        "d3.js": "vendor/d3/d3.min.js",
        "topojson.js": "vendor/topojson/topojson.js",
        "map.js": "map-modules/sszvis-map-zurich-stadtkreise.js"
    },
    "sourceView": ["index.html"],
    "size": {
        "width": 516,
        "height": 542
    }
}
```
