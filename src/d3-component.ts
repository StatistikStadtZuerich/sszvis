import { type BaseType, selection as d3Selection, type Selection } from "d3";
import type { AnySelection } from "./types.js";

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
  <GElement extends BaseType, Datum, PElement extends BaseType, PDatum>(
    selection: Selection<GElement, Datum, PElement, PDatum>
  ): void;
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
export function component(): Component {
  const props: ComponentProps = {};
  let selectionRenderer: SelectionRenderCallback | null = null;
  let renderer: RenderCallback = identity;

  /**
   * Constructor
   *
   * @param  {d3.selection} selection Passed in by d3
   */
  function sszvisComponent(selection: AnySelection): void {
    if (selectionRenderer) {
      (selection as any).props = (): ComponentProps => clone(props);
      selectionRenderer.apply(selection, slice(arguments));
    }
    selection.each(function () {
      (this as any).__props__ = clone(props);
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
    (sszvisComponent as any)[prop] = accessor(props, prop, setter.bind(sszvisComponent)).bind(
      sszvisComponent
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
    (sszvisComponent as any)[prop] = (...args: any[]): any => {
      const result = delegate[prop].apply(delegate, slice(args));
      return args.length === 0 ? result : sszvisComponent;
    };
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

  return sszvisComponent as Component;
}

declare module "d3" {
  interface Selection<GElement extends BaseType, Datum, PElement extends BaseType, PDatum> {
    props(): ComponentProps;
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
  if ((this as any)._groups[0].length !== 1) throw new Error("only one node is supported");

  const group = (this as any)._groups[0];
  const node = group[0];
  return node.__props__ || {};
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
  return function (this: Component, ...args: any[]): any {
    if (args.length === 0) return props[prop];

    props[prop] = setter.apply(null, args);
    return this;
  };
}

function identity<T>(d: T): T {
  return d;
}

function slice(arrayLike: ArrayLike<any>): any[] {
  return Array.prototype.slice.call(arrayLike);
}

function clone(obj: ComponentProps): ComponentProps {
  const copy: ComponentProps = {};
  for (const attr in obj) {
    if (Object.hasOwn(obj, attr)) copy[attr] = obj[attr];
  }
  return copy;
}
