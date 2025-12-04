> Horizontal grouped bar charts are suited to comparing multiple categories across different groups, with the horizontal orientation being particularly useful for longer category labels.

## sszvis.groupedBarsHorizontal

### Data structure

This chart requires data with at least three columns:

- A categorical grouping dimension (e.g., Region)
- A sub-category dimension (e.g., Category)
- A numerical value

The data should be grouped by the main categorical dimension, with each group containing multiple bars for the sub-categories.

### Configuration

The horizontal grouped bar chart uses `sszvis.groupedBarsHorizontal()` with the following key properties:

#### `groupedBarsHorizontal.groupScale(scale)`

A function that returns the y-position of each group. Usually composed with a band scale.

#### `groupedBarsHorizontal.groupHeight(height)`

The height available for each group. Usually the bandwidth of the y-scale.

#### `groupedBarsHorizontal.groupSize(size)`

The number of bars expected in each group. Used to calculate bar heights within the group.

#### `groupedBarsHorizontal.x(xPosition)`

The x-position of each bar (usually 0 for bars starting at the left edge, or a function for stacked/negative values).

#### `groupedBarsHorizontal.width(width)`

A function that returns the width of each bar based on its value.

#### `groupedBarsHorizontal.fill([fill])`

The color of each bar, usually based on the sub-category.

#### `groupedBarsHorizontal.defined([isDefined])`

A predicate function to identify missing values. Bars with missing values display as an "X" marker.

### Example

```code
const barLayout = sszvis
  .groupedBarsHorizontal()
  .groupScale(sszvis.compose(yScale, regionAcc))
  .groupHeight(yScale.bandwidth())
  .groupSize(state.longestGroup)
  .x(0)
  .width(sszvis.compose(xScale, valueAcc))
  .fill(sszvis.compose(cScale, categoryAcc))
  .defined(sszvis.compose(sszvis.not(isNaN), valueAcc));
```

### Chart

```project
{
    "name": "bar-chart-horizontal-grouped-basic",
    "files": {
        "index.html": {
            "source": "bar-chart-horizontal-grouped/basic.html",
            "template": "template.html"
        },
        "data.csv": "bar-chart-horizontal-grouped/data/HGB_3Categories.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",

    },
    "sourceView": ["index.html", "data.csv"]
}
```
