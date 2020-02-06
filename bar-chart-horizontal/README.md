> Bar charts are suited to comparing numeric values for different categories. The categories can be ordered or unordered, numeric or non-numeric.

## sszvis.bar

### Data structure

This chart requires one variable used for categorization, and one variable for the horizontal extent of the bar. The extent variable must be numeric, while the categorization variable should be a set of unique values.

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

### Chart

```hint|neutral
Note that long labels don't work on small mobile screens. For these screens you should keep the labels short.
```

```project
{
    "name": "bar-chart-horizontal-basic",
    "files": {
        "index.html": {
            "source": "bar-chart-horizontal/basic.html",
            "template": "template.html"
        },
        "data.csv": "bar-chart-horizontal/data/SHB_13Categories_longNames.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",

    },
    "sourceView": ["index.html", "data.csv"]
}
```

## Interaction

```project
{
    "name": "bar-chart-horizontal-interactive",
    "files": {
        "index.html": {
            "source": "bar-chart-horizontal/interactive.html",
            "template": "template.html"
        },
        "data.csv": "bar-chart-horizontal/data/SHB_13Categories.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",

    },
    "sourceView": ["index.html", "data.csv"]
}
```
