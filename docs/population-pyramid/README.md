### Bevölkerungspyramid

## Optionen

### Datenformat

### Konfiguration

## Beispiele

### Bevölkerungspyramid

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

```project
{
    "name": "population-pyramid-stacked",
    "files": {
        "index.html": {
            "source": "docs/population-pyramid/pyramid-stacked.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/population-pyramid/data/BP_stacked.csv",
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

```project
{
    "name": "population-pyramid-reference",
    "files": {
        "index.html": {
            "source": "docs/population-pyramid/pyramid-reference.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/population-pyramid/data/BP_reference.csv",
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
