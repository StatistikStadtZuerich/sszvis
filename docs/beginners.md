# Charts for beginners

> These charts are fully parametrized for simple usage

## Line chart – Parametric Configuration

Generates a chart based on a config object

```project
{
    "name": "line-chart-single-automatic",
    "files": {
        "index.html": {
            "source": "docs/line-chart-single/parametric.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/line-chart-single/data/SL_quarterly.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "docs/fallback.png",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 414
    }
}
```

## Multiple line chart – Parametric Configuration

Generates a chart based on a config object

``` project
{
    "name": "line-chart-multiple-two-cat",
    "files": {
        "index.html": {
            "source": "docs/line-chart-multiple/parametric.html",
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

## Grouped Bar Chart – Parametric Configuration
With negative and missing values

```project
{
    "name": "bar-chart-grouped_gb-two-small",
    "files": {
        "index.html": {
            "source": "docs/bar-chart-grouped/gb-two-small-parametric.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/bar-chart-grouped/data/GB_2Categories_smallVals.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "docs/fallback.png",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 515
    }
}
```