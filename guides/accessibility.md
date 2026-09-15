> To make a chart accessible to people who can't read it visually, a fallback text should be provided to explain the contents and purpose of the visualization.

### Usage

To add accessibility hints, you need to provide a title and a description to the SVG element. This can be done by configuring `sszvis.createSvgLayer`:

```code
var chart = sszvis.createSvgLayer('#sszvis-chart', bounds, {
  title: "Hours of sunshine",
  description: "This chart shows the amount of hours of sunshine throughout a typical year."
});
```

- The `title` names the chart for screen readers, as the first part of its `aria-label`. It is not shown on screen: rendering it as an SVG `<title>` would make the browser draw a native tooltip over the whole chart, which fights the chart's own hover interactions.
- The `description` will only be used by screen readers. The text provided for the description should be a meaningful message of this chart.

### Using an external config

Typically, the title and description are provided through an external source like a CMS. The following code snippet shows how an external config can be connected to the chart config.

```code
<script>
  var EXTERNAL_CONFIG = {
    data: "data/SHB_basic_percent.csv",
    id: "#sszvis-chart",
    fallback: "fallback.png",
    title: "Beschäftigte nach Berufsfeld und Jahr",
    description: "Die Anzahl der Beschäftigten nahm seit 1980 um 40% zu und liegt heute bei ca. 180000 Beschäftigten."
  };

  (function(d3, sszvis, config) {
    "use strict";

    function render(state) {
      var chart = sszvis.createSvgLayer('#sszvis-chart', outerBounds, {
        title: config.title,
        description: config.description
      });
    }
  })(d3, sszvis, EXTERNAL_CONFIG);
</script>
```

The following shows an example with accessible descriptions built-in. This is meant to be consumed by screen readers; it is not shown on screen.

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
