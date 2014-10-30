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
        "index.html": "docs/heat-table/ht-kreise.html",
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

### Missing Values

```project
{
    "name": "heat-table-missing",
    "files": {
        "index.html": "docs/heat-table/ht-missing.html",
        "data.csv": "docs/heat-table/data/HT_kreise_missing.csv",
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

### Binned Color Scale

```project
{
    "name": "heat-table-binned",
    "files": {
        "index.html": "docs/heat-table/ht-binned.html",
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

### Quartiere

```project
{
    "name": "heat-table-quartiere",
    "files": {
        "index.html": "docs/heat-table/ht-quartiere.html",
        "data.csv": "docs/heat-table/data/HT_quartiere.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 1100
    }
}
```

### Wer mit wem?

Welches haben Paare zum Zeitpunkt ihres ersten Kindes.

```project
{
    "name": "heat-table-wermitwem",
    "files": {
        "index.html": "docs/heat-table/ht-wermitwem.html",
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
