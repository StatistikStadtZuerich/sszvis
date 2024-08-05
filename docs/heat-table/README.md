> A heat table can be used to show off a matrix of values. Use it to display how a single variable
> varies across all the combinations of two categorical variables.

## sszvis.bar

The heat table does not have a special component. Instead, it is constructed using
[sszvis.bar](bar-chart-vertical) by setting the width and height equal to each other, and with the
use of the _x_- and _y_-position functions. Both _x_- and _y_-scales are ordinal scales which use
the rangeBands function to calculate the output range.

```hint
## Responsive Layout

The heat table's responsive layout is based on dynamically resizing the boxes of the heat table and positioning it in an appropriate place. On very narrow screens, it also might require slight adjustments to the length and orientation of axis labels. There should also not be much (if any) padding around the outside of the chart. This is because the embedding context on sszvis.com provides its own padding. Axis labels along the top edge can and should be turned completely vertical. Axis labels along the left side of the chart should be kept as short as possible. It might be necessary in some cases to provide an alternate set of shortened axis labels for a narrow mobile screen. The number of columns should be kept within a reasonable range. Unfortunately, with the heat table, it's just not possible to cram too many columns into a narrow space. The heat table box size will still be chosen automatically (by the layout function). The heat table layout function also provides information for centering the whole thing horizontally within its container.
```

### Data structure

This component requires a flat array of objects, and each object is turned into one square in the
heat table.

#### Minimum three dimensions

- x-axis dimension
- y-axis dimension
- value (color) dimension

### Configuration

Heat tables are based on [sszvis.bar](bar-chart-vertical) and thus have the same configuration
options.

### Chart

```project
{
    "name": "heat-table-kreise",
    "files": {
        "index.html": {
            "source": "heat-table/ht-kreise.html",
            "template": "template.html"
        },
        "data.csv": "heat-table/data/HT_kreise.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",

    },
    "sourceView": ["index.html", "data.csv"]
}
```

## Irregularly Binned Color Scale

Binned color scales can be used to group data and make it easier to see similar areas. For more on
the different ways to construct binned color scales from a range of values, see
[Telling the Truth](http://uxblog.idvsolutions.com/2011/10/telling-truth.html).

This example shows what age each partner in a partnership had when they had their first child.

```project
{
    "name": "heat-table-wermitwem",
    "files": {
        "index.html": {
            "source": "heat-table/ht-wermitwem.html",
            "template": "template.html"
        },
        "data.csv": "heat-table/data/HT_wermitwem.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",

    },
    "sourceView": ["index.html", "data.csv"]
}
```

## Regularly Binned Diverging Color Scale

This example uses regularly spaced bins and shows positive/negative trends through a diverging color
scale.

```project
{
    "name": "heat-table-binned-linear",
    "files": {
        "index.html": {
            "source": "heat-table/ht-binned-linear.html",
            "template": "template.html"
        },
        "data.csv": "heat-table/data/HT_binned_linear.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",

    },
    "sourceView": ["index.html", "data.csv"]
}
```
