## sszvis.sunburst

### Data Structure

Expects an array of data for the outermost ring of subcategories, where each datum has properties which identify its position within the hierarchy. The accessor functions for these properties should be passed, in order, to the 'layer' property of sszvis.sunburstPrepareData.

That function can then be used to compute an array of data values, where each data value represents a chunk in some level of the sunburst, and contains a reference to its parent chunk. Essentially, the input data structure is a tree structure where all nodes have been flattened into an array.

### Configuration

#### `sunburst.angleScale`

Scale function for the angle of the segments of the sunburst chart. Has a sensible default.

#### `sunburst.radiusScale`

Scale function for the radius of segments. Can be configured using values returned from sszvis.sunburstLayout. See the examples for how.

#### `sunburst.centerRadius`

The radius of the center of the chart. Can be configured with sszvis.sunburstLayout.

#### `sunburst.fill`

Function that returns the fill color for the segments in the center of the chart.

#### `sunburst.stroke`

The stroke color of the segments. Defaults to white.

## Chart

```project
{
    "name": "sunburst",
    "files": {
        "index.html": {
            "source": "sunburst/basic.html",
            "template": "template.html"
        },
        "data.csv": "sunburst/data/sun_burst_drei_hierarchien.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",

    },
    "sourceView": ["index.html", "data.csv"]
}
```
