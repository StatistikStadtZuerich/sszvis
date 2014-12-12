# Visualization library

> A Javascript library that facilitates the creation of d3 data visualizations for Statistik Stadt Zürich.

## Getting started

1. Find an example of a chart that fits your data
2. Download the chart's example code
3. Add the example code to a local webserver like XAMPP
4. View the example and adjust to your liking

## Source code

The source code for every example can be downloaded. In addition, you can have a look at the core library's source here:

* [sszvis.js](sszvis.js)
* [sszvis.css](sszvis.css)

## Project description

This library is based on [d3.js](http://www.d3js.org) and is fully interoperable with any [d3 examples](http://bl.ocks.org/) you might find on the Internet. It uses the [reusable chart](http://bost.ocks.org/mike/chart/) pattern, so any pre-made component you find in this style guide can be replaced with any other d3 chart of your choosing.

The major goals of this libary are:

* Many downloadable examples to get started easily
* Stay as close to raw d3 as possible to keep everything familiar and extensible
* Favor small modules over ready-made chart types
* Namespace Javascript and CSS
* Encourage code structure based around central application state and idempotent render function to make it easy to build larger examples and correct code
* Treat data as immutable whenever possible
* Consume clean and well-prepared data only
