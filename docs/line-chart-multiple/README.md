# Line Chart

## Multiple Line Chart

### Datenformat

### Konfiguration

## Beispiele

``` project
{
    "name": "line-chart-multiple-two-cat",
    "files": {
        "index.html": {
            "source": "docs/line-chart-multiple/two-cat.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/line-chart-multiple/data/ML_2Categories_Quarterly.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 500
    }
}
```

``` project
{
    "name": "line-chart-multiple-eight-cat",
    "files": {
        "index.html": {
            "source": "docs/line-chart-multiple/eight-cat.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/line-chart-multiple/data/ML_months_8Categories_superposition_missing.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 500
    }
}
```


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
        "height": 520
    }
}
```
