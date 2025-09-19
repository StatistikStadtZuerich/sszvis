## sszvis.nestedStackedBarsVertical

### Data structure

The nestedStackedBarsVertical is a combination of the two data structures used in the [Stacked BarVertical](../#/bar-chart-vertical-stacked) and [Bar Vertical](../#/bar-chart-vertical) components. The first layer is a grouping based on the x-axis value, and the second layer is a computed layout based on the `sszvis.stackedBarVerticalData` function. The result is an array of arrays, where each array represents a group of bars, and each group is represented by computed slices. Each slice should be an array consist of two values for the _y0_ and _y1_ properties, followed a data object, series and stack properties.

```code
const stackedData = [
    [
        [0,10, data: {...}, nest: "A",],
        [0,20, data: {...}, nest: "B",],
        [0,16, data: {...}, nest: "C",]
        key: "key1"
    ],
    [
        [10,14, data: {...}, nest: "A",],
        [20,22, data: {...}, nest: "B",],
        [16,22, data: {...}, nest: "C",]
        key: "key2"
    ],
]
```

#### Caution

Because it uses a [d3 stack](https://d3js.org/d3-shape/stack) under the hood, this component will assign two special values to each data point passed to it: `0`, the baseline value for each point, and `1`, the extent of each point. This assignment will overwrite any existing properties on the data object named `0` or `1`.

### Configuration

The nestedStackedBarsVertical component is a complex component which is used to create a vertical stacked bar chart with nested groups. To define the data structure first use the `sszvis.cascade` function to group the data by the first key, and then use the `sszvis.stackedBarVerticalData` function to compute the layout of the stacks.

```code
const stackLayout = sszvis.stackedBarVerticalData(xjAcc, cAcc, yAcc);
state.stackedData = sszvis
  .cascade()
  .arrayBy(aAcc)
  .apply(state.data)
  .map((d) => {
    const stack = stackLayout(d);
    stack.nest = d[0].nestedCategory;
    return stack;
  });

state.categories = sszvis.set(state.data, xjAcc);
state.nestedCategories = sszvis.set(state.data, aAcc);
```

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

### Chart (Basic)

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

### With Confidence Bars

```project
{
    "name": "bar-chart-vertical-nested-confidence",
    "files": {
        "index.html": {
            "source": "bar-chart-vertical-nested/confidence.html",
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
