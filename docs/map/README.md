# Maps

> Maps show the geospatial distribution of quantities. When map entities are shaded in proportion to a color value, this is called a "choropleth".

## sszvis.map

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

A map of the stadtkreis of Zürich.

```project
{
    "name": "map-kreis",
    "files": {
        "index.html": {
            "source": "docs/map/kreis.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/map/data/M_kreis.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 600
    }
}
```

## Zürich: Wahlkreis

A map of the wahlkreis of Zürich.

```project
{
    "name": "map-kreis",
    "files": {
        "index.html": {
            "source": "docs/map/wahlkreis.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/map/data/M_wahlkreis_fake.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 600
    }
}
```

## Zürich: Quartiere

A map of the statistische quartiere of Zürich, demonstrating use of a segmented control for data subset selection.

```project
{
    "name": "map-tabs",
    "files": {
        "index.html": {
            "source": "docs/map/tabs.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/map/data/S_tabs.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 600
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
            "source": "docs/map/switzerland.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/map/data/M_swiss_fake.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 516
    }
}
```

## Coordinated Map and Line Chart

A map of the Zürich statistische quartiere, demonstrating the coordination of the map dataset with a line chart which displays the full range of the data.

```project
{
    "name": "map-cml-quartier-years",
    "files": {
        "index.html": {
            "source": "docs/map/cml-quartier-years.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/map/data/CML_quartier_years.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 726
    }
}
```
