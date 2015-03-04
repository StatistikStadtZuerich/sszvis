# Charts for beginners

> These charts are fully parametrized for simple usage

## Line chart – Parametric Configuration

Generates a chart based on a config object

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

Generates a chart based on a config object

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
With negative and missing values

```project
{
    "name": "bar-chart-grouped_gb-two-small",
    "files": {
        "index.html": {
            "source": "docs/bar-chart-grouped/gb-two-small-parametric.html",
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
Without button groups…


```project
{
    "name": "area-chart-stacked-two",
    "files": {
        "index.html": {
            "source": "docs/area-chart-stacked/sa-two-parametric.html",
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

Generates a chart based on a config object

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

```project
{
    "name": "heat-table-kreise",
    "files": {
        "index.html": {
            "source": "docs/heat-table/ht-kreise-parametric.html",
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

## Heat Table – Parametric Configuration

Generates a chart based on a config object

```project
{
    "name": "scatterplot-refline-fake",
    "files": {
        "index.html": {
            "source": "docs/scatterplot/parametric.html",
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