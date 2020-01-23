# Grouped Bar Chart

> Grouped bar charts are suited to making direct comparisons between multiple sets of similar things, while also comparing those sets using another differentiating dimension.

## sszvis.groupedBars

### Data structure

This chart requires a set of subsets, where each subset is a group of data objects to be displayed as a bar.

### Configuration

#### `groupedBars.groupScale(scale)`

This should be a scale function for determining the correct group offset of a member of a group. This function is passed the group member, and should return a value for the group offset which is the same for all members of the group. The within-group offset (which is different for each member) is then added to this group offset in order to position the bars individually within the group. So, for instance, if the groups are based on the "city" property, the groupScale should return the same value for all data objects with "city = Zurich".

#### `groupedBars.groupSize(size)`

This property tells groupedBars how many bars to expect for each group. It is used to assist in calculating the within-group layout and size of the bars. This number is treated as the same for all groups. Groups with less members than this number will have visible gaps. (Note that having less members in a group is not the same as having a member with a missing value, which will be discussed later)

#### `groupedBars.groupWidth(width)`

The width of the groups. This value is treated as the same for all groups. The width available to the groups is divided up among the bars. Often, this value will be the result of calling .rangeBand() on a d3.scale.ordinal scale.

#### `groupedBars.groupSpace(space)`

The percentage of space between each group. (default: 0.05). Usually the default is fine here.

#### `groupedBars.y(yPosition)`

The y-position of the bars in the group. This function is given a data value and should return a y-value. It should be similar to other functions you have already seen for positioning bars.

#### `groupedBars.height(height)`

The height of the bars in the group. This function is given a data value and should return a height value. It should be similar to other functions you have already seen for setting the height of bars.

#### `groupedBars.fill([fill])`

A functor which gives the color for each bar (often based on the bar's group). This can be a string or a function.

#### `groupedBars.stroke([stroke])`

The stroke color for each bar (default: none)

#### `groupedBars.defined([isDefined])`

A predicate function which can be used to determine whether a bar has a defined value. (default: true). Any bar for which this function returns false, meaning that it has an undefined (missing) value, will be displayed as a faint "x" in the grouped bar chart. This is in order to distinguish bars with missing values from bars with very small values, which would display as a very thin rectangle.

### Chart

```project
{
    "name": "bar-chart-grouped_basic",
    "files": {
        "index.html": {
            "source": "bar-chart-grouped/basic.html",
            "template": "template.html"
        },
        "data.csv": "bar-chart-grouped/data/GB_3Categories_yearly_negatives.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",

    },
    "sourceView": ["index.html", "data.csv"]
}
```
