# Maps

## Choropleth Maps

### Datenformat

### Konfiguration


## Zürich: Kreise

```project
{
    "name": "map-kreis",
    "files": {
        "index.html": {
            "source": "docs/map/kreis.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/map/data/M_kreis.csv",
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


## Zürich: Wahlkreis

```project
{
    "name": "map-kreis",
    "files": {
        "index.html": {
            "source": "docs/map/wahlkreis.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/map/data/M_wahlkreis_fake.csv",
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


## Zürich: Quartiere

```project
{
    "name": "map-tabs",
    "files": {
        "index.html": {
            "source": "docs/map/tabs.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/map/data/S_tabs.csv",
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


## Schweiz

```project
{
    "name": "map-switzerland",
    "files": {
        "index.html": {
            "source": "docs/map/switzerland.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/map/data/M_swiss_fake.csv",
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


## Coordinated Map and Line Chart

```project
{
    "name": "map-cml-quartier-years",
    "files": {
        "index.html": {
            "source": "docs/map/cml-quartier-years.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/map/data/CML_quartier_years.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 756
    }
}
```
