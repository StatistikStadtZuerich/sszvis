# Pie Chart

## Options

### Datenformat

### Konfiguration

## Examples

### Single Chart

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

### Multiple Charts

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
        "width": 880,
        "height": 680
    }
}
```
