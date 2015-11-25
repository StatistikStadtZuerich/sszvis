# Annotations

Annotations are used to highlight certain sections of a chart. They are added as an additional layer above or below the chart contents themselves. Annotations in sszvis are themselves examples of the reusable chart pattern, so as with chart components and tooltips, data must be bound to the annotation layer before rendering the annotation into it.


## Data Circle

### sszvis.annotation.circle

All properties of the data circle can be specified as either a constant or a function of data.

#### `circle.x`

The x-position of the center of the data area.

#### `circle.y`

The y-position of the center of the data area.

#### `circle.r`

The radius of the data area.

#### `circle.dx`

The x-offset of the data area caption.

#### `circle.dy`

The y-offset of the data area caption.

#### `circle.caption`

The caption for the data area. (default position is the center of the circle).

### Example

```project
{
    "name": "line-chart-single-annotated",
    "files": {
        "index.html": {
            "source": "docs/line-chart-single/annotated.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/line-chart-single/data/SL_daily.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "docs/fallback.png",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 365
    }
}
```


## Data Area

### sszvis.annotation.rectangle

All properties of the annotation rectangle can be specified as either a constant or a function of data.

#### `rectangle.x`

The x-position of the upper left corner of the data area.

#### `rectangle.y`

The y-position of the upper left corner of the data area.

#### `rectangle.width`

The width of the data area.

#### `rectangle.height`

The height of the data area.

#### `rectangle.dx`

The x-offset of the data area caption.

#### `rectangle.dy`

The y-offset of the data area caption.

#### `rectangle.caption`

The caption for the data area. (default position is the center of the rectangle)

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
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 420
    }
}
```


## Reference Line

### sszvis.annotation.line

#### `line.x1`

The x-value, in data units, of the first reference line point.

#### `line.x2`

The x-value, in data units, of the second reference line point.

#### `line.y1`

The y-value, in data units, of the first reference line point.

#### `line.y2`

The y-value, in data units, of the second reference line point.

#### `line.xScale`

The x-scale of the chart. Used to transform the given x- values into chart coordinates.

#### `line.yScale`

The y-scale of the chart. Used to transform the given y- values into chart coordinates.

#### `line.[dx]`

The x-offset of the caption

#### `line.[dy]`

The y-offset of the caption

#### `line.[caption]`

A reference line caption. (default position is centered at the midpoint of the line, aligned with the slope angle of the line)

### Example

```project
{
    "name": "scatterplot-refline-fake",
    "files": {
        "index.html": {
            "source": "docs/scatterplot/refline-fake.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/scatterplot/data/SS_refline_fake.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "docs/fallback.png",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 394
    }
}
```


## Ruler

The ruler depicts information at a certain x value

### sszvis.annotation.ruler

#### `ruler.top`

A number which is the y-position of the top of the ruler line

#### `ruler.bottom`

A number which is the y-position of the bottom of the ruler line

#### `ruler.x`

A number or function returning a number for the x-position of the ruler line.

#### `ruler.y`

A function for determining the y-position of the ruler dots. Should take a data value as an argument and return a y-position.

#### `ruler.[label]`

A function for determining the labels of the ruler dots. Should take a data value as argument and return a label.

#### `ruler.color`

A string or function to specify the color of the ruler dots.

#### `ruler.[flip]`

A boolean or function which returns a boolean that specifies whether the labels on the ruler dots should be flipped. (they default to the right side)

### Example

``` project
{
    "name": "line-chart-multiple-two-cat",
    "files": {
        "index.html": {
            "source": "docs/line-chart-multiple/two-cat.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/line-chart-multiple/data/ML_2Categories_Quarterly.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "docs/fallback.png",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 385
    }
}
```


## Range Ruler / Range Flag

### sszvis.annotation.rangeRuler

The rangeRuler is a ruler which depicts ranges. It also shows a label for each range section, and a total value of all ranges.

#### `rangeRuler.x`

A function for the x-position of the ruler.

#### `rangeRuler.y0`

A function for the y-position of the lower dot. Called for each datum.

#### `rangeRuler.y1`

A function for the y-position of the upper dot. Called for each datum.

#### `rangeRuler.top`

A number for the y-position of the top of the ruler

#### `rangeRuler.bottom`

A number for the y-position of the bottom of the ruler

#### `rangeRuler.[label]`

A function which generates labels for each range.

#### `rangeRuler.[total]`

A number to display as the total of the range ruler (at the top)

#### `rangeRuler.[flip]`

Determines whether the rangeRuler labels should be flipped (they default to the right side)

### sszvis.annotation.rangeFlag

The rangeFlag creates a pair of dots which identify a specific vertical range of data, and a tooltipAnchor between them. Used here in the stacked area chart, but could also be used in other chart types that have several data series sharing the same vertical space, for example a multi-line chart.

#### `rangeFlag.x`

A value for the x-value of the range flag

#### `rangeFlag.y0`

A value for the y-value of the lower range flag dot

#### `rangeFlag.y1`

A value for the y-value of the upper range flag dot

### Example

```project
{
    "name": "area-chart-stacked-two",
    "files": {
        "index.html": {
            "source": "docs/area-chart-stacked/sa-two.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/area-chart-stacked/data/SA_2Categories_yearly.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "docs/fallback.png",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 454
    }
}
```
