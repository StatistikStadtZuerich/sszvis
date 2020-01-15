## Getting started

1. Find an example of a chart that fits your data
2. Download the chart's example code
3. Add the example code to a local webserver like XAMPP
4. View the example and adjust to your liking

## Composition of examples

To get a better understanding of the structure in the code examples, here's an overview of the config objects.

### EXTERNAL_CONFIG

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

The responsiveProps ...

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

xAcc is short for xAccessor. These variables allow us to be mapped to the ... and to access the data points.

```code|lang-javascript
    var xAcc = sszvis.prop("year");
    var yAcc = sszvis.prop("value");
    var cAcc = sszvis.prop("category");
    var dataAcc = sszvis.prop("data");
```
