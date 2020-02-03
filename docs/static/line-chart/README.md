> Line charts are suited to show a functional relation between at least two attributes.

## sszvis.line

### Data structure

This chart requires at least two variables that can be put in relation to each other. To create a multiple line chart, two variables are needed that can be plotted on the y-axis and that share a common third variable to define the x-axis.

### Configuration

Line charts use [d3.line](https://github.com/d3/d3-shape/blob/master/README.md#lines) internally and work similarly.

#### `line.x([x])`

Accessor function to read _x_-values from the data.

#### `line.y([y])`

Accessor function to read _y_-values from the data.

#### `line.defined([predicate])`

Accessor function to specify which data points are defined (default: `line.y` is not `NaN`).

#### `line.stroke([stroke])`

String or function to set the stroke color (default: black)

#### `line.strokeWidth([width])`

String or function to set the stroke thickness (default: 1)

### Chart

```project
{
    "name": "line-chart-basic",
    "files": {
        "index.html": {
            "source": "line-chart/basic.html",
            "template": "template.html"
        },
        "data.csv": "line-chart/data/ML_2Categories_Quarterly.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",

    },
    "sourceView": ["index.html", "data.csv"]
}
```

## Usage example: Ordinal Scale

To use an ordinal scale with a line chart, set `ordinal()`.

```
var xAxis = sszvis.axisX
  .ordinal()
  .scale(xScale)
```

To create a single line chart as in the example below, set the third variable to null.

```
function parseRow(d) {
    return {
        xValue: d["Jahr"],
        yValue: sszvis.parseNumber(d["Wert"]),
        category: null // third variable is set to null
        };
    }
```

```project
{
    "name": "line-chart-ordinal",
    "files": {
        "index.html": {
            "source": "line-chart/ordinal.html",
            "template": "template.html"
        },
        "data.csv": "line-chart/data/ML_school_years.csv",
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
    "name": "line-chart-two-axis",
    "files": {
        "index.html": {
            "source": "line-chart/two-axis.html",
            "template": "template.html"
        },
        "data.csv": "line-chart/data/S_2yAxis.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",

    },
    "sourceView": ["index.html", "data.csv"]
}
```
