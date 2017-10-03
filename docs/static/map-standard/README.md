# Choropleth Maps

> Choropleth maps show the geospatial distribution of quantities, shaded in proportion to a color value.

## sszvis.choropleth()

### Data structure

This chart requires data which can be matched with map entities.

### Preparing geodata

The choropleth map component can be used with arbitrary GeoJSON features. For rendering a map correctly, provide `features` (distinct shapes which can be colored individually), and `borders` (a line mesh which will be overlaid on top of the features). Optionally, you can also provide `lakeFeatures` and `lakeBorders`

Typically, you'll load a file in topojson format and use topojson-client to convert it to GeoJSON features.

For example, you might load a file using `d3.json()` and then extract the features you want:

```code
lang: js
---
d3.json('stadt-zurich.json').get(function(error, topo) {
    actions.setMapData({
        features: topojson.feature(topo, topo.objects.wahlkreise),
        borders: topojson.mesh(topo, topo.objects.wahlkreise),
        lakeFeatures: topojson.mesh(topo, topo.objects.lakezurich),
        lakeBorders: topojson.mesh(topo, topo.objects.wahlkreis_lakebounds),
    });
})
```

### Pre-built TopoJSON files

sszvis provides pre-built TopoJSON files which combine the most commonly used geometries used.


#### `topo/stadt-zurich.json`

- `stadtkreise`
- `wahlkreise`
- `statistische_zonen`
- `statistische_quartiere`
- `lakezurich`
- `wahlkreis_lakebounds`
- `stadtkreis_lakebounds`
- `statistische_quartiere_lakebounds`

#### `topo/agglomeration-zurich.json`

- `agglomeration`
- `lakezurich_lakegreifen`

#### `topo/switzerland.json`

- `cantons`



### Configuration

Maps use d3's excellent geographic projection support to render GeoJSON entities. Data values are then merged with map entities for display. The entities have id values, and the data values should share them. It's possible to configure which property of the data is used for this matching.

#### `map.features(geoJsonFeatures)`

A GeoJSON feature collection, created with `topojson.feature()`. For example districts.

#### `map.borders(geoJsonFeatures)`

A GeoJSON line string, created with `topojson.mesh()`. For example district borders.

#### `map.lakeFeatures(geoJsonFeatures)` (optional)

A GeoJSON object, created either with `topojson.feature()` or `topojson.mesh()`. For example lake outlines.

#### `map.lakeBorders(geoJsonFeatures)` (optional)

A GeoJSON line string, created with `topojson.mesh()`. For example district borders which fall within the lake. Will be rendered as a dashed line.

#### `map.keyName([keyString])`

The map entity key name. Default 'geoId'.

#### `map.highlight([highlightArray])`

An array of data elements to highlight. The corresponding map entities are highlighted.

#### `map.highlightStroke([highlightString])`

A function for the stroke of the highlighted entities.

#### `map.width(width)`

The width of the map. Used to create the map projection function.

#### `map.height(height)`

The height of the map. Used to create the map projection function.

#### `map.defined([definedFunction])`

A predicate function used to determine whether a datum has a defined value. Map entities with data values that fail this predicate test will display the missing value texture.

#### `map.fill([fillColor])`

A string or function for the fill of the map entities.

#### `map.borderColor([borderColor])`

A string for the border color of the map entities.

#### `map.on(String, function)`

This component has an event handler interface for binding events to the map entities. The available events are 'over', 'out', and 'click'. These are triggered on map elements when the user mouses over or taps, mouses out, or taps or clicks, respectively.


## Zürich: Kreise

A map of Zürich's Stadtkreise.

```project
{
    "name": "map-kreis",
    "files": {
        "index.html": {
            "source": "map-standard/kreis.html",
            "template": "template.html"
        },
        "data.csv": "map-standard/data/M_kreis.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",
        "stadt-zurich.json": "/topo/stadt-zurich.json"
    },
    "sourceView": ["index.html", "data.csv"]
}
```

## Zürich: Wahlkreis

A map of Zürich's Wahlkreise.

```project
{
    "name": "map-kreis",
    "files": {
        "index.html": {
            "source": "map-standard/wahlkreis.html",
            "template": "template.html"
        },
        "data.csv": "map-standard/data/M_wahlkreis_fake.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",
        "stadt-zurich.json": "/topo/stadt-zurich.json"
    },
    "sourceView": ["index.html", "data.csv"]
}
```

## Zürich: Quartiere

A map of the Statistische Quartiere of Zürich, demonstrating use of a button group control for data subset selection.

```project
{
    "name": "map-quartiere",
    "files": {
        "index.html": {
            "source": "map-standard/quartiere.html",
            "template": "template.html"
        },
        "data.csv": "map-standard/data/S_quartiere.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",
        "stadt-zurich.json": "/topo/stadt-zurich.json"
    },
    "sourceView": ["index.html", "data.csv"]
}
```

## Coordinated Map and Line Chart

A map of the Statistische Quartiere of Zürich, demonstrating the coordination of the map dataset with a line chart which displays the full range of the data.

```project
{
    "name": "map-cml-quartier-years",
    "files": {
        "index.html": {
            "source": "map-standard/cml-quartier-years.html",
            "template": "template.html"
        },
        "data.csv": "map-standard/data/CML_quartier_years.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",
        "stadt-zurich.json": "/topo/stadt-zurich.json"
    },
    "sourceView": ["index.html", "data.csv"]
}
```

## Zürich: Statistische Zonen

A map of the "statistical zones" of Zürich

```project
{
    "name": "map-statzone",
    "files": {
        "index.html": {
            "source": "map-standard/statistische-zonen.html",
            "template": "template.html"
        },
        "data.csv": "map-standard/data/M_statzone_fake.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",
        "stadt-zurich.json": "/topo/stadt-zurich.json"
    },
    "sourceView": ["index.html", "data.csv"]
}
```

## Agglomeration

A map of Zürich's agglomeration.

```project
{
    "name": "map-agglomeration",
    "files": {
        "index.html": {
            "source": "map-standard/agglomeration.html",
            "template": "template.html"
        },
        "data.csv": "map-standard/data/agglomeration_2012.csv",
        "agglomeration-zurich.json": "dist/topo/agglomeration-zurich.json",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",
        "stadt-zurich.json": "/topo/stadt-zurich.json"
    },
    "sourceView": ["index.html", "data.csv"]
}
```

## Schweiz

A map of Switzerland.

```project
{
    "name": "map-switzerland",
    "files": {
        "index.html": {
            "source": "map-standard/switzerland.html",
            "template": "template.html"
        },
        "data.csv": "map-standard/data/M_swiss_fake.csv",
        "switzerland.json": "dist/topo/switzerland.json",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",
        "stadt-zurich.json": "/topo/stadt-zurich.json"
    },
    "sourceView": ["index.html", "data.csv"]
}
```
