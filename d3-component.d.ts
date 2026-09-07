import { type BaseType, type Selection } from "d3";
import type { $IntentionalAny } from "./types.js";
/**
 * The props bag a component accumulates through `.prop()`. Its keys are only known at
 * runtime, from the calls the factory made, so the values cannot be typed here - each
 * component's own interface is what states them.
 */
export interface ComponentProps {
    [key: string]: $IntentionalAny;
}
/**
 * Render callbacks are invoked by d3 with `this` bound to the node or selection being
 * rendered, and receive whatever arguments d3 passes at that point. Components narrow both
 * at their own declaration site, e.g. `function (this: SVGGElement, data: Datum[])`.
 */
export type RenderCallback = (this: $IntentionalAny, ...args: $IntentionalAny[]) => void;
export type SelectionRenderCallback = (this: $IntentionalAny, ...args: $IntentionalAny[]) => void;
/** A prop setter receives whatever the component's own interface declares for that prop. */
export type PropertySetter<T = $IntentionalAny> = (...args: $IntentionalAny[]) => T;
/**
 * A delegate is any object exposing the delegated prop as a getter/setter method. Component
 * interfaces declare their props individually rather than through an index signature, so this
 * is deliberately structural rather than an indexed type.
 */
export type PropertyDelegate = object;
/** Anything built by `component()` is callable by a d3 selection. */
export type ComponentCallable = <GElement extends BaseType, Datum, PElement extends BaseType, PDatum>(selection: Selection<GElement, Datum, PElement, PDatum>) => void;
/**
 * The builder half of a component, parameterised by the interface being built.
 *
 * `component()` hands back whatever interface it is asked for, but the accessors declared
 * by `.prop()` only exist once the component is built. Declaring the four builder methods
 * as returning `C` is what keeps a construction chain typed as the component under
 * construction: without it the chain degrades to the first undeclared setter and the
 * declared interface is never checked against what was actually built.
 *
 * Every component interface should extend `ComponentBuilder<Self>`.
 *
 * `prop` and `delegate` take `keyof C`, so installing an accessor the interface does not
 * declare - a typo, or a prop someone forgot to add - is a compile error rather than a
 * member that silently resolves through the escape hatch.
 */
export interface ComponentBuilder<C> extends ComponentCallable {
    prop<T>(prop: keyof C & string, setter?: PropertySetter<T>): C;
    delegate(prop: keyof C & string, delegate: PropertyDelegate): C;
    renderSelection(callback: SelectionRenderCallback): C;
    render(callback: RenderCallback): C;
}
/**
 * An untyped component. The index signature makes any member resolve, so prefer a
 * specific interface extending `ComponentBuilder<Self>` over this.
 */
export interface Component extends ComponentBuilder<Component> {
    [key: string]: $IntentionalAny;
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
export declare function component<C extends Component = Component>(): C;
declare module "d3" {
    interface Selection<GElement extends BaseType, Datum, PElement extends BaseType, PDatum> {
        props<A>(): A extends ComponentProps ? A : ComponentProps;
    }
}
//# sourceMappingURL=d3-component.d.ts.map