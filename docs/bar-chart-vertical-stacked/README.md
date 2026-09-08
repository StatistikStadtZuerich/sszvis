## sszvis.stackedBarVertical

### Data structure

The stackedBarVertical component requires an array of arrays, where each array represents a slice of the stack. Each slice should be an array consist of two values for the _y0_ and _y1_ properties, followed by a data object, series and stack properties.

```code
const stackedData = [
    [
        [0,10, data: {...}, series: "key1", stack: "A"],
        [0,8, data: {...}, series: "key1", stack: "B"],
        [0,16, data: {...}, series:"key1"2, stack: "C"]
        key: "key1"
    ],
    [
        [10,16, data: {...}, series: "key1", stack: "A"],
        [8,20, data: {...}, series: "key1", stack: "B"],
        [16,18, data: {...}, series: "key1", stack: "C"]
        key: "key2"
    ],
]
```

`sszvis.stackedBarVerticalLayout` returns those series inside an object, alongside the metadata:

```code
const layout = {
    series: stackedData,
    keys: ["key1", "key2"],
    maxValue: 20,
    minValue: 0
}
```

#### Caution

Because it uses a [d3 stack](https://d3js.org/d3-shape/stack) under the hood, this component will assign two special values to each data point passed to it: `0`, the baseline value for each point, and `1`, the extent of each point. This assignment will overwrite any existing properties on the data object named `0` or `1`.

### Configuration

In order to construct a stacked data structure we use `sszvis.stackedBarVerticalLayout` to build a generator function that takes the data and returns the stacked data. The generator function is then called with the data to get the stacked data. It takes the _x_, _c_, and _y_ accessors as arguments and returns an object with the series in `.series` and the aggregated `.keys`, `.maxValue` and `.minValue` beside them.

`sszvis.stackedBarVerticalData` is the older form of the same generator. It returns the series array itself, with `.maxValue` and `.minValue` assigned onto it - deprecated, because every array operation drops them - and no `.keys`.

```code
const stackLayout = sszvis.stackedBarVerticalLayout(xAcc, cAcc, yAcc);
const layout = stackLayout(data);

state.stackedData = layout.series;
state.categories = layout.keys;
state.maxStacked = layout.maxValue;
```

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

Specify a stroke value for the stack rectangles. Defaults to a white one-pixel line, which separates touching stack segments. Pass `"none"` for seamless stacks, or `null` to leave the stroke unset entirely.

#### `stackedBarVertical.transition([transition])`

Whether to animate the rectangles into their new geometry. Defaults to `true`. Pass `false` to write each render synchronously, which is what you want when another component drives the timing.

### Chart

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
