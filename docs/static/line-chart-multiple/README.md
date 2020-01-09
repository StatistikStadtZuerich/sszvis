# Multiple line chart

> Line charts are suited to show a functional relation between two attributes.

## sszvis.line

### Data structure

This chart requires at least two variables that can be plotted on the y-axis and that share a common third variable to define the x-axis.

### Configuration

The multiple line chart uses the same components as the [single line chart](line-chart-single) and thus has the same configuration options.

### Chart

```project
{
    "name": "line-chart-multiple-two-cat",
    "files": {
        "index.html": {
            "source": "line-chart-multiple/two-cat.html",
            "template": "template.html"
        },
        "data.csv": "line-chart-multiple/data/ML_2Categories_Quarterly.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",

    },
    "sourceView": ["index.html", "data.csv"]
}
```

## Usage example: Many years

Observations for the same variable across many years.

```project
{
    "name": "line-chart-multiple-eight-cat",
    "files": {
        "index.html": {
            "source": "line-chart-multiple/eight-cat.html",
            "template": "template.html"
        },
        "data.csv": "line-chart-multiple/data/ML_months_8Categories_superposition_missing.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",

    },
    "sourceView": ["index.html", "data.csv"]
}
```

## Usage example: Three axis chart

Comparison of two datasets with huge differences in values over the same time period by using two y-axes instead of just one.

```project
{
    "name": "line-chart-multiple-two-axis",
    "files": {
        "index.html": {
            "source": "line-chart-multiple/two-axis.html",
            "template": "template.html"
        },
        "data.csv": "line-chart-multiple/data/S_2yAxis.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",

    },
    "sourceView": ["index.html", "data.csv"]
}
```

## Parametric Chart

Using a config object to define chart.

```project
{
    "name": "line-chart-multiple-parametric",
    "files": {
        "index.html": {
            "source": "line-chart-multiple/parametric.html",
            "template": "template.html"
        },
        "data.csv": "line-chart-multiple/data/ML_2Categories_Quarterly.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",

    },
    "sourceView": ["index.html", "data.csv"]
}
```

## Demonstrating the label adjustment code

Note the use of `.reduceOverlap(false)` on the ruler component. In order to change the default value and let the labels overlap, set the `.reduceOverlap()` to false. This can be done by adding this snippet to the ruler component:

```code
.reduceOverlap(false);
```

If this method causes any problems, the `.labelId()` can also be set before the `.reduceOverlap()`.

```code
.labelId(cAcc)
.reduceOverlap(false);
```

Notice the effect in the following example:

```project
{
    "name": "line-chart-label-adjustment",
    "files": {
        "index.html": {
            "source": "line-chart-multiple/label-adjustment.html",
            "template": "template.html"
        },
        "data.csv": "line-chart-multiple/data/arbeitslose.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",

    },
    "sourceView": ["index.html", "data.csv"]
}
```
