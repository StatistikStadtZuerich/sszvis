# Tooltips

## Mini

```html|plain,run-script
<div id='miniBottom' class='tooltip-container'></div>
<script>
var id = 'miniBottom';

var data = [{
    value: 0.34
}];

var dimensions = {
    width: 70,
    height: 41
};

var position = [ 35, 41 ];

var tooltip = getTooltipComponent(id, data)
    .orientation('bottom')
    .header(sszvis.component.modularText.html().bold(sszvis.fn.compose(sszvis.format.percent, sszvis.fn.prop('value'))));

renderTooltip(id, dimensions, data, position, tooltip);
</script>

<div id='miniTop' class='tooltip-container'></div>
<script>
var id = 'miniTop';

var data = [{
    value: 0.34
}];

var dimensions = {
    width: 70,
    height: 41
};

var position = [ 35, 0 ];

var tooltip = getTooltipComponent(id, data)
    .orientation('top')
    .header(sszvis.component.modularText.html().bold(sszvis.fn.compose(sszvis.format.percent, sszvis.fn.prop('value'))));

renderTooltip(id, dimensions, data, position, tooltip);
</script>

<div id='miniRight' class='tooltip-container'></div>
<script>
var id = 'miniRight';

var data = [{
    value: 0.34
}];

var dimensions = {
    width: 76,
    height: 35
};

var position = [ 76, 17 ];

var tooltip = getTooltipComponent(id, data)
    .orientation('right')
    .header(sszvis.component.modularText.html().bold(sszvis.fn.compose(sszvis.format.percent, sszvis.fn.prop('value'))));

renderTooltip(id, dimensions, data, position, tooltip);
</script>

<div id='miniLeft' class='tooltip-container'></div>
<script>
var id = 'miniLeft';

var data = [{
    value: 0.34
}];

var dimensions = {
    width: 76,
    height: 35
};

var position = [ 0, 17 ];

var tooltip = getTooltipComponent(id, data)
    .orientation('left')
    .header(sszvis.component.modularText.html().bold(sszvis.fn.compose(sszvis.format.percent, sszvis.fn.prop('value'))));

renderTooltip(id, dimensions, data, position, tooltip);
</script>
```

## Medium

```html|plain,run-script
<div id='medBot' class='tooltip-container'></div>
<script>
var id = 'medBot';

var data = [{
    value: 0.67
}];

var dimensions = {
    width: 113,
    height: 63
};

var position = [ 55, 63 ];

var tooltip = getTooltipComponent(id, data)
    .orientation('bottom')
    .header(
        sszvis.component.modularText.html()
            .bold(sszvis.fn.compose(sszvis.format.percent, sszvis.fn.prop('value')))
            .plain('Anteile')
    )
    .body('im Kanton Zurich');

renderTooltip(id, dimensions, data, position, tooltip);
</script>

<div id='medTop' class='tooltip-container'></div>
<script>
var id = 'medTop';

var data = [{
    value: 0.67
}];

var dimensions = {
    width: 113,
    height: 63
};

var position = [ 55, 0 ];

var tooltip = getTooltipComponent(id, data)
    .orientation('top')
    .header(
        sszvis.component.modularText.html()
            .bold(sszvis.fn.compose(sszvis.format.percent, sszvis.fn.prop('value')))
            .plain('Anteile')
    )
    .body('im Kanton Zurich');

renderTooltip(id, dimensions, data, position, tooltip);
</script>

<div id='medLeft' class='tooltip-container'></div>
<script>
var id = 'medLeft';

var data = [{
    value: 0.67
}];

var dimensions = {
    width: 119,
    height: 57
};

var position = [ 0, 28 ];

var tooltip = getTooltipComponent(id, data)
    .orientation('left')
    .header(
        sszvis.component.modularText.html()
            .bold(sszvis.fn.compose(sszvis.format.percent, sszvis.fn.prop('value')))
            .plain('Anteile')
    )
    .body('im Kanton Zurich');

renderTooltip(id, dimensions, data, position, tooltip);
</script>

<div id='medRight' class='tooltip-container'></div>
<script>
var id = 'medRight';

var data = [{
    value: 0.67
}];

var dimensions = {
    width: 119,
    height: 57
};

var position = [ 119, 28 ];

var tooltip = getTooltipComponent(id, data)
    .orientation('right')
    .header(
        sszvis.component.modularText.html()
            .bold(sszvis.fn.compose(sszvis.format.percent, sszvis.fn.prop('value')))
            .plain('Anteile')
    )
    .body('im Kanton Zurich');

renderTooltip(id, dimensions, data, position, tooltip);
</script>
```

## Maxi

```html|plain,run-script
<div id='maxBot' class='tooltip-container'></div>
<script>
var id = 'maxBot';

var data = [{
    value: [
        ['Frauen', sszvis.format.percent(0.49)],
        ['Männer', sszvis.format.percent(0.51)]
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
        sszvis.component.modularText.html()
            .plain('Titel')
    )
    .body(sszvis.fn.prop('value'));

renderTooltip(id, dimensions, data, position, tooltip);
</script>

<div id='maxTop' class='tooltip-container'></div>
<script>
var id = 'maxTop';

var data = [{
    value: [
        ['Frauen', sszvis.format.percent(0.49)],
        ['Männer', sszvis.format.percent(0.51)]
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
        sszvis.component.modularText.html()
            .plain('Titel')
    )
    .body(sszvis.fn.prop('value'));

renderTooltip(id, dimensions, data, position, tooltip);
</script>

<div id='maxLeft' class='tooltip-container'></div>
<script>
var id = 'maxLeft';

var data = [{
    value: [
        ['Frauen', sszvis.format.percent(0.49)],
        ['Männer', sszvis.format.percent(0.51)]
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
        sszvis.component.modularText.html()
            .plain('Titel')
    )
    .body(sszvis.fn.prop('value'));

renderTooltip(id, dimensions, data, position, tooltip);
</script>

<div id='maxRight' class='tooltip-container'></div>
<script>
var id = 'maxRight';

var data = [{
    value: [
        ['Frauen', sszvis.format.percent(0.49)],
        ['Männer', sszvis.format.percent(0.51)]
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
        sszvis.component.modularText.html()
            .plain('Titel')
    )
    .body(sszvis.fn.prop('value'));

renderTooltip(id, dimensions, data, position, tooltip);
</script>
```
