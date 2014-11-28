# Multiple line chart

> Line charts are suited to show a functional relation between two attributes.

## sszvis.component.line

### Data structure

This chart requires at least two variables that can be plotted on the y-axis and that share a common third variable to define the x-axis.

### Configuration

The multiple line chart uses the same components as the [single line chart](/#/line-chart-single) and thus has the same configuration options.

### Chart

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
        "height": 460
    }
}
```

## Usage example: Many years

Observations for the same variable across many years.

``` project
{
    "name": "line-chart-multiple-eight-cat",
    "files": {
        "index.html": {
            "source": "docs/line-chart-multiple/eight-cat.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/line-chart-multiple/data/ML_months_8Categories_superposition_missing.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "docs/fallback.png",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 485
    }
}
```

## Usage example: Three axis chart

Comparison of two datasets with huge differences in values over the same time period by using two y-axes instead of just one.

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
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 525
    }
}
```
