# Tooltips

Tooltips are used to highlight particular data values or chart points of interest. They can also be used to facilitate chart reading by allowing the user to focus on a particular visual object and retrieve more information about it.

## Tooltip Class

### sszvis.tooltip

The tooltip class is used to generate all tooltips. This class can be called on any selection. A potential tooltip is created for each element in the selection, and it uses whatever data is already bound to those elements. Within the sszvis library, a useful abstraction called tooltipAnchor is used as the root element to which tooltips are bound. However, any element, with or without bound data, can be used as the base for tooltips. Tooltips are created on a selection using selection.call(tooltipInstance). Unlike most sszvis components, tooltips do not render into or as siblings of the selection on which the function is called. Instead, you must pass a selection containing an HTML DOM element as the `renderInto` option. The tooltips get their data and position information from the elements of the selection on which the component is called, but they are rendered into the selection passed as the `renderInto` option. This enables the library to present HTML content next to or over SVG content without needing to mix the two.

#### `tooltip.renderInto`

Provide a selection container into which to render the tooltip. Unlike most other components, the tooltip isn't rendered directly into the selection on which it is called. Instead, it's rendered into whichever selection is passed to the renderInto option.

#### `tooltip.visible`

Provide a predicate function which accepts a datum and determines whether the associated tooltip should be visible. The default value is false, meaning that no tooltips will be displayed unless this option is specified.

#### `tooltip.[header]`

A function accepting a datum. The result becomes the header of the tooltip. This function can return a plain string or an HTML string to be used as innerHTML.

#### `tooltip.[body]`

A function accepting a datum. The result becomes the body of the tooltip. This function can return a plain string, an HTML string to be used as innerHTML, or an array of arrays, which produces a tabular layout where each sub-array is one row in the table.

#### `tooltip.[orientation]`

A string or function returning a string which determines the orientation. This determines which direction the point of the tooltip sits relative to the body. Possible values are: "bottom" (points down), "top" (points upward), "left" (points left), and "right" (points right). In the examples below, each of the four orientations is demonstrated. Default is "bottom".

#### `tooltip.[dx]`

A number for the x-offset of the tooltip.

#### `tooltip.[dy]`

A number for the y-offset of the tooltip.

#### `tooltip.[opacity]`

A function or number which determines the opacity of the tooltip. Default is 1.


## Mini

This is the most basic tooltip form. Only the `.header` accessor function is used. You could also use only `.body`. This tooltip uses a modular text instance which accesses and formats data values, then renders them as bold html text.

```html|plain,run-script
<div id='miniBottom' class='tooltip-container'></div>
<script>
var id = 'miniBottom';

var data = [{
    value: 34
}];

var dimensions = {
    width: 70,
    height: 41
};

var position = [ 35, 41 ];

var tooltip = getTooltipComponent(id, data)
    .orientation('bottom')
    .header(sszvis.modularTextHTML().bold(sszvis.compose(sszvis.formatPercent, sszvis.prop('value'))));

renderTooltip(id, dimensions, data, position, tooltip);
</script>

<div id='miniTop' class='tooltip-container'></div>
<script>
var id = 'miniTop';

var data = [{
    value: 34
}];

var dimensions = {
    width: 70,
    height: 41
};

var position = [ 35, 0 ];

var tooltip = getTooltipComponent(id, data)
    .orientation('top')
    .header(sszvis.modularTextHTML().bold(sszvis.compose(sszvis.formatPercent, sszvis.prop('value'))));

renderTooltip(id, dimensions, data, position, tooltip);
</script>

<div id='miniLeft' class='tooltip-container'></div>
<script>
var id = 'miniLeft';

var data = [{
    value: 34
}];

var dimensions = {
    width: 76,
    height: 35
};

var position = [ 0, 17 ];

var tooltip = getTooltipComponent(id, data)
    .orientation('left')
    .header(sszvis.modularTextHTML().bold(sszvis.compose(sszvis.formatPercent, sszvis.prop('value'))));

renderTooltip(id, dimensions, data, position, tooltip);
</script>

<div id='miniRight' class='tooltip-container'></div>
<script>
var id = 'miniRight';

var data = [{
    value: 34
}];

var dimensions = {
    width: 76,
    height: 35
};

var position = [ 76, 17 ];

var tooltip = getTooltipComponent(id, data)
    .orientation('right')
    .header(sszvis.modularTextHTML().bold(sszvis.compose(sszvis.formatPercent, sszvis.prop('value'))));

renderTooltip(id, dimensions, data, position, tooltip);
</script>
```


## Medium

This example demonstrates use of both the `.header` and `.body` accessor functions. A bold section in the header modular text is used to highlight the data value.

```html|plain,run-script
<div id='medBot' class='tooltip-container'></div>
<script>
var id = 'medBot';

var data = [{
    value: 67
}];

var dimensions = {
    width: 113,
    height: 63
};

var position = [ 55, 63 ];

var tooltip = getTooltipComponent(id, data)
    .orientation('bottom')
    .header(
        sszvis.modularTextHTML()
            .bold(sszvis.compose(sszvis.formatPercent, sszvis.prop('value')))
            .plain('Anteile')
    )
    .body('im Kanton Zurich');

renderTooltip(id, dimensions, data, position, tooltip);
</script>

<div id='medTop' class='tooltip-container'></div>
<script>
var id = 'medTop';

var data = [{
    value: 67
}];

var dimensions = {
    width: 113,
    height: 63
};

var position = [ 55, 0 ];

var tooltip = getTooltipComponent(id, data)
    .orientation('top')
    .header(
        sszvis.modularTextHTML()
            .bold(sszvis.compose(sszvis.formatPercent, sszvis.prop('value')))
            .plain('Anteile')
    )
    .body('im Kanton Zurich');

renderTooltip(id, dimensions, data, position, tooltip);
</script>

<div id='medLeft' class='tooltip-container'></div>
<script>
var id = 'medLeft';

var data = [{
    value: 67
}];

var dimensions = {
    width: 119,
    height: 57
};

var position = [ 0, 28 ];

var tooltip = getTooltipComponent(id, data)
    .orientation('left')
    .header(
        sszvis.modularTextHTML()
            .bold(sszvis.compose(sszvis.formatPercent, sszvis.prop('value')))
            .plain('Anteile')
    )
    .body('im Kanton Zurich');

renderTooltip(id, dimensions, data, position, tooltip);
</script>

<div id='medRight' class='tooltip-container'></div>
<script>
var id = 'medRight';

var data = [{
    value: 67
}];

var dimensions = {
    width: 119,
    height: 57
};

var position = [ 119, 28 ];

var tooltip = getTooltipComponent(id, data)
    .orientation('right')
    .header(
        sszvis.modularTextHTML()
            .bold(sszvis.compose(sszvis.formatPercent, sszvis.prop('value')))
            .plain('Anteile')
    )
    .body('im Kanton Zurich');

renderTooltip(id, dimensions, data, position, tooltip);
</script>
```


## Maxi

For tabular-format tooltips, the `.body` accessor function should return an array of arrays. Each sub-array becomes a row in the tooltip table. This format is useful for displaying multiple data values. The elements of the sub array are placed into the resulting table row in order.

```html|plain,run-script
<div id='maxBot' class='tooltip-container'></div>
<script>
var id = 'maxBot';

var data = [{
    value: [
        ['Frauen', sszvis.formatPercent(49)],
        ['Männer', sszvis.formatPercent(51)]
    ]
}];

var dimensions = {
    width: 150,
    height: 110
};

var position = [ 75, 110 ];

var tooltip = getTooltipComponent(id, data)
    .orientation('bottom')
    .header(
        sszvis.modularTextHTML()
            .plain('Titel')
    )
    .body(sszvis.prop('value'));

renderTooltip(id, dimensions, data, position, tooltip);
</script>

<div id='maxTop' class='tooltip-container'></div>
<script>
var id = 'maxTop';

var data = [{
    value: [
        ['Frauen', sszvis.formatPercent(49)],
        ['Männer', sszvis.formatPercent(51)]
    ]
}];

var dimensions = {
    width: 150,
    height: 110
};

var position = [ 75, 0 ];

var tooltip = getTooltipComponent(id, data)
    .orientation('top')
    .header(
        sszvis.modularTextHTML()
            .plain('Titel')
    )
    .body(sszvis.prop('value'));

renderTooltip(id, dimensions, data, position, tooltip);
</script>

<div id='maxLeft' class='tooltip-container'></div>
<script>
var id = 'maxLeft';

var data = [{
    value: [
        ['Frauen', sszvis.formatPercent(49)],
        ['Männer', sszvis.formatPercent(51)]
    ]
}];

var dimensions = {
    width: 156,
    height: 104
};

var position = [ 0, 52 ];

var tooltip = getTooltipComponent(id, data)
    .orientation('left')
    .header(
        sszvis.modularTextHTML()
            .plain('Titel')
    )
    .body(sszvis.prop('value'));

renderTooltip(id, dimensions, data, position, tooltip);
</script>

<div id='maxRight' class='tooltip-container'></div>
<script>
var id = 'maxRight';

var data = [{
    value: [
        ['Frauen', sszvis.formatPercent(49)],
        ['Männer', sszvis.formatPercent(51)]
    ]
}];

var dimensions = {
    width: 156,
    height: 104
};

var position = [ 156, 52 ];

var tooltip = getTooltipComponent(id, data)
    .orientation('right')
    .header(
        sszvis.modularTextHTML()
            .plain('Titel')
    )
    .body(sszvis.prop('value'));

renderTooltip(id, dimensions, data, position, tooltip);
</script>
```


## Tooltip Anchors

Tooltip anchors provide a useful abstraction for positioning tooltips. They are not necessary for creating and positioning tooltips, but they are used by the sszvis components for this purpose. The tooltipAnchor class is configured with a position function, which tells each instance of the configured anchor where to place itself. The tooltips bound to these anchors will be positioned at that location. For help while developing, the `.debug` option can be set to true in order to reveal the position of the anchor, as seen in the example below.

```html|plain,run-script
<div id='tooltipAnchor' class='tooltip-container'></div>
<script>
var id = 'tooltipAnchor';

var data = [{
    value: 20
}];

var dimensions = {
    width: 100,
    height: 60
};

var position = [ 50, 50 ];

var tooltip = getTooltipComponent(id, data)
    .body('caption');

renderTooltip(id, dimensions, data, position, tooltip, true);
</script>
```
