> Stacked area charts are useful for showing how component parts contribute to a total quantity, while also showing how those components and the total quantity change across change in another dimension, usually time.

## sszvis.stackedArea

### Data structure

The stackedArea component requires an stacked structure of data. The structure converts a flat data array into an array of layer arrays, where each layer array represents a category or component of the total quantity. Each layer array should have a `key` property, which is used to identify the layer in the data join. The layer array is then made up of computed values for the _y0_ and _y1_ positions of the area, which are used to draw the area chart as well as a `data` property, which is the original data object that the layer was computed from.

```code
const stackedData = [
  [
      [0, 10, data: {...}],
      [0, 20, data: {...}]
      key: "key1"
  ],
    [
      [10, 16, data: {...}],
      [20, 29, data: {...}]
      key: "key2"
  ]
]
```

### Configuration

In order to construct a stacked data structure we use  to build a generator function that takes the data and returns the stacked data. The generator function is then called with the data to get the stacked data. In order to convert the tidy data into a flat structure, we use the sszvis cascade function to group the data by the x-axis and then by the category. The data is then mapped to the stacked data structure.

```code
var stackLayout = d3.stack().keys(["key1", "key2", "key3"]);

var stackedData = stackLayout(
  sszvis
    .cascade()
    .arrayBy(xAcc)
    .objectBy(cAcc)
    .apply(state.data)
    .map((d) => {
      const r = { yValue: d[Object.keys(d)[0]][0].yValue };
      for (const k of ["key1", "key2", "key3"]) {
        r[k] = yAcc(d[k][0]);
      }
      return r;
    })
);
```

#### `stackedArea.x(x)`

Accessor function to read _x_-values from the data. Should return a value in screen pixels. Used to figure out which values share a vertical position in the stack.

#### `stackedArea.y0(y0)`

Accessor function to read _y0_-values from the data (lower bound of stacked value). Should return a value in screen pixels. Used to figure out which values share a vertical position in the stack.

#### `stackedArea.y1(y1)`

Accessor function to read _y1_-values from the data (upper bound of stacked value). Should return a value in screen pixels. Used to figure out which values share a vertical position in the stack.

#### `stackedArea.defined([predicate])`

Accessor function to specify which data points are defined (default: `stackedArea.y0` and `stackedArea.y1` are not `NaN`).

#### `stackedArea.yScale(yScale)`

A y-scale for determining the vertical position of data quantities. Used to compute the bottom and top lines of the stack.

#### `stackedArea.fill([fill])`

Accessor function for the area fill. Passed a layer object.

#### `stackedArea.stroke([stroke])`

Accessor function for the area stroke. Passed a layer object.

#### `stackedArea.key([keyFunction])`

Specify a key function for use in the data join. The value returned by the key should be unique among stacks. This option is particularly important when creating a chart which transitions between stacked and separated views.

### Chart

```project
{
    "name": "area-chart-basic",
    "files": {
        "index.html": {
            "source": "area-chart-stacked/basic.html",
            "template": "template.html"
        },
        "data.csv": "area-chart-stacked/data/SA_2Categories_yearly.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",

    },
    "sourceView": ["index.html", "data.csv"]
}
```

## sszvis.stackedAreaMultiples

### Data structure

This component, like stackedArea, requires an array of layer objects, where each layer object is one of the multiples. In addition to stackedArea, this chart's layers can be separated to provide two views on the data: a sum of all elements as well as every element on its own.

### Configuration

#### `stackedAreaMultiples.x(x)`

Accessor function for the _x_-values. Passed a data object and should return a value in screen pixels.

#### `stackedAreaMultiples.y0(y0)`

Accessor function for the _y0_-value (the baseline of the area). Passed a data object and should return a value in screen pixels.

#### `stackedAreaMultiples.y1(y1]`

Accessor function for the _y1_-value (the top line of the area). Passed a data object and should return a value in screen pixels.

#### `stackedAreaMultiples.fill([fill])`

Accessor function for the area fill. Passed a layer object.

#### `stackedAreaMultiples.stroke([stroke])`

Accessor function for the area stroke. Passed a layer object.

#### `stackedAreaMultiples.defined([predicate])`

Accessor function to specify which data points are defined (default: `stackedAreaMultiples.y0` and `stackedAreaMultiples.y1` are not `NaN`).

#### `stackedAreaMultiples.key([keyFunction])`

Specify a key function for use in the data join. The value returned by the key should be unique among stacks. This option is particularly important when creating a chart which transitions between stacked and separated views.

#### `stackedAreaMultiples.valuesAccessor([values])`

Specify an accessor for the values of the layer objects. The default treats the layer object as an array of values. Use this if your layer objects are something like:

```code
{ name: "Name", values: [ ... Array of data values ... ] }
```

### Chart

```project
{
    "name": "area-chart-stacked-two",
    "files": {
        "index.html": {
            "source": "area-chart-stacked/sa-two.html",
            "template": "template.html"
        },
        "data.csv": "area-chart-stacked/data/SA_2Categories_yearly.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",

    },
    "sourceView": ["index.html", "data.csv"]
}
```
