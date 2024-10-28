## sszvis.stackedBarHorizontal

### Data structure

The stackedBarHorizontal component requires an array of arrays, where each array represents a slice of the stack. Each slice should be an array consist of two values for the _x0_ and _x1_ properties, followed a data object, series and stack properties.

```code
const stackedData = [
    [
        [0,10, data: {...}, series: "key1", stack: "A"],
        [0,8, data: {...}, series: "key1", stack: "B"],
        [0,16, data: {...}, series:"key1"2, stack: "C"]
        key: "key1"
    ]
    [
        [10,16, data: {...}, series: "key1", stack: "A"],
        [8,20, data: {...}, series: "key1", stack: "B"],
        [16,18, data: {...}, series: "key1", stack: "C"]
        key: "key2"
    ]
]
```

#### Caution

Because it uses a d3.stack layout under the hood, this component will assign two special values to each data point passed to it: `y0`, the baseline value for each point, and `y`, the extent of each point. This assignment will overwrite any existing properties on the data object named `y0` or `y`. These are intermediate values used to compute the bars' positioning in stack, and will be assigned even though the stack is horizontal. In the end, these values are used to calculate _x_ positions and bar _widths_.

### Configuration

In order to construct a stacked data structure we use the `sszvis.stackedBarHorizontalData` function to build a generator function that takes the data and returns the stacked data. The generator function is then called with the data to get the stacked data. The generator function takes the _y_, _c_, and _x_ accessors as arguments. and returns data with aggregated values for the `.maxValue` and `keys`.

```code
const stackLayout = sszvis.stackedBarHorizontalData(yAcc, cAcc, xAcc);
state.stackedData = stackLayout(data);

state.categories = state.stackedData.keys;
state.maxStacked = state.stackedData.maxValue;
```

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
