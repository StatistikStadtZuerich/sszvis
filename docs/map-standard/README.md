# Maps

> Maps show the geospatial distribution of quantities. When map entities are shaded in proportion to a color value, this is called a "choropleth".

## sszvis.map

Available map generators:

* `sszvis.map.zurichStadtKreise()`
* `sszvis.map.zurichStatistischeQuartiere()`
* `sszvis.map.zurichWahlKreise()`
* `sszvis.map.zurichAgglomeration2012()`
* `sszvis.map.switzerland()`

### Data structure

This chart requires data which can be matched with map entities.

### Configuration

Maps use d3's excellent geographic projection support to render GeoJSON entities. Data values are then merged with map entities for display. The entities have id values, and the data values should share them. It's possible to configure which property of the data is used for this matching.

#### `map.type(typeString)`

The type of the chart. This must be specified and must be one of the following options: "zurich-stadtkreise", "zurich-statistischeQuartiere", "zurich-wahlkreise", "switzerland-cantons".

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
            "source": "docs/map-standard/kreis.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/map-standard/data/M_kreis.csv",
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

## Zürich: Wahlkreis

A map of Zürich's Wahlkreise.

```project
{
    "name": "map-kreis",
    "files": {
        "index.html": {
            "source": "docs/map-standard/wahlkreis.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/map-standard/data/M_wahlkreis_fake.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "docs/fallback.png",
        "d3.js": "vendor/d3/d3.min.js",
        "topojson.js": "vendor/topojson/topojson.js",
        "map.js": "map-modules/sszvis-map-zurich-wahlkreise.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 542
    }
}
```

## Zürich: Quartiere

A map of the Statistische Quartiere of Zürich, demonstrating use of a button group control for data subset selection.

```project
{
    "name": "map-tabs",
    "files": {
        "index.html": {
            "source": "docs/map-standard/tabs.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/map-standard/data/S_tabs.csv",
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
        "height": 675
    }
}
```

## Coordinated Map and Line Chart

A map of the Statistische Quartiere of Zürich, demonstrating the coordination of the map dataset with a line chart which displays the full range of the data.

```project
{
    "name": "map-cml-quartier-years",
    "files": {
        "index.html": {
            "source": "docs/map-standard/cml-quartier-years.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/map-standard/data/CML_quartier_years.csv",
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
        "height": 693
    }
}
```

## Zürich: Statistische Zonen

A map of the "statistical zones" of Zürich

```project
{
    "name": "map-statzone",
    "files": {
        "index.html": {
            "source": "docs/map-standard/statistische-zonen.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/map-standard/data/M_statzone_fake.csv",
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
        "height": 516
    }
}
```

## Agglomeration

A map of Zürich's agglomeration.

```project
{
    "name": "map-agglomeration",
    "files": {
        "index.html": {
            "source": "docs/map-standard/agglomeration.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/map-standard/data/agglomeration_2012.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "docs/fallback.png",
        "d3.js": "vendor/d3/d3.min.js",
        "topojson.js": "vendor/topojson/topojson.js",
        "map.js": "map-modules/sszvis-map-zurich-agglomeration-2012.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 730
    }
}
```

## Schweiz

A map of Switzerland.

```project
{
    "name": "map-switzerland",
    "files": {
        "index.html": {
            "source": "docs/map-standard/switzerland.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/map-standard/data/M_swiss_fake.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "docs/fallback.png",
        "d3.js": "vendor/d3/d3.min.js",
        "topojson.js": "vendor/topojson/topojson.js",
        "map.js": "map-modules/sszvis-map-switzerland.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 516
    }
}
```
