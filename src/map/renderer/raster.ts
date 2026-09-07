/**
 * raster renderer component
 *
 * @module  sszvis/map/renderer/raster
 *
 * @template T The type of the data values bound to the raster cells
 *
 * Used for rendering a raster layer within a map (can also be used in other contexts, but the map usage
 * is the most straightforward). Requires a width and a height for the raster layer, a function which
 * returns raster positions, and one which returns fill colors.
 *
 * Unlike the other map renderers this one draws into a canvas inside an HTML layer, and it takes its
 * data from the layer's datum rather than from a property.
 *
 * @property {Boolean} debug         Whether to activate debug mode, which shows a red square over the whole
 *                                   canvas, for testing alignment with other map layers. Default false.
 * @property {Number} width          The width of the canvas, in CSS pixels. Required: a missing, non-finite
 *                                   or negative width throws. A fractional value is rounded up to whole
 *                                   pixels; see the notes below.
 * @property {Number} height         The height of the canvas. Required and validated like the width.
 * @property {Function} position     A function which takes a datum and returns a position for the corresponding
 *                                   raster square, returned as [x, y] pairs. Called with the datum only - no
 *                                   index, no array - unlike a d3 accessor, though the render callback itself
 *                                   does receive d3's (data, index, group). Required: a missing position
 *                                   throws. A null result throws and a non-finite one is silently dropped;
 *                                   see the notes below.
 * @property {Number} cellSide       The length (in pixels) of one side of each raster cell. Default 2. A
 *                                   fractional side antialiases; see the notes below.
 *                                   sszvis.pixelsFromGeoDistance is the intended source for this value, and it
 *                                   returns a float.
 * @property {String, Function} fill The fill function. Takes a datum and should return a fill color for the datum's pixel.
 *                                   Wrapped in fn.functor, so a constant colour is accepted too. Required: a
 *                                   missing fill throws. A value the canvas cannot parse leaves the cell
 *                                   unpainted; see the notes below.
 *                                   Typed as a colour string: fillStyle also takes a CanvasGradient or
 *                                   CanvasPattern at runtime, which this contract deliberately excludes.
 * @property {String} key          Identifies this raster within its layer. Default "raster". Two rasters in
 *                                   one layer need distinct keys to coexist; two sharing a key share one
 *                                   canvas, and since each render clears it, the last one wins.
 * @property {String} alt            An accessible description of what the raster shows. Default "", which
 *                                   marks the canvas decorative so assistive technology skips it
 *                                   deliberately. A non-empty value is written as an aria-label with
 *                                   role="img", and as the canvas's fallback content. Named to match the
 *                                   image renderer's alt, so the two non-SVG layers are labelled the same
 *                                   way, though on a canvas it is not an HTML attribute.
 * @property {Number} opacity        The opacity of the canvas. Default 1; use a lower value to reveal the
 *                                   layers underneath. It is a style on the canvas, so it
 *                                   fades the whole layer rather than the individual cells, and 0 still draws
 *                                   every one of them.
 *
 * Note: the bitmap is sized in device pixels - the width and height attributes are the layer
 * dimensions multiplied by devicePixelRatio, with the CSS size pinned to the layer dimensions and
 * the drawing context scaled to match - so the cells are as sharp as the SVG layers over them on a
 * high-DPI display. Positions, cell sides and the debug rectangle are all in CSS pixels, as before;
 * the scale factor costs one fill of ratio-squared as many device pixels per cell.
 *
 * Note: a fractional width or height is rounded up, since the bitmap is a whole number of pixels.
 * Every docs caller passes bounds.innerWidth, which is routinely fractional, so a raster layer
 * would otherwise be up to a pixel narrower and shorter than the SVG layers it has to line up with,
 * leaving a hairline gap at the right and bottom edges that shifts as the chart is resized. Rounding
 * up covers those edges instead, at the cost of up to a pixel of overhang.
 *
 * Note: the visible clearing between renders comes from writing the width attribute, which resets
 * the bitmap per spec; the clearRect call is belt and braces. Both dimensions are validated before
 * anything is drawn, so a missing one is reported instead of leaving the canvas at its intrinsic
 * 300x150 with a NaN clearRect that never cleared and each render's cells piling up. The same
 * canvas element is reused across renders, with the dimensions and opacity reapplied each time, and
 * a change of dimensions resizes that canvas rather than replacing it - which is what makes the
 * bitmap reset double as the clear.
 *
 * Note: fillStyle is stateful and the canvas API ignores a value it cannot parse, so a cell whose
 * fill does not parse would otherwise be drawn in whatever colour was last set - the previous
 * cell's colour, or the debug red. Each fill is therefore probed before it is used and a cell whose
 * fill does not parse is left unpainted, so a broken colour scale shows as holes in the raster
 * rather than as plausible data. Debug mode stays purely additive as a result.
 *
 * Note: no docs example can turn debug on - rastermap-gradient guards its debug(DEBUG) call with
 * `if (DEBUG)` on a hardcoded false, and the other three rastermaps never touch the property - so
 * the feature is exercised only by the tests.
 *
 * Note: the data are iterated without a guard, and createHtmlLayer binds 0 as its own datum - so a
 * layer the caller forgot to hand data to throws "data is not iterable" rather than rendering
 * nothing, and the canvas has already been created by the time it throws. The four required
 * properties are checked before that: width, height, position and fill are all validated before the
 * canvas is created, so a missing one is named whether or not there are data to draw.
 *
 * Note: a non-finite position is dropped by the canvas API rather than reported, so a datum the
 * projection could not place leaves a hole in the raster with no indication; a null position throws
 * a TypeError instead, from the same point in the loop the JavaScript's index threw from. A zero cellSide draws nothing at all, and a negative one is
 * indistinguishable from its positive counterpart, since the half-side offset and the width negate
 * each other. A fractional cellSide puts the cell edges on half pixels, so they antialias rather
 * than tiling exactly - and pixelsFromGeoDistance returns a float.
 *
 * Note: the component writes no position, so the canvas is only positioned because sszvis.css sets
 * position: absolute on the class - the same dependency as the image renderer, along with
 * display: block, pointer-events: none and user-select: none. The opacity, by contrast, is written
 * as an inline style, as are the CSS width and height that pin the scaled bitmap to the layer size;
 * nothing in sszvis.css sets any of them, so nothing is overridden - but a consumer
 * cannot restyle it from their own stylesheet either. The positions themselves are written unshifted, and
 * createHtmlLayer offsets the layer by the bounds padding, so cell positions are layer-relative and
 * the padding is applied exactly once.
 *
 * Note: the canvas is scoped to the layer's own children and identified by the key prop, so two
 * rasters can coexist in one layer as long as their keys differ - the same convention as the mesh
 * renderer's key. Two rasters sharing a key share one canvas, which is what makes a re-render reuse
 * its element, so the constraint is one raster per key per layer rather than one per layer. The
 * canvas is appended to the layer, so it stacks over whatever the layer already holds, which is
 * what rastermap-bins relies on.
 *
 * Note: nothing ties this component to an HTML layer. Called on an SVG selection the join creates an
 * SVG-namespaced canvas, which has no getContext, so it throws - where the image renderer silently
 * appends an unrenderable img instead.
 *
 * Note: the canvas is labelled through the alt property. In the four docs rasters the raster IS the
 * data - the SVG layers over it are borders and annotations - so a description belongs on it; where
 * a raster really is decoration, the empty default hides it from assistive technology on purpose
 * rather than by accident. A canvas has no per-element markup a consumer could annotate instead,
 * which is why the property has to exist here.
 *
 * Note: no transition is scheduled - a canvas cannot be transitioned by d3 anyway - so the raster
 * repaints in full on every render, one fillStyle write and one fillRect per datum. Unlike the base
 * and geojson renderers this component keeps no caches, emits no missing-value pattern, and adds no
 * tooltip anchors or event targets, so none of that family of quirks applies here.
 * See test/map/renderer/raster.test.ts.
 *
 * @return {sszvis.component}
 */

import type { BaseType } from "d3";
import { select } from "d3";
import { type ComponentBuilder, component } from "../../d3-component.js";
import * as fn from "../../fn.js";

/**
 * Marks the canvas a raster owns, so a second raster in the same layer draws its own rather than
 * clearing and redrawing this one. Read back through d3's filter rather than an attribute selector,
 * which would have to escape an arbitrary caller-supplied key. The same convention as the mesh
 * renderer's data-mesh-key.
 */
const KEY_ATTRIBUTE = "data-raster-key";

/** The default key, so a caller who never asks for a second raster need not name the first. */
const DEFAULT_KEY = "raster";

/** A pixel position, as the position accessor returns one. */
type Position = [number, number];

/**
 * A constant or an accessor; both are accepted, since fill is wrapped by fn.functor. The result is
 * assigned to fillStyle, which ignores a value it cannot parse.
 */
type RasterFill<T> = string | ((datum: T) => string);

/** How a functor-wrapped prop reads back once it is stored: always a function. */
type StoredRasterFill<T> = (datum: T) => string;

/**
 * The props as this component's contract describes them, which is deliberately narrower than what
 * the runtime tolerates: width, height, position and fill are required here, and all four are
 * validated before the canvas is created. The getters still report all four as possibly undefined,
 * since a component that has not been configured yet has not got them. Following the same split as src/map/renderer/mesh.ts.
 */
type RasterProps<T> = {
  debug: boolean;
  width: number;
  height: number;
  position: (datum: T) => Position | null;
  cellSide: number;
  fill: StoredRasterFill<T>;
  key: string;
  alt: string;
  opacity: number;
};

export interface MapRendererRasterComponent<T = unknown>
  extends ComponentBuilder<MapRendererRasterComponent<T>> {
  debug(): boolean;
  debug(value: boolean): MapRendererRasterComponent<T>;
  width(): number | undefined;
  width(value: number): MapRendererRasterComponent<T>;
  height(): number | undefined;
  height(value: number): MapRendererRasterComponent<T>;
  position(): ((datum: T) => Position | null) | undefined;
  position<U = T>(value: (datum: U) => Position | null): MapRendererRasterComponent<T>;
  cellSide(): number;
  cellSide(value: number): MapRendererRasterComponent<T>;
  fill(): StoredRasterFill<T> | undefined;
  fill<U = T>(value: RasterFill<U>): MapRendererRasterComponent<T>;
  key(): string;
  key(value: string): MapRendererRasterComponent<T>;
  alt(): string;
  alt(value: string): MapRendererRasterComponent<T>;
  opacity(): number;
  opacity(value: number): MapRendererRasterComponent<T>;
}

/**
 * Reads one axis of a position. The JavaScript indexed the accessor's result directly, so a null
 * result threw from that index; this reproduces the same failure with the message V8 produced for
 * it. Note the strict null check: an accessor returning undefined falls through to the index on the
 * next line, which throws the genuine "Cannot read properties of undefined" TypeError, again as the
 * JavaScript did. A non-finite coordinate passes through untouched, since fillRect is what drops
 * it.
 */
function coordinate(position: Position | null, axis: 0 | 1): number {
  if (position === null) {
    throw new TypeError(`Cannot read properties of null (reading '${axis}')`);
  }
  return position[axis];
}

/**
 * Reads the drawing context, throwing as the JavaScript did when there is none. That happens when
 * the join created an SVG-namespaced canvas, which has no getContext at all - the message is the
 * one that call produced. The check is for the method rather than `instanceof HTMLCanvasElement`,
 * which would also reject a canvas belonging to another realm - an iframe's document - where the
 * JavaScript drew quite happily.
 */
function context2d(node: BaseType | null): CanvasRenderingContext2D {
  if (node === null || !("getContext" in node) || typeof node.getContext !== "function") {
    throw new TypeError("canvas.node(...).getContext is not a function");
  }
  const ctx = node.getContext("2d");
  if (ctx === null) {
    // A 2d context is only refused when one of another kind was already taken on this element,
    // which cannot happen here; the JavaScript would have thrown on the next line instead.
    throw new TypeError("Cannot read properties of null (reading 'clearRect')");
  }
  return ctx;
}

/**
 * Whether the canvas can parse a fill value, established by assignment rather than by a colour
 * parser of our own: fillStyle keeps its previous value when the assignment fails, so probing from
 * two different starting colours tells a parsed value (which normalises to the same colour from
 * both) from an unparseable one (which leaves each probe in place). A non-string reaching here at
 * runtime fails the same way, which is the point.
 */
function fillParses(ctx: CanvasRenderingContext2D, value: string): boolean {
  const before = ctx.fillStyle;
  ctx.fillStyle = "#000000";
  ctx.fillStyle = value;
  const fromBlack = ctx.fillStyle;
  ctx.fillStyle = "#ffffff";
  ctx.fillStyle = value;
  const fromWhite = ctx.fillStyle;
  ctx.fillStyle = before;
  return fromBlack === fromWhite;
}

/**
 * The device pixels per CSS pixel to render at. Read from the global rather than from the canvas's
 * own realm: an iframe reports its parent's ratio anyway, and a missing or nonsensical value (a
 * non-browser host, say) falls back to drawing one device pixel per CSS pixel.
 */
function pixelRatio(): number {
  const ratio = globalThis.devicePixelRatio;
  return typeof ratio === "number" && ratio > 0 && Number.isFinite(ratio) ? ratio : 1;
}

/**
 * Reads a required dimension, reporting a missing or nonsensical one rather than letting the canvas
 * fall back to its intrinsic 300x150 size - which also stopped it clearing between renders, since
 * clearRect was then called with NaN.
 */
function dimension(value: number | undefined, name: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(
      `[mapRendererRaster] the ${name} property is required, and must be a finite, non-negative number`
    );
  }
  return value;
}

/**
 * Reads a required accessor, reporting a missing one the way dimension() reports a missing
 * dimension. Without this the property is read straight out of props inside the per-datum loop, so
 * a missing one raised a bare TypeError naming nothing - and only when the data were non-empty, so
 * an empty dataset (the state every chart is in before its data load) hid the misconfiguration
 * entirely. A constant fill is already a function by the time it is read, since the prop is wrapped
 * in fn.functor on the way in - which is why `accepts` describes the public contract rather than
 * the stored value: telling a consumer who omitted `fill` that it "must be a function" would deny
 * the colour string the component in fact accepts.
 */
function accessor<F>(value: F | undefined, name: string, accepts: string): F {
  if (typeof value !== "function") {
    throw new Error(`[mapRendererRaster] the ${name} property is required, and must be ${accepts}`);
  }
  return value;
}

export default function mapRendererRaster<T = unknown>(): MapRendererRasterComponent<T> {
  return component<MapRendererRasterComponent<T>>()
    .prop("debug")
    .debug(false)
    .prop("width")
    .prop("height")
    .prop("position")
    .prop("cellSide")
    .cellSide(2)
    .prop("fill", fn.functor)
    .prop("key")
    .key(DEFAULT_KEY)
    .prop("alt")
    .alt("")
    .prop("opacity")
    .opacity(1)
    .render(function (this: Element, data: T[]) {
      const selection = select(this);
      const props = selection.props<RasterProps<T>>();
      // The bitmap is a whole number of pixels, and every caller passes a bounds dimension, which
      // is routinely fractional - so round up, to cover the layers the raster has to line up with
      // rather than falling a hairline short of them at the right and bottom edges.
      const width = Math.ceil(dimension(props.width, "width"));
      const height = Math.ceil(dimension(props.height, "height"));
      // Validated here rather than where they are called, so a misconfigured raster is reported
      // before anything is created and whether or not there are data to draw.
      const position = accessor(props.position, "position", "a function");
      const fill = accessor(props.fill, "fill", "a color string or an accessor returning one");

      const canvas = selection
        .selectAll<Element, number>(":scope > canvas.sszvis-map__rasterimage")
        .filter(function () {
          return this.getAttribute(KEY_ATTRIBUTE) === props.key;
        })
        .data([0])
        .join("canvas")
        .classed("sszvis-map__rasterimage", true)
        .attr(KEY_ATTRIBUTE, props.key);

      // The bitmap is in device pixels while the element is laid out in CSS pixels, so the cells
      // are as sharp as the SVG layers over them on a high-DPI display.
      const ratio = pixelRatio();
      canvas
        .attr("width", Math.round(width * ratio))
        .attr("height", Math.round(height * ratio))
        .style("width", `${width}px`)
        .style("height", `${height}px`)
        .style("opacity", props.opacity);

      // An empty alt marks the layer decorative, so it is skipped deliberately rather than by
      // accident; a description is exposed both to assistive technology and as fallback content.
      const described = props.alt !== "";
      canvas
        .attr("role", described ? "img" : null)
        .attr("aria-label", described ? props.alt : null)
        .attr("aria-hidden", described ? null : "true")
        .text(props.alt);

      const ctx = context2d(canvas.node());

      // Everything below draws in CSS pixels. setTransform rather than scale, because the
      // transform is absolute: scale would compound if the bitmap had not just been reset.
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.clearRect(0, 0, width, height);

      if (props.debug) {
        // Displays a rectangle that fills the canvas.
        // Useful for checking alignment with other render layers.
        ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
        ctx.fillRect(0, 0, width, height);
      }

      const halfSide = props.cellSide / 2;
      // A colour scale usually yields only a handful of distinct values, so parsing each one once
      // per render keeps the probe off the hot path.
      const parsed = new Map<string, boolean>();
      for (const datum of data) {
        const at = position(datum);
        const x = coordinate(at, 0) - halfSide;
        const y = coordinate(at, 1) - halfSide;
        const colour = fill(datum);
        let parses = parsed.get(colour);
        if (parses === undefined) {
          parses = fillParses(ctx, colour);
          parsed.set(colour, parses);
        }
        if (!parses) continue;
        ctx.fillStyle = colour;
        ctx.fillRect(x, y, props.cellSide, props.cellSide);
      }
    });
}
