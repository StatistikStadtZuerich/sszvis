## sszvis.stackedBarVertical

### Data structure

This chart expects an array of arrays, where each sub array is one layer of the stack. The stacks are formed by finding elements in each layer with the same _x_-value, and computing the size of each element based on a _y_-value.

#### Caution

Because it uses a d3.stack layout under the hood, this component will assign two special values to each data point passed to it: `y0`, the baseline value for each point, and `y`, the extent of each point. This assignment will overwrite any existing properties on the data object named `y0` or `y`.

### Configuration

The stackedBarVertical component is a combination of the sszvis bar component and a [d3 stack layout](https://github.com/d3/d3-shape/blob/master/README.md#stacks). The stack is constructed vertically, using the _x_-value of each data element to form groups, and then calculating, for each element, the cumulative _y_-values underneath it in the stack.

#### `stackedBarVertical.xScale(xScale)`

Specifies an _x_-scale for the stack layout. This scale is used to position stacks based on the result of the _x_-accessor.

#### `stackedBarVertical.width(width)`

Specifies a width for the bars in the stack layout. In the vertical orientation, this determines how wide each stack is.

#### `stackedBarVertical.yScale(yScale)`

A y-scale. After the stack is computed, the y-scale is used to position the rectangles based on the baseline (y0) and the extent of each rectangle (y).

#### `stackedBarVertical.height(height)`

Specify the height of each rectangle. This value is not used for the vertical orientation. (yScale(yAccessor(d))) is used instead).

#### `stackedBarVertical.fill([fill])`

Specify a fill value for the rectangles (default black).

#### `stackedBarVertical.stroke([stroke])`

Specify a stroke value for the stack rectangles (default none).

### Chart

```project
{
    "name": "bar-chart-vertical-stacked",
    "files": {
        "index.html": {
            "source": "bar-chart-vertical-stacked/two-cat.html",
            "template": "template.html"
        },
        "data.csv": "bar-chart-vertical-stacked/data/StVB_2Categories_yearly.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",

    },
    "sourceView": ["index.html", "data.csv"]
}
```

## Many Categories

Eight layers of values, with tooltips.

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
