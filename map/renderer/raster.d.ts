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
import { type ComponentBuilder } from "../../d3-component.js";
/** A pixel position, as the position accessor returns one. */
type Position = [number, number];
/**
 * A constant or an accessor; both are accepted, since fill is wrapped by fn.functor. The result is
 * assigned to fillStyle, which ignores a value it cannot parse.
 */
type RasterFill<T> = string | ((datum: T) => string);
/** How a functor-wrapped prop reads back once it is stored: always a function. */
type StoredRasterFill<T> = (datum: T) => string;
export interface MapRendererRasterComponent<T = unknown> extends ComponentBuilder<MapRendererRasterComponent<T>> {
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
export default function mapRendererRaster<T = unknown>(): MapRendererRasterComponent<T>;
export {};
//# sourceMappingURL=raster.d.ts.map