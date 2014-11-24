# Heat Table

> A heat table can be used to show off a matrix of values. Use it to display how a single variable varies across all the combinations of two categorical variables.

## sszvis.component.bar

The heat table does not have a special component. Instead, it is constructed using [sszvis.component.bar](/#/bar-chart-vertical) by setting the width and height equal to each other, and with the use of the *x*- and *y*-position functions. Both *x*- and *y*-scales are ordinal scales which use the rangeBands function to calculate the output range.

### Data structure

This component requires a flat array of objects, and each object is turned into one square in the heat table.

#### Minimum three dimensions

* x-axis dimension
* y-axis dimension
* value (color) dimension

### Configuration

Heat tables are based on [sszvis.component.bar](/#/bar-chart-vertical) and thus have the same configuration options.

### Chart

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

## Irregularly Binned Color Scale

Binned color scales can be used to group data and make it easier to see similar areas. For more on the different ways to construct binned color scales from a range of values, see [Telling the Truth](http://uxblog.idvsolutions.com/2011/10/telling-truth.html).

This example shows what age each partner in a partnership had when they had their first child.

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

## Regularly Binned Diverging Color Scale

This example uses regularly spaced bins and shows positive/negative trends through a diverging color scale.

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
