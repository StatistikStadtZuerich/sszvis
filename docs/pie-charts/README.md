> Pie Charts are suited to show how much individual quantities contribute to a total value.

Because the wedge angles are offset in different ways, it is difficult to compare values for the same quantity across different pie charts. In these circumstances, a stacked chart is often a suitable alternative.

## sszvis.pie

### Data structure

The chart requires one numeric data field and one categorical data field. The numeric values must be summed, and the contribution of each category's value to the sum is displayed in the pie chart.

### Configuration

Pie charts use [d3.arc](https://github.com/d3/d3-shape/blob/master/README.md#arcs) internally and work similarly.

#### `pie.radius()`

The radius of the pie chart (in pixels).

#### `pie.angle([angle])`

Accessor function for retrieving the angle of the wedge (in radians) that represents each data value.

#### `pie.fill([fill])`

String or function to set the fill color (default: black)

#### `pie.stroke([stroke])`

String or function to set the stroke color (default: none)

## Chart

A basic pie chart example, with tooltip interaction. Shows the creation of a pie chart with many categories.

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
