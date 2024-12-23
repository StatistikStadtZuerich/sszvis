> The population pyramid is used to show how a measurement varies across ages, or ranges of ages, within a population.

The most common example is to show the number of people in the population for each age. In addition, population pyramids are mirrored, with a left and right side. The sides contrast differences across a binary variable, usually gender. More generally, the mirrored bar charts form could be used to display any contrast across a binary variable, with any type of variable mapped to the vertical dimension, but it is almost always used for population display, and it should be explicitly noted where that is not the case. As you will see from the examples, it is also possible to display bins computed from the population based on age range.

## sszvis.pyramid

### Data structure

This component expects an object with properties that correspond to the two sides of the pyramid. You use configuration properties to tell the component how to access the data stored on the object. Each side's data should be an array of data values, where each data value is converted into one bar in the pyramid.

### Configuration

#### `pyramid.barHeight`

Accessor function or numeric constant for the height of a bar

#### `pyramid.barWidth`

Accessor function or numeric constant for the width of a bar

#### `pyramid.barPosition`

Scale function for the vertical position of a bar

#### `pyramid.leftAccessor`

Accessor function which gets the data for the left side

#### `pyramid.rightAccessor`

Accessor function which gets the data for the right side

#### `pyramid.[barFill]`

Accessor function or constant for the color of a bar

#### `pyramid.[leftRefAccessor]`

Supply an accessor function for reference data for the left side. If this option is specified, the pyramid will show a reference line.

#### `pyramid.[rightRefAccessor]`

Supply an accessor function for reference data for the right side. If this option is specified, the pyramid will show a reference line.

### Chart

```project
{
    "name": "population-basic",
    "files": {
        "index.html": {
            "source": "population-pyramid/basic.html",
            "template": "template.html"
        },
        "data.csv": "population-pyramid/data/BP_basic.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",

    },
    "sourceView": ["index.html", "data.csv"]
}
```

## sszvis.stackedPyramid

### Data structure

This component, like the standard pyramid component, expects an object with left and right sides, plus property accessors for getting the side data. However, unlike the standard pyramid, it expects that the returned data structure is an array of sub-arrays, where each sub-array represents one layer of the stack. This component is essentially a combination of the population pyramid component and the stacked bar chart component.

To create the stacked pyramid, you can use the `sszvis.stackedPyramidData` function to transform your data into the correct format. This function accepts the gender accessor, the age accessor, stack accessor and the value accessor, and returns an generator that can be applies to the data.

### Configuration

The configuration options are the same as for the standard pyramid component, including the possibility of adding reference lines

### Chart

```project
{
    "name": "population-pyramid-stacked",
    "files": {
        "index.html": {
            "source": "population-pyramid/pyramid-stacked.html",
            "template": "template.html"
        },
        "data.csv": "population-pyramid/data/BP_stacked.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",

    },
    "sourceView": ["index.html", "data.csv"]
}
```

## Reference lines

Reference lines can be shown to compare another set of data with the data displayed in the pyramid.

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
