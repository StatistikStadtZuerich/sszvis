import { select } from 'd3';
import { component } from '../../d3-component.js';
import { valueFn } from '../../fn.js';

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
 *                                      It is called once per corner, with that corner's coordinates. A corner it answers
 *                                      null or undefined for is reported, naming the corner.
 * @property {String, Function} src      The source of the image you want to use. This should be either a URL for an image hosted on the same
 *                                      server that hosts the page, or a base64-encoded dataURL. For example, the zurich topolayer map module.
 *                                      Required: a missing src is reported rather than rendering an image with none.
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
 *                                      Required, and the order matters: corners the wrong way round project to a
 *                                      negative width or height, which is reported rather than silently dropped.
 * @property {Number, Function} opacity  The opacity of the resulting image layer. This will be applied to the entire image, and is sometimes useful when layering.
 *                                      Default 1. An invalid value is dropped by the CSS parser rather than reported,
 *                                      leaving the image fully opaque; 0 renders nothing at all, which is
 *                                      indistinguishable from a src that failed to load.
 * @property {String, Function} alt      The alternative text describing the image. Defaults to the
 *                                      empty string, which marks the layer decorative so that
 *                                      screen readers skip it - the right default for a
 *                                      topographic or raster backdrop whose data lives in the svg
 *                                      layers above. Pass a description when the image itself
 *                                      carries information.
 *
 * Note: this component renders an HTML img element, so it belongs in a createHtmlLayer. Nothing
 * enforces that: called on an SVG selection it appends an SVG-namespaced img, which no browser
 * renders, without complaining.
 *
 * Note: the component writes position: absolute, display: block and pointer-events: none inline, so
 * the offsets it computes are never inert and the image never swallows the hover and click events of
 * the map layers beneath it. sszvis.css sets the same three declarations for the class, plus
 * user-select: none, which is left to the stylesheet: it only affects text selection over a
 * decorative image, not whether the renderer works. So the component no longer needs sszvis.css to
 * position itself. Being inline styles they beat any author rule short of !important, so a consumer
 * who wants the image in the document flow or clickable can no longer get there through their own
 * stylesheet.
 *
 * Note: the projected coordinates are written unshifted, and createHtmlLayer positions the layer
 * itself by the bounds padding - so the image's offset is relative to the layer and the padding is
 * applied exactly once. That is what keeps the image aligned with the svg layer.
 *
 * Note: both corners are rounded before the size is taken as their difference, so left + width is
 * the rounded south-east corner and the image's edges land on the same pixels as the map layers it
 * is aligned with.
 *
 * Note: projection, src and geoBounds are all required and are validated before any element is
 * created, so each way of getting them wrong is reported with a message naming the property, and a
 * misconfigured renderer leaves nothing half-built in the layer. Inverted geoBounds - the likely
 * real-world mistake - are caught by comparing the projected corners before they are rounded, so
 * an inversion smaller than one pixel is reported rather than collapsing to a zero-size image.
 *
 * Note: a projection that answers a non-finite coordinate is still not reported; it produces the
 * string "Infinitypx", which the CSS parser drops, leaving the image unpositioned. Not reachable
 * with a d3 projection called this way: clipAngle and clipExtent apply to streams, not to a direct
 * call.
 *
 * Note: a Mercator pole, which is reachable, fails a third way again - log(tan(pi/2)) is merely a
 * very large float, so a geoBounds latitude of 90 positions and sizes the image tens of thousands
 * of pixels off rather than failing - the extent stays positive, so the geoBounds check does not
 * catch it either.
 *
 * Note: neither src nor opacity is wrapped in fn.functor, unlike the colour properties of the base,
 * geojson and highlight renderers - but an accessor works all the same, called with the join's
 * placeholder datum 0. opacity is handed to d3, which evaluates it; src is resolved by the
 * component itself, because the resolved value identifies the element.
 *
 * Note: the src identifies the image within its layer, so two renderers with different sources
 * each own an element and stack, while re-rendering the same source reuses the element it drew
 * before. The element carries the resolved source in a data-image-key attribute for that purpose:
 * the same key convention as the mesh, raster and highlight renderers, except that this renderer
 * derives its key from the src rather than taking one as a property.
 *
 * Note: no transition is scheduled, so the image jumps to its new position on a resize rather than
 * animating. Unlike the base and geojson renderers this component keeps no caches, emits no
 * missing-value pattern, and adds no tooltip anchors or event targets, so none of that family of
 * quirks applies here. The same img element is reused across renders, with every attribute and
 * style reapplied each time.
 * See test/map/renderer/image.test.ts.
 *
 * @return {sszvis.component}
 */
/**
 * Marks the image a renderer owns, keyed by its resolved src, so the join can find its own
 * element. Read back through d3's filter rather than an attribute selector, which would have to
 * escape an arbitrary src - the same idiom as the mesh renderer's data-mesh-key, whose key is a
 * property rather than being derived.
 */
const KEY_ATTRIBUTE = "data-image-key";
/**
 * Resolves a property that may be a constant or an accessor. d3 would evaluate an accessor against
 * the bound datum; this calls it the same way, with the join's placeholder datum 0, so that the
 * resolved value is available before the join needs it.
 */
function resolve(value) {
  return typeof value === "function" ? value.call(null, 0, 0, []) : value;
}
/** Reports a required property the caller left unset, naming it. */
function required(value, name) {
  if (value === undefined) {
    throw new Error("[mapRendererImage] the ".concat(name, " property is required"));
  }
  return value;
}
/**
 * Projects one corner of the image, reporting a projection that cannot place it rather than
 * throwing a bare TypeError from indexing null.
 */
function corner(projection, geoBounds, which) {
  const projected = projection(geoBounds[which]);
  if (projected == null) {
    const name = which === 0 ? "north-west" : "south-east";
    throw new Error("[mapRendererImage] the projection could not place the ".concat(name, " corner of geoBounds"));
  }
  return projected;
}
function mapRendererImage() {
  return component().prop("projection").prop("src").prop("geoBounds").prop("opacity").prop("alt").opacity(1).alt("").render(function () {
    const selection = select(this);
    const props = selection.props();
    // Everything the render depends on is validated before any element is created, so a
    // misconfigured renderer leaves nothing half-built behind in the layer.
    const projection = required(props.projection, "projection");
    const src = required(props.src, "src");
    const geoBounds = required(props.geoBounds, "geoBounds");
    const topLeft = corner(projection, geoBounds, 0);
    const bottomRight = corner(projection, geoBounds, 1);
    // Corners the wrong way round are the mistake the docs examples guard against with an
    // "Expects longitude, latitude" comment. Tested on the unrounded projection, because two
    // corners inverted by less than a pixel round to the same coordinate: a rounded extent of
    // zero would render an invisible image rather than report the mistake.
    if (bottomRight[0] < topLeft[0] || bottomRight[1] < topLeft[1]) {
      throw new Error("[mapRendererImage] the geoBounds property expects the north-west corner first; the corners given project to a negative width or height");
    }
    // Rounded only after the check, so left + width stays the rounded south-east corner and the
    // edges land on the same pixels as the map layers this is aligned with. The CSS parser drops
    // a negative length, which is what the check above keeps out of here.
    const width = Math.round(bottomRight[0]) - Math.round(topLeft[0]);
    const height = Math.round(bottomRight[1]) - Math.round(topLeft[1]);
    // The src identifies the image within its layer, so two renderers with different sources get
    // an element each instead of the second rebinding the first, while re-rendering the same
    // source keeps reusing the element it drew before. Filtering rather than building a selector
    // avoids having to escape a src into an attribute selector.
    const srcValue = resolve(src);
    const image = selection.selectAll(".sszvis-map__image").filter(function () {
      return this.getAttribute(KEY_ATTRIBUTE) === srcValue;
    }).data([0]).join("img").classed("sszvis-map__image", true).attr(KEY_ATTRIBUTE, srcValue);
    image.attr("src", srcValue).attr("alt", valueFn(props.alt))
    // The positioning and event behaviour the component depends on, written inline so it does
    // not need sszvis.css: absolute makes the offsets below apply at all, block keeps an inline
    // image from picking up baseline leading, and none lets the map layers underneath be
    // hovered through it.
    .style("position", "absolute").style("display", "block").style("pointer-events", "none").style("left", "".concat(Math.round(topLeft[0]), "px")).style("top", "".concat(Math.round(topLeft[1]), "px"))
    // Each corner is rounded before the subtraction, so the right and bottom edges land on the
    // same pixels as the projected south-east corner rather than a pixel either side of it.
    .style("width", "".concat(width, "px")).style("height", "".concat(height, "px")).style("opacity", valueFn(props.opacity));
  });
}

export { mapRendererImage as default };
//# sourceMappingURL=image.js.map
