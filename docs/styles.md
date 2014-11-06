# Basis-Stile

## Farben

### Graustufen

```color
[
    {"value": "#B8B8B8"},
    {"value": "#7C7C7C"},
    {"value": "#545454"}
]
```

### Qualitativ

```color
[
    {"value": "#b8cfe6"},
    {"value": "#5182b3"},
    {"value": "#e6b7c7"},
    {"value": "#cc6788"},
    {"value": "#f2cec2"},
    {"value": "#e67d73"},
    {"value": "#faebaf"},
    {"value": "#e6cf73"},
    {"value": "#cfe6b8"},
    {"value": "#94bf69"},
    {"value": "#b8e6d2"},
    {"value": "#60bf97"}
]
```

```color
[
    {"value": "#B8CFE6"},
    {"value": "#5182B3"},
    {"value": "#F2CEC2"},
    {"value": "#E67D73"},
    {"value": "#FAEBAF"},
    {"value": "#E6CF73"},
    {"value": "#CFE6B8"},
    {"value": "#94BF69"},
    {"value": "#B8E6D2"},
    {"value": "#60BF97"},
    {"value": "#E6B7C7"},
    {"value": "#CC6788"}
]
```

### Linear
```html|plain,run-script
<script>
    var scaleName = 'seqBlu';
    var containerId = 'scale1';
</script>

<div id='scale1' class='scale-container' style='position:relative;width:300px;height:50px;'></div>

<script>
    var numBars = 9,
        barWidth = 80,
        barHeight = 80;

    var scale = sszvis.color2[scaleName]().domain([0, numBars - 1]),
        container = document.getElementById(containerId);

    container.style.width = pixels(barWidth * numBars);
    container.style.height = pixels(barHeight);

    d3.range(0, numBars).map(scale).forEach(function(c, i) {
        var colorDiv = document.createElement('div');
        colorDiv.style.position = 'absolute';
        colorDiv.style.left = pixels(i * barWidth);
        colorDiv.style.width = pixels(barWidth);
        colorDiv.style.height = pixels(barHeight);
        colorDiv.style.backgroundColor = c;
        container.appendChild(colorDiv);
    });

    function pixels(n) { return n + 'px'; }
</script>
```

```html|plain,run-script
<script>
    var scaleName = 'seqRed';
    var containerId = 'scale2';
</script>

<div id='scale2' class='scale-container' style='position:relative;width:300px;height:50px;'></div>

<script>
    var numBars = 9,
        barWidth = 80,
        barHeight = 80;

    var scale = sszvis.color2[scaleName]().domain([0, numBars - 1]),
        container = document.getElementById(containerId);

    container.style.width = pixels(barWidth * numBars);
    container.style.height = pixels(barHeight);

    d3.range(0, numBars).map(scale).forEach(function(c, i) {
        var colorDiv = document.createElement('div');
        colorDiv.style.position = 'absolute';
        colorDiv.style.left = pixels(i * barWidth);
        colorDiv.style.width = pixels(barWidth);
        colorDiv.style.height = pixels(barHeight);
        colorDiv.style.backgroundColor = c;
        container.appendChild(colorDiv);
    });

    function pixels(n) { return n + 'px'; }
</script>
```

```html|plain,run-script
<script>
    var scaleName = 'seqGrn';
    var containerId = 'scale3';
</script>

<div id='scale3' class='scale-container' style='position:relative;width:300px;height:50px;'></div>

<script>
    var numBars = 9,
        barWidth = 80,
        barHeight = 80;

    var scale = sszvis.color2[scaleName]().domain([0, numBars - 1]),
        container = document.getElementById(containerId);

    container.style.width = pixels(barWidth * numBars);
    container.style.height = pixels(barHeight);

    d3.range(0, numBars).map(scale).forEach(function(c, i) {
        var colorDiv = document.createElement('div');
        colorDiv.style.position = 'absolute';
        colorDiv.style.left = pixels(i * barWidth);
        colorDiv.style.width = pixels(barWidth);
        colorDiv.style.height = pixels(barHeight);
        colorDiv.style.backgroundColor = c;
        container.appendChild(colorDiv);
    });

    function pixels(n) { return n + 'px'; }
</script>
```

```html|plain,run-script
<script>
    var scaleName = 'seqBrn';
    var containerId = 'scale4';
</script>

<div id='scale4' class='scale-container' style='position:relative;width:300px;height:50px;'></div>

<script>
    var numBars = 9,
        barWidth = 80,
        barHeight = 80;

    var scale = sszvis.color2[scaleName]().domain([0, numBars - 1]),
        container = document.getElementById(containerId);

    container.style.width = pixels(barWidth * numBars);
    container.style.height = pixels(barHeight);

    d3.range(0, numBars).map(scale).forEach(function(c, i) {
        var colorDiv = document.createElement('div');
        colorDiv.style.position = 'absolute';
        colorDiv.style.left = pixels(i * barWidth);
        colorDiv.style.width = pixels(barWidth);
        colorDiv.style.height = pixels(barHeight);
        colorDiv.style.backgroundColor = c;
        container.appendChild(colorDiv);
    });

    function pixels(n) { return n + 'px'; }
</script>
```

### Divergent

```html|plain,run-script
<script>
    var scaleName = 'divBlu';
    var containerId = 'scale5';
</script>

<div id='scale5' class='scale-container' style='position:relative;width:300px;height:50px;'></div>

<script>
    var numBars = 9,
        barWidth = 80,
        barHeight = 80;

    var scale = sszvis.color2[scaleName]().domain([0, numBars - 1]),
        container = document.getElementById(containerId);

    container.style.width = pixels(barWidth * numBars);
    container.style.height = pixels(barHeight);

    d3.range(0, numBars).map(scale).forEach(function(c, i) {
        var colorDiv = document.createElement('div');
        colorDiv.style.position = 'absolute';
        colorDiv.style.left = pixels(i * barWidth);
        colorDiv.style.width = pixels(barWidth);
        colorDiv.style.height = pixels(barHeight);
        colorDiv.style.backgroundColor = c;
        container.appendChild(colorDiv);
    });

    function pixels(n) { return n + 'px'; }
</script>
```

```html|plain,run-script
<script>
    var scaleName = 'divBluAlt';
    var containerId = 'scale6';
</script>

<div id='scale6' class='scale-container' style='position:relative;width:300px;height:50px;'></div>

<script>
    var numBars = 9,
        barWidth = 80,
        barHeight = 80;

    var scale = sszvis.color2[scaleName]().domain([0, numBars - 1]),
        container = document.getElementById(containerId);

    container.style.width = pixels(barWidth * numBars);
    container.style.height = pixels(barHeight);

    d3.range(0, numBars).map(scale).forEach(function(c, i) {
        var colorDiv = document.createElement('div');
        colorDiv.style.position = 'absolute';
        colorDiv.style.left = pixels(i * barWidth);
        colorDiv.style.width = pixels(barWidth);
        colorDiv.style.height = pixels(barHeight);
        colorDiv.style.backgroundColor = c;
        container.appendChild(colorDiv);
    });

    function pixels(n) { return n + 'px'; }
</script>
```

```html|plain,run-script
<script>
    var scaleName = 'divGrn';
    var containerId = 'scale7';
</script>

<div id='scale7' class='scale-container' style='position:relative;width:300px;height:50px;'></div>

<script>
    var numBars = 9,
        barWidth = 80,
        barHeight = 80;

    var scale = sszvis.color2[scaleName]().domain([0, numBars - 1]),
        container = document.getElementById(containerId);

    container.style.width = pixels(barWidth * numBars);
    container.style.height = pixels(barHeight);

    d3.range(0, numBars).map(scale).forEach(function(c, i) {
        var colorDiv = document.createElement('div');
        colorDiv.style.position = 'absolute';
        colorDiv.style.left = pixels(i * barWidth);
        colorDiv.style.width = pixels(barWidth);
        colorDiv.style.height = pixels(barHeight);
        colorDiv.style.backgroundColor = c;
        container.appendChild(colorDiv);
    });

    function pixels(n) { return n + 'px'; }
</script>
```

```html|plain,run-script
<script>
    var scaleName = 'divGrnAlt';
    var containerId = 'scale8';
</script>

<div id='scale8' class='scale-container' style='position:relative;width:300px;height:50px;'></div>

<script>
    var numBars = 9,
        barWidth = 80,
        barHeight = 80;

    var scale = sszvis.color2[scaleName]().domain([0, numBars - 1]),
        container = document.getElementById(containerId);

    container.style.width = pixels(barWidth * numBars);
    container.style.height = pixels(barHeight);

    d3.range(0, numBars).map(scale).forEach(function(c, i) {
        var colorDiv = document.createElement('div');
        colorDiv.style.position = 'absolute';
        colorDiv.style.left = pixels(i * barWidth);
        colorDiv.style.width = pixels(barWidth);
        colorDiv.style.height = pixels(barHeight);
        colorDiv.style.backgroundColor = c;
        container.appendChild(colorDiv);
    });

    function pixels(n) { return n + 'px'; }
</script>
```

## Tooltips

```html|plain
<div style='position:relative;height:50px;'>
    <div class='sszvis-tooltip'>
        <div class='sszvis-tooltip-content'>
            <div class='sszvis-tooltip-header'>Example Header</div>
            <div class='sszvis-tooltip-body'>The tip of this tooltip points towards the top</div>
        </div>
        <div class='sszvis-tooltip-tipholder tip-top'>
            <div class='sszvis-tooltip-tip tip-top'></div>
        </div>
    </div>
</div>
```

```html|plain
<div style='position:relative;height:50px;'>
    <div class='sszvis-tooltip'>
        <div class='sszvis-tooltip-content'>
            <div class='sszvis-tooltip-header'>Example Header</div>
            <div class='sszvis-tooltip-body'>The tip of this tooltip points towards the bottom</div>
        </div>
        <div class='sszvis-tooltip-tipholder tip-bot'>
            <div class='sszvis-tooltip-tip tip-bot'></div>
        </div>
    </div>
</div>
```

```html|plain
<div style='position:relative;height:50px;'>
    <div class='sszvis-tooltip'>
        <div class='sszvis-tooltip-content'>
            <div class='sszvis-tooltip-header'>Example Header</div>
            <div class='sszvis-tooltip-body'>The tip of this tooltip points towards the left</div>
        </div>
        <div class='sszvis-tooltip-tipholder tip-left'>
            <div class='sszvis-tooltip-tip tip-left'></div>
        </div>
    </div>
</div>
```

```html|plain
<div style='position:relative;height:50px;'>
    <div class='sszvis-tooltip'>
        <div class='sszvis-tooltip-content'>
            <div class='sszvis-tooltip-header'>Example Header</div>
            <div class='sszvis-tooltip-body'>The tip of this tooltip points towards the right</div>
        </div>
        <div class='sszvis-tooltip-tipholder tip-right'>
            <div class='sszvis-tooltip-tip tip-right'></div>
        </div>
    </div>
</div>
```
