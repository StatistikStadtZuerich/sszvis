/**
 * Sunburst component
 *
 * This component renders a sunburst diagram, which is kind of like a layered pie chart. There is an
 * inner ring of values, which are total values for some large category. Each of these categories can
 * be broken down into smaller categories, which are shown in another layer around the inner ring. If these
 * categories can in turn be broken down into smaller ones, you can add yet another layer. The result
 * is a hierarchical display with the level of aggregation getting finer and finer as you get further
 * from the center of the chart.
 *
 * This component can accept either:
 * 1. Pre-processed flat sunburst data (backwards compatibility)
 * 2. Raw hierarchical data from prepareHierarchyData() (recommended)
 *
 * When using raw hierarchical data, the component will automatically apply the partition layout
 * and flatten the data internally.
 *
 * @module sszvis/component/sunburst
 * @template T The type of the original flat data objects
 *
 * @property {Function} angleScale              Scale function for the angle of the segments of the
 *                                              sunburst chart. The domain should usually be [0, 1]
 *                                              and the range [0, 2 * PI]. These are used as
 *                                              defaults: the factory installs a fresh
 *                                              scaleLinear().range([0, 2 * Math.PI]) on every call,
 *                                              so the property is optional. It is called with a
 *                                              node's x0 and x1, which are positions in the scale's
 *                                              domain and not radians. Both endpoints are then
 *                                              clamped independently into [0, 2 * PI], so a
 *                                              position outside the domain saturates rather than
 *                                              wrapping, and a node whose x1 is below its x0 sweeps
 *                                              backwards over its neighbours.
 * @property {Function} radiusScale             Scale function for the radius of segments. Can be
 *                                              configured using values returned from
 *                                              sszvis.layout.sunburst.computeLayout. See the
 *                                              examples for how the scale setup works. Required,
 *                                              with no default. It is called with y0 and y1, again
 *                                              positions in its own domain rather than pixels, and
 *                                              a negative result is clamped to 0, which collapses
 *                                              the ring onto the centre circle. Leaving it unset
 *                                              throws before anything is rendered.
 * @property {Number} centerRadius              The radius of the center of the chart. Can be
 *                                              configured with
 *                                              sszvis.layout.sunburst.computeLayout. Required;
 *                                              leaving it unset throws before anything is
 *                                              rendered.
 * @property {Color, Function} fill             Function that returns the fill color for the
 *                                              segments in the center of the chart. Note that this
 *                                              will only be called on the centermost segments. The
 *                                              segments which are subcategories of these center
 *                                              segments will have their fill determined
 *                                              recursively, by lightening the color of its parent
 *                                              segment. It is called with a node's key string, not
 *                                              with the node. Required - leaving it unset throws
 *                                              before anything is rendered - and it takes
 *                                              a constant colour or an accessor, since it is
 *                                              wrapped in fn.functor on set.
 *                                              Every ring further out closes 15% of the gap
 *                                              between its parent's lightness and white, so the
 *                                              colours run lighter from the inside out without ever
 *                                              saturating. Siblings therefore share a colour, since
 *                                              it depends only on the top-level ancestor's key and
 *                                              on the depth.
 * @property {Color, Function} stroke           The stroke color of the segments. Defaults to white.
 *                                              Takes a constant or an accessor, and an accessor is
 *                                              handed to d3 untouched, so it is called with the
 *                                              element as its receiver and with d3's index and
 *                                              group arguments.
 *
 * Note: the component accepts either a hierarchy or an array of already flattened nodes. A
 * hierarchy is re-partitioned in place on every render, always to the partition layout's default
 * [1, 1] size, so any layout the caller applied is discarded, the radius scale's domain is always
 * expressed in fractions, and the innermost band belongs to the invisible root: with n layers the
 * first visible ring starts at 1/(n+1), not at 0. An array is passed through untouched, so it can
 * be positioned by hand. A hierarchy that did not come from prepareHierarchyData carries none of
 * its `_tag`s; it is rendered the same way - the parentless node is the root either way, and every
 * colour still comes from a node's own top-level ancestor - with one warning per chart.
 *
 * Note: the angles, the radii and the colours are all interpolated, but the geometry exists only
 * from the first animation frame, since `d` is written by the arc tween alone and there is no
 * transition property to opt out of - a chart serialised on the render tick is blank. The handover
 * matches the old arcs by index, so an arc that did not exist a render ago starts at its
 * destination and is painted outright, and exits are removed with no transition.
 *
 * Note: the component keeps no state of its own. It writes x0/x1 (the positions currently on
 * screen), r0/r1 (the radii currently on screen, in pixels) and _x0/_x1 (the positions the running
 * transition is heading for) onto every node it renders, so the data has to be mutable - frozen data throws. The on-screen angles are read off
 * the existing arcs before the re-partition overwrites them, so re-rendering the same hierarchy
 * object animates the same way a freshly built one does.
 *
 * Note: the tooltip anchors are rendered from the same flattened array as the arcs, so there is one
 * anchor per arc, in the same order. They are positioned from the pre-transition angles and are
 * never repositioned when the transition ends, so after an update they describe the previous
 * layout. See test/component/sunburst.test.ts.
 *
 * @return {sszvis.component}
 */

import {
  arc,
  type HierarchyNode,
  type HierarchyRectangularNode,
  type HSLColor,
  hsl,
  interpolate,
  partition,
  scaleLinear,
  select,
} from "d3";
import tooltipAnchor from "../annotation/tooltipAnchor.js";
import { type ComponentBuilder, component } from "../d3-component.js";
import * as fn from "../fn.js";
import type { NodeDatum } from "../layout/hierarchy.js";
import * as logger from "../logger.js";
import { defaultTransition } from "../transition.js";

const TWO_PI = 2 * Math.PI;

/**
 * A node of the hierarchy, positioned by d3's partition layout. The component adds _x0 and _x1
 * to it: the destination positions of the running transition, while x0 and x1 hold the ones
 * currently on screen. Both pairs live on the datum rather than on the component, because d3
 * cannot interpolate an arc path directly - the same arrangement pie uses for its a0/a1, except
 * that these are positions in the angle scale's domain rather than radians. They are optional
 * here because the caller's data does not carry them until the first render.
 */
export type SunburstNode<T = unknown> = HierarchyRectangularNode<NodeDatum<T>> & {
  _x0?: number;
  _x1?: number;
  r0?: number;
  r1?: number;
};

/**
 * The same node once the render has stamped its destination angles and its current radii
 * onto it. r0 and r1 are pixels rather than positions in the radius scale's domain, because
 * the scale itself can change between two renders and the arcs have to ease from the radii
 * that are on screen rather than from the old scale's reading of them.
 */
export type PositionedNode<T = unknown> = SunburstNode<T> & {
  _x0: number;
  _x1: number;
  r0: number;
  r1: number;
};

/**
 * Both scales are only ever called, never inspected, so this is all the component needs. A
 * d3 scale satisfies it - which is what the JSDoc and the examples suggest passing - and so
 * does a bare function.
 */
export type SunburstScale = (value: number) => number;

/**
 * fill is called with a node's key, not with the node, and only for the segments of the
 * innermost ring - every ring further out derives its colour from its parent's.
 */
export type FillAccessor = (key: string) => string;

/** fill is wrapped in fn.functor on set, so a constant colour is accepted as well. */
export type FillValue = string | FillAccessor;

/**
 * stroke accepts a constant or an accessor and is not normalised on set - the accessor is
 * handed to d3 as it stands, so it is called with d3's receiver and arguments. Returning
 * null leaves the attribute off; d3 reads a returned undefined the same way, but the narrower
 * spelling is what its own attr typings accept, and the two are interchangeable here.
 */
export type StrokeAccessor<T = unknown> = (
  this: SVGPathElement,
  d: PositionedNode<T>,
  i: number,
  group: ArrayLike<SVGPathElement>
) => string | null;
export type StrokeValue<T = unknown> = string | StrokeAccessor<T>;

/**
 * The props as the render reads them. radiusScale, centerRadius and fill are typed as present
 * because a render only succeeds with all three; a caller who leaves one out gets the failure
 * pinned in test/component/sunburst.test.ts rather than a type error, which is why the getters
 * below report the undefined the props can actually hold.
 */
type SunburstProps<T> = {
  angleScale: SunburstScale;
  radiusScale: SunburstScale;
  centerRadius: number;
  fill: FillAccessor;
  stroke: StrokeValue<T>;
};

/**
 * The getters return whatever was last set. radiusScale, centerRadius and fill have no
 * defaults and are all required for a render to succeed, so their getters report the
 * undefined the props actually hold.
 */
export interface SunburstComponent<T = unknown> extends ComponentBuilder<SunburstComponent<T>> {
  angleScale(): SunburstScale;
  angleScale(scale: SunburstScale): SunburstComponent<T>;
  radiusScale(): SunburstScale | undefined;
  radiusScale(scale: SunburstScale): SunburstComponent<T>;
  centerRadius(): number | undefined;
  centerRadius(radius: number): SunburstComponent<T>;
  fill(): FillAccessor | undefined;
  fill(fill: FillValue): SunburstComponent<T>;
  stroke(): StrokeValue<T>;
  stroke<U = T>(stroke: StrokeValue<U>): SunburstComponent<T>;
}

/**
 * The input the render accepts: a hierarchy, which it partitions itself, or an array that has
 * already been partitioned and flattened - what the deprecated sszvis.layout.sunburst
 * prepareData returns. Of an array's nodes the render only reads data, parent and the four
 * positions, but the type asks for whole nodes, since that is what prepareData hands back.
 */
export type SunburstData<T = unknown> = HierarchyNode<NodeDatum<T>> | SunburstNode<T>[];

export default function sunburst<T = unknown>(): SunburstComponent<T> {
  // The chain is held in a variable rather than returned inline only to keep the long
  // configuration block readable: ComponentBuilder declares .prop() and .render() as
  // returning the component interface itself, so the chain stays typed either way.
  const sunburstComponent = component<SunburstComponent<T>>();

  sunburstComponent
    .prop("angleScale")
    .angleScale(scaleLinear().range([0, 2 * Math.PI]))
    .prop("radiusScale")
    .prop("centerRadius")
    .prop("fill", fn.functor)
    .prop("stroke")
    .stroke("white")
    .render(function (this: Element, inputData: SunburstData<T>) {
      // The old datum is the render's own input: the component is called through
      // selection.each, so the group's datum is exactly what was handed to the render -
      // either a hierarchy root or an already flattened array. Deriving it with typeof
      // rather than restating the type is what keeps the two from drifting apart, the way
      // they did in #303. pack, treemap and sunburst all declare it this way. It is rebound
      // to the flattened node array at the end of the render, and datum() types the new
      // binding on its own.
      const selection = select<Element, typeof inputData>(this);
      const props = selection.props<SunburstProps<T>>();

      // radiusScale, centerRadius and fill are required and have no defaults, and a render
      // without any one of them cannot come out right - so they are checked here, before a
      // single element is created. Left unchecked they fail three different ways: fill
      // throws immediately, radiusScale throws from the tooltip anchor once the arcs and
      // their transition are already in flight (and then once per frame for the length of
      // the transition), and centerRadius does not throw at all - it turns every radius
      // into NaN and renders an empty chart.
      for (const required of ["radiusScale", "centerRadius", "fill"] as const) {
        if (props[required] === undefined) {
          throw new Error(`[sunburst] the ${required} property is required`);
        }
      }

      // The angles currently on screen, read off the existing arcs before anything below can
      // overwrite them. A caller who keeps one hierarchy in state and re-sums it hands over
      // the same node objects the previous render left its x0/x1 on, and the partition
      // further down replaces those with the new layout - so the handover has to happen
      // first, or every transition would start where it is meant to end.
      const onScreen = selection
        .selectAll<SVGPathElement, SunburstNode<T>>(".sszvis-sunburst-arc")
        .nodes()
        .map((element) => {
          // A path inserted without d3 has no datum at all, which throws here rather than
          // silently shifting the handover - see test/component/sunburst.test.ts.
          const d = Reflect.get(element, "__data__") as SunburstNode<T>;
          return {
            angles: [d.x0, d.x1] as const,
            // Absent until a render has drawn this arc once, in which case it starts at
            // whatever radii this render computes for it.
            radii: d.r0 === undefined || d.r1 === undefined ? undefined : ([d.r0, d.r1] as const),
          };
        });

      // NOTE: Determine if we have raw hierarchical data or pre-computed sunburst data
      // @deprecated in v3.4.0
      let nodes: SunburstNode<T>[];

      if (Array.isArray(inputData)) {
        // Already computed sunburst data (backwards compatibility)
        nodes = inputData;
      } else {
        if (inputData.data._tag !== "root") {
          // A hierarchy that did not come from prepareHierarchyData carries none of its
          // tags. It is still rendered - the structure is all the layout needs - but the
          // caller is told once per chart rather than once per node.
          logger.warn(
            "Data passed to sszvis.component.sunburst does not have the expected tree structure. You should prepare it using sszvis.prepareHierarchyData"
          );
        }
        const root = partition<NodeDatum<T>>()(inputData);
        const flatten = (node: HierarchyRectangularNode<NodeDatum<T>>): SunburstNode<T>[] => [
          node,
          ...(node.children || []).flatMap(flatten),
        ];
        // The root is the node the layout has no parent for, whether or not it is tagged as
        // one: it fills the whole circle and would otherwise be drawn as a ring of its own
        // under the first visible one.
        nodes = flatten(root).filter((d) => d.parent !== null && d.data._tag !== "root");
      }

      // The geometry accessors read positions off a node, so they are declared before the
      // destination values are stamped on. The two radius accessors return pixels, and are
      // the destination of the radius half of the transition.
      const startAngle = (d: SunburstNode<T>) =>
        Math.max(0, Math.min(TWO_PI, props.angleScale(d.x0)));
      const endAngle = (d: SunburstNode<T>) =>
        Math.max(0, Math.min(TWO_PI, props.angleScale(d.x1)));
      const innerRadius = (d: SunburstNode<T>) =>
        props.centerRadius + Math.max(0, props.radiusScale(d.y0));
      const outerRadius = (d: SunburstNode<T>) =>
        props.centerRadius + Math.max(0, props.radiusScale(d.y1));

      // _x0 and _x1 are the destination values for the transition. We set these to the
      // computed x0 and x1, and r0/r1 to the destination radii, which the handover below
      // replaces wherever an arc is already on screen. Object.assign writes them onto the
      // node the caller handed over and hands back that same node typed as carrying them, so
      // no cast is needed further down. Array.from rather than map, because it visits the
      // holes of a sparse array the way a for...of loop does, and so still fails before
      // anything is rendered.
      const data = Array.from(nodes, (d) =>
        Object.assign(d, { _x0: d.x0, _x1: d.x1, r0: innerRadius(d), r1: outerRadius(d) })
      );

      // Put the on-screen geometry back, matched to the new data by index, so the tween
      // below has somewhere to start from. An arc past the previous element count keeps what
      // this render gave it and therefore starts at its destination.
      for (const [i, previous] of onScreen.entries()) {
        const node = data[i];
        if (node) {
          [node.x0, node.x1] = previous.angles;
          if (previous.radii) [node.r0, node.r1] = previous.radii;
        }
      }

      // The key a node's colour is looked up under. Only a root has none, and a root never
      // reaches the recursion below: it is either filtered out of the data, painted
      // transparent by fillColor, or caught by the parent check one level down.
      const colorKey = (node: SunburstNode<T>): string => ("key" in node.data ? node.data.key : "");

      // Whether a node is the one the whole chart hangs off: tagged as the root by
      // prepareHierarchyData, or simply parentless in a hierarchy that came from elsewhere.
      const isRoot = (node: SunburstNode<T>): boolean =>
        node.data._tag === "root" || node.parent === null;

      // Accepts a sunburst node and returns a d3.hsl color for that node (sometimes operates recursively)
      function getColorRecursive(node: SunburstNode<T>): HSLColor {
        if (!node.parent) {
          return hsl(props.fill(colorKey(node)));
        } else if (isRoot(node.parent)) {
          // Use the color scale
          return hsl(props.fill(colorKey(node)));
        } else {
          // Recurse up the tree and adjust the lightness value
          // Lighten by 15% of what is left between the parent's lightness and white,
          // rather than by 15% of the lightness itself. Both give the same step from a
          // mid-tone, but this one can never reach white, so a deep ring stays
          // distinguishable from the one inside it however light the base colour is.
          const pColor = getColorRecursive(node.parent);
          pColor.l += (1 - pColor.l) * 0.15;
          return pColor;
        }
      }

      // Center node (if the data were prepared using sszvis.prepareHierarchyData). The colour
      // is stringified here because the recursion needs the mutable d3 colour object while
      // d3's attr only takes a primitive; setAttribute would have coerced it the same way.
      const fillColor = (node: SunburstNode<T>): string =>
        isRoot(node) ? "transparent" : String(getColorRecursive(node));

      const arcGen = arc<PositionedNode<T>>()
        .startAngle(startAngle)
        .endAngle(endAngle)
        // The radii the arc is drawn at right now, which the tween walks towards the
        // destination ones. Reading props here instead would put a changed radius scale on
        // screen in full on the first frame, while the angles were still moving.
        .innerRadius((d) => d.r0)
        .outerRadius((d) => d.r1);

      const arcs = selection
        .selectAll<SVGPathElement, PositionedNode<T>>(".sszvis-sunburst-arc")
        .data(data)
        .join((enter) =>
          // An entering arc has no colour to ease from, so it is painted outright; every
          // other attribute change goes through the transition below.
          enter
            .append("path")
            .attr("class", "sszvis-sunburst-arc")
            .attr("stroke", fn.valueFn(props.stroke))
            .attr("fill", fillColor)
        );

      // One transition for the whole arc: scheduling a second one on the same elements would
      // cancel this one.
      const arcTransition = arcs.transition(defaultTransition());

      arcTransition.attr("stroke", fn.valueFn(props.stroke)).attr("fill", fillColor);

      arcTransition.attrTween("d", (d) => {
        const x0Interp = interpolate(d.x0, d._x0);
        const x1Interp = interpolate(d.x1, d._x1);
        const r0Interp = interpolate(d.r0, innerRadius(d));
        const r1Interp = interpolate(d.r1, outerRadius(d));
        return (t) => {
          d.x0 = x0Interp(t);
          d.x1 = x1Interp(t);
          d.r0 = r0Interp(t);
          d.r1 = r1Interp(t);
          // arc returns null only for an empty path buffer, and every branch of it writes at
          // least a moveTo - even for NaN radii, which come out as "M0,0Z" - so this is
          // unreachable.
          return arcGen(d) ?? "";
        };
      });

      // Add tooltip anchors
      const arcTooltipAnchor = tooltipAnchor<PositionedNode<T>>().position(
        (d): [number, number] => {
          const startA = startAngle(d);
          const endA = endAngle(d);
          const a = startA + Math.abs(endA - startA) / 2 - Math.PI / 2;
          const r = (innerRadius(d) + outerRadius(d)) / 2;
          return [Math.cos(a) * r, Math.sin(a) * r];
        }
      );

      // Rebind the group to the flattened array before rendering the anchors, the way pie
      // does. Without it the anchors are joined to whatever datum the caller bound - for a
      // hierarchy that is the root node, which d3 iterates into every descendant, so the
      // root gains an anchor of its own and the anchors come out breadth first while the
      // arcs are depth first.
      selection.datum(data).call(arcTooltipAnchor);
    });

  return sunburstComponent;
}
