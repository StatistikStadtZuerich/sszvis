# Extended Map Functionality

> These map layers provide additional features that extend the mapping capabilities of the SSZVIS library.

## sszvis.map

### Data structures

Requires data that can be matched to map entities

### Configuration

The configuration methods are the same as for the other map layers

## Zürich: Grundkarte Stadtkreise

A base layer example using the Stadtkreise map data. This is a static map

```project
{
    "name": "map-baselayer-stadtkreise",
    "files": {
        "index.html": {
            "source": "docs/map-extended/baselayer-stadtkreise.html",
            "template": "docs/template.html"
        },
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "docs/fallback.png",
        "d3.js": "vendor/d3/d3.min.js",
        "topojson.js": "vendor/topojson/topojson.js",
        "map.js": "sszvis-map-zurich-stadtkreise.js"
    },
    "sourceView": ["index.html"],
    "size": {
        "width": 516,
        "height": 542
    }
}
```

## Zürich: Grundkarte Quartiere

A base layer example using the Statistische Quartiere map data. This is a static map

```project
{
    "name": "map-baselayer-statquart",
    "files": {
        "index.html": {
            "source": "docs/map-extended/baselayer-statquart.html",
            "template": "docs/template.html"
        },
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "docs/fallback.png",
        "d3.js": "vendor/d3/d3.min.js",
        "topojson.js": "vendor/topojson/topojson.js",
        "map.js": "sszvis-map-zurich-statistischequartiere.js"
    },
    "sourceView": ["index.html"],
    "size": {
        "width": 516,
        "height": 542
    }
}
```

## Zürich: Grundkarte Wahlkreise

A base layer example using the Wahlkreise map data. This is a static map

```project
{
    "name": "map-baselayer-wahlkreise",
    "files": {
        "index.html": {
            "source": "docs/map-extended/baselayer-wahlkreise.html",
            "template": "docs/template.html"
        },
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "docs/fallback.png",
        "d3.js": "vendor/d3/d3.min.js",
        "topojson.js": "vendor/topojson/topojson.js",
        "map.js": "sszvis-map-zurich-wahlkreise.js"
    },
    "sourceView": ["index.html"],
    "size": {
        "width": 516,
        "height": 542
    }
}
```

## Zürich: Grundkarte Agglomerationen (2012)

A base layer example using the Agglomeration (2012) map data. This is a static map

```project
{
    "name": "map-baselayer-agglomeration-2012",
    "files": {
        "index.html": {
            "source": "docs/map-extended/baselayer-agglomeration-2012.html",
            "template": "docs/template.html"
        },
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "docs/fallback.png",
        "d3.js": "vendor/d3/d3.min.js",
        "topojson.js": "vendor/topojson/topojson.js",
        "map.js": "sszvis-map-zurich-agglomeration-2012.js"
    },
    "sourceView": ["index.html"],
    "size": {
        "width": 516,
        "height": 542
    }
}
```

## Switzerland: Grundkarte

A base layer example using the Switzerland map data. This is a static map

```project
{
    "name": "map-baselayer-switzerland",
    "files": {
        "index.html": {
            "source": "docs/map-extended/baselayer-switzerland.html",
            "template": "docs/template.html"
        },
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "docs/fallback.png",
        "d3.js": "vendor/d3/d3.min.js",
        "topojson.js": "vendor/topojson/topojson.js",
        "map.js": "sszvis-map-zurich-switzerland.js"
    },
    "sourceView": ["index.html"],
    "size": {
        "width": 516,
        "height": 542
    }
}
```
