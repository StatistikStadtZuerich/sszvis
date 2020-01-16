## Getting started

1. Find an example of a chart that fits your data
2. Download the chart's example code
3. Add the example code to a local webserver like XAMPP
4. View the example and adjust to your liking

## Composition of examples

To get a better understanding of the structure in the code examples, here's an examplary overview of the basic code samples.

### EXTERNAL_CONFIG

The `EXTERNAL_CONFFIG` is an example of an object storing information which is being provided from an external service, such as a CMS.

```code|lang-html
    <script>
      var EXTERNAL_CONFIG = {
        data: "data/StVB_7Categories_yearly.csv",
        id: "#sszvis-chart",
        fallback: "fallback.png"
      };
    </script>
```

### responsiveProps()

The ResponsiveProps module provides a declarative way to configure properties which need to change based on some breakpoints. SSZVIS comes with a default set of breakpoints (see sszvis.breakpoint), but you can also define your own breakpoints.

The properties you configure must include an '\_' option, which is used when no breakpoints match. It represents the 'default' case and will also be returned when the responsiveProps function is invoked with an invalid argument. If you configure special breakpoints, they should be passed in as an array, sorted in testing order, of objects with a 'name' property, and one or both of 'width' and 'screenHeight' properties. This will generate breakpoints which can be applied internally.

```code|lang-javascript
var queryProps = sszvis
          .responsiveProps()
          .prop("targetNumColumns", {
            palm: 1,
            _: 2
          })
          .prop("bottomPadding", {
            palm: 230,
            _: 150
          })
          .prop("barPadding", {
            palm: 0.7,
            _: 0.34
          })
          .prop("xLabel", {
            _: ""
          })
          .prop("yLabel", {
            _: "Beschäftigte"
          })
          .prop("ticks", {
            _: 5
          });
```

### parseRow

The parseRow function works as a direct gate to provide the names for the individual labels.

```code|lang-javascript
function parseRow(d) {
          return {
            year: d["Jahr"],
            category: d["Berufsfeld"],
            value: sszvis.parseNumber(d["Anzahl"])
          };
        }
```

### Accessors

xAcc is short for xAccessor. These variables allow us to access the data points because they are being mapped to ... .

```code|lang-javascript
    var xAcc = sszvis.prop("year");
    var yAcc = sszvis.prop("value");
    var cAcc = sszvis.prop("category");
    var dataAcc = sszvis.prop("data");
```
