# Extended Map Functionality

> These generators extend the capabilities of the sszvis.map package.

## sszvis.mapRendererRaster

Used to render a layer of raster data into an HTML layer (a div). Uses a canvas element internally.

### Data Structure

An array of data objects, where each object represents a single square "pixel" in the raster. You provide a function for computing the position (as an [x, y] pair) of the pixel, one for the fill color of the pixel, and a value for the size of the side of each pixel (sszvis.pixelsFromGeoDistance is good for this).

### Configuration

#### `mapRendererRaster.debug(isDebug)`

Pass true to this option to enable "debug" mode. This draws a large red rectangle over the entire canvas. Use this for gauging alignment of the raster layer with other map layers.

#### `mapRendererRaster.width(width)`

Use this to set the width of the canvas to be used

#### `mapRendererRaster.height(height)`

Use this to set the height of the canvas to be used

#### `mapRendererRaster.fill(fillFunc)`

A fill function for each raster pixel. Gets passed the data value for that pixel, and should return a color.

#### `mapRendererRaster.position(positionFunc)`

The position for each raster pixel. Gets passed the datum and should return an [x, y] position. This function usually involves a map projection.

#### `mapRendererRaster.cellSide(sideLength)`

The size (in pixels) of the side of each raster pixel. Raster pixels are all squares, and all have the same side length. sszvis.pixelsFromGeoDistance is a good function to use for calculating this pixel length, given a distance in meters and a projection function.

#### `mapRendererRaster.opacity(opacityValue)`

The opacity of the entire layer. The default is 1. Use a lower value to slightly reveal the layers underneath.

## sszvis.mapRendererGeoJson

### Data Structure

Takes the same data as the map module components. That is, an array of data objects, where each one has a property that can be used to match it with a feature from the GeoJson.

### Configuration

#### `mapRendererGeoJson.dataKeyName`

The keyname in the data which will be used to match data entities with geographic entities. Default 'geoId'.

#### `mapRendererGeoJson.geoJsonKeyName`

The keyname in the GeoJson (should be in the `properties` object of each feature in the GeoJson) which will be used to match map entities with data entities. Default 'id'.

#### `mapRendererGeoJson.geoJson`

The GeoJson object which should be rendered. Needs to have a 'features' property that is an array of features to render. And each feature should have a `properties` object which contains the id to match with a data element.

#### `mapRendererGeoJson.mapPath`

A path generator for drawing the GeoJson as SVG Path elements.

#### `mapRendererGeoJson.defined`

A function which, when given a data value, returns whether or not data in that value is defined.

#### `mapRendererGeoJson.fill`

A function that returns a string, or a string, for the fill color of the GeoJson entities. Default black.

#### `mapRendererGeoJson.stroke`

The stroke color of the entities. Can be a string or a function returning a string. Default black.

#### `mapRendererGeoJson.strokeWidth`

The thickness of the strokes of the shapes. Can be a number or a function returning a number. Default 1.25.

#### `mapRendererGeoJson.transitionColor`

Whether or not to transition the fill color of the geojson when it changes. Default true.

## sszvis.mapRendererImage

### Data Structure

This layer doesn't require any data. It renders the image provided by the .src property.

### Configuration

#### `mapRendererImage.projection`

The map projection function used to position the image in pixels. Uses the upper left and lower right corners of the image as geographical place markers to align with other map layers.

#### `mapRendererImage.src`

The source of the image you want to use. This should be ither a URL for an image hosted on the same server that hosts the page, or a base64-encoded dataURL. For example, the zurich topolayer map module.

#### `mapRendererImage.geoBounds`

This should be a 2D array containing the upper-left (north-west) and lower-right (south-east) coordinates of the corresponding corners of the image. The structure expected is:

[[nw-longitude, nw-latitude], [se-longitude, se-latitude]].

This is consistent with the way D3 handles similar geographic data. These coordinates are used to represent the edge of the image being used, and to align the image with other map layers (using the projection function). Note: it is possible that even with precise corner coordinates, some mismatch may still occur. This will happen if the image itself is generated using a different type of map projection than the one used by the projection function. SSZVIS uses a Mercator projection by default, but others from d3.geo can be used if desired.

#### `mapRendererImage.opacity`

The opacity of the resulting image layer. This will be applied to the entire image, and is sometimes useful when layering.

## Examples

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
    "sourceView": ["index.html", "data.csv"]
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
    "sourceView": ["index.html"]
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
    "sourceView": ["index.html", "data.csv"]
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
    "sourceView": ["index.html", "data.csv"]
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
    "sourceView": ["index.html", "data.csv"]
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
    "sourceView": ["index.html", "data.csv"]
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
    "sourceView": ["index.html", "data.csv"]
}
```
