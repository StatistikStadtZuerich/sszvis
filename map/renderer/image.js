import { select } from 'd3';
import { component } from '../../d3-component.js';

/**
 * image render component
 *
 * @module  sszvis/map/renderer/image
 *
 * Used for rendering an image layer, usually as a complement to a map. This is used in examples
 * for the topographic layer. It could also be used in other contexts, but the map usage is
 * the most straightforward.
 *
 * @property {Function} projection      The map projection function used to position the image in pixels. Uses the upper left
 *                                      and lower right corners of the image as geographical place markers to align with other map layers.
 * @property {String} src               The source of the image you want to use. This should be ither a URL for an image hosted on the same
 *                                      server that hosts the page, or a base64-encoded dataURL. For example, the zurich topolayer map module.
 * @property {Array} geoBounds          This should be a 2D array containing the upper-left (north-west) and lower-right (south-east)
 *                                      coordinates of the corresponding corners of the image. The structure expected is:
 *
 *                                      [[nw-longitude, nw-latitude], [se-longitude, se-latitude]]
 *
 *                                      This is consistent with the way D3 handles similar geographic data. These coordinates are used to represent
 *                                      the edge of the image being used, and to align the image with other map layers (using the projection function).
 *                                      Note: it is possible that even with precise corner coordinates, some mismatch may still occur. This
 *                                      will happen if the image itself is generated using a different type of map projection than the one used by the
 *                                      projection function. SSZVIS uses a Mercator projection by default, but others from d3.geo can be used if desired.
 * @property {Number} opacity           The opacity of the resulting image layer. This will be applied to the entire image, and is sometimes useful when layering.
 *
 * @return {sszvis.component}
 */
function image () {
  return component().prop("projection").prop("src").prop("geoBounds").prop("opacity").opacity(1).render(function () {
    const selection = select(this);
    const props = selection.props();
    const image = selection.selectAll(".sszvis-map__image").data([0]) // At the moment, 1 image per container
    .join("img").classed("sszvis-map__image", true);
    const topLeft = props.projection(props.geoBounds[0]);
    const bottomRight = props.projection(props.geoBounds[1]);
    image.attr("src", props.src).style("left", Math.round(topLeft[0]) + "px").style("top", Math.round(topLeft[1]) + "px").style("width", Math.round(bottomRight[0] - topLeft[0]) + "px").style("height", Math.round(bottomRight[1] - topLeft[1]) + "px").style("opacity", props.opacity);
  });
}

export { image as default };
//# sourceMappingURL=image.js.map
