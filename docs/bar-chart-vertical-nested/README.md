## sszvis.nestedStackedBarsVertical

### Data structure

This chart expects an array of arrays, where each sub array is one layer of the stack. The stacks are formed by finding elements in each layer with the same _x_-value, and computing the size of each element based on a _y_-value.

#### Caution

Because it uses a d3.stack layout under the hood, this component will assign two special values to each data point passed to it: `y0`, the baseline value for each point, and `y`, the extent of each point. This assignment will overwrite any existing properties on the data object named `y0` or `y`.

### Configuration

The nestedStackedBarsVertical component is a complex component which is used to create a vertical stacked bar chart with nested groups. This component is a wrapper around the [d3 stack layout](https://github.com/d3/d3-shape/blob/master/README.md#stacks), and it is used to create a stacked bar chart with multiple layers of data. The component is designed to be used in conjunction with other components, such as the axis components, to create a complete chart.

#### `nestedStackedBarsVertical.offset(offset)`

Specifies an offset function for the x positioning the nested groups.

#### `nestedStackedBarsVertical.xScale(xScale)`

Specifies an offset function for positioning the nested groups.

#### `nestedStackedBarsVertical.yScale(yScale)`

A y-scale. After the stack is computed, the y-scale is used to position each stack.

#### `nestedStackedBarsVertical.fill(fill)`

Specify a function or a string to fill the stack rectangles. If a function is provided, it will be called with the data element and should return a color. If a string is provided, all stack rectangles will be filled with that color.

#### `nestedStackedBarsVertical.tooltip(tooltip)`

A function which returns the content for the tooltip. The function is called with the data element and should return a string.

#### `nestedStackedBarsVertical.xAcc(xAcc)`

A function which returns the x-value for each data element. This value is used to group elements into stacks.

#### `nestedStackedBarsVertical.xLabel(xLabel)`

A function which returns the x-axis label for each data element. This value is used to label the x-axis.

#### `nestedStackedBarsVertical.slant(slant)`

Specifies the slant of the x-axis labels. The default is no slant.

### Chart

```project
{
    "name": "bar-chart-vertical-nested",
    "files": {
        "index.html": {
            "source": "bar-chart-vertical-nested/basic.html",
            "template": "template.html"
        },
        "data.csv": "bar-chart-vertical-nested/data/nested.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",

    },
    "sourceView": ["index.html", "data.csv"]
}
```
