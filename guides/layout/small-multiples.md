# Small Multiples

Small multiples (also called facets) consist of two or more charts side-by-side (or in a grid), each displaying different data but in the same chart type with the same dimensions (ie. time, categories, geography, etc.).

This approach allows multiple data series to be presented more clearly than if all series were displayed on a single chart. It allows users to compare patterns across groups without cluttering a single chart.

Small multiples are most common with line or bar charts.

## When to use small multiples

Small multiple charts are useful when there are too many data series for a single chart to effectively display.

Ie. if a line chart has too many overlapping lines, small multiples where each chart only features one line can make the trends easier to follow.

### Example without small multiples

```project
{
    "name": "line-chart-overlapping",
    "files": {
        "index.html": {
            "source": "/guides/layout/line-overlapping.html",
            "template": "/template.html"
        },
        "data.csv": "/guides/layout/data/L_multiples.csv",
        "sszvis.js": "/sszvis.js",
        "sszvis.css": "/sszvis.css",
        "fallback.png": "/fallback.png"
    },
    "sourceView": ["index.html", "data.csv"]
}
```

### Example with small multiples

```project
{
    "name": "line-chart-small-multiples",
    "files": {
        "index.html": {
            "source": "/guides/layout/line-multiples.html",
            "template": "/template.html"
        },
        "data.csv": "/guides/layout/data/L_multiples.csv",
        "sszvis.js": "/sszvis.js",
        "sszvis.css": "/sszvis.css",
        "fallback.png": "/fallback.png"
    },
    "sourceView": ["index.html", "data.csv"]
}
```

## Key Rules

- Don’t use more than 12 instances within the small multiple chart
- Make sure that each graph within a small multiple chart uses the same scale for both the x (horizontal) and y (vertical) axes.
- Use a logical order of the graphs inside (ie. alphabetically, highest to lowest, temporal or geographical sequence, etc.).
- Place a single shared legend below the entire grid of charts. This avoids repeating legends inside each panel and reduces clutter and complexity.
- Use shared axis labels if layout allows (e.g., x-axis only on the bottom row).

## API Reference

### sszvis.layoutSmallMultiples

The small multiples layout component generates positioned SVG groups arranged in a grid. Each group can contain a complete chart instance.

#### Data Structure

This component expects an array of group objects, where each object represents one panel in the small multiples grid. Each group object must have a `values` property containing the data for that specific panel.

```code
const groupedData = [
  { group: "Category A", values: [...] },
  { group: "Category B", values: [...] },
  { group: "Category C", values: [...] }
];
```

The layout component adds the following properties to each group object:

- `gx` - The x-position of the group
- `gy` - The y-position of the group
- `gw` - The width of the group (excluding padding)
- `gh` - The height of the group (excluding padding)
- `cx` - The horizontal center point of the group
- `cy` - The vertical center point of the group

#### Configuration

##### `layoutSmallMultiples.width()`

The total width available for all groups combined (in pixels).

##### `layoutSmallMultiples.height()`

The total height available for all groups combined (in pixels).

##### `layoutSmallMultiples.paddingX()`

The horizontal spacing between columns of groups (in pixels). This space is distributed evenly between columns.

##### `layoutSmallMultiples.paddingY()`

The vertical spacing between rows of groups (in pixels). This space is distributed evenly between rows.

##### `layoutSmallMultiples.rows()`

The number of rows in the grid layout.

##### `layoutSmallMultiples.cols()`

The number of columns in the grid layout.

#### Usage Pattern

```code
// Configure the layout
const multiplesMaker = sszvis
  .layoutSmallMultiples()
  .width(bounds.innerWidth)
  .height(bounds.innerHeight)
  .paddingX(20)
  .paddingY(20)
  .rows(2)
  .cols(3);

// Apply the layout to create positioned groups
const chartGroups = chart
  .selectGroup("multiples")
  .datum(groupedData)
  .call(multiplesMaker);

// Render a chart into each group
chartGroups.selectAll(".sszvis-multiple").each(function (d) {
  const group = d3.select(this);

  // Configure chart components using d.gw, d.gh, etc.
  const xScale = d3.scaleLinear().domain([0, 100]).range([0, d.gw]);

  const yScale = d3.scaleLinear().domain([0, 100]).range([d.gh, 0]);

  // Render chart using d.values
  group
    .selectAll(".sszvis-multiple-chart")
    .datum(d.values)
    .call(chartComponent);
});
```

#### Responsive Configuration

Use `sszvis.responsiveProps()` to adjust the grid layout based on screen size:

```code
const queryProps = sszvis.responsiveProps().prop("rowsCols", {
  palm: [4, 1], // 4 rows, 1 column on mobile
  lap: [2, 2], // 2x2 grid on tablet
  _: [1, 4], // 1 row, 4 columns on desktop
});

// Later in render function
const props = queryProps(sszvis.measureDimensions(config.id));

const multiplesMaker = sszvis
  .layoutSmallMultiples()
  .width(bounds.innerWidth)
  .height(bounds.innerHeight)
  .paddingX(20)
  .paddingY(20)
  .rows(props.rowsCols[0])
  .cols(props.rowsCols[1]);
```

## Examples

### Pie Chart Multiples

Shows the use of the multiples component to render several pie charts, each showing a different segment of the same data. Includes an example of repeated tooltip components across panels.

```project
{
    "name": "pie-chart-multiples",
    "files": {
        "index.html": {
            "source": "/guides/layout/pie-multiples.html",
            "template": "/template.html"
        },
        "data.csv": "/guides/layout/data/P_multiples.csv",
        "sszvis.js": "/sszvis.js",
        "sszvis.css": "/sszvis.css",
        "fallback.png": "/fallback.png"
    },
    "sourceView": ["index.html", "data.csv"]
}
```

## Related Components

- **sszvis.layoutStackedAreaMultiples** - Specialized layout for stacked area chart multiples with shared x-axis
- **sszvis.responsiveProps** - Configure responsive breakpoints for adaptive grid layouts
- **sszvis.cascade** - Group and organize data by categories for small multiples
