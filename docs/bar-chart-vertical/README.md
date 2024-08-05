> Bar charts are suited to comparing numeric values for different categories. The categories can be
> ordered or unordered, numeric or non-numeric.

## sszvis.bar

### Data structure

This chart requires one variable used for categorization, and one variable for the vertical extent
of the bar. The extent variable must be numeric, while the categorization variable should be a set
of unique values.

### Configuration

The bar component generates SVG rect elements from arrays of data objects.

#### `bar.x(x)`

Specifies the _x_-values of the rectangles. Can be a value or a function.

#### `bar.y(y)`

Specifies the _y_-values of the rectangles. Can be a value or a function.

#### `bar.width(width)`

Specifies the _width_-values of the rectangles. Can be a value or a function.

#### `bar.height(height)`

Specifies the _height_-values of the rectangles. Can be a value or a function.

#### `bar.fill([fill])`

Specifies the fill-value of the rectangles. Can be a value or a function (default: black).

#### `bar.stroke([stroke])`

Specifies the stroke-value of the rectangles. Can be a value or a function (default: black).

## Chart

This example shows several edge cases and specialties:

- Long axis labels can be word-wrapped by configuring the axis component
- Long axis ticks can be toggled as guide lines to aid chart reading, which can be useful to see
  when looking at static charts
- Missing data renders a tooltip stating that there is no data. This uses `sszvis.move` to provide
  hover functionality in the absence of a bar.

```project
{
    "name": "bar-chart-vertical-basic",
    "files": {
        "index.html": {
            "source": "bar-chart-vertical/basic.html",
            "template": "template.html"
        },
        "data.csv": "bar-chart-vertical/data/SiVB_longNames.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",

    },
    "sourceView": ["index.html", "data.csv"]
}
```

## Many Years

In some cases, many values in a category should be shown. In this example, a linear scale is used in
place of a categorical one. This simplifies the construction of the _x_-axis.

```project
{
    "name": "bar-chart-vertical-many-years",
    "files": {
        "index.html": {
            "source": "bar-chart-vertical/many-years.html",
            "template": "template.html"
        },
        "data.csv": "bar-chart-vertical/data/SiVB_yearly_many.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",

    },
    "sourceView": ["index.html", "data.csv"]
}
```
