# Colors

## Grey scales

### Defaults

These are the default text colors used throughout the UI. They are hard-coded into the CSS.

```html|plain,run-script
<div id='scaleGrey' class='scale-container'></div>
<script>
    colorSwatchFromColors('scaleGrey', ["#B8B8B8", "#7C7C7C", "#545454"]);
</script>
```

### `color.gry()`

A grey scale is included for use in cases where a data value should be shaded out. Currently, it is used for the color of inactive lines in the coordinated map and line chart example. At the moment, it has only one value.

```html|plain,run-script
<div id='greyScale' class='scale-container'></div>
<script>
    var scale = sszvis.color.gry();
    colorSwatchFromLinearScale('greyScale', scale, 1);
</script>
```

## Qualitative scales

Qualitative scales are used for data that has distinct categories. They distinguish categories based on color contrast. They should never be used to compare values, use sequential or divergent scales in this case.

#### `color.qual12()`

```html|plain,run-script
<div id='scaleQual' class='scale-container'></div>
<script>
    var scale = sszvis.color.qual12();
    colorSwatchFromColors('scaleQual', scale.range());
</script>
```


#### `color.qual6()`

```html|plain,run-script
<div id='scaleQual6' class='scale-container'></div>
<script>
    var scale = sszvis.color.qual6();
    colorSwatchFromColors('scaleQual6', scale.range());
</script>
```

#### `color.qual6a()`

```html|plain,run-script
<div id='scaleQual6a' class='scale-container'></div>
<script>
    var scale = sszvis.color.qual6a();
    colorSwatchFromColors('scaleQual6a', scale.range());
</script>
```

#### `color.qual6b()`

```html|plain,run-script
<div id='scaleQual6b' class='scale-container'></div>
<script>
    var scale = sszvis.color.qual6b();
    colorSwatchFromColors('scaleQual6b', scale.range());
</script>
```

Qualitative scales can be brightened or darkened with the `scale.brighter()` and `scale.darker()` instance methods. These methods return new scale instances.

```html|plain,run-script
<div id='scaleQualBrigther' class='scale-container'></div>
<div id='scaleQualDefault' class='scale-container'></div>
<div id='scaleQualDarker' class='scale-container'></div>
<script>
    var scale = sszvis.color.qual12();
    colorSwatchFromColors('scaleQualBrigther', scale.brighter().range());
    colorSwatchFromColors('scaleQualDefault', scale.range());
    colorSwatchFromColors('scaleQualDarker', scale.darker().range());
</script>```

Qualitative scales can be reversed with the `scale.reverse()` instance method. This method returns a new scale.

```html|plain,run-script
<div id='scaleQualReverse' class='scale-container'></div>
<script>
    var scale = sszvis.color.qual12().reverse();
    colorSwatchFromColors('scaleQualReverse', scale.range());
</script>
```

## Sequential

Sequential sales are used to compare values. These scales are designed to have the same brightness for the same input value.

#### `color.seqBlu()`

```html|plain,run-script
<div id='scale1' class='scale-container'></div>
<script>
    var scale = sszvis.color.seqBlu();
    colorSwatchFromLinearScale('scale1', scale, 9);
</script>
```

#### `color.seqRed()`

```html|plain,run-script
<div id='scale2' class='scale-container'></div>
<script>
    var scale = sszvis.color.seqRed();
    colorSwatchFromLinearScale('scale2', scale, 9);
</script>
```

#### `color.seqGrn()`

```html|plain,run-script
<div id='scale3' class='scale-container'></div>
<script>
    var scale = sszvis.color.seqGrn();
    colorSwatchFromLinearScale('scale3', scale, 9);
</script>
```

#### `color.seqBrn()`

```html|plain,run-script
<div id='scale4' class='scale-container'></div>
<script>
    var scale = sszvis.color.seqBrn();
    colorSwatchFromLinearScale('scale4', scale, 9);
</script>
```

Sequential scales can be reversed using the `scale.reverse()` instance method. This method returns a new scale instance.

```html|plain,run-script
<div id='scaleSeqBluRev' class='scale-container'></div>
<script>
    var scale = sszvis.color.seqBlu();
    colorSwatchFromLinearScale('scaleSeqBluRev', scale.reverse(), 9);
</script>```


## Divergent

Divergent sales are used to compare data that has two extremes. These scales are designed to have the same brightness for the same input value.

They come in two color variations: the valued (red-blue) variation is used for data that has negative-positive characteristics, the neutral (brown-green) variation is used in cases where no valuation is wanted.

#### `color.divVal()`

```html|plain,run-script
<div id='scale5' class='scale-container'></div>
<script>
    var scale = sszvis.color.divVal();
    colorSwatchFromLinearScale('scale5', scale, 9);
</script>
```

#### `color.divNtr()`

```html|plain,run-script
<div id='scale7' class='scale-container'></div>
<script>
    var scale = sszvis.color.divNtr();
    colorSwatchFromLinearScale('scale7', scale, 9);
</script>
```

A grey midpoint can be used in situations where the contour of a data mark must be visible on a white background.

#### `color.divValGry()`

```html|plain,run-script
<div id='scale6' class='scale-container'></div>
<script>
    var scale = sszvis.color.divValGry();
    colorSwatchFromLinearScale('scale6', scale, 9);
</script>
```

#### `color.divNtrGry()`

```html|plain,run-script
<div id='scale8' class='scale-container'></div>
<script>
    var scale = sszvis.color.divNtrGry();
    colorSwatchFromLinearScale('scale8', scale, 9);
</script>
```

Divergent scales can be reversed using the `scale.reverse()` instance method. This method returns a new scale instance.

```html|plain,run-script
<div id='scaleDivValRev' class='scale-container'></div>
<script>
    var scale = sszvis.color.divVal();
    colorSwatchFromLinearScale('scaleDivValRev', scale.reverse(), 9);
</script>
```
