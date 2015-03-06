# Charts for beginners

> These charts are fully parametrized for simple usage. They are all generated based on a config object that stands at the beginning of the code. 

## General Parametric Configuration

For each chart the following can always be configured: 

* `dataPath` – Path to file containing the data (required)
* `title` – Chart title (optional)
* `description` – Short description of chart (optional)


## Line chart – Parametric Configuration

Configuration

* `xColumn` – Data column to use for the x-axis (required)
* `xAxisLabel` – Label for the x-axis (optional)

```project
{
    "name": "line-chart-single-automatic",
    "files": {
        "index.html": {
            "source": "docs/line-chart-single/parametric.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/line-chart-single/data/SL_quarterly.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "docs/fallback.png",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 414
    }
}
```

## Multiple line chart – Parametric Configuration

Generates a chart based on a config object

``` project
{
    "name": "line-chart-multiple-two-cat",
    "files": {
        "index.html": {
            "source": "docs/line-chart-multiple/parametric.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/line-chart-multiple/data/ML_2Categories_Quarterly.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "docs/fallback.png",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 460
    }
}
```

## Popultion Pyramid – Parametric Configuration

Configuration: 

* `ageColumn` – Data column to use for the x-axis (required)
* `valueColumn` – Data column to use for the y-axis (required)
* `genderColumn` – Data column to use for the categories, here always male and female (required)
* `yAxisLabel` – Label for the y-axis (optional)
* `xAxisLabel` – Label for the x-axis (optional)
* `xTicks` –  Number of ticks on the xAxis (optional)
* `fallback` – View of the chart when interactivity is not available due to technical restrictions



```project
{
    "name": "population-pyramid-basic",
    "files": {
        "index.html": {
            "source": "docs/population-pyramid/parametric.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/population-pyramid/data/BP_basic.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "docs/fallback.png",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 470
    }
}
```

## Grouped Bar Chart – Parametric Configuration

Configuration: 

* `xColumn` – Data column to use for the x-axis (required)
* `yColumn` – Data column to use for the y-axis (required)
* `cColumn` – Data column to use for the categories(required)
* `yAxisLabel` – Label for the y-axis (optional)
* `yTicks` –  Number of ticks on the x-axis (optional)
* `textDirection` – Text Direction of x-axis lables (optional)
* `fallback` – View of the chart when interactivity is not available due to technical restrictions 


```project
{
    "name": "bar-chart-grouped_gb-two-small",
    "files": {
        "index.html": {
            "source": "docs/bar-chart-grouped/parametric.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/bar-chart-grouped/data/GB_2Categories_smallVals.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "docs/fallback.png",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 515
    }
}
```

## Area Chart – Parametric Configuration

Configuration: 

* `xColumn` – Data column to use for the x-axis (required)
* `yColumn` – Data column to use for the y-axis (required)
* `cColumn` – Data column to use for the categories(required)
* `xAxisLabel` – Label for the x-axis (optional)
* `yAxisLabel` – Label for the y-axis (optional)
* `xTicks` –  Number of ticks on the x-axis (optional)
* `yTicks` –  Number of ticks on the y-axis (optional)
* `fallback` – View of the chart when interactivity is not available due to technical restrictions 

```project
{
    "name": "area-chart-stacked-two",
    "files": {
        "index.html": {
            "source": "docs/area-chart-stacked/parametric.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/area-chart-stacked/data/SA_2Categories_yearly.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "docs/fallback.png",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 529
    }
}
```

## Pie Chart – Parametric Configuration

Configuration:

* `cColumn` – Data column to use for the category (required)
* `vColumn` – Data column to use for the values of the categories (required)


```project
{
    "name": "pie-chart-twelve-cat",
    "files": {
        "index.html": {
            "source": "docs/pie-charts/parametric.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/pie-charts/data/P_7Categories.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "docs/fallback.png",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 300
    }
}
```

## Heat Table – Parametric Configuration

Configuration

* `xColumn` – Data column to use for the x-axis (required)
* `yColumn` – Data column to use for the y-axis (required)
* `vColumn` – Data column to use for the values(required)
* `xAxisLabel` – Label for the x-axis (required)
* `yAxisLabel` – Label for the y-axis (required)
* `valueLabel` – Label for the values, shows in the tooltip (required)
* `tSourceAxis` – Source axis for the header of the tooltip (required)
* `tTitleAdd` – Additional label to the header of the tooltip (optional)


```project
{
    "name": "heat-table-kreise",
    "files": {
        "index.html": {
            "source": "docs/heat-table/parametric.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/heat-table/data/HT_kreise.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "docs/fallback.png",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 800
    }
}
```

## Map Zürich Kreise – Parametric Configuration

A map of Zürich's Stadtkreise.

```project
{
    "name": "map-kreis",
    "files": {
        "index.html": {
            "source": "docs/map/kreis-parametric.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/map/data/M_kreis.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "docs/fallback.png",
        "d3.js": "vendor/d3/d3.min.js",
        "topojson.js": "vendor/topojson/topojson.js",
        "map.js": "sszvis-map-zurich-stadtkreise.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 542
    }
}
```

##  Map Zürich: Quartiere – Parametric Configuration

A map of the Statistische Quartiere of Zürich, demonstrating use of a button group control for data subset selection.

```project
{
    "name": "map-tabs",
    "files": {
        "index.html": {
            "source": "docs/map/tabs-parametric.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/map/data/S_tabs.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "docs/fallback.png",
        "d3.js": "vendor/d3/d3.min.js",
        "topojson.js": "vendor/topojson/topojson.js",
        "map.js": "sszvis-map-zurich-statistischequartiere.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 592
    }
}
```

## Scatterplot – Parametric Configuration

Generates a chart based on a config object

```project
{
    "name": "scatterplot-refline-fake",
    "files": {
        "index.html": {
            "source": "docs/scatterplot/simple-scatterplot-parametric.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/scatterplot/data/SS_refline_fake.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "docs/fallback.png",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 469
    }
}
```

## Variable Radius Scatterplot – Parametric Configuration

configurations

```project
{
    "name": "scatterplot-variable-radius",
    "files": {
        "index.html": {
            "source": "docs/scatterplot/variable-radius-parametric.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/scatterplot/data/VRS_basic.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "docs/fallback.png",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 495
    }
}
```