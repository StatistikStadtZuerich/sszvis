# Bar Chart - Simple Horizontal Bar Chart

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
    "name": "simple-horizontal-bar-chart-long-names",
    "files": {
        "index.html": {
            "source": "docs/simple-horizontal-bar-chart/long-names.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/simple-horizontal-bar-chart/data/SHB_13Categories_longNames.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 620
    }
}
```

## Several Categories and Several Years

```project
{
    "name": "simple-horizontal-bar-chart-13-categories",
    "files": {
        "index.html": {
            "source": "docs/simple-horizontal-bar-chart/13-categories.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/simple-horizontal-bar-chart/data/SHB_13Categories.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 700
    }
}
```

## Several Categories With Guide Lines

```project
{
    "name": "simple-horizontal-bar-chart-basic-percent",
    "files": {
        "index.html": {
            "source": "docs/simple-horizontal-bar-chart/basic-percent.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/simple-horizontal-bar-chart/data/SHB_basic_percent.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 656
    }
}
```

## Missing Values

```project
{
    "name": "simple-horizontal-bar-chart-missing",
    "files": {
        "index.html": {
            "source": "docs/simple-horizontal-bar-chart/missing.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/simple-horizontal-bar-chart/data/S_missing.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 460
    }
}
```
