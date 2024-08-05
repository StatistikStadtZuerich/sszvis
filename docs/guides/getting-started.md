1. Find an example of a chart that fits your data
2. Download the chart's example code
3. Add the example code to a local webserver like XAMPP
4. View the example and adjust to your liking

## Code structure

The following provides a brief overview of a typical code example in this repository. Use this to
get an understanding of an example's structure and the conventions used.

```code|lang-html
<!DOCTYPE html>
<html>
  <head>
    <link href="https://unpkg.com/sszvis@3/build/sszvis.css" rel="stylesheet" />
    <script src="https://unpkg.com/d3@7/dist/d3.min.js"></script>
    <script src="https://unpkg.com/sszvis@3/build/sszvis.min.js"></script>
  </head>
  <body style="margin:0;padding:0;">
    <div id="sszvis-chart"></div>

    <script>
      // 1. Provide external configuration (optional)
      var EXTERNAL_CONFIG = { };
    </script>

    <script>
      (function(d3, sszvis, config) {
        // 2. Define props that depend on the window size
        var queryProps = sszvis.responsiveProps()

        // 3. Parse CSV data
        function parseRow(d) { }

        // 4. Define shortcuts to access a field in a datum
        var xAcc = sszvis.prop("date");

        // 5. Define the application state
        var state = { };

        // 6. Actions update the state
        var actions = {
          prepareState: function(data) { }
        };

        // 7. Fetch CSV from a server and start the application
        d3.csv("path/to/data.csv", parseRow).then(actions.prepareState).catch(sszvis.loadError)

        // 8. The render function is called on every state change
        function render(state) { }
      })(d3, sszvis, EXTERNAL_CONFIG);
    </script>
  </body>
</html>
```

#### 1. `EXTERNAL_CONFIG`

Charts often take configuration from an external source such as a CMS. The `EXTERNAL_CONFFIG`
pattern (the variable can be named differently, if you like) is a way to provide such configuration
to the chart. Here is an example:

```code|lang-html
<script>
  var EXTERNAL_CONFIG = {
    data: "data/StVB_7Categories_yearly.csv",
    id: "#sszvis-chart",
    fallback: "fallback.png"
  };
</script>
```

#### 2. `responsiveProps()`

The `ResponsiveProps` module provides a declarative way to configure properties which need to change
based on some breakpoints. SSZVIS comes with a default set of breakpoints (see `sszvis.breakpoint`),
but you can also define your own breakpoints.

The properties you configure must include an '\_' option, which is used when no breakpoints match.
It represents the "default" case and will also be returned when the `responsiveProps` function is
invoked with an invalid argument. If you configure special breakpoints, they should be passed in as
an array, sorted in testing order, of objects with a 'name' property, and one or both of 'width' and
'screenHeight' properties. This will generate breakpoints which can be applied internally.

```code|lang-javascript
var queryProps = sszvis
  .responsiveProps()
  .prop("label", {
    palm: "Besch. 2017
    _: "Beschäftigte im Jahr 2017"
  })
  .prop("ticks", {
    palm: 3,
    _: 5
  });
```

#### 3. `parseRow()`

The `parseRow` function takes a row of CSV data (`d`) and parses it into the representation the
chart needs at runtime.

```code|lang-javascript
function parseRow(d) {
  return {
    date: sszvis.parseDate(d["Datum"]),
    category: d["Berufsfeld"],
    value: sszvis.parseNumber(d["Anzahl"])
  };
}
```

#### 4. Accessors

"Acc" is short for "accessor". These functions allow us to safely access a given field in a data
point throughout the script.

```code|lang-javascript
    var xAcc = sszvis.prop("year");
    var yAcc = sszvis.prop("value");
    var cAcc = sszvis.prop("category");
```

#### 5. State

The application state holds all the data necessary to render the visualization.

#### 6. Actions

Actions update the state and then re-render the visualization by calling `render()` (8.)

#### 7. Fetching data

Fetch CSV from a server and start the application when the data arrived by calling the
`prepareState` action

#### 8. Render

The render function is called on every state change. It must be idempotent, meaning that if it is
run multiple times with the same state, the result must always be the same.
