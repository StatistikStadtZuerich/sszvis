> With the introduction of a new responsive website for the city of Zürich this library received a
> responsive upgrade in fall 2016. In this document we briefly document the breakpoints that are now
> in use for this library.

# Container Width

The new website for the city of Zürich uses the following breakpoints. For this library, we are
interested in the container width, where the visualization will be rendered into. As can be seen
from the chart, the maximum width the content will ever reach is 1200px. On very wide screens, the
width will not exceed a width of 877px.

```image|plain
{
    "src": "/guides/breakpoints/progression.png"
}
```

# Aspect Ratios

We decided on the following aspect ratios based on the container sizes available. We tried to strike
a good balance between the overall area the chart uses, the chart's height, and the phyiscal size of
the chart.

```image|plain
{
    "src": "/guides/breakpoints/aspect-ratios.png"
}
```
