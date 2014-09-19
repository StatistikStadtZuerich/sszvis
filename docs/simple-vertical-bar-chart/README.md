# Bar Chart

## Simple Vertical Bar Chart

```project
{
    "index": "docs/simple-vertical-bar-chart/index.html",
    "readme": "docs/simple-vertical-bar-chart/README.md",
    "files": [
        "docs/simple-vertical-bar-chart/data/SiVB_basic.csv",
        "docs/simple-vertical-bar-chart/data/SiVB_fewCategories.csv",
        "docs/simple-vertical-bar-chart/data/SiVB_longNames.csv",
        "docs/simple-vertical-bar-chart/data/SiVB_yearly_many.csv"
    ],
    "size": {
        "height": 442,
        "width": 516
    }
}
```

### Datenformat

Dieses Chart benötigt zwei Datenreihen:

* x-Achse
* y-Achse

### Konfiguration

Es stehen folgende Konfigurationsmöglichkeiten zur Verfügung:

* `xAxis` - eine `d3`-Achsenfunktion
* `yAxis` - eine `d3`-Achsenfunktion
