# Axis

Axes are a visual representation of position and extent scales. They are used to display how numerical quantities are transformed into physical positions and sizes inside the chart. Often, the scales they represent are continuous linear transformations, but not always. Ordinal scales, where different categorical values are mapped to different positions, as well as logarithmic, quadratic, and exponential scales can also be displayed using axes. Usually, axes are positioned parallel to the visual dimension into which they transform data, hence the prominence of "x" and "y" axes. This is almost always the most readable and recognizable orientation.

## X-axis

The x-axis covers the x-dimension, both placement and width

```project
{
    "name": "bar-chart-horizontal-basic",
    "files": {
        "index.html": {
            "source": "docs/bar-chart-horizontal/basic.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/bar-chart-horizontal/data/SHB_13Categories_longNames.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 622
    }
}
```

## X-axis (Time)

This x-axis displays time values

```project
{
    "name": "line-chart-single-basic",
    "files": {
        "index.html": {
            "source": "docs/line-chart-single/basic.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/line-chart-single/data/SL_quarterly.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 440
    }
}
```

## X-axis (Ordinal)

This x-axis displays ordinal categories

```project
{
    "name": "bar-chart-vertical-long-names",
    "files": {
        "index.html": {
            "source": "docs/bar-chart-vertical/long-names.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/bar-chart-vertical/data/SiVB_longNames.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "height": 428,
        "width": 516
    }
}
```

## X-axis (Centered Title, Custom Highlight Ticks)

The x-axis title is centered because there are two y-axes. In addition, the ticks displayed on the bottom are customized, rather than using the default d3.scale.ticks. This is done to ensure that whichever value the user is hovering over is also displayed as a highlighted tick in the axis.

``` project
{
    "name": "line-chart-multiple-two-axis",
    "files": {
        "index.html": {
            "source": "docs/line-chart-multiple/two-axis.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/line-chart-multiple/data/S_2yAxis.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 525
    }
}
```

## X-axis (Pyramid)

This x-axis is specific to the population pyramid chart. It creates a two-sided axis that extends in the positive direction on either side of the center point.

```project
{
    "name": "population-pyramid-basic",
    "files": {
        "index.html": {
            "source": "docs/population-pyramid/pyramid-basic.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/population-pyramid/data/BP_basic.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 470
    }
}
```

## Y-axis (Custom Tick Formatting)

The y-axis convers the y-dimension, both placement and height. Note also that sszvis.format.percent has been used to format the y-axis tick labels.

```project
{
    "name": "bar-chart-vertical-basic",
    "files": {
        "index.html": {
            "source": "docs/bar-chart-vertical/basic.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/bar-chart-vertical/data/SiVB_fourCities.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "height": 393,
        "width": 516
    }
}
```

## Y-axis (With 0)

By default, sszvis y-axes don't show a label at 0. Since values go negative in this chart, this one does.

```project
{
    "name": "bar-chart-grouped_gb-two-small",
    "files": {
        "index.html": {
            "source": "docs/bar-chart-grouped/gb-two-small.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/bar-chart-grouped/data/GB_2Categories_smallVals.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 515
    }
}
```

## Y-axis (Ordinal)

This y-axis shows ordinal categories

```project
{
    "name": "bar-chart-horizontal-interactive",
    "files": {
        "index.html": {
            "source": "docs/bar-chart-horizontal/interactive.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/bar-chart-horizontal/data/SHB_13Categories.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 637
    }
}
```

## Slants (Diagonal)

This x-axis (with a 'top' orientation) has a diagonal slant

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

## Slants (Vertical)

This x-axis has a diagonal slant. Here are the guidelines for changing the slant of the axis:

- Labels are always displayed horizontally, if there is enough space to show them clearly separate from each other.
- If horizontal labels don't have enough space and overlap, they are displayed diagonally (45°).
- If diagonal labels don't have enough space and overlap or touch the canvas area, they are displayed orthogonally (90°).

```project
{
    "name": "bar-chart-vertical-stacked",
    "files": {
        "index.html": {
            "source": "docs/bar-chart-vertical-stacked/two-cat.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/bar-chart-vertical-stacked/data/StVB_2Categories_yearly.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 505
    }
}
```

## Contours

Contours are used to make labels stand out, especially when they are positioned above chart components. Contours should not be used on area charts.

```project
{
    "name": "line-chart-single-percentage-negatives-y-axis",
    "files": {
        "index.html": {
            "source": "docs/line-chart-single/percentage-negatives-y-axis.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/line-chart-single/data/SL_Percentage_negativesYAxis.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 455
    }
}
```

## Long Ticks (With Formatted Tick Labels)

This x-axis displays the use of the tickLength property to create ticks which extend across the entire chart. This approach adds visual clutter to the chart, but it can be useful to facilitate chart reading. Note also that sszvis.format.percent has been used to format the x-axis tick labels.

```project
{
    "name": "bar-chart-horizontal-percent",
    "files": {
        "index.html": {
            "source": "docs/bar-chart-horizontal/percent.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/bar-chart-horizontal/data/SHB_basic_percent.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 613
    }
}
```
