# Fundamentals

## Color scales

### Grays

```html|plain,run-script
<div id='scaleGray' class='scale-container'></div>
<script>
    colorSwatchFromColors('scaleGray', ["#B8B8B8", "#7C7C7C", "#545454"]);
</script>
```

### Qualitative

#### `color2.qual()`

```html|plain,run-script
<div id='scaleQual' class='scale-container'></div>
<script>colorSwatchFromQualitativeScale('scaleQual', 'qual');</script>
```

#### `color2.qual2()`

```html|plain,run-script
<div id='scaleQual2' class='scale-container'></div>
<script>colorSwatchFromQualitativeScale('scaleQual2', 'qual2');</script>
```

#### `color2.qual6a()`

```html|plain,run-script
<div id='scaleQual6a' class='scale-container'></div>
<script>colorSwatchFromQualitativeScale('scaleQual6a', 'qual6a');</script>
```

#### `color2.qual6b()`

```html|plain,run-script
<div id='scaleQual6b' class='scale-container'></div>
<script>colorSwatchFromQualitativeScale('scaleQual6b', 'qual6b');</script>
```

### Sequential

#### `color2.seqBlu()`

```html|plain,run-script
<div id='scale1' class='scale-container'></div>
<script>colorSwatchFromLinearScale('scale1', 'seqBlu', 9);</script>
```

#### `color2.seqRed()`

```html|plain,run-script
<div id='scale2' class='scale-container'></div>
<script>colorSwatchFromLinearScale('scale2', 'seqRed', 9);</script>
```

#### `color2.seqGrn()`

```html|plain,run-script
<div id='scale3' class='scale-container'></div>
<script>colorSwatchFromLinearScale('scale3', 'seqGrn', 9);</script>
```

#### `color2.seqBrn()`

```html|plain,run-script
<div id='scale4' class='scale-container'></div>
<script>colorSwatchFromLinearScale('scale4', 'seqBrn', 9);</script>
```

### Divergent

#### `color2.divBlu()`

```html|plain,run-script
<div id='scale5' class='scale-container'></div>
<script>colorSwatchFromLinearScale('scale5', 'divBlu', 9);</script>
```

#### `color2.divBluAlt()`

```html|plain,run-script
<div id='scale6' class='scale-container'></div>
<script>colorSwatchFromLinearScale('scale6', 'divBluAlt', 9);</script>
```

#### `color2.divGrn()`

```html|plain,run-script
<div id='scale7' class='scale-container'></div>
<script>colorSwatchFromLinearScale('scale7', 'divGrn', 9);</script>
```

#### `color2.divGrnAlt()`

```html|plain,run-script
<div id='scale8' class='scale-container'></div>
<script>colorSwatchFromLinearScale('scale8', 'divGrnAlt', 9);</script>
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
