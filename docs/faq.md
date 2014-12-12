# Frequently Asked Questions

## Style Guide

### Maintenance

The style guide is built using our open-source documentation platform «Catalog». You can read about how to use it in the [Catalog documentation](http://interactivethings.github.io/catalog/)

### template.html

To make changes to template.html, add them to docs/template.html. There can also be multiple such template files, the one to use is specified in `docs/…/README.md`.

## Charts

### Chart dimensions

Chart dimensions are defined using `sszvis.bounds()`. An example:

```code
var bounds = sszvis.bounds({
  width: 460,   // Defaults to recommended setting (516)
  height: 760,  // Defaults to recommended setting (365)
  top: 70,      // Defaults to 0
  right: 20,    // Defaults to 0
  bottom: 50,   // Defaults to 0
  left: 80      // Defaults to 0
});
```

This automatically calculates `bounds.innerWidth` and `bounds.innerHeight`, which can be used for calculating chart element dimensions.

### `selection.data()` and `selection.datum()`

We use `selection.data()` within d3 charts to compute a data-join to work with the enter, update and exit selections. (See https://github.com/mbostock/d3/wiki/Selections#data)

In some cases we use `selection.data([0])` to create an element only once on the page. This works because the enter selection will be bound to the first element of the array, which is always the same and is the reason the element will not have an enter selection on the second run.

We use `selection.datum()` to set data to an element that we want to call a d3 chart on. In this case we don't want to compute a data-join because that is left to the implementation of the chart being called. (See https://github.com/mbostock/d3/wiki/Selections#datum)

### Alternative render targets

sszvis.js currently supports rendering to SVG and HTML. Other render targets could be Canvas or WebGL. Mixing different render targets is easily possible when creating the chart, an example of this is the tooltip layer, which renders to HTML. But components would have to be specifically written for these targets, as they encapsulate the render code that is specific to the target.

### Tooltip anchor selector

Tooltips use [HTML5 data attributes](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Using_data_attributes) to clarify their intent, which is not to style an element but to provide an anchor that can be selected using Javascript. Data attributes are selected with the [CSS attribute selector syntax](https://developer.mozilla.org/en-US/docs/Web/CSS/Attribute_selectors).

Tooltip anchors are invisible SVG `rect`s that each component needs to provide. Because they are real elements we can know their exact position on the page without any calculations and even if the parent element has been transformed. These elements need to be rects because some browsers don't calculate positon information for `g` elements.

### Number formatting

Numbers should always be formatted using sszvis.format. This ensures that thinspaces are introduced according to the Stadt Zürich style guide. The localization of the number format happens in vendor/d3-d3/d3-de.js. This file also includes a (obviously invisble …) unicode character for the thinspace. More about this character can be found here: http://www.fileformat.info/info/unicode/char/2009/index.htm

### Clipping masks

To clip the contents of the chart to chart boundaries (useful for scatterplots with large circles near the axis, but also potentially for other chart types), you should use an SVG clipPath element inside a defs element, with a rect that describes the size of the chart area. For information on these SVG element types, see https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Clipping_and_masking. You can ensure that the defs element and the necessary contents exist within the chart by using the utilities included in sszvis.svgUtils. You can check out the documentation of sszvis.svgUtils, and the uses of ensureDefsElement in various components. Notably, the lake renderer used in the map modules creates a texture which uses a mask.

### Animated chart components

The proposed way to create charts throughout all examples is to have an application state, events that act on this state, and re-render the whole chart when that state changes. This works well for these rather static examples.

In order to create an example with slight animation and a rather complex UI like http://www.nytimes.com/interactive/2013/09/25/sports/americas-cup-course.html?_r=0 it's most likely the best idea to start with the default way of doing things mentioned above because this simplifies the synchronization of UI and chart drastically.

To create an example like a force directed graph (http://bl.ocks.org/mbostock/4062045) the part of the rendering that updates the position of the elements needs to be extracted from the normal render function so it can be run efficiently without re-rendering everything – this is just too performance critical. In general, extracting performance critical code from the render function and running them separately is a good way to improve the performance.

### Creating new maps

The places to look for information about creating new maps are:

* sszvis/map/updating.txt
* sszvis-map-<name>.js
* Makefile (at the bottom)

### sszvis/layout/*

There are two ways to layout complex charts: a) make the calculation part of the chart's code b) create a layout function that can be used outside the chart. To stay consistent with the philosophy of this project, we chose solution b). We created several layout functions that return config objects for the charts you want to create. This is necessary for laying out bar charts, for example.

These layouts are not to be confused with d3 layouts, which are used to layout elements of a chart, e.g. in a force-directed layout. The d3 layouts modify your data with properties that can then be used. The sszvis layouts just return config objects that can or can not be used to configure a chart.


## Development

### Debugging

Here's a good overview of how to debug Javascript in Google Chrome: https://developer.chrome.com/devtools/docs/javascript-debugging

We often place `debugger` statements at a specific line of code to make the debugger pause and let us inspect and play with variables.

### Error Handling

Load errors are handled using the `sszvis.loadError()` function. When an error occurs, a browser alert window is shown. This helps the developers understand what the problem is. Because it's almost impossible that this error will be shown to end-users (the server would have to serve the chart but not the data), the alert is a good enough.

### Fallbacks

For older browsers like Internet Explorer 8 or older, conditional comments should be used to a) make sure not to load d3.js because it would throw an error in these browsers and b) to provide a fallback image (http://msdn.microsoft.com/en-us/library/ms537512%28v=vs.85%29.aspx).

In cases where a fallback needs to be shown depending on screen size (e.g. on a small mobile screen), [Media Queries](https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Media_queries?redirectlocale=en-US&redirectslug=CSS%2FMedia_queries) can be used to detect the viewport size.

Further, if a chart requires a certain browser feature to be present, [Modernizr](http://modernizr.com/) can be used to detect support and serve alternative content if support is not present.

More esoteric and error-prone fallback solutions would include such things as detecting the browser on the server and serving either one or another piece of HTML. These are error prone because they rely on browser detection, which never works.

### Testing

On OS X we test in Chrome, Firefox and Safari.

For Windows testing we use [VMWare Fusion](http://www.vmware.com/ch/products/fusion) and several VM images from [Modern.ie](https://www.modern.ie/de-de/virtualization-tools#downloads)

For mobile device testing, we use actual mobile devices.

Furthermore, [BrowserSync](http://www.browsersync.io/) is useful for testing across all these devices.

### Updating

The code currently depends on d3.js version 3.4.11 and topojson 1.6.18. You should be able to update both libraries without problems unless there are major API changes. No changes have been made to their source files.

### Strict Mode

We add a "use strict" declaration to the top of our module closures to prevent Javascript from checking the code loosely. This is most useful to prevent us from accidentally defining global variables. This is an opt-in feature, meaning older browsers that don't understand this declaration behave as if it weren't there, it doesn't break them. More information can be found here: [Strict Mode documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode).

This is not to be confused with the rendering modes "strict mode" and "quirks mode", which don't apply for Javascript: http://www.quirksmode.org/css/quirksmode.html

### Naming conventions

#### Javascript

```code
var MY_CONSTANT = 3;            // All caps constants
var MyClass = function() {};    // CamelCased class names
var myVariable = 3 * x;         // lowerCamelCased variable names
var __privateVariable__ = 3;

sszvis.myNamespace.myModule();  // Namespaces
sszvis.stackedBarChart();       // d3 components

var a = 3; // One var statement per variable unless another
var b = 4; // notation is much clearer in the given context
```

#### CSS

```code
.sszvis-my-component {};
.sszvis-my-component--modifier {};
.sszvis-my-component__child {};
```

#### HTML/SVG

```code
&lt;!-- data attributes with d3 namespace for d3 plugins --&gt;
&lt;g data-d3-selectgroup>&lt;/g&gt;

&lt;!-- data attributes with sszvis namespace for sszvis components --&gt;
&lt;text data-sszvis-label&gt;&lt;/text&gt;
```

#### sszvis

```code
// To access data coming directly from CSV, we use the
// convention to access it by []-accessor because the
// column names could have spaces or umlauts in them.
return {
  value: originalData['Kategorie']
}

// To access the parsed data, we use the dot notation
parsedData.value

// Or, preferrably, an accessor functions
var xAcc = sszvis.fn.prop('value');
xAcc(parsedData);
```

### Script loading issues

There are  define/require globals on the Stadt Zürich website (introduced by [ArcGIS](https://developers.arcgis.com/javascript/). These globals confuse scripts that are written with a [UMD declaration](https://github.com/umdjs/umd), because these scripts then won't expose their code to the browser as globals. This needs to be discussed with the SSZ IT department. One possible (hackish and untested) solution could be:

```code
&lt;script&gt;
  var orig_require = window.require;
  window.require = null;
&lt;/script&gt;
&lt;script src=&quot;d3.js&quot;/&gt;
&lt;script&gt;
  window.require = orig_require;
&lt;/script&gt;
```
