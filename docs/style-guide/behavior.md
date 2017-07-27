# Behavior

> SSZVIS supports many different types of interaction behavior. Some of those can be defined directly by selecting DOM elements and attaching event handlers, and others are more complicated, requiring special components to manage them. At the time of writing, there are three such special behavior components, `sszvis.move`, `sszvis.panning`, and `sszvis.voronoi`. Generally speaking, examples using each of these behavior types are sprinkled throughout the documentation for this library. If you are building a certain chart type that consistently uses a given behavior component in the examples, it is recommended that you follow that lead in your own case. However, some chart types, notably bar charts, are suitable to several different types of behavior, the optimal choice depending on the nature of the chart and even on the nature of the data. Collected here are potentially useful notes about choosing the right behavior component for your chart. In all cases, you can refer to the source code for the individual behaviors, and to the examples which use them, for more information on how to choose the right one for your chart.

## Move behavior

The move behavior allows moving the cursor or a finger across a rectangle of screen space, defined in the x and y dimensions by the ranges of two scales. On each interaction event, the behavior inverts the scales at the interaction point, and calls an event handler function, passing values that are in the scales' ranges. Among other uses, this is useful for showing interactive "rulers" on area and line charts, and for determining which bar has been interacted with in bar charts. Scrolling on a move behavior's rectangle can be optionally disabled, or disabled for only certain sections, through the use of a configuration function.

## Bar Charts

When deciding on bar chart interaction, there is a choice between three options.

First, the move behavior, configured to compute a correct “profile” for the bar chart which blocks scrolling on that profile. This is good for cases where you expect a lot of vertical touch motion, and want to show tooltips, but there is still a fair amount of whitespace available in the chart. The best example of where this is suitable is on the horizontally-oriented bar charts.

Second, the move behavior without any special profile configuration, which allows for left-right panning but allows the browser to scroll on up-down touch movement. This is suitable for dense vertical bar charts, where the user just wants to pan left-right to see all the tooltips. It is also suitable for area charts and line charts.

Third, the panning behavior, which unlike the move behavior doesn’t show tooltips in the spaces between bars, but which is suitable for situations where vertical movement is expected, but the profile approach would cover too much of the screen in a scroll trap. The best example of this is the vertical and horizontal stacked bar charts. The “profile” for these charts covers the entire chart area, so the only good place to enable scrolling is in the gaps between the bars.

## Voronoi behavior

This is a useful behavior for scatterplots. It calculates voronoi regions around a set of points, within a defined space. Each voronoi region is a potentially active touch target for the point at its heart. This means that any interaction will (by the definition of a voronoi diagram) trigger an event on the nearest point. However, the interaction must also occur within a given maximum distance from the point, in order to fire an event. This allows users to, for example, scroll on a mobile device by touching empty whitespace, while still enabling smart interaction behavior in the vicinity of scatterplot points.

## Panning behavior

The panning behavior provides smart and intutive interaction with strangely-shaped forms, for example map shapes. It provides simple hover functionality on cursor interaction, and attempts to imitate the feeling of hovering for touch interaction. The user can put down their finger on a panning-enabled shape, and then move that finger around to other shapes, triggering events on each shape as they go. Meanwhile, any scrolling which the browser might want to do, because of vertical movement of the finger, is prevented. But if the user touches the screen outside of a panning-enabled shape, scrolling is permitted as usual. Examples of panning behavior's use are the maps, pie and sunburst charts, the heat table, and the sankey diagram.
