# Accessibility

For accessibility purposes, a label has to be defined. A label will automatically be shown if a title and a description are provided. If a title and description are not already provided by an external source, they can be set in the config object.

### Usage

- The `title` will be rendered as a native tooltip, showing the title of this chart.
- The `description` will only be used by Screenreaders. The text provided for the description should be a meaningful message of this chart.

See this snippet as an example of a config extended with a title and description:

```
 <script>
      var EXTERNAL_CONFIG = {
        data: "data/SHB_basic_percent.csv",
        id: "#sszvis-chart",
        fallback: "fallback.png",
         title: "Beschäftigte nach Berufsfeld und Jahr",
        description: "Die Anzahl der Beschäftigten nahm seit 1980 um 40% zu und liegt heute bei ca. 180000 Beschäftigten."
      };
    </script>
```

This results in a chart with a label on hover:

```project
{
    "name": "bar-chart-vertical-stacked",
    "files": {
        "index.html": {
            "source": "bar-chart-vertical-stacked/basic.html",
            "template": "template.html"
        },
        "data.csv": "bar-chart-vertical-stacked/data/StVB_7Categories_yearly.csv.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",

    },
    "sourceView": ["index.html", "data.csv"]
}
```
