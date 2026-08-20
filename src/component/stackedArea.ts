/**
 * Stacked Area component
 *
 * Stacked area charts are useful for showing how component parts contribute to a total quantity
 *
 * The stackedArea component uses a [d3 stack layout](https://github.com/mbostock/d3/wiki/Stack-Layout) under the hood,
 * so some of its configuration properties are similar. This component requires an array of layer objects,
 * where each layer object represents a layer in the stack.
 *
 * @module sszvis/component/stackedArea
 *
 * @property {function} x                      Accessor function to read *x*-values from the data. Should return a value in screen pixels.
 *                                             Used to figure out which values share a vertical position in the stack.
 * @property {function} yAccessor              Accessor function to read raw *y*-values from the data. Should return a value which is in data-units,
 *                                             not screen pixels. The results of this function are used to compute the stack, and they are then
 *                                             passed into the yScale before display.
 * @property {function} yScale                 A y-scale for determining the vertical position of data quantities. Used to compute the
 *                                             bottom and top lines of the stack.
 * @property {string, function} fill           String or accessor function for the area fill. Passed a layer object.
 * @property {string, function} stroke         String or accessor function for the area stroke. Passed a layer object.
 * @property {function} key                    Specify a key function for use in the data join. The value returned by the key should be unique
 *                                             among stacks. This option is particularly important when creating a chart which transitions
 *                                             between stacked and separated views.
 * @property {function} valuesAccessor         Specify an accessor for the values of the layer objects. The default treats the layer object
 *                                             as an array of values. Use this if your layer objects should be treated as something other than
 *                                             arrays of values.
 *
 * @return {sszvis.component}
 */

import { area as d3Area, select, type ValueFn } from "d3";
import { type Component, component } from "../d3-component.js";
import { defaultTransition } from "../transition.js";

/**
 * The dimension accessors are handed to d3.area, which calls them with a single point, that
 * point's index within the layer, and the array of points the layer is drawn from.
 */
type PointAccessor<P, R> = (datum: P, index: number, points: P[]) => R;

/**
 * The style accessors are handed to the d3 selection, which calls them with the datum for a
 * whole layer and that layer's index within the outer array - not with a single point -
 * followed by d3's group of path nodes, with the node itself as `this`. That is exactly
 * d3's own ValueFn, so declaring fewer parameters stays fine while a callback that needs
 * the group can still be written.
 */
type LayerAccessor<L, R> = ValueFn<SVGPathElement, L, R>;

/**
 * The key is handed to selection.data, which calls it once for each half of the keyed join:
 * over the nodes already in the DOM, with the node as `this` and the node group as the third
 * argument, and over the incoming layers, with the parent as `this` and the array of layers
 * instead. Both `this` and the group therefore differ between the two halves, which is why
 * this is not a ValueFn.
 */
type KeyAccessor<L, R> = (
  this: Element,
  datum: L,
  index: number,
  group: ArrayLike<Element> | ArrayLike<L>
) => R;

/** Either a constant or an accessor; the three dimensions accept both. */
type AreaValue<P> = number | PointAccessor<P, number>;

/** Either a constant or an accessor, over one whole layer. */
type StyleValue<L, R> = R | LayerAccessor<L, R>;

type StackedAreaProps<P, L> = {
  x?: AreaValue<P>;
  y0?: AreaValue<P>;
  /**
   * Read with a null-ish check rather than a strict one, because d3 makes no distinction
   * between an unset upper bound and one set to null.
   */
  y1?: AreaValue<P> | null;
  fill?: StyleValue<L, string> | null;
  stroke?: StyleValue<L, string> | null;
  strokeWidth?: StyleValue<L, number> | null;
  defined?: boolean | PointAccessor<P, boolean>;
  key: KeyAccessor<L, string | number>;
  transition: boolean;
};

export interface StackedAreaComponent<P = unknown, L extends Iterable<P> = P[]> extends Component {
  x(): AreaValue<P> | undefined;
  x<Q = P>(value: AreaValue<Q>): StackedAreaComponent<P, L>;
  y0(): AreaValue<P> | undefined;
  y0<Q = P>(value: AreaValue<Q>): StackedAreaComponent<P, L>;
  y1(): AreaValue<P> | null | undefined;
  y1<Q = P>(value: AreaValue<Q> | null): StackedAreaComponent<P, L>;
  fill(): StyleValue<L, string> | null | undefined;
  fill<M = L>(value: StyleValue<M, string> | null): StackedAreaComponent<P, L>;
  stroke(): StyleValue<L, string> | null | undefined;
  stroke<M = L>(value: StyleValue<M, string> | null): StackedAreaComponent<P, L>;
  strokeWidth(): StyleValue<L, number> | null | undefined;
  strokeWidth<M = L>(value: StyleValue<M, number> | null): StackedAreaComponent<P, L>;
  defined(): boolean | PointAccessor<P, boolean> | undefined;
  defined<Q = P>(predicate: boolean | PointAccessor<Q, boolean>): StackedAreaComponent<P, L>;
  key(): KeyAccessor<L, string | number>;
  key<M = L>(accessor: KeyAccessor<M, string | number>): StackedAreaComponent<P, L>;
  transition(): boolean;
  transition(enabled: boolean): StackedAreaComponent<P, L>;
}

/**
 * d3 takes either a constant or a value function, but not a union of the two, so a
 * dimension is narrowed once before it reaches the generator. Only the constant branch
 * needs wrapping, and it is wrapped exactly as d3's own constant(+value) was: the value is
 * coerced once, here, rather than once per point inside the attr callback. An unset
 * dimension therefore still resolves to NaN, and a value that cannot be coerced still
 * throws before the data join rather than after it.
 */
const dimension = <P>(value: AreaValue<P> | undefined): PointAccessor<P, number> => {
  if (typeof value === "function") return value;
  // An unset dimension is spelled out because TypeScript will not coerce undefined, and
  // +undefined is NaN.
  const constant = value === undefined ? Number.NaN : +value;
  return () => constant;
};

/**
 * As above, for the style properties. An unset property becomes a function returning null,
 * which d3 removes the attribute for - the same thing it does when handed undefined
 * directly.
 */
const styleValue = <L, R extends string | number>(
  value: StyleValue<L, R> | null | undefined
): ValueFn<SVGPathElement, L, R | null> =>
  typeof value === "function" ? value : () => value ?? null;

export default function <P = unknown, L extends Iterable<P> = P[]>(): StackedAreaComponent<P, L> {
  return component()
    .prop("x")
    .prop("y0")
    .prop("y1")
    .prop("fill")
    .prop("stroke")
    .prop("strokeWidth")
    .prop("defined")
    .prop("key")
    .key((_datum: unknown, index: number) => index)
    .prop("transition")
    .transition(true)
    .render(function (this: Element, data: L[]) {
      const selection = select(this);
      const props = selection.props<StackedAreaProps<P, L>>();

      // Layouts

      // The default predicate accepts every point, whatever its value. It reproduces the
      // one it replaced, which read
      //   function () { return fn.compose(fn.not(isNaN), props.y0) && fn.compose(...y1); }
      // and so returned a function rather than calling either of them - and a function is
      // truthy, which is all d3 tests. The missing-value guard this was meant to be has
      // therefore never run. See test/component/stackedArea.test.ts.
      const defined: PointAccessor<P, boolean> =
        props.defined === undefined
          ? () => true
          : typeof props.defined === "function"
            ? props.defined
            : () => Boolean(props.defined);

      const areaGen = d3Area<P>().defined(defined).x(dimension(props.x)).y0(dimension(props.y0));

      // d3 reads a null-ish upper bound as "no upper bound" and falls back to y0, which is
      // why an unset y1 collapses every layer onto its own baseline. Its typings admit only
      // null, so undefined is spelled out here; d3 itself tests `_ == null` and treats the
      // two identically.
      if (props.y1 == null) {
        areaGen.y1(null);
      } else {
        areaGen.y1(dimension(props.y1));
      }

      // Rendering

      const pathData: ValueFn<SVGPathElement, L, string | null> = (datum) => areaGen(datum);
      const fill = styleValue(props.fill);
      // The white hairline separating two touching layers. Applied with a truthiness check
      // rather than an undefined one, so a null or empty stroke is replaced by it too.
      const stroke = styleValue(props.stroke || "#ffffff");
      const strokeWidth = styleValue(props.strokeWidth === undefined ? 1 : props.strokeWidth);

      const paths = selection
        .selectAll<SVGPathElement, L>("path.sszvis-path")
        .data(data, props.key)
        .join("path")
        .classed("sszvis-path", true);

      // Every visual property is applied to the transition when there is one, so the two
      // branches are spelled out rather than sharing a variable - a d3 transition and a d3
      // selection have separate types.
      if (props.transition) {
        paths
          .transition(defaultTransition())
          .attr("d", pathData)
          .attr("fill", fill)
          .attr("stroke", stroke)
          .attr("stroke-width", strokeWidth);
      } else {
        paths
          .attr("d", pathData)
          .attr("fill", fill)
          .attr("stroke", stroke)
          .attr("stroke-width", strokeWidth);
      }
    });
}
