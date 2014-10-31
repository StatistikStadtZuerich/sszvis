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

### Four Cities

```project
{
    "name": "simple-vertical-bar-chart-four-cities",
    "files": {
        "index.html": {
            "source": "docs/simple-vertical-bar-chart/four-cities.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/simple-vertical-bar-chart/data/SiVB_fourCities.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "height": 625,
        "width": 540
    }
}
```

### Basic Data

```project
{
    "name": "simple-vertical-bar-chart-basic",
    "files": {
        "index.html": {
            "source": "docs/simple-vertical-bar-chart/basic.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/simple-vertical-bar-chart/data/SiVB_basic.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "height": 500,
        "width": 516
    }
}
```

### Few Categories

Suggestion: center bar group when smaller than 3 or 4 items to be consistent with heat table. Also: an x-axis that extends to the right if there are no values could be misunderstood as missing values. There are probably not many charts that use this edge-case

```project
{
    "name": "simple-vertical-bar-chart-few-categories",
    "files": {
        "index.html": {
            "source": "docs/simple-vertical-bar-chart/few-categories.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/simple-vertical-bar-chart/data/SiVB_fewCategories.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "height": 500,
        "width": 516
    }
}
```

### Few Categories - Missing Values

```project
{
    "name": "simple-vertical-bar-chart-few-categories-missing",
    "files": {
        "index.html": {
            "source": "docs/simple-vertical-bar-chart/few-categories-missing.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/simple-vertical-bar-chart/data/SiVB_fewCategories_missing.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "height": 500,
        "width": 516
    }
}
```

### Long Names

```project
{
    "name": "simple-vertical-bar-chart-long-names",
    "files": {
        "index.html": {
            "source": "docs/simple-vertical-bar-chart/long-names.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/simple-vertical-bar-chart/data/SiVB_longNames.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "height": 500,
        "width": 516
    }
}
```

### Many Years

```project
{
    "name": "simple-vertical-bar-chart-many-years",
    "files": {
        "index.html": {
            "source": "docs/simple-vertical-bar-chart/many-years.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/simple-vertical-bar-chart/data/SiVB_yearly_many.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "height": 550,
        "width": 516
    }
}
```
