# Stacked Bar Chart

## Options

### Datenformat

### Konfiguration

## Examples

### Stacked Bar Chart

```project
{
    "name": "stacked-vertical-bar-chart",
    "files": {
        "index.html": {
            "source": "docs/stacked-vertical-bar-chart/three-cat.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/stacked-vertical-bar-chart/data/StVB_3Categories_yearly.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 500,
        "height": 560
    }
}
```

```project
{
    "name": "stacked-vertical-bar-chart",
    "files": {
        "index.html": {
            "source": "docs/stacked-vertical-bar-chart/seven-cat.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/stacked-vertical-bar-chart/data/StVB_7Categories_yearly.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "height": 500,
        "width": 500
    }
}
```

Note: The data for this example (StVB_2Categories_yearly_negatives.csv) is incompatible with the chart format. See the explanation in Basecamp:
https://basecamp.com/1762663/projects/6446196/documents/6747425

```project
{
    "name": "stacked-vertical-bar-chart",
    "files": {
        "index.html": {
            "source": "docs/stacked-vertical-bar-chart/two-cat.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/stacked-vertical-bar-chart/data/StVB_2Categories_yearly_negatives.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "height": 50,
        "width": 50
    }
}
```
