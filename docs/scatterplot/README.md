> Scatterplots are used to display relationships between two numeric values of a dataset. They are
> useful for displaying correlations and trends which appear when you organize the dimensions next
> to each other.

## sszvis.dot

### Data structure

The dot component is used to render inidividual dots. It takes a flat array of data objets, and each
data object is turned into a dot.

#### `dot.x(x)`

An accessor function for the x-position of the dot.

#### `dot.y(y)`

An accessor function for the y-position of the dot.

#### `dot.radius(radius)`

An accessor function, or a number, for the radius of the dot.

#### `dot.stroke([stroke])`

An accessor function for the stroke color of the dot.

#### `dot.fill([fill])`

An accessor function for the fill color of the dot.

#### Note on clipping scatterplot circles to the chart boundaries

To clip the contents of the chart to chart boundaries (useful for scatterplots with large circles
near the axis, but also potentially for other chart types), you should use an SVG clipPath element
inside a defs element, with a rect that describes the size of the chart area. For information on
these SVG element types, see:
(https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Clipping_and_masking). You can ensure
that the defs element and the necessary contents exist within the chart by using the utilities
included in sszvis. You can check out the documentation of sszvis.svgUtils, and the uses of
ensureDefsElement in various components. Notably, the lake renderer used in the map modules creates
a texture which uses a mask.

### Chart

```project
{
    "name": "scatterplot-refline-fake",
    "files": {
        "index.html": {
            "source": "scatterplot/refline-fake.html",
            "template": "template.html"
        },
        "data.csv": "scatterplot/data/SS_refline_fake.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",

    },
    "sourceView": ["index.html", "data.csv"]
}
```

## Variable radius

Scatterplot with variable radius and [Voronoi cell](http://bl.ocks.org/mbostock/4060366)
interaction.

```project
{
    "name": "scatterplot-variable-radius",
    "files": {
        "index.html": {
            "source": "scatterplot/variable-radius.html",
            "template": "template.html"
        },
        "data.csv": "scatterplot/data/VRS_basic.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",

    },
    "sourceView": ["index.html", "data.csv"]
}
```

## Slider control

```project
{
    "name": "scatterplot-many-years",
    "files": {
        "index.html": {
            "source": "scatterplot/years-fake.html",
            "template": "template.html"
        },
        "data.csv": "scatterplot/data/SS_years_fake.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",

    },
    "sourceView": ["index.html", "data.csv"]
}
```
