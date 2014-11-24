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
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 440
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
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 495
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
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 469
    }
}
```
