# Controls

Controls can be used to provide a graphical tool for interacting with a chart's state settings.

## Button Group Control

### sszvis.control.buttonGroup

#### `buttonGroup.values`

an array of values which are the options available in the control. Each one will become a button

#### `buttonGroup.current`

the current value of the buttonGroup control. Should be one of the options passed to .values()

#### `buttonGroup.[width]`

The total width of the buttonGroup control. Each option will have 1/3rd of this width. (default: 300px)

#### `buttonGroup.change`

A callback/event handler function to call when the user clicks on a value. Note that clicking on a value does not necessarily change any state unless this callback function does something.

### Example

```project
{
    "name": "bar-chart-horizontal-interactive",
    "files": {
        "index.html": {
            "source": "docs/bar-chart-horizontal/interactive.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/bar-chart-horizontal/data/SHB_13Categories.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "docs/fallback.png",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 645
    }
}
```

## Slider Control

### sszvis.control.slider

#### `slider.scale`

A scale function which this slider represents. The values in the scale's domain are used as the possible values of the slider.

#### `slider.minorTicks`

An array of ticks which become minor (smaller and unlabeled) ticks on the slider's axis.

#### `slider.majorTicks`

An array of ticks which become major (larger and labeled) ticks on the slider's axis.

#### `slider.tickLabels`

A function to use to format the major tick labels.

#### `slider.value`

The display value of the slider.

#### `slider.label`

A string or function for the handle label. The datum associated with it is the current slider value.

#### `slider.onchange`

A callback function called whenever user interaction attempts to change the slider value. Note that this component will not change its own state. The callback function must affect some state change in order for this component's display to be updated.

### Example

```project
{
    "name": "scatterplot-many-years",
    "files": {
        "index.html": {
            "source": "docs/scatterplot/years-fake.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/scatterplot/data/SS_years_fake.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "docs/fallback.png",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 460
    }
}
```

## Handle Ruler

### sszvis.control.handleRuler

#### `handleRuler.x`

A function or number which determines the x-position of the ruler

#### `handleRuler.y`

A function which determines the y-position of the ruler dots. Passed data values.

#### `handleRuler.top`

A number for the y-position of the top of the ruler.

#### `handleRuler.bottom`

A number for the y-position of the bottom of the ruler.

#### `handleRuler.label`

A string or string function for the labels of the ruler dots.

#### `handleRuler.color`

A string or color for the fill color of the ruler dots.

#### `handleRuler.flip`

A boolean or boolean function which determines whether the ruler should be flipped (they default to the right side)

### Example

```project
{
    "name": "map-cml-quartier-years",
    "files": {
        "index.html": {
            "source": "docs/map-standard/cml-quartier-years.html",
            "template": "docs/template.html"
        },
        "data.csv": "docs/map-standard/data/CML_quartier_years.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "docs/fallback.png",
        "d3.js": "vendor/d3/d3.min.js"
    },
    "sourceView": ["index.html", "data.csv"],
    "size": {
        "width": 516,
        "height": 675
    }
}
```
