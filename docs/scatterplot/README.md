# Scatterplot

## Simple Scatterplot

### Datenformat

### Konfiguration

## Beispiele

### Regular Scatterplot

```project
{
    "name": "scatterplot-basic",
    "files": {
        "index.html": {
            "source": "docs/scatterplot/basic.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/scatterplot/data/SS_basic.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 500,
        "height": 600
    }
}
```

### Reference Line

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
        "width": 500,
        "height": 500
    }
}
```

### Variable-Radius Scatterplot

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
        "width": 500,
        "height": 570
    }
}
```
