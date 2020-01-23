# Stacked Bar Chart - Horizontal

## sszvis.stackedBarHorizontal

### Data structure

This chart expects an array of arrays, where each sub array is one layer of the stack. The stacks are formed by finding elements in each layer with the same _y_-value, and computing the size of each element based on a _x_-value.

#### Caution

Because it uses a d3.stack layout under the hood, this component will assign two special values to each data point passed to it: `y0`, the baseline value for each point, and `y`, the extent of each point. This assignment will overwrite any existing properties on the data object named `y0` or `y`. These are intermediate values used to compute the bars' positioning in stack, and will be assigned even though the stack is horizontal. In the end, these values are used to calculate _x_ positions and bar _widths_.

### Configuration

The stackedBar.horizontal component is a combination of the sszvis bar component and a [d3 stack layout](https://github.com/d3/d3-shape/blob/master/README.md#stacks). The stack is constructed horizontally, using the _y_-value of each data element to form groups, and then calculating, for each element, the cumulative _x_-values to the left of it in the stack.

#### `stackedBarHorizontal.xAccessor(xAcc)`

Specifies an _x_-accessor for the stack layout. The result of this function is used to compute the horizontal extent of each element in the stack. The return value must be a number.

#### `stackedBarHorizontal.xScale(xScale)`

Specifies an _x_-scale for the stack layout. This scale is used to position the elements of each stack, both the left offset value and the width of each stack segment.

#### `stackedBarHorizontal.width(width)`

Specifies a width for the bars in the stack layout. This value is not used in the horizontal orientation. (xScale is used instead).

#### `stackedBarHorizontal.yScale(yScale)`

A y-scale. After the stack is computed, the y-scale is used to position each stack.

#### `stackedBarHorizontal.height(height)`

Specify the height of each rectangle. This value determines the height of each element in the stacks.

#### `stackedBarHorizontal.fill([fill])`

Specify a fill value for the rectangles (default black).

#### `stackedBarHorizontal.stroke([stroke])`

Specify a stroke value for the stack rectangles (default none).

### Chart

In this example, twelve distinct categories make up each stack, and the total for each stack is 100.

```project
{
    "name": "bar-chart-horizontal-stacked-basic",
    "files": {
        "index.html": {
            "source": "bar-chart-horizontal-stacked/basic.html",
            "template": "template.html"
        },
        "data.csv": "bar-chart-horizontal-stacked/data/SHB_basic_percent.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",

    },
    "sourceView": ["index.html", "data.csv"]
}
```
