# Heat Table

> The heat table can be used to show off a matrix of values. Use it to display how a single variable varies across all the combinations of two categorical variables.

## No special component

The heat table does not have a special component. Instead, it is constructed using the sszvis bar component by setting the width and height equal to each other, and with a creative use of the *x*- and *y*-position functions. Both *x*- and *y*-scales are ordinal scales which use the rangeBands function to calculate the output range.

### Data structure

This component requies a flat array of objects, and each object is turned into one square in the heat table.

#### Minimum three dimensions

* x-axis dimension
* y-axis dimension
* value (color) dimension

### Configuration

The following configuration options are available:
* Interaction - tooltips, highlighting, etc.
* Color scale
* x-axis
* y-axis
* dimensions of table squares (not necessarily squares)

### Examples

### Kreise - With missing values

```project
{
    "name": "heat-table-kreise",
    "files": {
        "index.html": {
            "source": "docs/heat-table/ht-kreise.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/heat-table/data/HT_kreise.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 800
    }
}
```

### Binned Color Scale - Linear

For more on the different ways to construct binned color scales from a range of values, see: http://uxblog.idvsolutions.com/2011/10/telling-truth.html

```project
{
    "name": "heat-table-binned-linear",
    "files": {
        "index.html": {
            "source": "docs/heat-table/ht-binned-linear.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/heat-table/data/HT_binned_linear.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 516
    }
}
```

### Wer mit wem? - Irregularly Binned Color Scale Example

Welches haben Paare zum Zeitpunkt ihres ersten Kindes.

```project
{
    "name": "heat-table-wermitwem",
    "files": {
        "index.html": {
            "source": "docs/heat-table/ht-wermitwem.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/heat-table/data/HT_wermitwem.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 360
    }
}
```
