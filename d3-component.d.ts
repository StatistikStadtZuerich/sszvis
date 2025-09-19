import { type BaseType, type Selection } from "d3";
export interface ComponentProps {
    [key: string]: any;
}
export type RenderCallback = (this: any, ...args: any[]) => void;
export type SelectionRenderCallback = (this: any, ...args: any[]) => void;
export type PropertySetter<T = any> = (...args: any[]) => T;
export interface PropertyDelegate {
    [key: string]: (...args: any[]) => any;
}
export interface Component {
    <GElement extends BaseType, Datum, PElement extends BaseType, PDatum>(selection: Selection<GElement, Datum, PElement, PDatum>): void;
    prop<T>(prop: string, setter?: PropertySetter<T>): Component;
    delegate(prop: string, delegate: PropertyDelegate): Component;
    renderSelection(callback: SelectionRenderCallback): Component;
    render(callback: RenderCallback): Component;
    [key: string]: any;
}
/**
 * d3 plugin to simplify creating reusable charts. Implements
 * the reusable chart interface and can thus be used interchangeably
 * with any other reusable charts.
 *
 * @example
 * var myAxis = sszvis.component()
 *   .prop('ticks').ticks(10)
 *   .render(function(data, i, j) {
 *     var selection = select(this);
 *     var props = selection.props();
 *     var axis = d3.svg.axis().ticks(props.ticks);
 *     selection
 *       .append('g')
 *       .call(axis);
 *   })
 * console.log(myAxis.ticks()); //=> 10
 * select('svg').call(myAxis.ticks(3));
 *
 * @see http://bost.ocks.org/mike/chart/
 *
 * @property {function} prop Define a property accessor
 * @property {function} render The chart's body
 *
 * @return {sszvis.component} A d3 reusable chart
 */
export declare function component(): Component;
declare module "d3" {
    interface Selection<GElement extends BaseType, Datum, PElement extends BaseType, PDatum> {
        props<A>(): A extends ComponentProps ? A : ComponentProps;
    }
}
//# sourceMappingURL=d3-component.d.ts.map