import { Selection, NumberValue, BaseType, HierarchyNode, AxisScale, AxisDomain, ScaleLinear, ScaleBand, ScalePoint, ScaleOrdinal, LabColor, HSLColor, SeriesPoint, HierarchyCircularNode, ValueFn, HierarchyRectangularNode, FormatLocaleDefinition, TimeLocaleDefinition, geoPath } from 'd3';
import * as d3_transition from 'd3-transition';
import * as d3_selection from 'd3-selection';

/**
 * Common TypeScript types used across sszvis modules
 *
 * @module sszvis/types
 */

/**
 * Generic type for SVG element selections with sensible defaults
 */
type SVGElementSelection<T extends SVGElement> = Selection<T, unknown, null, undefined>;
/**
 * Generic selection type with default parameters
 */
type AnySelection<T = any> = Selection<any, T, any, any>;
/**
 * Type for elements that can be selected - CSS selector string or d3 selection
 */
type SelectableElement = string | AnySelection;
/**
 * Type for SVG pattern selections
 */
type PatternSelection = SVGElementSelection<SVGPatternElement>;
/**
 * Type for SVG linear gradient selections
 */
type LinearGradientSelection = SVGElementSelection<SVGLinearGradientElement>;
/**
 * Type for SVG mask selections
 */
type MaskSelection = SVGElementSelection<SVGMaskElement>;
/**
 * A measurement object with width and screen height
 * This is the unified measurement interface used across sszvis
 */
interface Measurement {
    width: number;
    screenHeight: number;
    screenWidth?: number;
    bounds?: any;
}
/**
 * A breakpoint definition with name and measurement constraints
 */
interface Breakpoint {
    name: string;
    measurement: Measurement;
}
/**
 * Interface for dimension measurement results from measureDimensions
 */
interface DimensionMeasurement {
    width: number | undefined;
    screenWidth: number;
    screenHeight: number;
}
/**
 * Common accessor type for annotation components
 * Supports both constant values and accessor functions
 */
type Accessor$1<T, R> = R | ((d: T) => R);
/**
 * Specific accessor types for common use cases in annotations
 */
type NumberAccessor$1<T = unknown> = Accessor$1<T, NumberValue>;
type StringAccessor<T = unknown> = Accessor$1<T, string>;
type BooleanAccessor<T = unknown> = Accessor$1<T, boolean>;

/**
 * d3.selection plugin to simplify creating idempotent divs that are not
 * recreated when rendered again.
 *
 * @see https://github.com/mbostock/d3/wiki/Selections
 *
 * @param {String} key - the name of the group
 * @return {d3.selection}
 */
declare module "d3" {
    interface Selection<GElement, Datum, PElement, PDatum> {
        selectDiv(key: string): AnySelection;
    }
}
//# sourceMappingURL=d3-selectdiv.d.ts.map

/**
 * d3.selection plugin to simplify creating idempotent groups that are not
 * recreated when rendered again.
 *
 * @see https://github.com/mbostock/d3/wiki/Selections
 *
 * @param  {String} key The name of the group
 * @return {d3.selection}
 */
declare module "d3" {
    interface Selection<GElement, Datum, PElement, PDatum> {
        selectGroup(key: string): AnySelection;
    }
}
//# sourceMappingURL=d3-selectgroup.d.ts.map

interface ComponentProps {
    [key: string]: any;
}
type RenderCallback = (this: any, ...args: any[]) => void;
type SelectionRenderCallback = (this: any, ...args: any[]) => void;
type PropertySetter<T = any> = (...args: any[]) => T;
interface PropertyDelegate {
    [key: string]: (...args: any[]) => any;
}
interface Component {
    <GElement extends BaseType, Datum, PElement extends BaseType, PDatum>(selection: Selection<GElement, Datum, PElement, PDatum>): void;
    prop<T>(prop: string, setter?: PropertySetter<T>): Component;
    delegate(prop: string, delegate: PropertyDelegate): Component;
    renderSelection(callback: SelectionRenderCallback): Component;
    render(callback: RenderCallback): Component;
    [key: string]: any;
}
declare module "d3" {
    interface Selection<GElement extends BaseType, Datum, PElement extends BaseType, PDatum> {
        props<A>(): A extends ComponentProps ? A : ComponentProps;
    }
}

type NodeDatum<T> = {
    _tag: "root";
    children: NodeDatum<T>[];
} | {
    _tag: "branch";
    key: string;
    rootKey: string;
    children: NodeDatum<T>[];
} | {
    _tag: "leaf";
    key: string;
    rootKey: string;
    data: T;
};
/**
 * sszvis.prepareHierarchyData
 *
 * Creates a data preparation layout, with an API that works similarly to d3's configurable layouts.
 * Can be used in two ways:
 * 1. Chained API (like sunburst): prepareData().layer().value().size().calculate(data)
 * 2. Options API (backward compatibility): prepareData(data, options)
 *
 * @property {Array} calculate      Accepts an array of data, and applies this layout to that data. Returns the formatted dataset,
 *                                  ready to be used as data for the treemap component.
 * @property {Function} layer       Accepts a function, which should be a key function, used to create a layer for the data.
 *                                  The key function is applied to each datum, and the return value groups that datum within a
 *                                  layer of the treemap chart. The exact behavior depends on the order in which layers are specified.
 *                                  The first specified layer will be the outermost one of the treemap, with subsequent layers adding
 *                                  further subdivision. Data are grouped according to the first layer, then the second layer, then the third, etc.
 *                                  This uses d3.rollup under the hood, and applies the key function to group the data hierarchically.
 * @property {Function} value       The function which retrieves the value of each datum. This is required in order to calculate the size of
 *                                  the rectangle for each datum.
 * @property {Array} size           Set the size [width, height] of the treemap layout.
 * @property {Function} sort        Provide a sorting function for sibling nodes of the treemap.
 *                                  It receives two node values (which are created by d3), which should have at least a "key" property
 *                                  (corresponding to the layer key), and a "value" property (corresponding to the value amount of the rectangle).
 *                                  Otherwise, it behaves like a normal javascript array sorting function. The default value attempts to preserve the
 *                                  existing sort order of the data.
 *
 * @return {Function}               The layout function. Can be called directly or you can use '.calculate(dataset)'.
 */
type HierarchyComponent<T = unknown> = {
    calculate: (data: T[]) => HierarchyNode<NodeDatum<T>>;
    layer: (accessor: (d: T) => string | null | undefined) => HierarchyComponent<T>;
    value: (accessor: (d: T) => number) => HierarchyComponent<T>;
    sort: (sortFunc: (a: HierarchyNode<NodeDatum<T>>, b: HierarchyNode<NodeDatum<T>>) => number) => HierarchyComponent<T>;
};
declare function prepareHierarchyData<T = unknown>(): HierarchyComponent<T>;
declare function prepareHierarchyData<T = unknown>(data: T[], options: {
    layers: Array<(d: T) => string | null | undefined>;
    valueAccessor: (d: T) => number;
}): HierarchyNode<NodeDatum<T>>;

/**
 * Breadcrumb navigation component
 *
 * Use this component to add a breadcrumb navigation trail for hierarchical visualizations
 * like treemaps and pack charts. The breadcrumb shows the current path through the hierarchy
 * and allows users to navigate back to parent nodes by clicking on previous items.
 *
 * @module sszvis/annotation/breadcrumb
 *
 * @template T The type of the underlying data in hierarchy nodes
 *
 * @property {selection} renderInto   Container selection to render breadcrumbs into (required)
 * @property {Array} items            Array of BreadcrumbItem objects representing the trail
 * @property {function} label         Accessor to get label text from an item (default: d => d.label)
 * @property {function} onClick       Callback when a breadcrumb is clicked (receives item and index)
 * @property {string} rootLabel       Label for the root breadcrumb (default: "Root")
 * @property {string} separator       Separator text between breadcrumbs (default: " > ")
 * @property {number} width           Width of the breadcrumb container in pixels
 *
 * @return {sszvis.component}
 */

/**
 * Represents a single breadcrumb item in the navigation trail.
 * Generic over T to support different underlying data types.
 */
interface BreadcrumbItem<T = unknown> {
    /** Display label for this breadcrumb */
    label: string;
    /** The hierarchy node this breadcrumb represents (null for root) */
    node: HierarchyNode<NodeDatum<T>> | null;
}
/**
 * Component interface with method chaining support.
 * Each method returns the component for chaining (setter) or the value (getter).
 */
interface BreadcrumbComponent<T = unknown> extends Component {
    /** Set the container to render breadcrumbs into */
    renderInto(): AnySelection;
    renderInto(selection: AnySelection): BreadcrumbComponent<T>;
    /** Set the array of breadcrumb items */
    items(): BreadcrumbItem<T>[];
    items(items: BreadcrumbItem<T>[]): BreadcrumbComponent<T>;
    /** Set the label accessor function */
    label(): (item: BreadcrumbItem<T>) => string;
    label(accessor: StringAccessor<BreadcrumbItem<T>>): BreadcrumbComponent<T>;
    /** Set the click handler (receives item and index) */
    onClick(): (item: BreadcrumbItem<T>, index: number) => void;
    onClick(handler: (item: BreadcrumbItem<T>, index: number) => void): BreadcrumbComponent<T>;
    /** Set the root label text */
    rootLabel(): string;
    rootLabel(label: string): BreadcrumbComponent<T>;
    /** Set the separator text */
    separator(): string;
    separator(sep: string): BreadcrumbComponent<T>;
    /** Set the width of the breadcrumb container */
    width(): number;
    width(w: number): BreadcrumbComponent<T>;
}
/**
 * Helper to create breadcrumb items from a hierarchy node.
 * Extracts the ancestor path and converts to breadcrumb items.
 *
 * @example
 * const items = createBreadcrumbItems(focusedNode);
 * // Returns: [{ label: "Category", node: ... }, { label: "Subcategory", node: ... }]
 */
declare function createBreadcrumbItems<T>(node: HierarchyNode<NodeDatum<T>> | null): BreadcrumbItem<T>[];
declare function export_default$w<T = unknown>(): BreadcrumbComponent<T>;

/**
 * Circle annotation
 *
 * A component for creating circular data areas. The component should be passed
 * an array of data values, each of which will be used to render a data area by
 * passing it through the accessor functions. You can specify a caption to display,
 * which can be offset from the center of the data area by specifying dx or dy properties.
 *
 * @module sszvis/annotation/circle
 *
 * @template T The type of the data objects used in the circle annotations
 * @param {number, function} x        The x-position of the center of the data area.
 * @param {number, function} y        The y-position of the center of the data area.
 * @param {number, function} r        The radius of the data area.
 * @param {number, function} dx       The x-offset of the data area caption.
 * @param {number, function} dy       The y-offset of the data area caption.
 * @param {string, function} caption  The caption for the data area. Default position is the center of the circle
 *
 * @returns {sszvis.component} a circular data area component
 */

type Datum$9<T = unknown> = T;
interface CircleComponent<T = unknown> extends Component {
    x(accessor?: NumberAccessor$1<Datum$9<T>>): CircleComponent<T>;
    y(accessor?: NumberAccessor$1<Datum$9<T>>): CircleComponent<T>;
    r(accessor?: NumberAccessor$1<Datum$9<T>>): CircleComponent<T>;
    dx(accessor?: NumberAccessor$1<Datum$9<T>>): CircleComponent<T>;
    dy(accessor?: NumberAccessor$1<Datum$9<T>>): CircleComponent<T>;
    caption(accessor?: StringAccessor<Datum$9<T>>): CircleComponent<T>;
}
declare function export_default$v<T = unknown>(): CircleComponent<T>;

/**
 * @function sszvis.annotationConfidenceArea
 *
 * A component for creating confidence areas. The component should be passed
 * an array of data values, each of which will be used to render a confidence area
 * by passing it through the accessor functions. You can specify the x, y0, and y1
 * properties to define the area. The component also supports stroke, strokeWidth,
 * and fill properties for styling.
 *
 * @module sszvis/annotation/confidenceArea
 *
 * @param {function} x             The x-accessor function.
 * @param {function} y0            The y0-accessor function.
 * @param {function} y1            The y1-accessor function.
 * @param {string} [stroke]        The stroke color of the area.
 * @param {number} [strokeWidth]   The stroke width of the area.
 * @param {string} [fill]          The fill color of the area.
 * @param {function} [key]         The key function for data binding.
 * @param {function} [valuesAccessor] The accessor function for the data values.
 * @param {boolean} [transition]   Whether to apply a transition to the area.
 *
 * @returns {sszvis.component} a confidence area component
 */

type Datum$8<T = unknown> = T;
/** The data-join key. d3 hands it the datum and its index. */
type KeyAccessor$3<T> = (d: Datum$8<T>, i: number) => string | number;
interface ConfidenceAreaComponent<T = unknown> extends Component {
    x(accessor?: NumberAccessor$1<Datum$8<T>>): ConfidenceAreaComponent<T>;
    y0(accessor?: NumberAccessor$1<Datum$8<T>>): ConfidenceAreaComponent<T>;
    y1(accessor?: NumberAccessor$1<Datum$8<T>>): ConfidenceAreaComponent<T>;
    stroke(stroke?: string): ConfidenceAreaComponent<T>;
    strokeWidth(width?: number): ConfidenceAreaComponent<T>;
    fill(fill?: string): ConfidenceAreaComponent<T>;
    key(accessor?: KeyAccessor$3<T>): ConfidenceAreaComponent<T>;
    valuesAccessor(accessor?: (d: Datum$8<T>[]) => Datum$8<T>[]): ConfidenceAreaComponent<T>;
    transition(enabled?: boolean): ConfidenceAreaComponent<T>;
}
declare function export_default$u<T = unknown>(): ConfidenceAreaComponent<T>;

/**
 * Confidence Bar annotation
 *
 * A generic component for creating confidence bars that display confidence intervals or error ranges.
 * The component should be passed an array of data values, each of which will be used to
 * render confidence bars by passing them through the accessor functions. Confidence bars consist of
 * a vertical line connecting the confidence bounds and horizontal caps at the top and bottom.
 *
 * @module sszvis/annotation/confidenceBar
 *
 * @template T The type of the data objects used in the confidence bars
 * @param {number, function} x               The x-position accessor for the confidence bars (currently unused)
 * @param {number, function} y               The y-position accessor for the confidence bars
 * @param {number, function} confidenceLow   Accessor function for the lower confidence bound
 * @param {number, function} confidenceHigh  Accessor function for the upper confidence bound
 * @param {number, function} width           The width of the horizontal confidence cap
 * @param {number} groupSize                 The number of items in each group
 * @param {number} groupWidth                The width allocated for each group
 * @param {number} groupSpace                The spacing between items within a group (default: 0.05)
 * @param {function} groupScale              Scale function for positioning groups horizontally
 *
 * @returns {sszvis.component} An confidence bar annotation component
 */

type Datum$7<T = unknown> = T & {
    __sszvisGroupedBarConfidenceIndex__?: number;
};
interface ConfidenceBarComponent<T = unknown> extends Component {
    x(accessor?: (d: Datum$7<T>) => NumberValue): ConfidenceBarComponent<T>;
    y(accessor?: (d: Datum$7<T>) => NumberValue): ConfidenceBarComponent<T>;
    confidenceLow(accessor?: (d: Datum$7<T>) => NumberValue): ConfidenceBarComponent<T>;
    confidenceHigh(accessor?: (d: Datum$7<T>) => NumberValue): ConfidenceBarComponent<T>;
    width(width?: number): ConfidenceBarComponent<T>;
    groupSize(size?: number): ConfidenceBarComponent<T>;
    groupWidth(width?: number): ConfidenceBarComponent<T>;
    groupSpace(space?: number): ConfidenceBarComponent<T>;
    groupScale(scale?: (d: Datum$7<T>) => number): ConfidenceBarComponent<T>;
}
declare function export_default$t<T = unknown>(): ConfidenceBarComponent<T>;

/**
 * @function sszvis.tooltipFit
 *
 * This is a useful default function for making a tooltip fit within a horizontal space.
 * You provide a default orientation for the tooltip, but also provide the bounds of the
 * space within which the tooltip should stay. When the tooltip is too close to the left
 * or right edge of the bounds, it is oriented away from the edge. Otherwise the default
 * is used.
 *
 * @template T The type of the data objects used in the tooltip
 * @param {String} defaultValue         The default value for the tooltip orientation
 * @param {Object} bounds               The bounds object within which the tooltip should stay.
 *
 * @returns {Function}                  A function for calculating the orientation of the tooltips.
 */
type TooltipOrientation = "top" | "bottom" | "left" | "right";
interface TooltipData$1<T = unknown> {
    datum: T;
    x: number;
    y: number;
}
interface Bounds {
    innerWidth: number;
}
declare function export_default$s<T = unknown>(defaultVal: TooltipOrientation, bounds: Bounds): (d: TooltipData$1<T>) => TooltipOrientation;

/**
 * Line annotation
 *
 * A component for creating reference line data areas. The component should be passed
 * an array of data values, each of which will be used to render a reference line
 * by passing it through the accessor functions. You can specify a caption to display,
 * which will be positioned by default at the midpoint of the line you specify,
 * aligned with the angle of the line. The caption can be offset from the midpoint
 * by specifying dx or dy properties.
 *
 * @module sszvis/annotation/line
 *
 * @template T The type of the data objects used in the line annotations
 * @param {any} x1             The x-value, in data units, of the first reference line point.
 * @param {any} x2             The x-value, in data units, of the second reference line point.
 * @param {any} y1             The y-value, in data units, of the first reference line point.
 * @param {any} y2             The y-value, in data units, of the second reference line point.
 * @param {function} xScale         The x-scale of the chart. Used to transform the given x- values into chart coordinates.
 * @param {function} yScale         The y-scale of the chart. Used to transform the given y- values into chart coordinates.
 * @param {number} [dx]           The x-offset of the caption
 * @param {number} [dy]           The y-offset of the caption
 * @param {string} [caption]      A reference line caption. (default position is centered at the midpoint of the line, aligned with the slope angle of the line)
 * @returns {sszvis.component} a linear data area component (reference line)
 */

type Datum$6<T = unknown> = T;
interface LineComponent$1<T = unknown> extends Component {
    x1(accessor?: NumberAccessor$1<Datum$6<T>>): LineComponent$1<T>;
    x2(accessor?: NumberAccessor$1<Datum$6<T>>): LineComponent$1<T>;
    y1(accessor?: NumberAccessor$1<Datum$6<T>>): LineComponent$1<T>;
    y2(accessor?: NumberAccessor$1<Datum$6<T>>): LineComponent$1<T>;
    xScale(scale?: AxisScale<NumberValue>): LineComponent$1<T>;
    yScale(scale?: AxisScale<NumberValue>): LineComponent$1<T>;
    dx(accessor?: NumberAccessor$1<Datum$6<T>>): LineComponent$1<T>;
    dy(accessor?: NumberAccessor$1<Datum$6<T>>): LineComponent$1<T>;
    caption(accessor?: StringAccessor<Datum$6<T>>): LineComponent$1<T>;
}
declare function export_default$r<T = unknown>(): LineComponent$1<T>;

/**
 * Range Flag annotation
 *
 * The range flag component creates a pair of small white circles which fit well with the range ruler.
 * However, this is a separate component for implementation reasons, because the data for the range flag
 * should usually be only one value, distinct from the range ruler which expects multiple values. The range
 * flag also creates a tooltip anchor between the two dots, to which you can attach a tooltip. See the
 * interactive stacked area chart examples for a use of the range flag.
 *
 * @module sszvis/annotation/rangeFlag
 *
 * @property {number functor} x           A value for the x-value of the range flag
 * @property {number functor} y0          A value for the y-value of the lower range flag dot
 * @property {number functor} y1          A value for the y-value of the upper range flag dot
 *
 * @returns {sszvis.component}
 */

type Datum$5<T = unknown> = T;
interface RangeFlagComponent<T = unknown> extends Component {
    x(accessor?: NumberAccessor$1<Datum$5<T>>): RangeFlagComponent<T>;
    y0(accessor?: NumberAccessor$1<Datum$5<T>>): RangeFlagComponent<T>;
    y1(accessor?: NumberAccessor$1<Datum$5<T>>): RangeFlagComponent<T>;
}
declare function export_default$q<T = unknown>(): RangeFlagComponent<T>;

/**
 * RangeRuler annotation
 *
 * The range ruler is similar to the handle ruler and the ruler, except for each data
 * point which it finds bound to its layer, it generates two small dots, and a label which
 * states the value of the data point. For an example, see the interactive stacked area charts.
 * Note that the interactive stacked area charts also include the rangeFlag component for highlighting
 * certain specific dots. This is a sepearate component.
 *
 * @module sszvis/annotation/rangeRuler
 *
 * @property {number functor} x            A function for the x-position of the ruler.
 * @property {number functor} y0           A function for the y-position of the lower dot. Called for each datum.
 * @property {number functor} y1           A function for the y-position of the upper dot. Called for each datum.
 * @property {number} top                  A number for the y-position of the top of the ruler
 * @property {number} bottom               A number for the y-position of the bottom of the ruler
 * @property {string functor} label        A function which generates labels for each range.
 * @property {number} total                A number to display as the total of the range ruler (at the top)
 * @property {boolean functor} flip        Determines whether the rangeRuler labels should be flipped (they default to the right side)
 *
 * @return {sszvis.component}
 */

type Datum$4<T = unknown> = T;
interface RangeRulerComponent<T = unknown> extends Component {
    x(accessor?: NumberAccessor$1<Datum$4<T>>): RangeRulerComponent<T>;
    y0(accessor?: NumberAccessor$1<Datum$4<T>>): RangeRulerComponent<T>;
    y1(accessor?: NumberAccessor$1<Datum$4<T>>): RangeRulerComponent<T>;
    top(value?: number): RangeRulerComponent<T>;
    bottom(value?: number): RangeRulerComponent<T>;
    label(accessor?: StringAccessor<Datum$4<T>>): RangeRulerComponent<T>;
    removeStroke(value?: boolean): RangeRulerComponent<T>;
    total(value?: number): RangeRulerComponent<T>;
    flip(accessor?: BooleanAccessor<Datum$4<T>>): RangeRulerComponent<T>;
}
declare function export_default$p<T = unknown>(): RangeRulerComponent<T>;

/**
 * Rectangle annotation
 *
 * A component for creating rectangular data areas. The component should be passed
 * an array of data values, each of which will be used to render a data area by
 * passing it through the accessor functions. You can specify a caption to display,
 * which can be offset from the center of the data area by specifying dx or dy properties.
 *
 * @module sszvis/annotation/rectangle
 *
 * @template T The type of the data objects used in the rectangle annotations
 * @param {number, function} x        The x-position of the upper left corner of the data area.
 * @param {number, function} y        The y-position of the upper left corner of the data area.
 * @param {number, function} width    The width of the data area.
 * @param {number, function} height   The height of the data area.
 * @param {number, function} dx       The x-offset of the data area caption.
 * @param {number, function} dy       The y-offset of the data area caption.
 * @param {string, function} caption  The caption for the data area.
 *
 * @returns {sszvis.component} a rectangular data area component
 */

type Datum$3<T = unknown> = T;
interface RectangleComponent<T = unknown> extends Component {
    x(accessor?: NumberAccessor$1<Datum$3<T>>): RectangleComponent<T>;
    y(accessor?: NumberAccessor$1<Datum$3<T>>): RectangleComponent<T>;
    width(accessor?: NumberAccessor$1<Datum$3<T>>): RectangleComponent<T>;
    height(accessor?: NumberAccessor$1<Datum$3<T>>): RectangleComponent<T>;
    dx(accessor?: NumberAccessor$1<Datum$3<T>>): RectangleComponent<T>;
    dy(accessor?: NumberAccessor$1<Datum$3<T>>): RectangleComponent<T>;
    caption(accessor?: StringAccessor<Datum$3<T>>): RectangleComponent<T>;
}
declare function export_default$o<T = unknown>(): RectangleComponent<T>;

/**
 * Ruler annotation
 *
 * The ruler component can be used to create a vertical line which highlights data at a certain
 * x-value, for instance in a line chart or area chart. The ruler expects data to be bound to
 * the layer it renders into, and it will generate a small dot for each data point it finds.
 *
 * @module sszvis/annotation/ruler
 *
 * @property {number} top                 A number which is the y-position of the top of the ruler line
 * @property {number} bottom              A number which is the y-position of the bottom of the ruler line
 * @property {function} x                 A number or function returning a number for the x-position of the ruler line.
 * @property {function} y                 A function for determining the y-position of the ruler dots. Should take a data
 *                                        value as an argument and return a y-position.
 * @property {function} label             A function for determining the labels of the ruler dots. Should take a
 *                                        data value as argument and return a label.
 * @property {string, function} color     A string or function to specify the color of the ruler dots.
 * @property {function} flip              A boolean or function which returns a boolean that specifies
 *                                        whether the labels on the ruler dots should be flipped. (they default to the right side)
 * @property {function} labelId           An id accessor function for the labels. This is used to match label data to svg elements,
 *                                        and it is used by the reduceOverlap algorithm to match calculated bounds and positions with
 *                                        labels. The default implementation uses the x and y positions of each label, but when labels
 *                                        overlap, these positions are the same (and one will be removed!). It's generally a good idea
 *                                        to provide your own function here, but you should especially use this when multiple labels
 *                                        could overlap with each other. Usually this will be some kind of category accessor function.
 * @property {boolean} reduceOverlap      Use an iterative relaxation algorithm to adjust the positions of the labels (when there is more
 *                                        than one label) so that they don't overlap. This can be computationally expensive, when there are
 *                                        many labels that need adjusting. This is turned off by default.
 *
 * @return {sszvis.component}
 */

type Datum$2<T = unknown> = T;
interface RulerComponent<T = unknown> extends Component {
    top(value?: number): RulerComponent<T>;
    bottom(value?: number): RulerComponent<T>;
    x(accessor?: NumberAccessor$1<Datum$2<T>>): RulerComponent<T>;
    y(accessor?: NumberAccessor$1<Datum$2<T>>): RulerComponent<T>;
    label(accessor?: StringAccessor<Datum$2<T>>): RulerComponent<T>;
    color(accessor?: StringAccessor<Datum$2<T>>): RulerComponent<T>;
    flip(accessor?: BooleanAccessor<Datum$2<T>>): RulerComponent<T>;
    labelId(accessor?: StringAccessor<Datum$2<T>>): RulerComponent<T>;
    reduceOverlap(enabled?: boolean): RulerComponent<T>;
}
declare const annotationRuler: <T = unknown>() => RulerComponent<T>;
declare const rulerLabelVerticalSeparate: <T = unknown>(cAcc: (d: T) => string | number) => (g: AnySelection) => void;

/**
 * Tooltip annotation
 *
 * Use this component to add a tooltip to the document. The tooltip component should be
 * called on a selection of [data-tooltip-anchor], which contain the information necessary to
 * position the tooltip and provide it with data. The tooltip's visibility should be toggled
 * using the .visible property, passing a predicate function. Tooltips will be displayed
 * when .visible returns true.
 *
 * @module sszvis/annotation/tooltip
 *
 * @template T The type of the data objects used in the tooltip
 * @property {seletion} renderInto      Provide a selection container into which to render the tooltip.
 *                                      Unlike most other components, the tooltip isn't rendered directly into the selection
 *                                      on which it is called. Instead, it's rendered into whichever selection is
 *                                      passed to the renderInto option
 * @property {function} visible         Provide a predicate function which accepts a datum and determines whether the associated
 *                                      tooltip should be visible. (default: false)
 * @property {function} header          A function accepting a datum. The result becomes the header of the tooltip.
 *                                      This function can return:
 *                                      - a plain string
 *                                      - an HTML string to be used as innerHTML
 * @property {function} body            A function accepting a datum. The result becomes the body of the tooltip.
 *                                      This function can return:
 *                                      - a plain string
 *                                      - an HTML string to be used as innerHTML
 *                                      - an array of arrays, which produces a tabular layout where each
 *                                      sub-array is one row in the table.
 * @property {function} orientation     A string or function returning a string which determines the orientation. This determines
 *                                      which direction the tooltip sits relative to its point.
 *                                      Possible values are: "bottom" (points down), "top" (points upward), "left" (points left), and "right" (points right).
 *                                      Default is "bottom".
 * @property {number} dx                A number for the x-offset of the tooltip
 * @property {number} dy                A number for the y-offset of the tooltip
 * @property {function} opacity         A function or number which determines the opacity of the tooltip. Default is 1.
 *
 * @return {sszvis.component}
 *
 */

type Datum$1<T = unknown> = T;
interface TooltipData<T = unknown> {
    datum: Datum$1<T>;
    x: number;
    y: number;
}
interface TooltipComponent<T = unknown> extends Component {
    renderInto(selection?: AnySelection): TooltipComponent<T>;
    visible(accessor?: Accessor$1<Datum$1<T>, boolean>): TooltipComponent<T>;
    header(accessor?: StringAccessor<Datum$1<T>>): TooltipComponent<T>;
    body(accessor?: StringAccessor<Datum$1<T>> | ((d: Datum$1<T>) => string[][])): TooltipComponent<T>;
    orientation(accessor?: StringAccessor<TooltipData<T>>): TooltipComponent<T>;
    dx(accessor?: NumberAccessor$1<TooltipData<T>>): TooltipComponent<T>;
    dy(accessor?: NumberAccessor$1<TooltipData<T>>): TooltipComponent<T>;
    opacity(accessor?: NumberAccessor$1<TooltipData<T>>): TooltipComponent<T>;
}
declare function export_default$n<T = unknown>(): TooltipComponent<T>;

/**
 * Tooltip anchor annotation
 *
 * Tooltip anchors are invisible SVG <rect>s that each component needs to
 * provide. Because they are real elements we can know their exact position
 * on the page without any calculations and even if the parent element has
 * been transformed. These elements need to be <rect>s because some browsers
 * don't calculate positon information for the better suited <g> elements.
 *
 * Tooltips can be bound to by selecting for the tooltip data attribute.
 *
 * @module sszvis/annotation/tooltipAnchor
 * @template T The type of the data objects used with the tooltip anchor
 *
 * @example
 * var tooltip = sszvis.tooltip();
 * bars.selectAll('[data-tooltip-anchor]').call(tooltip);
 *
 * Tooltips use HTML5 data attributes to clarify their intent, which is not
 * to style an element but to provide an anchor that can be selected using
 * Javascript.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Using_data_attributes
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/Attribute_selectors
 *
 * To add a tooltip anchor to an element, create a new tooltip anchor function
 * and call it on a selection. This is usually the same selection that you have
 * added the visible elements of your chart to, e.g. the selection that you
 * render bar <rect>s into.
 *
 * @example
 * var tooltipAnchor = sszvis.tooltipAnchor()
 *   .position(function(d) {
 *     return [xScale(d), yScale(d)];
 *   });
 * selection.call(tooltipAnchor);
 *
 * @property {function} position A vector of the tooltip's [x, y] coordinates
 * @property {boolean}  debug    Renders a visible tooltip anchor when true
 *
 * @return {sszvis.component}
 */

type Datum<T = unknown> = T;
interface TooltipAnchorComponent<T = unknown> extends Component {
    position(accessor?: (d: Datum<T>) => [number, number]): TooltipAnchorComponent<T>;
    debug(value?: boolean): TooltipAnchorComponent<T>;
}
declare function export_default$m<T = unknown>(): TooltipAnchorComponent<T>;

declare function app({ init, render, actions, fallback }: {
    init: any;
    render: any;
    actions?: {} | undefined;
    fallback: any;
}): void;
/**
 * An effect can be returned from an action to schedule further actions using dispatch.
 */
type Dispatch = (action: string, p?: Props) => void;
/**
 * An action receives an Immer.js Draft that can be mutated within the action. If further
 * actions should be called after this one, an action can return an Effect.
 */
type Effect = (d: Dispatch, p?: Props) => void;
/**
 * Application loop
 *
 * Creates a stateful app that can be interacted with through actions. By providing
 * a structured approach, this allows us to optimize the render loop and clarifies
 * the relationship between state and actions.
 *
 * Within an app, state can only be modified through actions. During the render phase,
 * state is immutable and an error will be thrown if it is modified accidentally.
 *
 * Conceptually, an app works like this:
 *
 *     init
 *       ⇣
 *     state ⭢ render
 *      ⮤ action ⮠
 *
 * The basis of an app are the following three types:
 *
 * Dispatch can be used to schedule an action after rendering has been completed. In the
 * render function, dispatch is not directly accessible; instead, an actions object is
 * provided to dispatch actions by calling them as functions.
 */
type Action = (s: Draft, p?: Props) => Effect | void;

/**
 * Functions related to aspect ratio calculations. An "auto" function is
 * provided and should be used in most cases to find the recommended
 * aspect ratio.
 *
 * @module sszvis/aspectRatio
 */

/**
 * Aspect ratio function type that calculates height from width
 */
type AspectRatioFunction = (width: number) => number;
/**
 * Aspect ratio function with a MAX_HEIGHT property
 */
interface AspectRatioFunctionWithMaxHeight extends AspectRatioFunction {
    MAX_HEIGHT: number;
}
/**
 * aspectRatio
 *
 * The base module is a function which creates an aspect ratio function.
 * You provide a width and a height of the aspect ratio, and the
 * returned function accepts any width, returning the corresponding
 * height for the aspect ratio you configured.
 *
 * @param x  The number of parts on the horizontal axis (dividend)
 * @param y  The number of parts on the vertical axis (divisor)
 * @return The aspect ratio function. Takes a width as an argument
 *         and returns the corresponding height based on the
 *         aspect ratio defined by x:y.
 */
declare function aspectRatio(x: number, y: number): AspectRatioFunction;
/**
 * aspectRatio4to3
 *
 * Recommended breakpoints:
 *   - palm
 */
declare const aspectRatio4to3: AspectRatioFunction;
/**
 * aspectRatio16to10
 *
 * Recommended breakpoints:
 *   - lap
 */
declare const aspectRatio16to10: AspectRatioFunction;
declare const aspectRatio12to5: AspectRatioFunctionWithMaxHeight;
declare const aspectRatioSquare: AspectRatioFunctionWithMaxHeight;
declare const aspectRatioPortrait: AspectRatioFunctionWithMaxHeight;
declare const aspectRatioAuto: (measurement: Measurement) => number;

/**
 * Axis component
 *
 * This component is an extension of d3.axis and provides the same interface
 * with some custom additions. It provides good defaults for sszvis charts
 * and helps with some commonly used functionality.
 *
 * @module sszvis/axis
 *
 * The following properties are directly delegated to the d3.axis component.
 * They are documented in the d3 documentation.
 * @see https://github.com/mbostock/d3/wiki/SVG-Axes
 *
 * @property {function} scale         Delegates to d3.axis
 * @property {function} orient        Delegates to d3.axis
 * @property {function} ticks         Delegates to d3.axis
 * @property {function} tickValues    Delegates to d3.axis
 * @property {function} tickSize      Delegates to d3.axis
 * @property {function} innerTickSize Delegates to d3.axis
 * @property {function} outerTickSize Delegates to d3.axis
 * @property {function} tickPadding   Delegates to d3.axis
 * @property {function} tickFormat    Delegates to d3.axis
 *
 * The following properties are custom additions.
 *
 * @property {boolean} alignOuterLabels                 Whether or not to align the outer labels to the axis extent so that they do not fall outside the axis space.
 * @property {boolean} contour                          Specify a 'contour' background for the axis labels.
 * @property {number} hideBorderTickThreshold           Specifies the pixel distance threshold for the visible tick correction. Ticks which are closer than
 *                                                      this threshold to the end of the axis (i.e. a tick which is 1 or two pixels from the end) will be
 *                                                      hidden from view. This prevents the display of a tick very close to the ending line.
 * @property {number} hideLabelThreshold                By default, labels are hidden when they are closer than LABEL_PROXIMITY_THRESHOLD to a highlighted label.
 *                                                      If this value is set to 0 or lower, labels won't be hidden, even if they overlap with the highlighted label.
 * @property {function} highlightTick                   Specifies a predicate function to use to determine whether axis ticks should be highlighted.
 *                                                      Any tick value which returns true for this predicate function will be treated specially as a highlighted tick.
 *                                                      Note that this function does NOT have any effect over which ticks are actually included on the axis. To create special
 *                                                      custom ticks, use tickValues.
 * @property {boolean} showZeroY                        Whether the axis should display a label for at y=0.
 * @property {string} slant                             Specify a label slant for the tick labels. Can be "vertical" - labels are displayed vertically - or
 *                                                      "diagonal" - labels are displayed at a 45 degree angle to the axis.
 *                                                      Use "horizontal" to reset to a horizontal slant.
 * @property {number} textWrap                          Specify a width at which to wrap the axis label text.
 * @property {number, function} tickLength              specify a number or a function which returns a number for setting the tick length.
 * @property {string} title                             Specify a string to use as the title of this chart. Default title position depends on the chart orientation
 * @property {string} titleAnchor                       specify the title text-anchor. Values are 'start', 'middle', and 'end'. Corresponds to the 'text-anchor' svg styling attribute
 *                                                      the default depends on the axis orient property
 * @property {boolean} titleCenter                      whether or not to center the axis title along the axis. If true, this sets the title anchor point
 *                                                      as the midpoint between axis extremes. Should usually be used with titleAnchor('middle') to ensure exact title centering. (default: false)
 * @property {number} dxTitle                           specify an amount by which to offset the title towards the left. This offsets away from the default position. (default: 0)
 * @property {number} dyTitle                           specify an amount by which to offset the title towards the top. This offsets away from the default position. (default: 0)
 * @property {boolean} titleVertical                    whether or not to rotate the title 90 degrees so that it appears vertical, reading from bottom to top. (default: false)
 * @property {boolean} vertical                         whether the axis is a vertical axis. When true, this property changes certain display properties of the axis according to the style guide.
 *
 * @return {sszvis.component}
 */

type AxisOrientation = "top" | "bottom" | "left" | "right";
type SlantDirection = "horizontal" | "vertical" | "diagonal";
type TextAnchor = "start" | "middle" | "end";
interface AxisComponent extends Component {
    scale(scale?: AxisScale<NumberValue>): AxisComponent;
    orient(orientation?: AxisOrientation): AxisComponent;
    ticks(ticks?: number | number[]): AxisComponent;
    tickValues(values?: AxisDomain[]): AxisComponent;
    tickSize(size?: number): AxisComponent;
    tickSizeInner(size?: number): AxisComponent;
    tickSizeOuter(size?: number): AxisComponent;
    tickPadding(padding?: number): AxisComponent;
    tickFormat(format?: (d: AxisDomain) => string | null): AxisComponent;
    alignOuterLabels(align?: boolean): AxisComponent;
    contour(contour?: boolean): AxisComponent;
    hideBorderTickThreshold(threshold?: number): AxisComponent;
    hideLabelThreshold(threshold?: number): AxisComponent;
    highlightTick(predicate?: (d: AxisDomain) => boolean): AxisComponent;
    showZeroY(show?: boolean): AxisComponent;
    slant(direction?: SlantDirection): AxisComponent;
    textWrap(width?: number): AxisComponent;
    tickLength(length?: number): AxisComponent;
    title(title?: string): AxisComponent;
    titleAnchor(anchor?: TextAnchor): AxisComponent;
    titleCenter(center?: boolean): AxisComponent;
    dxTitle(offset?: number): AxisComponent;
    dyTitle(offset?: number): AxisComponent;
    titleVertical(vertical?: boolean): AxisComponent;
    vertical(vertical?: boolean): AxisComponent;
    yOffset(offset?: number): AxisComponent;
}
declare const axisX: {
    (): AxisComponent;
    time(): AxisComponent;
    ordinal(): any;
    pyramid(): any;
};
declare const axisY: {
    (): AxisComponent;
    time(): AxisComponent;
    ordinal(): any;
};

/**
 * Move behavior
 *
 * The move behavior is used to add a mouseover and touchmove-based interface to a chart.
 *
 * Like other behavior components, this behavior adds an invisible layer over the chart,
 * which the users interact with using touch or mouse actions. The behavior component then interprets
 * these interactions, and calls the relevant event handler callback functions. These callback functions are
 * passed values which represent data-space information about the nature of the interaction.
 * That last sentence was intentionally vague, because different behaviors operate in slightly different ways.
 *
 * The move behavior requires scales to be passed to it as configuration, and when a user interacts with the behavior layer,
 * it inverts the pixel location of the interaction using these scales and passes the resulting data-space values to the callback
 * functions. This component extends a d3.dispatch instance.
 *
 * @module sszvis/behavior/move
 *
 * @property {boolean} debug                      Whether or not to render the component in debug mode, which reveals its position in the chart.
 * @property {function} xScale                    The x-scale for the component. The extent of this scale, plus component padding, is the width of the
 *                                                component's active area.
 * @property {function} yScale                    The y-scale for the component. The extent of this scale, plus component padding, is the height of the
 *                                                component's active area.
 * @property {boolean} draggable                  Whether or not this component is draggable. This changes certain display properties of the component.
 * @property {object} padding                     An object which specifies padding, in addition to the scale values, for the component. Defaults are all 0.
 *                                                The options are { top, right, bottom, left }
 * @property {boolean|function} cancelScrolling   A predicate function, or a constant boolean, that determines whether the browser's default scrolling
 *                                                behavior in response to a touch event should be canceled. In area charts and line charts, for example,
 *                                                you generally don't want to cancel scrolling, as this creates a scroll trap. However, in bar charts
 *                                                which use this behavior, you want to pass a predicate function here which will determine whether the touch
 *                                                event falls within the "profile" of the bar chart, and should therefore cancel scrolling and trigger an event.
 * @property {boolean} fireOnPanOnly              In response to touch events, whether to fire events only while "panning", that is only while performing
 *                                                a touch move where the default scrolling behavior is canceled, and not otherwise. In area and line charts, this
 *                                                should be false, since you want to fire events all the time, even while scrolling. In bar charts, we want to
 *                                                limit the firing of events (and therefore, the showing of tooltips) to only cases where the touch event has its
 *                                                default scrolling prevented, and the user is therefore "panning" across bars. So this should be true for bar charts.
 * @property {string and function} on             The .on() method of this component should specify an event name and an event handler function.
 *                                                Possible event names are:
 *                                                'start' - when the move action starts - mouseover or touchstart
 *                                                'move' - called when a 'moving' action happens - mouseover on the element
 *                                                'drag' - called when a 'dragging' action happens - mouseover with the mouse click down, or touchmove
 *                                                'end' - called when the event ends - mouseout or touchend
 *                                                Event handler functions, excepting end, are passed an x-value and a y-value, which are the data values,
 *                                                computed by inverting the provided xScale and yScale, which correspond to the screen pixel location of the event.
 *
 * @return {sszvis.component}
 */

type MoveScale<T = number | string> = ScaleLinear<number, number> | ScaleBand<T extends string ? T : string> | ScalePoint<T extends string ? T : string>;
type Padding$1 = {
    top: number;
    right: number;
    bottom: number;
    left: number;
};
type Domain = number | string;
type EventHandler = (event: Event, x: number | string | null, y: number | string | null) => void;
interface MoveComponent<XDomain = Domain, YDomain = Domain> extends Component {
    debug(): boolean;
    debug(value: boolean): MoveComponent<XDomain, YDomain>;
    xScale(): MoveScale<XDomain>;
    xScale(scale: MoveScale<XDomain>): MoveComponent<XDomain, YDomain>;
    yScale(): MoveScale<YDomain>;
    yScale(scale: MoveScale<YDomain>): MoveComponent<XDomain, YDomain>;
    draggable(): boolean;
    draggable(value: boolean): MoveComponent<XDomain, YDomain>;
    padding(): Padding$1;
    padding(value: Partial<Padding$1>): MoveComponent<XDomain, YDomain>;
    cancelScrolling(): (x?: XDomain | null, y?: YDomain | null) => boolean;
    cancelScrolling(predicate: boolean | ((x: XDomain | null, y: YDomain | null) => boolean)): MoveComponent<XDomain, YDomain>;
    fireOnPanOnly(): () => boolean;
    fireOnPanOnly(predicate: boolean | (() => boolean)): MoveComponent<XDomain, YDomain>;
    on(eventName: "start", handler: EventHandler): MoveComponent<XDomain, YDomain>;
    on(eventName: "move", handler: EventHandler): MoveComponent<XDomain, YDomain>;
    on(eventName: "drag", handler: EventHandler): MoveComponent<XDomain, YDomain>;
    on(eventName: "end", handler: EventHandler): MoveComponent<XDomain, YDomain>;
    on(eventName: string): EventHandler | undefined;
}
declare function export_default$l<XDomain = number | string, YDomain = number | string>(): MoveComponent<XDomain, YDomain>;

/**
 * Panning behavior
 *
 * This behavior is used for adding "panning" functionality to a set of chart elements.
 * The "panning" functionality refers to a combination of mouseover and touch responsiveness,
 * where on a mouse interaction an event is fired on hover, but the touch interaction is more
 * complex. The idea is to sort of imitate the way a hover interaction works, but with only a
 * finger. When a user starts a touch on an element which has this behavior enabled, the
 * default scrolling behavior of the browser will be canceled. The user can then move
 * their finger across the surface of the screen, onto other elements, and the scroll
 * will be canceled. When the finger moves onto other elements with this behavior attached,
 * the event will be fired. Meanwhile, if the user starts the interaction somewhere outside
 * an element, the scroll will happen as usual, and if they move onto an activated element,
 * no event will be fired and the scrolling will continue.
 *
 * This behavior is applied to all the children of a selection which match the elementSelector
 * property. Event listeners are attached to each of the child elements. The elementSelector
 * property is necessary to know which elements to attach to (and therefore to also avoid
 * attaching event listeners to elements which shouldn't be interaction-active).
 *
 * @module sszvis/behavior/panning
 *
 * @property {String} elementSelector    This should be a string selector that matches child
 *                                       elements of the selection on which this component
 *                                       is rendered using the .call(component) pattern. All
 *                                       child elements will have the panning event listeners
 *                                       attached to them.
 * @property {String, Function} on       The .on() method should specify an event name and a handler
 *                                       function for that event. The supported events are:
 *                                       'start' - when the interaction starts on an element.
 *                                       'pan' - when the user pans on the same element or onto another
 *                                       element (note, no 'start' event will be fired when the user
 *                                       pans with a touch from one element onto another, since this
 *                                       behavior is too difficult to test for and emulate).
 *                                       'end' - when the interaction with an element ends.
 *
 * @return {d3.component}
 */

type PanEventHandler = (event: Event, ...args: unknown[]) => void;
interface PanningComponent extends Component {
    elementSelector(): string;
    elementSelector(selector: string): PanningComponent;
    on(eventName: "start", handler: PanEventHandler): PanningComponent;
    on(eventName: "pan", handler: PanEventHandler): PanningComponent;
    on(eventName: "end", handler: PanEventHandler): PanningComponent;
    on(eventName: string): PanEventHandler | undefined;
}
declare function export_default$k(): PanningComponent;

/**
 * Voronoi behavior
 *
 * The voronoi behavior adds an invisible layer of voronoi cells to a chart. The voronoi cells are calculated
 * based on the positions of the data objects which should be bound to the interaction layer before this behavior
 * is called on it. Each voronoi cell is associated with one data object, and this data object is passed to the event
 * callback functions.
 *
 * Like other behavior components, this behavior adds an invisible layer over the chart,
 * which the users interact with using touch or mouse actions. The behavior component then interprets
 * these interactions, and calls the relevant event handler callback functions. These callback functions are
 * passed values which represent data-space information about the nature of the interaction.
 * That last sentence was intentionally vague, because different behaviors operate in slightly different ways.
 *
 * The voronoi behavior expects to find an array of data already bound to the interaction layer. Each datum should
 * represent a point, and these points are used as the focal points of the construction of voronoi cells. These data
 * are also associated with the voronoi cells, so that when a user interacts with them, the datum and its index within the
 * bound data are passed to the callback functions. This component extends a d3.dispatch instance.
 *
 * The event handler functions are only called when the event happens within a certain distance
 * (see MAX_INTERACTION_RADIUS_SQUARED in this file) from the voronoi area's center.
 *
 * @module sszvis/behavior/voronoi
 *
 * @property {function} x                         Specify an accessor function for the x-position of the voronoi point
 * @property {function} y                         Specify an accessor function for the y-position of the voronoi point
 * @property {array[array, array]} bounds         Specify the bounds of the voronoi area. This is essential to the construction of voronoi cells
 *                                                using the d3.vornoi geom object. The bounds should determine the chart area over which you would like
 *                                                voronoi cells to be active. Note that if not specified, the voronoi cells will be very large.
 * @property {boolean} debug                      Whether the component is in debug mode. Being in debug mode renders the voroni cells obviously
 * @property {string and function} on             The .on() method should specify an event name and an event handler function.
 *                                                Possible event names are:
 *                                                'over' - when the user interacts with a voronoi area, either with a mouseover or touchstart
 *                                                'out' - when the user ceases to interact with a voronoi area, either with a mouseout or touchend
 *                                                All event handler functions are passed the datum which is the center of the voronoi area.
 *                                                Note: previously, event handlers were also passed the index of the datum within the dataset.
 *                                                However, this is no longer the case, due to the difficulty of inferring that information when hit
 *                                                testing a touch interaction on arbitrary rendered elements in the scene. In addition, the 'out' event
 *                                                used to be passed the datum itself, but this is no longer the case, also having to do with the impossibility
 *                                                of guaranteeing that there is a datum at the position of a touch, while "panning".
 *
 */

type VoronoiBounds = [number, number, number, number];
type Accessor<T, R> = (datum: T) => R;
type NumberAccessor<T = unknown> = Accessor<T, number>;
type VoronoiEventHandler<T = unknown> = (event: Event, datum?: T) => void;
interface VoronoiComponent<T = unknown> extends Component {
    x(): NumberAccessor<T>;
    x(accessor: NumberAccessor<T>): VoronoiComponent<T>;
    y(): NumberAccessor<T>;
    y(accessor: NumberAccessor<T>): VoronoiComponent<T>;
    bounds(): VoronoiBounds;
    bounds(bounds: VoronoiBounds): VoronoiComponent<T>;
    debug(): boolean;
    debug(value: boolean): VoronoiComponent<T>;
    on(eventName: "over", handler: VoronoiEventHandler<T>): VoronoiComponent<T>;
    on(eventName: "out", handler: VoronoiEventHandler<T>): VoronoiComponent<T>;
    on(eventName: string): VoronoiEventHandler<T> | undefined;
}
declare function export_default$j<T = unknown>(): VoronoiComponent<T>;

/**
 * Bounds
 *
 * Creates a bounds object to help with the construction of d3 charts
 * that follow the d3 margin convention. The result of this function
 * is consumed by sszvis.createSvgLayer and sszvis.createHtmlLayer.
 *
 * @module sszvis/bounds
 *
 * @see http://bl.ocks.org/mbostock/3019563
 *
 * @property {number} DEFAULT_WIDTH The default width used across all charts
 * @property {number} RATIO The default side length ratio
 *
 * @param {Object} bounds Specifies the bounds of a chart area. Valid properties are:
 *   @property {number} bounds.width The total width of the chart (default: DEFAULT_WIDTH)
 *   @property {number} bounds.height The total height of the chart (default: height / RATIO)
 *   @property {number} bounds.top Top padding (default: 0)
 *   @property {number} bounds.left Left padding (default: 1)
 *   @property {number} bounds.bottom Bottom padding (default: 0)
 *   @property {number} bounds.right Right padding (default: 1)
 * @param {string|d3.selection} [selection] A CSS selector or d3 selection that will be measured to
 *                                          automatically calculate the bounds width and height using
 *                                          the SSZVIS responsive aspect ratio calculation. Custom
 *                                          width and height settings have priority over these auto-
 *                                          matic calculations, so if they are defined, this argument
 *                                          has no effect.
 *                                          This argument is optional to maintain backwards compatibility.
 *
 * @return {Object}              The returned object will preserve the properties width and height, or give them default values
 *                               if unspecified. It will also contain 'innerWidth', which is the width minus left and right padding,
 *                               and 'innerHeight', which is the height minus top and bottom padding. And it includes a 'padding' sub-object,
 *                               which contains calculated or default values for top, bottom, left, and right padding.
 *                               Lastly, the object includes 'screenWidth' and 'screenHeight', which are occasionally used by responsive components.
 */

interface BoundsConfig {
    width?: number;
    height?: number;
    top?: number;
    left?: number;
    bottom?: number;
    right?: number;
}
interface Padding {
    top: number;
    right: number;
    bottom: number;
    left: number;
}
interface BoundsResult {
    height: number;
    width: number;
    innerHeight: number;
    innerWidth: number;
    padding: Padding;
    screenWidth?: number;
    screenHeight?: number;
}
declare const DEFAULT_WIDTH = 516;
/**
 * Creates a bounds object to help with the construction of d3 charts
 * that follow the d3 margin convention.
 *
 * @param bounds Specifies the bounds of a chart area
 * @param selection A CSS selector or d3 selection that will be measured to
 *                  automatically calculate the bounds width and height using
 *                  the SSZVIS responsive aspect ratio calculation. Custom
 *                  width and height settings have priority over these automatic
 *                  calculations, so if they are defined, this argument has no effect.
 *                  This argument is optional to maintain backwards compatibility.
 *
 * @return The returned object will preserve the properties width and height, or give them default values
 *         if unspecified. It will also contain 'innerWidth', which is the width minus left and right padding,
 *         and 'innerHeight', which is the height minus top and bottom padding. And it includes a 'padding' sub-object,
 *         which contains calculated or default values for top, bottom, left, and right padding.
 *         Lastly, the object includes 'screenWidth' and 'screenHeight', which are occasionally used by responsive components.
 */
declare function bounds(): BoundsResult;
declare function bounds(boundsOrSelection: BoundsConfig | string | AnySelection | HTMLElement): BoundsResult;
declare function bounds(bounds: BoundsConfig, selection: string | AnySelection | HTMLElement): BoundsResult;

declare const RATIO: number;

/**
 * Responsive design breakpoints for sszvis
 *
 * @module sszvis/breakpoint
 *
 * Provides breakpoint-related functions, including those which build special
 * breakpoint objects that can be used to test against screen measurements to see
 * if the breakpoint matches, and this module also includes the default breakpoint
 * sizes for SSZVIS. The breakpoints are inclusive upper limits, i.e. when testing a
 * breakpoint against a given set of measurements, if the breakpoint value is greater than
 * or equal to all measurements, the breakpoint will match. In code where the user should
 * supply breakpoints, the user is responsible for specifying the testing order of the breakpoints
 * provided. The breakpoints are then tested in order, and the first one which matches the measurements
 * is chosen. The user should, where possible, specify breakpoints in increasing order of size.
 * Since there are multiple dimensions on which 'size' can be defined, we do not specify our own
 * algorithm for sorting user-defined breakpoints. We rely on the judgment of the user to do that.
 *
 * @property {Function} createSpec
 * @property {Function} defaultSpec
 * @property {Function} findByName
 * @property {Function} find
 * @property {Function} match
 * @property {Function} test
 *
 * @property {Function} palm Breakpoint for plam-sized devices (phones)
 * @property {Function} lap  Breakpoint for lap-sized devices (tablets, small notebooks)
 *
 * @type Measurement {
 *   width: number,
 *   screenHeight: number
 * }
 *
 * @type Breakpoint {
 *   name: string,
 *   measurement: Measurement
 * }
 */

interface BreakpointWithMeasurement {
    name: string;
    measurement: Partial<Measurement>;
}
interface BreakpointWithInlineProps extends Partial<Measurement> {
    name: string;
}
type PartialBreakpoint = BreakpointWithMeasurement | BreakpointWithInlineProps;
/**
 * breakpoint.find
 *
 * Returns the first matching breakpoint for a given measurement
 *
 * @param {Array<Breakpoint>} breakpoints A breakpoint spec
 * @param {Measurement} partialMeasurement A partial measurement to match to the spec
 * @returns {Breakpoint}
 */
declare function breakpointFind(breakpoints: Breakpoint[], partialMeasurement: Partial<Measurement>): Breakpoint | undefined;
/**
 * breakpoint.findByName
 *
 * Returns the breakpoint with the given name. If there is no such breakpoint,
 * undefined is returned
 *
 * @param {Array<Breakpoint>} breakpoints A breakpoint spec
 * @param {string} name A breakpoint name
 * @returns {Breakpoint?} If no breakpoint matches, undefined is returned. If a
 *          breakpoint for the given name exists, that breakpoint is returned
 */
declare function breakpointFindByName(breakpoints: Breakpoint[], name: string): Breakpoint | undefined;
/**
 * breakpoint.test
 *
 * Returns true if the given measurement fits within the breakpoint.
 *
 * @param {Breakpoint} breakpoint A single breakpoint
 * @param {Measurement} partialMeasurement A partial measurement to match to the breakpoint
 * @returns {boolean}
 */
declare function breakpointTest(breakpoint: Breakpoint, partialMeasurement: Partial<Measurement>): boolean;
/**
 * breakpoint.match
 *
 * Returns an array of breakpoints the given measurement fits into. Use this in situations
 * where you need to match a sparse list of breakpoints.
 *
 * @param {Array<Breakpoint>} breakpoints A breakpoint spec
 * @param {Measurement} partialMeasurement A partial measurement to match to the spec
 * @returns {Array<Breakpoint>}
 */
declare function breakpointMatch(breakpoints: Breakpoint[], partialMeasurement: Partial<Measurement>): Breakpoint[];
/**
 * breakpoint.createSpec
 *
 * Parses an array of partial breakpoints into a valid breakpoint spec.
 *
 * @param {Array<{name: string, width?: number, screenHeight?: number}>} spec An array
 *        of breakpoint definitions. All breakpoints are parsed into a full representation,
 *        so it's possible to only provide partial breakpoint definitions.
 * @returns {Array<Breakpoint>}
 */
declare function breakpointCreateSpec(spec: PartialBreakpoint[]): Breakpoint[];
/**
 * breakpoint.defaultSpec
 *
 * @returns {Array<{name: string, width: number, screenHeight: number}>} The SSZVIS
 *          default breakpoint spec.
 */
declare const breakpointDefaultSpec: () => Breakpoint[];
declare const breakpointPalm: (measurement: Partial<Measurement>) => boolean;
declare const breakpointLap: (measurement: Partial<Measurement>) => boolean;

/**
 * Cascade module
 *
 * @module sszvis/cascade
 *
 * sszvis.cascade is a module that can be useful for creating nested data structures.
 * It can be used in similar ways to d3.nest, but should not be conflated with d3.nest,
 * since it provides different behavior.
 *
 * The cascade class is not a data structure. Rather, it is used to create a data structue
 * generator. An instance of the cascade class should be configured to specify the desired
 * characteristics of the resulting data structure, and then applied to a flat array of
 * objects in order to generate the data structure.
 *
 * Fundamental to the cascade class is the concept of "groupBy", which is an operation that
 * transforms a flat array of data into a nested data structure. It does this by
 * passing each value in the flat array through an accessor function, and "groping" those
 * elements based on the return value of that function. Every element in the resulting groups
 * will have produced the same value when passed into the accessor function.
 *
 * For example, if a flat data set contains a number of elements, and some have a value "city = Zurich",
 * while others have a value "city = Basel", performing a groupBy operation on this data set
 * and passing a predicate function which returns the value of the "city" property of these objects
 * will form the objects into groups where all objects in one group have "city = Zurich", and all objects
 * in the other group have "city = Basel".
 *
 * The Cascade module abstracts the concept of "groupBy" on multiple levels, and provides the option
 * to arrange the resultant groups in different ways.
 *
 * There are two options for the form of the resulting groups. (This is where sszvis.cascade
 * diverges in behavior from d3.nest, which offers two options, but they must be the same through
 * the entire data structure):
 *
 * In one version, the groups are formed into a plain Javascript object with key -> value pairs. The keys are
 * the set of results from the grouping function. (In our example, the keys would be "Zurich" and "Basel")
 * In this implementation, the values are each arrays of elements which share the value of the key function.
 * However, these objects may be nested arbitrarily deep. If multiple layers of objects are specified, then the
 * values will themselves be objects with key -> value pairs, and so on. The final layer of objects will have
 * arrays for values, where each element in the arrays is a data object which shares values for all of the specified
 * key properties with the other objects in its array.
 *
 * Alternatively, the input array of objects can be grouped into an array of groups, where the groups
 * contain data values which all share the same value for a certain key property. These, too, can be nested.
 * The sub-groups may be formed as arrays, where each element in the next level is grouped
 * according to the same principle, but with a different key function. Alternatively, the groups may be
 * objects, grouped according to the principle described in the first version. It is up to the user of the
 * class to specify the extent and nature of this nesting. If an array of groups is the last level of the cascade,
 * its values will be arrays of data values.
 *
 * At the base of the cascade, regardless of the types of the levels, will be arrays of data objects. These arrays
 * can also be thought of as containing the leaves of the tree structure.
 *
 * Instances of this class are configured using three methods: "objectBy", "arrayBy", and "sort". They are used by
 * calling the "apply" method, passing a flat array of data objects. The first three methods return the instance
 * to enable method chaining, while "apply" returns the nested data structure.
 *
 * @method objectBy         Takes as argument a predicate function which is called on each element in an input array. The
 *                          return values of this function are used to create an object with key -> value pairs, where the keys
 *                          are the results of the calls to the predicate function and the values are a further layer of the cascade.
 * @method arrayBy          Takes as argument a predicate function which is called on each element in an input array. The
 *                          return values of this function are used to create an array, where each element of the array
 *                          is a further layer of the cascade. arrayBy also takes an optional second parameter, which specifys
 *                          a sorting function. If provided, groups in the resulting array will be sorted by passing the key values
 *                          of the groups through the sorting function. For example, if an alphabetical sort function is passed
 *                          as the second parameter to an arrayBy call in the example above, the resulting array will be sorted
 *                          such that the first group is the one with "city = Basel" and the second group is the one with "city = Zurich".
 *                          The sort function should take the usual form of a function passed to Array.prototype.sort().
 * @method sort             This method specifies a sort function for the very last layer of the cascade, which is always arrays of data objects.
 *                          the sort function passed to this method should accept data objects as values.
 *
 * @returns                 An instance of sszvis.cascade
 */
type KeyAccessor$2<T, K = string | number> = (datum: T) => K;
type KeySorter<K = string | number> = (a: K, b: K) => number;
type ValueSorter<T> = (a: T, b: T) => number;
interface CascadeInstance<T> {
    apply(data: T[]): any;
    objectBy<K extends string | number>(accessor: KeyAccessor$2<T, K>): CascadeInstance<T>;
    arrayBy<K extends string | number>(accessor: KeyAccessor$2<T, K>, sorter?: KeySorter<K>): CascadeInstance<T>;
    sort(sorter: ValueSorter<T>): CascadeInstance<T>;
}
declare function cascade<T = any>(): CascadeInstance<T>;

/**
 * Color scales
 *
 * Three kinds of color scales are provided: qualitative, sequential, and
 * diverging. All color scales can be reversed, qualitative color scales
 * can also be brightened or darkened.
 *
 * @module sszvis/color
 *
 *
 * Qualitative color scales
 *
 * @function qual12    The full range of categorical colors
 * @function qual6     Subset of saturated categorical colors
 * @function qual6a    Subset of blue-green categorical colors
 * @function qual6b    Subset of yellow-red categorical colors
 * @method   darken    Instance method to darken all colors. @returns new scale
 * @method   brighten  Instance method to brighten all colors. @returns new scale
 * @method   reverse   Instance method to reverse the color order. @returns new scale
 *
 *
 * Sequential color scales
 *
 * @function seqBlu    Linear color scale from bright to dark blue
 * @function seqRed    Linear color scale from bright to dark red
 * @function seqGrn    Linear color scale from bright to dark green
 * @function seqBrn    Linear color scale from bright to dark brown
 * @method   reverse   Instance method to reverse the color order. @returns new scale
 *
 *
 * Diverging color scales
 *
 * @function divVal    Diverging and valued color scale from red to blue
 * @function divNtr    Diverging and neutral color scale from brown to green
 * @function divValGry constiation of the valued scale with a grey midpoint
 * @function divNtrGry constiation of the neutral scale with a grey midpoint
 * @method   reverse   Instance method to reverse the color order. @returns new scale
 *
 * Grey color scales
 * @function gry       1-color scale for shaded values
 * @function lightGry  1-color scale for shaded backgrounds
 */

/**
 * Extended ordinal scale with additional methods for color manipulation
 */
interface ExtendedOrdinalScale extends ScaleOrdinal<string, LabColor> {
    /**
     * Create a darker version of the scale
     */
    darker(): ExtendedOrdinalScale;
    /**
     * Create a brighter version of the scale
     */
    brighter(): ExtendedOrdinalScale;
    /**
     * Reverse the color order
     */
    reverse(): ExtendedOrdinalScale;
}
/**
 * Extended linear scale with additional methods for color manipulation
 */
interface ExtendedLinearScale extends ScaleLinear<LabColor, LabColor> {
    /**
     * Reverse the color order
     */
    reverse(): ExtendedLinearScale;
}
/**
 * Extended diverging scale with additional methods for color manipulation
 */
interface ExtendedDivergingScale extends ScaleLinear<LabColor, LabColor> {
    /**
     * Reverse the color order
     */
    reverse(): ExtendedDivergingScale;
}
/**
 * Color scale factory function type
 */
type ColorScaleFactory<T> = () => T;
declare const scaleQual12: ColorScaleFactory<ExtendedOrdinalScale>;
declare const scaleQual6: ColorScaleFactory<ExtendedOrdinalScale>;
declare const scaleQual6a: ColorScaleFactory<ExtendedOrdinalScale>;
declare const scaleQual6b: ColorScaleFactory<ExtendedOrdinalScale>;
declare const scaleGender3: () => ExtendedOrdinalScale;
declare const scaleGender6Origin: () => ExtendedOrdinalScale;
declare const scaleGender5Wedding: () => ExtendedOrdinalScale;
declare const scaleSeqBlu: ColorScaleFactory<ExtendedLinearScale>;
declare const scaleSeqRed: ColorScaleFactory<ExtendedLinearScale>;
declare const scaleSeqGrn: ColorScaleFactory<ExtendedLinearScale>;
declare const scaleSeqBrn: ColorScaleFactory<ExtendedLinearScale>;
declare const scaleDivVal: ColorScaleFactory<ExtendedDivergingScale>;
declare const scaleDivValGry: ColorScaleFactory<ExtendedDivergingScale>;
declare const scaleDivNtr: ColorScaleFactory<ExtendedDivergingScale>;
declare const scaleDivNtrGry: ColorScaleFactory<ExtendedDivergingScale>;
declare const scaleLightGry: ColorScaleFactory<ExtendedLinearScale>;
declare const scalePaleGry: ColorScaleFactory<ExtendedLinearScale>;
declare const scaleGry: ColorScaleFactory<ExtendedLinearScale>;
declare const scaleDimGry: ColorScaleFactory<ExtendedLinearScale>;
declare const scaleMedGry: ColorScaleFactory<ExtendedLinearScale>;
declare const scaleDeepGry: ColorScaleFactory<ExtendedLinearScale>;
declare const slightlyDarker: (c: string) => HSLColor;
declare const muchDarker: (c: string) => HSLColor;
declare const withAlpha: (c: string, a: number) => string;
declare const getAccessibleTextColor: (backgroundColor: string | null) => string;

/**
 * Bar component
 *
 * The bar component is a general-purpose component used to render rectangles, including
 * bars for horizontal and vertical standard and stacked bar charts, bars in the population
 * pyramids, and the boxes of the heat table.
 *
 * The input data should be an array of data values, where each data value contains the information
 * necessary to render a single rectangle. The x-position, y-position, width, and height of each rectangle
 * are then extracted from the data objects using accessor functions.
 *
 * In addition, the user can specify fill and stroke accessor functions. When called, these functions
 * are given each rectangle's data object, and should return a valid fill or stroke color to be applied
 * to the rectangle.
 *
 * The x, y, width, height, fill, and stroke properties may also be specified as constants.
 *
 * @module sszvis/component/bar
 *
 * @template T The type of the data values bound to the bars
 *
 * @property {number, function} x             the x-value of the rectangles. Becomes a functor.
 * @property {number, function} y             the y-value of the rectangles. Becomes a functor.
 * @property {number, function} width         the width-value of the rectangles. Becomes a functor.
 * @property {number, function} height        the height-value of the rectangles. Becomes a functor.
 * @property {string, function} fill          the fill-value of the rectangles. Becomes a functor.
 * @property {string, function} stroke        the stroke-value of the rectangles. Becomes a functor.
 * @property {boolean} centerTooltip          Whether or not to center the tooltip anchor within the bar.
 *                                            The default tooltip anchor position is at the top of the bar,
 *                                            centered in the width dimension. When this property is true,
 *                                            the tooltip anchor will also be centered in the height dimension.
 * @property {Array<Number>} tooltipAnchor    Where, relative to the box formed by the bar, to position the tooltip
 *                                            anchor. This property is overriden if centerTooltip is true. The
 *                                            value should be a two-element array, [x, y], where x is the position (in 0 - 1)
 *                                            of the tooltip in the width dimension, and y is the position (also range 0 - 1)
 *                                            in the height dimension. For example, the upper left corner would be [0, 0],
 *                                            the center of the bar would be [0.5, 0.5], the middle of the right side
 *                                            would be [1, 0.5], and the lower right corner [1, 1]. Used by, for example,
 *                                            the pyramid chart. Entries beyond the first two are ignored, and an array
 *                                            with fewer than two entries produces a NaN coordinate rather than a warning.
 * @property {boolean} transition             Whether or not to transition the visual values of the bar component, when they
 *                                            are changed.
 *
 * Note: the transition property does not currently animate anything - the geometry is
 * re-applied to the plain selection immediately after the transition is created, so the
 * values always jump. It is not free either: the discarded transition still attaches d3
 * transition state to every bar, which interrupts any transition already running on them.
 * See test/component/bar.test.ts.
 *
 * @return {sszvis.component}
 */

/**
 * Every visual property is wrapped by fn.functor on set, so it is always stored as a
 * function by the time the renderer reads it. The result stays `unknown` because the
 * missing-value guard passes anything that coerces to a number straight through, a numeric
 * string or a boolean included.
 */
type ValueAccessor$2<T> = (datum?: T, index?: number) => unknown;
/**
 * fill and stroke resolve to a colour, or to nothing when the property was never set -
 * fn.functor then yields undefined, which d3 treats exactly like null and removes the
 * attribute for.
 */
type ColorAccessor$2<T> = (datum?: T, index?: number) => string | null;
/**
 * A constant or an accessor over the component's datum type; either is accepted, since
 * fn.functor normalises both. d3 hands an accessor the datum and its index, and declaring
 * fewer parameters is fine.
 */
type BarValue<T, R> = R | ((datum: T, index: number) => R);
interface BarComponent<T = unknown> extends Component {
    x(): ValueAccessor$2<T>;
    x<U = T>(value: BarValue<U, number>): BarComponent<T>;
    y(): ValueAccessor$2<T>;
    y<U = T>(value: BarValue<U, number>): BarComponent<T>;
    width(): ValueAccessor$2<T>;
    width<U = T>(value: BarValue<U, number>): BarComponent<T>;
    height(): ValueAccessor$2<T>;
    height<U = T>(value: BarValue<U, number>): BarComponent<T>;
    fill(): ColorAccessor$2<T>;
    fill<U = T>(value: BarValue<U, string | undefined>): BarComponent<T>;
    stroke(): ColorAccessor$2<T>;
    stroke<U = T>(value: BarValue<U, string | undefined>): BarComponent<T>;
    centerTooltip(): boolean | undefined;
    centerTooltip(center: boolean): BarComponent<T>;
    tooltipAnchor(): (number | string)[] | undefined;
    tooltipAnchor(anchor: (number | string)[]): BarComponent<T>;
    transition(): boolean;
    transition(enabled: boolean): BarComponent<T>;
}
declare function export_default$i<T = unknown>(): BarComponent<T>;

/**
 * Dot component
 *
 * Used to render small circles, where each circle corresponds to a data value. The dot component
 * is built on rendering svg circles, so the configuration properties are directly mapped to circle attributes.
 *
 * The input data should be an array of data values, where each data value contains the information
 * necessary to render a single circle. The x-position, y-position and radius are extracted from the
 * data objects using accessor functions, as are the fill and stroke colors. Every property may also
 * be specified as a constant. One tooltip anchor is rendered per datum, as an invisible 1x1 rect at
 * the center of the circle.
 *
 * @module sszvis/component/dot
 *
 * @template T The type of the data values bound to the dots
 *
 * @property {number, function} x               An accessor function or number for the x-position of the dots.
 *                                              Becomes a functor. Required: see the note on missing properties below.
 * @property {number, function} y               An accessor function or number for the y-position of the dots.
 *                                              Becomes a functor. Required, like x.
 * @property {number, function} radius          An accessor function or number for the radius of the dots.
 *                                              Not wrapped in fn.functor, so the getter returns whatever was
 *                                              set rather than a function. When it is left unset no r attribute
 *                                              is written, SVG defaults r to 0, and the dots are invisible -
 *                                              silently, since only x and y are checked. A radius of 0 is also
 *                                              how docs/scatterplot-over-time hides dots outside the selected
 *                                              period.
 * @property {string, function} stroke          An accessor function or string for the stroke color of the dots.
 *                                              Not wrapped in fn.functor. When unset, no stroke attribute is
 *                                              written and the circles fall back to the SVG and CSS defaults.
 * @property {string, function} fill            An accessor function or string for the fill color of the dots.
 *                                              Same as stroke.
 * @property {boolean} transition               Whether or not to transition the visual values of the dot
 *                                              component, when they are changed. Defaults to true.
 *
 * Note: x and y are required, and their absence is not reported as such. The circle attributes
 * survive an unset property, because d3 drops an attribute whose value is undefined, but the
 * tooltip anchor calls the accessor directly and throws a TypeError from d3's internals that
 * names neither the property nor the component. The failure depends on the data, so an empty
 * first render succeeds and the same chart throws as soon as data arrives. It also happens
 * after the circles and the anchor rects have been created, so a caller that catches it is
 * left with a partially updated chart.
 *
 * Note: the transition property does not currently animate anything - the data join writes the
 * geometry to the elements first and the transition then re-applies the same values, so every
 * tween runs from a value to itself and the geometry always jumps. It is not free either: each
 * render schedules three attribute tweens on every circle, and those schedules accumulate until
 * they start, at which point d3 cancels the superseded ones and interrupts any transition
 * already running on those nodes. fill and stroke are applied only on the join and are never
 * transitioned, so color changes jump whatever this property is set to.
 *
 * Note: unlike bar, dot has no missing-value guard. Whatever an accessor returns is written into
 * the attribute verbatim, so a NaN coordinate - the usual result of feeding a scale a value
 * outside its domain - produces an invalid attribute that the browser ignores, leaving the dot
 * at the origin, while a NaN or negative radius makes the circle disappear. Strings, booleans
 * and Infinity are written unchanged too, and all of it fails silently. undefined and null are
 * the exception: d3 removes the attribute for them.
 *
 * Note: the tooltip anchor reads its position as props.x(d) and props.y(d), without d3's index
 * argument, so an accessor that uses the index positions the circles correctly but yields
 * translate(NaN,NaN) for every anchor. The anchor ignores the radius, and is created and
 * positioned even for a dot hidden with radius 0, which leaves a live tooltip target on an
 * invisible dot. x and y are read three times per datum on every render - twice for the circle
 * and once for the anchor - and radius twice, so accessors should be cheap and free of side
 * effects. See test/component/dot.test.ts.
 *
 * @return {sszvis.component}
 */

/**
 * An accessor as d3 calls it, with the datum and its index. Declaring fewer parameters is
 * fine, so `(d) => d.x` and `(_d, i) => i * 10` are both assignable.
 */
type ValueAccessor$1<T, R> = (datum: T, index: number) => R;
/**
 * How an accessor reads back once it is stored. Both parameters are optional because a
 * constant handed to x or y becomes a functor that ignores its arguments, and because the
 * tooltip anchor below calls x and y with the datum alone. One of these is still assignable
 * to a setter, so a value read from a getter can be handed straight back.
 */
type StoredAccessor$2<T, R> = (datum?: T, index?: number) => R;
/**
 * A constant or an accessor; either is accepted for every visual property. x and y are
 * wrapped by fn.functor on set, so a constant handed to them is stored as a function.
 */
type DotValue<T, R> = R | ValueAccessor$1<T, R>;
/**
 * radius, stroke and fill are declared without fn.functor, so they are stored exactly as
 * they were set: either a constant or an accessor. An accessor may resolve to null or
 * undefined to leave the attribute off, which is how d3 reads both, so the alias is
 * nullish-aware and the setters accept every value the getters can report.
 */
type RawValue<T, R> = DotValue<T, R | null | undefined>;
/** The getter counterpart of RawValue: the constant or the accessor that was set. */
type StoredRawValue<T, R> = R | null | undefined | StoredAccessor$2<T, R | null | undefined>;
interface DotComponent<T = unknown> extends Component {
    x(): StoredAccessor$2<T, number>;
    x<U = T>(value: DotValue<U, number>): DotComponent<T>;
    y(): StoredAccessor$2<T, number>;
    y<U = T>(value: DotValue<U, number>): DotComponent<T>;
    radius(): StoredRawValue<T, number>;
    radius<U = T>(value: RawValue<U, number>): DotComponent<T>;
    stroke(): StoredRawValue<T, string>;
    stroke<U = T>(value: RawValue<U, string>): DotComponent<T>;
    fill(): StoredRawValue<T, string>;
    fill<U = T>(value: RawValue<U, string>): DotComponent<T>;
    transition(): boolean;
    transition(enabled: boolean): DotComponent<T>;
}
declare function export_default$h<T = unknown>(): DotComponent<T>;

/**
 * Grouped Bars component
 *
 * This component includes both the vertical and horizontal grouped bar chart components.
 * Both are variations on the same concept, using the same grouping logic but rendered
 * using different dimensions.
 *
 * The input to the grouped bar component should be an array of arrays, where each inner
 * array contains the bars for a single group. Each of the inner arrays becomes a group, and
 * each element in those inner arrays becomes a bar.
 *
 * In addition to the raw data, the user must provide other information necessary for calculating
 * the layout of the groups of bars, namely the number of bars in each group (this component requires that
 * all groups have the same number of bars), a scale for finding the offset of each group (usually an
 * instance of d3.scaleBand), a width/height for groups, and position/dimension scales for the bars in the group.
 * Note that the number of bars in each group and the group width/height determines how wide/tall each bar will be,
 * and this is calculated internally to the groupedBars component.
 *
 * The groups are calculated and laid out entirely by the groupedBars component.
 *
 * @module sszvis/component/groupedBars/vertical
 * @module sszvis/component/groupedBars/horizontal
 * @template T The type of the data objects in the bar groups
 *
 * @property {scale} groupScale         This should be a scale function for determining the correct group offset of a member of a group.
 *                                      This function is passed the group member, and should return a value for the group offset which
 *                                      is the same for all members of the group. The within-group offset (which is different for each member)
 *                                      is then added to this group offset in order to position the bars individually within the group.
 *                                      So, for instance, if the groups are based on the "city" property, the groupScale should return
 *                                      the same value for all data objects with "city = Zurich".
 * @property {number} groupSize         This property tells groupedBars how many bars to expect for each group. It is used to assist in
 *                                      calculating the within-group layout and size of the bars. This number is treated as the same for all
 *                                      groups. Groups with less members than this number will have visible gaps. (Note that having less members
 *                                      in a group is not the same as having a member with a missing value, which will be discussed later)
 * @property {number} groupWidth        The width of the groups (vertical orientation). This value is treated as the same for all groups.
 *                                      The width available to the groups is divided up among the bars.
 * @property {number} groupHeight       The height of the groups (horizontal orientation). This value is treated as the same for all groups.
 *                                      The height available to the groups is divided up among the bars.
 * @property {number} groupSpace        The percentage of space between each bar within a group. (default: 0.05). Usually the default is fine here.
 * @property {function} x               The x-position of the bars (horizontal orientation). This function is given a data value and should return
 *                                      an x-value. Used for horizontal grouped bars.
 * @property {function} y               The y-position of the bars (vertical orientation). This function is given a data value and should return
 *                                      a y-value. Used for vertical grouped bars.
 * @property {function} width           The width of the bars (horizontal orientation). This function is given a data value and should return
 *                                      a width value. Used for horizontal grouped bars.
 * @property {function} height          The height of the bars (vertical orientation). This function is given a data value and should return
 *                                      a height value. Used for vertical grouped bars.
 * @property {string, function} fill    A functor which gives the color for each bar (often based on the bar's group). This can be a string or a function.
 * @property {string, function} stroke  The stroke color for each bar (default: none)
 * @property {function} defined         A predicate function which can be used to determine whether a bar has a defined value. (default: true).
 *                                      Any bar for which this function returns false, meaning that it has an undefined (missing) value,
 *                                      will be displayed as a faint "x" in the grouped bar chart. This is in order to distinguish bars with
 *                                      missing values from bars with very small values, which would display as a very thin rectangle.
 *
 * @return {sszvis.component}
 */

interface GroupedBarsComponent<T = unknown> extends Component {
    groupScale(): (datum: T) => number;
    groupScale<U = T>(scale: (datum: U) => number | undefined): GroupedBarsComponent<T>;
    groupSize(): number;
    groupSize(size: number): GroupedBarsComponent<T>;
    groupWidth(): number;
    groupWidth(width: number): GroupedBarsComponent<T>;
    groupHeight(): number;
    groupHeight(height: number): GroupedBarsComponent<T>;
    groupSpace(): number;
    groupSpace(space: number): GroupedBarsComponent<T>;
    x(): (datum: T, index: number) => number;
    x<U = T>(accessor: (datum: U, index: number) => number): GroupedBarsComponent<T>;
    y(): (datum: T, index: number) => number;
    y<U = T>(accessor: (datum: U, index: number) => number): GroupedBarsComponent<T>;
    width(): number | ((datum: T) => number);
    width<U = T>(value: number | ((datum: U) => number)): GroupedBarsComponent<T>;
    height(): number | ((datum: T) => number);
    height<U = T>(value: number | ((datum: U) => number)): GroupedBarsComponent<T>;
    fill(): string | ((datum: T) => string);
    fill<U = T>(value: string | ((datum: U) => string)): GroupedBarsComponent<T>;
    stroke(): string | ((datum: T) => string) | undefined;
    stroke<U = T>(value: string | ((datum: U) => string) | undefined): GroupedBarsComponent<T>;
    defined(): (datum: T) => boolean;
    defined<U = T>(predicate: boolean | ((datum: U) => boolean)): GroupedBarsComponent<T>;
}
declare const groupedBarsVertical: <T = unknown>() => GroupedBarsComponent<T>;
declare const groupedBarsHorizontal: <T = unknown>() => GroupedBarsComponent<T>;
/**
 * The default grouped bars component is the vertical version.
 *
 * @deprecated Use `groupedBarsVertical` instead.
 */
declare const groupedBars: <T = unknown>() => GroupedBarsComponent<T>;

/**
 * Stacked Bar components
 *
 * This module holds the vertical and the horizontal stacked bar chart, together with the two
 * data layout functions that prepare their input. Both components are variations on the same
 * concept and read the same intermediate representation of a stack, but they lay it out along
 * different dimensions, which is why there are two constructors rather than an orientation
 * property.
 *
 * The layout functions, stackedBarVerticalData and stackedBarHorizontalData, take their
 * accessors in the order (stackAcc, seriesAcc, valueAcc) and return a function over a flat
 * array of rows: stackAcc groups the rows into stacks, seriesAcc into the layers within a
 * stack, and valueAcc supplies the number that is stacked. The accessors are deliberately not
 * named after the axes, because which axis each one belongs to depends on the orientation: the
 * examples call stackedBarVerticalData(xAcc, cAcc, yAcc) but stackedBarHorizontalData(yAcc,
 * cAcc, xAcc) - see docs/bar-chart-vertical-stacked/basic.js and
 * docs/bar-chart-horizontal-stacked/basic.js.
 *
 * The result is an array of series, one per series key, each holding the [y0, y1] pairs
 * d3.stack computed, and each pair tagged with its `series`, its `stack` and, as `data`, the
 * single source row it was computed from. That array is what gets bound to the chart layer. The
 * rows passed in are not modified: the d3v3 stack layout used to write `y0` and `y` onto every
 * data object, but d3v7 returns pairs instead and leaves the source data alone.
 *
 * @module sszvis/component/stackedBar/horizontal
 * @module sszvis/component/stackedBar/vertical
 *
 * @requires sszvis.component.bar
 *
 * @template T The type of the data objects behind the stack slices
 * @template X The type of the stack values, i.e. the domain of the ordinal scale
 *
 * @property {function} xScale          Required. On a vertical chart, a band scale over the
 *                                      stack values, used to position each stack. On a
 *                                      horizontal chart, a linear scale over the stacked
 *                                      values, used for both the left edge and the width of
 *                                      every segment. Not defaulted: unset, it throws.
 * @property {function} yScale          Required, and the mirror image of xScale. On a vertical
 *                                      chart, a linear scale over the stacked values, used for
 *                                      both the top edge and the height of every segment; on a
 *                                      horizontal chart, a band scale over the stack values.
 *                                      Also not defaulted, and also throws when unset.
 * @property {number, function} width   Required by the vertical orientation, which sizes its
 *                                      bars with it - usually xScale.bandwidth(). The
 *                                      horizontal orientation computes its width from xScale
 *                                      and never reads the property. Omitting it on a vertical
 *                                      chart is not reported: every bar gets width 0.
 * @property {number, function} height  Required by the horizontal orientation, and ignored by
 *                                      the vertical one, which computes its height from yScale.
 *                                      Fails just as silently when omitted on a horizontal
 *                                      chart: every bar gets height 0.
 * @property {string, function} fill    Optional. A constant or an accessor over a slice. When
 *                                      unset, no fill attribute is written at all and the
 *                                      rectangles fall back to the SVG/CSS default.
 * @property {string, function} stroke  Optional. A constant or an accessor over a slice. When
 *                                      unset, a 1px #FFFFFF stroke separates the segments -
 *                                      centred on the bar edge, so it overpaints half a pixel
 *                                      on each side. A truthy value such as "none" replaces the
 *                                      separator, but every falsy value falls back to it, so it
 *                                      cannot be removed by null or an empty string.
 *
 * Note: the two layout functions are the same computation and differ only in the stack order,
 * i.e. in which series key ends up on the baseline. The vertical layout stacks in reverse key
 * order, so the last key sits on the baseline; the horizontal one keeps the key order, so the
 * first key does.
 *
 * Note: the value of a cell is read from its first row only, so data that is not already
 * aggregated to one row per (stack, series) pair is silently truncated rather than summed. The
 * same unguarded read throws when a stack is missing one of the series keys, so every stack has
 * to carry a row for every series - callers with sparse data have to pad it with zero rows.
 *
 * Note: the series keys come from Object.keys over the grouped data, and JavaScript orders
 * integer-like keys numerically regardless of insertion order. A series accessor returning
 * years or numeric codes therefore loses the caller's ordering, and since the key order is the
 * stacking order, the stack silently changes shape. The stacks themselves are reordered the
 * same way, which is only cosmetic, since each slice is positioned by its own stack value.
 *
 * Note: `keys` and `maxValue` are hung off the returned array rather than wrapped in an object,
 * so any array operation - a spread, a map, a filter, a trip through JSON - drops them, and
 * `keys` shadows Array.prototype.keys, which makes the layout a badly behaved array. `maxValue`
 * is the maximum of the upper bounds only, so it is not the extent of the data when a value is
 * negative, and it is undefined rather than 0 for an empty layout, which turns into a NaN axis
 * when it is fed straight into a scale domain the way the examples do.
 *
 * Note: a negative value produces a negative rect width on a horizontal chart, which the
 * browser rejects, so the segment is simply not drawn. Neither orientation supports values
 * below the baseline.
 *
 * Note: the four scale and size properties are required but neither defaulted nor validated.
 * Two of them fail silently as zero-size bars, and the two scales throw a low-level TypeError
 * that names neither the property nor the component.
 *
 * Note: the group join uses the descendant selector `.sszvis-stack` rather than a child
 * selector and no key function, so any pre-existing stack below the target group, at any depth,
 * is captured and re-bound, and surviving groups and rects are matched by index rather than by
 * series. The component also forwards neither bar's `transition` property nor its tooltip
 * anchor properties, so every render attaches a transition that is immediately discarded, and
 * the tooltip anchor is always at the top centre of a segment. See
 * test/component/stackedBar.test.ts.
 *
 * @return {sszvis.component}
 */

/**
 * One slice of a stack: the [y0, y1] point d3.stack produces, with `data` narrowed from the
 * whole cascade row to the single datum the slice was computed from, and tagged with the
 * series and the stack it belongs to. It is d3's own SeriesPoint, which is why it is an
 * Array rather than a two-element tuple.
 */
type StackedBarSlice$1<T, X extends string | number = string> = SeriesPoint<T> & {
    /** The series key the slice belongs to. */
    series: string;
    /** The stack the slice belongs to, as the stack accessor returned it. */
    stack: X;
};
/** All slices sharing a series key, i.e. one layer of the stack, as d3 hands it over. */
type StackedBarSeries$1<T, X extends string | number = string> = StackedBarSlice$1<T, X>[] & {
    key: string;
    index: number;
};
/**
 * What stackedBar*Data returns: the series, with the series keys and the largest stacked
 * total hung off the array itself rather than wrapped in an object.
 *
 * `keys` shadows Array.prototype.keys, so the inherited member is omitted before the
 * property is declared. Intersecting the two instead would leave the layout callable as
 * `layout.keys()`, which type-checks as the built-in iterator but throws a TypeError at
 * runtime. Omitting it costs assignability back to a plain array, which is the point: the
 * layout is not a well-behaved one. Indexing, length, the array methods, spread and for-of
 * all still work.
 */
type StackedBarLayout<T, X extends string | number = string> = Omit<StackedBarSeries$1<T, X>[], "keys"> & {
    keys: string[];
    maxValue: number | undefined;
};
declare const stackedBarHorizontalData: <T, X extends string | number = string>(_stackAcc: (datum: T) => X, seriesAcc: (datum: T) => string | number, valueAcc: (datum: T) => number) => (data: T[]) => StackedBarLayout<T, X>;
declare const stackedBarVerticalData: <T, X extends string | number = string>(_stackAcc: (datum: T) => X, seriesAcc: (datum: T) => string | number, valueAcc: (datum: T) => number) => (data: T[]) => StackedBarLayout<T, X>;
/** A scale over the stack values - a band scale in practice, hence the undefined. */
type StackScale<X> = (value: X) => number | undefined;
/** A scale over the stacked values. */
type ValueScale = (value: number) => number;
/** A constant or an accessor over one slice; fn.functor normalises both on set. */
type SliceValue<U, R> = R | ((slice: U, index: number) => R);
/**
 * How a bar dimension reads back once it is stored: the four dimensions are wrapped by
 * fn.functor on set, so they are always functions by the time the renderer reads them. Both
 * parameters are optional because a constant becomes a functor that ignores its arguments.
 */
type StoredDimension<T, X extends string | number> = (slice?: StackedBarSlice$1<T, X>, index?: number) => number;
/** fill is stored exactly as set, and may be left unset, in which case no fill is written. */
type FillValue$1<T, X extends string | number> = SliceValue<StackedBarSlice$1<T, X>, string | undefined>;
/**
 * stroke is stored exactly as set. Every falsy value is accepted and means the same thing,
 * since the renderer falls back to the white default for all of them.
 */
type StrokeValue$1<T, X extends string | number> = string | null | undefined | ((slice: StackedBarSlice$1<T, X>, index: number) => string | undefined);
/**
 * `component()` hands back whatever interface it is asked for, but the two builder methods
 * it inherits are declared as returning the plain Component, so a component interface has
 * to re-declare them to survive its own construction chain.
 */
interface StackedBarBuilder<C extends Component> extends Component {
    prop<V>(prop: string, setter?: PropertySetter<V>): C;
    render(callback: RenderCallback): C;
}
/**
 * Setters take `<U = ...>` so that a typed accessor can be passed without naming the
 * component's generics at the call site.
 */
interface StackedBarVerticalComponent<T = unknown, X extends string | number = string> extends StackedBarBuilder<StackedBarVerticalComponent<T, X>> {
    xScale(): StackScale<X>;
    xScale<V = X>(scale: (value: V) => number | undefined): StackedBarVerticalComponent<T, X>;
    width(): StoredDimension<T, X>;
    width<U = StackedBarSlice$1<T, X>>(value: SliceValue<U, number>): StackedBarVerticalComponent<T, X>;
    yScale(): ValueScale;
    yScale(scale: ValueScale): StackedBarVerticalComponent<T, X>;
    height(): StoredDimension<T, X>;
    height<U = StackedBarSlice$1<T, X>>(value: SliceValue<U, number>): StackedBarVerticalComponent<T, X>;
    fill(): FillValue$1<T, X>;
    fill<U = StackedBarSlice$1<T, X>>(value: SliceValue<U, string | undefined>): StackedBarVerticalComponent<T, X>;
    stroke(): StrokeValue$1<T, X>;
    stroke<U = StackedBarSlice$1<T, X>>(value: string | null | undefined | ((slice: U, index: number) => string | undefined)): StackedBarVerticalComponent<T, X>;
}
interface StackedBarHorizontalComponent<T = unknown, X extends string | number = string> extends StackedBarBuilder<StackedBarHorizontalComponent<T, X>> {
    xScale(): ValueScale;
    xScale(scale: ValueScale): StackedBarHorizontalComponent<T, X>;
    width(): StoredDimension<T, X>;
    width<U = StackedBarSlice$1<T, X>>(value: SliceValue<U, number>): StackedBarHorizontalComponent<T, X>;
    yScale(): StackScale<X>;
    yScale<V = X>(scale: (value: V) => number | undefined): StackedBarHorizontalComponent<T, X>;
    height(): StoredDimension<T, X>;
    height<U = StackedBarSlice$1<T, X>>(value: SliceValue<U, number>): StackedBarHorizontalComponent<T, X>;
    fill(): FillValue$1<T, X>;
    fill<U = StackedBarSlice$1<T, X>>(value: SliceValue<U, string | undefined>): StackedBarHorizontalComponent<T, X>;
    stroke(): StrokeValue$1<T, X>;
    stroke<U = StackedBarSlice$1<T, X>>(value: string | null | undefined | ((slice: U, index: number) => string | undefined)): StackedBarHorizontalComponent<T, X>;
}
declare function stackedBarHorizontal<T = unknown, X extends string | number = string>(): StackedBarHorizontalComponent<T, X>;
declare function stackedBarVertical<T = unknown, X extends string | number = string>(): StackedBarVerticalComponent<T, X>;

/**
 * Stacked Pyramid component
 *
 * The pyramid component is primarily used to show a distribution of age groups
 * in a population (population pyramid). The chart is mirrored vertically,
 * meaning that it has a horizontal axis that extends in a positive and negative
 * direction having the same domain.
 *
 * This chart's horizontal point of origin is at its spine, i.e. the center of
 * the chart.
 *
 * The datum bound to the chart layer is the output of stackedPyramidData(sideAcc, rowAcc,
 * seriesAcc, valueAcc), which returns a function over a flat array of rows. Each accessor is called
 * with one source row: sideAcc groups the rows into the sides of the pyramid, rowAcc into the
 * vertical positions within a side, seriesAcc into the layers of each row's stack, and valueAcc
 * supplies the number that is stacked.
 *
 * The result is an array of sides, each an array of the series d3.stack produced for that side,
 * each series an array of the [y0, y1] slices it computed - so a slice is addressed as
 * data[side][series][row], and the caller picks the two sides positionally. Every slice carries
 * five properties beyond its pair: its `series` key, its `side` as the side accessor returned it,
 * its `row`, its own `value`, and its `data`, narrowed from the whole grouped row to the single
 * source row the slice was computed from. d3's own `key` and `index` are carried across onto each
 * series. The largest stacked total across both sides is attached to the returned array as
 * `maxValue`, which is what the horizontal scale's domain is built from. The rows passed in are not
 * modified.
 *
 * The component always creates four sub-groups, in this order: leftStack, rightStack, leftReference
 * and rightReference. The order is load-bearing, since it makes the reference lines paint over the
 * bars, and the reference groups are created even when no reference accessor is configured. Within
 * a side each series gets its own group, marked with a [data-sszvis-stack] attribute and no class -
 * stackedBar uses a .sszvis-stack class for the same job - and is drawn by its own bar component,
 * the left one mirrored across the spine. Both sides are pushed outwards by SPINE_PADDING, so a one
 * pixel gap runs down the middle of the chart, and every bar dimension is read from the same
 * accessors on both sides.
 *
 * @module sszvis/component/stackedPyramid
 *
 * @requires sszvis.component.bar
 *
 * @template T The type of one row of the input data, i.e. of a slice's `data`
 * @template S The type the side accessor returns, i.e. of a slice's `side`
 *
 * @property {string, function} [barFill]     The color of a bar. Defaults to #000 and applies to
 *                                            both sides; a per-datum accessor is the usual way to
 *                                            colour the series. It is composed with the slice's
 *                                            `data`, so it reads a source row rather than a slice,
 *                                            and fn.compose forwards d3's arguments only to the
 *                                            innermost function, so it is called with that row
 *                                            alone.
 * @property {number, function} barHeight     The height of a bar. Required, but omitting it is not
 *                                            reported: it is the one dimension handed straight to
 *                                            bar, so the value reaches bar's missing-value guard as
 *                                            undefined and becomes 0, and the chart renders an
 *                                            empty axis frame with no bars and no warning. Of the
 *                                            three required dimensions only this one fails
 *                                            silently. Shared with pyramid.
 * @property {number, function} barWidth      The width of a bar. Required, and an unset prop throws
 *                                            a TypeError from the component's own closure, because
 *                                            the component computes both the x and the width of
 *                                            every bar itself. It is called with one of the numbers
 *                                            out of a slice's [y0, y1] pair rather than with the
 *                                            slice, so it has to be a scale over stacked values and
 *                                            not an accessor over data - pyramid calls the same
 *                                            property with the bar's datum, and an accessor written
 *                                            for pyramid reads properties off a number here and
 *                                            yields NaN, which bar's guard turns into 0. It is also
 *                                            called without d3's index and group, so an index-aware
 *                                            or node-aware accessor collapses every width and every
 *                                            x to 0 on both sides; pyramid has the same omission on
 *                                            its left side only. A constant is accepted and is
 *                                            worse than an error: the width is computed as
 *                                            barWidth(d[1]) - barWidth(d[0]), so a constant
 *                                            subtracts itself and every segment disappears while
 *                                            still being positioned at the constant offset.
 * @property {number, function} barPosition   The vertical position of a bar, i.e. its top edge.
 *                                            Required, and an unset prop throws too, but from
 *                                            inside fn.compose ("Cannot read properties of
 *                                            undefined (reading 'call')") rather than from the
 *                                            component's own closure the way barWidth does. Both
 *                                            surface while bar is applying its attributes. It is
 *                                            called with the slice's `row`, which is that row's
 *                                            index within its side and not the value the row
 *                                            accessor returned, and with nothing else, so an
 *                                            index-aware accessor yields NaN and bar's guard
 *                                            flattens it to 0.
 * @property {Array<number>} [tooltipAnchor]  The anchor position for the tooltips. Uses
 *                                            sszvis.component.bar.tooltipAnchor under the hood to
 *                                            optionally reposition the tooltip anchors in the
 *                                            pyramid chart. Default value is [0.5, 0.5], which
 *                                            centers tooltips on the bars. The value is handed to
 *                                            both bars unchanged rather than being mirrored, and
 *                                            bar measures from its own upper left corner, which on
 *                                            the left side is a segment's outer edge, so any x
 *                                            other than 0.5 lands on visually opposite sides of the
 *                                            pyramid. An array with fewer than two entries yields a
 *                                            NaN coordinate, as documented on bar; the component
 *                                            adds no validation of its own. Shared with pyramid.
 * @property {function} leftAccessor          Data for the left side, i.e. a function picking one
 *                                            side out of the layout - the sides are an array, so
 *                                            docs/population-pyramid/pyramid-stacked.js uses
 *                                            prop("0") and prop("1"). Required: an unset accessor
 *                                            throws "props.leftAccessor is not a function" from the
 *                                            renderer, and an accessor that returns undefined or
 *                                            null throws from d3's data join instead, with a
 *                                            message that names neither the property nor the
 *                                            component.
 * @property {function} rightAccessor         Data for the right side. Same requirements as
 *                                            leftAccessor.
 * @property {function} [leftRefAccessor]     Reference data for the left side, drawn as a single
 *                                            path outlining the reference series. The elements are
 *                                            handed to barWidth for x and to barPosition for y, so
 *                                            they have to be plain numbers. Optional, but the guard
 *                                            tests whether the accessor was set, not what it
 *                                            returns: an accessor that yields undefined or null for
 *                                            some states throws instead of hiding the line.
 *                                            Returning an empty array does hide it, though the
 *                                            classed path element stays in the DOM with no d
 *                                            attribute, where CSS and hit tests can still find it.
 * @property {function} [rightRefAccessor]    Reference data for the right side. Same as
 *                                            leftRefAccessor.
 *
 * Note: a side's series keys are read off that side's first row alone, with Object.keys, so a
 * series absent from the first row is dropped from the whole side and its values appear neither in
 * the chart nor in maxValue - stackedBarData takes the union of the keys across every row instead.
 * The stack value is then read as x[key][0] with no guard, so a later row that is missing one of
 * the first row's keys dies on an undefined cell with a TypeError. Between them the two mean every
 * row of a side has to carry every series and the first row decides which, so callers with sparse
 * data have to pad it with zero rows.
 *
 * Note: a slice's `row` is the position of its row within the side, not the value the row accessor
 * returned, and that index is what the component feeds to barPosition. It lines up with the data
 * only when the row values happen to be a dense zero-based range, which is what
 * docs/population-pyramid/pyramid-stacked.js relies on: it builds its position scale over
 * d3.range(0, 101) and its ages happen to run from 0 to 100. The source row still knows its real
 * value; only the tag on the slice is an index.
 *
 * Note: the cascade groups on String(key) - for the sides, the rows and the series alike - so keys
 * that differ only in type merge, and the number 1 and the string "1" land in the same cell where
 * only the first of them is stacked. The ordering follows from the same coercion: JavaScript
 * iterates array-index keys in ascending numeric order regardless of insertion order, so dense
 * non-negative integer rows sort themselves, which is what makes the index-as-position quirk above
 * survivable, while negative, fractional or plain string rows fall back to insertion order and are
 * laid out in whatever order the input happened to be in. The sides are ordered the same way and
 * picked positionally, so a dataset whose first row is male puts men on the left and silently
 * mirrors the chart. For the series the key order is the stacking order, so a series accessor
 * returning years or numeric codes restacks the chart in ascending numeric order, and the `series`
 * tag comes back as a string even when the accessor returned a number. Nothing enforces the
 * cardinality of two the layout function's own documentation requires of the side accessor either:
 * a single side leaves the right accessor returning undefined, which throws from d3's data join,
 * and a third side is returned and then dropped without a word by the caller's positional
 * accessors. Shared with stackedBarData.
 *
 * Note: the value of a cell is read from its first row only, so data that is not already aggregated
 * to one row per (side, row, series) triplet is silently truncated rather than summed. The layout
 * function requires the triplet to appear exactly once and says it makes no effort to normalize the
 * data if that is not the case, but nothing reports a violation. Shared with stackedBarData.
 *
 * Note: `maxValue` is hung off the returned array rather than wrapped in an object, so any array
 * operation - a spread, a map, a filter, a trip through JSON - drops it. It is the maximum of the
 * upper bounds only, so it is not the extent of the data when a value is negative, and it is
 * undefined rather than 0 for an empty layout, where it coerces to NaN in the scale domain the
 * examples feed it into, so the scale maps every value to NaN and the axis draws its domain line
 * with no ticks at all. A slice's `value` is a convenience of the same kind:
 * the component never reads it, and it duplicates d[1] - d[0] as it stood when the layout ran, so
 * it goes stale if a caller rewrites the pair. Shared with stackedBarData. See
 * test/component/stackedPyramid.test.ts.
 *
 * Note: the reference lines cannot be drawn in the coordinate system the bars use. The line
 * generator is d3.line().x(barWidth).y(barPosition), so both props are called with the same
 * reference element, while in the bars barWidth is called with a stacked value and barPosition with
 * a row index. No element satisfies both: a series of stacked values gives an x that is right and a
 * y that is as many rows down as the value is large. d3.line also calls its x accessor as (d, i,
 * data), so barWidth receives the index on the line and nowhere else, which leaves one property
 * with two calling conventions as well as two coordinate systems. The only stackedPyramid example
 * sets neither reference accessor; the reference-line example uses the plain pyramid instead, where
 * both props read the datum and the problem does not arise.
 *
 * Note: two smaller mismatches ride along, both of them shared with pyramid. The bars are pushed
 * outwards by SPINE_PADDING, a deliberate cosmetic gap at the spine, while the line is drawn
 * straight from barWidth and so agrees with the axis scale, which puts a reference value equal to a
 * bar value half a pixel inside that bar's outer edge, symmetrically on both sides. And the line
 * takes its y from barPosition alone and never accounts for barHeight, so the outline runs along
 * the bars' top edges rather than their mid-lines, half a bar height above the values it describes.
 *
 * Note: a reference line's d attribute is only ever written through a transition, so a freshly
 * rendered path carries no geometry until the first animation frame and anything that measures the
 * chart synchronously - getBBox, a snapshot, an export to PNG - sees an empty path. Entering lines
 * then snap into place, because d3 has no previous d to interpolate from; only updates animate. The
 * bars underneath do not animate at all - bar's transition property is inert - so on a state change
 * the outline eases towards its new position while the bars jump, and the two visibly detach for
 * the length of the transition. bar also guards every geometry value against NaN while the line
 * hands barWidth and barPosition straight to d3.line, so one missing value poisons the path string
 * and the browser renders the valid prefix and drops the rest of the outline. All of this is shared
 * with pyramid.
 *
 * Note: the reference path is classed .sszvis-path, which no rule in sszvis.css defines - its
 * appearance comes from four inlined attributes instead, the opposite choice from pyramid, which
 * sets only .sszvis-pyramid__referenceline and takes all four values from the stylesheet. The class
 * collides with the one pie, stackedArea and stackedAreaMultiples use for their own paths, so a
 * selector written for any of those also matches a stackedPyramid reference line, and since the
 * join has no key function a foreign path that happens to carry the class is adopted as the
 * reference line and repainted rather than left alone. That is harmless while each component owns
 * its own selectGroup, which is how every example is written.
 *
 * Note: the reference datum is wrapped in an array, one array of points per path, so each side is
 * capped at a single line and, while a reference accessor is set, the join always has exactly one
 * element and the exit selection can never fire: once a line has been rendered its path element
 * stays in the DOM even after the reference data goes away, with only its d attribute dropped. Only
 * removing the accessor itself empties the group. The mirror property writes transform="" on the
 * right side rather than omitting the attribute. Shared with pyramid.
 *
 * Note: the stack join is selectAll("[data-sszvis-stack]"), a descendant selector rather than a
 * child selector, so a stack group nested at any depth below a side's group is captured alongside
 * the direct children. The exit selection then removes a legitimate series group, and the reorder
 * that follows has to sort a selection in which one element is an ancestor of another, so d3 throws
 * a HierarchyRequestError and aborts the whole render rather than just that side. A child selector
 * would make it unreachable. Nothing nests stack groups today, so reaching it needs a caller to
 * have put something of its own inside one. stackedBar's version of the same unscoped selector only
 * re-binds.
 *
 * Note: neither join uses a key function, so on a re-render the stack groups and the rects inside
 * them are matched by index rather than by series. When a series is dropped from anywhere but the
 * end, the groups that remain are re-bound to different series and every bar in them is rewritten.
 * Only the geometry moves, so it is invisible, but any state held on a stack group - a class, a
 * listener, an in-flight transition - follows the position rather than the series. Shared with
 * stackedBar.
 *
 * Note: bar defaults its transition property to true and this component neither sets it nor exposes
 * it, so every render creates a d3 transition per rect and then overwrites the geometry on the
 * plain selection immediately. Nothing animates, but the transition state is still attached and
 * interrupts any transition already running on those rects. Shared with stackedBar. The component
 * also leaves bar's stroke unset, so unlike stackedBar, which paints a 1px white separator between
 * segments, the segments of a row touch without a seam.
 *
 * Note: bar guards NaN but not negative numbers. A negative stacked value inverts the pair, so the
 * width goes negative, which the browser rejects and the segment is not drawn, and on the left side
 * the double sign flip moves x to the right of the spine. Neither side of the pyramid supports
 * values below the baseline. Reaching this needs negative input data, which a population pyramid
 * should not see. See test/component/stackedPyramid.test.ts.
 *
 * @return {sszvis.component}
 */

/**
 * One slice of a stack: the [y0, y1] point d3.stack produced, with `data` narrowed from the
 * whole cascade row to the single row the slice was computed from, and tagged with the
 * series, the side and the row it belongs to. It is d3's own SeriesPoint, which is why it is
 * an Array rather than a two-element tuple.
 */
type StackedPyramidSlice<T, S extends string | number = string> = SeriesPoint<T> & {
    /** The series key the slice belongs to. */
    series: string;
    /** The side the slice belongs to, as the side accessor returned it. */
    side: S;
    /** The position of the slice's row within its side - an index, not the row's own value. */
    row: number;
    /** The slice's own value, i.e. d[1] - d[0] as it was when the layout ran. */
    value: number;
};
/** All slices sharing a series key, i.e. one layer of one side's stack, as d3 hands it over. */
type StackedPyramidSeries<T, S extends string | number = string> = StackedPyramidSlice<T, S>[] & {
    key: string;
    index: number;
};
/** One side of the pyramid: the series d3.stack produced for it. */
type StackedPyramidSide<T, S extends string | number = string> = StackedPyramidSeries<T, S>[];
/**
 * What stackedPyramidData returns: the sides, with the largest stacked total across both of
 * them hung off the array itself rather than wrapped in an object.
 */
type StackedPyramidLayout<T, S extends string | number = string> = StackedPyramidSide<T, S>[] & {
    maxValue: number | undefined;
};
/**
 * This function prepares the data for the stackedPyramid component
 *
 * The input data is expected to have at least four columns:
 *
 *  - side: determines on which side (left/right) the value goes. MUST have cardinality of two!
 *  - row: determines on which row (vertical position) the value goes.
 *  - series: determines in which series (for the stack) the value is.
 *  - value: the numerical value.
 *
 * The combination of each distinct (side,row,series) triplet MUST appear only once
 * in the data. This function makes no effort to normalize the data if that's not the case.
 */
declare function stackedPyramidData<T, S extends string | number = string>(sideAcc: (datum: T) => S, _rowAcc: (datum: T) => string | number, seriesAcc: (datum: T) => string | number, valueAcc: (datum: T) => number): (data: T[]) => StackedPyramidLayout<T, S>;
/**
 * How barWidth reads back once it is stored. It is wrapped by fn.functor on set, so it is
 * always a function by the time the renderer reads it, and the component calls it with one of
 * the numbers out of a slice's [y0, y1] pair - never with the slice itself. Both parameters
 * are optional because a constant becomes a functor that ignores its arguments, and because
 * the component passes neither d3's index nor its group.
 */
type StoredWidth = (value?: number, index?: number) => number;
/**
 * How barPosition reads back. In the bars it is called with a slice's row index; on a
 * reference line d3.line calls it with the reference element itself, which is why a reference
 * series has to be an array of numbers.
 */
type StoredPosition = (value?: number, index?: number) => number;
/** How barHeight reads back: unlike the other two dimensions it is handed straight to bar. */
type StoredHeight<T, S extends string | number> = (slice?: StackedPyramidSlice<T, S>, index?: number) => number;
/** How barFill reads back. It is composed with the slice's `data`, so it reads a source row. */
type StoredFill<T> = (datum?: T, index?: number) => string | undefined;
/** Pulls one side's series out of the datum bound to the chart layer. */
type SideAccessor$1<T, S extends string | number> = (data: StackedPyramidLayout<T, S>) => StackedPyramidSide<T, S>;
/**
 * Pulls one side's reference series out of the datum bound to the chart layer. The elements
 * are handed to barWidth for x and to barPosition for y, so they have to be plain numbers.
 */
type ReferenceAccessor<T, S extends string | number> = (data: StackedPyramidLayout<T, S>) => number[];
/** A constant or an accessor; either is accepted, since fn.functor normalises both. */
type PyramidValue$1<A, R> = R | ((value: A, index: number) => R);
/**
 * A constant or an accessor over a slice's source row. barFill is composed with the slice's
 * `data`, and fn.compose forwards d3's index only to the innermost function, so unlike bar's
 * own fill this one is called with the datum alone.
 */
type FillValue<U> = string | undefined | ((datum: U) => string | undefined);
/**
 * `component()` hands back whatever interface it is asked for, but the three builder methods
 * it inherits are declared as returning the plain Component, so a component interface has to
 * re-declare them to survive its own construction chain. Without this the chain's type
 * degrades to `any` at the first undeclared setter - `.barFill("#000")` resolves through
 * Component's index signature - and the interface below is then never checked against the
 * component that is actually built.
 */
interface ComponentBuilder<C extends Component> extends Component {
    prop<V>(prop: string, setter?: PropertySetter<V>): C;
    render(callback: RenderCallback): C;
    renderSelection(callback: SelectionRenderCallback): C;
}
/**
 * Setters take `<U = ...>` so that a typed accessor can be passed without naming the
 * component's generics at the call site.
 */
interface StackedPyramidComponent<T = unknown, S extends string | number = string> extends ComponentBuilder<StackedPyramidComponent<T, S>> {
    barHeight(): StoredHeight<T, S>;
    barHeight<U = StackedPyramidSlice<T, S>>(value: PyramidValue$1<U, number>): StackedPyramidComponent<T, S>;
    barWidth(): StoredWidth;
    barWidth(value: PyramidValue$1<number, number>): StackedPyramidComponent<T, S>;
    barPosition(): StoredPosition;
    barPosition(value: PyramidValue$1<number, number>): StackedPyramidComponent<T, S>;
    barFill(): StoredFill<T>;
    barFill<U = T>(value: FillValue<U>): StackedPyramidComponent<T, S>;
    tooltipAnchor(): (number | string)[];
    tooltipAnchor(anchor: (number | string)[]): StackedPyramidComponent<T, S>;
    leftAccessor(): SideAccessor$1<T, S>;
    leftAccessor<U = StackedPyramidLayout<T, S>>(accessor: (data: U) => StackedPyramidSide<T, S>): StackedPyramidComponent<T, S>;
    rightAccessor(): SideAccessor$1<T, S>;
    rightAccessor<U = StackedPyramidLayout<T, S>>(accessor: (data: U) => StackedPyramidSide<T, S>): StackedPyramidComponent<T, S>;
    leftRefAccessor(): ReferenceAccessor<T, S> | undefined;
    leftRefAccessor<U = StackedPyramidLayout<T, S>>(accessor: (data: U) => number[]): StackedPyramidComponent<T, S>;
    rightRefAccessor(): ReferenceAccessor<T, S> | undefined;
    rightRefAccessor<U = StackedPyramidLayout<T, S>>(accessor: (data: U) => number[]): StackedPyramidComponent<T, S>;
}
declare function stackedPyramid<T = unknown, S extends string | number = string>(): StackedPyramidComponent<T, S>;

/**
 * Line component
 *
 * The line component is a general-purpose component used to render lines.
 *
 * The input data should be an array of arrays, where each inner array
 * contains the data points necessary to render a line. The line is then
 * composed of x- and y- values extracted from these data objects
 * using the x and y accessor functions.
 *
 * Each data object in a line's array is passed to the x- and y- accessors, along with
 * that data object's index in the array. For more information, see the documentation for
 * d3.line.
 *
 * In addition, the user can specify stroke and strokeWidth accessor functions. Because these
 * functions apply properties to the entire line, when called, they are given the datum for the
 * whole line, plus the index of that line within the outer array of lines. Note that this
 * differs slightly from the usual case in that dimension-related accessor functions are given different
 * data than style-related accessor functions. When valuesAccessor is set, the style accessors
 * receive the wrapper object rather than the array of points - valuesAccessor is applied only on
 * the way into d3.line.
 *
 * @module sszvis/component/line
 *
 * @template P The type of one point along a line
 * @template L The type of the datum for a whole line
 *
 * @property {number, function} x       An accessor function for getting the x-value of the line, or a
 *                                       constant. Required: omitting it draws nothing at all, with no
 *                                       warning, because every point then reads as missing.
 * @property {function} y                An accessor function for getting the y-value of the line. Required,
 *                                       and unlike x it must be a function, because the default defined
 *                                       predicate calls it. Omitting it throws a TypeError rather than a
 *                                       named missing-property error.
 * @property {function} [defined]        A per-point predicate handed to d3.line, deciding whether a point is
 *                                       drawn. Defaults to skipping points whose x or y is missing. It
 *                                       replaces that default rather than composing with it, so setting it
 *                                       gives up the missing-value guard.
 * @property {function} [key]            The key function to be used for the data join. Defaults to the index,
 *                                       which matches lines by position.
 * @property {function} [valuesAccessor] An accessor function for getting the data points array of the line
 * @property {string, function} [stroke] Either a string specifying the stroke color of the line or lines,
 *                                       or a function which, when passed the datum for the line,
 *                                       returns a value for the stroke. If left undefined no stroke is set at
 *                                       all, and since the SVG initial value is none the line renders
 *                                       invisibly - every chart is expected to set this.
 * @property {number, function} [strokeWidth] Either a number specifying the stroke-width of the lines,
 *                                       or a function which, when passed the datum for the line,
 *                                       returns a value for the stroke-width. If left undefined the component
 *                                       sets nothing, and the 1.1 in the .sszvis-line rule of sszvis.css
 *                                       applies.
 * @property {boolean} transition        Whether to transition the line when its values change. Defaults to
 *                                       true.
 *
 * Note: stroke and strokeWidth are written as inline styles, where bar and dot write their colours as
 * attributes. An inline style outranks a stylesheet rule, so a theme can restyle a bar but never a line.
 *
 * Note: with transition enabled, the d attribute and stroke-width are only written through the
 * transition, so a freshly rendered line has an empty path element until the first animation frame
 * runs. Anything measuring the path synchronously - getTotalLength, a bounding box, a screenshot -
 * sees nothing. Entering lines also snap rather than animate, because d3 has no previous d value to
 * interpolate from; only updates animate. See test/component/line.test.ts.
 *
 * Note: the default missing-value guard inspects both dimensions, but only catches values that fail
 * to coerce to a number. Infinity, which a scale over a zero-width domain produces, still reaches the
 * d attribute verbatim; the browser then renders up to that segment and silently drops the rest of
 * the series. A null likewise coerces to 0 and is plotted as data rather than breaking the line.
 *
 * @return {sszvis.component}
 */

/**
 * Dimension accessors are handed to d3.line, which calls them with a single point, that
 * point's index within the line, and the array of points the line is drawn from.
 */
type PointAccessor$2<P, R> = (datum: P, index: number, points: P[]) => R;
/**
 * Style accessors are handed to the d3 selection, which calls them with the datum for a
 * whole line and that line's index within the outer array - not with a single point.
 */
type LineAccessor<L, R> = (datum: L, index: number) => R;
/** Either a constant or an accessor; only stroke and strokeWidth accept both. */
type StyleValue$2<L, R> = R | LineAccessor<L, R>;
/** Pulls the array of points to draw out of one line's datum. */
type ValuesAccessor$1<L, P> = (datum: L, index: number) => P[];
interface LineComponent<P = unknown, L = unknown> extends Component {
    x(): number | PointAccessor$2<P, number> | undefined;
    x<Q = P>(value: number | PointAccessor$2<Q, number>): LineComponent<P, L>;
    y(): PointAccessor$2<P, number> | undefined;
    y<Q = P>(accessor: PointAccessor$2<Q, number>): LineComponent<P, L>;
    defined(): PointAccessor$2<P, boolean> | undefined;
    defined<Q = P>(predicate: PointAccessor$2<Q, boolean>): LineComponent<P, L>;
    key(): LineAccessor<L, string | number>;
    key<M = L>(accessor: LineAccessor<M, string | number>): LineComponent<P, L>;
    valuesAccessor(): ValuesAccessor$1<L, P>;
    valuesAccessor<M = L, Q = P>(accessor: ValuesAccessor$1<M, Q>): LineComponent<P, L>;
    stroke(): StyleValue$2<L, string> | undefined;
    stroke<M = L>(value: StyleValue$2<M, string>): LineComponent<P, L>;
    strokeWidth(): StyleValue$2<L, number> | undefined;
    strokeWidth<M = L>(value: StyleValue$2<M, number>): LineComponent<P, L>;
    transition(): boolean;
    transition(enabled: boolean): LineComponent<P, L>;
}
declare function export_default$g<P = unknown, L = unknown>(): LineComponent<P, L>;

/**
 * Nested Stacked Bars Vertical component
 *
 * This component renders a group of vertical stacked bar charts side by side. The input data
 * is an array of stack layouts, one per nested group, each as returned by
 * stackedBarVerticalData; callers usually tag every layout with the key they cascaded by so
 * that `offset` can read it. For each layout the component emits a group positioned by
 * `offset`, an ordinal x-axis, and a stackedBarVertical, and finally passes all tooltip
 * anchors of all groups to `tooltip` in a single call.
 *
 * `offset`, `xScale`, `yScale`, `xAcc` and `tooltip` are required; `fill`, `xLabel` and
 * `slant` are optional. None of the required props is defaulted or validated, so omitting one
 * fails at render time with a low-level TypeError rather than a message naming the prop.
 *
 * @module sszvis/component/nestedStackedBarsVertical
 * @template T The type of the data objects behind the stack slices
 * @template X The type of the x-axis values, i.e. the domain of the x-scale
 *
 * @property {function} offset              Required. Positions the nested groups. Receives the whole
 *                                          stack layout of a group and returns an x-offset in pixels.
 * @property {function} xScale              Required. A band scale for the stack layout. Used to position
 *                                          the stacks and, via its bandwidth, to size the bars. Must be a
 *                                          band scale: `bandwidth()` is called on it directly.
 * @property {function} yScale              Required. A y-scale. After the stack is computed, the y-scale is
 *                                          used to position each stack, and to place the x-axis at yScale(0).
 * @property {function} tooltip             Required. A tooltip component, called once with the tooltip
 *                                          anchors of every nested group in one selection.
 * @property {function} xAcc                Required. An x-accessor, called with the datum of the first slice
 *                                          of the group. Its only use is to write the value into the
 *                                          `data-nested-stacked-bars` attribute; it takes no part in
 *                                          positioning. The return value is stringified into that attribute,
 *                                          so any string or number works.
 * @property {string, function} fill        Optional. A fill value for the rectangles. When unset, no fill
 *                                          attribute is written at all and the rectangles fall back to the
 *                                          SVG/CSS default.
 * @property {function} xLabel              Optional, but non-functional - see below.
 * @property {string} slant                 Optional. The slant of the x-axis labels ("vertical" or
 *                                          "diagonal"). Unset leaves them upright. The only prop that is not
 *                                          wrapped in fn.functor.
 *
 * Note: several behaviours of this component are not guessable from its props. `ticks(1)` is
 * hardcoded on the axis, and `axisX.ordinal` reads that as "first and last domain value plus
 * one in between", so with three or more x-categories the middle tick labels silently
 * disappear. The axis is placed at `yScale(0)`, which a linear scale extrapolates past the end
 * of its range, so a y-domain that excludes 0 pushes the axis of every group off the chart
 * without warning. The bars inherit the #FFFFFF separator stroke that stackedBarVertical
 * defaults to, and this component does not expose `stroke`, so it cannot be changed or
 * removed. `xLabel` is wrapped in fn.functor while `axis.title()` expects a string, so the
 * wrapper is stringified into the title text - neither a string nor a function produces the
 * intended label, and the prop cannot be set at all in its current form. The
 * `data-nested-stacked-bars` attribute holds `xAcc(d[0][0].data)`, the x-value of the group's
 * first slice, which is the same for every group and therefore cannot identify the group it
 * names; the same unguarded reach throws for a nested group with no stacks. The group
 * transform is interpolated as `translate(${offset(d)} 0)` with no guard, so an offset scale
 * miss writes the invalid `translate(undefined 0)`. See test/component/nestedStackedBar.test.ts.
 *
 * @return {sszvis.component}
 */

/**
 * One slice of a stack: the [y0, y1] pair produced by d3.stack, extended with the
 * properties that stackedBarVerticalData attaches to it.
 */
type StackedBarSlice<T, X extends string | number = string> = [number, number] & {
    data: T;
    series: string;
    stack: X;
};
/** All slices sharing a series key, i.e. one layer of a stack layout. */
type StackedBarSeries<T, X extends string | number = string> = StackedBarSlice<T, X>[];
/**
 * The stack layout of a single nested group, as returned by stackedBarVerticalData.
 * Callers usually tag it with the key they cascaded by, which is what `offset` reads.
 */
type NestedStack<T, X extends string | number = string> = StackedBarSeries<T, X>[];
/**
 * Setters take `<U = T>` so that a typed accessor can be passed without naming the
 * component's generics at the call site.
 */
interface NestedStackedBarsVerticalComponent<T = unknown, X extends string | number = string> extends Component {
    offset(): (datum: NestedStack<T, X>) => number | undefined;
    offset<U = NestedStack<T, X>>(accessor: (datum: U) => number | undefined): this;
    xScale(): ScaleBand<X>;
    xScale(scale: ScaleBand<X>): this;
    yScale(): (value: number) => number;
    yScale(scale: (value: number) => number): this;
    fill(): string | ((slice: StackedBarSlice<T, X>) => string);
    fill<U = StackedBarSlice<T, X>>(value: string | ((slice: U) => string)): this;
    tooltip(): (selection: AnySelection) => void;
    tooltip(tooltip: (selection: AnySelection) => void): this;
    xAcc(): (datum: T) => X;
    xAcc<U = T>(accessor: (datum: U) => X): this;
    xLabel(): (() => string) | undefined;
    xLabel(label: string | (() => string)): this;
    slant(): SlantDirection | undefined;
    slant(direction: SlantDirection): this;
}
declare const nestedStackedBarsVertical: <T = unknown, X extends string | number = string>() => NestedStackedBarsVerticalComponent<T, X>;

/**
 * Pack component
 *
 * This component renders a Pack (also known as a circle pack diagram), which displays
 * hierarchical data as a collection of nested circles. The size of each circle corresponds to
 * a quantitative value, and circles are positioned using D3's pack layout algorithm to
 * efficiently fill the available space with minimal overlap.
 *
 * The component expects data prepared using the prepareHierarchyData function, which converts
 * flat data into a hierarchical structure suitable for the pack layout.
 *
 * @module sszvis/component/pack
 * @template T The type of the original flat data objects
 *
 * @property {string, function} colorScale        The fill color accessor for circles
 * @property {boolean} transition                 Whether to animate changes (default true)
 * @property {number, function} containerWidth    The container width (default 800)
 * @property {number, function} containerHeight   The container height (default 600)
 * @property {boolean} showLabels                 Whether to display labels on leaf nodes (default false)
 * @property {string, function} label             The label text accessor (default d.data.key)
 * @property {number} minRadius                   Minimum circle radius for visibility (default 1)
 * @property {string} circleStroke                Circle stroke color (default "#ffffff")
 * @property {number} circleStrokeWidth           Circle stroke width (default 1)
 * @property {function} radiusScale               Custom radius scale function for circle sizing (optional)
 * @property {function} onClick                   Click handler for circles (receives node and event)
 *
 * @return {sszvis.component}
 */

type PackLayout<T = unknown> = HierarchyNode<NodeDatum<T>> & {
    x: number;
    y: number;
    r: number;
    value: number;
    data?: T;
    depth: number;
    height: number;
};
type PackClickHandler<T = unknown> = (event: MouseEvent, node: PackLayout<T>) => void;
interface PackComponent<T = unknown> extends Component {
    colorScale(): (key: string) => string;
    colorScale(scale: (key: string) => string): PackComponent<T>;
    transition(): boolean;
    transition(enabled: boolean): PackComponent<T>;
    containerWidth(): number;
    containerWidth(width: number): PackComponent<T>;
    containerHeight(): number;
    containerHeight(height: number): PackComponent<T>;
    showLabels(): boolean;
    showLabels(show: boolean): PackComponent<T>;
    label(): StringAccessor<PackLayout<T>>;
    label(accessor: StringAccessor<PackLayout<T>>): PackComponent<T>;
    minRadius(): number;
    minRadius(radius: number): PackComponent<T>;
    circleStroke(): string;
    circleStroke(stroke: string): PackComponent<T>;
    circleStrokeWidth(): number;
    circleStrokeWidth(width: number): PackComponent<T>;
    radiusScale(): (d: HierarchyCircularNode<NodeDatum<T>>) => number;
    radiusScale(scale: (d: HierarchyCircularNode<NodeDatum<T>>) => number): PackComponent<T>;
    onClick(): PackClickHandler<T> | undefined;
    onClick(handler: PackClickHandler<T>): PackComponent<T>;
}
/**
 * Main Pack component
 *
 * @template T The type of the original flat data objects
 */
declare function export_default$f<T = unknown>(): PackComponent<T>;

/**
 * Pie component
 *
 * The pie component is used to draw pie charts. It uses the d3.arc() generator
 * to create pie wedges.
 *
 * The input data should be an array of data values, where each data value represents one wedge in the pie.
 *
 * @module sszvis/component/pie
 *
 * @property {number} radius                  Required. The outer radius of the pie, in px (no default). It is also
 *                                            used to translate every wedge to (radius, radius); since the arc
 *                                            then extends another radius in every direction, the pie occupies a
 *                                            box of 2 * radius by 2 * radius.
 *                                            The inner radius is hardcoded to 4px and cannot be configured. If the
 *                                            property is left unset the wedges receive an unparseable transform and
 *                                            the tooltip anchors are positioned at NaN, with no warning.
 * @property {string, function} fill          a fill color for wedges in the pie. Ideally a function which takes a
 *                                            data value. If unset, the attribute is omitted and the wedges fall back
 *                                            to the SVG default, black.
 * @property {string, function} stroke        the stroke color for wedges in the pie (default "#FFFFFF", which
 *                                            separates touching wedges). A falsy value passed as the property, such
 *                                            as "" or null, is replaced by that default; a falsy value returned from
 *                                            an accessor is not.
 * @property {number, function} angle         Required. Specifies the angle of the wedges in radians. Theoretically
 *                                            this could be a constant, but that would make for a very strange pie.
 *                                            Ideally, this is a function which takes a data value and returns the
 *                                            angle in radians. Angles are summed as given and never clamped, and if
 *                                            the property is left unset the render throws a TypeError.
 *
 * Note: the wedge geometry is written only by the arc tween, so no `d` attribute exists until
 * the first animation frame, and there is no transition property to opt out of - a chart
 * serialised on the render tick comes out empty. Nothing else animates: transform, fill and
 * stroke are applied to the transition from the values already on the DOM. The tooltip anchors
 * are positioned from the pre-transition angles and are never repositioned when the transition
 * ends, so after an update they describe the previous layout.
 *
 * Note: the component keeps no state of its own. It writes a0/a1 (the angles currently on
 * screen) and _a0/_a1 (the destination angles of the running transition) onto every datum it
 * renders, which is what lets a transition continue from the current geometry. Consequently
 * the data must be mutable - frozen data throws - two entries sharing one object collapse into
 * a single wedge, and a single NaN angle poisons the running total and every wedge after it.
 * See test/component/pie.test.ts.
 *
 * @return {sszvis.component}
 */

/**
 * The angle bookkeeping the component keeps on each datum: a0/a1 are the angles currently
 * on screen, _a0/_a1 the destination angles of the running transition. All four are
 * optional because the caller's data does not carry them until the first render, and
 * a0/a1 can be replaced by a foreign value again by the index-based angle handover below.
 */
interface PieAngles {
    a0?: number | null;
    a1?: number | null;
    _a0?: number;
    _a1?: number;
}
/** A datum of the caller's own shape, once the component has annotated it. */
type PieDatum<T = PieAngles> = T & PieAngles;
/** The angle property is wrapped by fn.functor on set, so it is always a function here. */
type AngleAccessor<T = PieAngles> = (d: PieDatum<T>) => number;
/**
 * fill and stroke accept a constant or an accessor and are not normalised on set. An
 * accessor may resolve to null or undefined to leave the attribute off, which is how d3
 * reads both, so one nullish-aware alias describes what the setters accept and what the
 * getters return.
 */
type ColorAccessor$1<T = PieAngles> = (d: PieDatum<T>, i: number) => string | null | undefined;
type ColorValue<T = PieAngles> = string | ColorAccessor$1<T>;
/**
 * The getters return whatever was last set, which is undefined for radius and angle until
 * the caller sets them - both are required, and rendering without them fails, so both
 * getters report the undefined the props actually hold.
 */
interface PieComponent<T = PieAngles> extends Component {
    radius(): number | undefined;
    radius(radius: number): PieComponent<T>;
    fill(): ColorValue<T> | undefined;
    fill<U = T>(fill: ColorValue<U>): PieComponent<T>;
    stroke(): ColorValue<T> | undefined;
    stroke<U = T>(stroke: ColorValue<U>): PieComponent<T>;
    angle(): AngleAccessor<T> | undefined;
    angle<U = T>(angle: number | AngleAccessor<U>): PieComponent<T>;
}
declare function export_default$e<T = PieAngles>(): PieComponent<T>;

/**
 * Pyramid component
 *
 * The pyramid component is primarily used to show a distribution of age groups
 * in a population (population pyramid). The chart is mirrored vertically,
 * meaning that it has a horizontal axis that extends in a positive and negative
 * direction having the same domain.
 *
 * This chart's horizontal point of origin is at its spine, i.e. the center of
 * the chart.
 *
 * The datum bound to the chart layer is typically one object holding both sides of the
 * pyramid - all the component requires is that the side accessors return arrays. Each
 * series is then rendered by its own bar component, the left one mirrored across the spine,
 * so every bar dimension is read from the same accessors on both sides.
 *
 * The component always creates four sub-groups, in this order: left, right, leftReference
 * and rightReference. The order is load-bearing, since it makes the reference lines paint
 * over the bars, and the reference groups are created even when no reference accessor is
 * configured.
 *
 * @module sszvis/component/pyramid
 *
 * @requires sszvis.component.bar
 *
 * @template T The type of the datum bound to the chart layer
 * @template D The type of one bar's datum, i.e. the elements of each side's series
 *
 * @property {string, function} [barFill]          The color of a bar. Defaults to #000 and applies to both
 *                                                 sides; a per-datum accessor is the usual way to colour the
 *                                                 two sides differently.
 * @property {number, function} barHeight          The height of a bar. Required, but omitting it is not
 *                                                 reported: the value reaches bar's missing-value guard as
 *                                                 undefined and becomes 0, so the chart renders an empty axis
 *                                                 frame with no bars and no warning.
 * @property {number, function} barWidth           The width of a bar. Required, and the only bar dimension
 *                                                 whose absence throws, because the component computes the
 *                                                 left bar's x itself as -SPINE_PADDING - barWidth(d). That
 *                                                 call also passes the datum alone, without d3's index and
 *                                                 group arguments, so an index-aware accessor yields NaN,
 *                                                 which bar's guard turns into 0: the left bars collapse onto
 *                                                 the spine at their full width. For the same reason a missing
 *                                                 value puts a left bar at x=0 rather than at the spine's
 *                                                 -0.5, half a pixel away from where the right side puts it.
 * @property {number, function} barPosition        The vertical position of a bar, i.e. its top edge. Required,
 *                                                 and like barHeight it fails silently: every bar is drawn at
 *                                                 y=0 when it is missing.
 * @property {Array<Number>} [tooltipAnchor]       The anchor position for the tooltips. Uses sszvis.component.bar.tooltipAnchor
 *                                                 under the hood to optionally reposition the tooltip anchors in the pyramid chart.
 *                                                 Default value is [0.5, 0.5], which centers tooltips on the bars.
 *                                                 The value is handed to both bars unchanged rather than being
 *                                                 mirrored, and bar measures from its own upper left corner, so
 *                                                 any x other than 0.5 lands on visually opposite sides of the
 *                                                 pyramid. An array with fewer than two entries yields a NaN
 *                                                 coordinate, as documented on bar.
 * @property {function}         leftAccessor       Data for the left side. Required: an unset accessor throws
 *                                                 "props.leftAccessor is not a function" from the renderer,
 *                                                 and an accessor that returns undefined or null throws from
 *                                                 d3's data join instead, with a message that names neither
 *                                                 the property nor the component.
 * @property {function}         rightAccessor      Data for the right side. Same requirements as leftAccessor.
 * @property {function}         [leftRefAccessor]  Reference data for the left side, drawn as a single path
 *                                                 outlining the reference series. Optional, but the guard
 *                                                 tests whether the accessor was set, not what it returns: an
 *                                                 accessor that yields undefined or null for some states
 *                                                 throws instead of hiding the line. Returning an empty array
 *                                                 does hide it, though the classed path element stays in the
 *                                                 DOM with no d attribute, where CSS and hit tests can still
 *                                                 find it.
 * @property {function}         [rightRefAccessor] Reference data for the right side. Same as leftRefAccessor.
 *
 * Note: the reference lines and the bars are drawn in slightly different coordinate
 * systems. The bars are pushed outwards by SPINE_PADDING, a deliberate cosmetic gap at the
 * spine, while the line is drawn straight from barWidth and so agrees with the axis scale.
 * A reference value equal to a bar value therefore lands half a pixel inside that bar's
 * outer edge, symmetrically on both sides. The line also takes its y from barPosition alone
 * and never accounts for barHeight, so the outline runs along the bars' top edges rather
 * than their mid-lines, half a bar height above the values it describes.
 *
 * Note: a reference line's d attribute is only ever written through a transition, so a
 * freshly rendered path carries no geometry until the first animation frame. Entering lines
 * snap into place, because d3 has no previous d to interpolate from; only updates animate.
 * The bars underneath do not animate at all - bar's transition property is inert - so on a
 * state change the outline eases towards its new position while the bars jump, and the two
 * visibly detach for the length of the transition.
 *
 * Note: the reference datum is wrapped in an array, one array of points per path, so each
 * side is capped at a single line. While a reference accessor is set the join therefore
 * always has exactly one element and the exit selection can never fire: once a line has
 * been rendered its path element stays in the DOM even after the reference data goes away,
 * with only its d attribute dropped. Only removing the accessor itself empties the group.
 *
 * Note: bar guards every geometry value against NaN, but the reference line hands barWidth
 * and barPosition straight to d3.line. One missing value poisons the path string, and the
 * browser renders the valid prefix and drops the rest of the outline.
 *
 * Note: the reference line's appearance comes entirely from the
 * .sszvis-pyramid__referenceline rule in sszvis.css - the component sets only the class.
 * Without that stylesheet the path renders as a solid black shape, since fill defaults to
 * black. stackedPyramid's otherwise identical line component inlines the same four values
 * instead. See test/component/pyramid.test.ts.
 *
 * @return {sszvis.component}
 */

/**
 * The bar dimensions are wrapped by fn.functor on set, so they are always stored as
 * functions by the time the renderer reads them. The parameters are variadic because d3
 * calls them with the datum, the index and the group - except on the left side, where the
 * component calls barWidth itself with the datum alone.
 */
type ValueAccessor<D, R> = (datum: D, index: number) => R;
/**
 * Pulls one side's series out of the chart's datum. Unlike the bar dimensions these are
 * stored exactly as they were set, so they are always functions, and the datum they read
 * is whatever the caller bound to the chart layer.
 */
type SideAccessor<T, D> = (data: T) => D[];
/**
 * How a bar dimension reads back once it is stored. Both parameters are optional because a
 * constant becomes a functor that ignores its arguments, and because the component calls
 * barWidth itself with the datum alone when placing the left bars.
 */
type StoredAccessor$1<D, R> = (datum?: D, index?: number) => R;
/**
 * A constant or an accessor over one bar's datum; either is accepted for the bar
 * dimensions, since fn.functor normalises both.
 */
type PyramidValue<D, R> = R | ValueAccessor<D, R>;
interface PyramidComponent<T = unknown, D = unknown> extends Component {
    barHeight(): StoredAccessor$1<D, number>;
    barHeight<V = D>(value: PyramidValue<V, number>): PyramidComponent<T, D>;
    barWidth(): StoredAccessor$1<D, number>;
    barWidth<V = D>(value: PyramidValue<V, number>): PyramidComponent<T, D>;
    barPosition(): StoredAccessor$1<D, number>;
    barPosition<V = D>(value: PyramidValue<V, number>): PyramidComponent<T, D>;
    barFill(): StoredAccessor$1<D, string | undefined>;
    barFill<V = D>(value: PyramidValue<V, string | undefined>): PyramidComponent<T, D>;
    tooltipAnchor(): (number | string)[];
    tooltipAnchor(anchor: (number | string)[]): PyramidComponent<T, D>;
    leftAccessor(): SideAccessor<T, D>;
    leftAccessor<U = T, V = D>(accessor: SideAccessor<U, V>): PyramidComponent<T, D>;
    rightAccessor(): SideAccessor<T, D>;
    rightAccessor<U = T, V = D>(accessor: SideAccessor<U, V>): PyramidComponent<T, D>;
    leftRefAccessor(): SideAccessor<T, D> | undefined;
    leftRefAccessor<U = T, V = D>(accessor: SideAccessor<U, V>): PyramidComponent<T, D>;
    rightRefAccessor(): SideAccessor<T, D> | undefined;
    rightRefAccessor<U = T, V = D>(accessor: SideAccessor<U, V>): PyramidComponent<T, D>;
}
declare function export_default$d<T = unknown, D = unknown>(): PyramidComponent<T, D>;

/**
 * Sankey component
 *
 * This component is used for making sankey diagrams, also known as parallel sets diagrams. They
 * depict individual entities as bars, and flows between those entities as thick links connecting
 * those bars. The entities can be many things associated with flows, for example organizations,
 * geographic regions, or websites, while the links between them can represent many kinds of flows,
 * for example payments of money, movements of people, or referral of browsing traffic. In this component,
 * the entities are referred to as 'nodes', and the connections between them are referred to as 'links'.
 *
 * @module sszvis/component/sankey
 *
 * @requires sszvis.component.bar
 *
 * @property {Function} sizeScale                    A scale function for the size of the nodes. The domain and the range should be configured using
 *                                                   values returned by the sszvis.layout.sankey.computeLayout function. It scales the links as well:
 *                                                   a link's thickness is sizeScale(value) and its offset within its node sizeScale(srcOffset).
 *                                                   Required, and an unset scale throws "props.sizeScale is not a function".
 * @property {Function} columnPosition               A scale function for the position of the columns of nodes. Should be configured using a value
 *                                                   returned by the sszvis.layout.sankey.computeLayout function. Required, and throws like sizeScale
 *                                                   when unset. It is called with a column index for the column labels as well as for the nodes, so
 *                                                   it is also consulted for columns that hold no node.
 * @property {Number} nodeThickness                  A number for the horizontal thickness of the node bars. Should be configured using a value
 *                                                   returned by the sszvis.layout.sankey.computeLayout function. Required, but omitting it is not
 *                                                   reported: Math.max(undefined, 1) is NaN, which bar's missing-value guard turns into zero-width
 *                                                   bars, while the column labels, the hit boxes and the tooltip anchors keep the NaN. Must be a
 *                                                   plain number - an accessor, which most other properties in this library accept, is used in
 *                                                   arithmetic and yields the same NaN. The bar's width is floored at one pixel but the link starts
 *                                                   and the column label centring read the raw value, so below a thickness of one the two disagree.
 * @property {Number} nodePadding                    A number for padding between the nodes. Should be configured using a value returned by the
 *                                                   sszvis.layout.sankey.computeLayout function. It applies between nodes only; the links stacked
 *                                                   inside a node are spaced by the size scale alone and fill it exactly. It also sets how far a
 *                                                   label hit box extends past its node, half of it above and half below. Required, must be a plain
 *                                                   number, and fails as silently as nodeThickness: every node's position becomes NaN, which bar
 *                                                   turns into 0, so the whole column collapses onto one row.
 * @property {Number, Function} columnPadding        A number, or function that takes a column index and returns a number, for padding at the top of
 *                                                   each column. Used to vertically center the columns. Required despite the functor wrapper: it has
 *                                                   no default, so leaving it unset throws "props.columnPadding is not a function". An accessor is
 *                                                   called with the column index alone, without d3's index and group arguments.
 * @property {String, Function} columnLabel          A string, or a function that returns a string, for the label at the top of each column. Defaults
 *                                                   to "", so the text elements are always in the DOM, and so are their ticks - which sszvis.css
 *                                                   gives a stroke, so an unlabelled chart still shows a short line per column pointing at nothing. A
 *                                                   function is called with the column index alone, not with the label's own datum, which is that
 *                                                   column's node count; columnLabelOffset decorates the same element but takes the datum first. One
 *                                                   label and one tick are drawn per entry in data.columnLengths, whether or not a node lives in that
 *                                                   column.
 * @property {Number, Function} columnLabelOffset    A value for offsetting the column labels in the x axis. Used to move the column labels around if
 *                                                   you don't want them to be centered on the columns. This is useful in situations where the normal
 *                                                   label would overlap outer boundaries or otherwise be inconveniently positioned. You can usually
 *                                                   forget this, except perhaps in very narrow screen layouts. Default 0. It shifts the label only -
 *                                                   the tick stays centred on the column - and horizontally only; the vertical position is fixed. A
 *                                                   function is applied by d3 rather than by the renderer, so it receives the label's datum, that
 *                                                   column's node count, followed by the column index.
 * @property {Number} linkCurvature                  A number to specify the amount of 'curvature' of the links. Should be between 0 and 1. Default
 *                                                   0.5, which puts both control points at the horizontal midpoint. Never clamped: at 1 the control
 *                                                   points swap ends, which still keeps the curve inside the column gap as a pronounced S, and above
 *                                                   1 they leave the gap altogether and the curve swings out past both columns. Must be a plain
 *                                                   number, like nodeThickness; an accessor yields NaN control points and the browser drops the path.
 * @property {Color, Function} nodeColor             Color for the nodes. Can be a function that takes a node's data and returns a color. Optional:
 *                                                   when unset no fill attribute is written and the bars fall back to the stylesheet.
 * @property {Color, Function} linkColor             Color for the links. Can be a function that takes a link's data and returns a color. Optional, as
 *                                                   nodeColor: unset leaves the stroke attribute off the paths.
 * @property {Function} linkSort                     A function determining how to sort the links, which are rendered stacked on top of each other.
 *                                                   The comparator is handed to d3's selection.sort, which orders the elements ascending, so the
 *                                                   comparator's largest link is the last one in the document and paints over all the others. The
 *                                                   default comparator is ascending by value, so the thickest links paint over the thinnest, undoing
 *                                                   in the DOM the descending order sszvis.layout.sankey.prepareData put the array in for the
 *                                                   opposite reason. Reverse it to keep the thin links on top. The property is wrapped in fn.functor,
 *                                                   so a value that is not a function is silently turned into a comparator claiming every pair is
 *                                                   already ordered. The sort reorders elements only; the data array, and with it the link tooltip
 *                                                   anchors, keeps its original order.
 * @property {String, Function} labelSide            A function determining the position of labels for the nodes. Should take a column index and
 *                                                   return a side ('left' or 'right'). Default is always 'left'. A function receives the column index
 *                                                   alone, without d3's index and group arguments. The test is `=== "left"`, so any other value, a
 *                                                   typo included, silently lands the label on the right, and labelSideSwitch then maps it to 'left'.
 * @property {Boolean} labelSideSwitch               A boolean used to determine whether to switch the label side. When true, 'left' labels will be
 *                                                   shown on the right side, and 'right' labels on the left side. This is useful as a switch to be
 *                                                   flipped in very narrow screen layouts, when you want the labels to appear on the opposite side of
 *                                                   the columns they refer to. The hit boxes follow the switch as well.
 * @property {Number, Function} labelOpacity         A value for the opacity of the node labels, or a function over a node returning one. Default 1.
 *                                                   Despite what this property used to claim, it is applied to the node labels: the column labels
 *                                                   never receive an opacity at all, and no property hides them. Use it to fade the node names out
 *                                                   when they would overlap with user-triggered hover labels.
 * @property {Number} labelHitBoxSize                A number for the width of the transparent 'hit boxes' drawn over the labels. This should
 *                                                   basically be equal to the width of the widest label. For performance reasons, it doesn't make
 *                                                   sense to calculate this value at run time while the component is rendered. Far better is to
 *                                                   position the chart so that the labels are visible, find the value of the widest label, and use
 *                                                   that. Default 0, which leaves a box exactly as wide as a node. Must be a plain number: the width
 *                                                   is computed once, from labelHitBoxSize plus nodeThickness, so every box is the same width
 *                                                   whatever its own label says. The boxes are appended after the labels and so paint over them,
 *                                                   which is what lets them catch the pointer.
 * @property {Function} nameLabel                    A function which takes the id of a node and should return the label for that node. Defaults to
 *                                                   using the id directly. The only label accessor that has to be a function: it is not wrapped in
 *                                                   fn.functor, so a constant throws "props.nameLabel is not a function".
 * @property {Array} linkSourceLabels                An array containing the data for links which should have labels on their 'source' end, that is
 *                                                   the end of the link which is connected to the source node. These data values should match the
 *                                                   values returned by sszvis.layout.sankey.prepareData. For performance reasons, you need to give
 *                                                   the data values themselves here. See the examples for an implementation of the most
 *                                                   straightforward mechanism for this. Defaults to []. The array is used as given and never checked
 *                                                   against data.links, so a stale link object still renders a label, positioned from its own src and
 *                                                   tgt and so at a place where no link is drawn.
 * @property {Array} linkTargetLabels                An array containing data for links which should have labels on their 'target' end, that is the
 *                                                   end of the link which is connected to the target node. Works the same as linkSourceLabels, but
 *                                                   used for another set of possible link labels.
 * @property {String, Function} linkLabel            A string or function returning a string to use for the label of each link. Function versions
 *                                                   should accept a link datum (like the ones passed into linkSourceLabels or linkTargetLabels) and
 *                                                   return text. Optional: when unset the label elements are still created for every entry in
 *                                                   linkSourceLabels and linkTargetLabels, with no text in them.
 *
 * Note: the component always creates four sub-groups, in this order: nodes, links,
 * linklabels and nodelabels. The order is load-bearing, since it makes the links paint over
 * the node bars, and every group is created even when there is nothing to put in it. The
 * column labels and their ticks are not among them: they are selected off the same selection
 * the bars are rendered into, so they live in the nodes group alongside the rects and the
 * tooltip anchors. They can still be styled by class - .sszvis-sankey-column-label in
 * sszvis.css does exactly that - but there is no group of their own to transform, fade or
 * make click-through as a unit. Their vertical position is a hard-coded -24, above the
 * group's origin, so they depend on the chart's top padding to be visible at all.
 *
 * Note: a one pixel gap is left between a node and the links attached to it, so the curves
 * never quite touch the bars. It is a local constant, deliberately not a property, and it
 * does not scale with the chart.
 *
 * Note: only the node bars are guarded against missing values. They are drawn by bar, which
 * replaces NaN with 0, while the link paths, the labels and the hit boxes are written here
 * by hand from the same numbers. A size scale that returns NaN for one value - a d3 scale
 * fed undefined, a gap in the data - therefore gives that node a bar of zero height and its
 * links a d and a stroke-width of NaN, which the browser drops entirely: the node renders
 * and the link disappears. Nothing is logged either way.
 *
 * Note: a node's box is snapped to whole pixels, the position floored and the height ceiled,
 * so neighbouring nodes never leave a sub-pixel gap between them. The link geometry is not
 * rounded. The links do start from the same floored position as the bar, so they stay glued
 * to its top edge, but the stack of links inside a node can finish up to a pixel short of
 * the bar's bottom edge.
 *
 * Note: the nodes end up with their tooltip anchors written twice. bar renders its own
 * anchors into the group it is called on, and the component then calls a second
 * tooltipAnchor on the same group. Both join to [data-tooltip-anchor] over data.nodes, so
 * the second pass reuses the first one's rects and overwrites their transforms rather than
 * adding any. What is observable is four anchors rather than eight, centred on the nodes
 * rather than at bar's default top-centre.
 *
 * Note: the links are keyed by id, so a link keeps its path element across renders, but the
 * nodes go through bar, whose join is unkeyed, so rect identity follows the array index. A
 * reordered node array moves no element; it rewrites the attributes in place, and each rect
 * ends up bound to a different node. That matters for anything holding on to a rect, such as
 * a hover handler.
 *
 * Note: the component never sets bar's transition property, so it keeps bar's default of
 * true - and that transition does not animate anything, so the nodes jump straight to their
 * new geometry. It is not free either: a d3 transition is still created and discarded on
 * every node rect on every render. See test/component/sankey.test.ts.
 *
 * @return {sszvis.component}
 */

/**
 * One entity in the diagram, drawn as a bar, as sszvis.layout.sankey.prepareData produces
 * it. Everything up to valueOffset is what the component reads.
 */
type SankeyNode = {
    /** The node's unique id, also its default label. */
    id: string;
    /** Which column the node belongs to. Indexes both columnPosition and columnPadding. */
    columnIndex: number;
    /** The node's position within its column, counted in nodes. */
    nodeIndex: number;
    /** The node's total flow, which becomes its height once passed through sizeScale. */
    value: number;
    /** The total flow of all the nodes above this one in its column. */
    valueOffset: number;
    /**
     * The links leaving this node. Filled in by the layout and never read by the component,
     * but the usual handle for hover and highlight code - see the linkSourceLabels examples.
     */
    linksFrom?: SankeyLink[];
    /** The links arriving at this node. As linksFrom, the component never reads it. */
    linksTo?: SankeyLink[];
};
/**
 * One flow between two nodes, drawn as a curve. The source and target are the node objects
 * themselves rather than ids, so a link carries its own geometry.
 */
type SankeyLink = {
    /** Identifies the link across renders; the data join is keyed on it. */
    id: number;
    /** The size of the flow, which becomes the curve's thickness once passed through sizeScale. */
    value: number;
    /** The node the link leaves. */
    src: SankeyNode;
    /** The total flow of all the links leaving the same node above this one. */
    srcOffset: number;
    /** The node the link arrives at. */
    tgt: SankeyNode;
    /** The total flow of all the links arriving at the same node above this one. */
    tgtOffset: number;
};
/** Which side of its node a label is drawn on. */
type LabelSide = "left" | "right";
/** Maps a node's or a link's value to a number of pixels. A d3 linear scale in practice. */
type SizeScale = (value: number) => number;
/** Maps a column index to that column's horizontal position. A d3 linear scale in practice. */
type ColumnScale = (columnIndex: number) => number;
/**
 * A constant or an accessor over a datum; either is accepted wherever fn.functor normalises
 * the value on set. d3 hands an accessor the datum and its index, and declaring fewer
 * parameters is fine.
 */
type SankeyValue<D, R> = R | ((datum: D, index: number) => R);
/**
 * How a functor-wrapped property reads back once it is stored. Both parameters are optional,
 * because a constant becomes a functor that ignores its arguments, and because the renderer
 * calls several of these itself with only some of the arguments d3 would pass.
 */
type StoredAccessor<D, R> = (datum?: D, index?: number) => R;
/**
 * A colour, or nothing when the property was never set - fn.functor then yields undefined,
 * which d3 treats exactly like null and removes the attribute for. The null is for d3's
 * benefit: its attr overloads accept null but not undefined. Same convention as bar's fill
 * and stroke.
 */
type ColorAccessor<D> = (datum?: D, index?: number) => string | null;
/** A label's text, or nothing when the property was never set. As ColorAccessor. */
type LabelAccessor<D> = (datum?: D, index?: number) => string | null;
/**
 * How the three column-driven properties read back. The renderer calls each of them itself,
 * with a column index and nothing else, so unlike the datum accessors above they never see
 * an index in the second position.
 */
type ColumnAccessor<R> = (columnIndex?: number) => R;
/** A constant, or that same single-argument accessor. */
type ColumnValue<R> = R | ((columnIndex: number) => R);
/**
 * Orders the links against each other, deciding which one is painted on top. Unlike the
 * accessors above, both parameters are required: the renderer never calls the comparator
 * itself, it only hands it to d3's own sort, which always passes two links. A constant is
 * still accepted on set, because fn.functor wraps it into a function that ignores its
 * arguments and declaring fewer parameters is fine.
 */
type LinkComparator = (a: SankeyLink, b: SankeyLink) => number;
/**
 * The column label offset is the one column property that is applied by d3 rather than by
 * the renderer, so it is handed the datum bound to the label - the column's node count -
 * followed by the column index. Note that columnLabel, which decorates the same element,
 * takes the index in the first position instead. The parameter names are the point of this
 * type; structurally it is the same shape as the datum accessors.
 */
type ColumnLabelOffset = (columnLength?: number, index?: number) => number;
/** What may be passed for the column label offset: a constant, or that same accessor. */
type ColumnLabelOffsetValue = number | ((columnLength: number, index: number) => number);
/**
 * `component()` hands back whatever interface it is asked for, but the two builder methods it
 * inherits are declared as returning the plain Component, so a component interface has to
 * re-declare them to survive its own construction chain. Without this the chain widens to
 * `any` at the first default and nothing in it is checked.
 */
interface SankeyBuilder extends Component {
    prop<V>(prop: string, setter?: PropertySetter<V>): SankeyComponent;
    render(callback: RenderCallback): SankeyComponent;
}
/**
 * Setters take `<U = ...>` so that an accessor over a narrower datum type can be passed
 * without naming it at the call site.
 */
interface SankeyComponent extends SankeyBuilder {
    sizeScale(): SizeScale;
    sizeScale(scale: SizeScale): SankeyComponent;
    columnPosition(): ColumnScale;
    columnPosition(scale: ColumnScale): SankeyComponent;
    nodeThickness(): number;
    nodeThickness(thickness: number): SankeyComponent;
    nodePadding(): number;
    nodePadding(padding: number): SankeyComponent;
    columnPadding(): ColumnAccessor<number>;
    columnPadding(value: ColumnValue<number>): SankeyComponent;
    columnLabel(): ColumnAccessor<string>;
    columnLabel(value: ColumnValue<string>): SankeyComponent;
    columnLabelOffset(): ColumnLabelOffset;
    columnLabelOffset(value: ColumnLabelOffsetValue): SankeyComponent;
    linkCurvature(): number;
    linkCurvature(curvature: number): SankeyComponent;
    nodeColor(): StoredAccessor<SankeyNode, string | undefined> | undefined;
    nodeColor<U = SankeyNode>(value: SankeyValue<U, string | undefined>): SankeyComponent;
    linkColor(): ColorAccessor<SankeyLink> | undefined;
    linkColor<L = SankeyLink>(value: SankeyValue<L, string | undefined>): SankeyComponent;
    linkSort(): LinkComparator;
    linkSort<L = SankeyLink>(comparator: (a: L, b: L) => number): SankeyComponent;
    labelSide(): ColumnAccessor<LabelSide>;
    labelSide(value: ColumnValue<LabelSide>): SankeyComponent;
    labelSideSwitch(): boolean | undefined;
    labelSideSwitch(value: boolean): SankeyComponent;
    labelOpacity(): StoredAccessor<SankeyNode, number>;
    labelOpacity<U = SankeyNode>(value: SankeyValue<U, number>): SankeyComponent;
    labelHitBoxSize(): number;
    labelHitBoxSize(size: number): SankeyComponent;
    nameLabel(): (id: string) => string;
    nameLabel(accessor: (id: string) => string): SankeyComponent;
    linkSourceLabels(): SankeyLink[];
    linkSourceLabels(links: SankeyLink[]): SankeyComponent;
    linkTargetLabels(): SankeyLink[];
    linkTargetLabels(links: SankeyLink[]): SankeyComponent;
    linkLabel(): LabelAccessor<SankeyLink> | undefined;
    linkLabel<L = SankeyLink>(value: SankeyValue<L, string | undefined>): SankeyComponent;
}
declare function export_default$c(): SankeyComponent;

/**
 * Stacked Area component
 *
 * Stacked area charts are useful for showing how component parts contribute to a total quantity
 *
 * The component renders the output of a d3 stack layout rather than computing one itself, so some
 * of its configuration properties are similar. It requires an array of layer objects, where each
 * layer object represents a layer in the stack and is itself the array of points along that layer's
 * outline. Three independent dimensions are read from each point: x, and the two vertical bounds of
 * the band at that x.
 *
 * @module sszvis/component/stackedArea
 *
 * @template P The type of one point along a layer
 * @template L The type of one layer, an Iterable of P
 *
 * @property {number, function} x             An accessor for the x-value of a point, or a constant.
 *                                            Should return a value in screen pixels. Required, and
 *                                            its absence is not reported: an unset dimension
 *                                            resolves to a constant NaN, so every coordinate is
 *                                            written as NaN, the browser rejects the path, and the
 *                                            chart is simply empty.
 * @property {number, function} y0            An accessor for the lower bound of the band at a
 *                                            point, i.e. the baseline, or a constant. In screen
 *                                            pixels. Required. When it is missing the top line is
 *                                            still written and the browser drops the shape at the
 *                                            first NaN.
 * @property {number, function} y1            An accessor for the upper bound of the band at a
 *                                            point, or a constant. In screen pixels. Required, and
 *                                            the most damaging of the three to omit because it
 *                                            renders successfully: d3 reads a null-ish upper bound
 *                                            as no upper bound and falls back to y0, so each layer
 *                                            collapses onto its own baseline and becomes a
 *                                            zero-height sliver. With the default white stroke the
 *                                            chart looks like a set of line charts. null and
 *                                            undefined are treated identically here.
 * @property {string, function} [fill]        The area fill, as a colour or an accessor over a whole
 *                                            layer. It has no default, and unlike .sszvis-line
 *                                            there is no .sszvis-path rule in sszvis.css to fall
 *                                            back on - the class is only a hook - so an area with
 *                                            no fill renders as a black slab, the SVG initial
 *                                            value. An accessor returning undefined removes the
 *                                            attribute rather than warning, so a colour scale
 *                                            configured with .unknown(undefined) is black too.
 *                                            Every chart in docs/area-chart-stacked sets a fill.
 * @property {string, function} [stroke]      The area stroke, as a colour or an accessor over a
 *                                            whole layer. Defaults to #ffffff, the hairline that
 *                                            visually separates two touching layers. The default is
 *                                            applied as `props.stroke || "#ffffff"`, which tests
 *                                            for truthiness rather than for having been set, so
 *                                            both null and "" - the two ways a caller would ask for
 *                                            no stroke - come back white. Only an accessor gets
 *                                            through, because a function is always truthy: `() =>
 *                                            null` removes the attribute and `() => ""` writes an
 *                                            invalid paint, and both compute to none.
 * @property {number, function} [strokeWidth] The stroke-width, as a number or an accessor over a
 *                                            whole layer. Defaults to 1, applied with an explicit
 *                                            undefined check, so 0 survives where a falsy fallback
 *                                            would have replaced it. null is passed through to d3,
 *                                            which reads a null-ish value as a removal: unset means
 *                                            1, null means no attribute at all.
 * @property {boolean, function} [defined]    A per-point predicate handed to d3.area, deciding
 *                                            whether a point is drawn; a constant is coerced to a
 *                                            boolean. Each surviving run of points becomes its own
 *                                            subpath, and a run of one point is emitted as a
 *                                            degenerate top-and-bottom pair. The default accepts
 *                                            every point whatever its value (see below), so this is
 *                                            the only missing-value guard available, and it has to
 *                                            test both bounds by hand because it replaces the
 *                                            default rather than composing with it.
 * @property {function} [key]                 The key function for the data join, called with a
 *                                            layer and its index. The value it returns should be
 *                                            unique among layers. Defaults to the
 *                                            index, which matches layers by position; setting it
 *                                            preserves object constancy across renders, which
 *                                            matters when a chart transitions between stacked and
 *                                            separated views.
 * @property {boolean} transition             Whether to transition the layers when their values
 *                                            change. Defaults to true.
 *
 * Note: the dimension accessors and defined are called by d3.area with a single point, that point's
 * index within the layer, and the array of points the layer is drawn from. fill, stroke and
 * strokeWidth are called by the selection with the datum for a whole layer, that layer's index, and
 * d3's group of path nodes. The style-related accessors therefore receive the array of points
 * rather than a point, the inverse of what the dimensions receive - the same asymmetry documented
 * on line.
 * key sees a layer and its index too, but its third argument depends on which half of the keyed
 * join is running: the array of incoming layers, or the group of nodes already in the DOM.
 *
 * Note: the default defined predicate never rejects anything. It reproduces the one it replaced,
 * which read `function () { return fn.compose(fn.not(isNaN), props.y0) && fn.compose(...y1); }` and
 * so returned a function rather than calling either composed accessor, and a function is truthy,
 * which is all d3 tests. A NaN therefore reaches the d attribute verbatim, the browser stops
 * rendering at the invalid command, and the whole layer disappears rather than only the segment the
 * missing value belongs to. undefined goes the same way, since d3.area applies unary + to it, and
 * null is not caught by an isNaN guard at all: it coerces to 0 and is plotted as data, pinning that
 * point to the top of the chart. Nothing is reported in any of these cases. line writes its
 * two-dimension guard by hand for this reason.
 *
 * Note: with transition enabled the selection is replaced by the transition before any attribute is
 * written, so d, fill, stroke and stroke-width are all deferred and the class is the only thing
 * applied synchronously. A freshly rendered chart is an empty path element until the first
 * animation frame runs, and anything measuring it synchronously - getTotalLength, a bounding box, a
 * screenshot - sees nothing. line defers d and stroke-width the same way but still writes its
 * stroke synchronously, and bar and dot write their geometry synchronously, so this is the widest
 * version of the hole.
 *
 * Note: the deferred attributes do not enter uniformly. d and the two colours jump to their target
 * on the first frame, because d3 interpolates from the element's current value and there is none to
 * pair with, while stroke-width animates up from 0, because a numeric interpolation coerces the
 * missing start value and +null is 0. The layers appear at full size with a hairline that thickens
 * over the transition. Routing the colours through the transition also rewrites them as rgb(), so a
 * stylesheet or a test matching the hex string that was passed in will not find it.
 *
 * Note: the header this replaces documented a valuesAccessor property, saying the default treats
 * the layer object as an array of values. The component never declared it, so the setter does not
 * exist and calling it throws a TypeError, and a wrapper object cannot be unwrapped: d3.area runs
 * the datum through Array.from, which yields [] for a plain object, so a layer that is not an array
 * is silently skipped as an empty path. stackedAreaMultiples, a near-copy of this component, does
 * declare valuesAccessor.
 *
 * Note: the data join matches on the generic .sszvis-path class, which pie, stackedAreaMultiples
 * and stackedPyramid also use. A path another component left in the same group is bound to layer
 * zero and repainted as an area rather than being left alone. Harmless while each component owns
 * its own selectGroup, which is how every example is written, and benign here because this
 * component rewrites every attribute it uses - the cost falls on whichever component owned the
 * path. The same collision corrupts pie's own geometry when it is read from the other side.
 *
 * Note: nothing constrains the geometry. A layer with no points yields a path element with no d
 * attribute, a single point yields a closed shape that encloses no area but still draws a vertical
 * hairline in the default stroke, and a band whose y1 lies below y0 simply winds the other way. See
 * test/component/stackedArea.test.ts.
 *
 * @return {sszvis.component}
 */

/**
 * The dimension accessors are handed to d3.area, which calls them with a single point, that
 * point's index within the layer, and the array of points the layer is drawn from.
 */
type PointAccessor$1<P, R> = (datum: P, index: number, points: P[]) => R;
/**
 * The style accessors are handed to the d3 selection, which calls them with the datum for a
 * whole layer and that layer's index within the outer array - not with a single point -
 * followed by d3's group of path nodes, with the node itself as `this`. That is exactly
 * d3's own ValueFn, so declaring fewer parameters stays fine while a callback that needs
 * the group can still be written.
 */
type LayerAccessor$1<L, R> = ValueFn<SVGPathElement, L, R>;
/**
 * The key is handed to selection.data, which calls it once for each half of the keyed join:
 * over the nodes already in the DOM, with the node as `this` and the node group as the third
 * argument, and over the incoming layers, with the parent as `this` and the array of layers
 * instead. Both `this` and the group therefore differ between the two halves, which is why
 * this is not a ValueFn.
 */
type KeyAccessor$1<L, R> = (this: Element, datum: L, index: number, group: ArrayLike<Element> | ArrayLike<L>) => R;
/** Either a constant or an accessor; the three dimensions accept both. */
type AreaValue$1<P> = number | PointAccessor$1<P, number>;
/** Either a constant or an accessor, over one whole layer. */
type StyleValue$1<L, R> = R | LayerAccessor$1<L, R>;
interface StackedAreaComponent<P = unknown, L extends Iterable<P> = P[]> extends Component {
    x(): AreaValue$1<P> | undefined;
    x<Q = P>(value: AreaValue$1<Q>): StackedAreaComponent<P, L>;
    y0(): AreaValue$1<P> | undefined;
    y0<Q = P>(value: AreaValue$1<Q>): StackedAreaComponent<P, L>;
    y1(): AreaValue$1<P> | null | undefined;
    y1<Q = P>(value: AreaValue$1<Q> | null): StackedAreaComponent<P, L>;
    fill(): StyleValue$1<L, string> | null | undefined;
    fill<M = L>(value: StyleValue$1<M, string> | null): StackedAreaComponent<P, L>;
    stroke(): StyleValue$1<L, string> | null | undefined;
    stroke<M = L>(value: StyleValue$1<M, string> | null): StackedAreaComponent<P, L>;
    strokeWidth(): StyleValue$1<L, number> | null | undefined;
    strokeWidth<M = L>(value: StyleValue$1<M, number> | null): StackedAreaComponent<P, L>;
    defined(): boolean | PointAccessor$1<P, boolean> | undefined;
    defined<Q = P>(predicate: boolean | PointAccessor$1<Q, boolean>): StackedAreaComponent<P, L>;
    key(): KeyAccessor$1<L, string | number>;
    key<M = L>(accessor: KeyAccessor$1<M, string | number>): StackedAreaComponent<P, L>;
    transition(): boolean;
    transition(enabled: boolean): StackedAreaComponent<P, L>;
}
declare function export_default$b<P = unknown, L extends Iterable<P> = P[]>(): StackedAreaComponent<P, L>;

/**
 * Stacked Area Multiples component
 *
 * This component, like stackedArea, requires an array of layer objects, where each layer object is
 * one of the multiples. In addition to stackedArea, this chart's layers can be separated to provide
 * two views on the data: a sum of all elements as well as every element on its own. It renders the
 * output of a d3 stack layout rather than computing one itself, so some of its configuration
 * properties are similar; in the separated view the baseline comes from an ordinal position scale
 * rather than from the stack, but the datum is the same. Each layer object is unwrapped by
 * valuesAccessor, which defaults to treating it as the array of points along that layer's outline.
 * Three independent dimensions are read from each point: x, and the two vertical bounds of the band
 * at that x.
 *
 * @module sszvis/component/stackedAreaMultiples
 *
 * @template P The type of one point along a layer
 * @template L The type of one layer, whatever valuesAccessor unwraps into points
 *
 * @property {number, function} x             An accessor for the x-value of a point, or a constant.
 *                                            Should return a value in screen pixels. Required, and
 *                                            its absence is not reported: an unset dimension
 *                                            resolves to a constant NaN, so every coordinate is
 *                                            written as NaN, the browser rejects the path, and the
 *                                            chart is simply empty.
 * @property {number, function} y0            An accessor for the lower bound of the band at a
 *                                            point, i.e. the baseline, or a constant. In screen
 *                                            pixels. Required. When it is missing the top line is
 *                                            still written and the baseline arrives as NaN.
 * @property {number, function} y1            An accessor for the upper bound of the band at a
 *                                            point, or a constant. In screen pixels. Required, and
 *                                            the most damaging of the three to omit because it
 *                                            renders successfully: d3 reads a null-ish upper bound
 *                                            as no upper bound and falls back to y0, so each band
 *                                            collapses onto its own baseline and becomes a
 *                                            zero-height sliver - and with no default stroke to
 *                                            draw it, there is nothing on screen. The code tests
 *                                            `props.y1 == null`, as d3 does, so an explicit null is
 *                                            read as unset too.
 * @property {string, function} [fill]        The area fill, as a colour or an accessor over a whole
 *                                            layer. It has no default, and unlike .sszvis-line
 *                                            there is no .sszvis-path rule in the stylesheet to
 *                                            fall back on - the class is only a hook - so an area
 *                                            with no fill renders as a black slab, the SVG initial
 *                                            value. An accessor returning undefined removes the
 *                                            attribute rather than warning, so a colour scale
 *                                            configured with .unknown(undefined) is black too.
 *                                            Every chart in docs/area-chart-stacked sets a fill.
 * @property {string, function} [stroke]      The area stroke, as a colour or an accessor over a
 *                                            whole layer. Unlike stackedArea, which defaults it to
 *                                            the #ffffff hairline that separates two touching
 *                                            layers, this component has no default at all, so
 *                                            touching bands run together, and null and "" are
 *                                            passed through as given: null removes the attribute
 *                                            and "" writes an invalid paint, both computing to
 *                                            none, which is what an unset stroke does too.
 *                                            Harmless in the separated view, where
 *                                            stackedAreaMultiplesLayout spaces the bands so they
 *                                            never touch - but since the docs example sets no
 *                                            stroke on either component, the stacked view of a
 *                                            chart gets stackedArea's white hairline while the
 *                                            separated view gets none.
 * @property {number, function} [strokeWidth] The stroke-width, as a number or an accessor over a
 *                                            whole layer. Defaults to 1, applied with an explicit
 *                                            undefined check, so 0 survives where a falsy fallback
 *                                            would have replaced it. null is passed through to d3,
 *                                            which reads a null-ish value as a removal: unset means
 *                                            1, null means no attribute at all. Since there is no
 *                                            default stroke, the width is inert until a stroke is
 *                                            set, and setting only strokeWidth draws nothing.
 * @property {boolean, function} [defined]    A per-point predicate handed to d3.area, deciding
 *                                            whether a point is drawn; a constant is coerced to a
 *                                            boolean. Each surviving run of points becomes its own
 *                                            subpath, and a run of one point is emitted as a
 *                                            degenerate top-and-bottom pair. Defaults to
 *                                            `() => true`, spelled out in place of the dead
 *                                            predicate it replaces (see below), so it accepts every
 *                                            point whatever its value: this is the only
 *                                            missing-value guard available, and it has to test both
 *                                            bounds by hand because it replaces the default rather
 *                                            than composing with it.
 * @property {function} [key]                 The key function for the data join, called with a
 *                                            layer and its index. The value it returns should be
 *                                            unique among layers. Defaults to the index - which,
 *                                            because the layers are reversed first, counts from the
 *                                            end of the array that was passed in, so dropping the
 *                                            *last* layer of the input reuses the first path node
 *                                            and rebinds it to a different layer, where
 *                                            stackedArea's default key drops the last node instead.
 *                                            Setting it preserves object constancy across renders,
 *                                            which matters when a chart switches between the
 *                                            stacked and the separated view.
 * @property {function} [valuesAccessor]      Pulls the points to draw out of one layer's datum.
 *                                            Defaults to the identity, which treats the layer
 *                                            object as the array of points itself. Set it when the
 *                                            layer objects are wrappers such as
 *                                            { name: "Name", values: [ ... ] }. It is consulted for
 *                                            the geometry and defined only: fill, stroke,
 *                                            strokeWidth and key still see the layer object, which
 *                                            is what lets the colour be read off the layer's name.
 * @property {boolean} transition             Whether to transition the layers when their values
 *                                            change. Defaults to true, and animates nothing (see
 *                                            below).
 *
 * Note: a constant dimension is coerced with unary + once, before the data join, exactly as d3's own
 * constant() would - so a numeric string works, while a value that has no numeric form, such as
 * "abc" or {}, becomes NaN once and every point of every layer is drawn from it, which d3 emits as
 * an invalid path rather than an error. Only a value whose coercion itself throws, such as a Symbol
 * or a BigInt, raises - and it raises before the join rather than once per point.
 *
 * Note: the layers are reversed before the data join, so the first layer of the array that was
 * passed in is the last path in the DOM and paints over the others. The line has carried an
 * unanswered "//sszsch why reverse?" comment since 2017, and nothing - not the header this replaces,
 * not docs/area-chart-stacked/README.md, not stackedAreaMultiplesLayout, which lays the bands out -
 * says why. stackedArea does not reverse, so the same datum comes out of the two components in
 * opposite order, and the toggle in docs/area-chart-stacked/sa-two.js moves every path on the
 * switch. The reversal also renumbers the layers, so the index handed to the style accessors, to
 * key and to valuesAccessor is the position in the reversed array: an index-keyed palette is
 * applied back to front here and front to back in stackedArea. The array itself is copied rather
 * than reversed in place, so a caller holding on to it - as sa-two.js does, rendering both views
 * from one datum - sees it unchanged. .join() orders the merged selection, so the paint order
 * follows the reversed data on every render, even when the nodes are reused.
 *
 * Note: transition animates nothing. The transition is created on its own statement and its return
 * value is dropped, so every attribute is written to the plain selection instead. It did animate
 * until 47f58578 ("perf: change .enter() to .join() API", Oct 2024), which dropped the `paths =`
 * the transition used to be assigned back to. As far as output goes the property is inert - the two
 * settings are indistinguishable in the DOM, before and after the 300ms the transition would have
 * taken - but it is not harmless: the transition is still scheduled, and a d3 transition interrupts
 * any unnamed transition already running on the same node when it starts, so a render freezes
 * another component's animation on a shared or adopted path mid-flight. bar carries the same
 * discarded-transition shape, though it writes its attributes before creating the transition, so its
 * elements are never blank. One visible consequence is that the switch into the separated view snaps
 * while the switch back, drawn by stackedArea, eases - the chart animates in one direction only, and
 * it is that switch the key property exists for. The one upside is that a freshly rendered chart is
 * complete on the same tick, with nothing to disable in order to measure it synchronously, where
 * stackedArea leaves an empty path element until the first animation frame.
 *
 * Note: the dimension accessors and defined are called by d3.area with a single point, that point's
 * index within the layer, and the array of points the layer is drawn from. fill, stroke,
 * strokeWidth and valuesAccessor are called by the selection with the datum for a whole layer, that
 * layer's index, and d3's group of path nodes, with the node itself as `this`. The style-related
 * accessors therefore receive the layer object rather than a point, the inverse of what the
 * dimensions receive - the same asymmetry documented on line.
 * key sees a layer and its index too, but its third argument depends on which half of the keyed
 * join is running: the array of incoming layers, or the group of nodes already in the DOM. That node
 * group is in the reversed order the previous render left it in, so the two halves of the join agree
 * only because the reversal is applied on every render.
 *
 * Note: the default defined predicate never rejects anything. It reproduces the one it replaced,
 * which read `function () { return fn.compose(fn.not(isNaN), props.y0) && fn.compose(...y1); }` and
 * so returned a function rather than calling either composed accessor, and a function is truthy,
 * which is all d3 tests. A NaN therefore reaches the d attribute verbatim, the browser stops
 * rendering at the invalid command, and the whole band disappears rather than only the segment the
 * missing value belongs to. undefined goes the same way, since d3.area applies unary + to it, and
 * null is not caught by an isNaN guard at all: it coerces to 0 and is plotted as data, pinning that
 * point to the top of the chart. Nothing is reported in any of these cases. stackedArea behaves
 * identically; line guards both of its dimensions by hand and works.
 * docs/area-chart-stacked/README.md describes the default of both components as "y0 and y1 are not
 * NaN", a guard that has never run, and the header this replaces did not mention defined at all.
 *
 * Note: forgetting valuesAccessor for a wrapper layer produces an empty chart rather than an error,
 * because d3.area runs its datum through Array.from and that yields [] for a plain object. An
 * accessor that returns nothing instead throws out of d3.area, which names neither the component
 * nor the property.
 *
 * Note: the data join matches on the generic .sszvis-path class, which pie, stackedArea and
 * stackedPyramid also use. A path another component left in the same group is bound to a layer and
 * repainted as an area rather than being left alone, and since every attribute here is written
 * unconditionally - an unset fill or stroke is written as null, which d3 reads as a removal - the
 * foreign path loses the colours it came with. Harmless while each component owns its own
 * selectGroup, which is how every example is written. The same collision corrupts pie's own
 * geometry when it is read from the other side.
 *
 * Note: nothing constrains the geometry, and nothing reports its own absence. A layer with no points
 * yields a path element with no d attribute, a single point yields a closed shape that encloses no
 * area and, with no default stroke, draws nothing at all, and a band whose y1 lies below y0 simply
 * winds the other way. With no props set at all the render still reports success - one correctly
 * classed path per layer, with neither fill nor stroke written and every coordinate NaN - so the DOM
 * looks healthy for a chart that is entirely empty. Binding a datum that is not iterable throws
 * "data is not iterable" out of the reversal, before the join. See
 * test/component/stackedAreaMultiples.test.ts.
 *
 * @return {sszvis.component}
 */

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
 * Pulls the points to draw out of one layer's datum. It is composed into the d attribute
 * callback, so it is called exactly like a style accessor - hence the same type.
 */
type ValuesAccessor<L, P> = LayerAccessor<L, Iterable<P>>;
/**
 * The key is handed to selection.data, which calls it once for each half of the keyed join:
 * over the nodes already in the DOM, with the node as `this` and the node group as the third
 * argument, and over the incoming layers, with the parent as `this` and the array of layers
 * instead. Both `this` and the group therefore differ between the two halves, which is why
 * this is not a ValueFn.
 */
type KeyAccessor<L, R> = (this: Element, datum: L, index: number, group: ArrayLike<Element> | ArrayLike<L>) => R;
/** Either a constant or an accessor; the three dimensions accept both. */
type AreaValue<P> = number | PointAccessor<P, number>;
/** Either a constant or an accessor, over one whole layer. */
type StyleValue<L, R> = R | LayerAccessor<L, R>;
interface StackedAreaMultiplesComponent<P = unknown, L = P[]> extends Component {
    x(): AreaValue<P> | undefined;
    x<Q = P>(value: AreaValue<Q>): StackedAreaMultiplesComponent<P, L>;
    y0(): AreaValue<P> | undefined;
    y0<Q = P>(value: AreaValue<Q>): StackedAreaMultiplesComponent<P, L>;
    y1(): AreaValue<P> | null | undefined;
    y1<Q = P>(value: AreaValue<Q> | null): StackedAreaMultiplesComponent<P, L>;
    fill(): StyleValue<L, string> | null | undefined;
    fill<M = L>(value: StyleValue<M, string> | null): StackedAreaMultiplesComponent<P, L>;
    stroke(): StyleValue<L, string> | null | undefined;
    stroke<M = L>(value: StyleValue<M, string> | null): StackedAreaMultiplesComponent<P, L>;
    strokeWidth(): StyleValue<L, number> | null | undefined;
    strokeWidth<M = L>(value: StyleValue<M, number> | null): StackedAreaMultiplesComponent<P, L>;
    defined(): boolean | PointAccessor<P, boolean> | undefined;
    defined<Q = P>(predicate: boolean | PointAccessor<Q, boolean>): StackedAreaMultiplesComponent<P, L>;
    key(): KeyAccessor<L, string | number>;
    key<M = L>(accessor: KeyAccessor<M, string | number>): StackedAreaMultiplesComponent<P, L>;
    valuesAccessor(): ValuesAccessor<L, P>;
    valuesAccessor<M = L, Q = P>(accessor: ValuesAccessor<M, Q>): StackedAreaMultiplesComponent<P, L>;
    transition(): boolean;
    transition(enabled: boolean): StackedAreaMultiplesComponent<P, L>;
}
declare function export_default$a<P = unknown, L = P[]>(): StackedAreaMultiplesComponent<P, L>;

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
 *                                              the ring onto the centre circle. The first thing to
 *                                              call it is the tooltip anchor's position accessor,
 *                                              so an unset scale throws "props.radiusScale is not a
 *                                              function" after the arcs and their transition have
 *                                              already been scheduled, and that transition then
 *                                              re-throws on every frame for 300ms.
 * @property {Number} centerRadius              The radius of the center of the chart. Can be
 *                                              configured with
 *                                              sszvis.layout.sunburst.computeLayout. Required, but
 *                                              it is only ever added to a number, so leaving it out
 *                                              fails silently instead of throwing the way an unset
 *                                              radiusScale does: every radius becomes NaN, the arcs
 *                                              degenerate to "M0,0Z" and every tooltip anchor keeps
 *                                              an unparseable transform, which the browser drops,
 *                                              leaving them all at the group's origin.
 * @property {Function} fill                    Function that returns the fill color for the
 *                                              segments in the center of the chart. Note that this
 *                                              will only be called on the centermost segments. The
 *                                              segments which are subcategories of these center
 *                                              segments will have their fill determined
 *                                              recursively, by lightening the color of its parent
 *                                              segment. It is called with a node's key string, not
 *                                              with the node. Required, and it has to be a
 *                                              function: it is neither wrapped in fn.functor nor
 *                                              normalised, so a constant colour throws "props.fill
 *                                              is not a function", and so does leaving it unset.
 *                                              Every ring further out multiplies its parent's
 *                                              lightness by 1.15, which is never clamped, so the
 *                                              colours run towards white from the inside out and
 *                                              saturate. Siblings therefore share a colour, since
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
 * be positioned by hand. Both the root filter and the colour lookup key off the `_tag` that
 * prepareHierarchyData writes, so a plain d3.hierarchy keeps its root as a full-circle arc and
 * takes every colour from the root's key; the component warns once per node and renders anyway.
 *
 * Note: only x0 and x1 are interpolated, and the geometry exists only from the first animation
 * frame, since `d` is written by the arc tween alone and there is no transition property to opt out
 * of - a chart serialised on the render tick is blank. The radii and the colours are not
 * interpolated at all and snap to their new values. The angle handover matches the old arcs by
 * index, so an arc that did not exist a render ago starts at its destination, and exits are removed
 * with no transition.
 *
 * Note: the component keeps no state of its own. It writes x0/x1 (the positions currently on
 * screen) and _x0/_x1 (the positions the running transition is heading for) onto every node it
 * renders, so the data has to be mutable - frozen data throws - and re-rendering the same hierarchy
 * object skips the animation, because the re-partition overwrites the positions the tween was
 * starting from.
 *
 * Note: the tooltip anchors are rendered from the datum bound to the group rather than from the
 * flattened array, so a hierarchy gets one anchor per node including the root, which has no arc and
 * no key, and in breadth-first order while the arcs are depth-first. They are positioned from the
 * pre-transition angles and are never repositioned when the transition ends, so after an update
 * they describe the previous layout. See test/component/sunburst.test.ts.
 *
 * @return {sszvis.component}
 */

/**
 * A node of the hierarchy, positioned by d3's partition layout. The component adds _x0 and _x1
 * to it: the destination positions of the running transition, while x0 and x1 hold the ones
 * currently on screen. Both pairs live on the datum rather than on the component, because d3
 * cannot interpolate an arc path directly - the same arrangement pie uses for its a0/a1, except
 * that these are positions in the angle scale's domain rather than radians. They are optional
 * here because the caller's data does not carry them until the first render.
 */
type SunburstNode<T = unknown> = HierarchyRectangularNode<NodeDatum<T>> & {
    _x0?: number;
    _x1?: number;
};
/** The same node once the render has stamped its destination angles onto it. */
type PositionedNode<T = unknown> = SunburstNode<T> & {
    _x0: number;
    _x1: number;
};
/**
 * Both scales are only ever called, never inspected, so this is all the component needs. A
 * d3 scale satisfies it - which is what the JSDoc and the examples suggest passing - and so
 * does a bare function.
 */
type SunburstScale = (value: number) => number;
/**
 * fill is called with a node's key, not with the node, and only for the segments of the
 * innermost ring - every ring further out derives its colour from its parent's. It is not
 * wrapped in fn.functor, so a constant colour is not accepted.
 */
type FillAccessor = (key: string) => string;
/**
 * stroke accepts a constant or an accessor and is not normalised on set - the accessor is
 * handed to d3 as it stands, so it is called with d3's receiver and arguments. Returning
 * null leaves the attribute off; d3 reads a returned undefined the same way, but the narrower
 * spelling is what its own attr typings accept, and the two are interchangeable here.
 */
type StrokeAccessor<T = unknown> = (this: SVGPathElement, d: PositionedNode<T>, i: number, group: ArrayLike<SVGPathElement>) => string | null;
type StrokeValue<T = unknown> = string | StrokeAccessor<T>;
/**
 * The getters return whatever was last set. radiusScale, centerRadius and fill have no
 * defaults and are all required for a render to succeed, so their getters report the
 * undefined the props actually hold.
 */
interface SunburstComponent<T = unknown> extends Component {
    angleScale(): SunburstScale;
    angleScale(scale: SunburstScale): SunburstComponent<T>;
    radiusScale(): SunburstScale | undefined;
    radiusScale(scale: SunburstScale): SunburstComponent<T>;
    centerRadius(): number | undefined;
    centerRadius(radius: number): SunburstComponent<T>;
    fill(): FillAccessor | undefined;
    fill(fill: FillAccessor): SunburstComponent<T>;
    stroke(): StrokeValue<T>;
    stroke<U = T>(stroke: StrokeValue<U>): SunburstComponent<T>;
}
declare function export_default$9<T = unknown>(): SunburstComponent<T>;

/**
 * Treemap component
 *
 * This component renders a treemap diagram, which displays hierarchical data as nested rectangles.
 * The size of each rectangle corresponds to a quantitative value, and rectangles are tiled to fill
 * the available space efficiently. This component uses D3's treemap layout with the squarified
 * tiling method for optimal aspect ratios.
 *
 * The component expects data prepared using the prepareData function, which converts flat data
 * into a hierarchical structure and applies the treemap layout.
 *
 * @module sszvis/component/treemap
 * @template T The type of the original flat data objects
 *
 * @property {string, function} colorScale        The fill color accessor for rectangles
 * @property {boolean} transition                 Whether to animate changes (default true)
 * @property {number, function} containerWidth    The container width (default 800)
 * @property {number, function} containerHeight   The container height (default 600)
 * @property {boolean} showLabels                 Whether to display labels on leaf nodes (default false)
 * @property {string, function} label             The label text accessor (default d.data.key)
 * @property {string} labelPosition               Label position: "top-left", "center", "top-right", "bottom-left", "bottom-right" (default "top-left")
 * @property {function} onClick                   Click handler for rectangles (receives node and event)
 *
 * @return {sszvis.component}
 */

type TreemapLayout<T = unknown> = HierarchyNode<NodeDatum<T>> & {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    value: number;
    data?: T;
    depth: number;
    height: number;
};
type TreemapClickHandler<T = unknown> = (event: MouseEvent, node: TreemapLayout<T>) => void;
type LabelPosition = "top-left" | "center" | "top-right" | "bottom-left" | "bottom-right";
interface TreemapComponent<T = unknown> extends Component {
    colorScale(): (key: string) => string;
    colorScale(scale: (key: string) => string): TreemapComponent<T>;
    transition(): boolean;
    transition(enabled: boolean): TreemapComponent<T>;
    containerWidth(): number;
    containerWidth(width: number): TreemapComponent<T>;
    containerHeight(): number;
    containerHeight(height: number): TreemapComponent<T>;
    showLabels(): boolean;
    showLabels(show: boolean): TreemapComponent<T>;
    label(): StringAccessor<TreemapLayout<T>>;
    label(accessor: StringAccessor<TreemapLayout<T>>): TreemapComponent<T>;
    labelPosition(): LabelPosition;
    labelPosition(position: LabelPosition): TreemapComponent<T>;
    onClick(): TreemapClickHandler<T> | undefined;
    onClick(handler: TreemapClickHandler<T>): TreemapComponent<T>;
}
/**
 * Main treemap component
 *
 * @template T The type of the original flat data objects
 */
declare function export_default$8<T = unknown>(): TreemapComponent<T>;

declare function _default$d(): any;

declare function _default$c(): any;

declare function _default$b(): any;

declare function _default$a(): any;

/**
 * Factory that returns an HTML element appended to the given target selector,
 * ensuring that it is only created once, even when run again.
 *
 * Note on the 'key' property of the optional metadata object:
 *
 * The key argument is present so that we can have multiple layers of html content in the same container.
 * For example, let's imagine you want one html div under an svg, then an svg layer, then another div over the svg.
 * The reason we need a key for these layers is that the render function in all the example code is designed to be
 * idempotent - calling it multiple times with the same arguments leaves the app in the same state. Therefore, all
 * the functions within render also need to be idempotent. A straightforward implementation of "createHtmlLayer" would
 * return an existing layer if present, or create one and return it if it wasn't present. This prevents createHtmlLayer
 * from making a new html element every time it's called. In turn, that means that you can call render many times and
 * always expect the same result (idempotence). But it also means that if you call it multiple times within the same
 * render function, you don't get multiple html layers. So then you can't have one under the svg and one over.
 *
 * The key argument solves this problem. It says, "look for a div in the container which has the given key, and return
 * it if present. Otherwise, create one with that key and return it. This means that if you call createHtmlLayer
 * multiple times with the same key, only one element will be created, and you'll get it back on subsequent calls.
 * But if you call it multiple times with different keys, you'll get multiple different elements. So, when you do:
 *
 * createHtmlLayer(..., ..., { key: 'A' })
 * createSvgLayer(...)
 * createHtmlLayer(..., ..., { key: 'B' })
 *
 * Then you'll have the div-svg-div sandwich, but that sequence of function calls is still idempotent.
 * Note: createSvgLayer accepts an optional metadata object, with an optional key property, which works the same way.
 *
 * @module sszvis/createHtmlLayer
 *
 * @param {string|d3.selection} selector    CSS selector string which is used to grab the container object for the created layer
 * @param {d3.bounds} [bounds]              A bounds object which provides the dimensions and offset for the created layer
 * @param {object} metadata                 Metadata for this layer. Currently the only used option is:
 *   @property {string} key                 Used as a unique key for this layer. If you pass different values
 *                                          of key to this function, the app will create and return different layers
 *                                          for inserting HTML content. If you pass the same value (including undefined),
 *                                          you will always get back the same DOM element. For example, this is useful for
 *                                          adding an HTML layer under an SVG, and then adding one over the SVG.
 *                                          See the binned raster map for an example of using this effectively.
 *
 * @returns {d3.selection}
 */

interface LayerMetadata {
    key?: string;
}
declare function createHtmlLayer(selector: SelectableElement | HTMLElement, bounds?: BoundsResult, metadata?: LayerMetadata): AnySelection;

/**
 * Factory that returns an SVG element appended to the given target selector,
 * ensuring that it is only created once, even when run again.
 *
 * @module sszvis/createSvgLayer
 *
 * @param {string|d3.selection} selector
 * @param {d3.bounds} bounds
 * @param {object} [metadata] Metadata for this chart. Can include any number of the following:
 *   @property {string} key Used as a unique key for this layer. If you pass different values
 *                          of key to this function, the app will create and return different layers.
 *                          If you pass the same value (including undefined), you will always get back
 *                          the same DOM element. This is useful for adding multiple SVG elements.
 *                          See the binned raster map for an example of using this effectively.
 *                          Note: For more information about this argument, see the detailed explanation in
 *                          the source code for createHtmlLayer.
 *
 * @returns {d3.selection}
 */

interface SvgLayerMetadata {
    key?: string;
    title?: string;
    description?: string;
}
declare function createSvgLayer(selector: SelectableElement | HTMLElement, bounds?: BoundsResult, metadata?: SvgLayerMetadata): AnySelection;

/**
 * Fallback handling
 *
 * Defaults to rendering a fallback image with standard chart proportions.
 *
 * @example
 * if (sszvis.fallback.unsupported()) {
 *   sszvis.fallback.render('#sszvis-chart', {src: '../fallback.png', height: 300});
 *   return;
 * }
 *
 * @module sszvis/fallback
 */

interface FallbackOptions {
    src: string;
    height?: number;
}
declare const fallbackUnsupported: () => boolean;
declare const fallbackCanvasUnsupported: () => boolean;
declare const fallbackRender: (selector: SelectableElement, options?: FallbackOptions) => void;

/**
 * A collection of functional programming helper functions
 *
 * @module sszvis/fn
 */

/**
 * fn.identity
 *
 * The identity function. It returns the first argument passed to it.
 * Useful as a default where a function is required.
 */
declare const identity: <T>(value: T) => T;
/**
 * fn.isString
 *
 * determine whether the value is a string
 */
declare const isString: (val: unknown) => val is string;
/**
 * fn.isSelection
 *
 * determine whether the value is a d3.selection.
 */
declare const isSelection: (val: unknown) => val is AnySelection;
/**
 * fn.arity
 *
 * Wraps a function of any arity (including nullary) in a function that
 * accepts exactly `n` parameters. Any extraneous parameters will not be
 * passed to the supplied function.
 */
declare const arity: (n: number, fn: (...args: any[]) => any) => ((...args: any[]) => any);
/**
 * fn.compose
 *
 * Returns the composition of a set of functions, in arguments order.
 * For example, if functions F, G, and H are passed as arguments:
 *
 * A = fn.compose(F, G, H)
 *
 * A will be a function which returns F(G(H(...arguments to A...)))
 * so that A(x) === F(G(H(x)))
 *
 * Note: all composed functions but the last should be of arity 1.
 */
declare const compose: (...fns: ((...args: any[]) => any)[]) => ((...args: any[]) => any);
/**
 * fn.contains
 *
 * Checks whether an item is present in the given list (by strict equality).
 */
declare const contains: <T>(list: T[], d: T) => boolean;
/**
 * fn.defined
 *
 * determines if the passed value is defined.
 */
declare const defined: <T>(val: T) => val is NonNullable<T>;
/**
 * fn.derivedSet
 *
 * fn.derivedSet is used to create sets of objects from an input array. The objects are
 * first passed through an accessor function, which should produce a value. The set is calculated
 * using that value, but the actual members of the set are the input objects. This allows you
 * to use .derivedSet to create a group of obejcts, where the values of some derived property
 * of those objects forms a set. This is distinct from other set functions in this toolkit because
 * in the other set functions, the set of derived properties is returned, whereas this function
 * returns a set of objects from the input array.
 */
declare const derivedSet: <T>(arr: T[], acc?: (value: T, index: number, array: T[]) => any) => T[];
/**
 * fn.every
 *
 * Use a predicate function to test if every element in an array passes some test.
 * Returns false as soon as an element fails the predicate test. Returns true otherwise.
 */
declare const every: <T>(predicate: (element: T) => boolean, arr: T[]) => boolean;
/**
 * fn.filledArray
 *
 * returns a new array with length `len` filled with `val`
 */
declare const filledArray: <T>(len: number, val: T) => T[];
/**
 * fn.find
 *
 * Finds the first occurrence of an element in an array that passes the predicate function
 */
declare const find: <T>(predicate: (element: T) => boolean, arr: T[]) => T | undefined;
/**
 * fn.first
 *
 * Returns the first value in the passed array, or undefined if the array is empty
 */
declare const first: <T>(arr: T[]) => T | undefined;
/**
 * fn.flatten
 *
 * Flattens the nested input array by one level. The input array is expected to be
 * a two-dimensional array (i.e. its elements are also arrays). The result is a
 * one-dimensional array consisting of all the elements of the sub-arrays.
 */
declare const flatten: <T>(arr: T[][]) => T[];
/**
 * fn.firstTouch
 *
 * Used to retrieve the first touch from a touch event. Note that in some
 * cases, the touch event doesn't have any touches in the event.touches list,
 * but it does have some in the event.changedTouches list (notably the touchend
 * event works like this).
 *
 * @param  {TouchEvent} event   The TouchEvent object from which to retrieve the
 *                              first Touch object.
 * @return {Touch|null}         The first Touch object from the TouchEvent's lists
 *                              of touches.
 */
declare const firstTouch: (event: TouchEvent) => Touch | null;
/**
 * fn.foldPattern
 *
 * Used to lazily fold a sum type into a value.
 *
 * @example
 * sszvis.foldPattern('formalGreeting', {
 *   formalGreeting: function() { return "Pleased to meet you."},
 *   informalGreeting: function() { return "How ya' doin!" }
 * })
 */
declare const foldPattern: <T>(key: string, pattern: Record<string, () => T>) => T;
/**
 * fn.hashableSet
 *
 * takes an array of elements and returns the unique elements of that array, optionally
 * after passing them through an accessor function.
 * the returned array is ordered according to the elements' order of appearance
 * in the input array. This function differs from fn.set in that the elements
 * in the input array (or the values returned by the accessor function)
 * MUST be "hashable" - convertible to unique keys of a JavaScript object.
 * As payoff for obeying this restriction, the algorithm can run much faster.
 */
declare const hashableSet: <T, U extends string | number>(arr: T[], acc?: (element: T, index: number, array: T[]) => U) => U[];
/**
 * fn.isFunction
 *
 * Determines if the passed value is a function
 */
declare const isFunction: (val: unknown) => val is (...args: any[]) => any;
/**
 * fn.isNull
 *
 * determines if the passed value is null.
 */
declare const isNull: (val: unknown) => val is null;
/**
 * fn.isNumber
 *
 * determine whether the value is a number
 */
declare const isNumber: (val: unknown) => val is number;
/**
 * fn.isObject
 *
 * determines if the passed value is of an "object" type, or if it is something else,
 * e.g. a raw number, string, null, undefined, NaN, something like that.
 */
declare const isObject: (val: unknown) => val is object;
/**
 * fn.last
 *
 * Returns the last value in the passed array, or undefined if the array is empty
 */
declare const last: <T>(arr: T[]) => T | undefined;
/**
 * fn.not
 *
 * Takes as argument a function f and returns a new function
 * which calls f on its arguments and returns the
 * boolean opposite of f's return value.
 */
declare const not: <T extends any[]>(f: (...args: T) => any) => ((...args: T) => boolean);
/**
 * fn.prop
 *
 * takes the name of a property and returns a property accessor function
 * for the named property. When the accessor function is called on an object,
 * it returns that object's value for the named property. (or undefined, if the object
 * does not contain the property.)
 */
declare const prop: <K extends string | number | symbol>(key: K) => (<T extends Record<K, any>>(object: T) => T[K]);
/**
 * fn.propOr
 *
 * Like fn.prop, this function takes the name of a property and returns an accessor function
 * for the named property. However, the returned function has an added feature - it
 * checks that the argument given to is not `undefined`, and whether the property exists on
 * the object. If either is false, it returns a default value. The default value is the second
 * parameter to propOr, and it is optional. (When you don't provide a default value, the returned
 * function will work fine, and if the object or property are `undefined`, it returns `undefined`).
 */
declare const propOr: <K extends string | number | symbol, D>(key: K, defaultVal?: D) => (<T extends Partial<Record<K, any>>>(object: T | undefined) => T[K] | D);
/**
 * fn.set
 *
 * takes an array of elements and returns the unique elements of that array, optionally
 * after passing them through an accessor function.
 * the returned array is ordered according to the elements' order of appearance
 * in the input array, e.g.:
 *
 * [2,1,1,6,8,6,5,3] -> [2,1,6,8,5,3]
 * ["b", a", "b", "b"] -> ["b", "a"]
 * [{obj1}, {obj2}, {obj1}, {obj3}] -> [{obj1}, {obj2}, {obj3}]
 */
declare const set: <T, U>(arr: T[], acc?: (value: T, index: number, array: T[]) => U) => U[];
/**
 * fn.some
 *
 * Test an array with a predicate and determine whether some element in the array passes the test.
 * Returns true as soon as an element passes the test. Returns false otherwise.
 */
declare const some: <T>(predicate: (element: T) => boolean, arr: T[]) => boolean;
/**
 * fn.stringEqual
 *
 * Determines whether two values are equal when converted to strings. Useful for comparing
 * date objects, because two different date objects are not considered equal, even if they
 * represent the same date.
 */
declare const stringEqual: (a: {
    toString(): string;
}, b: {
    toString(): string;
}) => boolean;
/**
 * fn.functor
 *
 * Same as fn.functor in d3v3
 */
declare const functor: <T>(v: T | (() => T)) => (() => T);
/**
 * fn.memoize
 *
 * Adapted from lodash's memoize() but using d3.map() as cache
 * See https://lodash.com/docs/4.17.4#memoize
 */
declare const memoize: <TFunc extends (...args: any[]) => any>(func: TFunc, resolver?: (...args: Parameters<TFunc>) => string | number) => TFunc & {
    cache: Map<string | number, ReturnType<TFunc>>;
};

/**
 * Formatting functions
 *
 * @module sszvis/format
 */
/**
 * Format a number as an age
 */
declare const formatAge: (d: number) => string;
/**
 * A multi time formatter used by the axis class
 */
declare const formatAxisTimeFormat: (d: Date) => string;
/**
 * A month name formatter which gives a capitalized three-letter abbreviation of the German month name.
 */
declare const formatMonth: (...args: any[]) => any;
/**
 * A year formatter for date objects. Gives the date's year.
 */
declare const formatYear: (date: Date) => string;
/**
 * Formatter for no label
 */
declare const formatNone: () => string;
/**
 * Format numbers according to the sszvis style guide. The most important
 * rules are:
 *
 * - Thousands separator is a thin space (not a space)
 * - Only apply thousands separator for numbers >= 10000
 * - Decimal places only for significant decimals
 * - No decimal places for numbers >= 10000
 * - One decimal place for numbers >= 100
 * - Up to 2 significant decimal places for smaller numbers
 *
 * See also: many test cases for this function in format.test.js
 */
declare const formatNumber: (d: number | null | undefined) => string;
/**
 * Format numbers to a particular precision. This function is "curried", meaning that it is a function with
 * multiple arguments, but when you call it with less than the full number of arguments, it returns a function
 * that takes less arguments and has the arguments you did provide "pre-filled" as parameters. So that means that:
 *
 * preciseNumber(2, 14.1234) -> "14.12"
 * preciseNumber(2) -> function that accepts numbers and returns formatted values
 *
 * Note that preciseNumber(2, 14.1234) is equivalent to preciseNumber(2)(14.1234)
 */
declare function formatPreciseNumber(p: number): (x: number) => string;
declare function formatPreciseNumber(p: number, d: number): string;
/**
 * Format percentages on the range 0 - 100
 */
declare const formatPercent: (d: number) => string;
/**
 * Format percentages on the range 0 - 1
 */
declare const formatFractionPercent: (d: number) => string;
/**
 * Default formatter for text
 */
declare const formatText: StringConstructor;

/**
 * Ordinal Color Scale Legend
 *
 * This component is used for creating a legend for a categorical color scale.
 *
 * @module sszvis/legend/ordinalColorScale
 *
 * @property {d3.scaleOrdinal()} scale         An ordinal scale which will be transformed into the legend.
 * @property {Number} rowHeight                 The height of the rows of the legend.
 * @property {Number} columnWidth               The width of the columns of the legend.
 * @property {Number} rows                      The target number of rows for the legend.
 * @property {Number} columns                    The target number of columns for the legend.
 * @property {String} orientation               The orientation (layout order) of the legend. should be either "horizontal" or "vertical". No default.
 * @property {Boolean} reverse                  Whether to reverse the order that categories appear in the legend. Default false
 * @property {Boolean} rightAlign               Whether to right-align the legend. Default false.
 * @property {Boolean} horizontalFloat          A true value changes the legend layout to the horizontal float version. Default false.
 * @property {Number} floatPadding              The amount of padding between elements in the horizontal float layout. Default 10px
 * @property {Number} floatWidth                The maximum width of the horizontal float layout. Default 600px
 *
 * The color legend works by iterating over the domain of the provided scale, and generating a legend entry for each
 * element in the domain. The entry consists of a label giving the category, and a circle colored with the category's
 * corresponding color. When props.rightAlign is false (the default), the circle comes before the name. When rightAlign
 * is true, the circle comes afterwards. The layout of these labels is governed by the other parameters.
 *
 * Note: orientation has no default. With neither orientation nor horizontalFloat set, no
 * transform is applied and every entry is drawn at the origin, stacked on top of one
 * another. See test/legend/ordinalColorScale.test.ts.
 *
 * Default Layout:
 *
 * Because the labels are svg elements positioned with translate (and do not use the html box model layout algorithm),
 * rowHeight is necessary to provide the vertical height of each row. Generally speaking, 20px is fine for the default text size.
 * In the default layout, labels are organized into rows and columns in a gridded fashion. columnWidth is the total width of
 * any resulting columns. Note that if there is only one column, columnWidth is irrelevant.
 *
 * There are two orientation options for the row/column layout. The 'horizontal' orientation lays out elements from the input
 * domain into rows, creating new rows as necessary. For example, with three columns, the first three elements will form
 * the top row, then the next three in the second row, and so on. With 'vertical' orientation, labels are stacked into a column,
 * and new columns are added as necessary to hold all of the elements. Therefore, in the 'horizontal' orientation, the number of columns
 * is key, as this determines when a row ends and a new row begins. In the 'vertical' layout, the number of rows determines when to start
 * a new column.
 *
 * For the input set { A, B, C, D, E, F, G }
 *
 * Horizontal Orientation (3 columns):
 *
 *      A    B    C
 *      D    E    F
 *      G
 *
 * Horizontal Orientation (2 columns):
 *
 *     A    B
 *     C    D
 *     E    F
 *     G
 *
 * Vertical Orientation (3 rows):
 *
 *      A    D    G
 *      B    E
 *      C    F
 *
 * Vertical Orientation (2 rows):
 *
 *      A    C    E    G
 *      B    D    F
 *
 * If reverse is true, items from the input domain will be added to the layout in reversed order.
 *
 * For example, Horizontal Orientation (4 columns, reverse = true):
 *
 *    G    F    E    D
 *    C    B    A
 *
 * Horizontal Float Layout:
 *
 * If horizontalFloat is true, a different layout entirely is used, which relies on the width of each element
 * to compute the position of the next one. This layout always proceeds left-to-right first, then top-to-bottom
 * if the floatWidth would be exceeded by a new element. Between each element is an amount of padding configurable
 * using the floatPadding property.
 *
 * For the input set { foo, bar, qux, fooBar, baz, fooBarBaz, fooBaz, barFoo }
 *
 * Horizontal Float Layout (within a floatWidth identified by vertical pipes,
 * with 4 spaces of floatPadding).
 *
 * |foo    bar    qux|
 * |fooBar    baz    |      <--- not enough space for fooBarBaz
 * |fooBarBaz        |      <--- not enough space for padding + fooBaz
 * |fooBaz    barFoo |
 */

declare const DEFAULT_LEGEND_COLOR_ORDINAL_ROW_HEIGHT = 21;
/**
 * The subset of a d3 scale this legend relies on, over its domain type T. The return value
 * only has to stringify to a colour, which is what the sszvis colour scales produce.
 */
interface OrdinalColorScale<T> {
    (value: T): {
        toString(): string;
    };
    domain(): T[];
}
type LegendOrientation = "horizontal" | "vertical";
interface OrdinalColorScaleComponent<T = string> extends Component {
    scale(): OrdinalColorScale<T>;
    scale(scale: OrdinalColorScale<T>): OrdinalColorScaleComponent<T>;
    rowHeight(): number;
    rowHeight(height: number): OrdinalColorScaleComponent<T>;
    columnWidth(): number | null;
    columnWidth(width: number | null): OrdinalColorScaleComponent<T>;
    rows(): number;
    rows(rows: number): OrdinalColorScaleComponent<T>;
    columns(): number;
    columns(columns: number): OrdinalColorScaleComponent<T>;
    verticallyCentered(): boolean;
    verticallyCentered(centered: boolean): OrdinalColorScaleComponent<T>;
    orientation(): LegendOrientation | undefined | null;
    orientation(orientation: LegendOrientation | null): OrdinalColorScaleComponent<T>;
    reverse(): boolean;
    reverse(reverse: boolean): OrdinalColorScaleComponent<T>;
    rightAlign(): boolean;
    rightAlign(rightAlign: boolean): OrdinalColorScaleComponent<T>;
    horizontalFloat(): boolean;
    horizontalFloat(float: boolean): OrdinalColorScaleComponent<T>;
    floatPadding(): number;
    floatPadding(padding: number): OrdinalColorScaleComponent<T>;
    floatWidth(): number;
    floatWidth(width: number): OrdinalColorScaleComponent<T>;
}
declare function legendColorOrdinal<T = string>(): OrdinalColorScaleComponent<T>;

/**
 * A collection of utilities to measure elements
 *
 * @module sszvis/measure
 */

/**
 * Type for elements that can be measured - selector string, DOM element, or d3 selection
 */
type MeasurableElement = string | Element | Selection<any, any, any, any>;
/**
 * measureDimensions
 *
 * Calculates the width of the first DOM element defined by a CSS selector string,
 * a DOM element reference, or a d3 selection. If the DOM element can't be
 * measured `undefined` is returned for the width. Returns also measurements of
 * the screen, which are used by some responsive components.
 *
 * @param  {string|Element|d3.selection} arg The element to measure
 *
 * @return {DimensionMeasurement} The measurement of the width of the element, plus dimensions of the screen
 *                  The returned object contains:
 *                      width: {number|undefined} The width of the element
 *                      screenWidth: {number} The innerWidth of the screen
 *                      screenHeight: {number} The innerHeight of the screen
 */
declare const measureDimensions: (arg: MeasurableElement) => DimensionMeasurement;
/**
 * measureText
 *
 * Calculates the width of a string given a font size and a font face. It might
 * be more convenient to use a preset based on this function that has the font
 * size and family already set.
 *
 * @param {number} fontSize The font size in pixels
 * @param {string} fontFace The font face ("Arial", "Helvetica", etc.)
 * @param {string} text The text to measure
 * @returns {number} The width of the text
 *
 * @example
 * const helloWidth = sszvis.measureText(14, "Arial, sans-serif")("Hello!")
 **/
declare const measureText: (fontSize: number, fontFace: string, text: string) => number;
/**
 * measureAxisLabel
 *
 * A preset to measure the widths of axis labels.
 *
 * @param {string} text The text to measure
 * @returns {number} The width of the text
 *
 * @example
 * const labelWidth = sszvis.measureAxisLabel("Hello!")
 */
declare const measureAxisLabel: (text: string) => number;
/**
 * measureLegendLabel
 *
 * A preset to measure the widths of legend labels.
 *
 * @param {string} text The text to measure
 * @returns {number} The width of the text
 *
 * @example
 * const labelWidth = sszvis.measureLegendLabel("Hello!")
 */
declare const measureLegendLabel: (text: string) => number;

type ColorLegendLayoutOptions = {
    legendLabels: string[];
    axisLabels?: string[];
    /** "vertical" and "diagonal" reserve room for rotated labels; anything else, including an
     * unrecognised value, is treated as horizontal. */
    slant?: string;
};
type ColorLegendLayout = {
    axisLabelPadding: number;
    legendPadding: number;
    bottomPadding: number;
    legendWidth: number;
    legend: OrdinalColorScaleComponent<string>;
    scale: ExtendedOrdinalScale;
};
type ColorLegendDimensions = {
    columns: number;
    rows: number;
    columnWidth: number | null;
    legendWidth: number;
    horizontalFloat: boolean;
    orientation: LegendOrientation | null;
};
/**
 * colorLegendLayout
 *
 * Generate a color scale and a legend for the given labels. Compute how much
 * padding labels plus legend needs for use with `sszvis.bounds()`
 *
 * Behaviour notes:
 * - scaleQual6 is used up to six labels, scaleQual12 above six; colours repeat
 *   silently beyond twelve labels.
 * - axisLabelPadding is 60 for slant "horizontal" (and for any unrecognised slant),
 *   40 + widest axis label for "vertical", and 40 + widest axis label / sqrt(2) for
 *   "diagonal".
 * - A "vertical" or "diagonal" slant with no axisLabels gives NaN, which propagates
 *   into bottomPadding and thus into sszvis.bounds().
 * - legendPadding is rows * DEFAULT_LEGEND_COLOR_ORDINAL_ROW_HEIGHT.
 */
declare function colorLegendLayout({ legendLabels, axisLabels, slant }: ColorLegendLayoutOptions, container: MeasurableElement): ColorLegendLayout;
/**
 * colorLegendDimensions
 *
 * Compute all the dimensions necessary to generate an ordinal color legend.
 *
 * Behaviour notes:
 * - Single column for four or fewer labels; otherwise at most two columns
 *   (numCols only counts down from DEFAULT_COLUMN_COUNT = 2).
 * - Horizontal float only when there is one column AND all labels fit on one line.
 * - Each label is padded by 40px.
 * - columnWidth is null for a single column.
 * - legendWidth is columns * widest label, so for a floated legend it under-reports
 *   the actual line width.
 * - An empty label list gives legendWidth NaN.
 * - An unmeasurable container (width 0 or undefined) silently degrades to one
 *   column, one row per label.
 */
declare function colorLegendDimensions(labels: string[], containerWidth: number): ColorLegendDimensions;

/**
 * Heat Table Dimensions
 *
 * Utility function for calculating different demensions in the heat table
 *
 * @module sszvis/layout/heatTableDimensions
 *
 * @param  {Number} spaceWidth   the total available width for the heat table within its container
 * @param  {Number} squarePadding the padding, in pixels, between squares in the heat table
 * @param  {Number} numX     The number of columns that need to fit within the heat table width
 * @param {Number} numY The number of rows in the table
 * @param {Object} [chartPadding] An object that includes padding values for the left, right, top,
 *                              and bottom padding which the heat table should have within its container.
 *                              These padding values should be enough to include any axis labels or other things
 *                              that show up around the table itself. The heat table will then fill the rest
 *                              of the available space as appropriate (up to a certain maximum size of box)
 * @return {object}         An object with dimension information about the heat table:
 *                          {
 *                              side: the length of one side of a table box
 *                              paddedSide: the length of the side plus padding
 *                              padRatio: the ratio of padding to paddedSide (used for configuring d3.scaleOrdinal.rangeBands as the second parameter)
 *                              width: the total width of all table boxes plus padding in between
 *                              height: the total height of all table boxes plus padding in between
 *                              centeredOffset: the left offset required to center the table horizontally within its container
 *                          }
 *
 * Behaviour notes:
 * - The box side is fitted to the available width only; numY/rows never affect it.
 * - The side is capped at 30px but never floored, so too many columns, a large
 *   squarePadding, or a large horizontal chartPadding can drive it negative, which also
 *   pushes padRatio outside the [0, 1) range a band scale expects.
 * - The chartPadding argument is mutated in place (missing sides are defaulted onto the
 *   object itself), so passing a frozen object throws a TypeError.
 * - Defaults for chartPadding are applied with `||`, so an explicit 0 is indistinguishable
 *   from a missing value.
 * - Only left/right padding affect the layout; top/bottom are accepted but unused.
 * - numX === 0 divides by zero, and Math.min silently falls back to the 30px default side,
 *   which then yields a negative width.
 * - numX and numY are not validated: fractional and negative values pass straight through
 *   into the geometry.
 * - A negative squarePadding makes paddedSide smaller than side (boxes overlap) and drives
 *   padRatio negative.
 * - centeredOffset is clamped at 0 but never validated otherwise.
 */
type HeatTableChartPadding = {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
};
type HeatTableDimensions = {
    side: number;
    paddedSide: number;
    padRatio: number;
    width: number;
    height: number;
    centeredOffset: number;
};
declare function export_default$7(spaceWidth: number, squarePadding: number, numX: number, numY: number, chartPadding?: HeatTableChartPadding): HeatTableDimensions;

/**
 * Horizontal Bar Chart Dimensions
 *
 * This function calculates dimensions for the horizontal bar chart. It encapsulates the
 * layout algorithm for sszvis horizontal bar charts. The object it returns contains several
 * properties which can be used in other functions and components for layout purposes.
 *
 * @module sszvis/layout/horizontalBarChartDimensions
 *
 * @param  {number} numBars     the number of bars in the horizontal bar chart
 * @return {object}             an object containing properties used for layout:
 *                                 {
 *                                  barHeight: the height of an individual bar
 *                                  padHeight: the height of the padding between each bar
 *                                  padRatio: the ratio of padding to barHeight + padding.
 *                                            this can be passed as the second argument to d3.scaleOrdinal().rangeBands
 *                                  outerRatio: the ratio of outer padding to barHeight + padding.
 *                                              this can be passed as the third parameter to d3.scaleOrdinal().rangeBands
 *                                  axisOffset: the amount by which to vertically offset the y-axis of the horizontal bar chart
 *                                              in order to ensure that the axis labels are visible. This can be used as the y-component
 *                                              of a call to sszvis.svgUtils.translateString.
 *                                  barGroupHeight: the combined height of all the bars and their inner padding.
 *                                  totalHeight: barGroupHeight plus the height of the outerPadding. This distance can be used
 *                                               to translate scales below the bars.
 *                                 }
 *
 * Behaviour notes:
 * - The layout is fixed: 24px bars separated by 20px of padding. Nothing scales with the
 *   available space - the caller sizes the container from barGroupHeight, not the reverse.
 * - outerRatio is always 0, so totalHeight always equals barGroupHeight. The two properties
 *   are kept distinct only to match the shape of the vertical bar chart layout.
 * - axisOffset is derived from the constant bar height and is therefore always -22.
 * - numBars is not validated: 0 gives a barGroupHeight of -20 (numPads goes to -1), and
 *   negative or fractional counts pass through unchanged.
 */
type HorizontalBarChartDimensions = {
    barHeight: number;
    padHeight: number;
    padRatio: number;
    outerRatio: number;
    axisOffset: number;
    barGroupHeight: number;
    totalHeight: number;
};
declare function export_default$6(numBars: number): HorizontalBarChartDimensions;

/**
 * Population Pyramid Layout
 *
 * This function is used to compute the layout parameters for the population pyramid
 *
 * @module sszvis/layout/populationPyramidLayout
 *
 * @parameter {number} spaceWidth      The available width for the chart. This is used as a base for calculating the size of the chart
 *                                    (there's a default aspect ratio for its height), and then for calculating the rounded bar heights.
 *                                    The returned total height should be nicely proportionate to this value.
 * @parameter {number} numBars         The number of bars in the population pyramid. In other words, the number of ages or age groups in the dataset.
 *
 * @return {object}                   An object containing configuration information for the population pyramid:
 *                                    {
 *                                      barHeight: the height of one bar in the population pyramid
 *                                      padding: the height of the padding between bars in the pyramid
 *                                      totalHeight: the total height of all bars plus the padding between them. This should be the basis for the bounds calculation
 *                                      positions: an array of positions, which go from the bottom of the chart (lowest age) to the top. These positions should
 *                                      be set as the range of a d3.scaleOrdinal scale, where the domain is the list of ages or age groups that will be displayed
 *                                      in the chart. The domain ages or age groups should be sorted in ascending order, so that the positions will match up. If everything
 *                                      has gone well, the positions array's length will be numBars,
 *                                      maxBarLength: The maximum length of the bars to fit within the space while keeping a good aspect ratio.
 *                                      In situations with very wide screens, this limits the width of the entire pyramid to a reasonable size.
 *                                      chartPadding: left padding for the chart. When the maxBarLength is less than what would fill the entire width
 *                                      of the chart, this value is needed to offset the axes and legend so that they line up with the chart. Otherwise,
 *                                      the value is floored at 1 and no further padding is needed.
 *                                    }
 *
 * Behaviour notes:
 * - Chart height is the 4:5 portrait ratio, capped at 480px.
 * - Bar heights are rounded to whole pixels with a 2px floor; the floor wins over the height
 *   cap, so totalHeight can exceed 480px.
 * - Padding is always exactly 1px.
 * - Positions are top-edge y coordinates for the bars, in the order an ascending age domain
 *   expects them: the first is the bottom bar (the largest y) and the last is the top bar at
 *   exactly 0. There is one position per bar for a positive whole numBars, since the integer
 *   arithmetic guarantees the loop lands on 0; a fractional or negative count is not validated.
 * - maxBarLength is capped at 240 (= aspectRatioPortrait.MAX_HEIGHT * 4/5 / 2), which only
 *   coincidentally equals this module's own MAX_HEIGHT / 2 and can drift if either constant changes.
 * - chartPadding is floored at 1.
 * - numBars === 0 gives an Infinity barHeight, a NaN totalHeight, and no positions.
 * - A zero or negative spaceWidth is not validated. Both produce 2px bars and a 1px
 *   chartPadding; maxBarLength is 0 for a zero width and negative for a negative one.
 */
type PopulationPyramidLayout = {
    barHeight: number;
    padding: number;
    totalHeight: number;
    positions: number[];
    maxBarLength: number;
    chartPadding: number;
};
declare function export_default$5(spaceWidth: number, numBars: number): PopulationPyramidLayout;

declare function _default$9(): any;

/**
 * Stacked Area Multiples Layout
 *
 * This function is used to compute layout parameters for the area multiples chart.
 *
 * @module sszvis/layout/stackedAreaMultiplesLayout
 *
 * @param  {number} height      The available height of the chart
 * @param  {number} num         The number of individual stacks to display
 * @param  {number} pct         the planned-for ratio between the space allotted to each area and the amount of space + area.
 *                              This value is used to compute the baseline positions for the areas, and how much vertical space to leave
 *                              between the areas.
 *
 * @return {object}             An object containing configuration properties for use in laying out the stacked area multiples.
 *                              {
 *                                range:          This is an array of baseline positions, counting from the top of the stack downwards.
 *                                                It should be used to configure a d3.scaleOrdinal(). The values passed into the ordinal
 *                                                scale will be given a y-value which descends from the top of the stack, so that the resulting
 *                                                scale will match the organization scheme of sszvis.stackedArea. Use the ordinal scale to
 *                                                configure the sszvis.stackedAreaMultiples component.
 *                                bandHeight:     The height of each multiples band. This can be used to configure the within-area y-scale.
 *                                                This height represents the height of the y-axis of the individual area multiple.
 *                                padHeight:      This is the amount of vertical padding between each area multiple.
 *                              }
 *
 * Behaviour notes:
 * - step = height / (num - pct); band and pad split that step in a (1 - pct) / pct ratio.
 * - By construction, step * (num - pct) === height, so baseline number `num` always lands exactly on `height`.
 * - The baseline loop terminates on an absolute 1px slack (`level - height < 1`), not a fraction of the step,
 *   so charts whose step is under ~1px get MORE baselines than there are stacks.
 * - pct defaults via `pct || 0.1`, so an explicit 0 (or NaN) is silently replaced by 0.1.
 * - num === pct divides by zero. With the default pct the step is Infinity and the range comes
 *   back empty; with a pct above 1 the first baseline is -Infinity and the range holds that one
 *   unusable value.
 * - 0.1 < num < 1 also yields an empty range (the first baseline already sits below the chart).
 * - A zero height, or num < pct < 1, makes both the step and the first baseline non-positive, and
 *   the baseline loop then runs forever (WARNING: no guard). A pct above 1 escapes this, because
 *   the negative step is multiplied by a negative (1 - pct) and the loop never starts.
 * - A negative height returns an empty range with a negative, unusable bandHeight.
 */
type StackedAreaMultiplesLayout = {
    range: number[];
    bandHeight: number;
    padHeight: number;
};
declare function export_default$4(height: number, num: number, pct?: number): StackedAreaMultiplesLayout;

/**
 * Vertical Bar Chart Dimensions
 *
 * Generates a dimension configuration object to be used for laying out the vertical bar chart.
 *
 * @module sszvis/layout/verticalBarChartDimensions
 *
 * @param  {number} width         the total width available to the horizontal bar chart. The computed chart layout is not guaranteed
 *                                to fit inside this width.
 * @param  {number} numBars       The number of bars in the bar chart.
 * @return {object}               An object containing configuration properties for use in laying out the vertical bar chart.
 *                                {
 *                                  barWidth:             the width of each bar in the bar chart
 *                                  padWidth:             the width of the padding between the bars in the bar chart
 *                                  padRatio:             the ratio between the padding and the step (barWidth + padding). This can be passed
 *                                                        as the second parameter to d3.scaleOrdinal().rangeBands().
 *                                  outerRatio:           the outer ratio between the outer padding and the step. This can be passed as the
 *                                                        third parameter to d3.scaleOrdinal().rangeBands().
 *                                  barGroupWidth:        the width of all the bars plus all the padding between the bars.
 *                                  totalWidth:           The total width of all bars, plus all inner and outer padding.
 *                                }
 *
 * Behaviour notes:
 * - Targets a 70/30 split of each step between bar width and padding.
 * - Bar width is capped at 48px; when capped, padding is recomputed from the leftover width.
 * - Padding is then clamped to [2, 100] WITHOUT recomputing the bar width, so the bar group
 *   can overflow or underflow the given width (outerRatio can go negative).
 * - padRatio/outerRatio are derived from the clamped barWidth/padding, not from the 0.7/0.3 target.
 * - numBars === 1 has zero padding spaces, so its padWidth is a phantom that is never drawn but
 *   still feeds padRatio. When the single bar would be wider than the 48px cap, the padding
 *   recompute additionally divides by zero and the resulting Infinity is masked by the 100px
 *   clamp; a narrower single bar skips that branch and keeps its finite target padding.
 * - numBars === 0 yields NaN for barWidth, padRatio, outerRatio, and barGroupWidth (0/0), while
 *   padWidth still clamps to the 2px minimum.
 * - width === 0 gives barWidth 0 and padRatio exactly 1 (outside the [0, 1) range band scales expect).
 * - Negative width produces a negative barWidth and a padRatio outside the [0, 1) range band
 *   scales accept - above 1 for small negative widths (width -1 gives 1.04) and below 0 for
 *   larger ones (width -200 gives -0.16). There is no input validation.
 */
type VerticalBarChartDimensions = {
    barWidth: number;
    padWidth: number;
    padRatio: number;
    outerRatio: number;
    barGroupWidth: number;
    totalWidth: number;
};
declare function export_default$3(width: number, numBars: number): VerticalBarChartDimensions;

/**
 * @module sszvis/layout/sankey
 *
 * A module of helper functions for computing the data structure
 * and layout required by the sankey component.
 *
 * Behaviour notes:
 * - prepareData's source/target/value accessors default to fn.identity, which only matches when
 *   the rows are themselves the id strings; for the object rows this layout is built around, no
 *   link ever matches a node id.
 * - a link with an unknown source or target id becomes a null entry left in the returned links
 *   array. Any such null throws a TypeError from the value sort as soon as a second link exists,
 *   valid or not; a sole invalid row survives only because sort skips a one-element array.
 * - link ids come from a module-level counter shared across every builder instance, so they
 *   are unique but not stable between renders.
 * - a negative link value clamps away at the node (node.value is Math.max(0, ...)) but stays
 *   on the link, so the link stack runs outside its node.
 * - computeLayout's per-column padding and pixels-per-unit are each reduced to a minimum across
 *   all columns, but a degenerate column contributes the largest candidate in both cases, so it
 *   is discarded by the minimum rather than distorting the others.
 * - a single-column diagram gives computeLayout's columnRange an Infinity step (issue #120);
 *   an empty column list gives a negative step and NaN/undefined elsewhere.
 */

/** A node as this module builds it: every link list is present, unlike the component's view. */
type PreparedNode = SankeyNode & {
    linksFrom: SankeyLink[];
    linksTo: SankeyLink[];
};
/** What prepareData returns. Links can contain nulls; see the module's behaviour notes. */
type SankeyPreparedData = {
    nodes: PreparedNode[];
    /** One entry per input row. An invalid row leaves a null behind - see the behaviour notes. */
    links: (SankeyLink | null)[];
    columnTotals: number[];
    columnLengths: number[];
};
/**
 * The data preparation builder. It is callable, and also exposes `apply` as an alias, which
 * shadows Function.prototype.apply - see the behaviour notes.
 */
interface SankeyDataPreparation<T = unknown> {
    (inputData: T[]): SankeyPreparedData;
    apply(data: T[]): SankeyPreparedData;
    /** The id of the link's source node. Must be one of the ids passed to idLists. */
    source(func: (d: T) => string): SankeyDataPreparation<T>;
    /** The id of the link's target node. Must be one of the ids passed to idLists. */
    target(func: (d: T) => string): SankeyDataPreparation<T>;
    /** The size of the flow. A string is coerced with Number(); anything unparseable becomes 0. */
    value(func: (d: T) => number | string): SankeyDataPreparation<T>;
    descendingSort(): SankeyDataPreparation<T>;
    ascendingSort(): SankeyDataPreparation<T>;
    idLists(idLists: string[][]): SankeyDataPreparation<T>;
}
type SankeyComputedLayout = {
    valuePadding: number;
    /** undefined when there are no columns at all - see the behaviour notes. */
    nodePadding: number | undefined;
    columnPaddings: number[];
    /** The upper bound is undefined when there are no columns at all. */
    valueDomain: [number, number | undefined];
    valueRange: [number, number];
    nodeThickness: number;
    columnDomain: [number, number];
    columnRange: [number, number];
};
/**
 * sszvis.layout.sankey.prepareData
 *
 * Returns a data preparation component for the sankey data.
 *
 * Throughout the code, the rectangles representing entities are referred to as 'nodes', while
 * the chords connection them which represent flows among those entities are referred to as 'links'.
 *
 * @property {Array} apply                    Applies the preparation to a dataset of links. Expects a list of links, where the (unique) id
 *                                            of the source node can be accessed with the source function, and the (unique) id of the target
 *                                            can be accessed with the target function. Note that no source can have the same id as a target and
 *                                            vice versa. The nodes are defined implicitly by the fact that they have a link going to them or
 *                                            from them.
 * @property {Function} source                An accessor function for getting the source of a link
 * @property {Function} target                An accessor function for getting the target of a link
 * @property {Function} value                 An accessor function for getting the value of a link. Must be a number. The total value of a node
 *                                            is the greater of the sum of the values of its sourced links and its targeting links.
 * @property {} descendingSort                Toggles the use of a descending value sort for the nodes
 * @property {} ascendingSort                 Toggles the use of an ascending value sort for the nodes
 * @property {Array(Array)} idLists           An array of arrays of id values. For each array of ids, the sankey diagram will create a column
 *                                            of nodes. Each node should have links going to it or coming from it. All ids should be unique.
 *
 * @return {Function}                         The data preparation function. Can be called directly, or applied using the '.apply' function.
 *         When called, returns an object with data to be used in constructing the chart.
 *               @property {Array} nodes             An array of node data. Each one will become a rectangle in the sankey
 *               @property {Array} links             An array of link data. Each one will become a path in the sankey
 *               @property {Array} columnTotals      An array of column totals. Needed by the computeLayout function (and internally by the sankey component)
 *               @property {Array} columnLengths     An array of column lengths (number of nodes). Needed by the computeLayout function.
 *
 * Behaviour notes:
 * - source/target/value default to fn.identity, which only matches when a row is itself the id
 *   string; omitting them makes every link invalid for the usual object rows.
 * - a link whose source or target id is not in idLists is warned about and replaced by null, and
 *   the null stays in the returned links array. Any null throws a TypeError from the value sort
 *   once a second link exists, valid or not; a sole invalid row survives only because sort skips
 *   a one-element array.
 * - link ids come from a module-level counter shared by every builder instance, so they are
 *   unique but not stable across renders.
 * - a duplicate id warns and keeps only the last column.
 * - a non-numeric value silently becomes 0; a negative value is kept on the link but clamped
 *   away at the node (node.value is Math.max(0, from, to)), so the link stack runs outside
 *   its node.
 * - nothing checks that the two ends of a link are in different columns.
 * - the builder's `apply` shadows Function.prototype.apply; call it as builder.apply(data)
 *   or builder(data).
 * - nodes are sorted across all columns at once (descending by default), then offsets are
 *   assigned per column.
 */
declare const prepareData: <T = unknown>() => SankeyDataPreparation<T>;
/**
 * sszvis.layout.sankey.computeLayout
 *
 * Automatically computes visual display properties needed by the sankey component,
 * including padding between each node, paddings for the tops of columns to vertically center
 * them, the domain and range of values in the nodes (used for scaling the node rectangles),
 * the node thickness, and the domain and range of the column positioning scale.
 *
 * @param  {Array} columnLengths      An array of lengths (number of nodes) of each column in the diagram.
 *                                    Used to compute optimal padding between nodes. Provided by the layout.sankey.prepareData function
 * @param  {Array} columnTotals       An array of column totals (total of all values of all ndoes). Provided by the
 * @param  {Number} columnHeight      The vertical height available for the columns. The tallest column will be this height. (Usually bounds.innerHeight)
 * @param  {Number} columnWidth       The width of all columns. The sankey chart will be this width. (Usually bounds.innerWidth)
 * @return {Object}                   An object of configuration parameters to be passed to the sankey component
 *         @property {Number} nodePadding         The amount of padding to add between nodes. pass to component.sankey.nodePadding
 *         @property {Array} columnPaddings       An array of padding values for each column. Index into this with the columnIndex and return to component.sankey.columnPadding
 *         @property {Array} valueDomain          The domain for the node size scale. Use to configure a linear scale for component.sankey.sizeScale
 *         @property {Array} valueRange           The range for the node size scale. Use to configure a linear scale for component.sankey.sizeScale
 *         @property {Number} nodeThickness       The thickness of nodes. Pass to component.sankey.nodeThickness
 *         @property {Array} columnDomain         The domain for the coumn position scale. use to configure a linear scale for component.sankey.columnPosition
 *         @property {Array} columnRange          The range for the coumn position scale. use to configure a linear scale for component.sankey.columnPosition
 *
 * Behaviour notes:
 * - padding is (columnHeight * 0.15) / (nodes - 1) per column, clamped to [12, 50], and the
 *   minimum across the columns is used for all of them. A single-node column divides by zero and
 *   contributes a phantom 50px candidate, but 50 is the cap, so that candidate only wins when
 *   every column is at 50 anyway - it never shrinks another column.
 * - pixels-per-unit is the minimum across the columns of the non-padding pixels divided by the
 *   column total. A column total of 0 contributes Infinity, which the minimum discards unless
 *   every total is 0; in that case the value range comes back [0, NaN].
 * - columnRange is the per-step offset, computed as (columnWidth - nodeThickness) /
 *   (numColumns - 1); a single column gives Infinity (issue #120) and an empty column list
 *   gives a negative step, an undefined nodePadding and NaN elsewhere.
 * - nodeThickness is always 20.
 */
declare const computeLayout$1: (columnLengths: number[], columnTotals: number[], columnHeight: number, columnWidth: number) => SankeyComputedLayout;

declare function computeLayout(numLayers: number, chartWidth: number): Object;
declare function getRadiusExtent(formattedData: any[]): any[];

/**
 * Binned Color Scale Legend
 *
 * Use for displaying the values of discontinuous (binned) color scale's bins
 *
 * Each display value becomes the upper edge of a bin, and a final bin runs from the last
 * display value to the upper endpoint. Bins are floored onto whole pixels and widened by
 * their subpixel remainder so that no gap shows between them, which means adjacent bins
 * overlap very slightly.
 *
 * Every bin except the trailing one carries a tick line and a label beneath its upper
 * edge. The line is snapped to the half-pixel grid to stay crisp while the label is
 * placed on the raw edge, so the two can sit half a pixel apart.
 *
 * @module sszvis/legend/binnedColorScale
 *
 * @property {function} scale           A scale to use to generate the color values
 * @property {array} displayValues      An array of values which should be displayed. Usually these should be the bin edges
 * @property {array} endpoints          The endpoints of the scale (note that these are not necessarily the first and last
 *                                      bin edges). These will become labels at either end of the legend.
 * @property {number} width             The pixel width of the legend. Default 200
 * @property {function} labelFormat     A formatter function for the labels of the displayValues.
 *
 * @return {sszvis.component}
 */

/** The subset of a d3 scale this legend relies on. */
type BinnedColorScale = (value: number) => string;
type BinLabelFormatter = (value: number) => string | number;
interface BinnedColorScaleComponent extends Component {
    scale(): BinnedColorScale;
    scale(scale: BinnedColorScale): BinnedColorScaleComponent;
    displayValues(): number[];
    displayValues(values: number[]): BinnedColorScaleComponent;
    endpoints(): [number, number];
    endpoints(endpoints: [number, number]): BinnedColorScaleComponent;
    width(): number;
    width(width: number): BinnedColorScaleComponent;
    labelFormat(): BinLabelFormatter;
    labelFormat(format: BinLabelFormatter): BinnedColorScaleComponent;
}
declare function export_default$2(): BinnedColorScaleComponent;

/**
 * Linear Color Scale Legend
 *
 * Use for displaying the values of a continuous linear color scale.
 *
 * The ramp is drawn as a row of abutting segments, one per displayed value, with a rounded
 * cap at each end and a label outside each cap. Segments are stretched by a pixel in each
 * direction so that no antialiasing seam shows between them.
 *
 * @module sszvis/legend/linearColorScale
 *
 * @property {function} scale                   The scale to use to generate the legend
 * @property {array} displayValues              A list of specific values to display. If not specified, defaults to using scale.ticks
 * @property {number} width                     The pixel width of the legend (default 200).
 * @property {number} segments                  The number of segments to aim for. Note, this is only used if displayValues isn't specified,
 *                                              and then it is passed as the argument to scale.ticks for finding the ticks. (default)
 * @property {array} labelText                  Text or a text-returning function to use as the titles for the legend endpoints. If not supplied,
 *                                              defaults to using the first and last tick values.
 * @property {function} labelFormat             An optional formatter function for the end labels. Usually should be sszvis.formatNumber.
 */

/** The subset of a d3 scale this legend relies on. */
interface LinearColorScale {
    (value: number): string;
    domain(): number[];
    ticks?(count?: number): number[];
}
type LabelFormatter = (value: unknown, index: number) => string | number;
interface LinearColorScaleComponent extends Component {
    scale(): LinearColorScale;
    scale(scale: LinearColorScale): LinearColorScaleComponent;
    displayValues(): number[];
    displayValues(values: number[]): LinearColorScaleComponent;
    width(): number;
    width(width: number): LinearColorScaleComponent;
    segments(): number;
    segments(segments: number): LinearColorScaleComponent;
    labelText(): unknown[] | undefined;
    labelText(text: unknown[]): LinearColorScaleComponent;
    labelFormat(): LabelFormatter;
    labelFormat(format: LabelFormatter): LinearColorScaleComponent;
}
declare function export_default$1(): LinearColorScaleComponent;

/**
 * Radius size legend
 *
 * Use for showing how different radius sizes correspond to data values.
 *
 * The legend draws one nested circle per tick, all resting on a common baseline, with a
 * dashed leader line and a label at the top edge of each circle.
 *
 * When tickValues are not supplied, the ticks default to the domain maximum, the value at
 * the midpoint of the scale's range, and the domain minimum. Deriving that middle tick
 * calls scale.invert(), so the default only works for a continuous scale; pass tickValues
 * explicitly to use any other kind.
 *
 * Every tick produces a circle, a leader line and a label, including a tick whose value
 * maps to a zero radius - the circle is then invisible but the line and label still mark
 * that value. Pass tickValues to leave it out.
 *
 * @module sszvis/legend/radius
 *
 * @property {function} scale         A scale to use to generate the radius sizes
 * @property {function} [tickFormat]  Formatter function for the labels (default identity)
 * @property {array} [tickValues]     An array of domain values to be used as radii that the legend shows
 *
 * @returns {sszvis.component}
 */

/** The subset of a d3 scale this legend relies on. */
interface RadiusScale {
    (value: NumberValue): number;
    domain(): NumberValue[];
    range(): number[];
    /** Required only when tickValues are not supplied. */
    invert?(value: number): NumberValue;
}
/** Formats a tick label. The default is fn.identity, which passes the value through. */
type TickFormatter = (value: NumberValue, index: number) => string | number;
interface RadiusLegendComponent extends Component {
    scale(): RadiusScale;
    scale(scale: RadiusScale): RadiusLegendComponent;
    tickFormat(): TickFormatter;
    tickFormat(format: TickFormatter): RadiusLegendComponent;
    tickValues(): NumberValue[] | undefined;
    tickValues(values: NumberValue[]): RadiusLegendComponent;
}
declare function export_default(): RadiusLegendComponent;

/**
 * Handle data load errors in a standardized way
 *
 * @module sszvis/loadError
 */
/**
 * Handle data loading errors by logging them
 * @param error The error object from a failed data load operation
 */
declare const loadError: (error: Error | unknown) => void;

/**
 * Swiss German format locale definition for d3.format functions
 */
declare const formatLocale: FormatLocaleDefinition;
/**
 * Swiss German time locale definition for d3.time functions
 */
declare const timeLocale: TimeLocaleDefinition;

declare const STADT_KREISE_KEY: "zurichStadtKreise";
declare const STATISTISCHE_QUARTIERE_KEY: "zurichStatistischeQuartiere";
declare const STATISTISCHE_ZONEN_KEY: "zurichStatistischeZonen";
declare const WAHL_KREISE_KEY: "zurichWahlKreise";
declare const AGGLOMERATION_2012_KEY: "zurichAgglomeration2012";
declare const SWITZERLAND_KEY: "switzerland";
/**
 * swissMapProjection
 *
 * A function for creating d3 projection functions, customized for the dimensions of the map you need.
 * Because this projection generator involves calculating the boundary of the features that will be
 * projected, the result of these calculations is cached internally. Hence the featureBoundsCacheKey.
 * You don't need to worry about this - mostly it's the map module components which use this function.
 *
 * @param  {Number} width                           The width of the projection destination space.
 * @param  {Number} height                          The height of the projection destination space.
 * @param  {Object} featureCollection               The feature collection that will be projected by the returned function. Needed to calculated a good size.
 * @param  {String} featureBoundsCacheKey           Used internally, this is a key for the cache for the expensive part of this computation.
 * @return {Function}                               The projection function.
 */
declare const swissMapProjection: ((...args: any[]) => any) & {
    cache: Map<string | number, any>;
};
declare function swissMapPath(width: number, height: number, featureCollection: GeoJson, featureBoundsCacheKey?: string): typeof geoPath;
declare function pixelsFromGeoDistance(projection: Function, centerPoint: array, meterDistance: number): number;
declare const GEO_KEY_DEFAULT: "geoId";
declare function prepareMergedGeoData(dataset: any[], geoJson: Object, keyName: string): any[];
declare function getGeoJsonCenter(geoJson: Object): any;
declare function widthAdaptiveMapPathStroke(width: number): number;

declare function _default$8(): any;

declare function _default$7(): any;

declare function _default$6(): any;

declare function _default$5(): any;

declare function _default$4(): any;

declare function _default$3(): any;

declare function _default$2(): any;

declare function _default$1(): any;

/**
 * zurichStadtKreise Map Component
 *
 * To use this component, pass data in the usual manner. Each data object is expected to have a value which
 * will be used to match that object with a particular map entity. The possible id values depend on the map type.
 * They are covered in more detail in the file sszvis/map/map-ids.txt. Which data key is used to fetch this value is configurable.
 * The default key which map.js expects is 'geoId', but by changing the keyName property of the map, you can pass data which
 * use any key. The map component assumes that datum[keyName] is a valid map ID which is matched with the available map entities.
 *
 * @property {Number} width                           The width of the map. Used to create the map projection function
 * @property {Number} height                          The height of the map. Used to create the map projection function
 * @property {String} keyName                         The data object key which will return a map entity id. Default 'geoId'.
 * @property {Array} highlight                        An array of data elements to highlight. The corresponding map entities are highlighted.
 * @property {String, Function} highlightStroke       A function for the stroke of the highlighted entities
 * @property {Boolean, Function} defined              A predicate function used to determine whether a datum has a defined value.
 *                                                    Map entities with data values that fail this predicate test will display the missing value texture.
 * @property {String, Function} fill                  A string or function for the fill of the map entities
 * @property {String} borderColor                     A string for the border color of the map entities
 * @property {Boolean} withLake                       Whether or not to show the textured outline of the end of lake Zurich that is within the city. Default true
 * @property {Component} anchoredShape                A shape to anchor to the base map elements of this map. For example, anchoredCircles for a bubble map.
 * @property {Boolean} transitionColor                Whether or not to transition the color of the base shapes. Default true.
 * @function on(String, function)                     This component has an event handler interface for binding events to the map entities.
 *                                                    The available events are 'over', 'out', and 'click'. These are triggered on map
 *                                                    elements when the user mouses over or taps, mouses out, or taps or clicks, respectively.
 *
 * @return {d3.component}
 */
declare function _default(): d3.component;

/**
 * Parsing functions
 *
 * @module sszvis/parse
 */
declare const parseDate: (d: string) => Date | null;
declare const parseYear: (d: string) => Date | null;
/**
 * Parse untyped input
 * @param  {String} d A value that could be a number
 * @return {Number}   If d is not a number, NaN is returned
 */
declare const parseNumber: (d: string) => number;

/**
 * Patterns module
 *
 * @module sszvis/patterns
 *
 * This module contains svg patterns and pattern helper functions which are used
 * to render important textures for various other components.
 *
 * @method  heatTableMissingValuePattern    The pattern for the missing values in the heat table
 * @method  mapMissingValuePattern          The pattern for the map areas which are missing values. Used by map.js internally
 * @method  mapLakePattern                  The pattern for Lake Zurich in the map component. Used by map.js internally
 * @method  mapLakeFadeGradient             The pattern which provides a gradient, used by the alpha fade pattern,
 *                                          in the Lake Zurich shape. Used by map.js internally
 * @method  mapLakeGradientMask             The pattern which provides a gradient alpha fade for the Lake Zurich shape.
 *                                           It uses the fadeGradient pattern to create an alpha gradient mask. Used by map.js internally
 * @method  dataAreaPattern                 The pattern for the data area texture.
 *
 */

/**
 * The pattern for the missing values in the heat table
 * @param selection A d3 selection of SVG pattern elements
 */
declare const heatTableMissingValuePattern: (selection: PatternSelection) => void;
/**
 * The pattern for the map areas which are missing values
 * @param selection A d3 selection of SVG pattern elements
 */
declare const mapMissingValuePattern: (selection: PatternSelection) => void;
/**
 * The pattern for Lake Zurich in the map component
 * @param selection A d3 selection of SVG pattern elements
 */
declare const mapLakePattern: (selection: PatternSelection) => void;
/**
 * The gradient used by the alpha fade pattern in the Lake Zurich shape
 * @param selection A d3 selection of SVG linear gradient elements
 */
declare const mapLakeFadeGradient: (selection: LinearGradientSelection) => void;
/**
 * The gradient alpha fade mask for the Lake Zurich shape
 * @param selection A d3 selection of SVG mask elements
 */
declare const mapLakeGradientMask: (selection: MaskSelection) => void;
/**
 * The pattern for the data area texture
 * @param selection A d3 selection of SVG pattern elements
 */
declare const dataAreaPattern: (selection: PatternSelection) => void;

/**
 * ResponsiveProps module
 *
 * @module sszvis/responsiveProps
 *
 *
 *
 * The module should be configured with any number of different properties that change
 * based on breakpoints, plus (optional) breakpoint configuration, and then called
 * as a function. You must pass in an object with 'width' and 'screenHeight' properties.
 * This is the kind of thing which is returned from sszvis.bounds and sszvis.measureDimensions.
 *
 *
 * The return value of the function call is an object which has properties corresponding to
 * the properties you configured before. The property values are decided based on testing the breakpoints
 * against the measured values and finding the first one in which the measured values fit.
 *
 * Example usage:
 *
 * var queryProps = sszvis.responsiveProps()
 *   .breakpoints([
 *     { name: 'small', width:  400 },
 *     { name: 'medium', width:  800 },
 *     { name: 'large', width: 1000 }
 *   ])
 *   .prop('axisOrientation', {
 *     medium: 'left',
 *     _: 'bottom'
 *   })
 *   .prop('height', {
 *     small: 200,
 *     medium: function(width) { return width * 3/4; },
 *     large: function(width) { return width / 2; },
 *     _: 400
 *   });
 *
 * queryProps({width: 300, screenHeight: 400}).axisOrientation; // returns "left"
 * queryProps({width: 300, screenHeight: 400}).height; // returns the result of 200 or the function call
 *
 * @param {{width: number, screenHeight: number}|{bounds: object, screenWidth: number, screenHeight: number}} arg dimensions object
 * @return {object} An object containing the properties you configured for the matching breakpoint
 *
 * You can also configure different breakpoints than the defaults using:
 *
 * @method responsiveProps.breakpoints
 *
 * And you can add responsive properties using:
 *
 * @method responsiveProps.prop
 */

interface ResponsivePropValue<T = any> {
    [breakpointName: string]: T | ((width: number) => T);
    _: T | ((width: number) => T);
}
interface ResponsivePropsConfig {
    [propName: string]: ResponsivePropValue;
}
interface ResponsivePropsInstance {
    (measurements: Measurement): Record<string, any>;
    prop<T>(propName: string, propSpec: ResponsivePropValue<T>): ResponsivePropsInstance;
    breakpoints(): Breakpoint[];
    breakpoints(bps: Breakpoint[]): ResponsivePropsInstance;
}
declare function responsiveProps(): ResponsivePropsInstance;

/**
 * Scale utilities
 *
 * @module sszvis/scale
 */
interface Scale {
    range(): any[];
    rangeExtent?(): [number, number];
}
/**
 * Scale range
 *
 * Used to determine the extent of a scale's range. Mimics a function found in d3 source code.
 *
 * @param  {array} scale    The scale to be measured
 * @return {array}          The extent of the scale's range. Useful for determining how far
 *                          a scale stretches in its output dimension.
 */
declare const range: (scale: Scale) => [number, number];

/**
 * Crisp
 *
 * Utilities to render SVG elements crisply by placing them precisely on the
 * pixel grid. Rectangles should be placed on round pixels, lines and circles
 * on half-pixels.
 *
 * Example of rectangle placement (four • create one pixel)
 * •    •----•----•    •
 *      |         |
 * •    •----•----•    •
 *
 * Example of line placement (four • create one pixel)
 * •    •    •    •    •
 *    ---------------
 * •    •    •    •    •
 *
 * @module sszvis/svgUtils/crisp
 */
/**
 * crisp.halfPixel
 *
 * To ensure SVG elements are rendered crisply and without anti-aliasing
 * artefacts, they must be placed on a half-pixel grid.
 *
 * @param  {number} pos A pixel position
 * @return {number}     A pixel position snapped to the pixel grid
 */
declare const halfPixel: (pos: number) => number;
/**
 * crisp.roundTransformString
 *
 * Takes an SVG transform string 'translate(12.3,4.56789) rotate(3.5)' and
 * rounds the coordinates of its translate instruction down to integers:
 * 'translate(12,4) rotate(3.5)'.
 *
 * A valid translate instruction has the form 'translate(<x> [<y>])' where
 * x and y can be separated by a space or comma. Both forms are accepted and
 * the result is always comma-separated.
 *
 * Coordinates are floored rather than rounded to the nearest integer, which
 * keeps this consistent with halfPixel: both place an element on the pixel
 * grid by moving it towards the origin of its enclosing pixel.
 *
 * Scope: only the first translate instruction of a string is processed, and a
 * translate is expected to carry one or two components. Other instructions
 * (rotate, scale, …) are passed through untouched.
 *
 * Known defects are pinned in test/svgUtils/crisp.test.ts.
 *
 * @param  {string} transformStr A valid SVG transform string
 * @return {string}              An SVG transform string with rounded values
 */
declare const roundTransformString: (transformStr: string) => string;
/**
 * crisp.transformTranslateSubpixelShift
 *
 * This helper function takes a transform string and returns a vector that
 * tells us how much to shift an element in order to place it on a half-pixel
 * grid.
 *
 * Each component is the distance from the coordinate down to the origin of its
 * enclosing pixel, so the shift is always in [0, 1). Because it is measured
 * from Math.floor — consistent with halfPixel and roundTransformString — a
 * negative coordinate yields the distance above the enclosing pixel rather
 * than a negative offset: -12.3 shifts by 0.7, not -0.3.
 *
 * A translate carrying only an x component yields a y shift of 0.
 *
 * Known defects are pinned in test/svgUtils/crisp.test.ts.
 *
 * @param  {string} transformStr A valid SVG transform string containing a
 *                               translate instruction
 * @return {vector}              Two-element array ([dx, dy])
 */
declare const transformTranslateSubpixelShift: (transformStr: string) => [number, number];

/**
 * Ensure Defs Element
 *
 * This method ensures that the provided selection contains a 'defs' object,
 * and furthermore, that the defs object contains an instance of the provided
 * element type, with the provided ID.
 *
 * @module sszvis/svgUtils/ensureDefsElement
 *
 * @param {d3.selection} selection
 * @param {string}       type       Element to create
 * @param {string}       elementId  The ID to assign to the created element
 */

declare function ensureDefsElement(selection: AnySelection, type: string, elementId: string): AnySelection;

/**
 * ModularText component
 *
 * Create structured text with formatting and newlines. Use either the HTML or
 * SVG variant, depending on the output you expect.
 *
 * @module sszvis/svgUtils/modularText/html
 * @module sszvis/svgUtils/modularText/svg
 *
 * @example HTML
 * var fmtHtml = sszvis.modularTextHTML()
 *   .plain('Artist:')
 *   .plain(function(d) { return d.name; })
 *   .newline()
 *   .bold(function(d) { return d.age; })
 *   .italic('years old');
 * fmtHtml({name: 'Patti', age: 67});
 * //=> "Artist: Patti<br/><strong>67</strong> <em>years old</em>"
 *
 * @example SVG
 * var fmtSvg = sszvis.modularTextSVG()
 *   .bold(function(d) { return d.items; })
 *   .plain('items');
 * fmtSvg({items: 30});
 * //=> "<tspan x="0" dy="0"><tspan style="font-weight:bold">30</tspan> <tspan>items</tspan></tspan>"
 *
 * Words on a line are joined with a single space. The HTML variant separates
 * lines with <br/>; the SVG variant wraps each line in a <tspan> that resets x
 * to 0 and advances dy by 1.2em after the first line.
 *
 * The two variants differ on the empty case: a builder with no words formats to
 * "" as HTML, but to a single empty wrapper <tspan> as SVG. Both are harmless
 * in practice, since a builder is always given at least one word.
 *
 * A builder is reusable: it holds the structure, not the data, so the same
 * builder can be applied to many datums.
 *
 * @property {string, function} plain  String without formatting
 * @property {string, function} italic String with italic style
 * @property {string, function} bold   String with bold style
 * @property newline                   Insert a line break
 *
 * @return {function} Formatting function that accepts a datum
 */
/**
 * A chainable text builder. Calling it with a datum returns the formatted string.
 * The `plain`, `italic` and `bold` methods each accept either a constant value or
 * an accessor function which is called with the datum.
 */
interface ModularTextBuilder {
    (datum?: unknown): string;
    newline(): ModularTextBuilder;
    plain(text: unknown): ModularTextBuilder;
    italic(text: unknown): ModularTextBuilder;
    bold(text: unknown): ModularTextBuilder;
}
declare const modularTextHTML: () => ModularTextBuilder;
declare const modularTextSVG: () => ModularTextBuilder;

/**
 * Text wrap
 *
 * Function allowing to 'wrap' the text from an SVG <text> element with <tspan>.
 *
 * @module sszvis/svgUtils/textWrap
 *
 * Based on https://github.com/mbostock/d3/issues/1642
 * @example svg.append("g")
 *      .attr("class", "x axis")
 *      .attr("transform", "translate(0," + height + ")")
 *      .call(xAxis)
 *      .selectAll(".tick text")
 *          .call(d3TextWrap, x.rangeBand());
 *
 * @param selection d3 selection for one or more <text> object
 * @param width number - global width in which the text will be word-wrapped.
 * @param paddingRightLeft integer - Padding right and left between the wrapped text and the 'invisible bax' of 'width' width
 * @param paddingTopBottom integer - Padding top and bottom between the wrapped text and the 'invisible bax' of 'width' width
 * @returns Array[number] - Number of lines created by the function, stored in a Array in case multiple <text> element are passed to the function
 */

declare function textWrap(selection: AnySelection, width: number, paddingRightLeft?: number, paddingTopBottom?: number): number[];

/**
 * translateString
 *
 * Pass an x and a y component, and this returns a translate string, which can be set as the 'transform' property of
 * an svg element.
 *
 * @module sszvis/svgUtils/translateString
 *
 * @param  {number} x     The x-component of the transform
 * @param  {number} y     The y-component of the transform
 * @return {string}       The translate string
 */
declare function translateString(x: number, y: number): string;

/**
 * Default transition attributes for sszvis
 *
 * @module sszvis/transition
 *
 * Generally speaking, this module is used internally by components which transition the state of the update selection.
 * The module sszvis.transition encapsulates the basic transition attributes used in the app. It is invoked by doing
 * d3.selection().transition().call(sszvis.transition), which applies the transition attributes to the passed transition.
 * transition.fastTransition provides an alternate transition duration for certain situations where the standard duration is
 * too slow.
 */
/**
 * Creates a default transition with standard easing and duration
 * @returns A d3 transition with 300ms duration and polynomial ease-out
 */
declare const defaultTransition: () => d3_transition.Transition<d3_selection.BaseType, unknown, null, undefined>;
/**
 * Creates a fast transition for quick animations
 * @returns A d3 transition with 50ms duration and polynomial ease-out
 */
declare const fastTransition: () => d3_transition.Transition<d3_selection.BaseType, unknown, null, undefined>;
/**
 * Creates a slow transition for gradual animations
 * @returns A d3 transition with 500ms duration and polynomial ease-out
 */
declare const slowTransition: () => d3_transition.Transition<d3_selection.BaseType, unknown, null, undefined>;

declare namespace viewport {
    export { on };
    export { off };
    export { trigger };
}
declare function on(name: any, cb: any): any;
declare function off(name: any, cb: any): any;
declare function trigger(name: any, ...args: any[]): any;

export { AGGLOMERATION_2012_KEY, DEFAULT_LEGEND_COLOR_ORDINAL_ROW_HEIGHT, DEFAULT_WIDTH, GEO_KEY_DEFAULT, RATIO, STADT_KREISE_KEY, STATISTISCHE_QUARTIERE_KEY, STATISTISCHE_ZONEN_KEY, SWITZERLAND_KEY, WAHL_KREISE_KEY, export_default$v as annotationCircle, export_default$u as annotationConfidenceArea, export_default$t as annotationConfidenceBar, export_default$r as annotationLine, export_default$q as annotationRangeFlag, export_default$p as annotationRangeRuler, export_default$o as annotationRectangle, annotationRuler, app, arity, aspectRatio, aspectRatio12to5, aspectRatio16to10, aspectRatio4to3, aspectRatioAuto, aspectRatioPortrait, aspectRatioSquare, axisX, axisY, export_default$i as bar, bounds, export_default$w as breadcrumb, breakpointCreateSpec, breakpointDefaultSpec, breakpointFind, breakpointFindByName, breakpointLap, breakpointMatch, breakpointPalm, breakpointTest, _default$d as buttonGroup, cascade, _default as choropleth, colorLegendDimensions, colorLegendLayout, compose, contains, createBreadcrumbItems, createHtmlLayer, createSvgLayer, dataAreaPattern, defaultTransition, defined, derivedSet, export_default$7 as dimensionsHeatTable, export_default$6 as dimensionsHorizontalBarChart, export_default$3 as dimensionsVerticalBarChart, export_default$h as dot, ensureDefsElement, every, fallbackCanvasUnsupported, fallbackRender, fallbackUnsupported, fastTransition, filledArray, find, first, firstTouch, export_default$s as fitTooltip, flatten, foldPattern, formatAge, formatAxisTimeFormat, formatFractionPercent, formatLocale, formatMonth, formatNone, formatNumber, formatPercent, formatPreciseNumber, formatText, formatYear, functor, getAccessibleTextColor, getGeoJsonCenter, groupedBars, groupedBarsHorizontal, groupedBarsVertical, halfPixel, _default$c as handleRuler, hashableSet, heatTableMissingValuePattern, identity, isFunction, isNull, isNumber, isObject, isSelection, isString, last, export_default$5 as layoutPopulationPyramid, _default$9 as layoutSmallMultiples, export_default$4 as layoutStackedAreaMultiples, export_default$2 as legendColorBinned, export_default$1 as legendColorLinear, legendColorOrdinal, export_default as legendRadius, export_default$g as line, loadError, mapLakeFadeGradient, mapLakeGradientMask, mapLakePattern, mapMissingValuePattern, _default$8 as mapRendererBase, _default$7 as mapRendererBubble, _default$6 as mapRendererGeoJson, _default$5 as mapRendererHighlight, _default$4 as mapRendererImage, _default$3 as mapRendererMesh, _default$2 as mapRendererPatternedLakeOverlay, _default$1 as mapRendererRaster, measureAxisLabel, measureDimensions, measureLegendLabel, measureText, memoize, modularTextHTML, modularTextSVG, export_default$l as move, muchDarker, nestedStackedBarsVertical, not, export_default$f as pack, export_default$k as panning, parseDate, parseNumber, parseYear, export_default$e as pie, pixelsFromGeoDistance, prepareHierarchyData, prepareMergedGeoData, prop, propOr, export_default$d as pyramid, range, responsiveProps, roundTransformString, rulerLabelVerticalSeparate, export_default$c as sankey, computeLayout$1 as sankeyLayout, prepareData as sankeyPrepareData, scaleDeepGry, scaleDimGry, scaleDivNtr, scaleDivNtrGry, scaleDivVal, scaleDivValGry, scaleGender3, scaleGender5Wedding, scaleGender6Origin, scaleGry, scaleLightGry, scaleMedGry, scalePaleGry, scaleQual12, scaleQual6, scaleQual6a, scaleQual6b, scaleSeqBlu, scaleSeqBrn, scaleSeqGrn, scaleSeqRed, _default$b as selectMenu, set, _default$a as slider, slightlyDarker, slowTransition, some, export_default$b as stackedArea, export_default$a as stackedAreaMultiples, stackedBarHorizontal, stackedBarHorizontalData, stackedBarVertical, stackedBarVerticalData, stackedPyramid, stackedPyramidData, stringEqual, export_default$9 as sunburst, getRadiusExtent as sunburstGetRadiusExtent, computeLayout as sunburstLayout, swissMapPath, swissMapProjection, textWrap, timeLocale, export_default$n as tooltip, export_default$m as tooltipAnchor, transformTranslateSubpixelShift, translateString, export_default$8 as treemap, viewport, export_default$j as voronoi, widthAdaptiveMapPathStroke, withAlpha };
export type { Action, AspectRatioFunction, AspectRatioFunctionWithMaxHeight, BinnedColorScaleComponent, BoundsConfig, BoundsResult, BreadcrumbComponent, BreadcrumbItem, CascadeInstance, ColorLegendDimensions, ColorLegendLayout, ColorLegendLayoutOptions, ColorScaleFactory, Dispatch, Effect, ExtendedDivergingScale, ExtendedLinearScale, ExtendedOrdinalScale, FallbackOptions, KeyAccessor$2 as KeyAccessor, KeySorter, LayerMetadata, LegendOrientation, LinearColorScaleComponent, MeasurableElement, OrdinalColorScaleComponent, Padding, PartialBreakpoint, RadiusLegendComponent, ResponsivePropValue, ResponsivePropsConfig, ResponsivePropsInstance, SlantDirection, StackedBarHorizontalComponent, StackedBarLayout, StackedBarSeries$1 as StackedBarSeries, StackedBarSlice$1 as StackedBarSlice, StackedBarVerticalComponent, StackedPyramidComponent, StackedPyramidLayout, StackedPyramidSeries, StackedPyramidSide, StackedPyramidSlice, SvgLayerMetadata, ValueSorter };
