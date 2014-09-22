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
    "index": "docs/simple-vertical-bar-chart/index.html?dataset=SiVB_basic.csv&cat=Altersklasse&val=Anzahl",
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

### Few Categories

```project
{
    "index": "docs/simple-vertical-bar-chart/index.html?dataset=SiVB_fewCategories.csv&cat=Kategorie&val=Anzahl",
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

### Long Names

```project
{
    "index": "docs/simple-vertical-bar-chart/index.html?dataset=SiVB_longNames.csv&cat=Sektor&val=Anzahl&width=800",
    "readme": "docs/simple-vertical-bar-chart/README.md",
    "files": [
        "docs/simple-vertical-bar-chart/data/SiVB_basic.csv",
        "docs/simple-vertical-bar-chart/data/SiVB_fewCategories.csv",
        "docs/simple-vertical-bar-chart/data/SiVB_longNames.csv",
        "docs/simple-vertical-bar-chart/data/SiVB_yearly_many.csv"
    ],
    "size": {
        "height": 442,
        "width": 800
    }
}
```

### Many Years

```project
{
    "index": "docs/simple-vertical-bar-chart/index.html?dataset=SiVB_yearly_many.csv&cat=Jahr&val=Hotel%3Fbernachtungen&width=1100",
    "readme": "docs/simple-vertical-bar-chart/README.md",
    "files": [
        "docs/simple-vertical-bar-chart/data/SiVB_basic.csv",
        "docs/simple-vertical-bar-chart/data/SiVB_fewCategories.csv",
        "docs/simple-vertical-bar-chart/data/SiVB_longNames.csv",
        "docs/simple-vertical-bar-chart/data/SiVB_yearly_many.csv"
    ],
    "size": {
        "height": 442,
        "width": 1100
    }
}
```
