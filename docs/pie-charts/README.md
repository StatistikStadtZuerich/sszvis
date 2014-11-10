# Pie Chart

> Pie Charts are suited to show how much individual quantities contribute to a total value. Because the wedge angles are offset in different ways, it is difficult to compare values for the same quantity across different pie charts. In these circumstances, a stacked chart is often a suitable alternative.

## sszvis.component.pie

### Data structure

The chart requires one numeric data field and one categorical data field. The numeric values must be summed, and the contribution of each category's value to the sum is displayed in the pie chart.

### Konfiguration

Pie charts use [d3.svg.arc](https://github.com/mbostock/d3/wiki/SVG-Shapes#arc) internally and work similarly.

#### `pie.radius()`

A number in pixels - the radius of the pie chart

#### `pie.angle([angle])`

Accessor function for retrieving the angle of the wedge (in radians) that represents each data value.

#### `pie.fill([fill])`

String or function to set the fill color (default: black)

#### `pie.stroke([stroke])`

String or function to set the stroke color (default: none)


## Usage example: Single Chart

A basic pie chart example, with tooltip interaction.

```project
{
    "name": "pie-chart-four-cat",
    "files": {
        "index.html": {
            "source": "docs/pie-charts/four-cat.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/pie-charts/data/P_subcategories.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 300
    }
}
```

## Usage example: Many-category pie chart

Shows the creation of a pie chart with many categories

```project
{
    "name": "pie-chart-twelve-cat",
    "files": {
        "index.html": {
            "source": "docs/pie-charts/twelve-cat.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/pie-charts/data/P_7Categories.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 300
    }
}
```


## Multiple Charts - sszvis.component.multiples

> The multiples component creates svg groups into which charts can be rendered.

### Data structure

This component takes an array of data objects, each of which represents a single group. Each group object should have a property called 'values' which is data to be stored for each group. The group objects will also be given properties by this component, when the component is called. These properties can then be used to identify the group's data, and to position overlays and interfaces relative to the group.

### Configuration

### `multiples.width()`

the total width of all groups

### `multiples.height()`

the total height of all groups

### `multiples.paddingX()`

the pixel padding to place between columns of groups

### `multiples.paddingY()`

the pixel padding to place between rows of groups

### `multiples.rows()`

the number of rows of groups to create

### `multiples.cols()`

the number of columns of groups to create

## Usage example: multiple pie charts

Shows the use of the multiples component to render several pie charts, each one showing a different segment of the same data. Includes an example of the use of a repeated tooltip component.

```project
{
    "name": "pie-chart-multiples",
    "readme": "docs/pie-charts/README.md",
    "files": {
        "index.html": {
            "source": "docs/pie-charts/multiples.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/pie-charts/data/P_multiples.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 880
    }
}
```
