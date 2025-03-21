## Grey scales

### Defaults

These are the default text colors used throughout the UI. They are hard-coded into the CSS.

```html|plain,run-script
<div id="scaleGrey" class="scale-container"></div>
<script>
  colorSwatchFromColors("scaleGrey", ["#B8B8B8", "#7C7C7C", "#545454"]);
</script>
```

### `sszvis.scaleLightGry()`

A light grey scale is included for use in cases where a data background should be shaded out.

```html|plain,run-script
<div id="lightGreyScale" class="scale-container"></div>
<script>
  var scale = sszvis.scaleLightGry();
  colorSwatchFromLinearScale("lightGreyScale", scale, 1);
</script>
```

### `sszvis.scalePaleGry()`

A pale grey shade which is used for elements which should be in the background, but shouldn't completely fade out. Currently used as the color of the links in the sankey diagram.

```html|plain,run-script
<div id="paleGreyScale" class="scale-container"></div>
<script>
  var scale = sszvis.scalePaleGry();
  colorSwatchFromLinearScale("paleGreyScale", scale, 1);
</script>
```

### `sszvis.scaleGry()`

A grey scale is included for use in cases where a data value should be shaded out. Currently, it is used for the color of inactive lines in the coordinated map and line chart example. At the moment, it has only one value.

```html|plain,run-script
<div id="greyScale" class="scale-container"></div>
<script>
  var scale = sszvis.scaleGry();
  colorSwatchFromLinearScale("greyScale", scale, 1);
</script>
```

### `sszvis.scaleDimGry()`

A dim grey shade used for highlighting elements which are normally grey (`sszvis.scaleGry()`). Currently, it is used as the highlight color in the "bubble map".

```html|plain,run-script
<div id="dimGreyScale" class="scale-container"></div>
<script>
  var scale = sszvis.scaleDimGry();
  colorSwatchFromLinearScale("dimGreyScale", scale, 1);
</script>
```

### `sszvis.scaleMedGry()`

The medium grey color, as a standalone value.

```html|plain,run-script
<div id="medGreyScale" class="scale-container"></div>
<script>
  var scale = sszvis.scaleMedGry();
  colorSwatchFromLinearScale("medGreyScale", scale, 1);
</script>
```

### `sszvis.scaleDeepGry()`

The deep grey color, as a standalone value.

```html|plain,run-script
<div id="deepGreyScale" class="scale-container"></div>
<script>
  var scale = sszvis.scaleDeepGry();
  colorSwatchFromLinearScale("deepGreyScale", scale, 1);
</script>
```

## Qualitative scales

Qualitative scales are used for data that has distinct categories. They distinguish categories based on color contrast. They should never be used to compare values, use sequential or divergent scales in this case.

### `sszvis.scaleQual12()`

```html|plain,run-script
<div id="scaleQual" class="scale-container"></div>
<script>
  var scale = sszvis.scaleQual12();
  colorSwatchFromColors("scaleQual", scale.range());
</script>
```

### `sszvis.scaleQual6()`

```html|plain,run-script
<div id="scaleQual6" class="scale-container"></div>
<script>
  var scale = sszvis.scaleQual6();
  colorSwatchFromColors("scaleQual6", scale.range());
</script>
```

### `sszvis.scaleQual6a()`

```html|plain,run-script
<div id="scaleQual6a" class="scale-container"></div>
<script>
  var scale = sszvis.scaleQual6a();
  colorSwatchFromColors("scaleQual6a", scale.range());
</script>
```

### `sszvis.scaleQual6b()`

```html|plain,run-script
<div id="scaleQual6b" class="scale-container"></div>
<script>
  var scale = sszvis.scaleQual6b();
  colorSwatchFromColors("scaleQual6b", scale.range());
</script>
```

Qualitative scales can be brightened or darkened with the `scale.brighter()` and `scale.darker()` instance methods. These methods return new scale instances.

```html|plain,run-script
<div id="scaleQualBrighter" class="scale-container"></div>
<div id="scaleQualDefault" class="scale-container"></div>
<div id="scaleQualDarker" class="scale-container"></div>
<script>
  var scale = sszvis.scaleQual12();
  colorSwatchFromColors("scaleQualBrighter", scale.brighter().range());
  colorSwatchFromColors("scaleQualDefault", scale.range());
  colorSwatchFromColors("scaleQualDarker", scale.darker().range());
</script>
```

Qualitative scales can be reversed with the `scale.reverse()` instance method. This method returns a new scale.

```html|plain,run-script
<div id="scaleQualReverse" class="scale-container"></div>
<script>
  var scale = sszvis.scaleQual12().reverse();
  colorSwatchFromColors("scaleQualReverse", scale.range());
</script>
```

## Sequential

Sequential scales are used to compare values. These scales are designed to have the same brightness for the same input value.

### `sszvis.scaleSeqBlu()`

```html|plain,run-script
<div id="scale1" class="scale-container"></div>
<script>
  var scale = sszvis.scaleSeqBlu();
  colorSwatchFromLinearScale("scale1", scale, 9);
</script>
```

### `sszvis.scaleSeqRed()`

```html|plain,run-script
<div id="scale2" class="scale-container"></div>
<script>
  var scale = sszvis.scaleSeqRed();
  colorSwatchFromLinearScale("scale2", scale, 9);
</script>
```

### `sszvis.scaleSeqGrn()`

```html|plain,run-script
<div id="scale3" class="scale-container"></div>
<script>
  var scale = sszvis.scaleSeqGrn();
  colorSwatchFromLinearScale("scale3", scale, 9);
</script>
```

### `sszvis.scaleSeqBrn()`

```html|plain,run-script
<div id="scale4" class="scale-container"></div>
<script>
  var scale = sszvis.scaleSeqBrn();
  colorSwatchFromLinearScale("scale4", scale, 9);
</script>
```

Sequential scales can be reversed using the `scale.reverse()` instance method. This method returns a new scale instance.

```html|plain,run-script
<div id="scaleSeqBluRev" class="scale-container"></div>
<script>
  var scale = sszvis.scaleSeqBlu();
  colorSwatchFromLinearScale("scaleSeqBluRev", scale.reverse(), 9);
</script>
```

## Divergent

Divergent scales are used to compare data that has two extremes. These scales are designed to have the same brightness for the same input value.

### `sszvis.scaleDivVal()`

```html|plain,run-script
<div id="scale5" class="scale-container"></div>
<script>
  var scale = sszvis.scaleDivVal();
  colorSwatchFromLinearScale("scale5", scale, 10);
</script>
```

### `sszvis.scaleDivNtr()`

```html|plain,run-script
<div id="scale7" class="scale-container"></div>
<script>
  var scale = sszvis.scaleDivNtr();
  colorSwatchFromLinearScale("scale7", scale, 10);
</script>
```

A grey midpoint can be used in situations where the contour of a data mark must be visible on a white background.

### `sszvis.scaleDivValGry()`

```html|plain,run-script
<div id="scale6" class="scale-container"></div>
<script>
  var scale = sszvis.scaleDivValGry();
  colorSwatchFromLinearScale("scale6", scale, 9);
</script>
```

### `sszvis.scaleDivNtrGry()`

```html|plain,run-script
<div id="scale8" class="scale-container"></div>
<script>
  var scale = sszvis.scaleDivNtrGry();
  colorSwatchFromLinearScale("scale8", scale, 9);
</script>
```

Divergent scales can be reversed using the `scale.reverse()` instance method. This method returns a new scale instance.

```html|plain,run-script
<div id="scaleDivValRev" class="scale-container"></div>
<script>
  var scale = sszvis.scaleDivValGry();
  colorSwatchFromLinearScale("scaleDivValRev", scale.reverse(), 9);
</script>
```

## Gender

Categorical scales for highlighting datasets dealing with gender. These scales are designed to be easily distinguishable for people with color vision deficiencies.

### `sszvis.scaleGender3()`

By default, the domain of the colors represent `Frauen`, `Männer`, and `Divers`. However these can be overridden by defining the domain of the scale:

```code
const scale = sszvis.scaleGender3().domain(["Female", "Male", "Other"]);
```

```html|plain,run-script
<div id="scaleGender3" class="scale-container"></div>
<script>
  var scale = sszvis.scaleGender3();
  colorSwatchFromColors("scaleGender3", scale.range());
</script>
```

### `sszvis.scaleGender6Origin()`

By default, the domain of the colors represent `Schweizerinnen`, `Ausländerinnen`, `Schweizer`, `Ausländer`, `Divers Schweiz`, and `Divers Ausland`. However these can be overridden by defining the domain of the scale.

```code
const scale = sszvis.scaleGender6Origin()
  .domain([
    "Swiss Female",
    "Foreign Male",
    "Swiss Male",
    "Foreign Male",
    "Swiss Other",
    "Foreign Other",
  ]);
```

```html|plain,run-script
<div id="scaleGender6Origin" class="scale-container"></div>
<script>
  var scale = sszvis.scaleGender6Origin();
  colorSwatchFromColors("scaleGender6Origin", scale.range());
</script>
```

### `sszvis.scaleGender5Wedding()`

By default, the domain of the colors represent `Frau / Frau`, `Mann / Mann`, `Frau / Mann`, `Frau / Unbekannt`, and `Mann / Unbekannt`. However these can be overridden by defining the domain of the scale.

```code
const scale = sszvis.scaleGender5Wedding()
  .domain([
    "Female / Female",
    "Male / Male",
    "Female / Male",
    "Female / Unknown",
    "Male / Unknown",
  ]);
```

```html|plain,run-script
<div id="scaleGender5Wedding" class="scale-container"></div>
<script>
  var scale = sszvis.scaleGender5Wedding();
  colorSwatchFromColors("scaleGender5Wedding", scale.range());
</script>
```
