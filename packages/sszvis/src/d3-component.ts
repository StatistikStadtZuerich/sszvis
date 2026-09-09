import { type BaseType, selection as d3Selection, type Selection } from "d3";
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
export type ComponentCallable = <
  GElement extends BaseType,
  Datum,
  PElement extends BaseType,
  PDatum,
>(
  selection: Selection<GElement, Datum, PElement, PDatum>
) => void;

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
  // The escape hatch itself: this is what makes an unnamed component resolve any member.
  // A component that declares its own interface no longer inherits it.
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
export function component<C extends Component = Component>(): C {
  const props: ComponentProps = {};
  let selectionRenderer: SelectionRenderCallback | null = null;
  let renderer: RenderCallback = identity;

  /**
   * Constructor
   *
   * @param  {d3.selection} selection Passed in by d3
   */
  function sszvisComponent<G extends BaseType, D, P extends BaseType, PD>(
    selection: Selection<G, D, P, PD>
  ): void {
    if (selectionRenderer) {
      // Attach the props reader d3's Selection prototype is augmented with below.
      Reflect.set(selection, "props", (): ComponentProps => clone(props));
      selectionRenderer.apply(selection, slice(arguments));
    }
    selection.each(function () {
      // Stash the props on the node itself, where selection.props() reads them back.
      Reflect.set(this as object, "__props__", clone(props));
      renderer.apply(this, slice(arguments));
    });
  }

  /**
   * Define a property accessor with an optional setter
   *
   * @param  {String} prop The property's name
   * @param  {Function} [setter] The setter's context will be bound to the
   *         sszvis.component. Sets the returned value to the given property
   * @return {sszvis.component}
   */
  sszvisComponent.prop = <T>(prop: string, setter: PropertySetter<T> = identity): Component => {
    // The accessor is created from a runtime prop name, so it cannot be assigned through
    // a statically known key.
    Reflect.set(
      sszvisComponent,
      prop,
      accessor(props, prop, setter.bind(sszvisComponent)).bind(sszvisComponent)
    );
    return sszvisComponent as Component;
  };

  /**
   * Delegate a properties' accessors to a delegate object
   *
   * @param  {String} prop     The property's name
   * @param  {Object} delegate The target having getter and setter methods for prop
   * @return {sszvis.component}
   */
  sszvisComponent.delegate = (prop: string, delegate: PropertyDelegate): Component => {
    // Same as in prop(): a runtime prop name on both the component and the delegate.
    const delegated = (...args: $IntentionalAny[]): $IntentionalAny => {
      const target = Reflect.get(delegate, prop) as (...a: $IntentionalAny[]) => $IntentionalAny;
      const result = target.apply(delegate, slice(args));
      return args.length === 0 ? result : sszvisComponent;
    };
    Reflect.set(sszvisComponent, prop, delegated);
    return sszvisComponent as Component;
  };

  /**
   * Creates a render context for the given component's parent selection.
   * Use this, when you need full control over the rendering of the component
   * and you need access to the full selection instead of just the selection
   * of one datum.
   *
   * @param  {Function} callback
   * @return {[sszvis.component]}
   */
  sszvisComponent.renderSelection = (callback: SelectionRenderCallback): Component => {
    selectionRenderer = callback;
    return sszvisComponent as Component;
  };

  /**
   * Creates a render context for the given component. Implements the
   * d3.selection.each interface.
   *
   * @see https://github.com/mbostock/d3/wiki/Selections#each
   *
   * @param  {Function} callback
   * @return {sszvis.component}
   */
  sszvisComponent.render = (callback: RenderCallback): Component => {
    renderer = callback;
    return sszvisComponent as Component;
  };

  // The accessors declared by `.prop()` only exist once the component is built, so a
  // component interface which declares them can only be produced here, by naming it as C.
  return sszvisComponent as C;
}

declare module "d3" {
  // biome-ignore lint/correctness/noUnusedVariables: the type parameters must mirror d3's Selection signature for declaration merging to apply
  interface Selection<GElement extends BaseType, Datum, PElement extends BaseType, PDatum> {
    props<A>(): A extends ComponentProps ? A : ComponentProps;
  }
}

/**
 * d3.selection plugin to get the properties of a sszvis.component.
 * Works similarly to d3.selection.data, but for properties.
 *
 * @see https://github.com/mbostock/d3/wiki/Selections
 *
 * @return {Object} An object of properties for the given component
 */
d3Selection.prototype.props = function (): ComponentProps {
  // It would be possible to make this work exactly like
  // d3.selection.data(), but it would need some test cases,
  // so we currently simplify to the most common use-case:
  // getting props.
  if (arguments.length > 0) throw new Error("selection.props() does not accept any arguments");
  if (this.size() !== 1) throw new Error("only one group is supported");
  // _groups is d3's internal selection storage and is not part of its public types.
  const node = this.node();
  if (!node) throw new Error("only one node is supported");
  // The props were stashed on the node itself by the component that rendered it.
  return (Reflect.get(node as object, "__props__") as ComponentProps | undefined) || {};
};

/**
 * Creates an accessor function that either gets or sets a value, depending
 * on whether or not it is called with arguments.
 *
 * @param  {Object} props The props to get from or set to
 * @param  {String} attr The property to be accessed
 * @param  {Function} [setter] Transforms the data on set
 * @return {Function} The accessor function
 */
function accessor(props: ComponentProps, prop: string, setter: PropertySetter = identity) {
  // Getter when called with no arguments, setter otherwise - the two return different
  // things, and the prop's own declaration in the component interface states which.
  return function (this: Component, ...args: $IntentionalAny[]): $IntentionalAny {
    if (args.length === 0) return props[prop];

    props[prop] = setter.apply(null, args);
    return this;
  };
}

function identity<T>(d: T): T {
  return d;
}

function slice(arrayLike: ArrayLike<$IntentionalAny>): $IntentionalAny[] {
  return Array.prototype.slice.call(arrayLike);
}

function clone(obj: ComponentProps): ComponentProps {
  const copy: ComponentProps = {};
  for (const attr in obj) {
    if (Object.hasOwn(obj, attr)) copy[attr] = obj[attr];
  }
  return copy;
}
