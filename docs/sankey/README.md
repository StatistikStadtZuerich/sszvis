# Sankey Diagram (Parallel Sets)

## sszvis.component.sankey

### Data structure

You can use the sszvis.layout.sankey.prepareData configurable transform function to simplify creating the data structure expected by this component.

The sankey.prepareData function expects a list of links, with a unique source node and target node id, and lists of node ids which fall into each column of the chart. Note that the same id should not appear multiple times, even in different columns. When this happens, an error is generated. The sizes of the nodes are defined implicitly by the fact that they have a link going to them or from them, and each node is the size of the sum of its links.

The sankey component itself expects data of the form returned by layout.sankey.prepareData. Most important are the .nodes property, a list of node data, and the .links property, a list of links. The nodes have arrays containing references to elements in the links, and the links have references to their source and target nodes.

### Configuration

#### `sankey.sizeScale`

A scale function for the size of the nodes.

#### `sankey.columnPosition`

A scale function for the position of the columns of nodes.

#### `sankey.nodeThickness`

A number for the horizontal thickness of the node bars.

#### `sankey.nodePadding`

A number for padding between the nodes.

#### `sankey.columnPadding`

Vertical padding for each column used to vertically center the columns.

#### `sankey.columnLabel`

The label at the top of each column.

#### `sankey.linkCurvature`

A number to specify the amount of 'curvature' of the links. Should be between 0 and 1.

#### `sankey.nodeColor`

Fill color for the nodes.

#### `sankey.linkColor`

Fill color for the links.

#### `sankey.linkSort`

A function determining how to sort the links, which are rendered stacked on top of each other. The default implementation stacks links in decresing order of value, i.e. larger, thicker links are below smaller, thinner ones.

#### `sankey.labelSide`

A function determining the position of labels for the nodes. Should return 'left' or 'right'

#### `sankey.labelHitBoxSize`

A number for the width of 'hit boxes' added underneath the labels. This should basically be equal to the width of the widest label. For performance reasons, it doesn't make sense to calculate this value at run time while the component is rendered. The user is asked to provide a reasonable value.

#### `sankey.nameLabel`

A function which takes the id of a node and should return the label for that node. Used to generate node labels

#### `sankey.linkSourceLabels`

An array containing the data for links which should have labels on their 'source' end, that is the end of the link which is connected to the source node. These data values should match the values returned by sszvis.layout.sankey.prepareData. For performance reasons, you need to give the data values themselves here. See the examples for an implementation of the most straightforward mechanism for this.

#### `sankey.linkTargetLabels`

Works the same as linkSourceLabels, but used for labels on the 'target' end of the link.

#### `sankey.linkLabel`

A string or function returning a string to use for the label of each link.


## Sankey Diagram - Two Columns

```project
{
    "name": "sankey-two-column",
    "files": {
        "index.html": {
            "source": "docs/sankey/sankey-two-column.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/sankey/data/zuzug.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "docs/fallback.png",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"]
}
```


## Sankey Diagram - Same Sets

```project
{
    "name": "sankey-same-sets",
    "files": {
        "index.html": {
            "source": "docs/sankey/sankey-same-sets.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/sankey/data/sankey_same_sets_fake.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "docs/fallback.png",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"]
}
```
