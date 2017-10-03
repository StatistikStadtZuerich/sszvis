> **sszvis** is a JavaScript library that facilitates the creation of d3 data visualizations for Statistik Stadt Zürich.

## Getting started

1. Find an example of a chart that fits your data
2. Download the chart's example code
3. Add the example code to a local webserver like XAMPP
4. View the example and adjust to your liking

## Installation

Install sszvis and d3 from npm:

```
npm install sszvis d3 --save
```

Or embed it directly on any website:

```code|lang-html
<link href="https://unpkg.com/sszvis@2/build/sszvis.css" rel="stylesheet" />

<script src="https://unpkg.com/d3@4/build/d3.min.js"></script>
<script src="https://unpkg.com/sszvis@2/build/sszvis.min.js"></script>
```

##### TopoJSON (optional)

When you're using TopoJSON files to render maps, you'll also need the TopoJSON Client:

```
npm install topojson-client --save
```

Or as script:

```code|lang-html
<script src="https://unpkg.com/topojson-client@3/dist/topojson-client.min.js"></script>
```


## Source code

The source code for every example can be downloaded right from this documentation. The core library's source code is hosted on [GitHub](https://github.com/statistikstadtzuerich/sszvis).

## Project description

This library is based on [d3.js](http://www.d3js.org) and is fully interoperable with any [d3 examples](http://bl.ocks.org/) you might find on the Internet. It uses the [reusable chart](http://bost.ocks.org/mike/chart/) pattern, so any pre-made component you find in this style guide can be replaced with any other d3 chart of your choosing.

### Principles

* Provide downloadable examples to get started easily
* Stay as close to raw d3 as possible to keep everything familiar and extensible
* Favor small modules over ready-made chart types
* Encourage code structure based around central application state and idempotent render function to make it easy to build larger examples and correct code
* Treat data as immutable whenever possible
* Consume clean and well-prepared data only
