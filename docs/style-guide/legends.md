# Legends

Legends, like axes, are used to display information about a scale. Typically, the term "legend" covers any kind of non-axis graphical hint about a chart's scale and visual encodings.


## Ordinal Color Scale Legend

### sszvis.legendColorOrdinal

#### `ordinalColorScale.scale`

An ordinal scale which will be transformed into the legend.

#### `ordinalColorScale.[rowHeight]`

The height of the rows of the legend.

#### `ordinalColorScale.[columnWidth]`

The width of the columns of the legend.

#### `ordinalColorScale.[rows]`

The target number of rows for the legend.

#### `ordinalColorScale.[columns]`

The target number of columns for the legend.

#### `ordinalColorScale.orientation`

The orientation (layout order) of the legend. should be either "horizontal" or "vertical".No default.

#### `ordinalColorScale.[reverse]`

Whether to reverse the order that categories appear in the legend. Default false

#### `ordinalColorScale.[rightAlign]`

Whether to right-align the legend. Default false.

#### `ordinalColorScale.[horizontalFloat]`

A true value changes the legend layout to the horizontal float version. Default false.

#### `ordinalColorScale.[floatPadding]`

The amount of padding between elements in the horizontal float layout. Default 10px

#### `ordinalColorScale.[floatWidth]`

The maximum width of the horizontal float layout. Default 600px

### Two legends, including one right-aligned

``` project
{
    "name": "line-chart-multiple-two-axis",
    "files": {
        "index.html": {
            "source": "docs/line-chart-multiple/two-axis.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/line-chart-multiple/data/S_2yAxis.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "docs/fallback.png",
        "d3.js": "vendor/d3/d3.min.js"
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
            "source": "docs/bar-chart-horizontal-stacked/basic.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/bar-chart-horizontal-stacked/data/SHB_basic_percent.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "docs/fallback.png",
        "d3.js": "vendor/d3/d3.min.js"
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
            "source": "docs/bar-chart-grouped/basic.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/bar-chart-grouped/data/GB_3Categories_yearly_negatives.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "docs/fallback.png",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"]
}
```


## Linear Color Scale Legend

### sszvis.legendColorLinear

#### `linearColorScale.scale`

The scale to use to generate the legend

#### `linearColorScale.[displayValues]`

A list of specific values to display. If not specified, defaults to using scale.ticks

#### `linearColorScale.[width]`

The pixel width of the legend (default 200px)

#### `linearColorScale.[segments]`

The number of segments to aim for. Note, this is only used if displayValues isn't specified, and then it is passed as the argument to scale.ticks for finding the ticks. (default 8)

#### `linearColorScale.[labelText]`

Text or a text-returning function to use as the titles for the legend endpoints. If not supplied, defaults to using the first and last tick values.

#### `linearColorScale.[labelFormat]`

An optional formatter function for the end labels. Usually should be sszvis.formatNumber.

### Example - With custom labels

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
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"]
}
```


## Binned Color Scale Legend

### sszvis.legendColorBinned

#### `binnedColorScale.scale`

A scale to use to generate the color values

#### `binnedColorScale.[displayValues]`

An array of values which should be displayed. Usually these should be the bin edges

#### `binnedColorScale.[endpoints]`

The endpoints of the scale (note that these are not necessarily the first and last bin edges). These will become labels at either end of the legend.

#### `binnedColorScale.[width]`

The pixel width of the legend. Default 200

#### `binnedColorScale.[labelFormat]`

A formatter function for the labels of the displayValues.

### Example

```project
{
    "name": "heat-table-wermitwem",
    "files": {
        "index.html": {
            "source": "docs/heat-table/ht-wermitwem.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/heat-table/data/HT_wermitwem.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "docs/fallback.png",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"]
}
```


## Variable Radius Legend

### sszvis.legendRadius

#### `radius.scale`

A scale to use to generate the radius sizes

#### `radius.[fill]`

A function or string that gives a fill color for the demonstration circles (default white)

#### `radius.[stroke]`

A function or string that gives a stroke color for the demonstration circles (default black)

#### `radius.[strokeWidth]`

A number or function that gives a stroke width for the demonstration circles (default 1.25)

#### `radius.[labelFormat]`

Formatter function for the labels

### Example

```project
{
    "name": "scatterplot-variable-radius",
    "files": {
        "index.html": {
            "source": "docs/scatterplot/variable-radius.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/scatterplot/data/VRS_basic.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "docs/fallback.png",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"]
}
```
