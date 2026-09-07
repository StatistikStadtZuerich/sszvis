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
 *                                      It is called once per corner, with that corner's coordinates. A result it cannot
 *                                      place is not handled; see the notes below.
 * @property {String, Function} src      The source of the image you want to use. This should be either a URL for an image hosted on the same
 *                                      server that hosts the page, or a base64-encoded dataURL. For example, the zurich topolayer map module.
 *                                      A missing src is not reported: d3 removes an attribute set to undefined, so the
 *                                      image renders fully positioned with no src at all.
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
 *                                      The two corners are subtracted in the order given, so passing the south-east
 *                                      corner first yields negative widths and heights, which the CSS parser drops -
 *                                      leaving the image positioned but unsized, with no error.
 * @property {Number, Function} opacity  The opacity of the resulting image layer. This will be applied to the entire image, and is sometimes useful when layering.
 *                                      Default 1. An invalid value is dropped by the CSS parser rather than reported,
 *                                      leaving the image fully opaque; 0 renders nothing at all, which is
 *                                      indistinguishable from a src that failed to load.
 *
 * Note: this component renders an HTML img element, so it belongs in a createHtmlLayer. Nothing
 * enforces that: called on an SVG selection it appends an SVG-namespaced img, which no browser
 * renders, without complaining.
 *
 * Note: the img carries no alt attribute and no role, and the component offers no property for
 * one, so a topographic layer is announced by screen readers as an unlabelled image. All six docs
 * examples ship this.
 *
 * Note: the component writes left and top but never position, so both are inert unless sszvis.css
 * is loaded - it is the stylesheet that sets position: absolute, along with display: block and
 * pointer-events: none. Without it the image sits in the document flow at the computed pixel size,
 * unoffset and clickable.
 *
 * Note: the projected coordinates are written unshifted, and createHtmlLayer positions the layer
 * itself by the bounds padding - so the image's offset is relative to the layer and the padding is
 * applied exactly once. That is what keeps the image aligned with the svg layer.
 *
 * Note: the width is the rounded difference of the unrounded corners, while left is the rounded
 * north-west corner, so left + width does not necessarily equal the rounded south-east corner. The
 * image's right and bottom edges can sit a pixel off the map layers they are meant to align with.
 *
 * Note: neither geoBounds nor projection is validated. A missing geoBounds throws a bare TypeError
 * from indexing undefined, and a missing projection throws from calling it - both before any
 * attribute is written, though the img element has already been appended by then, so a throw
 * leaves a classed, empty img in the layer. A missing src is not reported at all: d3 removes an
 * attribute set to undefined, so the image renders fully positioned and sized with no src.
 *
 * Note: a projection that answers null for a point it cannot place throws a bare TypeError rather
 * than being reported, and it does so late: the src has been written and both corners have already
 * been projected by the time the coordinates are read, so the failure leaves an img with its src
 * but no position. The JavaScript threw from indexing that null; the port re-throws a TypeError
 * carrying the same message from the same point in the chain. A projection that answers a
 * non-finite coordinate instead produces the string "Infinitypx", which the CSS parser drops,
 * leaving the image unpositioned. Neither is reachable with a d3 projection called this way:
 * clipAngle and clipExtent apply to streams, not to a direct call.
 *
 * Note: a Mercator pole, which is reachable, fails a third way again - log(tan(pi/2)) is merely a
 * very large float, so a geoBounds latitude of 90 positions and sizes the image tens of thousands
 * of pixels off rather than failing.
 *
 * Note: neither src nor opacity is wrapped in fn.functor, unlike the colour properties of the base,
 * geojson and highlight renderers - but both are handed straight to d3, which evaluates a function against the bound
 * datum. So an accessor happens to work, called with the join's placeholder 0.
 *
 * Note: the join binds [0] rather than the src, so one image per container is the documented
 * limit - and the selector is unscoped, so a second image renderer in the same layer replaces the
 * first one's src and position instead of adding its own. The same defect as the mesh, highlight
 * and lake overlay renderers.
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

import type { BaseType, ValueFn } from "d3";
import { select } from "d3";
import { type Component, component } from "../../d3-component.js";
import type { GeoPoint, PointProjection } from "../mapUtils.js";

/**
 * A constant or an accessor. Neither src nor opacity is wrapped in fn.functor, so a function is
 * handed straight to d3 and evaluated against the join's placeholder datum, 0.
 */
type ImageValue<R extends string | number> = R | ValueFn<BaseType, number, R>;

/**
 * The props as this component's contract describes them, which is deliberately narrower than what
 * the runtime tolerates: projection, src and geoBounds are required here even though none is
 * validated. Omitting the projection or the bounds throws a bare TypeError, and omitting the src
 * renders an image with no src at all; the characterization tests pin both, which is why the
 * getters report all three as possibly undefined. Following the same split as
 * src/map/renderer/mesh.ts.
 */
type ImageProps = {
  projection: PointProjection;
  src: ImageValue<string>;
  geoBounds: [GeoPoint, GeoPoint];
  opacity: ImageValue<number>;
};

export interface MapRendererImageComponent extends Component {
  projection(): PointProjection | undefined;
  projection(value: PointProjection): MapRendererImageComponent;
  src(): ImageValue<string> | undefined;
  src(value: ImageValue<string>): MapRendererImageComponent;
  geoBounds(): [GeoPoint, GeoPoint] | undefined;
  geoBounds(value: [GeoPoint, GeoPoint]): MapRendererImageComponent;
  opacity(): ImageValue<number>;
  opacity(value: ImageValue<number>): MapRendererImageComponent;
}

/**
 * Reads one axis of a projected corner. The JavaScript indexed the projection's result directly, so
 * a null result threw from that index; this reproduces the same failure at the same point in the
 * chain, with the message V8 produced for it. Note the strict null check: a projection returning
 * undefined falls through to the index on the next line, which throws the genuine "Cannot read
 * properties of undefined" TypeError, again as the JavaScript did.
 */
function coordinate(projected: [number, number] | null, axis: 0 | 1): number {
  if (projected === null) {
    throw new TypeError(`Cannot read properties of null (reading '${axis}')`);
  }
  return projected[axis];
}

/**
 * Normalises a value prop into the single accessor shape d3's overloads can resolve. An accessor is
 * passed through untouched, so it keeps receiving d3's arguments and node context; a constant
 * becomes a function returning it, which d3 applies identically - both paths end in the same
 * assignment. The same idiom as src/map/renderer/mesh.ts.
 */
function toValue<R extends string | number>(value: ImageValue<R>): ValueFn<BaseType, number, R> {
  return typeof value === "function" ? value : () => value;
}

export default function (): MapRendererImageComponent {
  return component()
    .prop("projection")
    .prop("src")
    .prop("geoBounds")
    .prop("opacity")
    .opacity(1)
    .render(function (this: Element) {
      const selection = select(this);
      const props = selection.props<ImageProps>();

      const image = selection
        .selectAll(".sszvis-map__image")
        .data([0]) // At the moment, 1 image per container
        .join("img")
        .classed("sszvis-map__image", true);

      // Both corners are projected before anything is written, and the coordinates are read only
      // as each style is applied - so a projection that fails does so after the src has been
      // written and after both corners have been asked for, exactly as the JavaScript did.
      const topLeft = props.projection(props.geoBounds[0]);
      const bottomRight = props.projection(props.geoBounds[1]);

      image
        .attr("src", toValue(props.src))
        .style("left", Math.round(coordinate(topLeft, 0)) + "px")
        .style("top", Math.round(coordinate(topLeft, 1)) + "px")
        .style("width", Math.round(coordinate(bottomRight, 0) - coordinate(topLeft, 0)) + "px")
        .style("height", Math.round(coordinate(bottomRight, 1) - coordinate(topLeft, 1)) + "px")
        .style("opacity", toValue(props.opacity));
    });
}
