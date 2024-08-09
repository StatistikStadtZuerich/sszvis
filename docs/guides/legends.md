> Legends, like axes, are used to display information about a scale. Typically, the term "legend" covers any kind of non-axis graphical hint about a chart's scale and visual encodings.

## Ordinal Color Scale Legend

### sszvis.legendColorOrdinal

#### `legendColorOrdinal.scale`

An ordinal scale which will be transformed into the legend.

#### `legendColorOrdinal.[rowHeight]`

The height of the rows of the legend.

#### `legendColorOrdinal.[columnWidth]`

The width of the columns of the legend.

#### `legendColorOrdinal.[rows]`

The target number of rows for the legend.

#### `legendColorOrdinal.[columns]`

The target number of columns for the legend.

#### `legendColorOrdinal.orientation`

The orientation (layout order) of the legend. should be either "horizontal" or "vertical".No default.

#### `legendColorOrdinal.[reverse]`

Whether to reverse the order that categories appear in the legend. Default false

#### `legendColorOrdinal.[rightAlign]`

Whether to right-align the legend. Default false.

#### `legendColorOrdinal.[horizontalFloat]`

A true value changes the legend layout to the horizontal float version. Default false.

#### `legendColorOrdinal.[floatPadding]`

The amount of padding between elements in the horizontal float layout. Default 10px

#### `legendColorOrdinal.[floatWidth]`

The maximum width of the horizontal float layout. Default 600px

### Two legends, including one right-aligned

```project
{
    "name": "line-chart-two-axis",
    "files": {
        "index.html": {
            "source": "line-chart/two-axis.html",
            "template": "template.html"
        },
        "data.csv": "line-chart/data/S_2yAxis.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",

    },
    "sourceView": ["index.html", "data.csv"]
}
```

### Multiple columns

```project
{
    "name": "bar-chart-horizontal-stacked-basic",
    "files": {
        "index.html": {
            "source": "bar-chart-horizontal-stacked/basic.html",
            "template": "template.html"
        },
        "data.csv": "bar-chart-horizontal-stacked/data/SHB_basic_percent.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",

    },
    "sourceView": ["index.html", "data.csv"]
}
```

### The horizontal float layout

```project
{
    "name": "bar-chart-grouped_basic",
    "files": {
        "index.html": {
            "source": "bar-chart-grouped/basic.html",
            "template": "template.html"
        },
        "data.csv": "bar-chart-grouped/data/GB_3Categories_yearly_negatives.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",

    },
    "sourceView": ["index.html", "data.csv"]
}
```

## Linear Color Scale Legend

### sszvis.legendColorLinear

#### `legendColorLinear.scale`

The scale to use to generate the legend

#### `legendColorLinear.[displayValues]`

A list of specific values to display. If not specified, defaults to using scale.ticks

#### `legendColorLinear.[width]`

The pixel width of the legend (default 200px)

#### `legendColorLinear.[segments]`

The number of segments to aim for. Note, this is only used if displayValues isn't specified, and then it is passed as the argument to scale.ticks for finding the ticks. (default 8)

#### `legendColorLinear.[labelText]`

Text or a text-returning function to use as the titles for the legend endpoints. If not supplied, defaults to using the first and last tick values.

#### `legendColorLinear.[labelFormat]`

An optional formatter function for the end labels. Usually should be sszvis.formatNumber.

### Example - With custom labels

```project
{
    "name": "map-switzerland",
    "files": {
        "index.html": {
            "source": "map-standard/switzerland.html",
            "template": "template.html"
        },
        "data.csv": "map-standard/data/M_swiss_fake.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",
        "switzerland.json": "/topo/switzerland.json",

    },
    "sourceView": ["index.html", "data.csv"]
}
```

## Binned Color Scale Legend

### sszvis.legendColorBinned

#### `legendColorBinned.scale`

A scale to use to generate the color values

#### `legendColorBinned.[displayValues]`

An array of values which should be displayed. Usually these should be the bin edges

#### `legendColorBinned.[endpoints]`

The endpoints of the scale (note that these are not necessarily the first and last bin edges). These will become labels at either end of the legend.

#### `legendColorBinned.[width]`

The pixel width of the legend. Default 200

#### `legendColorBinned.[labelFormat]`

A formatter function for the labels of the displayValues.

### Example

```project
{
    "name": "heat-table-wermitwem",
    "files": {
        "index.html": {
            "source": "heat-table/ht-wermitwem.html",
            "template": "template.html"
        },
        "data.csv": "heat-table/data/HT_wermitwem.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",

    },
    "sourceView": ["index.html", "data.csv"]
}
```

## Variable Radius Legend

### sszvis.legendRadius

#### `legendRadius.scale`

A scale to use to generate the radius sizes

#### `legendRadius.[fill]`

A function or string that gives a fill color for the demonstration circles (default white)

#### `legendRadius.[stroke]`

A function or string that gives a stroke color for the demonstration circles (default black)

#### `legendRadius.[strokeWidth]`

A number or function that gives a stroke width for the demonstration circles (default 1.25)

#### `legendRadius.[labelFormat]`

Formatter function for the labels

### Example

```project
{
    "name": "scatterplot-variable-radius",
    "files": {
        "index.html": {
            "source": "scatterplot/variable-radius.html",
            "template": "template.html"
        },
        "data.csv": "scatterplot/data/VRS_basic.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",

    },
    "sourceView": ["index.html", "data.csv"]
}
```
