> Pie Charts are suited to show how much individual quantities contribute to a total value.

Because the wedge angles are offset in different ways, it is difficult to compare values for the
same quantity across different pie charts. In these circumstances, a stacked chart is often a
suitable alternative.

## sszvis.pie

### Data structure

The chart requires one numeric data field and one categorical data field. The numeric values must be
summed, and the contribution of each category's value to the sum is displayed in the pie chart.

### Configuration

Pie charts use [d3.arc](https://github.com/d3/d3-shape/blob/master/README.md#arcs) internally and
work similarly.

#### `pie.radius()`

The radius of the pie chart (in pixels).

#### `pie.angle([angle])`

Accessor function for retrieving the angle of the wedge (in radians) that represents each data
value.

#### `pie.fill([fill])`

String or function to set the fill color (default: black)

#### `pie.stroke([stroke])`

String or function to set the stroke color (default: none)

## Chart

A basic pie chart example, with tooltip interaction. Shows the creation of a pie chart with many
categories.

```project
{
    "name": "pie-chart-basic",
    "files": {
        "index.html": {
            "source": "pie-charts/basic.html",
            "template": "template.html"
        },
        "data.csv": "pie-charts/data/P_7Categories.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",

    },
    "sourceView": ["index.html", "data.csv"]
}
```

## sszvis.layoutSmallMultiples

To render pie charts in a group, the multiples component can be used to create SVG groups into which
charts can be rendered.

### Data structure

This component takes an array of data objects, each of which represents a single group. Each group
object should have a property called 'values' which is data to be stored for each group. The group
objects will also be given properties by this component, when the component is called. These
properties can then be used to identify the group's data, and to position overlays and interfaces
relative to the group.

### Configuration

#### `layoutSmallMultiples.width()`

The total width of all groups

#### `layoutSmallMultiples.height()`

The total height of all groups

#### `layoutSmallMultiples.paddingX()`

The pixel padding to place between columns of groups

#### `layoutSmallMultiples.paddingY()`

The pixel padding to place between rows of groups

#### `layoutSmallMultiples.rows()`

The number of rows of groups to create

#### `layoutSmallMultiples.cols()`

The number of columns of groups to create

### Chart

Shows the use of the multiples component to render several pie charts, each one showing a different
segment of the same data. Includes an example of the use of a repeated tooltip component.

```project
{
    "name": "pie-chart-multiples",
    "readme": "/pie-charts/README.md",
    "files": {
        "index.html": {
            "source": "pie-charts/multiples.html",
            "template": "template.html"
        },
        "data.csv": "pie-charts/data/P_multiples.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",

    },
    "sourceView": ["index.html", "data.csv"]
}
```
