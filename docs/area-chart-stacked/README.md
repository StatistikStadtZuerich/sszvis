# Stacked Area Chart

> Stacked area charts are useful for showing how component parts contribute to a total quantity, while also showing how those components and the total quantity change across change in another dimension, usually time.

## sszvis.component.stackedArea

### Data structure

This component requires an array of layer objects, where each layer object represents a layer in the stack.

### Configuration

The stackedArea component uses a [d3 stack layout](https://github.com/mbostock/d3/wiki/Stack-Layout) under the hood, so some of its configuration properties are similar.

#### `area.x(x)`

Accessor function to read *x*-values from the data. Should return a value in screen pixels. Used to figure out which values share a vertical position in the stack.

#### `area.yAccessor(yAcc)`

Accessor function to read raw *y*-values from the data. Should return a value which is in data-units, not screen pixels. The results of this function are used to compute the stack, and they are then passed into the yScale before display.

#### `area.yScale(yScale)`

A y-scale for determining the vertical position of data quantities. Used to compute the bottom and top lines of the stack.

#### `area.fill([fill])`

Accessor function for the area fill. Passed a layer object.

#### `area.stroke([stroke])`

Accessor function for the area stroke. Passed a layer object.

#### `area.key([keyFunction])`

Specify a key function for use in the data join. The value returned by the key should be unique among stacks. This option is particularly important when creating a chart which transitions between stacked and separated views.

#### `area.valuesAccessor([values])`

Specify an accessor for the values of the layer objects. The default treats the layer object as an array of values. Use this if your layer objects are something like:

```code
{ name: "Name", values: [ ... Array of data values ... ] }
```


### Chart

```project
{
    "name": "area-chart-stacked-three",
    "files": {
        "index.html": {
            "source": "docs/area-chart-stacked/sa-three.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/area-chart-stacked/data/SA_3Categories_yearly_zeroes.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "docs/fallback.png",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"]
}
```

## sszvis.component.stackedAreaMultiples

### Data structure

This component, like stackedArea, requires an array of layer objects, where each layer object is one of the multiples. In addition to stackedArea, this chart's layers can be separated to provide two views on the data: a sum of all elements as well as every element on its own.

### Configuration

#### `areaMultiples.x(x)`

Accessor function for the *x*-values. Passed a data object and should return a value in screen pixels.

#### `areaMultiples.y0(y0)`

Accessor function for the *y0*-value (the baseline of the area). Passed a data object and should return a value in screen pixels.

#### `areaMultiples.y1(y1]`

Accessor function for the *y1*-value (the top line of the area). Passed a data object and should return a value in screen pixels.

#### `areaMultiples.fill([fill])`

Accessor function for the area fill. Passed a layer object.

#### `areaMultiples.stroke([stroke])`

Accessor function for the area stroke. Passed a layer object.

#### `areaMultiples.key([keyFunction])`

Specify a key function for use in the data join. The value returned by the key should be unique among stacks. This option is particularly important when creating a chart which transitions between stacked and separated views.

#### `areaMultiples.valuesAccessor([values])`

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
            "source": "docs/area-chart-stacked/sa-two.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/area-chart-stacked/data/SA_2Categories_yearly.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "docs/fallback.png",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"]
}
```

## Many separable stacks

```project
{
    "name": "area-chart-stacked-twelve",
    "files": {
        "index.html": {
            "source": "docs/area-chart-stacked/sa-twelve.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/area-chart-stacked/data/SA_12Kategories_yearly.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "docs/fallback.png",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"]
}
```
