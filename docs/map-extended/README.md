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
        "data.csv": "docs/map-extended/data/gemeinnuetzige.csv",
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

```project
{
    "name": "map-topo-neubau",
    "files": {
        "index.html": {
            "source": "docs/map-extended/topolayer-statquart-neubau.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/map-extended/data/gemeinnuetzige.csv",
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

## Statische Rasterkarte als Bins mit topografischer Hintergrundkarte.

```project
{
    "name": "map-raster-bins",
    "files": {
        "index.html": {
            "source": "docs/map-extended/rastermap-bins.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/map-extended/data/kinder_segmented.csv"
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
        "height": 640
    }
}
```

## Statische Rasterkarte als Verlauf mit topografischer Hintergrundkarte

```project
{
    "name": "map-raster-gradient",
    "files": {
        "index.html": {
            "source": "docs/map-extended/rastermap-gradient.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/map-extended/data/kinder.csv"
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

## Rasterkarte als Bins - 100m cell size

```project
{
    "name": "map-raster-100m",
    "files": {
        "index.html": {
            "source": "docs/map-extended/rastermap-bins-100m.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/map-extended/data/kinder100.csv",
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
        "height": 640
    }
}
```

## Rasterkarte als Bins - 200m cell size

```project
{
    "name": "map-raster-200m",
    "files": {
        "index.html": {
            "source": "docs/map-extended/rastermap-bins-200m.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/map-extended/data/kinder200.csv",
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
        "height": 640
    }
}
```
