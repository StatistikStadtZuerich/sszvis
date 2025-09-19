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
import { type Component } from "../d3-component";
import type { NumberAccessor } from "../types";
type Datum<T = unknown> = T;
interface RangeFlagComponent<T = unknown> extends Component {
    x(accessor?: NumberAccessor<Datum<T>>): RangeFlagComponent<T>;
    y0(accessor?: NumberAccessor<Datum<T>>): RangeFlagComponent<T>;
    y1(accessor?: NumberAccessor<Datum<T>>): RangeFlagComponent<T>;
}
export default function <T = unknown>(): RangeFlagComponent<T>;
export {};
//# sourceMappingURL=rangeFlag.d.ts.map