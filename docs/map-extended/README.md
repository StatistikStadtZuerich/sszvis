# Extended Map Functionality

> These generators extend the capabilities of the sszvis.map package.

## sszvis.map.renderer.raster

Used to render a layer of raster data into an HTML layer (a div). Uses a canvas element internally.

### Data Structure

An array of data objects, where each object represents a single square "pixel" in the raster. You provide a function for computing the position (as an [x, y] pair) of the pixel, one for the fill color of the pixel, and a value for the size of the side of each pixel (sszvis.map.utils.pixelsFromDistance is good for this).

### Configuration

#### `renderer.raster.debug(isDebug)`

Pass true to this option to enable "debug" mode. This draws a large red rectangle over the entire canvas. Use this for gauging alignment of the raster layer with other map layers.

#### `renderer.raster.width(width)`

Use this to set the width of the canvas to be used

#### `renderer.raster.height(height)`

Use this to set the height of the canvas to be used

#### `renderer.raster.fill(fillFunc)`

A fill function for each raster pixel. Gets passed the data value for that pixel, and should return a color.

#### `renderer.raster.position(positionFunc)`

The position for each raster pixel. Gets passed the datum and should return an [x, y] position. This function usually involves a map projection.

#### `renderer.raster.cellSide(sideLength)`

The size (in pixels) of the side of each raster pixel. Raster pixels are all squares, and all have the same side length. sszvis.map.utils.pixelsFromDistance is a good function to use for calculating this pixel length, given a distance in meters and a projection function.

#### `renderer.raster.opacity(opacityValue)`

The opacity of the entire layer. The default is 1. Use a lower value to slightly reveal the layers underneath.

New settlements, topographic maps, and raster maps

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
    "sourceView": ["index.html", "data.csv"],
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
    "sourceView": ["index.html", "data.csv"],
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
        "data.csv": "docs/map-extended/data/kinder_segmented.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "docs/fallback.png",
        "d3.js": "vendor/d3/d3.min.js",
        "topojson.js": "vendor/topojson/topojson.js",
        "map.js": "map-modules/sszvis-map-zurich-stadtkreise.js"
    },
    "sourceView": ["index.html", "data.csv"],
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
        "data.csv": "docs/map-extended/data/kinder.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "docs/fallback.png",
        "d3.js": "vendor/d3/d3.min.js",
        "topojson.js": "vendor/topojson/topojson.js",
        "map.js": "map-modules/sszvis-map-zurich-stadtkreise.js"
    },
    "sourceView": ["index.html", "data.csv"],
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
    "sourceView": ["index.html", "data.csv"],
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
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 640
    }
}
```
