> This library provides functions for formatting data following the SSZVIS style guide.

## Formatting Functions

#### `sszvis.formatNumber(x)`

A number greater than 9'999 will have a thousands separator space. Also, numbers will be shortened if they have insignificant decimals.

```table
rows:
  - Function: formatNumber
    Example: sszvis.formatNumber(16000)
    Result: "16 000"
  - Function:
    Example: sszvis.formatNumber(5000)
    Result: "5000"
  - Function:
    Example: sszvis.formatNumber(42.1)
    Result: "42.1"
  - Function:
    Example: sszvis.formatNumber(42.001)
    Result: "42"
```

#### `sszvis.formatPreciseNumber(p, d)`

`p` = The desired precision
`d` = The number to be formatted

A number will be formatted to a particular precision. It is a function that accepts numbers and returns formatted values. This function is "curried", meaning that it is a function with multiple arguments, but when you call it with less than the full number of arguments, it returns a function that takes less arguments and has the arguments you did provide "pre-filled" as parameters.

```table
rows:
  - Function: formatPreciseNumber
    Example: sszvis.formatPreciseNumber(2, 14.1234)
    Result: 14.12
  - Function:
    Example: sszvis.formatPreciseNumber(3, 14.1234)
    Result: 14.123
  - Function:
    Example: sszvis.formatPreciseNumber(0, 14.1234)
    Result: 14
```

#### `sszvis.formatPercent(x)`

A number will be transformed into a percent format. Formats percentages on the range 0–100.

```table
rows:
  - Function: formatPercent
    Example: sszvis.formatPercent(55.3)
    Result: "55.3 %"
  - Function:
    Example: sszvis.formatPercent(7)
    Result: "7 %"
  - Function:
    Example: sszvis.formatPercent(0.245875)
    Result: "0.25 %"
```

#### `sszvis.formatFractionPercent(x)`

A number will be transformed into a percent format. Format percentages on the range 0–1.

```table
rows:
  - Function: formatFractionPercent
    Example: sszvis.formatFractionPercent(55.3)
    Result: "5530 %"
  - Function:
    Example: sszvis.formatFractionPercent(7)
    Result: "700 %"
  - Function:
    Example: sszvis.formatFractionPercent(0.245875)
    Result: "24.59 %"
```

#### `sszvis.formatText(x)`

Any given data is returned as a string and will be formatted as Text.

```table
rows:
  - Function: formatText
    Example: sszvis.formatText(16000)
    Result: "'16000'"
  - Function:
    Example: sszvis.formatText("Jahr")
    Result: "'Jahr'"
```

#### `sszvis.formatAge(x)`

A number will be formatted as an age. Means that any decimal number will be rounded to a full number.

```table
rows:
  - Function: formatAge
    Example: sszvis.formatAge(55.54359375)
    Result: "56"
  - Function:
    Example: sszvis.formatAge(555435)
    Result: "555435"
```

#### `sszvis.formatYear(x)`

A date object will be formatted as a year. Gives the date's year.

```table
rows:
  - Function: formatYear
    Example: sszvis.formatYear(new Date())
    Result: "2020"
```

#### `sszvis.formatMonth(x)`

A date object will be formatted as a month. It will return a capitalized three-letter abbreviation of the German month name.

```table
rows:
  - Function: formatMonth
    Example: sszvis.formatMonth(new Date())
    Result: "JAN"
```

#### `sszvis.formatNone()`

This is a Formatter for no label, only returning an empty string.

```table
rows:
  - Function: formatNone
    Example: sszvis.formatNone("500 People participated.")
    Result: ""
  - Function:
    Example: sszvis.formatNone(500343)
    Result: ""
```

## Live examples

### `formatNumber`

In this example, all Numbers in the y-Axis greater than 9999 use a thousands separator space.

```project
{
    "name": "bar-chart-vertical-stacked",
    "files": {
        "index.html": {
            "source": "bar-chart-vertical-stacked/basic.html",
            "template": "template.html"
        },
        "data.csv": "bar-chart-vertical-stacked/data/StVB_7Categories_yearly.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",

    },
    "sourceView": ["index.html", "data.csv"]
}
```

### `formatFractionPercent`

In this example, all Numbers in the y-Axis have been transformed into a percent format.

```project
{
    "name": "line-chart-ordinal",
    "files": {
        "index.html": {
            "source": "line-chart/ordinal.html",
            "template": "template.html"
        },
        "data.csv": "line-chart/data/ML_school_years.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",

    },
    "sourceView": ["index.html", "data.csv"]
}
```
