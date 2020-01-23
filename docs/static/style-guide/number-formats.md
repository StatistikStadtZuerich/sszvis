> Numbers can be formatted in various ways, depending on the Chart's message. This library provides functions to format the numbers in the preferred style.

## Formatting Functions

#### `sszvis.formatPercent(x)`

A number will be transformed into a percent format.

```table
rows:
  - Function: formatPercent
    Example: sszvis.formatPercent(55.3)
    Result: "55.3 %"
  - Function:
    Example: sszvis.formatPercent(7)
    Result: "7 %"
```

## Live examples

### `formatNumber`

Numbers greater than 9999 use a thousands separator space.

```project
{
    "name": "bar-chart-vertical-stacked",
    "files": {
        "index.html": {
            "source": "bar-chart-vertical-stacked/basic.html",
            "template": "template.html"
        },
        "data.csv": "bar-chart-vertical-stacked/data/StVB_7Categories_yearly.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",

    },
    "sourceView": ["index.html", "data.csv"]
}
```
