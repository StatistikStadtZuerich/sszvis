# Line Chart

## Multiple Line Chart

### Datenformat

### Konfiguration

## Beispiele

``` project
{
    "name": "multiple-line-chart-two-cat",
    "files": {
        "index.html": {
            "source": "docs/multiple-line-chart/two-cat.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/multiple-line-chart/data/ML_2Categories_Quarterly.csv",
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

``` project
{
    "name": "multiple-line-chart-eight-cat",
    "files": {
        "index.html": {
            "source": "docs/multiple-line-chart/eight-cat.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/multiple-line-chart/data/ML_months_8Categories_superposition_missing.csv",
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


``` project
{
    "name": "multiple-line-chart-two-axis",
    "files": {
        "index.html": {
            "source": "docs/multiple-line-chart/two-axis.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/multiple-line-chart/data/S_2yAxis.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 500,
        "height": 520
    }
}
```
