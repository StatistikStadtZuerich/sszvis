## sszvis.nestedStackedBarsVertical

### Data structure

The nestedStackedBarsVertical is a combination of the two data structures used in the [Stacked BarVertical](../#/bar-chart-vertical-stacked) and [Bar Vertical](../#/bar-chart-vertical) components. The first layer is a grouping by the nested-group key - the value you cascade by, and the one `offset` usually reads - and the second layer is a computed layout based on the `sszvis.stackedBarVerticalData` function, inside which the x-axis value is the stack dimension. The result is an array of stack layouts, one per nested group, each tagged with the group key it belongs to. Each layout is the array of series `sszvis.stackedBarVerticalData` returns; each slice is an array of the _y0_ and _y1_ values, followed by a data object, a series and a stack property.

```code
const stackedData = [
    [
        [
            [0,10, data: {...}, series: "key1", stack: "2020"],
            [0,20, data: {...}, series: "key1", stack: "2021"],
            key: "key1"
        ],
        [
            [10,14, data: {...}, series: "key2", stack: "2020"],
            [20,22, data: {...}, series: "key2", stack: "2021"],
            key: "key2"
        ],
        key: "A"
    ],
    // ... one more layout per nested group
]
```

The group key labels the nested group and is what `offset` usually reads to position it. `key` is its name and `nest` an accepted alias. Neither is required: a layout carrying no key is reported with a console warning and labelled by its index instead.

#### One row per stack cell

`sszvis.stackedBarVerticalData` sums every row that falls into the same (x, series)
cell. Make sure a cell holds exactly one row, or that summing the rows it does hold is
meaningful. The `basic` example's source data breaks each share down by age as well, and
the shares within one age group already sum to 100%, so it filters to a single age group
rather than adding percentages across them.

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
    stack.key = d[0].nestedCategory;
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

#### `nestedStackedBarsVertical.stroke(stroke)`

Specify a function or a string for the stroke that separates touching stack rectangles. Defaults to white. Pass `"none"` for stacks with no visible separator, or `null` to leave the stroke unset entirely. If a function is provided, it is called with the slice and its index and should return a color.

#### `nestedStackedBarsVertical.tooltip(tooltip)`

A function which returns the content for the tooltip. The function is called with the data element and should return a string.

#### `nestedStackedBarsVertical.xAcc(xAcc)`

Deprecated and optional. A function which returns the x-value for each data element. The component no longer reads it — each nested group is labelled from the `key` its own stack layout carries — so it can be omitted, and a future major version will remove it.

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
