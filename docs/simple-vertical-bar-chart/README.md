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
    "index": "docs/simple-vertical-bar-chart/basic.html",
    "readme": "docs/simple-vertical-bar-chart/README.md",
    "files": [
        "docs/simple-vertical-bar-chart/data/SiVB_basic.csv"
   ],
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
    "index": "docs/simple-vertical-bar-chart/few_categories.html",
    "readme": "docs/simple-vertical-bar-chart/README.md",
    "files": [
        "docs/simple-vertical-bar-chart/data/SiVB_fewCategories.csv"
    ],
    "size": {
        "height": 500,
        "width": 480
    }
}
```

### Long Names

```project
{
    "index": "docs/simple-vertical-bar-chart/long_names.html",
    "readme": "docs/simple-vertical-bar-chart/README.md",
    "files": [
        "docs/simple-vertical-bar-chart/data/SiVB_longNames.csv"
    ],
    "size": {
        "height": 500,
        "width": 500
    }
}
```

### Many Years

```project
{
    "index": "docs/simple-vertical-bar-chart/many_years.html",
    "readme": "docs/simple-vertical-bar-chart/README.md",
    "files": [
        "docs/simple-vertical-bar-chart/data/SiVB_yearly_many.csv"
    ],
    "size": {
        "height": 550,
        "width": 550
    }
}
```
