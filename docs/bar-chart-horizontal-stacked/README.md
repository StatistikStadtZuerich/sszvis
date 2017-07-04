# Stacked Bar Chart - Horizontal

## sszvis.stackedBarHorizontal

### Data structure

This chart expects an array of arrays, where each sub array is one layer of the stack. The stacks are formed by finding elements in each layer with the same *y*-value, and computing the size of each element based on a *x*-value.

#### Caution

Because it uses a d3.stack layout under the hood, this component will assign two special values to each data point passed to it: `y0`, the baseline value for each point, and `y`, the extent of each point. This assignment will overwrite any existing properties on the data object named `y0` or `y`. These are intermediate values used to compute the bars' positioning in stack, and will be assigned even though the stack is horizontal. In the end, these values are used to calculate *x* positions and bar *widths*.

### Configuration

The stackedBar.horizontal component is a combination of the sszvis bar component and a [d3 stack layout](https://github.com/mbostock/d3/wiki/Stack-Layout). The stack is constructed horizontally, using the *y*-value of each data element to form groups, and then calculating, for each element, the cumulative *x*-values to the left of it in the stack.

#### `stackedBar.xAccessor(xAcc)`

Specifies an *x*-accessor for the stack layout. The result of this function is used to compute the horizontal extent of each element in the stack. The return value must be a number.

#### `stackedBar.xScale(xScale)`

Specifies an *x*-scale for the stack layout. This scale is used to position the elements of each stack, both the left offset value and the width of each stack segment.

#### `stackedBar.width(width)`

Specifies a width for the bars in the stack layout. This value is not used in the horizontal orientation. (xScale is used instead).

#### `stackedBar.yAccessor(yAcc)`

The y-accessor. The return values of this function are used to group elements together as stacks.

#### `stackedBar.yScale(yScale)`

A y-scale. After the stack is computed, the y-scale is used to position each stack.

#### `stackedBar.height(height)`

Specify the height of each rectangle. This value determines the height of each element in the stacks.

#### `stackedBar.fill([fill])`

Specify a fill value for the rectangles (default black).

#### `stackedBar.stroke([stroke])`

Specify a stroke value for the stack rectangles (default none).

#### `stackedBar.orientation(orientation)`

Specifies the orientation ("vertical" or "horizontal") of the stacked bar chart. Used internally to configure the verticalBar and the horizontalBar. Should probably never be changed.


### Chart

In this example, twelve distinct categories make up each stack, and the total for each stack is 100.

```project
{
    "name": "bar-chart-horizontal-stacked-basic",
    "files": {
        "index.html": {
            "source": "docs/bar-chart-horizontal-stacked/basic.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/bar-chart-horizontal-stacked/data/SHB_basic_percent.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "docs/fallback.png",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"]
}
```
