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
import { type Component } from "../d3-component.js";
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
export declare const groupedBarsVertical: <T = unknown>() => GroupedBarsComponent<T>;
export declare const groupedBarsHorizontal: <T = unknown>() => GroupedBarsComponent<T>;
export default groupedBarsVertical;
//# sourceMappingURL=groupedBars.d.ts.map