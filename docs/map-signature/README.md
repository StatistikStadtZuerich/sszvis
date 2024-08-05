## Bubble Map

The "bubble map" concept is a map with sized circle data overlays for each map entity. The map
shapes should be rendered with the standard map class for the type you want, and then the circles
overhead are rendered as an "anchored shape".

## sszvis.mapRendererBubble

This is an "anchored shape" used to render circles above map entities.

### Data Structures

Expects an array of data which can be matched to map entities, much like the base map components.

### Configuration

Configure this component, and a base map component, and pass this component as the .anchoredShape
property of the base map component.

#### `mapRendererBubble.radius()`

The radius of the circles. Can be a function which accepts a datum and returns a radius value.

#### `mapRendererBubble.fill()`

The fill color of the circles. Can be a function which accepts a datum and returns a color.

#### `mapRendererBubble.strokeColor()`

The stroke color of the circles. Can be a function which accepts a datum and returns a color.

#### `mapRendererBubble.transition()`

Whether or not to transition the sizes of the circles when data changes. Default true.

## Bubble Map of Statistische Zonen

```project
{
    "name": "map-bubble-statzone",
    "files": {
        "index.html": {
            "source": "map-signature/signature-statzone.html",
            "template": "template.html"
        },
        "data.csv": "map-signature/data/births_year_statisticalZones.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",
    },
    "sourceView": ["index.html", "data.csv"]
}
```

## Bubble Map of Statistische Quartiere

```project
{
    "name": "map-bubble-statquart",
    "files": {
        "index.html": {
            "source": "map-signature/signature-statisticalquarters.html",
            "template": "template.html"
        },
        "data.csv": "map-signature/data/fake_statistical_quarters.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",
    },
    "sourceView": ["index.html", "data.csv"]
}
```
