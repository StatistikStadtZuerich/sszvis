# Population Pyramid

> The population pyramid is used to show how a measurement varies across ages, or ranges of ages, within a population. The most common example is to show the number of people in the population for each age. In addition, population pyramids are mirrored, with a left and right side. The sides contrast differences across a binary variable, usually gender. More generally, the mirrored bar charts form could be used to display any contrast across a binary variable, with any type of variable mapped to the vertical dimension, but it is almost always used for population display, and it should be explicitly noted where that is not the case. As you will see from the examples, it is also possible to display bins computed from the population based on age range.

## sszvis.component.pyramid

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

Supply an accessor funtion for reference data for the left side. If this option is specified, the pyramid will show a reference line.

#### `pyramid.[rightRefAccessor]`

Supply an accessor funtion for reference data for the right side. If this option is specified, the pyramid will show a reference line.


### Chart

```project
{
    "name": "population-pyramid-basic",
    "files": {
        "index.html": {
            "source": "docs/population-pyramid/pyramid-basic.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/population-pyramid/data/BP_basic.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 476
    }
}
```

## sszvis.component.stackedPyramid

### Data structure

This component, like the standard pyramid component, expects an object with left and right sides, plus property accessors for getting the side data. However, unlike the standard pyramid, it expects that the returned data structure is an array of sub-arrays, where each sub-array represents one layer of the stack. This component is essentially a combination of the population pyramid component and the stacked bar chart component.

### Configuration

The configuration options are the same as for the standard pyramid component, including the possibility of adding reference lines

### Stacked pyramid example

```project
{
    "name": "population-pyramid-stacked",
    "files": {
        "index.html": {
            "source": "docs/population-pyramid/pyramid-stacked.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/population-pyramid/data/BP_stacked.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 496
    }
}
```

## Non-stacked pyramid with reference lines

```project
{
    "name": "population-pyramid-reference",
    "files": {
        "index.html": {
            "source": "docs/population-pyramid/pyramid-reference.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/population-pyramid/data/BP_reference.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 476
    }
}
```
