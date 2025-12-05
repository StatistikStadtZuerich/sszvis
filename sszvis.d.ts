import { Selection, NumberValue, BaseType, HierarchyNode, AxisScale, AxisDomain, ScaleLinear, ScaleBand, ScalePoint, ScaleOrdinal, LabColor, HSLColor, HierarchyCircularNode, FormatLocaleDefinition, TimeLocaleDefinition, geoPath } from 'd3';
import * as d3_shape from 'd3-shape';
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
declare function export_default$f<T = unknown>(): BreadcrumbComponent<T>;

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
declare function export_default$e<T = unknown>(): CircleComponent<T>;

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
interface ConfidenceAreaComponent<T = unknown> extends Component {
    x(accessor?: NumberAccessor$1<Datum$8<T>>): ConfidenceAreaComponent<T>;
    y0(accessor?: NumberAccessor$1<Datum$8<T>>): ConfidenceAreaComponent<T>;
    y1(accessor?: NumberAccessor$1<Datum$8<T>>): ConfidenceAreaComponent<T>;
    stroke(stroke?: string): ConfidenceAreaComponent<T>;
    strokeWidth(width?: number): ConfidenceAreaComponent<T>;
    fill(fill?: string): ConfidenceAreaComponent<T>;
    key(accessor?: StringAccessor<Datum$8<T>>): ConfidenceAreaComponent<T>;
    valuesAccessor(accessor?: (d: Datum$8<T>[]) => Datum$8<T>[]): ConfidenceAreaComponent<T>;
    transition(enabled?: boolean): ConfidenceAreaComponent<T>;
}
declare function export_default$d<T = unknown>(): ConfidenceAreaComponent<T>;

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
declare function export_default$c<T = unknown>(): ConfidenceBarComponent<T>;

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
declare function export_default$b<T = unknown>(defaultVal: TooltipOrientation, bounds: Bounds): (d: TooltipData$1<T>) => TooltipOrientation;

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
interface LineComponent<T = unknown> extends Component {
    x1(accessor?: NumberAccessor$1<Datum$6<T>>): LineComponent<T>;
    x2(accessor?: NumberAccessor$1<Datum$6<T>>): LineComponent<T>;
    y1(accessor?: NumberAccessor$1<Datum$6<T>>): LineComponent<T>;
    y2(accessor?: NumberAccessor$1<Datum$6<T>>): LineComponent<T>;
    xScale(scale?: AxisScale<NumberValue>): LineComponent<T>;
    yScale(scale?: AxisScale<NumberValue>): LineComponent<T>;
    dx(accessor?: NumberAccessor$1<Datum$6<T>>): LineComponent<T>;
    dy(accessor?: NumberAccessor$1<Datum$6<T>>): LineComponent<T>;
    caption(accessor?: StringAccessor<Datum$6<T>>): LineComponent<T>;
}
declare function export_default$a<T = unknown>(): LineComponent<T>;

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
declare function export_default$9<T = unknown>(): RangeFlagComponent<T>;

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
declare function export_default$8<T = unknown>(): RangeRulerComponent<T>;

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
declare function export_default$7<T = unknown>(): RectangleComponent<T>;

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
declare function export_default$6<T = unknown>(): TooltipComponent<T>;

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
declare function export_default$5<T = unknown>(): TooltipAnchorComponent<T>;

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
declare function export_default$4<XDomain = number | string, YDomain = number | string>(): MoveComponent<XDomain, YDomain>;

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
declare function export_default$3(): PanningComponent;

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
declare function export_default$2<T = unknown>(): VoronoiComponent<T>;

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
type KeyAccessor<T, K = string | number> = (datum: T) => K;
type KeySorter<K = string | number> = (a: K, b: K) => number;
type ValueSorter<T> = (a: T, b: T) => number;
interface CascadeInstance<T> {
    apply(data: T[]): any;
    objectBy<K extends string | number>(accessor: KeyAccessor<T, K>): CascadeInstance<T>;
    arrayBy<K extends string | number>(accessor: KeyAccessor<T, K>, sorter?: KeySorter<K>): CascadeInstance<T>;
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

declare function _default$w(): any;

declare function _default$v(): any;

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

declare function stackedBarHorizontalData(_stackAcc: any, seriesAcc: any, valueAcc: any): (data: any) => d3_shape.Series<{
    [key: string]: number;
}, string>[];
declare function stackedBarVerticalData(_stackAcc: any, seriesAcc: any, valueAcc: any): (data: any) => d3_shape.Series<{
    [key: string]: number;
}, string>[];
declare function stackedBarHorizontal(): Component;
declare function stackedBarVertical(): Component;

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
declare function stackedPyramidData(sideAcc: any, _rowAcc: any, seriesAcc: any, valueAcc: any): (data: any) => any;
declare function stackedPyramid(): any;

declare function _default$u(): any;

declare function nestedStackedBarsVertical(): Component;

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
declare function export_default$1<T = unknown>(): PackComponent<T>;

declare function _default$t(): Component;

declare function _default$s(): any;

declare function _default$r(): any;

declare function _default$q(): any;

declare function _default$p(): any;

declare function _default$o(): any;

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
declare function export_default<T = unknown>(): TreemapComponent<T>;

declare function _default$n(): any;

declare function _default$m(): any;

declare function _default$l(): any;

declare function _default$k(): any;

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
 * colorLegendLayout
 *
 * Generate a color scale and a legend for the given labels. Compute how much
 * padding labels plus legend needs for use with `sszvis.bounds()`
 */
declare function colorLegendLayout({ legendLabels, axisLabels, slant }: {
    legendLabels: any;
    axisLabels?: never[] | undefined;
    slant?: string | undefined;
}, container: any): {
    axisLabelPadding: number;
    legendPadding: number;
    bottomPadding: number;
    legendWidth: number;
    legend: any;
    scale: ExtendedOrdinalScale;
};
/**
 * colorLegendDimensions
 *
 * Compute all the dimensions necessary to generate an ordinal color legend.
 */
declare function colorLegendDimensions(labels: any, containerWidth: any): {
    columns: any;
    rows: number;
    columnWidth: number | null | undefined;
    legendWidth: number;
    horizontalFloat: boolean;
    orientation: string | null;
};

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
 */
declare function _default$j(spaceWidth: number, squarePadding: number, numX: number, numY: number, chartPadding?: Object): object;

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
 */
declare function _default$i(numBars: number): object;

declare function _default$h(spaceWidth: any, numBars: any): {
    barHeight: number;
    padding: number;
    totalHeight: number;
    positions: number[];
    maxBarLength: number;
    chartPadding: number;
};

declare function _default$g(): any;

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
 */
declare function _default$f(height: number, num: number, pct: number): object;

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
 */
declare function _default$e(width: number, numBars: number): object;

declare function prepareData(): Function;
declare function computeLayout$1(columnLengths: any[], columnTotals: any[], columnHeight: number, columnWidth: number): Object;

declare function computeLayout(numLayers: number, chartWidth: number): Object;
declare function getRadiusExtent(formattedData: any[]): any[];

declare function _default$d(): any;

declare function _default$c(): any;

declare function legendColorOrdinal(): any;
declare const DEFAULT_LEGEND_COLOR_ORDINAL_ROW_HEIGHT: 21;

declare function _default$b(): any;

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

declare function _default$a(): any;

declare function _default$9(): any;

declare function _default$8(): any;

declare function _default$7(): any;

declare function _default$6(): any;

declare function _default$5(): any;

declare function _default$4(): any;

declare function _default$3(): any;

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
declare function _default$2(): d3.component;

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

declare function _default$1(selection: any, width: any, paddingRightLeft: any, paddingTopBottom: any): any[];

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
declare function _default(x: number, y: number): string;

declare function halfPixel(pos: number): number;
declare function roundTransformString(transformStr: string): string;
declare function transformTranslateSubpixelShift(transformStr: string): vecor;

declare function modularTextHTML(): {
    (d: any): any;
    newline(): /*elided*/ any;
};
declare function modularTextSVG(): {
    (d: any): any;
    newline(): /*elided*/ any;
};

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

export { AGGLOMERATION_2012_KEY, DEFAULT_LEGEND_COLOR_ORDINAL_ROW_HEIGHT, DEFAULT_WIDTH, GEO_KEY_DEFAULT, RATIO, STADT_KREISE_KEY, STATISTISCHE_QUARTIERE_KEY, STATISTISCHE_ZONEN_KEY, SWITZERLAND_KEY, WAHL_KREISE_KEY, export_default$e as annotationCircle, export_default$d as annotationConfidenceArea, export_default$c as annotationConfidenceBar, export_default$a as annotationLine, export_default$9 as annotationRangeFlag, export_default$8 as annotationRangeRuler, export_default$7 as annotationRectangle, annotationRuler, app, arity, aspectRatio, aspectRatio12to5, aspectRatio16to10, aspectRatio4to3, aspectRatioAuto, aspectRatioPortrait, aspectRatioSquare, axisX, axisY, _default$w as bar, bounds, export_default$f as breadcrumb, breakpointCreateSpec, breakpointDefaultSpec, breakpointFind, breakpointFindByName, breakpointLap, breakpointMatch, breakpointPalm, breakpointTest, _default$n as buttonGroup, cascade, _default$2 as choropleth, colorLegendDimensions, colorLegendLayout, compose, contains, createBreadcrumbItems, createHtmlLayer, createSvgLayer, dataAreaPattern, defaultTransition, defined, derivedSet, _default$j as dimensionsHeatTable, _default$i as dimensionsHorizontalBarChart, _default$e as dimensionsVerticalBarChart, _default$v as dot, ensureDefsElement, every, fallbackCanvasUnsupported, fallbackRender, fallbackUnsupported, fastTransition, filledArray, find, first, firstTouch, export_default$b as fitTooltip, flatten, foldPattern, formatAge, formatAxisTimeFormat, formatFractionPercent, formatLocale, formatMonth, formatNone, formatNumber, formatPercent, formatPreciseNumber, formatText, formatYear, functor, getAccessibleTextColor, getGeoJsonCenter, groupedBars, groupedBarsHorizontal, groupedBarsVertical, halfPixel, _default$m as handleRuler, hashableSet, heatTableMissingValuePattern, identity, isFunction, isNull, isNumber, isObject, isSelection, isString, last, _default$h as layoutPopulationPyramid, _default$g as layoutSmallMultiples, _default$f as layoutStackedAreaMultiples, _default$d as legendColorBinned, _default$c as legendColorLinear, legendColorOrdinal, _default$b as legendRadius, _default$u as line, loadError, mapLakeFadeGradient, mapLakeGradientMask, mapLakePattern, mapMissingValuePattern, _default$a as mapRendererBase, _default$9 as mapRendererBubble, _default$8 as mapRendererGeoJson, _default$7 as mapRendererHighlight, _default$6 as mapRendererImage, _default$5 as mapRendererMesh, _default$4 as mapRendererPatternedLakeOverlay, _default$3 as mapRendererRaster, measureAxisLabel, measureDimensions, measureLegendLabel, measureText, memoize, modularTextHTML, modularTextSVG, export_default$4 as move, muchDarker, nestedStackedBarsVertical, not, export_default$1 as pack, export_default$3 as panning, parseDate, parseNumber, parseYear, _default$t as pie, pixelsFromGeoDistance, prepareHierarchyData, prepareMergedGeoData, prop, propOr, _default$s as pyramid, range, responsiveProps, roundTransformString, rulerLabelVerticalSeparate, _default$r as sankey, computeLayout$1 as sankeyLayout, prepareData as sankeyPrepareData, scaleDeepGry, scaleDimGry, scaleDivNtr, scaleDivNtrGry, scaleDivVal, scaleDivValGry, scaleGender3, scaleGender5Wedding, scaleGender6Origin, scaleGry, scaleLightGry, scaleMedGry, scalePaleGry, scaleQual12, scaleQual6, scaleQual6a, scaleQual6b, scaleSeqBlu, scaleSeqBrn, scaleSeqGrn, scaleSeqRed, _default$l as selectMenu, set, _default$k as slider, slightlyDarker, slowTransition, some, _default$q as stackedArea, _default$p as stackedAreaMultiples, stackedBarHorizontal, stackedBarHorizontalData, stackedBarVertical, stackedBarVerticalData, stackedPyramid, stackedPyramidData, stringEqual, _default$o as sunburst, getRadiusExtent as sunburstGetRadiusExtent, computeLayout as sunburstLayout, swissMapPath, swissMapProjection, _default$1 as textWrap, timeLocale, export_default$6 as tooltip, export_default$5 as tooltipAnchor, transformTranslateSubpixelShift, _default as translateString, export_default as treemap, viewport, export_default$2 as voronoi, widthAdaptiveMapPathStroke, withAlpha };
export type { Action, AspectRatioFunction, AspectRatioFunctionWithMaxHeight, BoundsConfig, BoundsResult, BreadcrumbComponent, BreadcrumbItem, CascadeInstance, ColorScaleFactory, Dispatch, Effect, ExtendedDivergingScale, ExtendedLinearScale, ExtendedOrdinalScale, FallbackOptions, KeyAccessor, KeySorter, LayerMetadata, MeasurableElement, Padding, PartialBreakpoint, ResponsivePropValue, ResponsivePropsConfig, ResponsivePropsInstance, SvgLayerMetadata, ValueSorter };
