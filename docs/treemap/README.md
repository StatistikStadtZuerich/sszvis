## sszvis.treemap

### Data Structure

Expects an array of flat data that will be organized into a hierarchical
structure for the treemap. Each datum should have properties identifying its
position within the hierarchy. The accessor functions for these properties
should be passed to the `layers` array in the options object.

The treemap preparation function converts flat data into a hierarchical
structure suitable for D3's treemap layout. Each resulting node contains
position and dimension information (x0, y0, x1, y1) that can be used to render
rectangular areas.

### Configuration

#### `treemap.x`

Function that returns the x-position of the left edge of each rectangle.
Typically uses `d.x0` from the treemap layout.

#### `treemap.y`

Function that returns the y-position of the top edge of each rectangle.
Typically uses `d.y0` from the treemap layout.

#### `treemap.width`

Function that returns the width of each rectangle. Typically calculated as
`d.x1 - d.x0`.

#### `treemap.height`

Function that returns the height of each rectangle. Typically calculated as
`d.y1 - d.y0`.

#### `treemap.fill`

Function that returns the fill color for each rectangle. Can access the node's
data and ancestors to determine coloring.

#### `treemap.colorScale`

Function that returns colors based on category keys. This is the preferred way
to apply colors, as the component will automatically use the top-level category
for coloring.

#### `treemap.stroke`

The stroke color of the rectangle borders. Defaults to white.

#### `treemap.strokeWidth`

The width of the stroke around each rectangle. Defaults to 1.

### Data Preparation

#### `sszvis.treemapPrepareData(data, options)`

A data preparation function that converts flat data into hierarchical treemap
data.

**Parameters:**

- `data`: Array of flat data objects
- `options.layers`: Array of accessor functions defining the hierarchy levels
- `options.valueAccessor`: Function to extract numeric values for sizing
- `options.size`: `[width, height]` dimensions for the treemap layout

**Returns:** Array of `TreemapNode` objects ready for rendering

## Chart

```project
{
    "name": "treemap",
    "files": {
        "index.html": {
            "source": "treemap/basic.html",
            "template": "template.html"
        },
        "data.csv": "treemap/data/company_departments.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png"
    },
    "sourceView": ["index.html", "data.csv"]
}
```
