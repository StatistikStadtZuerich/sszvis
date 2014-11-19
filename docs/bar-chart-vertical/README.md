# Bar Chart - Simple Vertical Bar Chart

> Bar charts are suited to comparing numeric values for different categories. The categories can be ordered or unordered, numeric or non-numeric.

## sszvis.component.bar

### Data structure

This chart requires one variable used for categorization, and one variable for the extent (vertical or horizontal) of the bar. The extent variable must be numeric, while the categorization variable should be a set of unique values.

### Configuration

The bar component generates svg rect elements from arrays of data objects.

#### `bar.x(x)`

Specifies the *x*-values of the rectangles. Can be a value or a function.

#### `bar.y(y)`

Specifies the *y*-values of the rectangles. Can be a value or a function.

#### `bar.width(width)`

Specifies the *width*-values of the rectangles. Can be a value or a function.

#### `bar.height(height)`

Specifies the *height*-values of the rectangles. Can be a value or a function.

#### `bar.fill([fill])`

Specifies the fill-value of the rectangles. Can be a value or a function (default: black).

#### `bar.stroke([stroke])`

Specifies the stroke-value of the rectangles. Can be a value or a function (default: black).

### Chart

```project
{
    "name": "bar-chart-vertical-basic",
    "files": {
        "index.html": {
            "source": "docs/bar-chart-vertical/basic.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/bar-chart-vertical/data/SiVB_fourCities.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "height": 393,
        "width": 516
    }
}
```

## Specialties

This example shows several edge cases and specialties:

* Long axis labels can be word-wrapped by configuring the axis component
* Long axis ticks can be toggled to aid chart reading, which can be useful to see when looking at static charts
* Missing data renders a tooltip stating that there is no data. This uses `sszvis.behavior.move` to provide hover functionality in the absence of a bar.

```project
{
    "name": "bar-chart-vertical-long-names",
    "files": {
        "index.html": {
            "source": "docs/bar-chart-vertical/long-names.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/bar-chart-vertical/data/SiVB_longNames.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "height": 428,
        "width": 516
    }
}
```

## Many Years

In some cases, many values in a category should be shown. In this example, a linear scale is used in place of a categorical one. This simplifies the construction of the *x*-axis.

```project
{
    "name": "bar-chart-vertical-many-years",
    "files": {
        "index.html": {
            "source": "docs/bar-chart-vertical/many-years.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/bar-chart-vertical/data/SiVB_yearly_many.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "height": 393,
        "width": 516
    }
}
```
