# Stacked Bar Chart - Vertical

## sszvis.component.stacked.verticalBar

### Data structure

This chart expects an array of arrays, where each sub array is one layer of the stack. The stacks are formed by finding elements in each layer with the same *x*-value, and computing the size of each element based on a *y*-value.

### CAUTION:

Because it uses a d3.stack layout under the hood, this component will assign two special values to each data point passed to it: y0, the baseline value for each point, and y, the extent of each point. This assignment will of course overwrite any existing properties on the data object named y0 or y.

### Configuration

The stacked.verticalBar component is a combination of the sszvis bar component and a d3 stack layout. The stack is constructed vertically, using the *x*-value of each data element to form groups, and then calculating, for each element, the cumulative *y*-values underneath it in the stack.

### `stackedBar.xAccessor(xAcc)`

Specifies an *x*-accessor for the stack layout. The result of this function is used to group elements into stacks.

### `stackedBar.xScale(xScale)`

Specifies an *x*-scale for the stack layout. This scale is used to position stacks based on the result of the *x*-accessor.

### `stackedBar.width(width)`

Specifies a width for the bars in the stack layout. In the vertical orientation, this determines how wide each stack is.

### `stackedBar.yAccessor(yAcc)`

The y-accessor. The values returned by this function are used to construct the stack. The return value must be a number.

### `stackedBar.yScale(yScale)`

A y-scale. After the stack is computed, the y-scale is used to position the rectangles based on the baseline (y0) and the extent of each rectangle (y).

### `stackedBar.height(height)`

Specify the height of each rectangle. This value is not used for the vertical orientation. (yScale(yAccessor(d))) is used instead).

### `stackedBar.fill([fill])`

Specify a fill value for the rectangles (default black).

### `stackedBar.stroke([stroke])`

Specify a stroke value for the stack rectangles (default none).

### `stackedBar.orientation(orientation)`

Specifies the orientation ("vertical" or "horizontal") of the stacked bar chart. Used internally to configure the verticalBar and the horizontalBar. Should probably never be changed.

## Two Categories

A straightforward example with two layers of values.

```project
{
    "name": "stacked-vertical-bar-chart",
    "files": {
        "index.html": {
            "source": "docs/stacked-vertical-bar-chart/three-cat.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/stacked-vertical-bar-chart/data/StVB_3Categories_yearly.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 511
    }
}
```

## Eight Categories

Eight layers of values, with tooltips.

```project
{
    "name": "stacked-vertical-bar-chart",
    "files": {
        "index.html": {
            "source": "docs/stacked-vertical-bar-chart/seven-cat.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/stacked-vertical-bar-chart/data/StVB_7Categories_yearly.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 515
    }
}
```

## Negative Values - Not Practical

Note: The data for this example (StVB_2Categories_yearly_negatives.csv) is incompatible with the chart format, because a stacked bar or area chart can not include negative values. See the explanation in Basecamp:
https://basecamp.com/1762663/projects/6446196/documents/6747425

```project
{
    "name": "stacked-vertical-bar-chart",
    "files": {
        "index.html": {
            "source": "docs/stacked-vertical-bar-chart/two-cat.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/stacked-vertical-bar-chart/data/StVB_2Categories_yearly_negatives.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "height": 50,
        "width": 50
    }
}
```
