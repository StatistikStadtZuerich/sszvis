# Scatterplot

> Scatterplots are used to display relationships between two numeric values of a dataset. They are useful for displaying correlations and trends which appear when you organize the dimensions next to each other.

## sszvis.component.dot

### Data structure

The dot component is used to render inidividual dots. It takes a flat array of data objets, and each data object is turned into a dot.

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

### Chart

```project
{
    "name": "scatterplot-refline-fake",
    "files": {
        "index.html": {
            "source": "docs/scatterplot/refline-fake.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/scatterplot/data/SS_refline_fake.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 469
    }
}
```

### Scatterplot with variable radius and voronoi-cell interaction

```project
{
    "name": "scatterplot-variable-radius",
    "files": {
        "index.html": {
            "source": "docs/scatterplot/variable-radius.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/scatterplot/data/VRS_basic.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 495
    }
}
```

### Many Years

```project
{
    "name": "scatterplot-many-years",
    "files": {
        "index.html": {
            "source": "docs/scatterplot/years-fake.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/scatterplot/data/SS_years_fake.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 535
    }
}
```
