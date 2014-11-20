# Heat Table

## Heat Table

### Datenformat

Minimum three dimensions
* x-axis dimension
* y-axis dimension
* value (color) dimension

### Konfiguration

The following configuration options are available:
* Interaction - tooltips, highlighting, etc.
* Color scale
* x-axis
* y-axis
* dimensions of table squares (not necessarily squares)

### Examples

### Kreise

```project
{
    "name": "heat-table-kreise",
    "files": {
        "index.html": {
            "source": "docs/heat-table/ht-kreise.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/heat-table/data/HT_kreise.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 800
    }
}
```

### Binned Color Scale - Chunks

```project
{
    "name": "heat-table-binned",
    "files": {
        "index.html": {
            "source": "docs/heat-table/ht-binned.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/heat-table/data/HT_binned.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 350
    }
}
```

### Binned Color Scale - Linear

For more on the different ways to construct binned color scales from a range of values, see: http://uxblog.idvsolutions.com/2011/10/telling-truth.html

```project
{
    "name": "heat-table-binned-linear",
    "files": {
        "index.html": {
            "source": "docs/heat-table/ht-binned-linear.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/heat-table/data/HT_binned_linear.csv",
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

### Wer mit wem?

Welches haben Paare zum Zeitpunkt ihres ersten Kindes.

```project
{
    "name": "heat-table-wermitwem",
    "files": {
        "index.html": {
            "source": "docs/heat-table/ht-wermitwem.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/heat-table/data/HT_wermitwem.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 360
    }
}
```
