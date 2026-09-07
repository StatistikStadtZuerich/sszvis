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
 * Note: the component writes position: absolute inline alongside left and top, so the offsets it
 * computes are never inert. sszvis.css adds display: block and pointer-events: none for the same
 * class; without the stylesheet the image is still positioned correctly but does take pointer
 * events, so the map layers beneath it cannot be hovered.
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
 * real-world mistake - are caught by the negative extent they project to.
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
import { select } from "d3";
import { type ComponentBuilder, component } from "../../d3-component.js";
import * as fn from "../../fn.js";
import type { GeoPoint, PointProjection } from "../mapUtils.js";

/**
 * A constant or an accessor. Neither src nor opacity is wrapped in fn.functor; an accessor is
 * evaluated against the join's placeholder datum, 0.
 */
type ImageValue<R extends string | number> = R | ValueFn<BaseType, number, R>;

/**
 * Marks the image a renderer owns, keyed by its resolved src, so the join can find its own
 * element. Read back through d3's filter rather than an attribute selector, which would have to
 * escape an arbitrary src - the same idiom as the mesh renderer's data-mesh-key, whose key is a
 * property rather than being derived.
 */
const KEY_ATTRIBUTE = "data-image-key";

/**
 * The props as they are read at runtime. projection, src and geoBounds are required, but the
 * builder cannot enforce that, so they are optional here and validated in render - which is what
 * lets the errors name the property at fault. Following the same split as src/map/renderer/mesh.ts.
 */
type ImageProps = {
  projection?: PointProjection;
  src?: ImageValue<string>;
  geoBounds?: [GeoPoint, GeoPoint];
  opacity: ImageValue<number>;
  alt: ImageValue<string>;
};

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

/**
 * Resolves a property that may be a constant or an accessor. d3 would evaluate an accessor against
 * the bound datum; this calls it the same way, with the join's placeholder datum 0, so that the
 * resolved value is available before the join needs it.
 */
function resolve<R extends string | number>(value: ImageValue<R>): R {
  return typeof value === "function" ? value.call(null, 0, 0, []) : value;
}

/** Reports a required property the caller left unset, naming it. */
function required<T>(value: T | undefined, name: string): T {
  if (value === undefined) {
    throw new Error(`[mapRendererImage] the ${name} property is required`);
  }
  return value;
}

/**
 * Projects one corner of the image, reporting a projection that cannot place it rather than
 * throwing a bare TypeError from indexing null.
 */
function corner(
  projection: PointProjection,
  geoBounds: [GeoPoint, GeoPoint],
  which: 0 | 1
): [number, number] {
  const projected = projection(geoBounds[which]);
  if (projected == null) {
    const name = which === 0 ? "north-west" : "south-east";
    throw new Error(
      `[mapRendererImage] the projection could not place the ${name} corner of geoBounds`
    );
  }
  return projected;
}

export default function (): MapRendererImageComponent {
  return component<MapRendererImageComponent>()
    .prop("projection")
    .prop("src")
    .prop("geoBounds")
    .prop("opacity")
    .prop("alt")
    .opacity(1)
    .alt("")
    .render(function (this: Element) {
      const selection = select(this);
      const props = selection.props<ImageProps>();

      // Everything the render depends on is validated before any element is created, so a
      // misconfigured renderer leaves nothing half-built behind in the layer.
      const projection = required(props.projection, "projection");
      const src = required(props.src, "src");
      const geoBounds = required(props.geoBounds, "geoBounds");

      const topLeft = corner(projection, geoBounds, 0);
      const bottomRight = corner(projection, geoBounds, 1);
      const width = Math.round(bottomRight[0]) - Math.round(topLeft[0]);
      const height = Math.round(bottomRight[1]) - Math.round(topLeft[1]);
      // A negative extent means the corners were passed the other way round - the mistake the
      // docs examples guard against with an "Expects longitude, latitude" comment. The CSS parser
      // drops a negative length, so without this the image would render positioned but unsized.
      if (width < 0 || height < 0) {
        throw new Error(
          "[mapRendererImage] the geoBounds property expects the north-west corner first; the corners given project to a negative width or height"
        );
      }

      // The src identifies the image within its layer, so two renderers with different sources get
      // an element each instead of the second rebinding the first, while re-rendering the same
      // source keeps reusing the element it drew before. Filtering rather than building a selector
      // avoids having to escape a src into an attribute selector.
      const srcValue = resolve(src);
      const image = selection
        .selectAll<Element, number>(".sszvis-map__image")
        .filter(function () {
          return this.getAttribute(KEY_ATTRIBUTE) === srcValue;
        })
        .data([0])
        .join("img")
        .classed("sszvis-map__image", true)
        .attr(KEY_ATTRIBUTE, srcValue);

      image
        .attr("src", srcValue)
        .attr("alt", fn.valueFn(props.alt))
        .style("position", "absolute")
        .style("left", `${Math.round(topLeft[0])}px`)
        .style("top", `${Math.round(topLeft[1])}px`)
        // Each corner is rounded before the subtraction, so the right and bottom edges land on the
        // same pixels as the projected south-east corner rather than a pixel either side of it.
        .style("width", `${width}px`)
        .style("height", `${height}px`)
        .style("opacity", fn.valueFn(props.opacity));
    });
}
