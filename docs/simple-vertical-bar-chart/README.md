# Bar Chart

## Simple Vertical Bar Chart

### Datenformat

Dieses Chart benötigt zwei Datenreihen:

* x-Achse
* y-Achse

### Konfiguration

Es stehen folgende Konfigurationsmöglichkeiten zur Verfügung:

* `xAxis` - eine `d3`-Achsenfunktion
* `yAxis` - eine `d3`-Achsenfunktion

### Examples

### Basic Data

```project
{
    "name": "simple-vertical-bar-chart-basic",
    "files": {
        "index.html": "docs/simple-vertical-bar-chart/basic.html",
        "data.csv": "docs/simple-vertical-bar-chart/data/SiVB_basic.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "size": {
        "height": 500,
        "width": 500
    }
}
```

### Few Categories

Suggestion: center bar group when smaller than 3 or 4 items to be consistent with heat table. Also: an x-axis that extends to the right if there are no values could be misunderstood as missing values. There are probably not many charts that use this edge-case

```project
{
    "name": "simple-vertical-bar-chart-few-categories",
    "files": {
        "index.html": "docs/simple-vertical-bar-chart/few-categories.html",
        "data.csv": "docs/simple-vertical-bar-chart/data/SiVB_fewCategories.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "size": {
        "height": 500,
        "width": 480
    }
}
```

### Few Categories - Missing Values

```project
{
    "name": "simple-vertical-bar-chart-few-categories-missing",
    "files": {
        "index.html": "docs/simple-vertical-bar-chart/few-categories-missing.html",
        "data.csv": "docs/simple-vertical-bar-chart/data/SiVB_fewCategories_missing.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "size": {
        "height": 500,
        "width": 480
    }
}
```

### Long Names

```project
{
    "name": "simple-vertical-bar-chart-long-names",
    "files": {
        "index.html": "docs/simple-vertical-bar-chart/long-names.html",
        "data.csv": "docs/simple-vertical-bar-chart/data/SiVB_longNames.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "size": {
        "height": 500,
        "width": 500
    }
}
```

### Many Years

```project
{
    "name": "simple-vertical-bar-chart-many-years",
    "files": {
        "index.html": "docs/simple-vertical-bar-chart/many-years.html",
        "data.csv": "docs/simple-vertical-bar-chart/data/SiVB_yearly_many.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "size": {
        "height": 550,
        "width": 550
    }
}
```
