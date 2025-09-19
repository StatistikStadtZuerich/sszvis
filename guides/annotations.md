> Annotations are used to highlight certain sections of a chart. They are added as an additional layer above or below the chart contents themselves. Annotations in sszvis are themselves examples of the reusable chart pattern, so as with chart components and tooltips, data must be bound to the annotation layer before rendering the annotation into it.

## Data Circle

### sszvis.annotationCircle

All properties of the data circle can be specified as either a constant or a function of data.

#### `annotationCircle.x`

The x-position of the center of the data area.

#### `annotationCircle.y`

The y-position of the center of the data area.

#### `annotationCircle.r`

The radius of the data area.

#### `annotationCircle.dx`

The x-offset of the data area caption.

#### `annotationCircle.dy`

The y-offset of the data area caption.

#### `annotationCircle.caption`

The caption for the data area. (default position is the center of the circle).

### Example

```project
{
    "name": "line-chart-annotated",
    "files": {
        "index.html": {
            "source": "line-chart/annotated.html",
            "template": "template.html"
        },
        "data.csv": "line-chart/data/SL_daily.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",

    },
    "sourceView": ["index.html", "data.csv"]
}
```

## Data Area

### sszvis.annotationRectangle

All properties of the annotation rectangle can be specified as either a constant or a function of data.

#### `annotationRectangle.x`

The x-position of the upper left corner of the data area.

#### `annotationRectangle.y`

The y-position of the upper left corner of the data area.

#### `annotationRectangle.width`

The width of the data area.

#### `annotationRectangle.height`

The height of the data area.

#### `annotationRectangle.dx`

The x-offset of the data area caption.

#### `annotationRectangle.dy`

The y-offset of the data area caption.

#### `annotationRectangle.caption`

The caption for the data area. (default position is the center of the rectangle)

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

## Reference Line

### sszvis.annotationLine

#### `annotationLine.x1`

The x-value, in data units, of the first reference line point.

#### `annotationLine.x2`

The x-value, in data units, of the second reference line point.

#### `annotationLine.y1`

The y-value, in data units, of the first reference line point.

#### `annotationLine.y2`

The y-value, in data units, of the second reference line point.

#### `annotationLine.xScale`

The x-scale of the chart. Used to transform the given x- values into chart coordinates.

#### `annotationLine.yScale`

The y-scale of the chart. Used to transform the given y- values into chart coordinates.

#### `annotationLine.[dx]`

The x-offset of the caption

#### `annotationLine.[dy]`

The y-offset of the caption

#### `annotationLine.[caption]`

A reference line caption. (default position is centered at the midpoint of the line, aligned with the slope angle of the line)

### Example

```project
{
    "name": "scatterplot-refline-fake",
    "files": {
        "index.html": {
            "source": "scatterplot/refline-fake.html",
            "template": "template.html"
        },
        "data.csv": "scatterplot/data/SS_refline_fake.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",

    },
    "sourceView": ["index.html", "data.csv"]
}
```

## Ruler

The ruler depicts information at a certain x value

### sszvis.annotationRuler

#### `annotationRuler.top`

A number which is the y-position of the top of the ruler line

#### `annotationRuler.bottom`

A number which is the y-position of the bottom of the ruler line

#### `annotationRuler.x`

A number or function returning a number for the x-position of the ruler line.

#### `annotationRuler.y`

A function for determining the y-position of the ruler dots. Should take a data value as an argument and return a y-position.

#### `annotationRuler.[label]`

A function for determining the labels of the ruler dots. Should take a data value as argument and return a label.

#### `annotationRuler.color`

A string or function to specify the color of the ruler dots.

#### `annotationRuler.[flip]`

A boolean or function which returns a boolean that specifies whether the labels on the ruler dots should be flipped. (they default to the right side)

### Chart

Shows the numeric values at the current mouse position. The x-axis shows the current quarter (Q1–Q4). Demonstrates the usage of the `annotationRuler()`.

```project
{
    "name": "line-chart-basic",
    "files": {
        "index.html": {
            "source": "line-chart/basic.html",
            "template": "template.html"
        },
        "data.csv": "line-chart/data/ML_2Categories_Quarterly.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",

    },
    "sourceView": ["index.html", "data.csv"]
}
```

## Range Ruler / Range Flag

### sszvis.annotationRangeRuler

The annotationRangeRuler is a ruler which depicts ranges. It also shows a label for each range section, and a total value of all ranges.

#### `annotationRangeRuler.x`

A function for the x-position of the ruler.

#### `annotationRangeRuler.y0`

A function for the y-position of the lower dot. Called for each datum.

#### `annotationRangeRuler.y1`

A function for the y-position of the upper dot. Called for each datum.

#### `annotationRangeRuler.top`

A number for the y-position of the top of the ruler

#### `annotationRangeRuler.bottom`

A number for the y-position of the bottom of the ruler

#### `annotationRangeRuler.[label]`

A function which generates labels for each range.

#### `annotationRangeRuler.[total]`

A number to display as the total of the range ruler (at the top)

#### `annotationRangeRuler.[flip]`

Determines whether the rangeRuler labels should be flipped (they default to the right side)

#### `annotationRangeRuler.[reduceOverlap]`

Determines whether overlapping labels should be avoided by moving them apart vertically (default).

If set to `false`, labels are allowed to overlap. This can be be useful in charts with a lot of labels where moving them apart would move them outside the chart. In this case, it would be better to only show one label instead of all, though.

### sszvis.annotationRangeFlag

The annotationRangeFlag creates a pair of dots which identify a specific vertical range of data, and a tooltipAnchor between them. Used here in the stacked area chart, but could also be used in other chart types that have several data series sharing the same vertical space, for example a multi-line chart.

#### `annotationRangeFlag.x`

A value for the x-value of the range flag

#### `annotationRangeFlag.y0`

A value for the y-value of the lower range flag dot

#### `annotationRangeFlag.y1`

A value for the y-value of the upper range flag dot

### Example

```project
{
    "name": "area-chart-stacked-two",
    "files": {
        "index.html": {
            "source": "area-chart-stacked/sa-two.html",
            "template": "template.html"
        },
        "data.csv": "area-chart-stacked/data/SA_2Categories_yearly.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",

    },
    "sourceView": ["index.html", "data.csv"]
}
```

## Confidence Area

The area is a shaded area that represents a confidence interval. It is used to show the range of values within which the true value is likely to fall.

### sszvis.annotationConfidenceArea

#### `annotationConfidenceArea.x`

The x-position of the confidence area.

#### `annotationConfidenceArea.y0`

The y-position of the lower bound of the confidence area.

#### `annotationConfidenceArea.y1`

The y-position of the upper bound of the confidence area.

#### `annotationConfidenceArea.stroke`

A string for the stroke color of the confidence area.

#### `annotationConfidenceArea.strokeWidth`

A number for the stroke width of the confidence area.

#### `annotationConfidenceArea.fill`

A string for the fill color of the confidence area.

### Example

```project
{
    "name": "line-chart-confidence-intervals",
    "files": {
        "index.html": {
            "source": "line-chart/confidence.html",
            "template": "template.html"
        },
        "data.csv": "line-chart/data/confidence.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",

    },
    "sourceView": ["index.html", "data.csv"]
}
```

## Confidence Bar

Confidence bars are used to display confidence intervals or error ranges on data points. They consist of a vertical line connecting the confidence bounds and horizontal caps at the top and bottom.

### sszvis.annotationConfidenceBar

All properties of the confidence bar can be specified as either a constant or a function of data.

#### `annotationConfidenceBar.x`

The x-position accessor for the confidence bars.

#### `annotationConfidenceBar.y`

The y-position accessor for the confidence bars.

#### `annotationConfidenceBar.confidenceLow`

Accessor function for the lower confidence bound.

#### `annotationConfidenceBar.confidenceHigh`

Accessor function for the upper confidence bound.

#### `annotationConfidenceBar.width`

The width of the horizontal confidence bar caps.

#### `annotationConfidenceBar.groupSize`

The number of items in each group.

#### `annotationConfidenceBar.groupWidth`

The width allocated for each group.

#### `annotationConfidenceBar.groupSpace`

The spacing between items within a group (default: 0.05).

#### `annotationConfidenceBar.groupScale`

Scale function for positioning groups horizontally.

### Example

```project
{
    "name": "bar-chart-vertical-nested-confidence",
    "files": {
        "index.html": {
            "source": "bar-chart-vertical-nested/confidence.html",
            "template": "template.html"
        },
        "data.csv": "bar-chart-vertical-nested/data/nested.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",

    },
    "sourceView": ["index.html", "data.csv"]
}
```
