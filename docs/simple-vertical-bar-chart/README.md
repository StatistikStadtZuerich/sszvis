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


## Four Cities

A good default - compares four entities.

```project
{
    "name": "simple-vertical-bar-chart-four-cities",
    "files": {
        "index.html": {
            "source": "docs/simple-vertical-bar-chart/four-cities.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/simple-vertical-bar-chart/data/SiVB_fourCities.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "height": 485,
        "width": 516
    }
}
```

## Basic Data

Displays age groups, and includes long axis ticks to aid chart reading.

```project
{
    "name": "simple-vertical-bar-chart-basic",
    "files": {
        "index.html": {
            "source": "docs/simple-vertical-bar-chart/basic.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/simple-vertical-bar-chart/data/SiVB_basic.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "height": 485,
        "width": 516
    }
}
```

## Few Categories

The bar layout function is flexible with respect to the overall width and the number of categories to be displayed.

```project
{
    "name": "simple-vertical-bar-chart-few-categories",
    "files": {
        "index.html": {
            "source": "docs/simple-vertical-bar-chart/few-categories.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/simple-vertical-bar-chart/data/SiVB_fewCategories.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "height": 485,
        "width": 516
    }
}
```

## Few Categories - Missing Values

When values are missing, no bar is shown.

```project
{
    "name": "simple-vertical-bar-chart-few-categories-missing",
    "files": {
        "index.html": {
            "source": "docs/simple-vertical-bar-chart/few-categories-missing.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/simple-vertical-bar-chart/data/SiVB_fewCategories_missing.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "height": 485,
        "width": 516
    }
}
```

## Long Names

Long axis labels can be word-wrapped by configuring the axis component.

```project
{
    "name": "simple-vertical-bar-chart-long-names",
    "files": {
        "index.html": {
            "source": "docs/simple-vertical-bar-chart/long-names.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/simple-vertical-bar-chart/data/SiVB_longNames.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "height": 485,
        "width": 516
    }
}
```

## Many Years

In some cases, many values in a category should be shown. In this example, a linear scale is used in place of a categorical one. This simplifies the construction of the *x*-axis.

```project
{
    "name": "simple-vertical-bar-chart-many-years",
    "files": {
        "index.html": {
            "source": "docs/simple-vertical-bar-chart/many-years.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/simple-vertical-bar-chart/data/SiVB_yearly_many.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "height": 485,
        "width": 516
    }
}
```
