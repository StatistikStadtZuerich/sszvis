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
import type { BaseType, ValueFn } from "d3";
import { type ComponentBuilder } from "../../d3-component.js";
import type { GeoPoint, PointProjection } from "../mapUtils.js";
/**
 * A constant or an accessor. Neither src nor opacity is wrapped in fn.functor; an accessor is
 * evaluated against the join's placeholder datum, 0.
 */
type ImageValue<R extends string | number> = R | ValueFn<BaseType, number, R>;
export interface MapRendererImageComponent extends ComponentBuilder<MapRendererImageComponent> {
    projection(): PointProjection | undefined;
    projection(value: PointProjection): MapRendererImageComponent;
    src(): ImageValue<string> | undefined;
    src(value: ImageValue<string>): MapRendererImageComponent;
    geoBounds(): [GeoPoint, GeoPoint] | undefined;
    geoBounds(value: [GeoPoint, GeoPoint]): MapRendererImageComponent;
    opacity(): ImageValue<number>;
    opacity(value: ImageValue<number>): MapRendererImageComponent;
    alt(): ImageValue<string>;
    alt(value: ImageValue<string>): MapRendererImageComponent;
}
export default function mapRendererImage(): MapRendererImageComponent;
export {};
//# sourceMappingURL=image.d.ts.map