> Pack charts (also known as circle pack diagrams) are suited to visualizing hierarchical data with quantitative values, where the size of each circle represents the magnitude of a metric and nested circles show the hierarchical structure.

## sszvis.pack

### Data Structure

The pack component expects data in a hierarchical structure, where each node has the following properties:

- `data` - the associated data as passed to hierarchy
- `depth` - zero for the root, increasing by one for each descendant generation
- `height` - the greatest distance from any descendant leaf, or zero for leaves
- `parent` - the parent node, or null for the root node
- `children` - an array of child nodes, if any, or undefined for leaves
- `value` - the optional summed value of the node and its descendants

Using the `sszvis.prepareHierarchyData()` function can help structure your data appropriately for the pack component. For more details, see the D3 [hierarchy documentation](https://d3js.org/d3-hierarchy/hierarchy).

The component automatically creates tooltip anchors at the center of each circle for easy tooltip integration.

### Configuration

#### `pack.colorScale`

Function that returns colors based on category keys. This is the preferred way to apply colors, as the component will automatically use the top-level category for coloring.

#### `pack.transition`

Boolean flag indicating whether to enable transitions for the pack layout. Defaults to true.

#### `pack.containerWidth`

The width of the container for the pack chart. Defaults to 800.

#### `pack.containerHeight`

The height of the container for the pack chart. Defaults to 600.

#### `pack.showLabels`

Boolean flag indicating whether to display labels on leaf circles. Defaults to false.

#### `pack.label`

Accessor function for the label text. Defaults to `d.data.key`.

#### `pack.minRadius`

Minimum circle radius for visibility. Circles smaller than this value will be filtered out. Defaults to 1.

#### `pack.circleStroke`

The stroke color for circle borders. Defaults to "#ffffff" (white).

#### `pack.circleStrokeWidth`

The stroke width for circle borders. Defaults to 1.

#### `pack.radiusScale`

Custom radius scale function for circle sizing. Optional parameter that allows you to override the default radius calculation from the pack layout.

## Chart

```project
{
    "name": "pack",
    "files": {
        "index.html": {
            "source": "pack/basic.html",
            "template": "template.html"
        },
        "data.csv": "pack/data/company_departments.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png"
    },
    "sourceView": ["index.html", "data.csv"]
}
```
