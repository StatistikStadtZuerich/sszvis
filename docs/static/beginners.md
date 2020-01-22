# Charts for beginners

> These charts are fully parametrized for simple usage. They are all generated based on a config object that stands at the beginning of the code.

## General Basic Configuration

For each chart the following can always be configured:

- `dataPath` – The path to the CSV file containing the data for this chart (required)
- `title` – Chart title of this chart for visually impaired users (optional)
- `description` – Short description of this chart for visually impaired users (optional)
- `fallback` – View of the chart when interactivity is not desired. Creates horizontal lines for the y-ticks and/or does not render mouse interaction when true

## Line chart – Basic Configuration

```project
{
    "name": "line-chart-single-automatic",
    "files": {
        "index.html": {
            "source": "line-chart-single/basic.html",
            "template": "template.html"
        },
        "data.csv": "line-chart-single/data/SL_quarterly.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",

    },
    "sourceView": ["index.html", "data.csv"]
}
```

## Multiple line chart – Basic Configuration

```project
{
    "name": "line-chart-multiple-two-cat",
    "files": {
        "index.html": {
            "source": "line-chart-multiple/parametric.html",
            "template": "template.html"
        },
        "data.csv": "line-chart-multiple/data/ML_2Categories_Quarterly.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",

    },
    "sourceView": ["index.html", "data.csv"]
}
```

## Bar Chart Vertical – Basic Configuration

```project
{
    "name": "bar-chart-vertical-parametric",
    "files": {
        "index.html": {
            "source": "bar-chart-vertical/basic.html",
            "template": "template.html"
        },
        "data.csv": "bar-chart-vertical/data/SiVB_fourCities.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",

    },
    "sourceView": ["index.html", "data.csv"]
}
```

## Bar Chart Vertical (Stacked) – Basic Configuration

```project
{
    "name": "bar-chart-vertical-stacked",
    "files": {
        "index.html": {
            "source": "bar-chart-vertical-stacked/basic.html",
            "template": "template.html"
        },
        "data.csv": "bar-chart-vertical-stacked/data/StVB_7Categories_yearly.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",

    },
    "sourceView": ["index.html", "data.csv"]
}
```

## Bar Chart Horizontal – Basic Configuration

```project
{
    "name": "bar-chart-horizontal-parametric",
    "files": {
        "index.html": {
            "source": "bar-chart-horizontal/basic.html",
            "template": "template.html"
        },
        "data.csv": "bar-chart-horizontal/data/SHB_13Categories_longNames.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",

    },
    "sourceView": ["index.html", "data.csv"]
}
```

## Bar Chart Horizontal (Stacked) – Basic Configuration

```project
{
    "name": "bar-chart-horizontal-stacked-parametric",
    "files": {
        "index.html": {
            "source": "bar-chart-horizontal-stacked/basic.html",
            "template": "template.html"
        },
        "data.csv": "bar-chart-horizontal-stacked/data/SHB_basic_percent.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",

    },
    "sourceView": ["index.html", "data.csv"]
}
```

## Grouped Bar Chart – Basic Configuration

Configuration:

- `xColumn` – Data column to use for the x-axis (required)
- `yColumn` – Data column to use for the y-axis (required)
- `cColumn` – Data column to use for the categories(required)
- `yAxisLabel` – Label for the y-axis (optional)
- `yTicks` – Number of ticks on the y-axis (optional)
- `textDirection` – Text Direction of x-axis lables (optional)
- `legendPadding` – Padding between legend and x-axis in pixels (required)

```project
{
    "name": "bar-chart-grouped_gb-two-small",
    "files": {
        "index.html": {
            "source": "bar-chart-grouped/parametric.html",
            "template": "template.html"
        },
        "data.csv": "bar-chart-grouped/data/GB_2Categories_smallVals.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",

    },
    "sourceView": ["index.html", "data.csv"]
}
```

## Area Chart – Basic Configuration

Configuration:

- `xColumn` – Data column to use for the x-axis (required)
- `yColumn` – Data column to use for the y-axis (required)
- `cColumn` – Data column to use for the categories (required)
- `xAxisLabel` – Label for the x-axis (optional)
- `yAxisLabel` – Label for the y-axis (optional)
- `xTicks` – Number of ticks on the x-axis (optional)
- `yTicks` – Number of ticks on the y-axis (optional)
- `legendPadding` – Padding between legend and x-axis in pixels (required)

```project
{
    "name": "area-chart-stacked-two",
    "files": {
        "index.html": {
            "source": "area-chart-stacked/parametric.html",
            "template": "template.html"
        },
        "data.csv": "area-chart-stacked/data/SA_2Categories_yearly.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",
    },
    "sourceView": ["index.html", "data.csv"]
}
```

## Map Zürich Kreise – Basic Configuration

Configuration:

- `geoIdColumn` – Data column to use for the geographic values(required)
- `nameColumn` – Data column to use for the name of the geographic values (required)
- `labelFormat` – Formatting function to use for the legend label. Defaults to number, but can be changed to "sszvis.formatPercent" to render values from 0–100 as 0–100% (required)
- `valueColumn` – Data column to use for the values (required)
- `valueLabel` – Label for the values, shows in the tooltip (required)

```project
{
    "name": "map-kreis",
    "files": {
        "index.html": {
            "source": "map-standard/kreis-parametric.html",
            "template": "template.html"
        },
        "data.csv": "map-standard/data/M_kreis.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",
        "topojson.js": "vendor/topojson/topojson.js",
        "map.js": "map-modules/sszvis-map-zurich-stadtkreise.js"
    },
    "sourceView": ["index.html", "data.csv"]
}
```

## Map Zürich: Quartiere – Basic Configuration

A map of the Statistische Quartiere of Zürich, demonstrating use of a button group control for data subset selection.

- `geoIdColumn` – Data column to use for the geographic values(required)
- `labelFormat` – Formatting function to use for the legend label. Defaults to number, but can be changed to "sszvis.formatPercent" to render values from 0–100 as 0–100% (required)
- `nameColumn` – Data column to use for the name of the geographic values (required)
- `valueColumn` – Data column to use for the values (required)
- `valueLabel` – Label for the values, shows in the tooltip (required)

```project
{
    "name": "map-quartiere",
    "files": {
        "index.html": {
            "source": "map-standard/quartiere-parametric.html",
            "template": "template.html"
        },
        "data.csv": "map-standard/data/M_quartiere.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",
        "topojson.js": "vendor/topojson/topojson.js",
        "map.js": "map-modules/sszvis-map-zurich-statistischequartiere.js"
    },
    "sourceView": ["index.html", "data.csv"]
}
```

## Heat Table – Basic Configuration

Configuration

- `xColumn` – Data column to use for the x-axis (required)
- `yColumn` – Data column to use for the y-axis (required)
- `vColumn` – Data column to use for the values(required)
- `xAxisLabel` – Label for the x-axis, shows in the tooltip (required)
- `yAxisLabel` – Label for the y-axis, shows in the tooltip (required)
- `valueLabel` – Label for the values, shows in the tooltip (required)
- `tSourceAxis` – Source axis for the header of the tooltip (required)
- `tTitleAdd` – Additional label to the header of the tooltip (optional)

```project
{
    "name": "heat-table-kreise",
    "files": {
        "index.html": {
            "source": "heat-table/parametric.html",
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

## Pie Chart – Basic Configuration

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

## Population Pyramid – Basic Configuration

Configuration:

- `ageColumn` – Data column to use for the x-axis (required)
- `valueColumn` – Data column to use for the y-axis (required)
- `categoryColumn` – Data column to use for the categories (required)
- `leftCategory` – The category to use for the left side of the chart (required)
- `rightCategory` – The category to use for the right side of the chart (required)
- `groupSize` – The number of age categories to group into one bar (required)
- `xAxisLabel` – Label for the x-axis (optional)
- `yAxisLabel` – Label for the y-axis, shows in tooltip (required)
- `xTicks` – Number of ticks on the xAxis (optional)
- `yTicks` – Number of ticks on the yAxis (optional)
- `legendPadding` – Padding between legend and x-axis in pixels (required)

```project
{
    "name": "population-pyramid-basic",
    "files": {
        "index.html": {
            "source": "population-pyramid/parametric.html",
            "template": "template.html"
        },
        "data.csv": "population-pyramid/data/BP_basic.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",

    },
    "sourceView": ["index.html", "data.csv"]
}
```

## Scatterplot – Basic Configuration

- `xColumn` – Data column to use for the x-axis (required)
- `yColumn` – Data column to use for the y-axis (required)
- `cColumn` – Data column to use for the categories(required)
- `xAxisLabel` – Label for the x-axis, shows in tooltip (required)
- `yAxisLabel` – Label for the y-axis, shows in tooltip (required)
- `xTicks` – Number of ticks on the x-axis (optional)
- `yTicks` – Number of ticks on the y-axis (optional)
- `legendPadding` – Padding between legend and x-axis in pixels (required)

```project
{
    "name": "scatterplot-refline-fake",
    "files": {
        "index.html": {
            "source": "scatterplot/simple-scatterplot-parametric.html",
            "template": "template.html"
        },
        "data.csv": "scatterplot/data/SS_refline_fake.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",

    },
    "sourceView": ["index.html", "data.csv"]
}
```

## Variable Radius Scatterplot – Basic Configuration

Configurations

- `xColumn` – Data column to use for the x-axis (required)
- `yColumn` – Data column to use for the y-axis (required)
- `rColumn` – Data column to use for the bubble size (required)
- `cColumn` – Data column to use for category or name (required)
- `xAxisLabel` – Label for the x-axis, shows in tooltip (required)
- `yAxisLabel` – Label for the y-axis, shows in tooltip (required)
- `rLabel` – label of radius value in the tooltip (required)
- `xTicks` – Number of ticks on the x-axis (optional)
- `yTicks` – Number of ticks on the y-axis (optional)
- `legendTicks` – Specifies the number and value of the legend ticks (optional)
- `legendPadding` – Padding between legend and x-axis in pixels (required)

```project
{
    "name": "scatterplot-variable-radius",
    "files": {
        "index.html": {
            "source": "scatterplot/variable-radius-parametric.html",
            "template": "template.html"
        },
        "data.csv": "scatterplot/data/VRS_basic.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",

    },
    "sourceView": ["index.html", "data.csv"]
}
```
