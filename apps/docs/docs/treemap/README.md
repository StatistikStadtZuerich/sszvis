> Treemaps are suited to visualizing hierarchical data with quantitative values, where the size of each rectangle represents the magnitude of a metric and nested rectangles show the hierarchical structure.

## sszvis.treemap

### Data Structure

The treemap component expects data in a hierarchical structure, where each node has the following properties:

- `data` - the associated data as passed to hierarchy
- `depth` - zero for the root, increasing by one for each descendant generation
- `height` - the greatest distance from any descendant leaf, or zero for leaves
- `parent` - the parent node, or null for the root node
- `children` - an array of child nodes, if any, or undefined for leaves
- `value` - the optional summed value of the node and its descendants

Using the `sszvis.prepareHierarchyData()` function can help structure your data appropriately for the treemap component. For more details, see the D3 [hierarchy documentation](https://d3js.org/d3-hierarchy/hierarchy).

The component automatically creates tooltip anchors at the center of each rectangle for easy tooltip integration.

### Configuration

#### `treemap.colorScale`

Function that returns colors based on category keys. This is the preferred way to apply colors, as the component will automatically use the top-level category for coloring.

#### `treemap.transition`

Boolean flag indicating whether to enable transitions for the treemap layout. Defaults to true.

#### `treemap.containerWidth`

The width of the container for the treemap. Defaults to 800.

#### `treemap.containerHeight`

The height of the container for the treemap. Defaults to 600.

#### `treemap.showLabels`

Boolean flag indicating whether to display labels for each rectangle. Defaults to false.

#### `treemap.label`

Accessor function for the label text. Defaults to `d.data.key`.

#### `treemap.labelPosition`

Position of the labels within each rectangle. Options include "top-left", "center", "top-right", "bottom-left", "bottom-right".

Defaults to "top-left".

#### `treemap.stroke`

The stroke color for rectangle borders. Defaults to white.

#### `treemap.strokeWidth`

The stroke width for rectangle borders. Defaults to 1.

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
