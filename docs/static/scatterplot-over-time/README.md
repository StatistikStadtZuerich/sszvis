# Scatterplot over time

> The scatterplot over time can be used to show how values in a scatterplot have changed in time. This serves as an example of how to combine the line and dot components of sszvis with a time filter, in order to achieve the desired design. It is not a component itself, but it is a combination of several other components, used together for a very customizable chart type.

## sszvis.line and sszvis.dot

### Data Structure

This chart requires three dimensions - one for the x axis, one for the y, and one for the filter scrubber. The line and dot components each have their own requirements for the data structure. As an optimization, all possible data structures required by the render function can be computed ahead of time, and filtering can simply select one of them.

### Configuration

Configuration should follow the example below. It involves a combination of configuring the line and dot components, the voronoi interaction for the dots, the slider component, the color legend, the two axes, and the tooltip.

## Example

```project
{
    "name": "scatterplot-over-time",
    "files": {
        "index.html": {
            "source": "scatterplot-over-time/scatterplot-over-time.html",
            "template": "template.html"
        },
        "data.csv": "scatterplot-over-time/data/scatterplot_over_time.csv",
        "sszvis.js": "sszvis.js",
        "sszvis.css": "sszvis.css",
        "fallback.png": "fallback.png",
        
    },
    "sourceView": ["index.html", "data.csv"]
}
```
