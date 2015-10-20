# Map Base Layer Functionality

> These map layers can be used as "Grundkarte" for various types of map. They are the simplest way to generate the border of a geographic shape.

## sszvis.map

Available base map generators:

* `sszvis.map.zurichStadtKreiseBaseMap()`
* `sszvis.map.zurichStatistischeQuartiereBaseMap()`
* `sszvis.map.zurichWahlKreiseBaseMap()`
* `sszvis.map.zurichAgglomeration2012BaseMap()`
* `sszvis.map.switzerlandBaseMap()`

### Data structures

Requires data that can be matched to map entities

### Configuration

To use these maps, you need to include the correct map module with your project. The map modules are found in the map-modules/ folder, and they extend sszvis by adding map data and methods to construct different types of map using that data. They are split off as separate files because each file contains the raw data for the map that it generates. Although it has been simplified, this raw data is still large, and is kept separate to avoid affecting load times when not necessary. The map modules should be included in the document after sszvis, but before any actual visualization code.

### `map.width([width])`

The width of the map. Used to create the map projection function.

### `map.height([height])`

The height of the map. Used to create the map projection function.

### `map.borderColor([borderColor])`

The border color of the map. The entire base layer border will be the same color. The default is black.

## Zürich: Grundkarte Stadtkreise

A base layer example using the Stadtkreise map data. This is a static map

```project
{
    "name": "map-baselayer-stadtkreise",
    "files": {
        "index.html": {
            "source": "docs/map-baselayer/baselayer-stadtkreise.html",
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

## Zürich: Grundkarte Quartiere

A base layer example using the Statistische Quartiere map data. This is a static map

```project
{
    "name": "map-baselayer-statquart",
    "files": {
        "index.html": {
            "source": "docs/map-baselayer/baselayer-statquart.html",
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

## Zürich: Grundkarte Statistische Zonen

A base layer example that uses the Statistische Zonen map data. This is a static map

```project
{
    "name": "map-baselayer-statzone",
    "files": {
        "index.html": {
            "source": "docs/map-baselayer/baselayer-statzone.html",
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

## Zürich: Grundkarte Wahlkreise

A base layer example using the Wahlkreise map data. This is a static map

```project
{
    "name": "map-baselayer-wahlkreise",
    "files": {
        "index.html": {
            "source": "docs/map-baselayer/baselayer-wahlkreise.html",
            "template": "docs/template.html"
        },
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "docs/fallback.png",
        "d3.js": "vendor/d3/d3.min.js",
        "topojson.js": "vendor/topojson/topojson.js",
        "map.js": "map-modules/sszvis-map-zurich-wahlkreise.js"
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
            "source": "docs/map-baselayer/baselayer-agglomeration-2012.html",
            "template": "docs/template.html"
        },
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "docs/fallback.png",
        "d3.js": "vendor/d3/d3.min.js",
        "topojson.js": "vendor/topojson/topojson.js",
        "map.js": "map-modules/sszvis-map-zurich-agglomeration-2012.js"
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
            "source": "docs/map-baselayer/baselayer-switzerland.html",
            "template": "docs/template.html"
        },
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "docs/fallback.png",
        "d3.js": "vendor/d3/d3.min.js",
        "topojson.js": "vendor/topojson/topojson.js",
        "map.js": "map-modules/sszvis-map-zurich-switzerland.js"
    },
    "sourceView": ["index.html"],
    "size": {
        "width": 516,
        "height": 542
    }
}
```
