# Accessibility

For accessibility purposes, a label has to be defined. A label will automatically be shown if a title and a description are provided. If a title and description are not already provided by an external source, they can be set in the config object.

See this snippet as an example of a config extended with a title and description:

```
 <script>
      var EXTERNAL_CONFIG = {
        data: "data/SHB_basic_percent.csv",
        id: "#sszvis-chart",
        fallback: "fallback.png",
        title: 'Diagrammtitel',
        description: 'Kurze Beschreibung des Inhalts dieses Diagramms'
      };
    </script>
```

This results in a chart with a label on hover:

```project
{
    "name": "population-pyramid-reference",
    "files": {
        "index.html": {
            "source": "population-pyramid/pyramid-reference.html",
            "template": "template.html"
        },
        "data.csv": "population-pyramid/data/BP_reference.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",

    },
    "sourceView": ["index.html", "data.csv"]
}
```

--> Do we have to put the title and description into the EXTERNAL Config? Because the other examples are not using this, right? So just in the normal config object?
