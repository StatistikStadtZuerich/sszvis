# Stacked Area Chart

> Stacked area charts are useful for showing how component parts contribute to a total quantity, while also showing how those components and the total quantity change across change in another dimension, usually time.

## sszvis.stackedArea

### Data structure

This component requires an array of layer objects, where each layer object represents a layer in the stack.

### Configuration

The stackedArea component uses a [d3 stack layout](https://github.com/d3/d3-shape/blob/master/README.md#stacks) under the hood, so some of its configuration properties are similar.

#### `stackedArea.x(x)`

Accessor function to read *x*-values from the data. Should return a value in screen pixels. Used to figure out which values share a vertical position in the stack.

#### `stackedArea.yAccessor(yAcc)`

Accessor function to read raw *y*-values from the data. Should return a value which is in data-units, not screen pixels. The results of this function are used to compute the stack, and they are then passed into the yScale before display.

#### `stackedArea.yScale(yScale)`

A y-scale for determining the vertical position of data quantities. Used to compute the bottom and top lines of the stack.

#### `stackedArea.fill([fill])`

Accessor function for the area fill. Passed a layer object.

#### `stackedArea.stroke([stroke])`

Accessor function for the area stroke. Passed a layer object.

#### `stackedArea.key([keyFunction])`

Specify a key function for use in the data join. The value returned by the key should be unique among stacks. This option is particularly important when creating a chart which transitions between stacked and separated views.

#### `stackedArea.valuesAccessor([values])`

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
            "source": "area-chart-stacked/sa-three.html",
            "template": "template.html"
        },
        "data.csv": "area-chart-stacked/data/SA_3Categories_yearly_zeroes.csv",
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

Accessor function for the *x*-values. Passed a data object and should return a value in screen pixels.

#### `stackedAreaMultiples.y0(y0)`

Accessor function for the *y0*-value (the baseline of the area). Passed a data object and should return a value in screen pixels.

#### `stackedAreaMultiples.y1(y1]`

Accessor function for the *y1*-value (the top line of the area). Passed a data object and should return a value in screen pixels.

#### `stackedAreaMultiples.fill([fill])`

Accessor function for the area fill. Passed a layer object.

#### `stackedAreaMultiples.stroke([stroke])`

Accessor function for the area stroke. Passed a layer object.

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

## Many separable stacks

```project
{
    "name": "area-chart-stacked-twelve",
    "files": {
        "index.html": {
            "source": "area-chart-stacked/sa-twelve.html",
            "template": "template.html"
        },
        "data.csv": "area-chart-stacked/data/SA_12Kategories_yearly.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",
        
    },
    "sourceView": ["index.html", "data.csv"]
}
```
