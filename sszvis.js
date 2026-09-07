/*! sszvis v3.4.0, Copyright 2014-present Statistik Stadt Zürich */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('d3')) :
    typeof define === 'function' && define.amd ? define(['exports', 'd3'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.sszvis = {}, global.d3));
})(this, (function (exports, d3) { 'use strict';

    d3.selection.prototype.selectDiv = function (key) {
      return this.selectAll("[data-d3-selectdiv=\"".concat(key, "\"]")).data(d => [d]).join("div").attr("data-d3-selectdiv", key).style("position", "absolute");
    };

    d3.selection.prototype.selectGroup = function (key) {
      return this.selectAll("[data-d3-selectgroup=\"".concat(key, "\"]")).data(d => [d]).join("g").attr("data-d3-selectgroup", key);
    };

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
    function component() {
      const props = {};
      let selectionRenderer = null;
      let renderer = identity$1;
      /**
       * Constructor
       *
       * @param  {d3.selection} selection Passed in by d3
       */
      function sszvisComponent(selection) {
        if (selectionRenderer) {
          // Attach the props reader d3's Selection prototype is augmented with below.
          Reflect.set(selection, "props", () => clone(props));
          selectionRenderer.apply(selection, slice(arguments));
        }
        selection.each(function () {
          // Stash the props on the node itself, where selection.props() reads them back.
          Reflect.set(this, "__props__", clone(props));
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
      sszvisComponent.prop = function (prop) {
        let setter = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : identity$1;
        // The accessor is created from a runtime prop name, so it cannot be assigned through
        // a statically known key.
        Reflect.set(sszvisComponent, prop, accessor(props, prop, setter.bind(sszvisComponent)).bind(sszvisComponent));
        return sszvisComponent;
      };
      /**
       * Delegate a properties' accessors to a delegate object
       *
       * @param  {String} prop     The property's name
       * @param  {Object} delegate The target having getter and setter methods for prop
       * @return {sszvis.component}
       */
      sszvisComponent.delegate = (prop, delegate) => {
        // Same as in prop(): a runtime prop name on both the component and the delegate.
        const delegated = function () {
          const target = Reflect.get(delegate, prop);
          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }
          const result = target.apply(delegate, slice(args));
          return args.length === 0 ? result : sszvisComponent;
        };
        Reflect.set(sszvisComponent, prop, delegated);
        return sszvisComponent;
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
      sszvisComponent.renderSelection = callback => {
        selectionRenderer = callback;
        return sszvisComponent;
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
      sszvisComponent.render = callback => {
        renderer = callback;
        return sszvisComponent;
      };
      // The accessors declared by `.prop()` only exist once the component is built, so a
      // component interface which declares them can only be produced here, by naming it as C.
      return sszvisComponent;
    }
    /**
     * d3.selection plugin to get the properties of a sszvis.component.
     * Works similarly to d3.selection.data, but for properties.
     *
     * @see https://github.com/mbostock/d3/wiki/Selections
     *
     * @return {Object} An object of properties for the given component
     */
    d3.selection.prototype.props = function () {
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
      return Reflect.get(node, "__props__") || {};
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
    function accessor(props, prop) {
      let setter = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : identity$1;
      // Getter when called with no arguments, setter otherwise - the two return different
      // things, and the prop's own declaration in the component interface states which.
      return function () {
        for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
          args[_key2] = arguments[_key2];
        }
        if (args.length === 0) return props[prop];
        props[prop] = setter.apply(null, args);
        return this;
      };
    }
    function identity$1(d) {
      return d;
    }
    function slice(arrayLike) {
      return Array.prototype.slice.call(arrayLike);
    }
    function clone(obj) {
      const copy = {};
      for (const attr in obj) {
        if (Object.hasOwn(obj, attr)) copy[attr] = obj[attr];
      }
      return copy;
    }

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
    const identity = value => value;
    /**
     * fn.isString
     *
     * determine whether the value is a string
     */
    const isString = val => Object.prototype.toString.call(val) === "[object String]";
    /**
     * fn.isSelection
     *
     * determine whether the value is a d3.selection.
     */
    const isSelection = val => val instanceof d3.selection;
    /**
     * fn.arity
     *
     * Wraps a function of any arity (including nullary) in a function that
     * accepts exactly `n` parameters. Any extraneous parameters will not be
     * passed to the supplied function.
     */
    const arity = (n, fn) => {
      // arity exists to call `fn` with an argument list its own signature does not describe:
      // extra arguments are dropped and missing ones padded with undefined. No type can say
      // "callable with a different number of arguments than it declares", so the widened
      // callable is asserted once here and every use below goes through it.
      const callWithAnyArgs = fn;
      // NOTE: the original hand-unrolled a switch over 0..10 and returned the function
      // untouched for anything else, so n > 10, negative and non-integer n do no limiting at
      // all. That passthrough is preserved here, quirk and all.
      if (!Number.isInteger(n) || n < 0 || n > 10) return callWithAnyArgs;
      const limited = function () {
        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }
        // Build exactly n slots, so the wrapped function sees arguments.length === n whether
        // the caller passed too many or too few.
        const slots = Array.from({
          length: n
        }, (_, i) => args[i]);
        return callWithAnyArgs.apply(this, slots);
      };
      // The unrolled version gave each case real named parameters, so .length was n.
      Object.defineProperty(limited, "length", {
        value: n,
        configurable: true
      });
      return limited;
    };
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
    // The chain's intermediate types depend on how many functions were passed and cannot be
    // related to one another without a fixed-arity overload per length.
    const compose = function () {
      for (var _len2 = arguments.length, fns = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        fns[_key2] = arguments[_key2];
      }
      const start = fns.length - 1;
      return function () {
        let i = start;
        for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
          args[_key3] = arguments[_key3];
        }
        let result = Reflect.apply(fns[i], this, args);
        while (i--) result = fns[i].call(this, result);
        return result;
      };
    };
    /**
     * fn.contains
     *
     * Checks whether an item is present in the given list (by strict equality).
     */
    const contains$1 = (list, d) => list.includes(d);
    /**
     * fn.defined
     *
     * determines if the passed value is defined.
     */
    const defined = val => val !== undefined && val != null && !Number.isNaN(val);
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
    const derivedSet = (arr, acc) => {
      const accessor = acc || identity;
      const seen = [];
      const result = [];
      let sValue, cValue;
      for (let i = 0, l = arr.length; i < l; ++i) {
        sValue = arr[i];
        cValue = accessor(sValue, i, arr);
        if (!seen.includes(cValue)) {
          seen.push(cValue);
          result.push(sValue);
        }
      }
      return result;
    };
    /**
     * fn.every
     *
     * Use a predicate function to test if every element in an array passes some test.
     * Returns false as soon as an element fails the predicate test. Returns true otherwise.
     */
    const every = (predicate, arr) => {
      for (const element of arr) {
        if (!predicate(element)) {
          return false;
        }
      }
      return true;
    };
    /**
     * fn.filledArray
     *
     * returns a new array with length `len` filled with `val`
     */
    const filledArray = (len, val) => {
      const arr = Array.from({
        length: len
      });
      for (let i = 0; i < len; ++i) {
        arr[i] = val;
      }
      return arr;
    };
    /**
     * fn.find
     *
     * Finds the first occurrence of an element in an array that passes the predicate function
     */
    const find = (predicate, arr) => {
      for (const element of arr) {
        if (predicate(element)) {
          return element;
        }
      }
      return undefined;
    };
    /**
     * fn.first
     *
     * Returns the first value in the passed array, or undefined if the array is empty
     */
    const first = arr => arr[0];
    /**
     * fn.flatten
     *
     * Flattens the nested input array by one level. The input array is expected to be
     * a two-dimensional array (i.e. its elements are also arrays). The result is a
     * one-dimensional array consisting of all the elements of the sub-arrays.
     */
    const flatten = arr => arr.flat();
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
    const firstTouch = event => {
      if (event.touches && event.touches.length > 0) {
        return event.touches[0];
      } else if (event.changedTouches && event.changedTouches.length > 0) {
        return event.changedTouches[0];
      }
      return null;
    };
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
    const foldPattern = (key, pattern) => {
      const result = pattern[key];
      if (typeof result === "function") {
        return result();
      }
      throw new Error("[foldPattern] No definition provided for key: ".concat(key));
    };
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
    const hashableSet = (arr, acc) => {
      const accessor = acc || identity;
      // A Set, not a plain object: an object inherits Object.prototype, so values naming one
      // of its members ("constructor", "toString", ...) read back as already seen and were
      // dropped from the result. Keys stay stringified, which is what "hashable" means here
      // and why 1 and "1" are still one key.
      const seen = new Set();
      const result = [];
      for (let i = 0, l = arr.length; i < l; ++i) {
        const value = accessor(arr[i], i, arr);
        const key = String(value);
        if (!seen.has(key)) {
          seen.add(key);
          result.push(value);
        }
      }
      return result;
    };
    /**
     * fn.isFunction
     *
     * Determines if the passed value is a function
     */
    // The guard has to widen to a callable the caller can actually invoke; narrowing the
    // parameters to `never[]` would make every call site an error.
    const isFunction$1 = val => typeof val === "function";
    /**
     * fn.isNull
     *
     * determines if the passed value is null.
     */
    const isNull = val => val === null;
    /**
     * fn.isNumber
     *
     * determine whether the value is a number
     */
    const isNumber = val => Object.prototype.toString.call(val) === "[object Number]" && !Number.isNaN(val);
    /**
     * fn.isObject
     *
     * determines if the passed value is of an "object" type, or if it is something else,
     * e.g. a raw number, string, null, undefined, NaN, something like that.
     */
    const isObject = val => Object(val) === val;
    /**
     * fn.last
     *
     * Returns the last value in the passed array, or undefined if the array is empty
     */
    const last = arr => arr[arr.length - 1];
    /**
     * fn.not
     *
     * Takes as argument a function f and returns a new function
     * which calls f on its arguments and returns the
     * boolean opposite of f's return value.
     */
    const not = f => function () {
      for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
        args[_key4] = arguments[_key4];
      }
      return !Reflect.apply(f, this, args);
    };
    /**
     * fn.prop
     *
     * takes the name of a property and returns a property accessor function
     * for the named property. When the accessor function is called on an object,
     * it returns that object's value for the named property. (or undefined, if the object
     * does not contain the property.)
     */
    const prop = key => object => object[key];
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
    const propOr = (key, defaultVal) => object => {
      const value = object === undefined ? undefined : object[key];
      return value === undefined ? defaultVal : value;
    };
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
    const set$1 = (arr, acc) => {
      const accessor = acc || identity;
      const result = [];
      for (const [i, value] of arr.entries()) {
        const computed = accessor(value, i, arr);
        if (!result.includes(computed)) result.push(computed);
      }
      return result;
    };
    /**
     * fn.some
     *
     * Test an array with a predicate and determine whether some element in the array passes the test.
     * Returns true as soon as an element passes the test. Returns false otherwise.
     */
    const some = (predicate, arr) => {
      for (const element of arr) {
        if (predicate(element)) {
          return true;
        }
      }
      return false;
    };
    /**
     * fn.stringEqual
     *
     * Determines whether two values are equal when converted to strings. Useful for comparing
     * date objects, because two different date objects are not considered equal, even if they
     * represent the same date.
     */
    const stringEqual = (a, b) => a.toString() === b.toString();
    /**
     * fn.functor
     *
     * Same as fn.functor in d3v3
     */
    const functor = v => typeof v === "function" ? v : () => v;
    /**
     * Applies `render` to whichever selection `selector` denotes.
     *
     * Each branch keeps its own concrete selection type rather than being widened into a shared
     * variable first: d3's select() has one overload for a selector string and another for a
     * node, and Selection is invariant in all four of its type parameters, so no single type -
     * and no union - holds all three cases. `render` is generic, so each branch infers.
     */
    function withRootSelection(selector, render) {
      if (typeof selector === "string") return render(d3.select(selector));
      if (selector instanceof Element) return render(d3.select(selector));
      return render(selector);
    }
    /**
     * fn.valueFn
     *
     * Wraps a constant in an accessor and leaves an existing accessor alone. Unlike fn.functor
     * the result takes d3's (datum, index, group) arguments and can be handed straight to
     * .attr() or .style(). An unset prop resolves to undefined, which d3 treats the same as
     * null - it removes the attribute either way - so `value ?? null` at a call site is about
     * the declared return type, not about what d3 renders.
     */
    const valueFn = value => typeof value === "function" ? value : () => value;
    /**
     * fn.memoize
     *
     * Adapted from lodash's memoize(), using a Map as the cache and exposing it as `.cache`.
     * See https://lodash.com/docs/4.17.4#memoize
     *
     * Differs from lodash deliberately: lodash keys on the first argument and silently returns
     * that entry for any later arguments, so memoizing a function of several arguments without
     * a resolver returns wrong results. Here such a call throws instead - pass a resolver that
     * derives a key from every argument that matters (see swissMapProjection in map/mapUtils).
     */
    const memoize = (func, resolver
    // The cache key is whatever the resolver returned, or - with no resolver - the first
    // argument itself, which may be any value including an object compared by identity.
    ) => {
      if (typeof func !== "function" || resolver != null && typeof resolver !== "function") {
        throw new TypeError("Expected a function");
      }
      const memoized = function () {
        if (!resolver && arguments.length > 1) {
          throw new TypeError("[fn.memoize] A function called with more than one argument needs a resolver: the " + "default cache key is the first argument alone, so differing later arguments would " + "return the first call's result.");
        }
        const key = resolver ? resolver(...arguments) : arguments.length <= 0 ? undefined : arguments[0];
        const cache = memoized.cache;
        if (cache.has(key)) {
          return cache.get(key);
        }
        const result = func(...arguments);
        memoized.cache = cache.set(key, result) || cache;
        return result;
      };
      memoized.cache = new Map();
      return memoized;
    };

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
    // ============================================================================
    // Utility Functions
    // ============================================================================
    /**
     * Helper to create breadcrumb items from a hierarchy node.
     * Extracts the ancestor path and converts to breadcrumb items.
     *
     * @example
     * const items = createBreadcrumbItems(focusedNode);
     * // Returns: [{ label: "Category", node: ... }, { label: "Subcategory", node: ... }]
     */
    function createBreadcrumbItems(node) {
      if (!node) return [];
      // Get ancestors from root to current node, excluding the synthetic root
      return node.ancestors().reverse().slice(1) // Remove synthetic root node
      .map(n => ({
        label: n.data._tag === "leaf" || n.data._tag === "branch" ? n.data.key : "",
        node: n
      }));
    }
    // ============================================================================
    // Component Implementation
    // ============================================================================
    function breadcrumb () {
      return component().prop("renderInto").prop("items").items([]).prop("label", functor).label(d => d.label).prop("onClick").onClick(() => {}).prop("rootLabel").rootLabel("Root").prop("separator").separator(" \u203A ").prop("width").width(800).renderSelection(selection => {
        const props = selection.props();
        // Prepend root item to the breadcrumb trail
        const allItems = [{
          label: props.rootLabel,
          node: null
        }, ...props.items];
        // Create or select breadcrumb container
        const breadcrumbContainer = props.renderInto.selectDiv("breadcrumbs").style("position", "absolute").style("top", "-40px").style("left", "0px").style("width", "".concat(props.width, "px")).style("height", "30px").style("display", "flex").style("align-items", "center").style("gap", "8px").style("font-family", '"Helvetica Neue", Helvetica, Arial, sans-serif').style("font-size", "14px");
        // Data join for breadcrumb items
        const crumbs = breadcrumbContainer.selectAll("span.sszvis-breadcrumb-item").data(allItems, d => props.label(d));
        // Enter: create new breadcrumb elements
        const crumbsEnter = crumbs.enter().append("span").classed("sszvis-breadcrumb-item", true);
        // Add link element
        crumbsEnter.append("a").style("color", "#0073B3").style("cursor", "pointer").style("text-decoration", "none");
        // Add separator
        crumbsEnter.append("span").classed("sszvis-breadcrumb-separator", true).style("color", "#666").text(props.separator);
        // Update: merge enter + update selections
        const crumbsMerged = crumbsEnter.merge(crumbs);
        // Update link text and styling
        crumbsMerged.select("a").text(d => props.label(d)).style("font-weight", (_d, i) => i === allItems.length - 1 ? "bold" : "normal").style("color", (_d, i) => i === allItems.length - 1 ? "#333" : "#0073B3").style("cursor", (_d, i) => i === allItems.length - 1 ? "default" : "pointer").on("click", (event, d) => {
          const index = allItems.indexOf(d);
          // Don't allow clicking on the current (last) breadcrumb
          if (index === allItems.length - 1) return;
          event.preventDefault();
          props.onClick(d, index);
        });
        // Hide separator on last item
        crumbsMerged.select(".sszvis-breadcrumb-separator").style("display", (_d, i) => i === allItems.length - 1 ? "none" : "inline");
        // Exit: remove old breadcrumbs
        crumbs.exit().remove();
      });
    }

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
    const heatTableMissingValuePattern = selection => {
      const rectFill = "#FAFAFA",
        // Light grey color directly
        crossStroke = "#A4A4A4",
        crossStrokeWidth = 0.035,
        cross1 = 0.35,
        cross2 = 0.65;
      selection.attr("patternUnits", "objectBoundingBox").attr("patternContentUnits", "objectBoundingBox").attr("x", 0).attr("y", 0).attr("width", 1).attr("height", 1);
      selection.append("rect").attr("x", 0).attr("y", 0).attr("width", 1).attr("height", 1).attr("fill", rectFill);
      selection.append("line").attr("x1", cross1).attr("y1", cross1).attr("x2", cross2).attr("y2", cross2).attr("stroke-width", crossStrokeWidth).attr("stroke", crossStroke);
      selection.append("line").attr("x1", cross2).attr("y1", cross1).attr("x2", cross1).attr("y2", cross2).attr("stroke-width", crossStrokeWidth).attr("stroke", crossStroke);
    };
    /**
     * The pattern for the map areas which are missing values
     * @param selection A d3 selection of SVG pattern elements
     */
    const mapMissingValuePattern = selection => {
      const pWidth = 14,
        pHeight = 14,
        fillColor = "#FAFAFA",
        lineStroke = "#CCCCCC";
      selection.attr("patternUnits", "userSpaceOnUse").attr("patternContentUnits", "userSpaceOnUse").attr("x", 0).attr("y", 0).attr("width", pWidth).attr("height", pHeight);
      selection.append("rect").attr("x", 0).attr("y", 0).attr("width", pWidth).attr("height", pHeight).attr("fill", fillColor);
      selection.append("line").attr("x1", 1).attr("y1", 10).attr("x2", 5).attr("y2", 14).attr("stroke", lineStroke);
      selection.append("line").attr("x1", 5).attr("y1", 10).attr("x2", 1).attr("y2", 14).attr("stroke", lineStroke);
      selection.append("line").attr("x1", 8).attr("y1", 3).attr("x2", 12).attr("y2", 7).attr("stroke", lineStroke);
      selection.append("line").attr("x1", 12).attr("y1", 3).attr("x2", 8).attr("y2", 7).attr("stroke", lineStroke);
    };
    /**
     * The pattern for Lake Zurich in the map component
     * @param selection A d3 selection of SVG pattern elements
     */
    const mapLakePattern = selection => {
      const pWidth = 6;
      const pHeight = 6;
      const offset = 0.5;
      selection.attr("patternUnits", "userSpaceOnUse").attr("patternContentUnits", "userSpaceOnUse").attr("x", 0).attr("y", 0).attr("width", pWidth).attr("height", pHeight);
      selection.append("rect").attr("x", 0).attr("y", 0).attr("width", pWidth).attr("height", pHeight).attr("fill", "#fff");
      selection.append("line").attr("x1", 0).attr("y1", pHeight * offset).attr("x2", pWidth * offset).attr("y2", 0).attr("stroke", "#ddd").attr("stroke-linecap", "square");
      selection.append("line").attr("x1", pWidth * offset).attr("y1", pHeight).attr("x2", pWidth).attr("y2", pHeight * offset).attr("stroke", "#ddd").attr("stroke-linecap", "square");
    };
    /**
     * The gradient used by the alpha fade pattern in the Lake Zurich shape
     * @param selection A d3 selection of SVG linear gradient elements
     */
    const mapLakeFadeGradient = selection => {
      selection.attr("x1", 0).attr("y1", 0).attr("x2", 0.55).attr("y2", 1).attr("id", "lake-fade-gradient");
      selection.append("stop").attr("offset", 0.74).attr("stop-color", "white").attr("stop-opacity", 1);
      selection.append("stop").attr("offset", 0.97).attr("stop-color", "white").attr("stop-opacity", 0);
    };
    /**
     * The gradient alpha fade mask for the Lake Zurich shape
     * @param selection A d3 selection of SVG mask elements
     */
    const mapLakeGradientMask = selection => {
      selection.attr("maskContentUnits", "objectBoundingBox");
      selection.append("rect").attr("fill", "url(#lake-fade-gradient)").attr("width", 1).attr("height", 1);
    };
    /**
     * The pattern for the data area texture
     * @param selection A d3 selection of SVG pattern elements
     */
    const dataAreaPattern = selection => {
      const pWidth = 6;
      const pHeight = 6;
      const offset = 0.5;
      selection.attr("patternUnits", "userSpaceOnUse").attr("patternContentUnits", "userSpaceOnUse").attr("x", 0).attr("y", 0).attr("width", pWidth).attr("height", pHeight);
      selection.append("line").attr("x1", 0).attr("y1", pHeight * offset).attr("x2", pWidth * offset).attr("y2", 0).attr("stroke", "#e6e6e6").attr("stroke-width", 1.1);
      selection.append("line").attr("x1", pWidth * offset).attr("y1", pHeight).attr("x2", pWidth).attr("y2", pHeight * offset).attr("stroke", "#e6e6e6").attr("stroke-width", 1.1);
    };

    /**
     * Ensure Defs Element
     *
     * This method ensures that the provided selection contains a 'defs' object,
     * and furthermore, that the defs object contains an instance of the provided
     * element type, with the provided ID.
     *
     * @module sszvis/svgUtils/ensureDefsElement
     *
     * @param selection  The selection to ensure the defs element within
     * @param type       Element to create, as an SVG tag name
     * @param elementId  The ID to assign to the created element
     *
     * The element type is derived from the tag name, so callers get a precisely typed selection
     * without naming it twice:
     *
     *     ensureDefsElement(sel, "pattern", id)  // Selection<SVGPatternElement, ...>
     *
     * The selection parameters are generic because d3's Selection is invariant in its element
     * parameters - no single non-generic type accepts every selection.
     */
    function ensureDefsElement(selection, type, elementId) {
      return ensureDefsSelection(selection).selectAll("".concat(type, "#").concat(elementId)).data([0])
      // join() reports the union of the elements it entered and those selectAll found.
      // Naming the entered element here makes both sides the same tag, so the union
      // collapses on its own and no assertion is needed.
      .join(type).attr("id", elementId);
    }
    /* Helper functions
    ----------------------------------------------- */
    /**
     * This method ensures that the provided selection contains a 'defs' object,
     * which is required for rendering patterns. SVG elements rendered into a defs
     * container will not be displayed, but can be referenced by ID in the fill property
     * of other, visible, elements.
     */
    function ensureDefsSelection(selection) {
      return selection.selectAll("defs").data([0]).join("defs");
    }

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
    function circle () {
      return component().prop("x", functor).prop("y", functor).prop("r", functor).prop("dx", functor).prop("dy", functor).prop("caption", functor).render(function (data) {
        const selection = d3.select(this);
        const props = selection.props();
        const patternSelection = ensureDefsElement(selection, "pattern", "data-area-pattern");
        dataAreaPattern(patternSelection);
        const dataArea = selection.selectAll(".sszvis-dataareacircle").data(data).join("circle").classed("sszvis-dataareacircle", true);
        dataArea.attr("cx", d => Number(props.x(d))).attr("cy", d => Number(props.y(d))).attr("r", d => Number(props.r(d))).attr("fill", "url(#data-area-pattern)");
        if (props.caption) {
          const dataCaptions = selection.selectAll(".sszvis-dataareacircle__caption").data(data).join("text").classed("sszvis-dataareacircle__caption", true);
          dataCaptions.attr("x", d => Number(props.x(d))).attr("y", d => Number(props.y(d))).attr("dx", props.dx ? d => {
            var _props$dx;
            return Number((_props$dx = props.dx) === null || _props$dx === void 0 ? void 0 : _props$dx.call(props, d));
          } : null).attr("dy", props.dy ? d => {
            var _props$dy;
            return Number((_props$dy = props.dy) === null || _props$dy === void 0 ? void 0 : _props$dy.call(props, d));
          } : null).text(props.caption ? d => {
            var _props$caption;
            return ((_props$caption = props.caption) === null || _props$caption === void 0 ? void 0 : _props$caption.call(props, d)) || "";
          } : null);
        }
      });
    }

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
    const defaultEase = d3.easePolyOut;
    /**
     * Creates a default transition with standard easing and duration
     * @returns A d3 transition with 300ms duration and polynomial ease-out
     */
    const defaultTransition = () => d3.transition().ease(defaultEase).duration(300);
    /**
     * Creates a fast transition for quick animations
     * @returns A d3 transition with 50ms duration and polynomial ease-out
     */
    const fastTransition = () => d3.transition().ease(defaultEase).duration(50);
    /**
     * Creates a slow transition for gradual animations
     * @returns A d3 transition with 500ms duration and polynomial ease-out
     */
    const slowTransition = () => d3.transition().ease(defaultEase).duration(500);

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
    function confidenceArea () {
      return component().prop("x", functor).prop("y0", functor).prop("y1", functor).prop("stroke").prop("strokeWidth").prop("fill").prop("key").key((_, i) => i).prop("valuesAccessor").valuesAccessor(identity).prop("transition").transition(true).render(function (data) {
        const selection = d3.select(this);
        const props = selection.props();
        const patternSelection = ensureDefsElement(selection, "pattern", "data-area-pattern");
        dataAreaPattern(patternSelection);
        // Layouts
        const area = d3.area().x(d => Number(props.x(d))).y0(d => Number(props.y0(d))).y1(d => Number(props.y1(d)));
        // Rendering
        const path = selection.selectAll(".sszvis-area").data(data).join("path").classed("sszvis-area", true);
        if (props.stroke) {
          path.style("stroke", props.stroke);
        }
        path.attr("fill", "url(#data-area-pattern)").order();
        const finalPath = props.transition ? path.transition().call(defaultTransition) : path;
        finalPath.attr("d", d => area(props.valuesAccessor(d)));
        if (props.stroke) {
          finalPath.style("stroke", props.stroke);
        }
        if (props.strokeWidth) {
          finalPath.style("stroke-width", props.strokeWidth);
        }
        finalPath.attr("fill", "url(#data-area-pattern)");
      });
    }

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
    function confidenceBar () {
      return component().prop("x", functor).prop("y", functor).prop("confidenceLow", functor).prop("confidenceHigh", functor).prop("width").prop("groupSize").prop("groupWidth").prop("groupSpace").groupSpace(0.05).prop("groupScale", functor).render(function (data) {
        const selection = d3.select(this);
        const props = selection.props();
        const inGroupScale = d3.scaleBand().domain(d3.range(props.groupSize).map(String)).rangeRound([0, props.groupWidth]).paddingInner(props.groupSpace).paddingOuter(0);
        const groups = selection.selectAll("g.sszvis-confidence-bargroup").data(data).join("g").classed("sszvis-confidence-bargroup", true);
        const barUnits = groups.selectAll("g.sszvis-confidence-barunit").data(d => d).join("g").classed("sszvis-confidence-barunit", true);
        barUnits.each((d, i) => {
          // necessary for the within-group scale
          d.__sszvisGroupedBarConfidenceIndex__ = i;
        });
        const unitsWithValue = barUnits.filter(() => {
          return true;
        });
        unitsWithValue.selectAll("*").remove();
        // Vertical lines connecting confidence bounds
        unitsWithValue.append("line").classed("sszvis-confidence-bar", true).attr("x1", d => {
          var _d$__sszvisGroupedBar;
          // first term is the x-position of the group, the second term is the x-position of the bar within the group
          const index = (_d$__sszvisGroupedBar = d.__sszvisGroupedBarConfidenceIndex__) !== null && _d$__sszvisGroupedBar !== void 0 ? _d$__sszvisGroupedBar : 0;
          return props.groupScale(d) + (inGroupScale(String(index)) || 0) + inGroupScale.bandwidth() / 2;
        }).attr("y1", d => {
          return Number(props.confidenceHigh(d));
        }).attr("x2", d => {
          var _d$__sszvisGroupedBar2;
          // first term is the x-position of the group, the second term is the x-position of the bar within the group
          const index = (_d$__sszvisGroupedBar2 = d.__sszvisGroupedBarConfidenceIndex__) !== null && _d$__sszvisGroupedBar2 !== void 0 ? _d$__sszvisGroupedBar2 : 0;
          return props.groupScale(d) + (inGroupScale(String(index)) || 0) + inGroupScale.bandwidth() / 2;
        }).attr("y2", d => {
          return Number(props.confidenceLow(d));
        }).attr("stroke", "#767676").attr("stroke-width", "1");
        // Horizontal top caps
        unitsWithValue.append("line").classed("sszvis-confidence-bar", true).attr("x1", d => {
          var _d$__sszvisGroupedBar3;
          // first term is the x-position of the group, the second term is the x-position of the bar within the group
          const index = (_d$__sszvisGroupedBar3 = d.__sszvisGroupedBarConfidenceIndex__) !== null && _d$__sszvisGroupedBar3 !== void 0 ? _d$__sszvisGroupedBar3 : 0;
          return props.groupScale(d) + (inGroupScale(String(index)) || 0) + inGroupScale.bandwidth() / 2 - props.width / 2;
        }).attr("y1", d => {
          return Number(props.confidenceHigh(d));
        }).attr("x2", d => {
          var _d$__sszvisGroupedBar4;
          // first term is the x-position of the group, the second term is the x-position of the bar within the group
          const index = (_d$__sszvisGroupedBar4 = d.__sszvisGroupedBarConfidenceIndex__) !== null && _d$__sszvisGroupedBar4 !== void 0 ? _d$__sszvisGroupedBar4 : 0;
          return props.groupScale(d) + (inGroupScale(String(index)) || 0) + inGroupScale.bandwidth() / 2 + props.width / 2;
        }).attr("y2", d => {
          return Number(props.confidenceHigh(d));
        }).attr("stroke", "#767676").attr("stroke-width", "1");
        // Horizontal bottom caps
        unitsWithValue.append("line").classed("sszvis-confidence-bar", true).attr("x1", d => {
          var _d$__sszvisGroupedBar5;
          // first term is the x-position of the group, the second term is the x-position of the bar within the group
          const index = (_d$__sszvisGroupedBar5 = d.__sszvisGroupedBarConfidenceIndex__) !== null && _d$__sszvisGroupedBar5 !== void 0 ? _d$__sszvisGroupedBar5 : 0;
          return props.groupScale(d) + (inGroupScale(String(index)) || 0) + inGroupScale.bandwidth() / 2 - props.width / 2;
        }).attr("y1", d => {
          return Number(props.confidenceLow(d));
        }).attr("x2", d => {
          var _d$__sszvisGroupedBar6;
          // first term is the x-position of the group, the second term is the x-position of the bar within the group
          const index = (_d$__sszvisGroupedBar6 = d.__sszvisGroupedBarConfidenceIndex__) !== null && _d$__sszvisGroupedBar6 !== void 0 ? _d$__sszvisGroupedBar6 : 0;
          return props.groupScale(d) + (inGroupScale(String(index)) || 0) + inGroupScale.bandwidth() / 2 + props.width / 2;
        }).attr("y2", d => {
          return Number(props.confidenceLow(d));
        }).attr("stroke", "#767676").attr("stroke-width", "1");
      });
    }

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
    function fitTooltip (defaultVal, bounds) {
      const lo = Math.min(bounds.innerWidth * 1 / 4, 100);
      const hi = Math.max(bounds.innerWidth * 3 / 4, bounds.innerWidth - 100);
      return d => {
        const x = d.x;
        return x > hi ? "right" : x < lo ? "left" : defaultVal;
      };
    }

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
    function line$1 () {
      return component().prop("x1").prop("x2").prop("y1").prop("y2").prop("xScale").prop("yScale").prop("dx", functor).dx(0).prop("dy", functor).dy(0).prop("caption", functor).render(function (data) {
        const selection = d3.select(this);
        const props = selection.props();
        const x1 = props.xScale(props.x1) || 0;
        const y1 = props.yScale(props.y1) || 0;
        const x2 = props.xScale(props.x2) || 0;
        const y2 = props.yScale(props.y2) || 0;
        const line = selection.selectAll(".sszvis-referenceline").data(data).join("line").classed("sszvis-referenceline", true);
        line.attr("x1", x1).attr("y1", y1).attr("x2", x2).attr("y2", y2);
        if (props.caption) {
          const caption = selection.selectAll(".sszvis-referenceline__caption").data([0]).join("text").classed("sszvis-referenceline__caption", true);
          caption.attr("transform", () => {
            const vx = x2 - x1;
            const vy = y2 - y1;
            const angle = Math.atan2(vy, vx) * 180 / Math.PI;
            return "translate(".concat((x1 + x2) / 2, ",").concat((y1 + y2) / 2, ") rotate(").concat(angle, ")");
          }).attr("dx", props.dx ? Number(props.dx(data[0])) : null).attr("dy", props.dy ? Number(props.dy(data[0])) : null).text(props.caption ? props.caption(data[0]) : null);
        }
      });
    }

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
    const halfPixel = pos => Math.floor(pos) + 0.5;
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
     * (rotate, scale, …) are passed through untouched. A translate carrying more
     * than two components is not valid SVG; every component is floored and
     * re-emitted, which is undefined-input behaviour rather than a guarantee.
     *
     * Negative coordinates and coordinates padded with spaces are handled.
     *
     * @param  {string} transformStr A valid SVG transform string
     * @return {string}              An SVG transform string with rounded values
     */
    const roundTransformString = transformStr => {
      const roundNumber = compose(Math.floor, Number);
      return transformStr.replace(/(translate\()\s*([\d ,.-]+?)\s*(\))/i, (_, left, vecStr, right) => {
        const roundVec = vecStr.split(/[\s,]+/).map(roundNumber).join(",");
        return "".concat(left).concat(roundVec).concat(right);
      });
    };
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
     * A translate carrying only an x component yields a y shift of 0. A transform
     * with no translate instruction, including the empty string, reports [0, 0].
     *
     * @param  {string} transformStr A valid SVG transform string containing a
     *                               translate instruction
     * @return {vector}              Two-element array ([dx, dy])
     */
    const transformTranslateSubpixelShift = transformStr => {
      const roundNumber = compose(Math.floor, Number);
      const m = transformStr.match(/(translate\()\s*([\d ,.-]+?)\s*(\))/i);
      if (!m) return [0, 0];
      const vec = m[2].split(/[\s,]+/).map(Number);
      if (vec.length === 1) vec.push(0);
      const vecRound = vec.map(roundNumber);
      return [vec[0] - vecRound[0], vec[1] - vecRound[1]];
    };

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
    function translateString(x, y) {
      return "translate(".concat(x, ",").concat(y, ")");
    }

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
    /* Helper functions
      ----------------------------------------------- */
    function vectorToTranslateString(vec) {
      return translateString.apply(null, vec);
    }
    function tooltipAnchor() {
      return component().prop("position").position(functor([0, 0])).prop("debug").render(function (data) {
        const selection = d3.select(this);
        const props = selection.props();
        const anchor = selection.selectAll("[data-tooltip-anchor]").data(data).join("rect").attr("height", 1).attr("width", 1).attr("fill", "none").attr("stroke", "none").attr("data-tooltip-anchor", "");
        // Update
        anchor.attr("transform", compose(vectorToTranslateString, props.position));
        // Visible anchor if debug is true
        if (props.debug) {
          const referencePoint = selection.selectAll("[data-tooltip-anchor-debug]").data(data).join("circle").attr("data-tooltip-anchor-debug", "");
          referencePoint.attr("r", 2).attr("fill", "#fff").attr("stroke", "#f00").attr("stroke-width", 1.5).attr("transform", compose(vectorToTranslateString, props.position));
        }
      });
    }

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
    function rangeFlag () {
      return component().prop("x", functor).prop("y0", functor).prop("y1", functor).render(function (data) {
        const selection = d3.select(this);
        const props = selection.props();
        const crispX = compose(halfPixel, props.x);
        const crispY0 = compose(halfPixel, props.y0);
        const crispY1 = compose(halfPixel, props.y1);
        selection.selectAll(".sszvis-rangeFlag__mark.bottom").data(data).call(makeFlagDot("bottom", crispX, crispY0));
        selection.selectAll(".sszvis-rangeFlag__mark.top").data(data).call(makeFlagDot("top", crispX, crispY1));
        const ta = tooltipAnchor().position(d => [crispX(d), halfPixel((Number(props.y0(d)) + Number(props.y1(d))) / 2)]);
        selection.call(ta);
      });
    }
    function makeFlagDot(classed, cx, cy) {
      // The selection is the one being joined into circles, so its datum is the component's and
      // its parent parameters are whatever the caller's selection had.
      return dot => {
        dot.join("circle").classed("sszvis-rangeFlag__mark", true).classed(classed, true).attr("r", 3.5).attr("cx", cx).attr("cy", cy);
      };
    }

    /**
     * Swiss German format locale definition for d3.format functions
     */
    const formatLocale = {
      decimal: ".",
      thousands: " ",
      // This is a 'narrow space', not a regular space. Used as the thousands separator by d3.format
      grouping: [3],
      currency: ["CHF ", ""]
    };
    /**
     * Swiss German time locale definition for d3.time functions
     */
    const timeLocale = {
      dateTime: "%a. %e. %B %X %Y",
      date: "%d.%m.%Y",
      time: "%H:%M:%S",
      periods: ["", ""],
      // Fixed: D3 expects a tuple of 2 strings for AM/PM
      days: ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
      shortDays: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
      months: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
      shortMonths: ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"]
    };

    /**
     * Formatting functions
     *
     * @module sszvis/format
     */
    const timeFormat = d3.timeFormatLocale(timeLocale).format;
    const format = d3.formatLocale(formatLocale).format;
    /**
     * Format a number as an age
     */
    const formatAge = d => String(Math.round(d));
    /**
     * A multi time formatter used by the axis class
     */
    const formatAxisTimeFormat = d => {
      const xs = [[".%L", date => date.getMilliseconds()], [":%S", date => date.getSeconds()], ["%H:%M", date => date.getMinutes()], ["%H Uhr", date => date.getHours()], ["%a., %d.", date => Boolean(date.getDay() && date.getDate() !== 1)], ["%e. %b", date => date.getDate() !== 1], ["%B", date => date.getMonth()], ["%Y", () => true]];
      for (const x of xs) {
        if (x[1](d)) {
          return timeFormat(x[0])(d);
        }
      }
      // Fallback - should never happen, but TypeScript requires a return
      return timeFormat("%Y")(d);
    };
    /**
     * A month name formatter which gives a capitalized three-letter abbreviation of the German month name.
     */
    const formatMonth = compose(m => m.toUpperCase(), timeFormat("%b"));
    /**
     * A year formatter for date objects. Gives the date's year.
     */
    const formatYear = timeFormat("%Y");
    /**
     * Formatter for no label
     */
    const formatNone = () => "";
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
    const formatNumber = d => {
      let p;
      const dAbs = Math.abs(d !== null && d !== void 0 ? d : 0);
      if (d == null || Number.isNaN(d)) {
        return "–"; // This is an en-dash
      }
      // 10250    -> "10 250"
      // 10250.91 -> "10 251"
      else if (dAbs >= 1e4) {
        // Includes ',' for thousands separator. The default use of the 'narrow space' as a separator
        // is configured in the localization file at vendor/d3-de/d3-de.js (also included with sszvis)
        return format(",.0f")(d);
      }
      // 2350     -> "2350"
      // 2350.29  -> "2350.3"
      else if (dAbs >= 100) {
        p = Math.min(1, decimalPlaces(d));
        // Where there are decimals, round to 1 position
        // To display more precision, use the preciseNumber function.
        return stripTrailingZeroes(format(".".concat(p, "f"))(d));
      }
      // 41       -> "41"
      // 41.1     -> "41.1"
      // 41.329   -> "41.33"
      else if (dAbs > 0) {
        p = Math.min(2, decimalPlaces(d));
        // Rounds to (the minimum of decLen or 2) digits. This means that 1 digit or 2 digits are possible,
        // but not more. To display more precision, use the preciseNumber function.
        return stripTrailingZeroes(format(".".concat(p, "f"))(d));
      }
      // If abs(num) is not > 0, num is 0
      // 0       -> "0"
      else {
        return format(".0f")(0);
      }
    };
    function formatPreciseNumber(p, d) {
      // This curries the function
      if (arguments.length > 1 && d !== undefined) return formatPreciseNumber(p)(d);
      return x => {
        const dAbs = Math.abs(x);
        return dAbs >= 100 && dAbs < 1e4 ? format(".".concat(p, "f"))(x) : format(",.".concat(p, "f"))(x);
      };
    }
    /**
     * Format percentages on the range 0 - 100
     */
    const formatPercent = d => {
      // Uses unix thin space
      return "".concat(formatNumber(d), " %");
    };
    /**
     * Format percentages on the range 0 - 1
     */
    const formatFractionPercent = d => {
      // Uses unix thin space
      return "".concat(formatNumber(d * 100), " %");
    };
    /**
     * Default formatter for text
     */
    const formatText = String;
    /* Helper functions
    ----------------------------------------------- */
    // decLen is the number of decimal places in the number
    // 0.0002 -> 4
    // 0.0000 -> 0 (Javascript's number implementation chops off trailing zeroes)
    // 123456.1 -> 1
    // 123456.00001 -> 5
    function decimalPlaces(num) {
      return (String(Math.abs(num)).split(".")[1] || "").length;
    }
    function stripTrailingZeroes(str) {
      return str.replace(/(\.\d*[1-9])0+$|\.0*$/, "$1");
    }

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
    function rangeRuler () {
      return component().prop("x", functor).prop("y0", functor).prop("y1", functor).prop("top").prop("bottom").prop("label").prop("removeStroke").label(functor("")).prop("total").prop("flip", functor).flip(false).render(function (data) {
        const selection = d3.select(this);
        const props = selection.props();
        const crispX = compose(halfPixel, props.x);
        const crispY0 = compose(halfPixel, props.y0);
        const crispY1 = compose(halfPixel, props.y1);
        const middleY = d => {
          return halfPixel((Number(props.y0(d)) + Number(props.y1(d))) / 2);
        };
        const dotRadius = 1.5;
        const line = selection.selectAll(".sszvis-rangeRuler__rule").data([0]).join("line").classed("sszvis-rangeRuler__rule", true);
        line.attr("x1", crispX).attr("y1", props.top).attr("x2", crispX).attr("y2", props.bottom);
        const marks = selection.selectAll(".sszvis-rangeRuler--mark").data(data).join("g").classed("sszvis-rangeRuler--mark", true);
        marks.append("circle").classed("sszvis-rangeRuler__p1", true);
        marks.append("circle").classed("sszvis-rangeRuler__p2", true);
        marks.append("text").classed("sszvis-rangeRuler__label-contour", true);
        marks.append("text").classed("sszvis-rangeRuler__label", true);
        marks.selectAll(".sszvis-rangeRuler__p1").data(d => [d]).attr("cx", crispX).attr("cy", crispY0).attr("r", dotRadius);
        marks.selectAll(".sszvis-rangeRuler__p2").data(d => [d]).attr("cx", crispX).attr("cy", crispY1).attr("r", dotRadius);
        marks.selectAll(".sszvis-rangeRuler__label").data(d => [d]).attr("x", d => {
          const offset = props.flip(d) ? -10 : 10;
          return crispX(d) + offset;
        }).attr("y", middleY).attr("dy", "0.35em") // vertically-center
        .style("text-anchor", d => props.flip(d) ? "end" : "start").text(compose(formatNumber, props.label));
        //make the contour behind the the label update with the label
        marks.selectAll(".sszvis-rangeRuler__label-contour").data(d => [d]).attr("x", d => {
          const offset = props.flip(d) ? -10 : 10;
          return crispX(d) + offset;
        }).attr("y", middleY).attr("dy", "0.35em") // vertically-center
        .style("text-anchor", d => props.flip(d) ? "end" : "start").text(compose(formatNumber, props.label));
        selection.selectAll("g.sszvis-rangeRuler--mark").each(function () {
          const g = d3.select(this);
          const textNode = g.select("text").node();
          let textContour = g.select(".sszvis-rangeRuler__label-contour");
          if (textContour.empty()) {
            if (textNode) {
              const clonedNode = textNode.cloneNode(true);
              textContour = d3.select(clonedNode);
              textContour.classed("sszvis-rangeRuler__label-contour", true).classed("sszvis-rangeRuler__label", false);
              const contourNode = textContour.node();
              if (contourNode && this instanceof Element) {
                this.insertBefore(contourNode, textNode);
              }
            }
          } else {
            textContour.attr("x", d => {
              const offset = props.flip(d) ? -10 : 10;
              return crispX(d) + offset;
            }).attr("y", d => middleY(d)).attr("dy", "0.35em") // vertically-center
            .style("text-anchor", d => {
              return props.flip(d) ? "end" : "start";
            });
          }
          if (textNode) {
            textContour.text(textNode.textContent || "");
          }
        });
        if (!props.removeStroke) {
          marks.attr("stroke", "white").attr("stroke-width", 0.5).attr("stroke-opacity", 0.75);
        }
        const total = selection.selectAll(".sszvis-rangeRuler__total").data([last(data)]).join("text").classed("sszvis-rangeRuler__total", true);
        total.attr("x", d => {
          const offset = props.flip(d) ? -10 : 10;
          return crispX(d) + offset;
        }).attr("y", props.top - 10).style("text-anchor", d => {
          return props.flip(d) ? "end" : "start";
        }).text("Total ".concat(formatNumber(props.total)));
        const totalNode = total.node();
        let totalContour = selection.select(".sszvis-rangeRuler__total-contour");
        if (totalContour.empty()) {
          if (totalNode) {
            const clonedTotalNode = totalNode.cloneNode(true);
            totalContour = d3.select(clonedTotalNode);
            totalContour.classed("sszvis-rangeRuler__total-contour", true).classed("sszvis-rangeRuler__total", false);
            const contourNode = totalContour.node();
            if (contourNode && this instanceof Element) {
              this.insertBefore(contourNode, totalNode);
            }
          }
        } else {
          totalContour.attr("x", d => {
            const offset = props.flip(d) ? -10 : 10;
            return crispX(d) + offset;
          }).attr("y", props.top - 10).style("text-anchor", d => {
            return props.flip(d) ? "end" : "start";
          });
        }
        if (totalNode) {
          totalContour.text(totalNode.textContent || "");
        }
        if (!props.removeStroke) {
          total.attr("stroke", "white").attr("stroke-width", 0.5).attr("stroke-opacity", 0.75);
        }
      });
    }

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
    function rectangle () {
      return component().prop("x", functor).prop("y", functor).prop("width", functor).prop("height", functor).prop("dx", functor).prop("dy", functor).prop("caption", functor).render(function (data) {
        const selection = d3.select(this);
        const props = selection.props();
        const patternSelection = ensureDefsElement(selection, "pattern", "data-area-pattern");
        dataAreaPattern(patternSelection);
        const dataArea = selection.selectAll(".sszvis-dataarearectangle").data(data).join("rect").classed("sszvis-dataarearectangle", true);
        dataArea.attr("x", d => Number(props.x(d))).attr("y", d => Number(props.y(d))).attr("width", d => Number(props.width(d))).attr("height", d => Number(props.height(d))).attr("fill", "url(#data-area-pattern)");
        if (props.caption) {
          const dataCaptions = selection.selectAll(".sszvis-dataarearectangle__caption").data(data).join("text").classed("sszvis-dataarearectangle__caption", true);
          dataCaptions.attr("x", d => Number(props.x(d)) + Number(props.width(d)) / 2).attr("y", d => Number(props.y(d)) + Number(props.height(d)) / 2).attr("dx", props.dx ? d => {
            var _props$dx;
            return Number((_props$dx = props.dx) === null || _props$dx === void 0 ? void 0 : _props$dx.call(props, d));
          } : null).attr("dy", props.dy ? d => {
            var _props$dy;
            return Number((_props$dy = props.dy) === null || _props$dy === void 0 ? void 0 : _props$dy.call(props, d));
          } : null).text(d => {
            var _props$caption;
            return ((_props$caption = props.caption) === null || _props$caption === void 0 ? void 0 : _props$caption.call(props, d)) || "";
          });
        }
      });
    }

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
    /** Horizontal distance between a dot and its label. */
    const LABEL_OFFSET$1 = 10;
    /** Vertical nudge that drops a label's baseline clear of its dot. */
    const LABEL_BASELINE_NUDGE$1 = 5;
    const annotationRuler = () => component().prop("top").prop("bottom").prop("x", functor).prop("y", functor).prop("label").label(functor("")).prop("color").prop("flip", functor).flip(false).prop("labelId", functor).prop("reduceOverlap").reduceOverlap(true).render(function (data) {
      const selection = d3.select(this);
      const props = selection.props();
      const labelId = props.labelId || (d => "".concat(props.x(d), "_").concat(props.y(d)));
      const ruler = selection.selectAll(".sszvis-ruler__rule").data(data, d => labelId(d)).join("line").classed("sszvis-ruler__rule", true);
      ruler.attr("x1", compose(halfPixel, props.x)).attr("y1", d => Number(props.y(d))).attr("x2", compose(halfPixel, props.x)).attr("y2", props.bottom);
      const dot = selection.selectAll(".sszvis-ruler__dot").data(data, d => labelId(d)).join("circle").classed("sszvis-ruler__dot", true);
      dot.attr("cx", compose(halfPixel, props.x)).attr("cy", compose(halfPixel, props.y)).attr("r", 3.5).attr("fill", props.color || "black");
      selection.selectAll(".sszvis-ruler__label-outline").data(data, d => labelId(d)).join("text").classed("sszvis-ruler__label-outline", true);
      const label = selection.selectAll(".sszvis-ruler__label").data(data, d => labelId(d)).join("text").classed("sszvis-ruler__label", true);
      // Update both label and labelOutline selections
      const crispX = compose(halfPixel, props.x);
      const crispY = compose(halfPixel, props.y);
      const textSelection = selection.selectAll(".sszvis-ruler__label, .sszvis-ruler__label-outline").attr("transform", d => {
        const x = crispX(d);
        const y = crispY(d);
        const dx = props.flip(d) ? -LABEL_OFFSET$1 : LABEL_OFFSET$1;
        // A constant nudge, whether the dot sits on the ruler or above its top; only a
        // dot below `bottom` needs none. The same expression lives in
        // src/control/handleRuler.ts and the two must not drift.
        const dy = y > props.bottom ? 0 : LABEL_BASELINE_NUDGE$1;
        return translateString(x + dx, y + dy);
      }).style("text-anchor", d => props.flip(d) ? "end" : "start").html(d => props.label(d));
      if (props.reduceOverlap) {
        const THRESHOLD = 2;
        let ITERATIONS = 10;
        const labelBounds = [];
        // Optimization for the lookup later
        const labelBoundsIndex = {};
        // Reset vertical shift (set by previous renders)
        textSelection.attr("y", "");
        // Create bounds objects
        label.each(function (d) {
          const bounds = this.getBoundingClientRect();
          const item = {
            top: bounds.top,
            bottom: bounds.bottom,
            dy: 0
          };
          labelBounds.push(item);
          labelBoundsIndex[labelId(d)] = item;
        });
        // Sort array in place by vertical position
        // (only supports labels of same height)
        labelBounds.sort((a, b) => d3.ascending(a.top, b.top));
        // Using postfix decrement means the expression evaluates to the value of the variable
        // before the decrement takes place. In the case of 10 iterations, this means that the
        // variable gets to 0 after the truthiness of the 10th iteration is tested, and the
        // expression is false at the beginning of the 11th, so 10 iterations are executed.
        // If you use prefix decrement (--ITERATIONS), the variable gets to 0 at the beginning of
        // the 10th iteration, meaning that only 9 iterations are executed.
        while (ITERATIONS--) {
          // Calculate overlap and correct position
          for (const [index, firstLabel] of labelBounds.entries()) {
            for (const secondLabel of labelBounds.slice(index + 1)) {
              const overlap = firstLabel.bottom - secondLabel.top;
              if (overlap >= THRESHOLD) {
                const offset = overlap / 2;
                firstLabel.bottom -= offset;
                firstLabel.top -= offset;
                firstLabel.dy -= offset;
                secondLabel.bottom += offset;
                secondLabel.top += offset;
                secondLabel.dy += offset;
              }
            }
          }
        }
        // Shift vertically to remove overlap
        textSelection.attr("y", d => {
          const textLabel = labelBoundsIndex[labelId(d)];
          return textLabel.dy;
        });
      }
    });
    const rulerLabelVerticalSeparate = cAcc => g => {
      const THRESHOLD = 2;
      const labelBounds = [];
      // Reset vertical shift
      g.selectAll("text").each(function () {
        d3.select(this).attr("y", "");
      });
      // Calculate bounds
      g.selectAll(".sszvis-ruler__label").each(function (d) {
        const bounds = this.getBoundingClientRect();
        labelBounds.push({
          category: cAcc(d),
          top: bounds.top,
          bottom: bounds.bottom,
          dy: 0
        });
      });
      // Sort by vertical position (only supports labels of same height)
      labelBounds.sort((a, b) => d3.ascending(a.top, b.top));
      // Calculate overlap and correct position
      for (let i = 0; i < 10; i++) {
        for (let j = 0; j < labelBounds.length; j++) {
          for (let k = j + 1; k < labelBounds.length; k++) {
            if (j === k) continue;
            const firstLabel = labelBounds[j];
            const secondLabel = labelBounds[k];
            const overlap = firstLabel.bottom - secondLabel.top;
            if (overlap >= THRESHOLD) {
              firstLabel.bottom -= overlap / 2;
              firstLabel.top -= overlap / 2;
              firstLabel.dy -= overlap / 2;
              secondLabel.bottom += overlap / 2;
              secondLabel.top += overlap / 2;
              secondLabel.dy += overlap / 2;
            }
          }
        }
      }
      // Shift vertically to remove overlap
      g.selectAll("text").each(function (d) {
        const label = find(l => l.category === cAcc(d), labelBounds);
        if (label) {
          d3.select(this).attr("y", label.dy);
        }
      });
    };

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
    /* Configuration
    ----------------------------------------------- */
    const SMALL_CORNER_RADIUS = 3;
    const LARGE_CORNER_RADIUS = 4;
    const TIP_SIZE = 6;
    const BLUR_PADDING = 5;
    /* Exported module
    ----------------------------------------------- */
    function tooltip () {
      const renderer = tooltipRenderer();
      return component().delegate("header", renderer).delegate("body", renderer).delegate("orientation", renderer).delegate("dx", renderer).delegate("dy", renderer).delegate("opacity", renderer).prop("renderInto").prop("visible", functor).visible(false).renderSelection(selection => {
        const props = selection.props();
        const intoNode = props.renderInto.node();
        if (!intoNode) throw new Error("[annotation/tooltip] renderInto is an empty selection");
        const intoBCR = intoNode.getBoundingClientRect();
        const tooltipData = [];
        selection.each(function (d) {
          if (props.visible(d)) {
            const thisBCR = this.getBoundingClientRect();
            const pos = [thisBCR.left - intoBCR.left, thisBCR.top - intoBCR.top];
            tooltipData.push({
              datum: d,
              x: pos[0],
              y: pos[1]
            });
          }
        });
        props.renderInto.datum(tooltipData).call(renderer);
      });
    }
    /**
     * Tooltip renderer
     * @private
     */
    const tooltipRenderer = () => {
      return component().prop("header").prop("body").prop("orientation", functor).orientation("bottom").prop("dx", functor).dx(1).prop("dy", functor).dy(1).prop("opacity", functor).opacity(1).renderSelection(selection => {
        const tooltipData = selection.datum();
        const props = selection.props();
        const isDef = defined;
        const isSmall = isDef(props.header) && !isDef(props.body) || !isDef(props.header) && isDef(props.body);
        // Select tooltip elements
        const tooltip = selection.selectAll(".sszvis-tooltip").data(tooltipData).join("div");
        tooltip.style("pointer-events", "none").style("opacity", d => String(props.opacity(d))).style("padding-top", d => props.orientation(d) === "top" ? "".concat(TIP_SIZE, "px") : null).style("padding-right", d => props.orientation(d) === "right" ? "".concat(TIP_SIZE, "px") : null).style("padding-bottom", d => props.orientation(d) === "bottom" ? "".concat(TIP_SIZE, "px") : null).style("padding-left", d => props.orientation(d) === "left" ? "".concat(TIP_SIZE, "px") : null).classed("sszvis-tooltip", true);
        // Enter: tooltip background
        const enterBackground = tooltip.selectAll(".sszvis-tooltip__background").data([0]).join("svg").attr("class", "sszvis-tooltip__background").attr("height", 0).attr("width", 0);
        const enterBackgroundPath = enterBackground.selectAll("path").data([0]).join("path");
        if (supportsSVGFilters()) {
          const filter = enterBackground.selectAll("filter").data([0]).join("filter").attr("id", "sszvisTooltipShadowFilter").attr("height", "150%");
          filter.selectAll("feGaussianBlur").data([0]).join("feGaussianBlur").attr("in", "SourceAlpha").attr("stdDeviation", 2);
          filter.selectAll("feComponentTransfer").data([0]).join("feComponentTransfer").selectAll("feFuncA").data([0]).join("feFuncA").attr("type", "linear").attr("slope", 0.2);
          const merge = filter.selectAll("feMerge").data([0]).join("feMerge");
          merge.selectAll("feMergeNode").data([0]).join("feMergeNode"); // Contains the blurred image
          merge.selectAll("feMergeNode").data([0]).join("feMergeNode") // Contains the element that the filter is applied to
          .attr("in", "SourceGraphic");
          enterBackgroundPath.attr("filter", "url(#sszvisTooltipShadowFilter)");
        } else {
          enterBackground.classed("sszvis-tooltip__background--fallback", true);
        }
        // Enter: tooltip content
        const enterContent = tooltip.selectAll(".sszvis-tooltip__content").data([0]).join("div").classed("sszvis-tooltip__content", true);
        enterContent.selectAll(".sszvis-tooltip__header").data([0]).join("div").classed("sszvis-tooltip__header", true);
        enterContent.selectAll(".sszvis-tooltip__body").data([0]).join("div").classed("sszvis-tooltip__body", true);
        // Update: content
        tooltip.select(".sszvis-tooltip__header").datum(prop("datum")).html(props.header || functor(""));
        tooltip.select(".sszvis-tooltip__body").datum(prop("datum")).html(d => {
          if (!props.body) return "";
          const body = typeof props.body === "function" ? props.body(d) : props.body;
          return Array.isArray(body) ? formatTable(body) : body;
        });
        selection.selectAll(".sszvis-tooltip").classed("sszvis-tooltip--small", isSmall).each(function (d) {
          const tip = d3.select(this);
          // only using dimensions.width and dimensions.height here. Not affected by scroll position
          const node = tip.node();
          if (!node) return;
          const dimensions = node.getBoundingClientRect();
          const orientation = props.orientation(d);
          // Position tooltip element
          switch (orientation) {
            case "top":
              {
                tip.style("left", "".concat(d.x - dimensions.width / 2, "px")).style("top", "".concat(d.y + Number(props.dy(d)), "px"));
                break;
              }
            case "bottom":
              {
                tip.style("left", "".concat(d.x - dimensions.width / 2, "px")).style("top", "".concat(d.y - Number(props.dy(d)) - dimensions.height, "px"));
                break;
              }
            case "left":
              {
                tip.style("left", "".concat(d.x + Number(props.dx(d)), "px")).style("top", "".concat(d.y - dimensions.height / 2, "px"));
                break;
              }
            case "right":
              {
                tip.style("left", "".concat(d.x - Number(props.dx(d)) - dimensions.width, "px")).style("top", "".concat(d.y - dimensions.height / 2, "px"));
                break;
              }
          }
          // Position background element
          const bgHeight = dimensions.height + 2 * BLUR_PADDING;
          const bgWidth = dimensions.width + 2 * BLUR_PADDING;
          tip.select(".sszvis-tooltip__background").attr("height", bgHeight).attr("width", bgWidth).style("left", "".concat(-BLUR_PADDING, "px")).style("top", "".concat(-BLUR_PADDING, "px")).select("path").attr("d", tooltipBackgroundGenerator([BLUR_PADDING, BLUR_PADDING], [bgWidth - BLUR_PADDING, bgHeight - BLUR_PADDING], orientation, isSmall ? SMALL_CORNER_RADIUS : LARGE_CORNER_RADIUS));
        });
      });
    };
    /**
     * formatTable
     */
    function formatTable(rows) {
      const tableBody = rows.map(row => "<tr>".concat(row.map(cell => "<td>".concat(cell, "</td>")).join(""), "</tr>")).join("");
      return "<table class=\"sszvis-tooltip__body__table\">".concat(tableBody, "</table>");
    }
    function x(d) {
      return d[0];
    }
    function y(d) {
      return d[1];
    }
    function side(cx, cy, x0, y0, x1, y1, showTip) {
      const mx = x0 + (x1 - x0) / 2;
      const my = y0 + (y1 - y0) / 2;
      const corner = ["Q", cx, cy, x0, y0];
      let tip = [];
      if (showTip && y0 === y1) {
        tip = x0 < x1 ?
        // Top
        ["L", mx - TIP_SIZE, my, "L", mx, my - TIP_SIZE, "L", mx + TIP_SIZE, my] :
        // Bottom
        ["L", mx + TIP_SIZE, my, "L", mx, my + TIP_SIZE, "L", mx - TIP_SIZE, my];
      } else if (showTip && x0 === x1) {
        tip = y0 < y1 ?
        // Right
        ["L", mx, my - TIP_SIZE, "L", mx + TIP_SIZE, my, "L", mx, my + TIP_SIZE] :
        // Left
        ["L", mx, my + TIP_SIZE, "L", mx - TIP_SIZE, my, "L", mx, my - TIP_SIZE];
      }
      const end = ["L", x1, y1];
      return [...corner, ...tip, ...end];
    }
    /**
     * Tooltip background generator
     *
     * Generates a path description with a tip on the specified side.
     *
     *           top
     *         ________
     *   left |        | right
     *        |___  ___|
     *            \/
     *          bottom
     *
     * @param  {Vector} a           Top-left corner of the tooltip rectangle (x, y)
     * @param  {Vector} b           Bottom-right corner of the tooltip rectangle (x, y)
     * @param  {String} orientation The tip will point in this direction (top, right, bottom, left)
     *
     * @return {Path}               SVG path description
     */
    function tooltipBackgroundGenerator(a, b, orientation, radius) {
      switch (orientation) {
        case "top":
          {
            a[1] = a[1] + TIP_SIZE;
            break;
          }
        case "bottom":
          {
            b[1] = b[1] - TIP_SIZE;
            break;
          }
        case "left":
          {
            a[0] = a[0] + TIP_SIZE;
            break;
          }
        case "right":
          {
            b[0] = b[0] - TIP_SIZE;
            break;
          }
      }
      return [
      // Start
      ["M", x(a), y(a) + radius],
      // Top side
      side(x(a), y(a), x(a) + radius, y(a), x(b) - radius, y(a), orientation === "top"),
      // Right side
      side(x(b), y(a), x(b), y(a) + radius, x(b), y(b) - radius, orientation === "right"),
      // Bottom side
      side(x(b), y(b), x(b) - radius, y(b), x(a) + radius, y(b), orientation === "bottom"),
      // Left side
      side(x(a), y(b), x(a), y(b) - radius, x(a), y(a) + radius, orientation === "left")].map(d => d.join(" ")).join(" ");
    }
    /**
     * Detect whether the current browser supports SVG filters
     */
    function supportsSVGFilters() {
      return window.SVGFEColorMatrixElement !== undefined && SVGFEColorMatrixElement.SVG_FECOLORMATRIX_TYPE_SATURATE === 2;
    }

    // src/utils/env.ts
    var NOTHING = Symbol.for("immer-nothing");
    var DRAFTABLE = Symbol.for("immer-draftable");
    var DRAFT_STATE = Symbol.for("immer-state");
    function die(error, ...args) {
      throw new Error(
        `[Immer] minified error nr: ${error}. Full error at: https://bit.ly/3cXEKWf`
      );
    }

    // src/utils/common.ts
    var getPrototypeOf = Object.getPrototypeOf;
    function isDraft(value) {
      return !!value && !!value[DRAFT_STATE];
    }
    function isDraftable(value) {
      if (!value)
        return false;
      return isPlainObject(value) || Array.isArray(value) || !!value[DRAFTABLE] || !!value.constructor?.[DRAFTABLE] || isMap(value) || isSet(value);
    }
    var objectCtorString = Object.prototype.constructor.toString();
    var cachedCtorStrings = /* @__PURE__ */ new WeakMap();
    function isPlainObject(value) {
      if (!value || typeof value !== "object")
        return false;
      const proto = Object.getPrototypeOf(value);
      if (proto === null || proto === Object.prototype)
        return true;
      const Ctor = Object.hasOwnProperty.call(proto, "constructor") && proto.constructor;
      if (Ctor === Object)
        return true;
      if (typeof Ctor !== "function")
        return false;
      let ctorString = cachedCtorStrings.get(Ctor);
      if (ctorString === void 0) {
        ctorString = Function.toString.call(Ctor);
        cachedCtorStrings.set(Ctor, ctorString);
      }
      return ctorString === objectCtorString;
    }
    function each(obj, iter, strict = true) {
      if (getArchtype(obj) === 0 /* Object */) {
        const keys = strict ? Reflect.ownKeys(obj) : Object.keys(obj);
        keys.forEach((key) => {
          iter(key, obj[key], obj);
        });
      } else {
        obj.forEach((entry, index) => iter(index, entry, obj));
      }
    }
    function getArchtype(thing) {
      const state = thing[DRAFT_STATE];
      return state ? state.type_ : Array.isArray(thing) ? 1 /* Array */ : isMap(thing) ? 2 /* Map */ : isSet(thing) ? 3 /* Set */ : 0 /* Object */;
    }
    function has(thing, prop) {
      return getArchtype(thing) === 2 /* Map */ ? thing.has(prop) : Object.prototype.hasOwnProperty.call(thing, prop);
    }
    function set(thing, propOrOldValue, value) {
      const t = getArchtype(thing);
      if (t === 2 /* Map */)
        thing.set(propOrOldValue, value);
      else if (t === 3 /* Set */) {
        thing.add(value);
      } else
        thing[propOrOldValue] = value;
    }
    function is(x, y) {
      if (x === y) {
        return x !== 0 || 1 / x === 1 / y;
      } else {
        return x !== x && y !== y;
      }
    }
    function isMap(target) {
      return target instanceof Map;
    }
    function isSet(target) {
      return target instanceof Set;
    }
    function latest(state) {
      return state.copy_ || state.base_;
    }
    function shallowCopy(base, strict) {
      if (isMap(base)) {
        return new Map(base);
      }
      if (isSet(base)) {
        return new Set(base);
      }
      if (Array.isArray(base))
        return Array.prototype.slice.call(base);
      const isPlain = isPlainObject(base);
      if (strict === true || strict === "class_only" && !isPlain) {
        const descriptors = Object.getOwnPropertyDescriptors(base);
        delete descriptors[DRAFT_STATE];
        let keys = Reflect.ownKeys(descriptors);
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          const desc = descriptors[key];
          if (desc.writable === false) {
            desc.writable = true;
            desc.configurable = true;
          }
          if (desc.get || desc.set)
            descriptors[key] = {
              configurable: true,
              writable: true,
              // could live with !!desc.set as well here...
              enumerable: desc.enumerable,
              value: base[key]
            };
        }
        return Object.create(getPrototypeOf(base), descriptors);
      } else {
        const proto = getPrototypeOf(base);
        if (proto !== null && isPlain) {
          return { ...base };
        }
        const obj = Object.create(proto);
        return Object.assign(obj, base);
      }
    }
    function freeze(obj, deep = false) {
      if (isFrozen(obj) || isDraft(obj) || !isDraftable(obj))
        return obj;
      if (getArchtype(obj) > 1) {
        Object.defineProperties(obj, {
          set: dontMutateMethodOverride,
          add: dontMutateMethodOverride,
          clear: dontMutateMethodOverride,
          delete: dontMutateMethodOverride
        });
      }
      Object.freeze(obj);
      if (deep)
        Object.values(obj).forEach((value) => freeze(value, true));
      return obj;
    }
    function dontMutateFrozenCollections() {
      die(2);
    }
    var dontMutateMethodOverride = {
      value: dontMutateFrozenCollections
    };
    function isFrozen(obj) {
      if (obj === null || typeof obj !== "object")
        return true;
      return Object.isFrozen(obj);
    }

    // src/utils/plugins.ts
    var plugins = {};
    function getPlugin(pluginKey) {
      const plugin = plugins[pluginKey];
      if (!plugin) {
        die(0, pluginKey);
      }
      return plugin;
    }

    // src/core/scope.ts
    var currentScope;
    function getCurrentScope() {
      return currentScope;
    }
    function createScope(parent_, immer_) {
      return {
        drafts_: [],
        parent_,
        immer_,
        // Whenever the modified draft contains a draft from another scope, we
        // need to prevent auto-freezing so the unowned draft can be finalized.
        canAutoFreeze_: true,
        unfinalizedDrafts_: 0
      };
    }
    function usePatchesInScope(scope, patchListener) {
      if (patchListener) {
        getPlugin("Patches");
        scope.patches_ = [];
        scope.inversePatches_ = [];
        scope.patchListener_ = patchListener;
      }
    }
    function revokeScope(scope) {
      leaveScope(scope);
      scope.drafts_.forEach(revokeDraft);
      scope.drafts_ = null;
    }
    function leaveScope(scope) {
      if (scope === currentScope) {
        currentScope = scope.parent_;
      }
    }
    function enterScope(immer2) {
      return currentScope = createScope(currentScope, immer2);
    }
    function revokeDraft(draft) {
      const state = draft[DRAFT_STATE];
      if (state.type_ === 0 /* Object */ || state.type_ === 1 /* Array */)
        state.revoke_();
      else
        state.revoked_ = true;
    }

    // src/core/finalize.ts
    function processResult(result, scope) {
      scope.unfinalizedDrafts_ = scope.drafts_.length;
      const baseDraft = scope.drafts_[0];
      const isReplaced = result !== void 0 && result !== baseDraft;
      if (isReplaced) {
        if (baseDraft[DRAFT_STATE].modified_) {
          revokeScope(scope);
          die(4);
        }
        if (isDraftable(result)) {
          result = finalize(scope, result);
          if (!scope.parent_)
            maybeFreeze(scope, result);
        }
        if (scope.patches_) {
          getPlugin("Patches").generateReplacementPatches_(
            baseDraft[DRAFT_STATE].base_,
            result,
            scope.patches_,
            scope.inversePatches_
          );
        }
      } else {
        result = finalize(scope, baseDraft, []);
      }
      revokeScope(scope);
      if (scope.patches_) {
        scope.patchListener_(scope.patches_, scope.inversePatches_);
      }
      return result !== NOTHING ? result : void 0;
    }
    function finalize(rootScope, value, path) {
      if (isFrozen(value))
        return value;
      const useStrictIteration = rootScope.immer_.shouldUseStrictIteration();
      const state = value[DRAFT_STATE];
      if (!state) {
        each(
          value,
          (key, childValue) => finalizeProperty(rootScope, state, value, key, childValue, path),
          useStrictIteration
        );
        return value;
      }
      if (state.scope_ !== rootScope)
        return value;
      if (!state.modified_) {
        maybeFreeze(rootScope, state.base_, true);
        return state.base_;
      }
      if (!state.finalized_) {
        state.finalized_ = true;
        state.scope_.unfinalizedDrafts_--;
        const result = state.copy_;
        let resultEach = result;
        let isSet2 = false;
        if (state.type_ === 3 /* Set */) {
          resultEach = new Set(result);
          result.clear();
          isSet2 = true;
        }
        each(
          resultEach,
          (key, childValue) => finalizeProperty(
            rootScope,
            state,
            result,
            key,
            childValue,
            path,
            isSet2
          ),
          useStrictIteration
        );
        maybeFreeze(rootScope, result, false);
        if (path && rootScope.patches_) {
          getPlugin("Patches").generatePatches_(
            state,
            path,
            rootScope.patches_,
            rootScope.inversePatches_
          );
        }
      }
      return state.copy_;
    }
    function finalizeProperty(rootScope, parentState, targetObject, prop, childValue, rootPath, targetIsSet) {
      if (childValue == null) {
        return;
      }
      if (typeof childValue !== "object" && !targetIsSet) {
        return;
      }
      const childIsFrozen = isFrozen(childValue);
      if (childIsFrozen && !targetIsSet) {
        return;
      }
      if (isDraft(childValue)) {
        const path = rootPath && parentState && parentState.type_ !== 3 /* Set */ && // Set objects are atomic since they have no keys.
        !has(parentState.assigned_, prop) ? rootPath.concat(prop) : void 0;
        const res = finalize(rootScope, childValue, path);
        set(targetObject, prop, res);
        if (isDraft(res)) {
          rootScope.canAutoFreeze_ = false;
        } else
          return;
      } else if (targetIsSet) {
        targetObject.add(childValue);
      }
      if (isDraftable(childValue) && !childIsFrozen) {
        if (!rootScope.immer_.autoFreeze_ && rootScope.unfinalizedDrafts_ < 1) {
          return;
        }
        if (parentState && parentState.base_ && parentState.base_[prop] === childValue && childIsFrozen) {
          return;
        }
        finalize(rootScope, childValue);
        if ((!parentState || !parentState.scope_.parent_) && typeof prop !== "symbol" && (isMap(targetObject) ? targetObject.has(prop) : Object.prototype.propertyIsEnumerable.call(targetObject, prop)))
          maybeFreeze(rootScope, childValue);
      }
    }
    function maybeFreeze(scope, value, deep = false) {
      if (!scope.parent_ && scope.immer_.autoFreeze_ && scope.canAutoFreeze_) {
        freeze(value, deep);
      }
    }

    // src/core/proxy.ts
    function createProxyProxy(base, parent) {
      const isArray = Array.isArray(base);
      const state = {
        type_: isArray ? 1 /* Array */ : 0 /* Object */,
        // Track which produce call this is associated with.
        scope_: parent ? parent.scope_ : getCurrentScope(),
        // True for both shallow and deep changes.
        modified_: false,
        // Used during finalization.
        finalized_: false,
        // Track which properties have been assigned (true) or deleted (false).
        assigned_: {},
        // The parent draft state.
        parent_: parent,
        // The base state.
        base_: base,
        // The base proxy.
        draft_: null,
        // set below
        // The base copy with any updated values.
        copy_: null,
        // Called by the `produce` function.
        revoke_: null,
        isManual_: false
      };
      let target = state;
      let traps = objectTraps;
      if (isArray) {
        target = [state];
        traps = arrayTraps;
      }
      const { revoke, proxy } = Proxy.revocable(target, traps);
      state.draft_ = proxy;
      state.revoke_ = revoke;
      return proxy;
    }
    var objectTraps = {
      get(state, prop) {
        if (prop === DRAFT_STATE)
          return state;
        const source = latest(state);
        if (!has(source, prop)) {
          return readPropFromProto(state, source, prop);
        }
        const value = source[prop];
        if (state.finalized_ || !isDraftable(value)) {
          return value;
        }
        if (value === peek(state.base_, prop)) {
          prepareCopy(state);
          return state.copy_[prop] = createProxy(value, state);
        }
        return value;
      },
      has(state, prop) {
        return prop in latest(state);
      },
      ownKeys(state) {
        return Reflect.ownKeys(latest(state));
      },
      set(state, prop, value) {
        const desc = getDescriptorFromProto(latest(state), prop);
        if (desc?.set) {
          desc.set.call(state.draft_, value);
          return true;
        }
        if (!state.modified_) {
          const current2 = peek(latest(state), prop);
          const currentState = current2?.[DRAFT_STATE];
          if (currentState && currentState.base_ === value) {
            state.copy_[prop] = value;
            state.assigned_[prop] = false;
            return true;
          }
          if (is(value, current2) && (value !== void 0 || has(state.base_, prop)))
            return true;
          prepareCopy(state);
          markChanged(state);
        }
        if (state.copy_[prop] === value && // special case: handle new props with value 'undefined'
        (value !== void 0 || prop in state.copy_) || // special case: NaN
        Number.isNaN(value) && Number.isNaN(state.copy_[prop]))
          return true;
        state.copy_[prop] = value;
        state.assigned_[prop] = true;
        return true;
      },
      deleteProperty(state, prop) {
        if (peek(state.base_, prop) !== void 0 || prop in state.base_) {
          state.assigned_[prop] = false;
          prepareCopy(state);
          markChanged(state);
        } else {
          delete state.assigned_[prop];
        }
        if (state.copy_) {
          delete state.copy_[prop];
        }
        return true;
      },
      // Note: We never coerce `desc.value` into an Immer draft, because we can't make
      // the same guarantee in ES5 mode.
      getOwnPropertyDescriptor(state, prop) {
        const owner = latest(state);
        const desc = Reflect.getOwnPropertyDescriptor(owner, prop);
        if (!desc)
          return desc;
        return {
          writable: true,
          configurable: state.type_ !== 1 /* Array */ || prop !== "length",
          enumerable: desc.enumerable,
          value: owner[prop]
        };
      },
      defineProperty() {
        die(11);
      },
      getPrototypeOf(state) {
        return getPrototypeOf(state.base_);
      },
      setPrototypeOf() {
        die(12);
      }
    };
    var arrayTraps = {};
    each(objectTraps, (key, fn) => {
      arrayTraps[key] = function() {
        arguments[0] = arguments[0][0];
        return fn.apply(this, arguments);
      };
    });
    arrayTraps.deleteProperty = function(state, prop) {
      return arrayTraps.set.call(this, state, prop, void 0);
    };
    arrayTraps.set = function(state, prop, value) {
      return objectTraps.set.call(this, state[0], prop, value, state[0]);
    };
    function peek(draft, prop) {
      const state = draft[DRAFT_STATE];
      const source = state ? latest(state) : draft;
      return source[prop];
    }
    function readPropFromProto(state, source, prop) {
      const desc = getDescriptorFromProto(source, prop);
      return desc ? `value` in desc ? desc.value : (
        // This is a very special case, if the prop is a getter defined by the
        // prototype, we should invoke it with the draft as context!
        desc.get?.call(state.draft_)
      ) : void 0;
    }
    function getDescriptorFromProto(source, prop) {
      if (!(prop in source))
        return void 0;
      let proto = getPrototypeOf(source);
      while (proto) {
        const desc = Object.getOwnPropertyDescriptor(proto, prop);
        if (desc)
          return desc;
        proto = getPrototypeOf(proto);
      }
      return void 0;
    }
    function markChanged(state) {
      if (!state.modified_) {
        state.modified_ = true;
        if (state.parent_) {
          markChanged(state.parent_);
        }
      }
    }
    function prepareCopy(state) {
      if (!state.copy_) {
        state.copy_ = shallowCopy(
          state.base_,
          state.scope_.immer_.useStrictShallowCopy_
        );
      }
    }

    // src/core/immerClass.ts
    var Immer2 = class {
      constructor(config) {
        this.autoFreeze_ = true;
        this.useStrictShallowCopy_ = false;
        this.useStrictIteration_ = true;
        /**
         * The `produce` function takes a value and a "recipe function" (whose
         * return value often depends on the base state). The recipe function is
         * free to mutate its first argument however it wants. All mutations are
         * only ever applied to a __copy__ of the base state.
         *
         * Pass only a function to create a "curried producer" which relieves you
         * from passing the recipe function every time.
         *
         * Only plain objects and arrays are made mutable. All other objects are
         * considered uncopyable.
         *
         * Note: This function is __bound__ to its `Immer` instance.
         *
         * @param {any} base - the initial state
         * @param {Function} recipe - function that receives a proxy of the base state as first argument and which can be freely modified
         * @param {Function} patchListener - optional function that will be called with all the patches produced here
         * @returns {any} a new state, or the initial state if nothing was modified
         */
        this.produce = (base, recipe, patchListener) => {
          if (typeof base === "function" && typeof recipe !== "function") {
            const defaultBase = recipe;
            recipe = base;
            const self = this;
            return function curriedProduce(base2 = defaultBase, ...args) {
              return self.produce(base2, (draft) => recipe.call(this, draft, ...args));
            };
          }
          if (typeof recipe !== "function")
            die(6);
          if (patchListener !== void 0 && typeof patchListener !== "function")
            die(7);
          let result;
          if (isDraftable(base)) {
            const scope = enterScope(this);
            const proxy = createProxy(base, void 0);
            let hasError = true;
            try {
              result = recipe(proxy);
              hasError = false;
            } finally {
              if (hasError)
                revokeScope(scope);
              else
                leaveScope(scope);
            }
            usePatchesInScope(scope, patchListener);
            return processResult(result, scope);
          } else if (!base || typeof base !== "object") {
            result = recipe(base);
            if (result === void 0)
              result = base;
            if (result === NOTHING)
              result = void 0;
            if (this.autoFreeze_)
              freeze(result, true);
            if (patchListener) {
              const p = [];
              const ip = [];
              getPlugin("Patches").generateReplacementPatches_(base, result, p, ip);
              patchListener(p, ip);
            }
            return result;
          } else
            die(1, base);
        };
        this.produceWithPatches = (base, recipe) => {
          if (typeof base === "function") {
            return (state, ...args) => this.produceWithPatches(state, (draft) => base(draft, ...args));
          }
          let patches, inversePatches;
          const result = this.produce(base, recipe, (p, ip) => {
            patches = p;
            inversePatches = ip;
          });
          return [result, patches, inversePatches];
        };
        if (typeof config?.autoFreeze === "boolean")
          this.setAutoFreeze(config.autoFreeze);
        if (typeof config?.useStrictShallowCopy === "boolean")
          this.setUseStrictShallowCopy(config.useStrictShallowCopy);
        if (typeof config?.useStrictIteration === "boolean")
          this.setUseStrictIteration(config.useStrictIteration);
      }
      createDraft(base) {
        if (!isDraftable(base))
          die(8);
        if (isDraft(base))
          base = current(base);
        const scope = enterScope(this);
        const proxy = createProxy(base, void 0);
        proxy[DRAFT_STATE].isManual_ = true;
        leaveScope(scope);
        return proxy;
      }
      finishDraft(draft, patchListener) {
        const state = draft && draft[DRAFT_STATE];
        if (!state || !state.isManual_)
          die(9);
        const { scope_: scope } = state;
        usePatchesInScope(scope, patchListener);
        return processResult(void 0, scope);
      }
      /**
       * Pass true to automatically freeze all copies created by Immer.
       *
       * By default, auto-freezing is enabled.
       */
      setAutoFreeze(value) {
        this.autoFreeze_ = value;
      }
      /**
       * Pass true to enable strict shallow copy.
       *
       * By default, immer does not copy the object descriptors such as getter, setter and non-enumrable properties.
       */
      setUseStrictShallowCopy(value) {
        this.useStrictShallowCopy_ = value;
      }
      /**
       * Pass false to use faster iteration that skips non-enumerable properties
       * but still handles symbols for compatibility.
       *
       * By default, strict iteration is enabled (includes all own properties).
       */
      setUseStrictIteration(value) {
        this.useStrictIteration_ = value;
      }
      shouldUseStrictIteration() {
        return this.useStrictIteration_;
      }
      applyPatches(base, patches) {
        let i;
        for (i = patches.length - 1; i >= 0; i--) {
          const patch = patches[i];
          if (patch.path.length === 0 && patch.op === "replace") {
            base = patch.value;
            break;
          }
        }
        if (i > -1) {
          patches = patches.slice(i + 1);
        }
        const applyPatchesImpl = getPlugin("Patches").applyPatches_;
        if (isDraft(base)) {
          return applyPatchesImpl(base, patches);
        }
        return this.produce(
          base,
          (draft) => applyPatchesImpl(draft, patches)
        );
      }
    };
    function createProxy(value, parent) {
      const draft = isMap(value) ? getPlugin("MapSet").proxyMap_(value, parent) : isSet(value) ? getPlugin("MapSet").proxySet_(value, parent) : createProxyProxy(value, parent);
      const scope = parent ? parent.scope_ : getCurrentScope();
      scope.drafts_.push(draft);
      return draft;
    }

    // src/core/current.ts
    function current(value) {
      if (!isDraft(value))
        die(10, value);
      return currentImpl(value);
    }
    function currentImpl(value) {
      if (!isDraftable(value) || isFrozen(value))
        return value;
      const state = value[DRAFT_STATE];
      let copy;
      let strict = true;
      if (state) {
        if (!state.modified_)
          return state.base_;
        state.finalized_ = true;
        copy = shallowCopy(value, state.scope_.immer_.useStrictShallowCopy_);
        strict = state.scope_.immer_.shouldUseStrictIteration();
      } else {
        copy = shallowCopy(value, true);
      }
      each(
        copy,
        (key, childValue) => {
          set(copy, key, currentImpl(childValue));
        },
        strict
      );
      if (state) {
        state.finalized_ = false;
      }
      return copy;
    }

    // src/immer.ts
    var immer = new Immer2();
    immer.produce;
    var setAutoFreeze = /* @__PURE__ */ immer.setAutoFreeze.bind(immer);
    var createDraft = /* @__PURE__ */ immer.createDraft.bind(immer);
    var finishDraft = /* @__PURE__ */ immer.finishDraft.bind(immer);

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
    const fallbackUnsupported = () => {
      const supportsSVG = !!document.createElementNS && !!document.createElementNS("http://www.w3.org/2000/svg", "svg").createSVGRect;
      return !supportsSVG;
    };
    const fallbackCanvasUnsupported = () => {
      const supportsCanvas = !!document.createElement("canvas").getContext;
      return !supportsCanvas;
    };
    const fallbackRender = function (selector) {
      let options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
        src: "fallback.png"
      };
      const selection = isSelection(selector) ? selector : d3.select(selector);
      selection.append("img").attr("class", "sszvis-fallback-image").attr("src", options.src);
    };

    /**
     *
     * @module sszvis/logger
     *
     * A component for logging development messages and errors
     *
     * This is a custom logger which accomplishes two goals: 1) to clearly identify log messages
     * coming from sszvis, and 2) to smooth out cross-browser inconsistencies in the implementation
     * of various console functions.
     *
     * All log messages should be visible in the developer tools Javascript console for your web browser
     * of choice. For more information on how to access browser developer tools, see the browser documentation.
     *
     * The logger provides three log levels. All logging functions can accept any number of arguments of
     * any type.
     *
     * Examples:
     *
     * Logging general information:
     *
     * sszvis.logger.log('Circle coordinates: ', circle.cx, circle.cy, circle.r);
     *
     * Logging a warning:
     *
     * sszvis.logger.warn('Configuration options are incompatible: ', props.config1(), props.config2());
     *
     * Logging an error:
     *
     * sszvis.logger.error('Component X requires the "abc" property');
     *
     * @method {any...} log        The basic log level, used for informational purposes
     * @method {any...} warn       Logs a warning, which identifies a potential, but not critical problem
     *                             or informs the user about certain implementation issues which may or
     *                             may not require user attention.
     * @method {any...} error      Logs an error. This should be used when something has gone wrong in the
     *                             implementation, or when the API is used in an unsupported manner. An
     *                             error logged in this way is different from an uncaught exception, in that
     *                             it does not force an unexpected termination of code execution. Instead,
     *                             when errors are logged, it is because of a known, and noticed issue, and
     *                             the error message should provide some information towards resolving the
     *                             problem, usually by changing the use of the library. The implementation
     *                             will handle the situation gracefully, and not cause an unexpected termination
     *                             of execution.
     */
    const warn = logger("warn");
    const error = logger("error");
    /* Helper functions
    ----------------------------------------------- */
    function logger(type) {
      return function () {
        var _console;
        if ((_console = console) !== null && _console !== void 0 && _console[type]) {
          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }
          for (const msg of args) {
            console[type](msg);
          }
        }
      };
    }

    function getDefaultExportFromCjs (x) {
    	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
    }

    var nanoThrottle;
    var hasRequiredNanoThrottle;

    function requireNanoThrottle () {
    	if (hasRequiredNanoThrottle) return nanoThrottle;
    	hasRequiredNanoThrottle = 1;
    	nanoThrottle = function (callback, ms, trailing) {
    	  var t = 0, call;
    	  arguments.length < 3 && (trailing = true);
    	  return function () {
    	    var args = arguments;
    	    var self = this;
    	    call = function () {
    	      callback.apply(self, args);
    	      t = new Date().getTime() + ms;
    	      call = null;
    	      trailing && setTimeout(function () {
    	        call && call();
    	      }, ms);
    	    };
    	    if (new Date().getTime() > t) call();
    	  }
    	};
    	return nanoThrottle;
    }

    var nanoThrottleExports = requireNanoThrottle();
    var throttle = /*@__PURE__*/getDefaultExportFromCjs(nanoThrottleExports);

    /**
     * Viewport Resize watcher
     *
     * The resize watcher in the sszvis.viewport module alerts user code to changes in the browser
     * window size. This includes window resizing on desktop browsers, but also orientation changes
     * on mobile browsers. Functions registered for the 'resize' event are called when the window
     * fires a resize event:
     *
     * sszvis.viewport.on('resize', listenerFunction);
     *
     * The window handler is throttled on a 500ms window, leading edge first: the first resize event
     * calls the listeners synchronously, and if further events arrive within the window the listeners
     * are called once more on the trailing edge, 500ms later. A single isolated resize event produces
     * exactly one call. Resize listeners are called with no arguments.
     *
     * The module is a page-wide singleton: there is one registry, shared by every chart on the page.
     *
     * @module sszvis/viewport
     *
     * @function {string, function} on      registers a listener for an event name. 'resize' is the only
     *                                      name the module itself ever fires, but any name creates a
     *                                      bucket that the caller can `trigger` by hand. Registering the
     *                                      same function twice is de-duplicated: the earlier entry is
     *                                      dropped and the function is appended, so re-registering moves
     *                                      it to the end of the call order. Listeners run in registration
     *                                      order. A listener that is not callable is rejected here, where
     *                                      the mistake is, rather than on the next resize event.
     *
     * @function {string, function} off     removes a listener by function identity. An unknown event name
     *                                      or an unregistered function is ignored. A single `off` undoes
     *                                      any number of `on` calls for the same function. Called with
     *                                      only an event name it drops every listener for that event,
     *                                      which is how a host releases listeners it no longer holds a
     *                                      reference to.
     *
     * @function {string, ...any} trigger   calls every listener registered for the event name, forwarding
     *                                      any further arguments. An event name with no listeners is
     *                                      ignored.
     *
     * Note: the registry is a page-wide singleton, so a chart that is torn down has to release its
     * listener itself - either with `off(name, cb)`, or with `off(name)` to drop the whole bucket.
     *
     * Note: `trigger` isolates the listeners from one another. A listener that throws is reported
     * through `sszvis.logger.error` and the remaining listeners still run, so one broken chart cannot
     * silence the rest of the page or escape the throttle.
     *
     * Note: `on`, `off` and `trigger` return `this`, so they chain when called as methods on the viewport
     * object but return `undefined` once destructured. The registration itself still works.
     *
     * Note: when there is no `window`, nothing is registered and only manual `trigger` calls fire.
     *
     * See test/viewport/resize.test.ts.
     *
     * @return {Object}
     */
    // This rather strange set of functions is designed to support the API:
    // sszvis.viewport.on('resize', callback);
    // While still enabling the user to register multiple callbacks for the 'resize'
    // event. Multiple callbacks are a feature which simply returning a d3.dispatch('resize')
    // object would not allow.
    const callbacks = {
      resize: []
    };
    if (globalThis.window !== undefined) {
      d3.select(globalThis.window).on("resize", throttle(() => {
        viewport.trigger("resize");
      }, 500));
    }
    function on(name, cb) {
      // Registering a non-callable listener can never work, so it is rejected here rather than
      // left to fail inside `trigger` one resize event later, far from the call that caused it.
      if (typeof cb !== "function") {
        throw new TypeError("[sszvis.viewport] The listener for \"".concat(name, "\" must be a function, got ").concat(typeof cb, "."));
      }
      if (!callbacks[name]) {
        callbacks[name] = [];
      }
      callbacks[name] = [...callbacks[name].filter(fn => fn !== cb), cb];
      return this;
    }
    function off(name, cb) {
      if (!callbacks[name]) {
        return this;
      }
      callbacks[name] = cb === undefined ? [] : callbacks[name].filter(fn => fn !== cb);
      return this;
    }
    function trigger(name) {
      if (callbacks[name]) {
        for (var _len = arguments.length, evtArgs = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
          evtArgs[_key - 1] = arguments[_key];
        }
        // A copy, so that a listener which registers or releases listeners cannot change the
        // list being iterated. Each call is isolated: one failing chart must not silence the
        // charts after it, nor let the error escape into the throttled window handler.
        for (const fn of [...callbacks[name]]) {
          try {
            Reflect.apply(fn, null, evtArgs);
          } catch (error$1) {
            error("[sszvis.viewport] A \"".concat(name, "\" listener threw:"), error$1);
          }
        }
      }
      return this;
    }
    const viewport = {
      on,
      off,
      trigger
    };

    // d3 mutates state in many places, which is why we have to turn this off.
    setAutoFreeze(false);
    /**
     * Application loop
     *
     * Creates a stateful app that can be interacted with through actions. By providing
     * a structured approach, this allows us to optimize the render loop and clarifies
     * the relationship between state and actions.
     *
     * Within an app, state is modified only through actions. The state object handed to `render`
     * is frozen, so assigning to it throws instead of silently corrupting the state the next
     * action drafts from. The freeze is shallow, and immer's own auto-freezing stays off, because
     * d3 mutates the data objects it is handed in many places; only the top level of the state is
     * protected.
     *
     * Conceptually, an app works like this:
     *
     *     init
     *       ⇣
     *     state ⭢ render
     *      ⮤ action ⮠
     *
     * Rendering is batched into a single requestAnimationFrame, so several dispatches within
     * one frame result in exactly one render. A resize reported by the viewport module also
     * triggers a re-render. Nothing is rendered until the promise returned by `init` resolves;
     * `init` must return a promise. An effect returned by `init` or by an action is called with
     * `dispatch`, which takes an action name and an array of props.
     *
     * `app()` returns a handle whose `destroy()` releases the resize listener and stops any queued
     * frame, so a host that mounts and unmounts charts can tear an app down instead of leaking one
     * render loop per mount.
     *
     * Error handling: a rejecting `init` is reported through `sszvis.logger.error`, keeping the
     * original error as the reported error's `cause`, and the `fallback` image - if one is
     * configured - is rendered in its place. The failure does not escape as an unhandled promise
     * rejection. An effect - whether it came from `init` or from an action - runs on its own path:
     * an error it throws is reported as an effect failure and never travels through the `init`
     * rejection path, so it is not mistaken for a chart that could not be built and does not render
     * the fallback.
     *
     * @module sszvis/app
     */
    const app = _ref => {
      let {
        init,
        render,
        actions,
        fallback
      } = _ref;
      let renderScheduled = false;
      // Whether `render` is on the stack right now, which is what tells a dispatch made from
      // inside render apart from one that should coalesce into the frame already queued.
      let rendering = false;
      let cascadedRenders = 0;
      let destroyed = false;
      let state;
      invariant(isFunction(init), 'An "init" function returning a Promise must be provided.');
      invariant(isFunction(render), 'A "render" function must be provided.');
      // A default parameter, like the original, only fills in for undefined.
      const actionMap = actions === undefined ? {} : actions;
      // finishDraft is typed as a conditional over the draft it is given, which TypeScript
      // cannot resolve back to State while State is still a type parameter.
      const finish = draft => finishDraft(draft);
      // The dispatchers mirror the keys of the actions object, which is what
      // ActionDispatchers<Actions> describes but Object.keys cannot express.
      const actionDispatchers = Object.keys(actionMap).reduce((acc, key) => {
        acc[key] = function () {
          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }
          dispatch(key, args);
        };
        return acc;
      }, {});
      function scheduleUpdate(effect) {
        scheduleRender();
        if (isFunction(effect)) runEffect(effect);
      }
      function scheduleRender() {
        if (destroyed || renderScheduled) return;
        if (rendering) {
          // A dispatch made from inside render. Its state cannot be shown by the frame that is
          // painting, so it needs one of its own - and a render that dispatches unconditionally
          // would then never stop, which is what this cap is for.
          if (cascadedRenders >= MAX_CASCADED_RENDERS) {
            warn("[sszvis.app] Stopped after ".concat(MAX_CASCADED_RENDERS, " renders scheduled from inside \"render\". Dispatch from render only on a condition that eventually becomes false."));
            return;
          }
          cascadedRenders += 1;
        } else {
          cascadedRenders = 0;
        }
        renderScheduled = true;
        requestAnimationFrame(() => {
          // Cleared before render runs, so that a dispatch made from inside render can queue the
          // frame its state needs instead of being swallowed by a guard that is still closed.
          renderScheduled = false;
          if (destroyed) return;
          rendering = true;
          try {
            // Shallow, so that d3 can still mutate the data hanging off the state, but enough to
            // turn an accidental `state.x = …` in render into a TypeError rather than a change
            // that survives into the next action's draft.
            render(Object.freeze(state), actionDispatchers);
          } finally {
            rendering = false;
          }
        });
      }
      /** Effects are the caller's code, run one turn removed from whatever scheduled them, so
       * their failures are reported on their own rather than attributed to `init` or thrown at
       * an unrelated dispatcher's call site. */
      function runEffect(effect) {
        try {
          effect(dispatch);
        } catch (error) {
          reportError("An effect failed", error);
        }
      }
      const dispatch = (action, props) => {
        const handler = actionMap[action];
        invariant(handler != null, "Action \"".concat(action, "\" is not defined, add it to \"actions\"."));
        const draft = createDraft(state);
        // Each action declares the props it accepts, but which action is being dispatched is
        // only known from a string at this point, so the props cannot be checked here.
        const call = handler;
        // Called on actionMap so that `this` is the actions object, as `actions[action](...)`
        // in the original implementation made it.
        const effect = Reflect.apply(call, actionMap, [draft, ...props]);
        state = finish(draft);
        scheduleUpdate(effect);
      };
      // The app starts out with an empty state that init is expected to populate.
      const initialState = createDraft({});
      init(initialState).then(effect => {
        state = finish(initialState);
        // An app destroyed while init was still in flight must not register a listener that
        // nothing will ever release.
        if (destroyed) return;
        // Registered before the effect runs: scheduleUpdate calls the effect synchronously,
        // and an init effect that destroys the app would otherwise release a listener that
        // is only installed afterwards, leaving it attached for the life of the page.
        viewport.on("resize", scheduleUpdate);
        scheduleUpdate(effect);
      }).catch(error => {
        // A rejecting init is a runtime failure, not a misconfiguration: the fallback option
        // exists precisely for it, so it is reported and the fallback rendered rather than
        // re-thrown into an unhandled rejection nobody can catch.
        reportError("Initialisation failed", error);
        // A destroyed app renders nothing afterwards, fallback included - the container may
        // already belong to a replacement app. The failure is still reported, since it is
        // real regardless of who is holding the container now.
        if (!destroyed && fallback) fallbackRender(fallback.element, {
          src: fallback.src
        });
      });
      return {
        destroy() {
          destroyed = true;
          viewport.off("resize", scheduleUpdate);
        }
      };
    };
    // -----------------------------------------------------------------------------
    // Helper functions
    /** How many frames in a row may be scheduled by a dispatch made from inside `render` before
     * the cascade is treated as a runaway loop and cut off. */
    const MAX_CASCADED_RENDERS = 10;
    function invariant(condition, message) {
      if (!condition) {
        throw new Error("[sszvis.app] ".concat(message));
      }
    }
    /** Reports a runtime failure without escaping as an unhandled rejection. The original error
     * is kept as the `cause` so its message and stack are not lost. */
    function reportError(context, cause) {
      const message = cause instanceof Error ? cause.message : String(cause);
      error(new Error("[sszvis.app] ".concat(context, ": ").concat(message), {
        cause
      }));
    }
    function isFunction(x) {
      return typeof x === "function";
    }

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
    /**
     * breakpoint.find
     *
     * Returns the first matching breakpoint for a given measurement
     *
     * @param {Array<Breakpoint>} breakpoints A breakpoint spec
     * @param {Measurement} partialMeasurement A partial measurement to match to the spec
     * @returns {Breakpoint}
     */
    function breakpointFind(breakpoints, partialMeasurement) {
      const measurement = parseMeasurement(partialMeasurement);
      return find(bp => breakpointTest(bp, measurement), breakpoints);
    }
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
    function breakpointFindByName(breakpoints, name) {
      const eqName = bp => bp.name === name;
      return find(eqName, breakpoints);
    }
    /**
     * breakpoint.test
     *
     * Returns true if the given measurement fits within the breakpoint.
     *
     * @param {Breakpoint} breakpoint A single breakpoint
     * @param {Measurement} partialMeasurement A partial measurement to match to the breakpoint
     * @returns {boolean}
     */
    function breakpointTest(breakpoint, partialMeasurement) {
      const bpm = breakpoint.measurement;
      const measurement = parseMeasurement(partialMeasurement);
      return measurement.width <= bpm.width && measurement.screenHeight <= bpm.screenHeight;
    }
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
    function breakpointMatch(breakpoints, partialMeasurement) {
      const measurement = parseMeasurement(partialMeasurement);
      return breakpoints.filter(bp => breakpointTest(bp, measurement));
    }
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
    function breakpointCreateSpec(spec) {
      return [...spec.map(parseBreakpoint), parseBreakpoint({
        name: "_"
      })];
    }
    /**
     * breakpoint.defaultSpec
     *
     * @returns {Array<{name: string, width: number, screenHeight: number}>} The SSZVIS
     *          default breakpoint spec.
     */
    const breakpointDefaultSpec = () => breakpointCreateSpec([{
      name: "palm",
      width: 540
    }, {
      name: "lap",
      width: 749
    }]);
    // Default tests
    const breakpointPalm = makeTest("palm");
    const breakpointLap = makeTest("lap");
    // Helpers
    /**
     * Measurement
     *
     * A measurement is defined as an object with width and screenHeight props.
     * It is used throughout the breakpoint calculations.
     *
     * For parsing, a partial measurement can be supplied. If a property is
     * not defined, it is initialized to Infinity, which matches all breakpoints.
     *
     * @example
     *   const Measurement = {
     *     width: number,
     *     screenHeight: number
     *   }
     *
     * @param {{width?: number, screenHeight?: number}} partialMeasurement
     * @returns Measurement
     */
    function parseMeasurement(partialMeasurement) {
      const widthOrInf = propOr("width", Infinity);
      const screenHeightOrInf = propOr("screenHeight", Infinity);
      return {
        width: widthOrInf(partialMeasurement),
        screenHeight: screenHeightOrInf(partialMeasurement)
      };
    }
    /**
     * Breakpoint
     *
     * A breakpoint is defined as an object with name and measurement props.
     * It is used throughout the breakpoint calculations.
     *
     * For parsing, a partial breakpoint can be supplied where measurements
     * can be directly supplied on the top object.
     *
     * @example
     *   const PartialBreakpoint = {
     *     name: string,
     *     width?: number,
     *     screenHeight?: number
     *   }
     *
     *   const Breakpoint = {
     *     name: string,
     *     measurement: Measurement
     *   }
     *
     * @param {{name: string, width?: number, screenHeight?: number, measurement?: Measurement}} bp
     * @returns Breakpoint
     */
    function parseBreakpoint(bp) {
      // Type guard to check if bp has measurement property
      const hasMeasurement = obj => {
        return "measurement" in obj;
      };
      const measurement = hasMeasurement(bp) ? parseMeasurement(bp.measurement) : parseMeasurement({
        width: bp.width,
        screenHeight: bp.screenHeight
      });
      return {
        name: bp.name,
        measurement
      };
    }
    /**
     * Create a partially applied test function
     */
    function makeTest(name) {
      return measurement => {
        const breakpoint = breakpointFindByName(breakpointDefaultSpec(), name);
        return breakpoint ? breakpointTest(breakpoint, measurement) : false;
      };
    }

    /**
     * Functions related to aspect ratio calculations. An "auto" function is
     * provided and should be used in most cases to find the recommended
     * aspect ratio.
     *
     * @module sszvis/aspectRatio
     */
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
    function aspectRatio(x, y) {
      const ar = x / y;
      return width => width / ar;
    }
    /**
     * aspectRatio4to3
     *
     * Recommended breakpoints:
     *   - palm
     */
    const aspectRatio4to3 = aspectRatio(4, 3);
    /**
     * aspectRatio16to10
     *
     * Recommended breakpoints:
     *   - lap
     */
    const aspectRatio16to10 = aspectRatio(16, 10);
    /**
     * aspectRatio12to5
     *
     * Recommended breakpoints:
     *   - desk
     */
    const AR12TO5_MAX_HEIGHT = 500;
    const aspectRatio12to5 = width => Math.min(aspectRatio(12, 5)(width), AR12TO5_MAX_HEIGHT);
    aspectRatio12to5.MAX_HEIGHT = AR12TO5_MAX_HEIGHT;
    /**
     * aspectRatioSquare
     *
     * This aspect ratio constrains the returned height to a maximum of 420px.
     * It is recommended to center charts within this aspect ratio.
     *
     * Exposes the MAX_HEIGHT used as a property on the function.
     *
     * Recommended breakpoints:
     *   - palm
     *   - lap
     *   - desk
     */
    const SQUARE_MAX_HEIGHT = 420;
    const aspectRatioSquare = width => Math.min(aspectRatio(1, 1)(width), SQUARE_MAX_HEIGHT);
    aspectRatioSquare.MAX_HEIGHT = SQUARE_MAX_HEIGHT;
    /**
     * aspectRatioPortrait
     *
     * This aspect ratio constrains the returned height to a maximum of 600px.
     * It is recommended to center charts within this aspect ratio.
     *
     * Exposes the MAX_HEIGHT used as a property on the function.
     *
     * Recommended breakpoints:
     *   - palm
     *   - lap
     *   - desk
     */
    const PORTRAIT_MAX_HEIGHT = 600;
    const aspectRatioPortrait = width => Math.min(aspectRatio(4, 5)(width), PORTRAIT_MAX_HEIGHT);
    aspectRatioPortrait.MAX_HEIGHT = PORTRAIT_MAX_HEIGHT;
    /**
     * aspectRatioAuto
     *
     * Provides a set of default aspect ratios for different widths. If you provide a set
     * of measurements for a container and the window itself, it will provide the default
     * value of the height for that container. Note that the aspect ratio chosen may
     * depend on the container width itself. This is because of default breakpoints.
     *
     * @param measurement The measurements object for the container for which you
     *                    want a height value. Should have at least the properties:
     *                      - `width`: container's width
     *                      - `screenHeight`: the height of the window at the current time.
     *
     * @return The height which corresponds to the default aspect ratio for these measurements
     */
    const defaultAspectRatios = {
      palm: aspectRatio4to3,
      // palm-sized devices
      lap: aspectRatio16to10,
      // lap-sized devices
      _: aspectRatio12to5 // all other cases, including desk
    };
    const aspectRatioAuto = measurement => {
      const bp = breakpointFind(breakpointDefaultSpec(), measurement);
      const ar = defaultAspectRatios[(bp === null || bp === void 0 ? void 0 : bp.name) || "_"];
      return ar(measurement.width);
    };

    /**
     * Scale utilities
     *
     * @module sszvis/scale
     */
    /**
     * Scale range
     *
     * Used to determine the extent of a scale's range. Mimics a function found in d3 source code.
     *
     * @param  {array} scale    The scale to be measured
     * @return {array}          The extent of the scale's range. Useful for determining how far
     *                          a scale stretches in its output dimension.
     */
    const range = scale => {
      // borrowed from d3 source - svg.axis
      return scale.rangeExtent ? scale.rangeExtent() : extent(scale.range());
    };
    /**
     * Helper function
     * Extent
     *
     * Used to determine the extent of an array. Mimics a function found in d3 source code.
     *
     * @param  {array} domain     an array, sorted in either ascending or descending order
     * @return {array}            the extent of the array, with the smaller term first.
     */
    function extent(domain) {
      // borrowed from d3 source - svg.axis
      const start = domain[0];
      const stop = domain[domain.length - 1];
      return start < stop ? [start, stop] : [stop, start];
    }

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
    function textWrap(
    // Wrapping reads and rewrites the <text> nodes themselves, so the element parameter is
    // fixed; the rest stay generic so any text selection can be passed.
    selection, width, paddingRightLeft, paddingTopBottom) {
      const padRightLeft = paddingRightLeft || 5; //Default padding (5px)
      const padTopBottom = (paddingTopBottom || 5) - 2; //Default padding (5px), remove 2 pixels because of the borders
      const maxWidth = width; //I store the tooltip max width
      const innerWidth = width - padRightLeft * 2; //Take the padding into account
      const arrLineCreatedCount = [];
      selection.each(function () {
        var _text$attr;
        const text = d3.select(this);
        const words = text.text().split(/[\t\n\v\f\r ]+/)
        // Splitting text with leading or trailing whitespace yields empty tokens, which
        // would be rejoined as spaces and padded into the rendered line and its measured
        // width. Only these tokens are dropped; the words themselves are untouched.
        .filter(word => word !== "").reverse(); //Don't cut non-breaking space (\xA0), as well as the Unicode characters \u00A0 \u2028 \u2029)
        let line = [];
        let lineNumber = 0;
        const lineHeight = 1.1; //Em
        let createdLineCount = 1; //Total line created count
        const textAlign = text.style("text-anchor") || "start"; //'start' by default (start, middle, end, inherit)
        //Clean the data in case <text> does not define those values
        const parsedDy = Number.parseFloat((_text$attr = text.attr("dy")) !== null && _text$attr !== void 0 ? _text$attr : "");
        const dy = Number.isNaN(parsedDy) ? 0 : parsedDy; //Default padding (0em) : the 'dy' attribute on the first <tspan> _must_ be identical to the 'dy' specified on the <text> element, or start at '0em' if undefined
        //Offset the text position based on the text-anchor
        const wrapTickLabels = d3.select(this.parentElement).classed("tick"); //Don't wrap the 'normal untranslated' <text> element and the translated <g class='tick'><text></text></g> elements the same way..
        // An unrecognised text-anchor yields undefined, which d3 treats as "remove the
        // attribute" - the same outcome as the original switch statements' empty default case.
        const xByAnchor = wrapTickLabels ? {
          start: -innerWidth / 2,
          middle: 0,
          end: innerWidth / 2
        } : {
          //untranslated <text> elements
          start: padRightLeft,
          middle: maxWidth / 2,
          end: maxWidth - padRightLeft
        };
        const x = xByAnchor[textAlign];
        const yAttr = text.attr("y");
        const y = +(yAttr === null ? padTopBottom : yAttr);
        let tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", "".concat(dy, "em"));
        while (words.length > 0) {
          var _words$pop;
          const word = (_words$pop = words.pop()) !== null && _words$pop !== void 0 ? _words$pop : ""; // the loop guard guarantees a value
          line.push(word);
          tspan.text(line.join(" "));
          const tspanNode = tspan.node();
          if (tspanNode && tspanNode.getComputedTextLength() > innerWidth && line.length > 1) {
            line.pop();
            tspan.text(line.join(" "));
            line = [word];
            tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", "".concat(++lineNumber * lineHeight + dy, "em")).text(word);
            ++createdLineCount;
          }
        }
        arrLineCreatedCount.push(createdLineCount); //Store the line count in the array
      });
      return arrLineCreatedCount;
    }

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
    const TICK_PROXIMITY_THRESHOLD = 8;
    const TICK_END_THRESHOLD = 12;
    const LABEL_PROXIMITY_THRESHOLD = 10;
    function axis() {
      // const axisDelegate = d3.axisBottom();
      // axisDelegate.orient = function() { return 'bottom'; };
      // axisComponent.__delegate__ = axisDelegate;
      return component().prop("scale").prop("orient").prop("ticks").prop("tickValues").prop("tickSize").prop("tickSizeInner").prop("tickSizeOuter").prop("tickPadding").prop("tickFormat").prop("_scale").prop("orient").orient("bottom").prop("alignOuterLabels").alignOuterLabels(false).prop("contour").prop("hideBorderTickThreshold").hideBorderTickThreshold(TICK_PROXIMITY_THRESHOLD).prop("hideLabelThreshold").hideLabelThreshold(LABEL_PROXIMITY_THRESHOLD).prop("highlightTick", functor).prop("showZeroY").showZeroY(false).prop("slant").prop("textWrap").prop("tickLength").prop("title").prop("titleAnchor") // start, end, or middle
      .prop("titleCenter") // a boolean value - whether to center the title
      .prop("dxTitle") // a numeric value for the left offset of the title
      .prop("dyTitle") // a numeric value for the top offset of the title
      .prop("titleVertical").prop("vertical").vertical(false)
      //this property is typically used for the x-axis, but not for the y axis
      //it creates a gap between chart and x-axis by offsetting the the chart by a number of pixels
      .prop("yOffset").yOffset(0).render(function () {
        var _slantLabel$props$ori;
        const selection = d3.select(this);
        const props = selection.props();
        const isBottom = !props.vertical && props.orient === "bottom";
        const scale = props.scale || props._scale;
        if (!scale) {
          throw new Error("axis: need to specify a scale");
        }
        let axisDelegate;
        switch (props.orient) {
          case "bottom":
            {
              axisDelegate = d3.axisBottom(scale);
              break;
            }
          case "top":
            {
              axisDelegate = d3.axisTop(scale);
              break;
            }
          case "left":
            {
              axisDelegate = d3.axisLeft(scale);
              break;
            }
          case "right":
            {
              axisDelegate = d3.axisRight(scale);
              break;
            }
          default:
            {
              axisDelegate = d3.axisBottom(scale);
              break;
            }
        }
        if (props.scale !== undefined) {
          axisDelegate.scale(props.scale);
        }
        if (props.ticks !== undefined) {
          if (Array.isArray(props.ticks) && props.ticks.length > 0) {
            axisDelegate.ticks(...props.ticks);
          } else {
            axisDelegate.ticks(props.ticks);
          }
        }
        if (props.tickValues !== undefined) {
          axisDelegate.tickValues(props.tickValues);
        }
        if (props.tickSizeInner !== undefined) {
          axisDelegate.tickSizeInner(props.tickSizeInner);
        }
        if (props.tickSizeOuter !== undefined) {
          axisDelegate.tickSizeOuter(props.tickSizeOuter);
        }
        if (props.tickPadding !== undefined) {
          axisDelegate.tickPadding(props.tickPadding);
        }
        if (props.tickFormat !== undefined) {
          axisDelegate.tickFormat(d => {
            var _props$tickFormat, _props$tickFormat2;
            return (_props$tickFormat = (_props$tickFormat2 = props.tickFormat) === null || _props$tickFormat2 === void 0 ? void 0 : _props$tickFormat2.call(props, d)) !== null && _props$tickFormat !== void 0 ? _props$tickFormat : "";
          });
        }
        if (props.tickSize !== undefined) {
          axisDelegate.tickSize(props.tickSize);
        }
        if (props._scale) {
          axisDelegate.scale(props._scale);
        }
        const group = selection.selectGroup("sszvis-axis").classed("sszvis-axis", true).classed("sszvis-axis--top", !props.vertical && props.orient === "top").classed("sszvis-axis--bottom", isBottom).classed("sszvis-axis--vertical", Boolean(props.vertical)).attr("transform", translateString(0, props.yOffset || 0)).call(axisDelegate);
        group.attr("fill", null).attr("font-size", null).attr("font-family", null);
        // .attr("text-anchor", null);
        const axisScale = axisDelegate.scale();
        // Create selections here which will be used later for many custom configurations
        // Note: Inconstiant: This is only valid so long as new .tick groups or tick label texts
        // are not being added after these selections are constructed. If that changes, these
        // selections need to be re-constructed.
        const tickGroups = group.selectAll("g.tick");
        const tickTexts = tickGroups.selectAll("text");
        // To prevent anti-aliasing on elements that need to be rendered crisply
        // we need to position them on a half-pixel grid: 0.5, 1.5, 2.5, etc.
        // We can't translate the whole .tick group, however, because this
        // leads to weird type rendering artefacts in some browsers. That's
        // why we reach into the group and translate lines onto the half-pixel
        // grid by taking the translation of the group into account.
        tickGroups.each(function () {
          const subpixelShift = transformTranslateSubpixelShift(this.getAttribute("transform") || "");
          const dx = halfPixel(0) - subpixelShift[0];
          const dy = halfPixel(isBottom ? 2 : 0) + subpixelShift[1];
          d3.select(this).select("line").attr("transform", translateString(dx, dy));
        });
        tickTexts.each(function () {
          if (props.orient === "top" || props.orient === "bottom") {
            d3.select(this).attr("dx", "-0.5");
          }
          if (props.orient === "left" || props.orient === "right") {
            d3.select(this).attr("y", "-0.5");
          }
        });
        // Place axis line on a half-pixel grid to prevent anti-aliasing
        group.selectAll("path.domain");
        // .attr('transform', translateString(halfPixel(0), halfPixel(0)));
        // hide ticks which are too close to one endpoint
        const rangeExtent = range(axisScale);
        tickGroups.selectAll("line").each(function (d) {
          var _axisScale;
          const pos = (_axisScale = axisScale(d)) !== null && _axisScale !== void 0 ? _axisScale : 0,
            d3this = d3.select(this);
          const min = rangeExtent[0];
          const max = rangeExtent[1];
          d3this.classed("hidden", !d3this.classed("sszvis-axis__longtick") && (absDistance(pos, min) < (props.hideBorderTickThreshold || 0) || absDistance(pos, max) < (props.hideBorderTickThreshold || 0)));
        });
        if (defined(props.tickLength)) {
          const domain = axisScale.domain();
          const domainExtent = domain.length > 0 ? [domain[0], domain[domain.length - 1]] : [undefined, undefined];
          const ticks = tickGroups.filter(d => domainExtent[0] !== undefined && domainExtent[1] !== undefined && !stringEqual(d, domainExtent[0]) && !stringEqual(d, domainExtent[1]));
          const orientation = props.orient;
          let longLinePadding = 2;
          if (orientation === "left" || orientation === "right") {
            ticks.selectAll("text").each(function () {
              longLinePadding = Math.max(this.getBoundingClientRect().width, longLinePadding);
            });
            longLinePadding += 2; // a lil' extra on the end
          }
          const lines = ticks.selectAll("line.sszvis-axis__longtick").data([0]).join("line").classed("sszvis-axis__longtick", true);
          if (props.tickLength > longLinePadding) {
            switch (orientation) {
              case "top":
                {
                  lines.attr("y1", longLinePadding).attr("y2", props.tickLength);
                  break;
                }
              case "bottom":
                {
                  lines.attr("y1", -longLinePadding).attr("y2", -props.tickLength);
                  break;
                }
              case "left":
                {
                  lines.attr("x1", -longLinePadding).attr("x2", -props.tickLength);
                  break;
                }
              case "right":
                {
                  lines.attr("x1", longLinePadding).attr("x2", props.tickLength);
                  break;
                }
              // No default
            }
          } else {
            lines.remove();
          }
        }
        if (props.alignOuterLabels) {
          const alignmentBounds = range(axisScale);
          const min = alignmentBounds[0];
          const max = alignmentBounds[1];
          tickTexts.style("text-anchor", d => {
            var _axisScale2;
            const value = (_axisScale2 = axisScale(d)) !== null && _axisScale2 !== void 0 ? _axisScale2 : 0;
            const minVal = min !== null && min !== void 0 ? min : 0;
            const maxVal = max !== null && max !== void 0 ? max : 0;
            if (absDistance(value, minVal) < TICK_END_THRESHOLD) {
              return "start";
            } else if (absDistance(value, maxVal) < TICK_END_THRESHOLD) {
              return "end";
            }
            return "middle";
          });
        }
        if (defined(props.textWrap)) {
          tickTexts.call(textWrap, props.textWrap);
        }
        if (props.slant && props.orient && (_slantLabel$props$ori = slantLabel[props.orient]) !== null && _slantLabel$props$ori !== void 0 && _slantLabel$props$ori[props.slant]) {
          tickTexts.call(slantLabel[props.orient][props.slant]);
        }
        // Highlight axis labels that return true for props.highlightTick.
        if (props.highlightTick) {
          const activeBounds = [];
          const passiveBounds = [];
          tickTexts.classed("hidden", false).classed("active", d => {
            var _props$highlightTick;
            return ((_props$highlightTick = props.highlightTick) === null || _props$highlightTick === void 0 ? void 0 : _props$highlightTick.call(props, d)) || false;
          });
          // Hide axis labels that overlap with highlighted labels unless
          // the labels are slanted (in which case the bounding boxes overlap)
          if ((props.hideLabelThreshold || 0) > 0 && !props.slant) {
            tickTexts.each(function (d) {
              var _props$highlightTick2;
              // although getBoundingClientRect returns coordinates relative to the window, not the document,
              // this should still work, since all tick bounds are affected equally by scroll position changes.
              const bcr = this.getBoundingClientRect();
              const b = {
                node: this,
                bounds: {
                  top: bcr.top,
                  right: bcr.right,
                  bottom: bcr.bottom,
                  left: bcr.left
                }
              };
              if ((_props$highlightTick2 = props.highlightTick) !== null && _props$highlightTick2 !== void 0 && _props$highlightTick2.call(props, d)) {
                b.bounds.left -= props.hideLabelThreshold || 0;
                b.bounds.right += props.hideLabelThreshold || 0;
                activeBounds.push(b);
              } else {
                passiveBounds.push(b);
              }
            });
            for (const active of activeBounds) {
              for (const passive of passiveBounds) {
                d3.select(passive.node).classed("hidden", boundsOverlap(passive.bounds, active.bounds));
              }
            }
          }
        }
        if (props.title) {
          const title = group.selectAll(".sszvis-axis__title").data([props.title]).join("text").classed("sszvis-axis__title", true);
          title.text(d => d).attr("transform", () => {
            const orient = props.orient,
              axisScaleExtent = range(axisScale);
            const titleProps = props.titleCenter ? {
              left: orient === "left" || orient === "right" ? 0 : orient === "top" || orient === "bottom" ? (axisScaleExtent[0] + axisScaleExtent[1]) / 2 : 0,
              top: orient === "left" || orient === "right" ? (axisScaleExtent[0] + axisScaleExtent[1]) / 2 : orient === "top" ? 0 : orient === "bottom" ? 32 : 0,
              vertical: !!props.titleVertical
            } : {
              left: orient === "left" || orient === "right" || orient === "top" ? 0 : orient === "bottom" ? axisScaleExtent[1] : 0,
              top: orient === "left" || orient === "right" || orient === "top" ? 0 : orient === "bottom" ? 32 : 0,
              vertical: !!props.titleVertical
            };
            titleProps.left += props.dxTitle || 0;
            titleProps.top += props.dyTitle || 0;
            return "translate(" + titleProps.left + ", " + titleProps.top + ") rotate(" + (titleProps.vertical ? "-90" : "0") + ")";
          }).style("text-anchor", () => {
            const orient = props.orient;
            if (props.titleAnchor === undefined) {
              switch (orient) {
                case "left":
                  {
                    return "end";
                  }
                case "right":
                  {
                    return "start";
                  }
                case "top":
                case "bottom":
                  {
                    return "end";
                  }
                default:
                  {
                    return null;
                  }
              }
            } else {
              return props.titleAnchor;
            }
          });
        }
        /**
         * Add a background to axis labels to make them more readable on
         * colored backgrounds
         */
        if (props.contour && props.slant) {
          warn("Can't apply contour to slanted labels");
        } else if (props.contour) {
          tickGroups.each(function () {
            const g = d3.select(this);
            const textNode = g.select("text").node();
            let textContour = g.select(".sszvis-axis__label-contour");
            if (textContour.empty() && textNode && "cloneNode" in textNode) {
              textContour = d3.select(textNode.cloneNode(true)).classed("sszvis-axis__label-contour", true);
              const contourNode = textContour.node();
              if (contourNode) this.insertBefore(contourNode, textNode);
            }
            if (textNode && "textContent" in textNode) {
              textContour.text(textNode.textContent || "");
            }
          });
        }
      });
    }
    const setOrdinalTicks = function (count) {
      // in this function, the 'this' context should be an sszvis.axis
      const domain = this.scale().domain(),
        values = [],
        step = Math.round(domain.length / count);
      // include the first value
      if (domain[0] !== undefined) values.push(domain[0]);
      for (let i = step, l = domain.length; i < l - 1; i += step) {
        if (domain[i] !== undefined) values.push(domain[i]);
      }
      // include the last value, unless it is the first one again — a single-element domain
      // would otherwise render two identical, overlapping ticks
      if (domain.length > 1 && domain[domain.length - 1] !== undefined) {
        values.push(domain[domain.length - 1]);
      }
      this.tickValues(values);
      return count;
    };
    const axisX = () => axis().yOffset(2) //gap between chart and x-axis
    .ticks(3).tickSizeInner(4).tickSizeOuter(6.5).tickPadding(6)
    // The x-axis is numeric; arity(1, ...) drops the index d3 passes as a second argument.
    .tickFormat(arity(1, formatNumber));
    axisX.time = () => axisX().tickFormat(formatAxisTimeFormat).alignOuterLabels(true);
    axisX.ordinal = () => axisX()
    // extend this class a little with a custom implementation of 'ticks'
    // that allows you to set a custom number of ticks,
    // including the first and last value in the ordinal scale
    .prop("ticks", setOrdinalTicks).tickFormat(formatText);
    // need to be a little tricky to get the built-in d3.axis to display as if the underlying scale is discontinuous
    axisX.pyramid = () => axisX().ticks(10).prop("scale", function (s) {
      const extended = s.copy();
      const scaleWithMethods = extended;
      const extendedDomain = scaleWithMethods.domain();
      const extendedRange = scaleWithMethods.range();
      const mirroredDomain = [-extendedDomain[1], extendedDomain[1]];
      const mirroredRange = [extendedRange[0] - extendedRange[1], extendedRange[0] + extendedRange[1]];
      scaleWithMethods.domain(mirroredDomain);
      scaleWithMethods.range(mirroredRange);
      this._scale = extended;
      return extended;
    }).tickFormat(v =>
    // this tick format means that the axis appears to be divergent around 0
    // when in fact it is -domain[1] -> +domain[1]
    formatNumber(Math.abs(v)));
    const axisY = () => {
      const newAxis = axis().ticks(6).tickSize(0).tickPadding(0).tickFormat(d => 0 === d && !newAxis.showZeroY() ? null : formatNumber(d)).vertical(true);
      return newAxis;
    };
    axisY.time = () => axisY().tickFormat(formatAxisTimeFormat);
    axisY.ordinal = () => axisY()
    // add custom 'ticks' function
    .prop("ticks", setOrdinalTicks).tickFormat(formatText);
    /* Helper functions
    ----------------------------------------------- */
    function absDistance(a, b) {
      return Math.abs(a - b);
    }
    function boundsOverlap(boundsA, boundsB) {
      return !(boundsB.left > boundsA.right || boundsB.right < boundsA.left || boundsB.top > boundsA.bottom || boundsB.bottom < boundsA.top);
    }
    const slantLabel = {
      top: {
        horizontal(selection) {
          selection.style("text-anchor", "middle").attr("dx", "-0.5").attr("dy", "0.71em").attr("transform", null);
        },
        vertical(selection) {
          selection.style("text-anchor", "start").attr("dx", "0em").attr("dy", "0.35em") // vertically-center
          .attr("transform", "rotate(-90)");
        },
        diagonal(selection) {
          selection.style("text-anchor", "start").attr("dx", "0.1em").attr("dy", "0.1em").attr("transform", "translate(-0.5) rotate(-45)");
        }
      },
      bottom: {
        horizontal(selection) {
          selection.style("text-anchor", "middle").attr("dx", "-0.5").attr("dy", "0.71em").attr("transform", null);
        },
        vertical(selection) {
          selection.style("text-anchor", "end").attr("dx", "-1em").attr("dy", "-0.75em").attr("transform", "rotate(-90)");
        },
        diagonal(selection) {
          selection.style("text-anchor", "end").attr("dx", "-0.8em").attr("dy", "0em").attr("transform", "rotate(-45)");
        }
      },
      left: {
        horizontal(selection) {
          selection.style("text-anchor", "middle").attr("dx", "-0.5").attr("dy", "0.71em").attr("transform", null);
        },
        vertical(selection) {
          selection.style("text-anchor", "middle").attr("dx", "0em").attr("dy", "0.35em").attr("transform", "rotate(-90)");
        },
        diagonal(selection) {
          selection.style("text-anchor", "end").attr("dx", "-0.8em").attr("dy", "0em").attr("transform", "rotate(-45)");
        }
      },
      right: {
        horizontal(selection) {
          selection.style("text-anchor", "middle").attr("dx", "-0.5").attr("dy", "0.71em").attr("transform", null);
        },
        vertical(selection) {
          selection.style("text-anchor", "middle").attr("dx", "0em").attr("dy", "0.35em").attr("transform", "rotate(-90)");
        },
        diagonal(selection) {
          selection.style("text-anchor", "start").attr("dx", "0.1em").attr("dy", "0.1em").attr("transform", "rotate(-45)");
        }
      }
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
    function move () {
      const event = d3.dispatch("start", "move", "drag", "end");
      const moveComponent = component().prop("debug").prop("xScale").prop("yScale").prop("draggable").prop("cancelScrolling", functor).cancelScrolling(false).prop("fireOnPanOnly", functor).fireOnPanOnly(false).prop("padding", p => {
        const defaults = {
          top: 0,
          left: 0,
          bottom: 0,
          right: 0
        };
        for (const prop in p) {
          const key = prop;
          if (key in defaults && p[key] !== undefined) {
            defaults[key] = p[key];
          }
        }
        return defaults;
      }).padding({}).render(function () {
        const selection = d3.select(this);
        const props = selection.props();
        const xExtent = range(props.xScale).sort(d3.ascending);
        const yExtent = range(props.yScale).sort(d3.ascending);
        xExtent[0] -= props.padding.left;
        xExtent[1] += props.padding.right;
        yExtent[0] -= props.padding.top;
        yExtent[1] += props.padding.bottom;
        const layer = selection.selectAll("[data-sszvis-behavior-move]").data([0]).join("rect").attr("data-sszvis-behavior-move", "").attr("class", "sszvis-interactive");
        if (props.draggable) {
          layer.classed("sszvis-interactive--draggable", true);
        }
        layer.attr("x", xExtent[0]).attr("y", yExtent[0]).attr("width", xExtent[1] - xExtent[0]).attr("height", yExtent[1] - yExtent[0]).attr("fill", "transparent").on("mouseover", function () {
          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }
          if (this) event.apply("start", this, args);
        }).on("mousedown", function () {
          for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
            args[_key2] = arguments[_key2];
          }
          const target = this;
          const doc = d3.select(document);
          const win = d3.select(window);
          const startDragging = () => {
            target.__dragging__ = true;
          };
          const stopDragging = () => {
            target.__dragging__ = false;
            win.on("mousemove.sszvis-behavior-move", null);
            doc.on("mouseout.sszvis-behavior-move", null);
            if (target) event.apply("end", target, args);
          };
          win.on("mouseup.sszvis-behavior-move", stopDragging);
          doc.on("mouseout.sszvis-behavior-move", () => {
            // toElement is a legacy, non-standard alias for relatedTarget and is not in
            // the DOM types; read it reflectively rather than restating the event's type.
            const legacyToElement = Reflect.get(args[0], "toElement");
            const from = args[0].relatedTarget || (legacyToElement instanceof Element ? legacyToElement : null);
            if (!from || from.nodeName === "HTML") {
              stopDragging();
            }
          });
          startDragging();
        }).on("mousemove", function (e) {
          const target = this;
          if (!target) return;
          // Skip touch-originated mouse events on devices that support both
          // This check helps avoid duplicate event handling on touch devices
          const sourceCapabilities = e.sourceCapabilities;
          if (sourceCapabilities !== null && sourceCapabilities !== void 0 && sourceCapabilities.firesTouchEvents) return;
          let xy;
          try {
            xy = d3.pointer(e);
          } catch (_unused) {
            // Silently fail on invalid events (e.g., when pointer() throws due to invalid coordinates)
            return;
          }
          // Validate coordinates are finite numbers
          if (!Number.isFinite(xy[0]) || !Number.isFinite(xy[1])) return;
          const x = scaleInvert(props.xScale, xy[0]);
          const y = scaleInvert(props.yScale, xy[1]);
          if (target.__dragging__) {
            event.apply("drag", target, [e, x, y]);
          } else {
            event.apply("move", target, [e, x, y]);
          }
        }).on("mouseout", function () {
          for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
            args[_key3] = arguments[_key3];
          }
          if (this) event.apply("end", this, args);
        }).on("touchstart", function (e) {
          const target = this;
          if (!target) return;
          // Extract touch coordinates manually for Safari mobile compatibility.
          // On Safari mobile, TouchEvent objects don't have clientX/clientY properties -
          // those are on the Touch object inside event.touches[0]. D3's pointer() function
          // expects clientX/clientY on the event itself, causing it to return NaN on Safari.
          const touch = firstTouch(e);
          if (!touch) return;
          // Validate coordinates exist and are finite
          if (typeof touch.clientX !== "number" || !Number.isFinite(touch.clientX) || typeof touch.clientY !== "number" || !Number.isFinite(touch.clientY)) {
            return;
          }
          // Calculate coordinates relative to element manually using getBoundingClientRect
          // instead of relying on d3.pointer() which fails on Safari mobile TouchEvents
          const rect = target.getBoundingClientRect();
          const xy = [touch.clientX - rect.left, touch.clientY - rect.top];
          const x = scaleInvert(props.xScale, xy[0]);
          const y = scaleInvert(props.yScale, xy[1]);
          const cancelScrolling = props.cancelScrolling(x, y);
          if (cancelScrolling) {
            e.preventDefault();
          }
          // if fireOnPanOnly => cancelScrolling must be true
          // if !fireOnPanOnly => always fire events
          // This is in place because this behavior needs to only fire
          // events on a successful "pan" action in the bar charts, i.e.
          // only when scrolling is prevented, but then it also needs to fire
          // events all the time in the line and area charts, i.e. allow
          // scrolling to continue as normal but also fire events.
          // To configure the chart for use in the bar charts, you need
          // to configure a cancelScrolling function for determining when to
          // cancel scrolling, i.e. what constitutes a "pan" event, and also
          // pass fireOnPanOnly = true, which flips this switch and relies on
          // cancelScrolling to determine whether to fire the events.
          if (!props.fireOnPanOnly() || cancelScrolling) {
            event.apply("start", target, [e, x, y]);
            event.apply("drag", target, [e, x, y]);
            event.apply("move", target, [e, x, y]);
            const pan = panEvent => {
              // Extract touch from the new touchmove event, not the original touchstart event
              const panTouch = firstTouch(panEvent);
              if (!panTouch) return;
              // Validate coordinates
              if (typeof panTouch.clientX !== "number" || !Number.isFinite(panTouch.clientX) || typeof panTouch.clientY !== "number" || !Number.isFinite(panTouch.clientY)) {
                return;
              }
              // Calculate coordinates relative to element manually
              const panRect = target.getBoundingClientRect();
              const panXY = [panTouch.clientX - panRect.left, panTouch.clientY - panRect.top];
              const panX = scaleInvert(props.xScale, panXY[0]);
              const panY = scaleInvert(props.yScale, panXY[1]);
              const panCancelScrolling = props.cancelScrolling(panX, panY);
              if (panCancelScrolling) {
                panEvent.preventDefault();
              }
              // See comment above about the same if condition.
              if (!props.fireOnPanOnly() || panCancelScrolling) {
                event.apply("drag", target, [panEvent, panX, panY]);
                event.apply("move", target, [panEvent, panX, panY]);
              } else {
                event.apply("end", target, [panEvent]);
              }
            };
            const end = endEvent => {
              event.apply("end", target, [endEvent]);
              d3.select(target).on("touchmove", null).on("touchend", null);
            };
            d3.select(target).on("touchmove", pan).on("touchend", end);
          }
        });
        if (props.debug) {
          layer.attr("fill", "rgba(255,0,0,0.2)");
        }
      });
      moveComponent.on = function () {
        for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
          args[_key4] = arguments[_key4];
        }
        const value = event.on.apply(event, args);
        return value === event ? moveComponent : value;
      };
      return moveComponent;
    }
    function scaleInvert(scale, px) {
      if ("invert" in scale) {
        return scale.invert(px);
      } else if ("paddingInner" in scale) {
        return invertBandScale(scale, px);
      } else {
        return invertPointScale(scale, px);
      }
    }
    function invertBandScale(scale, px) {
      const step = scale.step();
      const paddingOuter = scale.paddingOuter() * step;
      const paddingInner = scale.paddingInner() * step;
      const bandWidth = scale.bandwidth();
      const scaleRange = scale.range();
      const domain = scale.domain();
      if (domain.length === 1) {
        if (scaleRange[0] <= px && scaleRange[1] >= px) {
          return domain[0];
        }
        return null;
      }
      const ranges = domain.map((_d, i) => {
        if (i === 0) {
          return [scaleRange[0], scaleRange[0] + paddingOuter + bandWidth + paddingInner / 2];
        } else if (i === domain.length - 1) {
          return [scaleRange[1] - (paddingOuter + bandWidth + paddingInner / 2), scaleRange[1]];
        } else {
          return [scaleRange[0] + paddingOuter + i * step - paddingInner / 2, scaleRange[0] + paddingOuter + (i + 1) * step - paddingInner / 2];
        }
      });
      for (let i = 0, l = ranges.length; i < l; i++) {
        if (ranges[i][0] < px && px <= ranges[i][1]) {
          return domain[i];
        }
      }
      return null;
    }
    function invertPointScale(scale, px) {
      const step = scale.step();
      const paddingOuter = scale.padding() * step;
      const scaleRange = scale.range();
      const domain = scale.domain();
      if (domain.length === 1) {
        if (scaleRange[0] <= px && scaleRange[1] >= px) {
          return domain[0];
        }
        return null;
      }
      const ranges = domain.map((_d, i) => {
        if (i === 0) {
          return [scaleRange[0], scaleRange[0] + paddingOuter + step / 2];
        } else if (i === domain.length - 1) {
          return [scaleRange[1] - (paddingOuter + step / 2), scaleRange[1]];
        } else {
          return [scaleRange[0] + paddingOuter + i * step - step / 2, scaleRange[0] + paddingOuter + i * step + step / 2];
        }
      });
      for (let i = 0, l = ranges.length; i < l; i++) {
        if (ranges[i][0] < px && px <= ranges[i][1]) {
          return domain[i];
        }
      }
      return null;
    }

    /**
     * Behavior utilities
     *
     * These utilities are intended for internal usage by the sszvis.behavior components.
     * They aren't intended for use in example code, but should be in a separate module
     * because they are accessed by several different behavior components.
     *
     * @function {Event} elementFromEvent             Accepts an event, and returns the element, if any,
     *                                                which is in the document under that event. Uses
     *                                                document.elementFromPoint to determine the element.
     *                                                If there is no such element, or the event is invalid,
     *                                                this function will return null.
     * @function {Element} datumFromPannableElement   Accepts an element, determines if it's "pannable",
     *                                                and returns the datum, if any, attached to this element.
     *                                                This is determined by the presence of the data-sszvis-behavior-pannable
     *                                                attribute on the element. Behaviors which use "panning" behavior
     *                                                will attach this attribute to the elements they target.
     *                                                Elements which have panning behaviors attached to them
     *                                                will get this attribute assigned to them. If the element doesn't
     *                                                have this attriute, or doesn't have a datum assigned, this funciton
     *                                                returns null.
     * @function {Event} datumFromPanEvent            A combination of elementFromEvent and datumFromPannableElement, which
     *                                                accepts an event and returns the datum attached to the element under
     *                                                that event, if such an element and such a datum exists.
     * @function {Number, Object, Function, Number} testBarThreshold        This function is a convenience function for encapsulating
     *                                                                      the test which should be performed on a touch interaction,
     *                                                                      to see whether the touch falls within the "profile" of a bar
     *                                                                      chart. If so, that is, if the test passes, then scrolling should
     *                                                                      be prevented on the bar charts, and a tooltip should be shown.
     *                                                                      This is the behavior known as "panning" over the surface of the chart,
     *                                                                      while on a mobile device. The function returns true if the touch is
     *                                                                      considered to be within the "profile" of the bar chart, and false otherwise.
     *                                                                      The function takes four arguments:
     *                                                                        cursorValue - This the value, specified in the same units as the original
     *                                                                                      data, at the touch event's position. This value is
     *                                                                                      automatically calculated by the 'move' behavior,
     *                                                                                      by inverting the scale used for the bar charts' extent.
     *                                                                        datum -       This is the data value at the touch event's position,
     *                                                                                      against which you are comparing the profile. Since data
     *                                                                                      values all live in user-land, you should retrieve this
     *                                                                                      datum yourself. Usually this can be done by using the
     *                                                                                      inverted value from the other axis of the bar chart,
     *                                                                                      and searching the data for the datum which matches that
     *                                                                                      value. However, note that the datum argument can be
     *                                                                                      undefined, in which case the touch is considered invalid and
     *                                                                                      the test will return false.
     *                                                                        accessor -    This is an accessor function for retrieving a numeric value
     *                                                                                      from the datum. This function should be used to retrieve out
     *                                                                                      of the datum the value against which cursorValue is compared.
     *                                                                        threshold -   A small threshold, specified in datum units, i.e. in the units
     *                                                                                      of the domain (NOT the range) of the scale function. When a bar
     *                                                                                      value is very small, or 0, or NaN, it would be impossible to have
     *                                                                                      a touch which is over the "profile" of this bar. So in those cases,
     *                                                                                      we consider the touch to be within the profile if it and the data
     *                                                                                      value are under this threshold. This number should be some small
     *                                                                                      number in the data's domain, and will be compared against both
     *                                                                                      cursorValue and the value accessed from the datum.
     */
    const elementFromEvent = evt => {
      if (!isNull(evt) && defined(evt)) {
        return document.elementFromPoint(evt.clientX, evt.clientY);
      }
      return null;
    };
    const datumFromPannableElement = element => {
      if (!isNull(element)) {
        const selection = d3.select(element);
        if (!isNull(selection.attr("data-sszvis-behavior-pannable"))) {
          const datum = selection.datum();
          if (defined(datum)) {
            return datum;
          }
        }
      }
      return null;
    };
    const datumFromPanEvent = panEvent => {
      const element = elementFromEvent(panEvent);
      return datumFromPannableElement(element);
    };

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
    function panning () {
      const event = d3.dispatch("start", "pan", "end");
      const panningComponent = component().prop("elementSelector").render(function () {
        const selection = d3.select(this);
        const props = selection.props();
        const elements = selection.selectAll(props.elementSelector);
        elements.attr("data-sszvis-behavior-pannable", "").classed("sszvis-interactive", true).on("mouseenter", function () {
          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }
          if (this) event.apply("start", this, args);
        }).on("mousemove", function () {
          for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
            args[_key2] = arguments[_key2];
          }
          if (this) event.apply("pan", this, args);
        }).on("mouseleave", function () {
          for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
            args[_key3] = arguments[_key3];
          }
          if (this) event.apply("end", this, args);
        }).on("touchstart", function () {
          for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
            args[_key4] = arguments[_key4];
          }
          args[0].preventDefault();
          if (this) event.apply("start", this, args);
        }).on("touchmove", function () {
          for (var _len5 = arguments.length, args = new Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
            args[_key5] = arguments[_key5];
          }
          args[0].preventDefault();
          const datum = datumFromPanEvent(firstTouch(args[0]));
          if (datum === null) {
            if (this) event.apply("end", this, args);
          } else {
            if (this) event.apply("pan", this, args);
          }
        }).on("touchend", function () {
          for (var _len6 = arguments.length, args = new Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
            args[_key6] = arguments[_key6];
          }
          if (this) event.apply("end", this, args);
        });
      });
      panningComponent.on = function () {
        for (var _len7 = arguments.length, args = new Array(_len7), _key7 = 0; _key7 < _len7; _key7++) {
          args[_key7] = arguments[_key7];
        }
        const value = event.on.apply(event, args);
        return value === event ? panningComponent : value;
      };
      return panningComponent;
    }

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
    function voronoi () {
      const event = d3.dispatch("over", "out");
      const voronoiComponent = component().prop("x").prop("y").prop("bounds").prop("debug").render(function (data) {
        const selection = d3.select(this);
        const props = selection.props();
        if (!props.bounds) {
          error("behavior.voronoi - requires bounds");
          return;
        }
        const delaunay = d3.Delaunay.from(data, d => props.x(d), d => props.y(d));
        const voronoi = delaunay.voronoi(props.bounds);
        const polys = selection.selectAll("[data-sszvis-behavior-voronoi]").data(voronoi.cellPolygons()).join("path").attr("data-sszvis-behavior-voronoi", "").attr("data-sszvis-behavior-pannable", "").attr("class", "sszvis-interactive");
        polys.attr("d", d => "M".concat(d.join("L"), "Z")).attr("fill", "transparent").on("mouseover", function (e) {
          const parent = this.parentNode;
          if (!parent) return;
          const cbox = parent.getBoundingClientRect();
          const datumIdx = delaunay.find(e.clientX - cbox.left, e.clientY - cbox.top);
          if (eventNearPoint(e, [cbox.left + props.x(data[datumIdx]), cbox.top + props.y(data[datumIdx])]) && this) event.apply("over", this, [e, data[datumIdx]]);
        }).on("mousemove", function (e) {
          const parent = this.parentNode;
          if (!parent) return;
          const cbox = parent.getBoundingClientRect();
          const datumIdx = delaunay.find(e.clientX - cbox.left, e.clientY - cbox.top);
          if (eventNearPoint(e, [cbox.left + props.x(data[datumIdx]), cbox.top + props.y(data[datumIdx])])) {
            if (this) event.apply("over", this, [e, data[datumIdx]]);
          } else {
            if (this) event.apply("out", this, [e]);
          }
        }).on("mouseout", function () {
          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }
          if (this) event.apply("out", this, args);
        }).on("touchstart", function (e) {
          const parent = this.parentNode;
          if (!parent) return;
          const cbox = parent.getBoundingClientRect();
          const firstTouch$1 = firstTouch(e);
          if (!firstTouch$1) return;
          const datumIdx = delaunay.find(firstTouch$1.clientX - cbox.left, firstTouch$1.clientY - cbox.top);
          if (eventNearPoint(firstTouch$1, [cbox.left + props.x(data[datumIdx]), cbox.top + props.y(data[datumIdx])])) {
            e.preventDefault();
            if (this) event.apply("over", this, [e, data[datumIdx]]);
            const pan = () => {
              const touchEvent = firstTouch(e);
              if (!touchEvent) return;
              const element = elementFromEvent(touchEvent);
              const panDatum = datumFromPannableElement(element);
              if (panDatum === null) {
                if (this) event.apply("out", this, [e]);
              } else {
                const panParent = element === null || element === void 0 ? void 0 : element.parentNode;
                if (!panParent) return;
                const panCbox = panParent.getBoundingClientRect();
                if (eventNearPoint(touchEvent, [panCbox.left + props.x(panDatum.data), panCbox.top + props.y(panDatum.data)])) {
                  // This event won't be cancelable if you start touching outside the hit area of a voronoi center,
                  // then start scrolling, then move your finger over the hit area of a voronoi center. The browser
                  // says you are "still scrolling" and won't let you cancel the event. It will issue a warning, which
                  // we want to avoid.
                  if (e.cancelable) {
                    e.preventDefault();
                  }
                  if (this) event.apply("over", this, [e, panDatum.data]);
                } else {
                  if (this) event.apply("out", this, [e]);
                }
              }
            };
            const end = () => {
              if (this) event.apply("out", this, [e]);
              d3.select(this).on("touchmove", null).on("touchend", null);
            };
            d3.select(this).on("touchmove", pan).on("touchend", end);
          }
        });
        if (props.debug) {
          polys.attr("stroke", "#f00");
        }
      });
      voronoiComponent.on = function () {
        for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
          args[_key2] = arguments[_key2];
        }
        const value = event.on.apply(event, args);
        return value === event ? voronoiComponent : value;
      };
      return voronoiComponent;
    }
    // Perform distance calculations in units squared to avoid a costly Math.sqrt
    const MAX_INTERACTION_RADIUS_SQUARED = 15 ** 2;
    function eventNearPoint(event, point) {
      const dx = event.clientX - point[0];
      const dy = event.clientY - point[1];
      return dx * dx + dy * dy < MAX_INTERACTION_RADIUS_SQUARED;
    }

    /**
     * A collection of utilities to measure elements
     *
     * @module sszvis/measure
     */
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
    const measureDimensions = arg => {
      const node = measurableNode(arg);
      return {
        width: node ? node.getBoundingClientRect().width : undefined,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight
      };
    };
    /**
     * The element a MeasurableElement refers to, or null when there is nothing to measure.
     *
     * Takes `unknown` rather than the generic parameter type: the three cases are told apart at
     * runtime, and callers do pass null - the width is reported as undefined for it, which
     * test/measure.test.ts pins.
     */
    function measurableNode(arg) {
      if (isString(arg)) return d3.select(arg).node();
      if (isSelection(arg)) {
        // A selection's node may be any BaseType, but only an Element can be measured.
        const selected = arg.node();
        return selected instanceof Element ? selected : null;
      }
      return arg instanceof Element ? arg : null;
    }
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
    const measureText = (() => {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) throw new Error("[measureText] Could not acquire a 2d canvas context");
      const cache = {};
      return (fontSize, fontFace, text) => {
        const key = [fontSize, fontFace, text].join("-");
        context.font = "".concat(fontSize, "px ").concat(fontFace);
        return cache[key] || context.measureText(text).width;
      };
    })();
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
    const measureAxisLabel = text => measureText(10, "Arial, sans-serif", text);
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
    const measureLegendLabel = text => measureText(12, "Arial, sans-serif", text);

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
    const DEFAULT_WIDTH = 516;
    function bounds(arg1, arg2) {
      var _dimensions$width;
      let _bounds = {};
      let selection = null;
      if (arguments.length === 0) {
        _bounds = {};
      } else if (arguments.length === 1) {
        if (isObject(arg1)) {
          _bounds = arg1;
        } else if (isSelection(arg1)) {
          _bounds = {};
          selection = arg1;
        } else {
          _bounds = {};
          selection = d3.select(arg1);
        }
      } else {
        _bounds = arg1;
        selection = isSelection(arg2) ? arg2 : d3.select(arg2);
      }
      // All padding sides have default values
      const padding = {
        top: either(_bounds.top, 0),
        right: either(_bounds.right, 1),
        bottom: either(_bounds.bottom, 0),
        left: either(_bounds.left, 1)
      };
      // Width is calculated as: _bounds.width (if provided) -> selection.getBoundingClientRect().width (if provided) -> DEFAULT_WIDTH
      const dimensions = defined(selection) ? measureDimensions(selection) : {
        width: DEFAULT_WIDTH,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight
      };
      const width = either(_bounds.width, (_dimensions$width = dimensions.width) !== null && _dimensions$width !== void 0 ? _dimensions$width : DEFAULT_WIDTH);
      // Create measurement object for aspectRatioAuto that matches the Measurement interface
      const measurement = {
        width: width,
        screenHeight: dimensions.screenHeight
      };
      const innerHeight = aspectRatioAuto(measurement);
      const height = either(_bounds.height, innerHeight + padding.top + padding.bottom);
      return {
        innerHeight: height - padding.top - padding.bottom,
        innerWidth: width - padding.left - padding.right,
        padding,
        height,
        width,
        screenWidth: dimensions.screenWidth,
        screenHeight: dimensions.screenHeight
      };
    }
    // This is the default aspect ratio. It is defined as: width / innerHeight
    // See the Offerte document for SSZVIS 1.3, and here: https://basecamp.com/1762663/projects/10790469/todos/212434984
    // To calculate the default innerHeight, do width / ASPECT_RATIO
    // @deprecated Since the responsive revisions, the default aspect ratio has changed,
    //             so that it is now responsive to the container width.
    //             This property is preserved for compatibility reasons.
    const RATIO = 16 / 9;
    /* Helper functions
    ----------------------------------------------- */
    function either(val, fallback) {
      return val === undefined ? fallback : val;
    }

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
    function groupBy(data, keyFunc) {
      const group = {};
      let key;
      for (let i = 0, l = data.length, value; i < l; ++i) {
        value = data[i];
        key = keyFunc(value);
        const keyStr = String(key);
        if (group[keyStr]) {
          group[keyStr].push(value);
        } else {
          group[keyStr] = [value];
        }
      }
      return group;
    }
    function groupEach(data, func) {
      for (const prop in data) {
        func(data[prop], prop);
      }
    }
    function arrEach(arr, func) {
      for (let i = 0, l = arr.length; i < l; ++i) {
        func(arr[i], i);
      }
    }
    function cascade() {
      const _cascade = {};
      const keys = [];
      // Stored as a string sorter: the grouping stringifies its keys, so that is what a
      // sorter is handed at runtime whatever K the caller declared.
      const sorts = [];
      let valuesSort;
      function make(data, depth) {
        if (depth >= keys.length) {
          if (valuesSort) data.sort(valuesSort);
          return data;
        }
        const sorter = sorts[depth];
        const key = keys[depth];
        const nextDepth = depth + 1;
        const grouped = groupBy(data, key.func);
        if (key.type === "obj") {
          const obj = {};
          groupEach(grouped, (value, k) => {
            obj[k] = make(value, nextDepth);
          });
          return obj;
        }
        // key.type is "obj" | "arr", so the remaining case is "arr".
        {
          const arr = [];
          if (sorter) {
            const groupKeys = Object.keys(grouped).sort(sorter);
            arrEach(groupKeys, k => {
              arr.push(make(grouped[k], nextDepth));
            });
          } else {
            groupEach(grouped, value => {
              arr.push(make(value, nextDepth));
            });
          }
          return arr;
        }
      }
      _cascade.apply = data => make(data, 0);
      _cascade.objectBy = accessor => {
        keys.push({
          type: "obj",
          func: accessor
        });
        return _cascade;
      };
      _cascade.arrayBy = (accessor, sorter) => {
        keys.push({
          type: "arr",
          func: accessor
        });
        if (sorter) sorts[keys.length - 1] = sorter;
        return _cascade;
      };
      _cascade.sort = sorter => {
        valuesSort = sorter;
        return _cascade;
      };
      return _cascade;
    }

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
    /* Constants
    ----------------------------------------------- */
    const LIGHTNESS_STEP = 1;
    /* Scales
    ----------------------------------------------- */
    function qualColorScale(colors) {
      return () => {
        const scale = d3.scaleOrdinal().range(colors.map(convertLab));
        // Set unknown to first color without the type constraint
        scale.unknown(convertLab(colors[0]));
        return decorateOrdinalScale(scale);
      };
    }
    const black = "#000000";
    const white = "#FFFFFF";
    const darkBlue = "#3431DE";
    const mediumBlue = "#0A8DF6";
    const lightBlue = "#23C3F1";
    const darkRed = "#7B4FB7";
    const mediumRed = "#DB247D";
    const lightRed = "#FB737E";
    const darkGreen = "#007C78";
    const mediumGreen = "#1D942E";
    const lightGreen = "#99C32E";
    const darkBrown = "#9A5B01";
    const mediumBrown = "#FF720C";
    const lightBrown = "#FBB900";
    const scaleQual12 = qualColorScale([darkBlue, mediumBlue, lightBlue, darkRed, mediumRed, lightRed, darkGreen, mediumGreen, lightGreen, darkBrown, mediumBrown, lightBrown]);
    const scaleQual6 = qualColorScale([darkBlue, mediumRed, mediumGreen, lightBrown, lightBlue, mediumBrown]);
    const scaleQual6a = qualColorScale([darkBlue, mediumBlue, lightBlue, darkRed, mediumRed, lightRed]);
    const scaleQual6b = qualColorScale([darkGreen, mediumGreen, lightGreen, darkBrown, mediumBrown, lightBrown]);
    const female = "#349894";
    const male = "#FFD736";
    const misc = "#986AD5";
    const scaleGender3 = () => qualColorScale([female, male, misc])().domain(["Frauen", "Männer", "Divers"]);
    const swissFemale = "#00615D";
    const foreignFemale = "#349894";
    const swissMale = "#DA9C00";
    const foreignMale = "#FFD736";
    const swissMisc = "#5E359A";
    const foreignMisc = "#986AD5";
    const scaleGender6Origin = () => qualColorScale([swissFemale, foreignFemale, swissMale, foreignMale, swissMisc, foreignMisc])().domain(["Schweizerinnen", "Ausländerinnen", "Schweizer", "Ausländer", "Divers Schweiz", "Divers Ausland"]);
    const femaleFemale = "#349894";
    const maleMale = "#FFD736";
    const femaleMale = "#3431DE";
    const femaleUnknown = "#B8B8B8";
    const maleUnknown = "#D6D6D6";
    const scaleGender5Wedding = () => qualColorScale([femaleFemale, maleMale, femaleMale, femaleUnknown, maleUnknown])().domain(["Frau / Frau", "Mann / Mann", "Frau / Mann", "Frau / Unbekannt", "Mann / Unbekannt"]);
    function seqColorScale(colors) {
      return () => {
        const scale = d3.scaleLinear().range(colors.map(convertLab));
        return decorateLinearScale(scale);
      };
    }
    const scaleSeqBlu = seqColorScale(["#CADEFF", "#5B6EFF", "#211A8A"]);
    const scaleSeqRed = seqColorScale(["#FED2EE", "#ED408D", "#7D0044"]);
    const scaleSeqGrn = seqColorScale(["#CFEED8", "#34B446", "#0C4B1F"]);
    const scaleSeqBrn = seqColorScale(["#FCDDBB", "#EA5D00", "#611F00"]);
    function divColorScale(colors) {
      return () => {
        const scale = d3.scaleLinear().range(colors.map(convertLab));
        return decorateDivScale(scale);
      };
    }
    const scaleDivVal = divColorScale(["#611F00", "#A13200", "#EA5D00", "#FF9A54", "#FCDDBB", "#CADEFF", "#89AFFF", "#5B6EFF", "#3431DE", "#211A8A"]);
    const scaleDivValGry = divColorScale(["#782600", "#CC4309", "#FF720C", "#FFBC88", "#E4E0DF", "#AECBFF", "#6B8EFF", "#3B51FF", "#2F2ABB"]);
    const scaleDivNtr = divColorScale(["#7D0044", "#C4006A", "#ED408D", "#FF83B9", "#FED2EE", "#CFEED8", "#81C789", "#34B446", "#1A7F2D", "#0C4B1F"]);
    const scaleDivNtrGry = divColorScale(["#A30059", "#DB247D", "#FF579E", "#FFA8D0", "#E4E0DF", "#A8DBB1", "#55BC5D", "#1D942E", "#10652A"]);
    function greyColorScale(colors) {
      return () => {
        // Grey color scales are really ordinal but we treat them like linear for the API
        const scale = d3.scaleOrdinal().range(colors.map(convertLab));
        return decorateLinearScale(scale);
      };
    }
    const scaleLightGry = greyColorScale(["#FAFAFA"]);
    const scalePaleGry = greyColorScale(["#EAEAEA"]);
    const scaleGry = greyColorScale(["#D6D6D6"]);
    const scaleDimGry = greyColorScale(["#B8B8B8"]);
    const scaleMedGry = greyColorScale(["#7C7C7C"]);
    const scaleDeepGry = greyColorScale(["#545454"]);
    const slightlyDarker = c => d3.hsl(c).darker(0.4);
    const muchDarker = c => d3.hsl(c).darker(0.7);
    const withAlpha = (c, a) => {
      const rgbColor = d3.rgb(c);
      return "rgba(".concat(rgbColor.r, ",").concat(rgbColor.g, ",").concat(rgbColor.b, ",").concat(a, ")");
    };
    /* Scale extensions
    ----------------------------------------------- */
    function decorateOrdinalScale(scale) {
      const enhancedScale = scale;
      enhancedScale.darker = () => decorateOrdinalScale(scale.copy().range(scale.range().map(d => d.brighter(LIGHTNESS_STEP))));
      enhancedScale.brighter = () => decorateOrdinalScale(scale.copy().range(scale.range().map(d => d.darker(LIGHTNESS_STEP))));
      enhancedScale.reverse = () => decorateOrdinalScale(scale.copy().range(scale.range().reverse()));
      return enhancedScale;
    }
    function decorateDivScale(scale) {
      const enhancedScale = interpolatedDivergentColorScale(scale);
      enhancedScale.reverse = () => decorateLinearScale(scale.copy().range(scale.range().reverse()));
      return enhancedScale;
    }
    function interpolatedDivergentColorScale(scale) {
      const nativeDomain = scale.domain;
      if (!scale.range()) return scale;
      const length = scale.range().length;
      // Replacing the scale's own .domain in place is the whole point of these two wrappers.
      // Reflect.set writes it without having to restate the scale's type.
      const replaceDomain = function (dom) {
        if (!dom) return nativeDomain.call(this, []);
        const xDomain = [];
        for (let i = 0; i < length; i++) {
          xDomain.push(d3.quantile(dom, i / (length - 1)) || 0);
        }
        return nativeDomain.call(this, xDomain);
      };
      Reflect.set(scale, "domain", replaceDomain);
      return scale;
    }
    function decorateLinearScale(scale) {
      // Only apply interpolation to actual linear scales, not ordinal scales used for grey
      const processedScale = "interpolate" in scale ? interpolatedColorScale(scale) : scale;
      const enhancedScale = processedScale;
      enhancedScale.reverse = () => {
        const copiedScale = "copy" in scale ? scale.copy() : scale;
        return decorateLinearScale(copiedScale.range(scale.range().reverse()));
      };
      return enhancedScale;
    }
    function interpolatedColorScale(scale) {
      const nativeDomain = scale.domain;
      // Replacing the scale's own .domain in place is the whole point of these two wrappers.
      // Reflect.set writes it without having to restate the scale's type.
      const replaceDomain = function (dom) {
        if (arguments.length === 1 && dom && dom.length === 2) {
          const threeDomain = [dom[0], d3.mean(dom) || 0, dom[1]];
          return nativeDomain.call(this, threeDomain);
        } else {
          return Reflect.apply(nativeDomain, this, arguments);
        }
      };
      Reflect.set(scale, "domain", replaceDomain);
      return scale;
    }
    /* Helper functions
    ----------------------------------------------- */
    function convertLab(d) {
      return d3.lab(d);
    }
    const getAccessibleTextColor = backgroundColor => {
      if (!backgroundColor) {
        return black;
      }
      const bgColor = d3.rgb(backgroundColor);
      const gammaCorrect = c => {
        const normalized = c / 255;
        return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
      };
      const rLum = gammaCorrect(bgColor.r);
      const gLum = gammaCorrect(bgColor.g);
      const bLum = gammaCorrect(bgColor.b);
      // WCAG relative luminance formula
      const luminance = 0.2126 * rLum + 0.7152 * gLum + 0.0722 * bLum;
      return luminance > 0.179 ? black : white; // Use SSZVIS gray or white
    };

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
     * @property {boolean} transition             Whether or not to transition the geometry of the bar component when it
     *                                            changes. Defaults to true, and eases over 300ms.
     *
     * Note: entering bars receive their geometry on the join, before the transition starts, so they
     * appear in place rather than animating up from nothing. Only updates animate. fill and stroke are
     * deliberately not transitioned - a colour change jumps - because the colour scales these charts
     * use are categorical and interpolating between two category colours reads as a third category.
     *
     * Note: the geometry accessors are guarded: x, y, width and height must be finite numbers, so NaN,
     * Infinity, undefined, null and anything that does not coerce to a finite number all become 0. A
     * value that does coerce is normalised to its number, so a numeric string is written as a number.
     * See test/component/bar.test.ts.
     *
     * @return {sszvis.component}
     */
    /**
     * Coerces a geometry value to a finite number, substituting 0 for anything else.
     *
     * Coercion first, so a numeric string still works; the finiteness check then catches NaN
     * and Infinity as well as the values that do not coerce at all. Shared in substance with
     * dot's guard - the two components are expected to agree, and there is no home for the
     * helper short of a new module.
     */
    function toFinite$1(value) {
      const numeric = Number(value);
      return Number.isFinite(numeric) ? numeric : 0;
    }
    function bar() {
      return component().prop("x", functor).prop("y", functor).prop("width", functor).prop("height", functor).prop("fill", functor).prop("stroke", functor).prop("centerTooltip").prop("tooltipAnchor").prop("transition").transition(true).render(function (data) {
        const selection = d3.select(this);
        const props = selection.props();
        const xAt = (datum, index) => toFinite$1(props.x(datum, index));
        const yAt = (datum, index) => toFinite$1(props.y(datum, index));
        const wAt = (datum, index) => toFinite$1(props.width(datum, index));
        const hAt = (datum, index) => toFinite$1(props.height(datum, index));
        const fillAt = (datum, index) => {
          var _props$fill, _props$fill2;
          return (_props$fill = (_props$fill2 = props.fill) === null || _props$fill2 === void 0 ? void 0 : _props$fill2.call(props, datum, index)) !== null && _props$fill !== void 0 ? _props$fill : null;
        };
        const strokeAt = (datum, index) => {
          var _props$stroke, _props$stroke2;
          return (_props$stroke = (_props$stroke2 = props.stroke) === null || _props$stroke2 === void 0 ? void 0 : _props$stroke2.call(props, datum, index)) !== null && _props$stroke !== void 0 ? _props$stroke : null;
        };
        // Entering bars are given their geometry on the join, so they are in place before any
        // transition starts. The geometry is then applied exactly once more - to the transition
        // when there is one, and to the plain selection otherwise - so an update tweens from its
        // previous value instead of from the value it already holds.
        const bars = selection.selectAll(".sszvis-bar").data(data).join(enter => enter.append("rect").classed("sszvis-bar", true).attr("x", xAt).attr("y", yAt).attr("width", wAt).attr("height", hAt)).attr("fill", fillAt).attr("stroke", strokeAt);
        if (props.transition) {
          bars.transition(defaultTransition()).attr("x", xAt).attr("y", yAt).attr("width", wAt).attr("height", hAt);
        } else {
          bars.attr("x", xAt).attr("y", yAt).attr("width", wAt).attr("height", hAt);
        }
        // Tooltip anchors
        let tooltipPosition;
        if (props.centerTooltip) {
          tooltipPosition = (d, i) => [xAt(d, i) + wAt(d, i) / 2, yAt(d, i) + hAt(d, i) / 2];
        } else if (props.tooltipAnchor) {
          const uv = props.tooltipAnchor.map(value => Number.parseFloat(String(value)));
          tooltipPosition = (d, i) => [xAt(d, i) + uv[0] * wAt(d, i), yAt(d, i) + uv[1] * hAt(d, i)];
        } else {
          tooltipPosition = (d, i) => [xAt(d, i) + wAt(d, i) / 2, yAt(d, i)];
        }
        // tooltipAnchor declares its position accessor as taking the datum alone, but d3 calls it
        // with the index too and the anchors must line up with the bars - so the index is read here
        // and the narrower declaration is widened. The cast encodes that gap; the real fix is in
        // tooltipAnchor's own signature.
        const ta = tooltipAnchor().position(tooltipPosition);
        selection.call(ta);
      });
    }

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
     * @property {number, function} x               An accessor function or number for the x-position of the dots,
     *                                              in pixels. Becomes a functor. Required: leaving it unset throws
     *                                              before anything is rendered.
     * @property {number, function} y               An accessor function or number for the y-position of the dots,
     *                                              in pixels. Becomes a functor. Required, like x.
     * @property {number, function} radius          An accessor function or number for the radius of the dots, in
     *                                              pixels. Becomes a functor. Required, like x and y - an unwritten
     *                                              r attribute would default to 0 and render a full set of
     *                                              invisible dots. A radius of 0 is still explicitly allowed, and
     *                                              is how docs/scatterplot-over-time hides dots outside the
     *                                              selected period.
     * @property {string, function} stroke          An accessor function or string for the stroke color of the dots.
     *                                              Becomes a functor. When unset, no stroke attribute is written
     *                                              and the circles fall back to the SVG and CSS defaults.
     * @property {string, function} fill            An accessor function or string for the fill color of the dots.
     *                                              Same as stroke.
     * @property {boolean} transition               Whether or not to transition the geometry of the dot component
     *                                              when it changes. Defaults to true, and eases over 300ms.
     *
     * Note: the geometry accessors are guarded, in the same spirit as bar's guard: cx, cy and r must be
     * finite numbers, so NaN - the usual result of feeding a scale a value outside its domain - along
     * with Infinity, undefined, null and anything that does not coerce to a finite number all become 0.
     * A negative radius is clamped to 0, since a negative r is an SVG error and would drop the circle
     * altogether. The guard means a bad value parks one dot at the origin rather than removing it
     * silently. fill and stroke are not guarded; an accessor may return null or undefined there to leave
     * the attribute off.
     *
     * Note: entering dots receive their geometry on the join, before the transition starts, so they
     * appear in place rather than animating in from nothing. Only updates animate. fill and stroke are
     * deliberately not transitioned - a colour change jumps - because the colour scales these charts
     * use are categorical and interpolating between two category colours reads as a third category.
     *
     * Note: x, y and radius are read twice per datum on every render - once for the circle and once for
     * the tooltip anchor - plus a third time when transitioning, so accessors should be cheap and free
     * of side effects. The anchor ignores the radius, and is created and positioned even for a dot
     * hidden with radius 0, which leaves a live tooltip target on an invisible dot. See
     * test/component/dot.test.ts.
     *
     * @return {sszvis.component}
     */
    /**
     * Reports a required property the caller left unset, naming both the component and the
     * property. Called before the data join, so a failed configuration leaves no half-rendered
     * circles or anchors behind, and fails on the first render rather than on the first render
     * that happens to have data.
     */
    function required$4(value, name) {
      if (value === undefined) {
        throw new Error("[dot] the ".concat(name, " property is required"));
      }
      return value;
    }
    /**
     * Coerces a geometry value to a finite number, substituting 0 for anything else.
     *
     * Coercion first, so a numeric string still works; the finiteness check then catches NaN
     * and Infinity as well as the values that do not coerce at all. Shared in substance with
     * bar's guard - the two components are expected to agree, and there is no home for the
     * helper short of a new module.
     */
    function toFinite(value) {
      const numeric = Number(value);
      return Number.isFinite(numeric) ? numeric : 0;
    }
    function dot() {
      return component().prop("x", functor).prop("y", functor).prop("radius", functor).prop("stroke", functor).prop("fill", functor).prop("transition").transition(true).render(function (data) {
        const selection = d3.select(this);
        const props = selection.props();
        const xProp = required$4(props.x, "x");
        const yProp = required$4(props.y, "y");
        const radiusProp = required$4(props.radius, "radius");
        const xAt = (datum, index) => toFinite(xProp(datum, index));
        const yAt = (datum, index) => toFinite(yProp(datum, index));
        // A negative r is invalid per the SVG spec and drops the circle, so it is clamped
        // rather than passed on.
        const rAt = (datum, index) => Math.max(0, toFinite(radiusProp(datum, index)));
        const strokeAt = (datum, index) => {
          var _props$stroke, _props$stroke2;
          return (_props$stroke = (_props$stroke2 = props.stroke) === null || _props$stroke2 === void 0 ? void 0 : _props$stroke2.call(props, datum, index)) !== null && _props$stroke !== void 0 ? _props$stroke : null;
        };
        const fillAt = (datum, index) => {
          var _props$fill, _props$fill2;
          return (_props$fill = (_props$fill2 = props.fill) === null || _props$fill2 === void 0 ? void 0 : _props$fill2.call(props, datum, index)) !== null && _props$fill !== void 0 ? _props$fill : null;
        };
        // Entering circles are given their geometry on the join, so they are in place before
        // any transition starts. The geometry is then applied exactly once more - to the
        // transition when there is one, and to the plain selection otherwise - so an update
        // tweens from its previous value instead of from the value it already holds.
        const dots = selection.selectAll(".sszvis-circle").data(data).join(enter => enter.append("circle").classed("sszvis-circle", true).attr("cx", xAt).attr("cy", yAt).attr("r", rAt)).attr("stroke", strokeAt).attr("fill", fillAt);
        if (props.transition) {
          dots.transition(defaultTransition()).attr("cx", xAt).attr("cy", yAt).attr("r", rAt);
        } else {
          dots.attr("cx", xAt).attr("cy", yAt).attr("r", rAt);
        }
        // Tooltip anchors
        const anchorPosition = (datum, index) => [xAt(datum, index), yAt(datum, index)];
        // tooltipAnchor declares its position accessor as taking the datum alone, but d3 calls
        // it with the index too and the anchors must line up with the circles - so the index is
        // read here and the narrower declaration is widened. The cast encodes that gap; the real
        // fix is in tooltipAnchor's own signature.
        const ta = tooltipAnchor().position(anchorPosition);
        selection.call(ta);
      });
    }

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
    function createGroupedBarsComponent(config) {
      return component().prop("groupScale").prop("groupSize").prop("groupWidth").prop("groupHeight").prop("groupSpace").groupSpace(0.05).prop("x", functor).prop("y", functor).prop("width").prop("height").prop("fill").prop("stroke").prop("defined", functor).defined(true).render(function (data) {
        var _props$stroke;
        const selection = d3.select(this);
        const props = selection.props();
        const inGroupScale = d3.scaleBand().domain(d3.range(props.groupSize)).padding(props.groupSpace).paddingOuter(0).rangeRound(config.inGroupRange(props));
        const groups = selection.selectAll("g.sszvis-bargroup").data(data).join("g").classed("sszvis-bargroup", true);
        const barUnits = groups.selectAll("g.sszvis-barunit").data(d => d).join("g").classed("sszvis-barunit", true);
        barUnits.each((d, i) => {
          d.__sszvisGroupedBarIndex__ = i;
        });
        const unitsWithValue = barUnits.filter(props.defined);
        // clear the units before rendering
        unitsWithValue.selectAll("*").remove();
        //sszsch: fix: reset previously assigned translations
        unitsWithValue.attr("transform", () => translateString(0, 0));
        unitsWithValue.append("rect").classed("sszvis-bar", true).attr("fill", props.fill).attr("stroke", (_props$stroke = props.stroke) !== null && _props$stroke !== void 0 ? _props$stroke : null).attr("x", config.x(props, inGroupScale)).attr("y", config.y(props, inGroupScale)).attr("width", config.width(props, inGroupScale)).attr("height", config.height(props, inGroupScale));
        const unitsWithoutValue = barUnits.filter(not(props.defined));
        unitsWithoutValue.selectAll("*").remove();
        unitsWithoutValue.attr("transform", config.missingTransform(props, inGroupScale));
        unitsWithoutValue.append("line").classed("sszvis-bar--missing line1", true).attr("x1", -4).attr("y1", -4).attr("x2", 4).attr("y2", 4);
        unitsWithoutValue.append("line").classed("sszvis-bar--missing line2", true).attr("x1", 4).attr("y1", -4).attr("x2", -4).attr("y2", 4);
        const ta = tooltipAnchor().position(config.tooltipPosition(props, inGroupScale));
        selection.call(ta);
      });
    }
    const createVerticalConfig = () => ({
      inGroupRange: _ref => {
        let {
          groupWidth
        } = _ref;
        return [0, groupWidth];
      },
      x: (_ref2, inGroupScale) => {
        let {
          groupScale
        } = _ref2;
        return (d, _i) => {
          var _inGroupScale;
          return groupScale(d) + (d.__sszvisGroupedBarIndex__ !== undefined ? (_inGroupScale = inGroupScale(d.__sszvisGroupedBarIndex__)) !== null && _inGroupScale !== void 0 ? _inGroupScale : 0 : 0);
        };
      },
      y: _ref3 => {
        let {
          y
        } = _ref3;
        return y;
      },
      width: (_, inGroupScale) => inGroupScale.bandwidth(),
      height: _ref4 => {
        let {
          height
        } = _ref4;
        return height;
      },
      missingTransform: (_ref5, inGroupScale) => {
        let {
          groupScale,
          y
        } = _ref5;
        return (d, i) => {
          var _inGroupScale2;
          return translateString(groupScale(d) + (d.__sszvisGroupedBarIndex__ !== undefined ? (_inGroupScale2 = inGroupScale(d.__sszvisGroupedBarIndex__)) !== null && _inGroupScale2 !== void 0 ? _inGroupScale2 : 0 : 0) + inGroupScale.bandwidth() / 2, y(d, i));
        };
      },
      tooltipPosition: (_ref6, inGroupScale) => {
        let {
          groupScale,
          y
        } = _ref6;
        return group => {
          let xTotal = 0;
          let tallest = Infinity;
          for (const [i, d] of group.entries()) {
            var _inGroupScale3;
            const datum = d;
            xTotal += groupScale(datum) + (datum.__sszvisGroupedBarIndex__ !== undefined ? (_inGroupScale3 = inGroupScale(datum.__sszvisGroupedBarIndex__)) !== null && _inGroupScale3 !== void 0 ? _inGroupScale3 : 0 : 0) + inGroupScale.bandwidth() / 2;
            // smaller y is higher
            tallest = Math.min(tallest, y(datum, i));
          }
          return [xTotal / group.length, tallest];
        };
      }
    });
    const createHorizontalConfig = () => ({
      inGroupRange: props => [0, props.groupHeight],
      x: _ref7 => {
        let {
          x
        } = _ref7;
        return x;
      },
      y: (_ref8, inGroupScale) => {
        let {
          groupScale
        } = _ref8;
        return d => {
          var _inGroupScale4;
          return groupScale(d) + (d.__sszvisGroupedBarIndex__ !== undefined ? (_inGroupScale4 = inGroupScale(d.__sszvisGroupedBarIndex__)) !== null && _inGroupScale4 !== void 0 ? _inGroupScale4 : 0 : 0);
        };
      },
      width: _ref9 => {
        let {
          width
        } = _ref9;
        return width;
      },
      height: (_, inGroupScale) => inGroupScale.bandwidth(),
      missingTransform: (_ref0, inGroupScale) => {
        let {
          groupScale,
          x
        } = _ref0;
        return (d, i) => {
          var _inGroupScale5;
          return translateString(x(d, i), groupScale(d) + (d.__sszvisGroupedBarIndex__ !== undefined ? (_inGroupScale5 = inGroupScale(d.__sszvisGroupedBarIndex__)) !== null && _inGroupScale5 !== void 0 ? _inGroupScale5 : 0 : 0) + inGroupScale.bandwidth() / 2);
        };
      },
      tooltipPosition: (_ref1, inGroupScale) => {
        let {
          groupScale,
          x
        } = _ref1;
        return group => {
          let yTotal = 0;
          let rightmost = -Infinity;
          for (const [i, d] of group.entries()) {
            var _inGroupScale6;
            const datum = d;
            yTotal += groupScale(datum) + (datum.__sszvisGroupedBarIndex__ !== undefined ? (_inGroupScale6 = inGroupScale(datum.__sszvisGroupedBarIndex__)) !== null && _inGroupScale6 !== void 0 ? _inGroupScale6 : 0 : 0) + inGroupScale.bandwidth() / 2;
            // larger x is more to the right
            rightmost = Math.max(rightmost, x(datum, i));
          }
          return [rightmost, yTotal / group.length];
        };
      }
    });
    const groupedBarsVertical = () => createGroupedBarsComponent(createVerticalConfig());
    const groupedBarsHorizontal = () => createGroupedBarsComponent(createHorizontalConfig());
    /**
     * The default grouped bars component is the vertical version.
     *
     * @deprecated Use `groupedBarsVertical` instead.
     */
    const groupedBars = groupedBarsVertical;

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
     * @property {number, function} x       An accessor function for getting the x-value of the line, in
     *                                       pixels, or a constant. Becomes a functor. Required: leaving it
     *                                       unset throws before anything is rendered.
     * @property {number, function} y        An accessor function for getting the y-value of the line, in
     *                                       pixels, or a constant. Becomes a functor. Required, like x.
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
     * d3 takes either a constant or a value function, but not a union of the two, so a style
     * property is narrowed once before it reaches the selection. An unset property becomes a
     * function returning null, which d3 removes the style for - the same thing it does when
     * handed undefined directly.
     */
    /**
     * Whether a value counts as missing, and so breaks the line at that point.
     *
     * Matches the global isNaN this replaced, which coerces its argument first. The coercion
     * is load-bearing: a bare Number.isNaN would let a non-numeric y through into the path.
     * Note that it only catches values that fail to coerce - null, Infinity, booleans and
     * numeric strings all become numbers and are plotted as data. See
     * test/component/line.test.ts.
     *
     * The one input where this differs from the global isNaN is a BigInt, which isNaN throws
     * on and this returns false for. It is not observable through the component: d3.line
     * immediately applies unary + to the value, which throws the identical TypeError.
     */
    const isMissingVal$2 = value => Number.isNaN(Number(value));
    /**
     * Reports a required property the caller left unset, naming both the component and the
     * property. Called before the data join, so a missing accessor is reported by name instead of
     * arriving as a TypeError from d3's internals (a missing y) or as an empty path (a missing x).
     */
    function required$3(value, name) {
      if (value === undefined) {
        throw new Error("[line] the ".concat(name, " property is required"));
      }
      return value;
    }
    function line() {
      return component().prop("x", functor).prop("y", functor).prop("stroke").prop("strokeWidth").prop("defined").prop("key").key((_datum, index) => index).prop("valuesAccessor")
      // The default layer type L is P[], so the values ARE the layer and identity is correct.
      // A caller who sets a different L must supply a matching accessor; the constraint
      // cannot express "identity is valid only for the default instantiation".
      .valuesAccessor(identity).prop("transition").transition(true).render(function (data) {
        var _props$stroke, _props$strokeWidth;
        const selection = d3.select(this);
        const props = selection.props();
        // Layouts
        // Both properties are wrapped by fn.functor on set, so a constant reads back as a
        // function and needs no normalising here - but an unset property is still undefined,
        // and is reported by name before anything is rendered.
        const x = required$3(props.x, "x");
        const y = required$3(props.y, "y");
        // Both dimensions are guarded. Checking only y would let a missing x reach the d
        // attribute verbatim, and the browser then drops that segment along with every
        // segment after it, silently truncating the series. An explicitly set predicate
        // replaces this one rather than composing with it.
        const defined = props.defined === undefined ? (datum, index, points) => !isMissingVal$2(x(datum, index, points)) && !isMissingVal$2(y(datum, index, points)) : props.defined;
        const line = d3.line().defined(defined).x(x).y(y);
        // Rendering
        // Declared with `function` so that `this` is still forwarded to valuesAccessor, as
        // it was when this was built with fn.compose.
        const pathData = function (datum, index) {
          return line(props.valuesAccessor.call(this, datum, index));
        };
        const stroke = valueFn((_props$stroke = props.stroke) !== null && _props$stroke !== void 0 ? _props$stroke : null);
        const strokeWidth = valueFn((_props$strokeWidth = props.strokeWidth) !== null && _props$strokeWidth !== void 0 ? _props$strokeWidth : null);
        const path = selection.selectAll(".sszvis-line").data(data, props.key).join("path").classed("sszvis-line", true).style("stroke", stroke);
        path.order();
        // The visual properties are applied to the transition when there is one, so the two
        // branches are spelled out rather than sharing a variable - a d3 transition and a
        // d3 selection have separate types.
        if (props.transition) {
          path.transition(defaultTransition()).attr("d", pathData).style("stroke", stroke).style("stroke-width", strokeWidth);
        } else {
          path.attr("d", pathData).style("stroke", stroke).style("stroke-width", strokeWidth);
        }
      });
    }

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
     *                                      Also not defaulted, and also throws by name when unset.
     * @property {number, function} width   Required by the vertical orientation, which sizes its
     *                                      bars with it - usually xScale.bandwidth(). The
     *                                      horizontal orientation computes its width from xScale
     *                                      and never reads the property. Omitting it on a vertical
     *                                      chart throws.
     * @property {number, function} height  Required by the horizontal orientation, and ignored by
     *                                      the vertical one, which computes its height from yScale.
     *                                      Omitting it on a horizontal chart throws, just as the
     *                                      vertical orientation does for width.
     * @property {string, function} fill    Optional. A constant or an accessor over a slice. When
     *                                      unset, no fill attribute is written at all and the
     *                                      rectangles fall back to the SVG/CSS default. An accessor
     *                                      is not called for a slice the stack carries no row for:
     *                                      that slice is zero-sized, so its fill would never be
     *                                      painted, and an accessor reading `d.data` would be
     *                                      handed undefined. Such a slice gets no fill attribute.
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
     * Note: a cell's value is the sum of every row the accessors placed in it, so data that is not
     * already aggregated to one row per (stack, series) pair stacks to its true total. The slice's
     * `data` property still points at the first row of the cell. A stack that carries no row for
     * one of the series keys stacks that series as zero, and the slice's `data` is undefined, so
     * sparse data needs no padding with explicit zero rows.
     *
     * Note: the series keys are collected from the data in order of first appearance, so the
     * stacking order is the caller's. The stacks themselves are ordered by the cascade, which
     * enumerates integer-like keys numerically regardless of insertion order; that part is only
     * cosmetic, since each slice is positioned by its own stack value.
     *
     * Note: `keys`, `maxValue` and `minValue` are hung off the returned array rather than wrapped in
     * an object, so any array operation - a spread, a map, a filter, a trip through JSON - drops
     * them, and `keys` shadows Array.prototype.keys, which makes the layout a badly behaved array.
     * `maxValue` and `minValue` are the extent of the stacked bounds, so a negative value is
     * included in them.
     *
     * Note: a negative value is drawn on the other side of the baseline: both orientations take
     * the lower of the two scaled bounds as the segment's origin and the absolute difference as
     * its size. The layout reports the extent as `minValue` and `maxValue`, so the value scale's
     * domain has to be built from both to make room for it.
     *
     * Note: the scale and size properties each orientation reads are required and are validated
     * before anything is drawn: a chart built without one throws an error naming the component and
     * the missing property, rather than rendering zero-size bars or failing inside a helper.
     *
     * Note: the group join uses the descendant selector `.sszvis-stack` rather than a child
     * selector and no key function, so any pre-existing stack below the target group, at any depth,
     * is captured and re-bound, and surviving groups and rects are matched by index rather than by
     * series. The component also forwards neither bar's `transition` property nor its tooltip
     * anchor properties, so a caller cannot turn the segment animation off, and the tooltip anchor
     * is always at the top centre of a segment. See test/component/stackedBar.test.ts.
     *
     * @return {sszvis.component}
     */
    const stackAcc = prop("stack");
    /* Data layout
    ----------------------------------------------- */
    /**
     * Both layouts are the same computation and differ only in the stack order, which decides
     * which series key ends up on the baseline.
     */
    function stackedBarData(order) {
      return (_stackAcc,
      // cascade.objectBy stringifies its keys, so a numeric series accessor - a year, or a
      // category code - groups the same way a string one does. The keys themselves are read
      // back off the cascade row with Object.keys, which is why `series` stays a string.
      seriesAcc, valueAcc) => data => {
        var _max, _min;
        const rows = cascade().arrayBy(_stackAcc).objectBy(seriesAcc).apply(data);
        // The series keys, and with them the stacking order, come from the data rather than
        // from the cascade rows: those are plain objects, which enumerate integer-like keys
        // numerically and would drop the caller's ordering for numeric series.
        const keys = set$1(data, d => String(seriesAcc(d)));
        const stacks = d3.stack().keys(keys)
        // Every row the accessors placed in a cell contributes to that cell's value, so
        // data that is not pre-aggregated to one row per (stack, series) pair stacks to
        // its true total rather than to its first row.
        // A stack that carries no row for one of the series keys stacks that series as
        // zero rather than throwing.
        .value((x, key) => {
          var _x$key;
          return d3.sum((_x$key = x[key]) !== null && _x$key !== void 0 ? _x$key : [], valueAcc);
        }).order(order)(rows);
        // Simplify the 'data' property. The slices themselves are the objects d3 created,
        // rewritten in place, so a caller holding one sees the new shape. The series arrays
        // are rebuilt, so d3's own `key` and `index` - the only two properties it hangs off a
        // series - have to be carried across by hand.
        // The stack value of a row cannot be read off a cell that may be missing, so it is
        // taken once per row from whichever datum the row does hold. The stack layers d3
        // returns are index-aligned to the rows it was given.
        const stackValues = rows.map(row => _stackAcc(Object.values(row).flat()[0]));
        const series = stacks.map(stack => {
          const slices = stack.map((d, i) => {
            var _d$data$stack$key;
            const datum = (_d$data$stack$key = d.data[stack.key]) === null || _d$data$stack$key === void 0 ? void 0 : _d$data$stack$key[0];
            return Object.assign(d, {
              series: stack.key,
              data: datum,
              stack: stackValues[i]
            });
          });
          return Object.assign(slices, {
            key: stack.key,
            index: stack.index
          });
        });
        // Both bounds are considered, so a stack that reaches below the baseline reports an
        // extent that covers it.
        const maxValue = (_max = d3.max(series, stack => d3.max(stack, d => Math.max(d[0], d[1])))) !== null && _max !== void 0 ? _max : 0;
        const minValue = (_min = d3.min(series, stack => d3.min(stack, d => Math.min(d[0], d[1])))) !== null && _min !== void 0 ? _min : 0;
        return Object.assign(series, {
          keys,
          maxValue,
          minValue
        });
      };
    }
    const stackedBarHorizontalData = stackedBarData(d3.stackOrderNone);
    const stackedBarVerticalData = stackedBarData(d3.stackOrderReverse);
    /**
     * Throws for any of the named props the caller never set. The two orientations need
     * different ones, and each silently ignores the other's, so the message names the component
     * as well as the property. Called before anything is drawn, so a misconfigured chart renders
     * nothing rather than a grid of zero-size bars.
     */
    function requireProps(name, props, required) {
      for (const prop of required) {
        if (Reflect.get(props, prop) === undefined) {
          throw new Error("[".concat(name, "] the ").concat(prop, " property is required"));
        }
      }
    }
    /**
     * Joins one group per series and draws that series' slices with the bar component. This is
     * everything the two orientations have in common; they differ only in how the four bar
     * dimensions are derived from the props.
     */
    function drawStacks(selection, data, barGen) {
      const groups = selection.selectAll(".sszvis-stack").data(data).join("g").classed("sszvis-stack", true);
      groups.call(barGen);
    }
    /**
     * Applies a fill to a slice, leaving a slice with no source row unpainted.
     *
     * A stack that carries no row for one of its series contributes a zero-height (or zero-width)
     * slice whose `data` is undefined. Nothing of it is visible, so the caller's accessor - which
     * is written over the row, as every docs example is - is skipped rather than handed an
     * undefined datum to dereference.
     */
    function fillOf(fill) {
      if (typeof fill !== "function") return fill;
      return (slice, index) => slice.data === undefined ? undefined : fill(slice, index);
    }
    function stackedBarHorizontal() {
      return component().prop("xScale", functor).prop("width", functor).prop("yScale", functor).prop("height", functor).prop("fill").prop("stroke").render(function (data) {
        const selection = d3.select(this);
        const props = selection.props();
        requireProps("stackedBarHorizontal", props, ["xScale", "yScale", "height"]);
        const barGen = bar()
        // The lower of the two scaled bounds, so a segment whose value is negative is drawn
        // on the other side of the baseline rather than with a negative width.
        .x(d => Math.min(props.xScale(d[0]), props.xScale(d[1]))).y(compose(props.yScale, stackAcc)).width(d => Math.abs(props.xScale(d[1]) - props.xScale(d[0]))).height(props.height).fill(fillOf(props.fill)).stroke(props.stroke || "#FFFFFF");
        drawStacks(selection, data, barGen);
      });
    }
    function stackedBarVertical() {
      return component().prop("xScale", functor).prop("width", functor).prop("yScale", functor).prop("height", functor).prop("fill").prop("stroke").render(function (data) {
        const selection = d3.select(this);
        const props = selection.props();
        requireProps("stackedBarVertical", props, ["xScale", "yScale", "width"]);
        const barGen = bar().x(compose(props.xScale, stackAcc))
        // The upper edge is whichever bound scales smaller, which keeps the geometry valid
        // for a negative value and for a y-scale whose range ascends.
        .y(d => Math.min(props.yScale(d[0]), props.yScale(d[1]))).width(props.width).height(d => Math.abs(props.yScale(d[0]) - props.yScale(d[1]))).fill(fillOf(props.fill)).stroke(props.stroke || "#FFFFFF");
        drawStacks(selection, data, barGen);
      });
    }

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
     * `offset`, `xScale`, `yScale`, `xAcc` and `tooltip` are required and are validated before
     * anything is rendered: a missing one throws an error naming the component and the property.
     * `fill`, `stroke`, `xLabel` and `slant` are optional.
     *
     * @module sszvis/component/nestedStackedBarsVertical
     * @template T The type of the data objects behind the stack slices
     * @template X The type of the x-axis values, i.e. the domain of the x-scale
     *
     * @property {function} offset              Required. Positions the nested groups. Receives the whole
     *                                          stack layout of a group and returns an x-offset in pixels.
     *                                          An offset that is not a finite number is reported with a
     *                                          console warning and treated as 0, so the group still gets a
     *                                          valid transform instead of one the renderer discards.
     * @property {function} xScale              Required. A band scale for the stack layout. Used to position
     *                                          the stacks and, via its bandwidth, to size the bars. Must be a
     *                                          band scale: `bandwidth()` is called on it directly.
     * @property {function} yScale              Required. A y-scale. After the stack is computed, the y-scale is
     *                                          used to position each stack, and to place the x-axis at the
     *                                          baseline. The baseline is `yScale(0)` clamped into the scale's
     *                                          own range, so a y-domain that excludes 0 keeps the axis inside
     *                                          the plotting area; clamping is reported with a console warning.
     *                                          A scale without a `range()` (for instance a constant boxed by
     *                                          fn.functor) is used as-is.
     * @property {function} tooltip             Required. A tooltip component, called once with the tooltip
     *                                          anchors of every nested group in one selection.
     * @property {function} xAcc                Required. An x-accessor over a slice datum. Kept for backwards
     *                                          compatibility and validated, but no longer read: the nested
     *                                          groups are labelled from their own nest key. Deprecation
     *                                          candidate.
     * @property {string, function} fill        Optional. A fill value for the rectangles. When unset, no fill
     *                                          attribute is written at all and the rectangles fall back to the
     *                                          SVG/CSS default.
     * @property {string, function} stroke      Optional. Forwarded to stackedBarVertical, which defaults it to
     *                                          #FFFFFF so that the stack segments are separated by a white
     *                                          line. Pass "none" for seamless stacks.
     * @property {string, function} xLabel      Optional. The title of the nested x-axis. A function is
     *                                          evaluated before the axis renders it; unset means no title.
     * @property {string} slant                 Optional. The slant of the x-axis labels ("vertical" or
     *                                          "diagonal"). Unset leaves them upright. The only prop that is not
     *                                          wrapped in fn.functor.
     *
     * Each nested group carries its nest key in `data-nested-stacked-bars`, taken from the `nest`
     * property callers tag the stack layout with (the same key `offset` reads), and falling back to
     * the group's index when the layout is untagged. A nested group with no stacks is reported with
     * a console warning and rendered as an empty group rather than taking the whole chart down.
     *
     * @return {sszvis.component}
     */
    /** Reports a required property the caller left unset, naming it. */
    function required$2(value, name) {
      if (value === undefined) {
        throw new Error("[nestedStackedBarsVertical] the ".concat(name, " property is required"));
      }
      return value;
    }
    /**
     * The y-coordinate of the x-axis: `yScale(0)`, kept inside the scale's own range so that a
     * y-domain excluding 0 - which a linear scale extrapolates past the end of its range - does not
     * push the axis out of the plotting area. Warns when it has to clamp. A scale that exposes no
     * `range()` cannot be checked, so its value is used unchanged.
     */
    function baseline(yScale) {
      const zero = yScale(0);
      const scaleRange = Reflect.get(yScale, "range");
      if (typeof scaleRange !== "function") return zero;
      const extent = scaleRange.call(yScale).filter(v => Number.isFinite(v));
      if (extent.length < 2) return zero;
      const low = Math.min(...extent);
      const high = Math.max(...extent);
      if (zero >= low && zero <= high) return zero;
      const clamped = zero < low ? low : high;
      warn("[nestedStackedBarsVertical] the y-scale baseline ".concat(zero, " falls outside its range [").concat(low, ", ").concat(high, "]; placing the x-axis at ").concat(clamped));
      return clamped;
    }
    const nestedStackedBarsVertical = () => component().prop("offset", functor).prop("xScale", functor).prop("yScale", functor).prop("fill", functor).prop("stroke").prop("tooltip", functor).prop("xAcc", functor).prop("xLabel", functor).prop("slant").render(function (data) {
      const selection = d3.select(this);
      const props = selection.props();
      const offset = required$2(props.offset, "offset");
      const xScale = required$2(props.xScale, "xScale");
      const yScale = required$2(props.yScale, "yScale");
      const tooltip = required$2(props.tooltip, "tooltip");
      required$2(props.xAcc, "xAcc");
      const {
        fill,
        stroke,
        xLabel
      } = props;
      const xAxis = axisX.ordinal().scale(xScale).tickSize(0).orient("bottom").slant(props.slant)
      // xLabel is wrapped by fn.functor, so it is always a function here; the axis binds its
      // title as text data and never calls it, so evaluate it first.
      .title(xLabel === null || xLabel === void 0 ? void 0 : xLabel());
      const group = selection.selectAll("[data-nested-stacked-bars]").data(data);
      const nestedGroups = group.join("g").attr("data-nested-stacked-bars", (d, i) => {
        if (d.length === 0) {
          warn("[nestedStackedBarsVertical] the nested group at index ".concat(i, " has no stacks; rendering it empty"));
        }
        return d.nest === undefined ? i : d.nest;
      });
      nestedGroups.attr("transform", d => {
        const x = offset(d);
        if (!Number.isFinite(x)) {
          warn("[nestedStackedBarsVertical] the offset accessor returned ".concat(x, "; positioning the group at 0"));
        }
        return translateString(Number.isFinite(x) ? x : 0, 0);
      });
      nestedGroups.selectGroup("nested-x-axis").attr("transform", translateString(0, baseline(yScale))).call(xAxis);
      const stackedBars = stackedBarVertical().xScale(xScale).width(xScale.bandwidth()).yScale(yScale).fill(fill).stroke(stroke);
      const bars = nestedGroups.selectGroup("barchart").call(stackedBars);
      bars.selectAll("[data-tooltip-anchor]").call(tooltip);
    });

    function prepareHierarchyData(data, options) {
      if (data !== undefined && options !== undefined) {
        const layout = createHierarchyLayout();
        options.layers.forEach(layer => {
          layout.layer(layer);
        });
        layout.value(options.valueAccessor);
        return layout.calculate(data);
      }
      // Otherwise, return the chained API
      return createHierarchyLayout();
    }
    function createHierarchyLayout() {
      const layers = [];
      let valueAcc = identity;
      let sortFn = (_a, _b) => 0;
      const api = {
        calculate: data => {
          if (layers.length === 0) {
            throw new Error("At least one layer must be specified before calculating hierarchy data");
          }
          const nested = unwrapNested(d3.rollup(data, first, ...layers));
          const rootData = {
            _tag: "root",
            children: nested
          };
          return d3.hierarchy(rootData, d => {
            return d._tag === "leaf" ? undefined : d.children;
          }).sort(sortFn).sum(node => {
            return node._tag === "leaf" ? valueAcc(node.data) : 0;
          });
        },
        layer: keyFunc => {
          layers.push(keyFunc);
          return api;
        },
        value: accfn => {
          valueAcc = accfn;
          return api;
        },
        sort: sortFunc => {
          sortFn = sortFunc;
          return api;
        }
      };
      return api;
    } // Helper function to safely unwrap nested rollup data
    /**
     * Helper function to safely unwrap nested rollup data.
     * Handles uneven tree structures where some branches terminate earlier than others.
     * When a layer accessor returns null, the node will use its parent's key as a fallback
     * to ensure labels remain functional.
     *
     * @param roll - The nested Map structure from d3.rollup()
     * @param parentKey - The key of the parent node (used as fallback for null keys)
     * @param rootKey - The top-level category key (used for color mapping)
     * @returns Array of NodeDatum objects representing the hierarchy
     */
    function unwrapNested(roll) {
      let parentKey = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      let rootKey = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
      const rollupMap = roll;
      return Array.from(rollupMap, _ref => {
        var _ref2;
        let [key, values] = _ref;
        // Use parent key as fallback when current key is null/undefined
        const effectiveKey = (_ref2 = key !== null && key !== void 0 ? key : parentKey) !== null && _ref2 !== void 0 ? _ref2 : "";
        // For root category, use the current key if we're at the first level (rootKey is null)
        const effectiveRootKey = rootKey !== null && rootKey !== void 0 ? rootKey : effectiveKey;
        if (values instanceof Map && values.size > 0) {
          // Branch node - has children
          return {
            _tag: "branch",
            key: effectiveKey,
            rootKey: effectiveRootKey,
            children: unwrapNested(values, effectiveKey, effectiveRootKey)
          };
        } else {
          // Leaf node - has data
          return {
            _tag: "leaf",
            key: effectiveKey,
            rootKey: effectiveRootKey,
            data: values
          };
        }
      });
    }
    /** The fill used when a node carries no key the colour scale can be looked up with. */
    const HIERARCHY_FALLBACK_COLOR = "#cccccc";
    /**
     * The colour key a hierarchy node inherits: its own rootKey when the layout wrote one,
     * otherwise the key of its top-level ancestor (the child of the root). Leaves and branches
     * of one category therefore share a colour even when only the root was tagged.
     *
     * Returns undefined when neither is available; callers decide whether to fall back to the
     * node's own key.
     */
    function inheritedColorKey(node) {
      if ("rootKey" in node.data && node.data.rootKey) return node.data.rootKey;
      const ancestors = node.ancestors();
      const topLevel = ancestors.find((_, i) => {
        var _ancestors;
        return i < ancestors.length - 1 && ((_ancestors = ancestors[i + 1]) === null || _ancestors === void 0 ? void 0 : _ancestors.data._tag) === "root";
      });
      if (topLevel && "key" in topLevel.data) return topLevel.data.key;
      return undefined;
    }
    /** `inheritedColorKey`, falling back to the node's own key. */
    function colorKeyOf(node) {
      const inherited = inheritedColorKey(node);
      if (inherited !== undefined) return inherited;
      return "key" in node.data ? node.data.key : undefined;
    }
    /** The fill a hierarchy node is drawn with, or the grey fallback when it has no key. */
    function nodeColor(node, colorScale) {
      const key = colorKeyOf(node);
      return key === undefined ? HIERARCHY_FALLBACK_COLOR : colorScale(key);
    }

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
     * @property {string, function} colorScale        The fill color for circles: a constant colour
     *                                                or an accessor taking a node's key
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
    /**
     * Main Pack component
     *
     * @template T The type of the original flat data objects
     */
    function pack () {
      return component().prop("colorScale", functor).prop("transition").transition(true).prop("containerWidth").containerWidth(800) // Default width
      .prop("containerHeight").containerHeight(600) // Default height
      .prop("showLabels").showLabels(false) // Default disabled
      .prop("label", functor).label(d => d.data && "key" in d.data ? d.data.key : "").prop("minRadius").minRadius(20).prop("circleStroke").circleStroke("#ffffff").prop("circleStrokeWidth").circleStrokeWidth(1).prop("radiusScale", functor).prop("onClick").render(function (inputData) {
        const selection = d3.select(this);
        const props = selection.props();
        // Apply pack layout to hierarchical data
        const layout = d3.pack().size([props.containerWidth, props.containerHeight]).padding(4).radius(props.radiusScale || null);
        layout(inputData);
        // Flatten the hierarchy and filter out root
        function flatten(node) {
          const result = [];
          if (node.children) {
            for (const child of node.children) {
              if (child.data._tag !== "root") {
                result.push(child);
              }
              result.push(...flatten(child));
            }
          } else if (node.data._tag !== "root") {
            result.push(node);
          }
          return result;
        }
        const packData = flatten(inputData);
        // Filter out very small circles - include both branches (categories) and leaves
        const visibleData = packData.filter(d => d.r > (props.minRadius || 1));
        const circles = selection.selectAll(".sszvis-pack-circle").data(visibleData).join("circle").classed("sszvis-pack-circle", true).attr("cx", d => d.x).attr("cy", d => d.y).attr("r", d => d.r).attr("fill", d => {
          if (d.children) {
            // Branch nodes should have a light fill to be able to click them
            return "white";
          }
          return nodeColor(d, props.colorScale);
        }).attr("stroke", d => {
          // Branches carry the category colour; leaves fall back to the configured stroke.
          const inherited = inheritedColorKey(d);
          if (inherited !== undefined) return props.colorScale(inherited);
          if (!d.children) return props.circleStroke;
          return "key" in d.data ? props.colorScale(d.data.key) : HIERARCHY_FALLBACK_COLOR;
        }).attr("stroke-width", d => {
          // Branch nodes get thicker stroke to make them more visible
          return d.children ? 2 : props.circleStrokeWidth;
        }).style("cursor", props.onClick ? "pointer" : "default").on("click", (event, d) => {
          var _props$onClick;
          return (_props$onClick = props.onClick) === null || _props$onClick === void 0 ? void 0 : _props$onClick.call(props, event, d);
        });
        // Apply transitions if enabled
        if (props.transition) {
          circles.transition(defaultTransition()).attr("cx", d => d.x).attr("cy", d => d.y).attr("r", d => d.r);
        }
        // Render labels if enabled
        if (props.showLabels) {
          const fontSize = 12;
          // Create type-safe label accessor functions
          const labelAcc = d => typeof props.label === "function" ? props.label(d) : props.label || "";
          const labelXAcc = d => d.x;
          const labelYAcc = d => d.y + fontSize / 3;
          const labelFillAcc = d => {
            return getAccessibleTextColor(nodeColor(d, props.colorScale));
          };
          // Filter data for labels - only show labels on leaf nodes that are large enough
          const labelData = visibleData.filter(d => !d.children).filter(d => labelAcc(d).length < d.r / 3);
          const labels = selection.selectAll(".sszvis-pack-label").data(labelData).join("text").classed("sszvis-pack-label", true).attr("x", labelXAcc).attr("y", labelYAcc).attr("fill", labelFillAcc).attr("font-size", fontSize).attr("font-family", '"Helvetica Neue", Helvetica, Arial, sans-serif').attr("text-anchor", "middle").attr("dominant-baseline", "middle").style("pointer-events", "none").text(labelAcc);
          // Apply transitions to labels if enabled
          if (props.transition) {
            labels.transition(defaultTransition()).attr("x", labelXAcc).attr("y", labelYAcc).attr("font-size", fontSize).text(labelAcc);
          }
        } else {
          // Remove labels if showLabels is false
          selection.selectAll(".sszvis-pack-label").remove();
        }
        // Add tooltip anchors at the center of each circle
        const tooltipPosition = d => [d.x, d.y];
        const ta = tooltipAnchor().position(tooltipPosition);
        selection.call(ta);
      });
    }

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
     *                                            The inner radius is hardcoded to 4px and cannot be configured.
     *                                            Rendering without it throws.
     * @property {string, function} fill          a fill color for wedges in the pie. Ideally a function which takes a
     *                                            data value. If unset, the attribute is omitted and the wedges fall back
     *                                            to the SVG default, black.
     * @property {string, function} stroke        the stroke color for wedges in the pie (default "#FFFFFF", which
     *                                            separates touching wedges). The default applies only when the property
     *                                            was never set: a falsy value, such as "" or null, is passed through, and
     *                                            behaves the same whether it is given as a constant or returned from an
     *                                            accessor.
     * @property {number, function} angle         Required. Specifies the angle of the wedges in radians. Theoretically
     *                                            this could be a constant, but that would make for a very strange pie.
     *                                            Ideally, this is a function which takes a data value and returns the
     *                                            angle in radians. Angles are summed as given and never clamped, so a
     *                                            total beyond a full turn overshoots and a negative angle draws its wedge
     *                                            backwards. A value that is not finite is reported through sszvis.logger and
     *                                            treated as zero, so one bad datum costs at most its own wedge.
     *                                            Rendering without the property throws.
     * @property {boolean} transition             Whether to animate between renders (default true). The wedge angles, the
     *                                            transform, the fill and the stroke all ease over the default 300ms. With
     *                                            transition(false) every attribute is written on the render tick instead,
     *                                            which is what a chart serialised synchronously - a snapshot, an SVG
     *                                            export - or one rendered in a hidden tab wants, since d3-timer runs on
     *                                            requestAnimationFrame.
     *
     * Note: the component keeps its transition state - the angles currently on screen - in a
     * WeakMap keyed by the wedge element, so it never writes to the caller's data. Frozen data,
     * two entries sharing one datum object, and data carrying fields of its own all render
     * correctly. The wedges carry their own `sszvis-pie-path` class alongside the generic
     * `sszvis-path` one, and the component matches only the former, so a foreign path left in the
     * same group by another component is left alone.
     *
     * @return {sszvis.component}
     */
    /** Reports a required property the caller left unset, naming it. */
    function required$1(value, name) {
      if (value === undefined) {
        throw new Error("[pie] the ".concat(name, " property is required"));
      }
      return value;
    }
    /**
     * Turns a colour property into an accessor. A constant and an accessor returning that
     * constant are equivalent to d3, and so are an unset property and one returning null:
     * either way d3 removes the attribute.
     */
    function toColorAccessor(value) {
      // An accessor is handed to d3 untouched. Its result is narrowed from
      // `string | null | undefined` to `string | null` only because d3's own attr typings omit
      // undefined; d3 removes the attribute for either one, so the two are interchangeable here.
      return typeof value === "function" ? value : () => value !== null && value !== void 0 ? value : null;
    }
    // The angles currently on screen, per wedge element. d3 cannot interpolate an arc path
    // directly, so a transition needs the previous angles as well as the destination ones -
    // keying them to the element keeps them out of the caller's data. The map lives at module
    // scope, keyed on the element rather than on the factory: the shipped examples build a
    // fresh pie() inside every render (docs/pie-charts/basic.js), so a per-instance map would
    // find no state for the paths already on screen and tween destination to destination.
    // Keying on the element still scopes the state to the group being rendered into, and the
    // entry is collected with the element.
    const onScreen = new WeakMap();
    function pie() {
      // The chain is built on the component rather than returned from it: .prop() and .render()
      // are declared to return the generic Component type, since the accessors they install
      // only exist at runtime, so the typed instance has to come from the factory itself.
      const pieComponent = component();
      pieComponent.prop("radius").prop("fill").prop("stroke").prop("angle", functor).prop("transition").transition(true).render(function (data) {
        const selection = d3.select(this);
        const props = selection.props();
        // Both required properties are checked before a single element is created, so a
        // misconfigured pie leaves no half-rendered wedges or stray tooltip anchors behind.
        const radius = required$1(props.radius, "radius");
        const angleOf = required$1(props.angle, "angle");
        // The default applies only when the property was never set, so that a falsy stroke
        // reaches the DOM whether it was passed as a constant or returned from an accessor.
        const stroke = props.stroke === undefined ? "#FFFFFF" : props.stroke;
        const fillAccessor = toColorAccessor(props.fill);
        const strokeAccessor = toColorAccessor(stroke);
        const transform = "translate(".concat(radius, ",").concat(radius, ")");
        // The destination layout, held alongside the data rather than written onto it.
        const layout = [];
        let angle = 0;
        for (const value of data) {
          const a0 = angle;
          const step = Number(angleOf(value));
          if (Number.isFinite(step)) {
            angle += step;
          } else {
            // A scale over a domain containing undefined, an empty group, or a division by a
            // zero total all land here. Skipping the step keeps the running total usable, so
            // the wedges after this one are unaffected.
            warn("[pie] the angle accessor returned ".concat(step, "; drawing a zero-width wedge"));
          }
          layout.push({
            a0,
            a1: angle
          });
        }
        const arcGen = d3.arc().innerRadius(4).outerRadius(radius).startAngle(d => d.a0).endAngle(d => d.a1);
        // arc only returns null when it renders into a canvas context, which this one never does.
        const arcPath = angles => {
          var _arcGen;
          return (_arcGen = arcGen(angles)) !== null && _arcGen !== void 0 ? _arcGen : "";
        };
        // Matching on the component's own class rather than the generic .sszvis-path one, which
        // stackedArea, stackedAreaMultiples and stackedPyramid also use, keeps a foreign path in
        // the same group out of the join.
        const segments = selection.selectAll("path.sszvis-pie-path").data(data).join(enter =>
        // transform, fill and stroke are written here and then only on the transition, so
        // that they have an old value to animate away from on every later render.
        enter.append("path").attr("class", "sszvis-path sszvis-pie-path").attr("transform", transform).attr("fill", fillAccessor).attr("stroke", strokeAccessor));
        // Geometry is applied on the render tick, from the angles already on screen - the
        // destination ones for a wedge that has just entered - so the DOM is never in a
        // geometry-less state and nothing jumps before the transition takes over.
        segments.attr("d", function (_d, i) {
          var _onScreen$get;
          const start = (_onScreen$get = onScreen.get(this)) !== null && _onScreen$get !== void 0 ? _onScreen$get : layout[i];
          onScreen.set(this, start);
          return arcPath(start);
        });
        if (props.transition) {
          segments.transition(defaultTransition()).attr("transform", transform).attr("fill", fillAccessor).attr("stroke", strokeAccessor).attrTween("d", function (_d, i) {
            var _onScreen$get2;
            const from = (_onScreen$get2 = onScreen.get(this)) !== null && _onScreen$get2 !== void 0 ? _onScreen$get2 : layout[i];
            const to = layout[i];
            const a0 = d3.interpolate(from.a0, to.a0);
            const a1 = d3.interpolate(from.a1, to.a1);
            return t => {
              const current = {
                a0: a0(t),
                a1: a1(t)
              };
              // Recording every frame lets a render that interrupts this transition pick the
              // angles up mid-flight.
              onScreen.set(this, current);
              return arcPath(current);
            };
          });
        } else {
          // A render that turns transitions off has to stop whatever the last one started:
          // the attrTween below writes both the path and onScreen on every frame, so an
          // uninterrupted transition would overwrite these attributes after they are set.
          segments.interrupt();
          segments.attr("transform", transform).attr("fill", fillAccessor).attr("stroke", strokeAccessor).attr("d", function (_d, i) {
            onScreen.set(this, layout[i]);
            return arcPath(layout[i]);
          });
        }
        const ta = tooltipAnchor().position(
        // The anchors are placed from the destination angles, so they describe the layout the
        // wedges are heading for rather than the one they are leaving. d3 passes the index to
        // every attr callback, which is how the anchor component invokes this; its own prop
        // type just declares the datum, hence the assertion.
        (_d, i) => {
          var _layout$i;
          const {
            a0,
            a1
          } = (_layout$i = layout[i]) !== null && _layout$i !== void 0 ? _layout$i : {
            a0: 0,
            a1: 0
          };
          // The correction by - Math.PI / 2 is necessary because d3 automatically (and with brief, buried documentation!)
          // makes the same correction to svg.arc() angles :o
          const a = a0 + Math.abs(a1 - a0) / 2 - Math.PI / 2;
          const r = radius * 2 / 3;
          return [radius + Math.cos(a) * r, radius + Math.sin(a) * r];
        });
        selection.datum(data).call(ta);
      });
      return pieComponent;
    }

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
     * @property {number, function} barHeight          The height of a bar, in pixels. Required: an unset
     *                                                 property throws "[pyramid] the barHeight property is
     *                                                 required" before anything is rendered.
     * @property {number, function} barWidth           The width of a bar, in pixels. Required, same error
     *                                                 shape as barHeight. The component computes the left
     *                                                 bar's x itself, as -SPINE_PADDING - barWidth(d, i),
     *                                                 forwarding d3's index so an index-aware accessor
     *                                                 positions the mirrored bars as it sizes them.
     * @property {number, function} barPosition        The vertical position of a bar, i.e. its top edge, in
     *                                                 pixels. Required, same error shape as barHeight.
     * @property {Array<Number>} [tooltipAnchor]       The anchor position for the tooltips. Uses sszvis.component.bar.tooltipAnchor
     *                                                 under the hood to optionally reposition the tooltip anchors in the pyramid chart.
     *                                                 Default value is [0.5, 0.5], which centers tooltips on the bars.
     *                                                 The value is handed to both bars unchanged rather than being
     *                                                 mirrored, and bar measures from its own upper left corner, so
     *                                                 any x other than 0.5 lands on visually opposite sides of the
     *                                                 pyramid. An array with fewer than two entries yields a NaN
     *                                                 coordinate, as documented on bar.
     * @property {function}         leftAccessor       Data for the left side. Required, same error shape as
     *                                                 barHeight. An accessor that returns undefined or null
     *                                                 still throws from d3's data join, since a side with no
     *                                                 data is a broken chart rather than an empty one.
     * @property {function}         rightAccessor      Data for the right side. Same requirements as leftAccessor.
     * @property {function}         [leftRefAccessor]  Reference data for the left side, drawn as a single path
     *                                                 outlining the reference series. Optional in both senses:
     *                                                 the accessor may be unset, and an accessor that returns
     *                                                 no data for some state renders no line for that state.
     *                                                 undefined and null are warned about, since they violate
     *                                                 the accessor's contract; an empty array is treated as a
     *                                                 legitimately empty series and passes silently.
     * @property {function}         [rightRefAccessor] Reference data for the right side. Same as leftRefAccessor.
     *
     * Note: a reference point sits at the outer edge of the bar it describes, vertically
     * centred on it: x is SPINE_PADDING + barWidth, matching the bar's own outer edge, and y is
     * barPosition + barHeight / 2, the bar's mid-line. Both sides share the same generator; the
     * left one is mirrored with a scale(-1, 1) transform.
     *
     * Note: an entering reference path gets its d attribute synchronously, so getBBox, snapshots
     * and PNG exports see real geometry on the tick it is rendered. Updates are additionally
     * written through a transition, so a change of data eases into place. The bars underneath
     * animate over the same duration, so the outline and the bars it describes stay together for
     * the length of the transition.
     *
     * Note: a reference series with no points renders no path at all, and a path already in the
     * DOM is removed when its series goes away. Each side is still capped at a single line, since
     * the series is wrapped in a one-element array before the join.
     *
     * Note: the reference line skips points whose barWidth or barPosition is not a finite number,
     * so a gap in the reference series breaks the outline at the gap rather than truncating it,
     * the way bar's own missing-value guard keeps the bars drawable.
     *
     * Note: the reference line's appearance comes entirely from the
     * .sszvis-pyramid__referenceline rule in sszvis.css - the component sets only the class.
     * Without that stylesheet the path renders as a solid black shape, since fill defaults to
     * black. stackedPyramid's otherwise identical line component inlines the same four values
     * instead. See test/component/pyramid.test.ts.
     *
     * @return {sszvis.component}
     */
    /* Constants
    ----------------------------------------------- */
    const SPINE_PADDING$1 = 0.5;
    /** Properties with no sensible fallback: without any one of them nothing can be drawn. */
    const REQUIRED_PROPS = ["barHeight", "barWidth", "barPosition", "leftAccessor", "rightAccessor"];
    /* Module
    ----------------------------------------------- */
    function pyramid() {
      return component().prop("barHeight", functor).prop("barWidth", functor).prop("barPosition", functor).prop("barFill", functor).barFill("#000").prop("tooltipAnchor").tooltipAnchor([0.5, 0.5]).prop("leftAccessor").prop("rightAccessor").prop("leftRefAccessor").prop("rightRefAccessor").render(function (data) {
        const selection = d3.select(this);
        const props = selection.props();
        // Validation, before any element exists: none of these can render correctly when
        // unset, and two of the three bar dimensions used to fail silently by reaching bar's
        // missing-value guard as undefined.
        for (const name of REQUIRED_PROPS) {
          if (props[name] === undefined) {
            throw new Error("[pyramid] the ".concat(name, " property is required"));
          }
        }
        // Components
        const leftBar = bar()
        // Forwards d3's index, so an index-aware barWidth positions the mirrored bars the
        // same way it sizes them.
        .x((d, i) => -SPINE_PADDING$1 - props.barWidth(d, i)).y(props.barPosition).height(props.barHeight).width(props.barWidth).fill(props.barFill).tooltipAnchor(props.tooltipAnchor);
        const rightBar = bar().x(SPINE_PADDING$1).y(props.barPosition).height(props.barHeight).width(props.barWidth).fill(props.barFill).tooltipAnchor(props.tooltipAnchor);
        const leftLine = lineComponent$1().barPosition(props.barPosition).barHeight(props.barHeight).barWidth(props.barWidth).mirror(true);
        const rightLine = lineComponent$1().barPosition(props.barPosition).barHeight(props.barHeight).barWidth(props.barWidth);
        // Rendering
        selection.selectGroup("left").datum(props.leftAccessor(data)).call(leftBar);
        selection.selectGroup("right").datum(props.rightAccessor(data)).call(rightBar);
        selection.selectGroup("leftReference").datum(referenceSeries(props.leftRefAccessor, data, "leftRefAccessor")).call(leftLine);
        selection.selectGroup("rightReference").datum(referenceSeries(props.rightRefAccessor, data, "rightRefAccessor")).call(rightLine);
      });
    }
    /**
     * Resolves one side's reference series into the array-of-series the line component joins on:
     * one entry when there is something to draw, none otherwise. A series with no points
     * therefore removes its path rather than leaving an empty one behind.
     *
     * An accessor returning undefined or null breaks its contract, so it is warned about - but it
     * is warned about rather than thrown on, because it is data-driven: an accessor indexing into
     * a cascaded object hits it as soon as one category is missing from one state, and that must
     * not take the chart down. An empty array is a legitimately empty series and passes silently.
     */
    function referenceSeries(accessor, data, name) {
      if (accessor === undefined) return [];
      const series = accessor(data);
      if (!Array.isArray(series)) {
        warn("[pyramid] ".concat(name, " returned ").concat(String(series), " rather than an array; no reference line was drawn. Return an empty array for a state that has no reference series."));
        return [];
      }
      return series.length === 0 ? [] : [series];
    }
    /**
     * Draws one side's reference outline as a single path. The data is one array of points per
     * path, so the datum handed to this component is an array of arrays - in practice always
     * of length one, since each side has at most one reference line.
     */
    function lineComponent$1() {
      return component().prop("barPosition").prop("barHeight").prop("barWidth").prop("mirror").mirror(false).render(function (data) {
        const selection = d3.select(this);
        const props = selection.props();
        // The reference point is the outer edge of the bar it describes, vertically centred on
        // it - the same corner-plus-half-height the bars themselves occupy.
        const pointX = (d, i) => SPINE_PADDING$1 + props.barWidth(d, i);
        const pointY = (d, i) => props.barPosition(d, i) + props.barHeight(d, i) / 2;
        const lineGen = d3.line()
        // A point whose geometry is not a finite number is skipped, which breaks the outline
        // at the gap instead of poisoning the path string from there on.
        .defined((d, i) => isDrawable(pointX(d, i)) && isDrawable(pointY(d, i))).x(pointX).y(pointY);
        const line = selection.selectAll(".sszvis-pyramid__referenceline").data(data).join(enter => enter.append("path").attr("class", "sszvis-pyramid__referenceline")
        // Entering paths get their geometry synchronously: a transition alone would
        // leave getBBox, snapshots and PNG exports looking at an empty path.
        .attr("d", lineGen));
        line.attr("transform", props.mirror ? "scale(-1, 1)" : "").transition(defaultTransition()).attr("d", lineGen);
      });
    }
    /** Whether a computed coordinate can be written into a path string at all. */
    function isDrawable(value) {
      return Number.isFinite(Number(value));
    }

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
     *                                                   returned by the sszvis.layout.sankey.computeLayout function. Required: leaving it unset throws
     *                                                   before anything is drawn. Must be a plain number - an accessor, which most other properties in
     *                                                   this library accept, is rejected the same way. The bar's width is floored at one pixel but the
     *                                                   link starts and the column label centring read the raw value, so below a thickness of one the
     *                                                   two disagree.
     * @property {Number} nodePadding                    A number for padding between the nodes. Should be configured using a value returned by the
     *                                                   sszvis.layout.sankey.computeLayout function. It applies between nodes only; the links stacked
     *                                                   inside a node are spaced by the size scale alone and fill it exactly. It also sets how far a
     *                                                   label hit box extends past its node, half of it above and half below. Required and must be a
     *                                                   plain number; leaving it unset, or passing an accessor, throws before anything is drawn.
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
     * @property {Number, Function} columnLabelOpacity  A value for the opacity of the column labels, or a function taking a column index and returning
     *                                                   one. Default 1. Use it to fade the column headers out while a hover label occupies the same
     *                                                   space; labelOpacity does the same for the node labels. Like columnLabel, an accessor is called
     *                                                   with the column index alone.
     * @property {Number} linkCurvature                  A number to specify the amount of 'curvature' of the links. Should be between 0 and 1. Default
     *                                                   0.5, which puts both control points at the horizontal midpoint. Never clamped: at 1 the control
     *                                                   points swap ends, which still keeps the curve inside the column gap as a pronounced S, and above
     *                                                   1 they leave the gap altogether and the curve swings out past both columns. Must be a plain
     *                                                   number, like nodeThickness; an accessor is reported before anything is drawn.
     * @property {Color, Function} nodeColor             Color for the nodes. Can be a function that takes a node's data and returns a color. Optional:
     *                                                   when unset no fill attribute is written and the bars fall back to the stylesheet.
     * @property {Color, Function} linkColor             Color for the links. Can be a function that takes a link's data and returns a color. Optional, as
     *                                                   nodeColor: unset leaves the stroke attribute off the paths.
     * @property {Function} linkSort                     A function determining how to sort the links, which are rendered stacked on top of each other.
     *                                                   The comparator is handed to d3's selection.sort, which orders the elements ascending, so the
     *                                                   comparator's largest link is the last one in the document and paints over all the others. A
     *                                                   value that is not a function is reported, since a comparator can never be a constant. The
     *                                                   default comparator is descending by value, so the thinnest links paint over the thickest and a
     *                                                   thin link is never hidden by a thick one it crosses. This matches the descending order
     *                                                   sszvis.layout.sankey.prepareData puts the array in. The sort reorders elements only; the data
     *                                                   array, and with it the link tooltip
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
     *                                                   It applies to the node labels only; columnLabelOpacity covers the column labels. Use it to fade
     *                                                   the node names out when they would overlap with user-triggered hover labels.
     * @property {Number} labelHitBoxSize                A number for the width of the transparent 'hit boxes' drawn over the labels. This should
     *                                                   basically be equal to the width of the widest label. For performance reasons, it doesn't make
     *                                                   sense to calculate this value at run time while the component is rendered. Far better is to
     *                                                   position the chart so that the labels are visible, find the value of the widest label, and use
     *                                                   that. Default 0, which leaves a box exactly as wide as a node. Must be a plain number, and an
     *                                                   accessor is reported: the width
     *                                                   is computed once, from labelHitBoxSize plus nodeThickness, so every box is the same width
     *                                                   whatever its own label says. The boxes are appended after the labels and so paint over them,
     *                                                   which is what lets them catch the pointer.
     * @property {String, Function} nameLabel           A string, or a function which takes the id of a node and returns the label for that node.
     *                                                   Defaults to using the id directly.
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
     * Note: a size scale that returns NaN for one value - a d3 scale fed undefined, a gap in the
     * data - is reported. The node bars are guarded by bar, which replaces NaN with 0, and the
     * node labels and hit boxes follow the same rule with a warning. A link whose geometry is
     * not finite cannot be drawn correctly at all, so it is warned about and left out of the
     * document rather than drawn wrong.
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
     * true and the node rects ease to their new geometry over bar's transition. A caller cannot
     * turn that off, since the property is not forwarded. See test/component/sankey.test.ts.
     *
     * @return {sszvis.component}
     */
    /* Constants
    ----------------------------------------------- */
    /** Padding between the nodes and the links attached to them. Deliberately not a property. */
    const LINK_PADDING = 1;
    /** How far above the columns the column labels and their ticks are drawn. */
    const COLUMN_LABEL_Y = -24;
    /* Helper functions
    ----------------------------------------------- */
    const linkPathString = (x0, x1, x2, x3, y0, y1) => "M".concat(x0, ",").concat(y0, "C").concat(x1, ",").concat(y0, " ").concat(x2, ",").concat(y1, " ").concat(x3, ",").concat(y1);
    const linkBounds = (x0, x1, y0, y1) => [x0, x1, y0, y1];
    /** The links are keyed on their id, so a redrawn link keeps its path element. */
    const idAcc = link => link.id;
    /** True when every number is a real, drawable coordinate. */
    function allFinite(values) {
      return values.every(v => Number.isFinite(v));
    }
    /* Module
    ----------------------------------------------- */
    function sankey () {
      return component().prop("sizeScale").prop("columnPosition").prop("nodeThickness").prop("nodePadding").prop("columnPadding", functor).prop("columnLabel", functor).columnLabel("").prop("columnLabelOffset", functor).columnLabelOffset(0).prop("columnLabelOpacity", functor).columnLabelOpacity(1).prop("linkCurvature").linkCurvature(0.5).prop("nodeColor", functor).prop("linkColor", functor).prop("linkSort").linkSort((a, b) => b.value - a.value) // Descending, so the thinnest links paint on top
      .prop("labelSide", functor).labelSide("left").prop("labelSideSwitch").prop("labelOpacity", functor).labelOpacity(1).prop("labelHitBoxSize").labelHitBoxSize(0).prop("nameLabel", functor).nameLabel(identity).prop("linkSourceLabels").linkSourceLabels([]).prop("linkTargetLabels").linkTargetLabels([]).prop("linkLabel", functor).render(function (data) {
        var _props$linkColor, _props$linkLabel, _props$linkLabel2;
        const selection = d3.select(this);
        const props = selection.props();
        // Checked before anything is drawn. These four are used directly in arithmetic, so
        // an unset value or an accessor - the shape most other properties in this library
        // accept - produces NaN geometry, which bar's missing-value guard turns into an
        // empty-looking chart rather than an error.
        for (const name of ["nodeThickness", "nodePadding", "labelHitBoxSize", "linkCurvature"]) {
          if (typeof props[name] !== "number" || !Number.isFinite(props[name])) {
            throw new Error("[sankey] the ".concat(name, " property must be a number"));
          }
        }
        if (typeof props.linkSort !== "function") {
          throw new Error("[sankey] the linkSort property must be a comparator function");
        }
        const getNodePosition = node => Math.floor(props.columnPadding(node.columnIndex) + props.sizeScale(node.valueOffset) + props.nodePadding * node.nodeIndex);
        const xPosition = node => props.columnPosition(node.columnIndex);
        const yPosition = node => getNodePosition(node);
        const xExtent = () => Math.max(props.nodeThickness, 1);
        const yExtent = node => Math.ceil(Math.max(props.sizeScale(node.value), 1));
        // Draw the nodes
        const barGen = bar().x(xPosition).y(yPosition).width(xExtent).height(yExtent).fill(props.nodeColor);
        const barGroup = selection.selectGroup("nodes").datum(data.nodes);
        barGroup.call(barGen);
        const barTooltipAnchor = tooltipAnchor().position(node => [xPosition(node) + xExtent() / 2, yPosition(node) + yExtent(node) / 2]);
        barGroup.call(barTooltipAnchor);
        // Draw the column labels
        const columnLabelX = colIndex => props.columnPosition(colIndex) + props.nodeThickness / 2;
        const columnLabels = barGroup.selectAll(".sszvis-sankey-column-label")
        // One number for each column
        .data(data.columnLengths).join("text").attr("class", "sszvis-sankey-label sszvis-sankey-weak-label sszvis-sankey-column-label");
        columnLabels.attr("transform", (d, i) => translateString(columnLabelX(i) + props.columnLabelOffset(d, i), COLUMN_LABEL_Y)).text((_d, i) => props.columnLabel(i)).style("opacity", (_d, i) => props.columnLabelOpacity(i));
        const columnLabelTicks = barGroup.selectAll(".sszvis-sankey-column-label-tick").data(data.columnLengths).join("line").attr("class", "sszvis-sankey-column-label-tick");
        columnLabelTicks.attr("x1", (_d, i) => halfPixel(columnLabelX(i))).attr("x2", (_d, i) => halfPixel(columnLabelX(i))).attr("y1", halfPixel(COLUMN_LABEL_Y + 8)).attr("y2", halfPixel(COLUMN_LABEL_Y + 12));
        // Draw the links
        const linkPoints = link => {
          const curveStart = props.columnPosition(link.src.columnIndex) + props.nodeThickness + LINK_PADDING,
            curveEnd = props.columnPosition(link.tgt.columnIndex) - LINK_PADDING,
            startLevel = getNodePosition(link.src) + props.sizeScale(link.srcOffset) + props.sizeScale(link.value) / 2,
            endLevel = getNodePosition(link.tgt) + props.sizeScale(link.tgtOffset) + props.sizeScale(link.value) / 2;
          return [curveStart, curveEnd, startLevel, endLevel];
        };
        const linkPath = link => {
          const points = linkPoints(link),
            curveInterp = d3.interpolateNumber(points[0], points[1]),
            curveControlPtA = curveInterp(props.linkCurvature),
            curveControlPtB = curveInterp(1 - props.linkCurvature);
          return linkPathString(points[0], curveControlPtA, curveControlPtB, points[1], points[2], points[3]);
        };
        const linkBoundingBox = link => {
          const points = linkPoints(link);
          return linkBounds(points[0], points[1], points[2], points[3]);
        };
        const linkThickness = link => Math.max(props.sizeScale(link.value), 1);
        // Render the links. A link whose geometry is not finite - a size scale with a gap in
        // its domain - cannot be drawn at all: coercing it to zero would draw a link that is
        // merely wrong instead of one that is missing, so it is reported and left out.
        const drawableLinks = data.links.filter(link => {
          const points = linkPoints(link);
          if (allFinite([...points, props.sizeScale(link.value)])) return true;
          warn("[sankey] skipping a link with non-finite geometry, id:", link.id);
          return false;
        });
        const linksGroup = selection.selectGroup("links");
        const linksElems = linksGroup.selectAll(".sszvis-link").data(drawableLinks, idAcc).join("path").attr("class", "sszvis-link");
        linksElems.attr("fill", "none").attr("d", linkPath).attr("stroke-width", linkThickness).attr("stroke", (_props$linkColor = props.linkColor) !== null && _props$linkColor !== void 0 ? _props$linkColor : null).sort(props.linkSort);
        linksGroup.datum(drawableLinks);
        const linkTooltipAnchor = tooltipAnchor().position(link => {
          const bbox = linkBoundingBox(link);
          return [(bbox[0] + bbox[1]) / 2, (bbox[2] + bbox[3]) / 2];
        });
        linksGroup.call(linkTooltipAnchor);
        // Render the link labels
        const linkLabelsGroup = selection.selectGroup("linklabels");
        // If no props.linkSourceLabels are provided, most of this rendering is no-op
        const linkSourceLabels = linkLabelsGroup.selectAll(".sszvis-sankey-link-source-label").data(props.linkSourceLabels).join("text").attr("class", "sszvis-sankey-label sszvis-sankey-strong-label sszvis-sankey-link-source-label");
        linkSourceLabels.attr("transform", link => {
          const bbox = linkBoundingBox(link);
          return translateString(bbox[0] + 6, bbox[2]);
        }).text((_props$linkLabel = props.linkLabel) !== null && _props$linkLabel !== void 0 ? _props$linkLabel : null);
        // If no props.linkTargetLabels are provided, most of this rendering is no-op
        const linkTargetLabels = linkLabelsGroup.selectAll(".sszvis-sankey-link-target-label").data(props.linkTargetLabels).join("text").attr("class", "sszvis-sankey-label sszvis-sankey-strong-label sszvis-sankey-link-target-label");
        linkTargetLabels.attr("transform", link => {
          const bbox = linkBoundingBox(link);
          return translateString(bbox[1] - 6, bbox[3]);
        }).text((_props$linkLabel2 = props.linkLabel) !== null && _props$linkLabel2 !== void 0 ? _props$linkLabel2 : null);
        // Render the node labels and their hit boxes
        const getLabelSide = colIndex => {
          let side = props.labelSide(colIndex);
          if (props.labelSideSwitch) {
            side = side === "left" ? "right" : "left";
          }
          return side;
        };
        // The labels and the hit boxes are written by hand, so they need the guard bar
        // applies to the bars: a non-finite coordinate is reported and drawn at zero, which
        // keeps them on top of the zero-height bar the same value produced.
        const guarded = (value, node, what) => {
          if (Number.isFinite(value)) return value;
          warn("[sankey] non-finite ".concat(what, " for node"), node.id);
          return 0;
        };
        const safeY = node => guarded(yPosition(node), node, "position");
        const safeExtent = node => guarded(yExtent(node), node, "height");
        const nodeLabelsGroup = selection.selectGroup("nodelabels");
        const barLabels = nodeLabelsGroup.selectAll(".sszvis-sankey-node-label").data(data.nodes).join("text").attr("class", "sszvis-sankey-label sszvis-sankey-weak-label sszvis-sankey-node-label");
        barLabels.text(node => props.nameLabel(node.id)).attr("text-anchor", node => getLabelSide(node.columnIndex) === "left" ? "end" : "start").attr("x", node => getLabelSide(node.columnIndex) === "left" ? xPosition(node) - 6 : xPosition(node) + props.nodeThickness + 6).attr("y", node => safeY(node) + safeExtent(node) / 2).style("opacity", props.labelOpacity);
        const barLabelHitBoxes = nodeLabelsGroup.selectAll(".sszvis-sankey-hitbox").data(data.nodes).join("rect").attr("class", "sszvis-sankey-hitbox");
        barLabelHitBoxes.attr("fill", "transparent").attr("x", node => xPosition(node) + (getLabelSide(node.columnIndex) === "left" ? -props.labelHitBoxSize : 0)).attr("y", node => safeY(node) - props.nodePadding / 2).attr("width", props.labelHitBoxSize + props.nodeThickness).attr("height", node => safeExtent(node) + props.nodePadding);
      });
    }

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
     *                                            Should return a value in screen pixels. Required:
     *                                            leaving it unset throws before anything is appended.
     * @property {number, function} y0            An accessor for the lower bound of the band at a
     *                                            point, i.e. the baseline, or a constant. In screen
     *                                            pixels. Required, on the same terms as x.
     * @property {number, function} y1            An accessor for the upper bound of the band at a
     *                                            point, or a constant. In screen pixels. Required, on
     *                                            the same terms as x - but only an unset property is
     *                                            caught. An explicit null keeps its d3 meaning, which
     *                                            is "no upper bound": d3 then falls back to y0, so each
     *                                            layer collapses onto its own baseline and becomes a
     *                                            zero-height sliver.
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
     *                                            degenerate top-and-bottom pair. Defaults to a
     *                                            missing-value guard over both vertical bounds: a point
     *                                            whose y0 or y1 is null, undefined or has no numeric
     *                                            form is skipped and the area breaks around it, and the
     *                                            first such point in a render is logged as a warning.
     *                                            Setting it replaces that guard rather than composing
     *                                            with it, so an explicit predicate must test both
     *                                            bounds itself.
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
     * Note: the default defined predicate guards both vertical bounds by hand, as line does. The
     * expression it replaces read `function () { return fn.compose(fn.not(isNaN), props.y0) &&
     * fn.compose(...y1); }` and so returned a function rather than calling either composed accessor -
     * and a function is truthy, which is all d3 tests - so a NaN reached the d attribute verbatim, the
     * browser stopped rendering at the invalid command, and the whole layer disappeared rather than
     * only the segment the missing value belonged to. The guard treats null and undefined as missing
     * too, which a plain isNaN test would not: isNaN(null) is false, so a null would coerce to 0 and be
     * plotted at the top of the chart. line, by contrast, still lets null through.
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
     * d3 takes either a constant or a value function, but not a union of the two, so a
     * dimension is narrowed once before it reaches the generator. Only the constant branch
     * needs wrapping, and it is wrapped exactly as d3's own constant(+value) was: the value is
     * coerced once, here, rather than once per point inside the attr callback. An unset
     * dimension therefore still resolves to NaN, and a value that cannot be coerced still
     * throws before the data join rather than after it.
     */
    const dimension$2 = value => {
      if (typeof value === "function") return value;
      // An unset dimension is spelled out because TypeScript will not coerce undefined, and
      // +undefined is NaN.
      const constant = value === undefined ? Number.NaN : +value;
      return () => constant;
    };
    /**
     * Whether a bound counts as missing, and so breaks the area at that point.
     *
     * A value is missing when it is null-ish or when it has no numeric form. The null-ish half
     * goes beyond the isNaN guard this default was always meant to be - isNaN(null) is false,
     * so a null would coerce to 0 and be plotted at the top of the chart - and beyond
     * src/component/line.ts, whose guard is documented as letting null through. A null
     * measurement is missing data, not a zero, and there is no way to say "plot this at zero"
     * with null that saying 0 does not say better.
     */
    const isMissingVal$1 = value => value == null || Number.isNaN(Number(value));
    /**
     * As above, for the style properties. An unset property becomes a function returning null,
     * which d3 removes the attribute for - the same thing it does when handed undefined
     * directly.
     */
    function stackedArea() {
      return component().prop("x").prop("y0").prop("y1").prop("fill").prop("stroke").prop("strokeWidth").prop("defined").prop("key").key((_datum, index) => index).prop("transition").transition(true).render(function (data) {
        var _props$fill;
        const selection = d3.select(this);
        const props = selection.props();
        // x, y0 and y1 are all required, and each used to fail differently and silently: an
        // unset dimension reached d3 as undefined and resolved to a constant NaN, while an
        // unset y1 was read by d3 as "no upper bound" and fell back to y0, collapsing every
        // band onto its own baseline - a chart that renders and is wrong. A missing dimension
        // is a misconfiguration that can never render, so it throws, and it throws before the
        // data join, so nothing is appended. An explicit .y1(null) keeps its d3 meaning and is
        // deliberately not caught: only an unset property is.
        for (const required of ["x", "y0", "y1"]) {
          if (props[required] === undefined) {
            throw new Error("[stackedArea] the ".concat(required, " property is required"));
          }
        }
        // Layouts
        const y0 = dimension$2(props.y0);
        const y1Given = props.y1 == null ? undefined : dimension$2(props.y1);
        // The default guards both vertical bounds, the way src/component/line.ts guards both
        // of its dimensions by hand. It is deliberately not composed: the expression this
        // replaces - `fn.compose(fn.not(isNaN), props.y0) && fn.compose(..., props.y1)` -
        // returned a function rather than calling either of them, and a function is truthy,
        // so the guard never ran. A dropped point is reported once per render, because a gap
        // in the data is transient and recoverable: the area simply breaks around it.
        let reported = false;
        const guardMissing = (datum, index, points) => {
          const missing = isMissingVal$1(y0(datum, index, points)) || y1Given !== undefined && isMissingVal$1(y1Given(datum, index, points));
          if (missing && !reported) {
            reported = true;
            warn("[stackedArea] a point has a missing y0 or y1 value and was skipped; the area breaks around it.");
          }
          return !missing;
        };
        const defined = props.defined === undefined ? guardMissing : typeof props.defined === "function" ? props.defined : () => Boolean(props.defined);
        const areaGen = d3.area().defined(defined).x(dimension$2(props.x)).y0(y0);
        // d3 reads a null-ish upper bound as "no upper bound" and falls back to y0, which is
        // why an unset y1 collapses every layer onto its own baseline. Its typings admit only
        // null, so undefined is spelled out here; d3 itself tests `_ == null` and treats the
        // two identically.
        if (y1Given === undefined) {
          areaGen.y1(null);
        } else {
          areaGen.y1(y1Given);
        }
        // Rendering
        const pathData = datum => areaGen(datum);
        const fill = valueFn((_props$fill = props.fill) !== null && _props$fill !== void 0 ? _props$fill : null);
        // The white hairline separating two touching layers. Applied with a truthiness check
        // rather than an undefined one, so a null or empty stroke is replaced by it too.
        const stroke = valueFn(props.stroke || "#ffffff");
        const strokeWidth = valueFn(props.strokeWidth === undefined ? 1 : props.strokeWidth);
        const paths = selection.selectAll("path.sszvis-path").data(data, props.key).join("path").classed("sszvis-path", true);
        // Every visual property is applied to the transition when there is one, so the two
        // branches are spelled out rather than sharing a variable - a d3 transition and a d3
        // selection have separate types.
        if (props.transition) {
          paths.transition(defaultTransition()).attr("d", pathData).attr("fill", fill).attr("stroke", stroke).attr("stroke-width", strokeWidth);
        } else {
          paths.attr("d", pathData).attr("fill", fill).attr("stroke", stroke).attr("stroke-width", strokeWidth);
        }
      });
    }

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
     *                                            Should return a value in screen pixels. Required:
     *                                            leaving it unset throws before anything is appended.
     * @property {number, function} y0            An accessor for the lower bound of the band at a
     *                                            point, i.e. the baseline, or a constant. In screen
     *                                            pixels. Required, on the same terms as x.
     * @property {number, function} y1            An accessor for the upper bound of the band at a
     *                                            point, or a constant. In screen pixels. Required, on
     *                                            the same terms as x - but only an unset property is
     *                                            caught. An explicit null keeps its d3 meaning, which
     *                                            is "no upper bound": d3 then falls back to y0, so each
     *                                            band collapses onto its own baseline and becomes a
     *                                            zero-height sliver, and with no default stroke to draw
     *                                            it there is nothing on screen.
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
     *                                            degenerate top-and-bottom pair. Defaults to a
     *                                            missing-value guard over both vertical bounds: a point
     *                                            whose y0 or y1 is null, undefined or has no numeric
     *                                            form is skipped and the band breaks around it, and the
     *                                            first such point in a render is logged as a warning.
     *                                            Setting it replaces that guard rather than composing
     *                                            with it, so an explicit predicate must test both
     *                                            bounds itself.
     * @property {function} [key]                 The key function for the data join, called with a
     *                                            layer and its index. The value it returns should be
     *                                            unique among layers. Defaults to the index, which
     *                                            matches layers by position in the array that was
     *                                            passed in, as stackedArea's does.
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
     *                                            change. Defaults to true. An updating band eases into
     *                                            its new geometry and colours over 300ms; an entering
     *                                            band is painted synchronously (see below).
     *
     * Note: a constant dimension is coerced with unary + once, before the data join, exactly as d3's own
     * constant() would - so a numeric string works, while a value that has no numeric form, such as
     * "abc" or {}, becomes NaN once and every point of every layer is drawn from it, which d3 emits as
     * an invalid path rather than an error. Only a value whose coercion itself throws, such as a Symbol
     * or a BigInt, raises - and it raises before the join rather than once per point.
     *
     * Note: the layers are bound in the order they were given, as stackedArea binds them, so the first
     * layer of the input is the first path in the DOM and the index handed to the style accessors, to
     * key and to valuesAccessor is its position in that array. The component used to reverse the data
     * before the join - a line carrying an unanswered "//sszsch why reverse?" comment since 2017, which
     * nothing explained - which mirrored every index, applied an index-keyed palette back to front, and
     * moved both paths whenever docs/area-chart-stacked/sa-two.js toggled between the two views.
     * .join() orders the merged selection, so the paint order follows the data on every render, even
     * when the nodes are reused.
     *
     * Note: transition applies to updating bands only. An entering band is painted directly, as bar
     * does, so a freshly rendered chart is complete on the same tick rather than leaving an empty path
     * element until the first animation frame, which is what stackedArea does. A band already on screen
     * holds its old geometry and colours and eases into the new ones over 300ms. Between 47f58578
     * ("perf: change .enter() to .join() API", Oct 2024) and this fix the transition was created on its
     * own statement with its return value dropped, so it carried no tweens and every attribute was
     * written to the plain selection: nothing animated, while the schedule still interrupted whatever
     * else was animating those nodes.
     *
     * Note: the dimension accessors and defined are called by d3.area with a single point, that point's
     * index within the layer, and the array of points the layer is drawn from. fill, stroke,
     * strokeWidth and valuesAccessor are called by the selection with the datum for a whole layer, that
     * layer's index, and d3's group of path nodes, with the node itself as `this`. The style-related
     * accessors therefore receive the layer object rather than a point, the inverse of what the
     * dimensions receive - the same asymmetry documented on line.
     * That third argument is the group of the half of the join being evaluated, not of the merged
     * selection: entering and updating bands are styled separately so that an entering one can be
     * painted synchronously, and d3 leaves a null hole in each half's group for every node belonging
     * to the other. A render that both reuses and enters bands therefore hands these accessors a
     * sparse ArrayLike, so an accessor that walks it - rather than reading its own datum, as the
     * first two arguments give it - has to skip the holes. key has the same caveat, below.
     * key sees a layer and its index too, but its third argument depends on which half of the keyed
     * join is running: the array of incoming layers, or the group of nodes already in the DOM.
     *
     * Note: the default defined predicate guards both vertical bounds by hand, as stackedArea and line
     * do. The expression it replaces read `function () { return fn.compose(fn.not(isNaN), props.y0) &&
     * fn.compose(...y1); }` and so returned a function rather than calling either composed accessor -
     * and a function is truthy, which is all d3 tests - so a NaN reached the d attribute verbatim, the
     * browser stopped rendering at the invalid command, and the whole band disappeared rather than only
     * the segment the missing value belonged to. The guard treats null and undefined as missing too,
     * which a plain isNaN test would not: isNaN(null) is false, so a null would coerce to 0 and be
     * plotted at the top of the chart. line, by contrast, still lets null through.
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
     * winds the other way. See test/component/stackedAreaMultiples.test.ts.
     *
     * @return {sszvis.component}
     */
    /**
     * d3 takes either a constant or a value function, but not a union of the two, so a
     * dimension is narrowed once before it reaches the generator. Only the constant branch
     * needs wrapping, and it is wrapped exactly as d3's own constant(+value) was: the value is
     * coerced once, here, rather than once per point inside the attr callback. An unset
     * dimension therefore still resolves to NaN, as does one with no numeric form, and only a
     * value whose coercion itself throws - a Symbol, a BigInt - raises, before the data join
     * rather than after it.
     */
    const dimension$1 = value => {
      if (typeof value === "function") return value;
      // An unset dimension is spelled out because TypeScript will not coerce undefined, and
      // +undefined is NaN.
      const constant = value === undefined ? Number.NaN : +value;
      return () => constant;
    };
    /**
     * Whether a bound counts as missing, and so breaks the band at that point.
     *
     * A value is missing when it is null-ish or when it has no numeric form. The null-ish half
     * goes beyond the isNaN guard this default was always meant to be - isNaN(null) is false,
     * so a null would coerce to 0 and be plotted at the top of the chart - and beyond
     * src/component/line.ts, whose guard is documented as letting null through. A null
     * measurement is missing data, not a zero. Matches src/component/stackedArea.ts.
     */
    const isMissingVal = value => value == null || Number.isNaN(Number(value));
    /**
     * As above, for the style properties. An unset property becomes a function returning null,
     * which d3 removes the attribute for - the same thing it does when handed undefined
     * directly.
     */
    function stackedAreaMultiples() {
      return component().prop("x").prop("y0").prop("y1").prop("fill").prop("stroke").prop("strokeWidth").prop("defined").prop("key").key((_datum, index) => index).prop("valuesAccessor")
      // The default layer type L is P[], so the values ARE the layer and identity is correct.
      // A caller who sets a different L must supply a matching accessor; the constraint
      // cannot express "identity is valid only for the default instantiation".
      .valuesAccessor(identity).prop("transition").transition(true).render(function (data) {
        var _props$fill, _props$stroke;
        const selection = d3.select(this);
        const props = selection.props();
        // x, y0 and y1 are all required, and each used to fail differently and silently: an
        // unset dimension reached d3 as undefined and resolved to a constant NaN, while an
        // unset y1 was read by d3 as "no upper bound" and fell back to y0, collapsing every
        // band onto its own baseline - a chart that renders and is wrong. A missing dimension
        // is a misconfiguration that can never render, so it throws, and it throws before the
        // data join, so nothing is appended. An explicit .y1(null) keeps its d3 meaning and is
        // deliberately not caught: only an unset property is.
        for (const required of ["x", "y0", "y1"]) {
          if (props[required] === undefined) {
            throw new Error("[stackedAreaMultiples] the ".concat(required, " property is required"));
          }
        }
        // Layouts
        const y0 = dimension$1(props.y0);
        const y1Given = props.y1 == null ? undefined : dimension$1(props.y1);
        // The default guards both vertical bounds, the way src/component/line.ts guards both
        // of its dimensions by hand. It is deliberately not composed: the expression this
        // replaces - `fn.compose(fn.not(isNaN), props.y0) && fn.compose(..., props.y1)` -
        // returned a function rather than calling either of them, and a function is truthy,
        // so the guard never ran. A dropped point is reported once per render, because a gap
        // in the data is transient and recoverable: the band simply breaks around it.
        let reported = false;
        const guardMissing = (datum, index, points) => {
          const missing = isMissingVal(y0(datum, index, points)) || y1Given !== undefined && isMissingVal(y1Given(datum, index, points));
          if (missing && !reported) {
            reported = true;
            warn("[stackedAreaMultiples] a point has a missing y0 or y1 value and was skipped; the band breaks around it.");
          }
          return !missing;
        };
        const defined = props.defined === undefined ? guardMissing : typeof props.defined === "function" ? props.defined : () => Boolean(props.defined);
        const areaGen = d3.area().defined(defined).x(dimension$1(props.x)).y0(y0);
        // d3 reads a null-ish upper bound as "no upper bound" and falls back to y0, which is
        // why an unset y1 collapses every band onto its own baseline. Its typings admit only
        // null, so undefined is spelled out here; d3 itself tests `_ == null` and treats the
        // two identically.
        if (y1Given === undefined) {
          areaGen.y1(null);
        } else {
          areaGen.y1(y1Given);
        }
        // Rendering
        // Declared with `function` so that `this` and the node group are still forwarded to
        // valuesAccessor, as they were when this was built with fn.compose.
        const pathData = function (datum, index, group) {
          return areaGen(props.valuesAccessor.call(this, datum, index, group));
        };
        const fill = valueFn((_props$fill = props.fill) !== null && _props$fill !== void 0 ? _props$fill : null);
        // No default, where stackedArea falls back to a #ffffff hairline.
        const stroke = valueFn((_props$stroke = props.stroke) !== null && _props$stroke !== void 0 ? _props$stroke : null);
        const strokeWidth = valueFn(props.strokeWidth === undefined ? 1 : props.strokeWidth);
        // An entering band is painted synchronously, as bar does, so it is complete on the
        // tick it appears on rather than staying an empty path element until the first
        // animation frame - which is stackedArea's own quirk and not one worth importing.
        // Only the bands already on screen are transitioned, so each attribute is written
        // exactly once per render either way. The two branches are spelled out rather than
        // sharing a variable, since a d3 transition and a d3 selection have separate types.
        // The transition used to be created on its own statement with its return value
        // dropped, which left it carrying no tweens while still interrupting whatever else
        // was animating these nodes.
        selection.selectAll("path.sszvis-path").data(data, props.key).join(enter => enter.append("path").classed("sszvis-path", true).attr("d", pathData).attr("fill", fill).attr("stroke", stroke).attr("stroke-width", strokeWidth), update => {
          if (props.transition) {
            update.transition(defaultTransition()).attr("d", pathData).attr("fill", fill).attr("stroke", stroke).attr("stroke-width", strokeWidth);
            return update;
          }
          return update.attr("d", pathData).attr("fill", fill).attr("stroke", stroke).attr("stroke-width", strokeWidth);
        });
      });
    }

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
     * source row the slice was computed from - or undefined, where the row carries no value for that
     * series and the slice is a zero-width pad. d3's own `key` and `index` are carried across onto each
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
     * @property {number, function} barWidth      The width of a bar. Required: an unset prop throws a
     *                                            named TypeError before anything is drawn, because the
     *                                            component computes both the x and the width of every
     *                                            bar itself. A function is a scale over stacked values,
     *                                            called with one of the numbers out of a slice's [y0,
     *                                            y1] pair rather than with the slice - pyramid calls
     *                                            the same property with the bar's datum, and an
     *                                            accessor written for pyramid reads properties off a
     *                                            number here and yields NaN, which bar's guard turns
     *                                            into 0. It is called without d3's index and group, so
     *                                            an index-aware or node-aware accessor collapses every
     *                                            width and every x to 0 on both sides; pyramid has the
     *                                            same omission on its left side only. A number is the
     *                                            constant width of every segment, measured from the
     *                                            spine outwards, and is the one dimension not run
     *                                            through fn.functor, so that a constant stays
     *                                            distinguishable from a scale.
     * @property {number, function} barPosition   The vertical position of a bar, i.e. its top edge.
     *                                            Required, and an unset prop throws too, but from
     *                                            inside fn.compose ("Cannot read properties of
     *                                            undefined (reading 'call')") rather than from the
     *                                            component's own closure the way barWidth does. Both
     *                                            surface while bar is applying its attributes. It is
     *                                            called with the slice's `row`, i.e. the value the
     *                                            layout's row accessor returned, so it is a scale over
     *                                            the row domain. It is called with nothing else, so an
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
     *                                            reference points, {row, value}: barWidth maps the
     *                                            value to x and barPosition the row to y, the same way
     *                                            round as in the bars, so a slice of the layout
     *                                            satisfies the shape unchanged. Optional, but the guard
     *                                            tests whether the accessor was set, not what it
     *                                            returns: an accessor that yields undefined or null for
     *                                            some states throws instead of hiding the line.
     *                                            Returning an empty array does hide it, though the
     *                                            classed path element stays in the DOM with no d
     *                                            attribute, where CSS and hit tests can still find it.
     * @property {function} [rightRefAccessor]    Reference data for the right side. Same as
     *                                            leftRefAccessor.
     *
     * Note: a side's series keys are the union of the series across every row of that side, in the
     * order the rows first mention them, and that order is the stacking order. A row that carries no
     * value for one of them contributes a zero slice whose `data` is undefined - the alternative would
     * be to drop the row from the layer entirely, which d3.stack does not offer. Sparse data therefore
     * needs no padding rows. Such a slice is zero-width, so nothing of it is painted and barFill is
     * not called for it: an accessor written over the source row never sees an undefined datum, and
     * does not have to guard for one.
     *
     * Note: the cascade groups on String(key) - for the sides, the rows and the series alike - so keys
     * that differ only in type merge, and the number 1 and the string "1" land in the same cell where
     * only the first of them is stacked. The ordering follows from the same coercion: JavaScript
     * iterates array-index keys in ascending numeric order regardless of insertion order, so dense
     * non-negative integer rows sort themselves, while negative, fractional or plain string rows fall
     * back to insertion order and are laid out in whatever order the input happened to be in. Since
     * barPosition receives the row's own value that ordering is cosmetic for the bars - it decides only
     * which slice is drawn first - but a `row` that is a string comes back as the accessor returned it,
     * not as the cascade's stringified key. The sides are ordered the same way and
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
     * upper bounds only, so it is not the extent of the data when a value is negative. An empty layout
     * reports 0, so a scale domain built from it stays valid. A slice's `value` is a convenience of the
     * same kind:
     * the component never reads it, and it duplicates d[1] - d[0] as it stood when the layout ran, so
     * it goes stale if a caller rewrites the pair. Shared with stackedBarData. See
     * test/component/stackedPyramid.test.ts.
     *
     * Note: a reference series is an array of {row, value} points, so barWidth maps the value to x and
     * barPosition the row to y - the same division of labour as in the bars, which is what makes the
     * outline land in their coordinate system. Neither property receives d3's index, on the line or in
     * the bars. pyramid's byte-identical lineComponent still takes plain data, since there both
     * properties read the bar's datum and the question does not arise. The only stackedPyramid example
     * sets neither reference accessor.
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
     * bars underneath animate over the same duration, so the outline and the bars it describes stay
     * together for the length of the transition. bar also guards every geometry value against NaN while the line
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
     * Note: the stack join is a child selector, ":scope > [data-sszvis-stack]", so only the groups the
     * component owns take part in it and a caller may render content of its own - including further
     * stack groups - inside a series group without the join adopting it. The bars inside each series
     * group are still joined with an unscoped selectAll(".sszvis-bar") by bar itself, so a planted
     * rect.sszvis-bar descendant is captured there. stackedBar's copy of the same descendant selector
     * on the stack groups is unfixed.
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
    /* Constants
    ----------------------------------------------- */
    const SPINE_PADDING = 0.5;
    const rowAcc = prop("row");
    /**
     * The first source row of a cascade row, i.e. of whichever series that row happens to carry.
     * A cascade row exists only because a source row landed in it, so there is always one.
     */
    function firstCell(row) {
      return Object.values(row)[0][0];
    }
    /* Data layout
    ----------------------------------------------- */
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
    function stackedPyramidData(sideAcc,
    // cascade stringifies its keys, so a numeric row or series accessor - an age, a year, a
    // category code - groups the same way a string one does. The series keys are read back off
    // the cascade row with Object.keys, which is why `series` stays a string.
    rowValueAcc, seriesAcc, valueAcc) {
      return data => {
        var _max;
        const grouped = cascade().arrayBy(sideAcc).arrayBy(rowValueAcc).objectBy(seriesAcc).apply(data);
        const sides = grouped.map(rows => {
          // The union of the series across every row of the side, so a series that appears in
          // only some of the rows still gets a layer. The key order is the stacking order, and
          // it follows the order the rows first mention each series in.
          const keys = set$1(rows.flatMap(row => Object.keys(row)));
          const side = sideAcc(firstCell(rows[0]));
          const stacks = d3.stack().keys(keys)
          // Only the first datum of each cell is read; a cell the row has no datum for
          // contributes zero.
          .value((x, key) => x[key] === undefined ? 0 : valueAcc(x[key][0]))(rows);
          // Simplify the 'data' property. The slices themselves are the objects d3 created,
          // rewritten in place, so a caller holding one sees the new shape. The series arrays are
          // rebuilt, so d3's own `key` and `index` - the only two properties it hangs off a
          // series - have to be carried across by hand.
          return stacks.map((stack, i) => {
            const slices = stack.map(d => {
              var _d$data$keys$i;
              // A row the side's series is absent from has no source row to point at, so the
              // padding slice carries no data and a zero value.
              const datum = (_d$data$keys$i = d.data[keys[i]]) === null || _d$data$keys$i === void 0 ? void 0 : _d$data$keys$i[0];
              return Object.assign(d, {
                data: datum,
                series: keys[i],
                side,
                // The value the row accessor returned, read off whichever series the cascade
                // row does carry - a padding slice has no source row of its own.
                row: rowValueAcc(firstCell(d.data)),
                value: datum === undefined ? 0 : valueAcc(datum)
              });
            });
            return Object.assign(slices, {
              key: stack.key,
              index: stack.index
            });
          });
        });
        // Compute the max value, for convenience. This value is needed to construct
        // the horizontal scale.
        const maxValue = (_max = d3.max(sides, s => d3.max(s, rows => d3.max(rows, row => row[1])))) !== null && _max !== void 0 ? _max : 0;
        return Object.assign(sides, {
          maxValue
        });
      };
    }
    /* Module
    ----------------------------------------------- */
    function stackedPyramid() {
      return component().prop("barHeight", functor)
      // Deliberately not fn.functor: see StoredWidth.
      .prop("barWidth").prop("barPosition", functor).prop("barFill", functor).barFill("#000").prop("tooltipAnchor").tooltipAnchor([0.5, 0.5]).prop("leftAccessor").prop("rightAccessor").prop("leftRefAccessor").prop("rightRefAccessor").render(function (data) {
        const selection = d3.select(this);
        const props = selection.props();
        const barWidth = props.barWidth;
        if (barWidth === undefined) {
          // A misconfiguration that can never render: thrown before any element is created,
          // because the component computes both the x and the width of every bar from it.
          throw new TypeError("[sszvis.stackedPyramid] the barWidth property is required: pass a scale over the " + "stacked values, or a number for a constant segment width.");
        }
        // A constant barWidth is a segment width rather than a scale, so it is used directly
        // instead of being subtracted from itself, which would collapse every bar to zero.
        const widthScale = typeof barWidth === "function" ? barWidth : null;
        const constantWidth = typeof barWidth === "function" ? 0 : barWidth;
        /** The edge of a segment nearer the spine, measured outwards from it. */
        const innerEdge = d => widthScale ? widthScale(d[0]) : 0;
        /** The edge of a segment further from the spine. */
        const outerEdge = d => widthScale ? widthScale(d[1]) : constantWidth;
        // A constant barWidth still has to respect the synthetic padding a sparse row is
        // filled with: that slice stands for a series the row has no observation for, so it
        // is a zero-width pad rather than a full-width bar. The scale branch gets this for
        // free, since a pad's two bounds are equal. A genuine zero-valued observation keeps
        // the fixed width, which is the point of constant mode.
        const segmentWidth = d => widthScale ? widthScale(d[1]) - widthScale(d[0]) : d.data === undefined ? 0 : constantWidth;
        // A padding slice stands for a series this row has no observation for. It is drawn
        // zero-wide, so its fill is never visible - and calling barFill for it would hand a
        // row-shaped accessor an undefined datum, which is what used to throw. Skipped
        // rather than widened, so the public accessor contract stays honest.
        const barFillOf = d => d.data === undefined ? undefined : props.barFill(d.data);
        // Components
        const leftBar = bar().x(d => -SPINE_PADDING - outerEdge(d)).y(compose(props.barPosition, rowAcc)).height(props.barHeight).width(segmentWidth).fill(barFillOf).tooltipAnchor(props.tooltipAnchor);
        const rightBar = bar().x(d => SPINE_PADDING + innerEdge(d)).y(compose(props.barPosition, rowAcc)).height(props.barHeight).width(segmentWidth).fill(barFillOf).tooltipAnchor(props.tooltipAnchor);
        const leftStack = stackComponent().stackElement(leftBar);
        const rightStack = stackComponent().stackElement(rightBar);
        // The line reads a reference point's value through the same scale, or parks it at the
        // constant when barWidth is one.
        const referenceWidth = widthScale !== null && widthScale !== void 0 ? widthScale : () => constantWidth;
        const leftLine = lineComponent().barPosition(props.barPosition).barWidth(referenceWidth).mirror(true);
        const rightLine = lineComponent().barPosition(props.barPosition).barWidth(referenceWidth);
        // Rendering
        selection.selectGroup("leftStack").datum(props.leftAccessor(data)).call(leftStack);
        selection.selectGroup("rightStack").datum(props.rightAccessor(data)).call(rightStack);
        selection.selectGroup("leftReference").datum(props.leftRefAccessor ? [props.leftRefAccessor(data)] : []).call(leftLine);
        selection.selectGroup("rightReference").datum(props.rightRefAccessor ? [props.rightRefAccessor(data)] : []).call(rightLine);
      });
    }
    /**
     * Joins one group per series and draws that series' slices with the bar component it was
     * given. The datum handed to this component is one side of the pyramid.
     */
    function stackComponent() {
      return component().prop("stackElement").renderSelection(selection => {
        const datum = selection.datum();
        const props = selection.props();
        const stack = selection
        // A child selector: a stack group nested inside another one belongs to whoever put
        // it there, and binding it here would remove a real series group and then throw out
        // of the join's reorder.
        .selectAll(":scope > [data-sszvis-stack]").data(datum).join("g").attr("data-sszvis-stack", "");
        stack.each(function (d) {
          d3.select(this).datum(d).call(props.stackElement);
        });
      });
    }
    /**
     * Draws one side's reference outline as a single path. The data is one array of reference
     * points per path, so the datum handed to this component is an array of arrays - in practice
     * always of length one, since each side has at most one reference line.
     */
    function lineComponent() {
      return component().prop("barPosition").prop("barWidth").prop("mirror").mirror(false).render(function (data) {
        const selection = d3.select(this);
        const props = selection.props();
        // Each half of a point is mapped by the property that owns it, so the outline lands in
        // the coordinate system the bars are drawn in.
        const lineGen = d3.line().x(d => props.barWidth(d.value)).y(d => props.barPosition(d.row));
        const line = selection.selectAll(".sszvis-path").data(data).join("path").attr("class", "sszvis-path").attr("fill", "none").attr("stroke", "#aaa").attr("stroke-width", 2).attr("stroke-dasharray", "3 3");
        line.attr("transform", props.mirror ? "scale(-1, 1)" : "").transition(defaultTransition()).attr("d", lineGen);
      });
    }

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
    const TWO_PI = 2 * Math.PI;
    function sunburst () {
      // The chain is built on the component rather than returned from it: .prop() and .render()
      // are declared to return the generic Component type, since the accessors they install only
      // exist at runtime, so the typed instance has to come from the factory itself.
      const sunburstComponent = component();
      sunburstComponent.prop("angleScale").angleScale(d3.scaleLinear().range([0, 2 * Math.PI])).prop("radiusScale").prop("centerRadius").prop("fill", functor).prop("stroke").stroke("white").render(function (inputData) {
        const selection = d3.select(this);
        const props = selection.props();
        // radiusScale, centerRadius and fill are required and have no defaults, and a render
        // without any one of them cannot come out right - so they are checked here, before a
        // single element is created. Left unchecked they fail three different ways: fill
        // throws immediately, radiusScale throws from the tooltip anchor once the arcs and
        // their transition are already in flight (and then once per frame for the length of
        // the transition), and centerRadius does not throw at all - it turns every radius
        // into NaN and renders an empty chart.
        for (const required of ["radiusScale", "centerRadius", "fill"]) {
          if (props[required] === undefined) {
            throw new Error("[sunburst] the ".concat(required, " property is required"));
          }
        }
        // The angles currently on screen, read off the existing arcs before anything below can
        // overwrite them. A caller who keeps one hierarchy in state and re-sums it hands over
        // the same node objects the previous render left its x0/x1 on, and the partition
        // further down replaces those with the new layout - so the handover has to happen
        // first, or every transition would start where it is meant to end.
        const onScreen = selection.selectAll(".sszvis-sunburst-arc").nodes().map(element => {
          // A path inserted without d3 has no datum at all, which throws here rather than
          // silently shifting the handover - see test/component/sunburst.test.ts.
          const d = Reflect.get(element, "__data__");
          return {
            angles: [d.x0, d.x1],
            // Absent until a render has drawn this arc once, in which case it starts at
            // whatever radii this render computes for it.
            radii: d.r0 === undefined || d.r1 === undefined ? undefined : [d.r0, d.r1]
          };
        });
        // NOTE: Determine if we have raw hierarchical data or pre-computed sunburst data
        // @deprecated in v3.4.0
        let nodes;
        if (Array.isArray(inputData)) {
          // Already computed sunburst data (backwards compatibility)
          nodes = inputData;
        } else {
          if (inputData.data._tag !== "root") {
            // A hierarchy that did not come from prepareHierarchyData carries none of its
            // tags. It is still rendered - the structure is all the layout needs - but the
            // caller is told once per chart rather than once per node.
            warn("Data passed to sszvis.component.sunburst does not have the expected tree structure. You should prepare it using sszvis.prepareHierarchyData");
          }
          const root = d3.partition()(inputData);
          const flatten = node => [node, ...(node.children || []).flatMap(flatten)];
          // The root is the node the layout has no parent for, whether or not it is tagged as
          // one: it fills the whole circle and would otherwise be drawn as a ring of its own
          // under the first visible one.
          nodes = flatten(root).filter(d => d.parent !== null && d.data._tag !== "root");
        }
        // The geometry accessors read positions off a node, so they are declared before the
        // destination values are stamped on. The two radius accessors return pixels, and are
        // the destination of the radius half of the transition.
        const startAngle = d => Math.max(0, Math.min(TWO_PI, props.angleScale(d.x0)));
        const endAngle = d => Math.max(0, Math.min(TWO_PI, props.angleScale(d.x1)));
        const innerRadius = d => props.centerRadius + Math.max(0, props.radiusScale(d.y0));
        const outerRadius = d => props.centerRadius + Math.max(0, props.radiusScale(d.y1));
        // _x0 and _x1 are the destination values for the transition. We set these to the
        // computed x0 and x1, and r0/r1 to the destination radii, which the handover below
        // replaces wherever an arc is already on screen. Object.assign writes them onto the
        // node the caller handed over and hands back that same node typed as carrying them, so
        // no cast is needed further down. Array.from rather than map, because it visits the
        // holes of a sparse array the way a for...of loop does, and so still fails before
        // anything is rendered.
        const data = Array.from(nodes, d => Object.assign(d, {
          _x0: d.x0,
          _x1: d.x1,
          r0: innerRadius(d),
          r1: outerRadius(d)
        }));
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
        const colorKey = node => "key" in node.data ? node.data.key : "";
        // Whether a node is the one the whole chart hangs off: tagged as the root by
        // prepareHierarchyData, or simply parentless in a hierarchy that came from elsewhere.
        const isRoot = node => node.data._tag === "root" || node.parent === null;
        // Accepts a sunburst node and returns a d3.hsl color for that node (sometimes operates recursively)
        function getColorRecursive(node) {
          if (!node.parent) {
            return d3.hsl(props.fill(colorKey(node)));
          } else if (isRoot(node.parent)) {
            // Use the color scale
            return d3.hsl(props.fill(colorKey(node)));
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
        const fillColor = node => isRoot(node) ? "transparent" : String(getColorRecursive(node));
        const arcGen = d3.arc().startAngle(startAngle).endAngle(endAngle)
        // The radii the arc is drawn at right now, which the tween walks towards the
        // destination ones. Reading props here instead would put a changed radius scale on
        // screen in full on the first frame, while the angles were still moving.
        .innerRadius(d => d.r0).outerRadius(d => d.r1);
        const arcs = selection.selectAll(".sszvis-sunburst-arc").data(data).join(enter =>
        // An entering arc has no colour to ease from, so it is painted outright; every
        // other attribute change goes through the transition below.
        enter.append("path").attr("class", "sszvis-sunburst-arc").attr("stroke", valueFn(props.stroke)).attr("fill", fillColor));
        // One transition for the whole arc: scheduling a second one on the same elements would
        // cancel this one.
        const arcTransition = arcs.transition(defaultTransition());
        arcTransition.attr("stroke", valueFn(props.stroke)).attr("fill", fillColor);
        arcTransition.attrTween("d", d => {
          const x0Interp = d3.interpolate(d.x0, d._x0);
          const x1Interp = d3.interpolate(d.x1, d._x1);
          const r0Interp = d3.interpolate(d.r0, innerRadius(d));
          const r1Interp = d3.interpolate(d.r1, outerRadius(d));
          return t => {
            var _arcGen;
            d.x0 = x0Interp(t);
            d.x1 = x1Interp(t);
            d.r0 = r0Interp(t);
            d.r1 = r1Interp(t);
            // arc returns null only for an empty path buffer, and every branch of it writes at
            // least a moveTo - even for NaN radii, which come out as "M0,0Z" - so this is
            // unreachable.
            return (_arcGen = arcGen(d)) !== null && _arcGen !== void 0 ? _arcGen : "";
          };
        });
        // Add tooltip anchors
        const arcTooltipAnchor = tooltipAnchor().position(d => {
          const startA = startAngle(d);
          const endA = endAngle(d);
          const a = startA + Math.abs(endA - startA) / 2 - Math.PI / 2;
          const r = (innerRadius(d) + outerRadius(d)) / 2;
          return [Math.cos(a) * r, Math.sin(a) * r];
        });
        // Rebind the group to the flattened array before rendering the anchors, the way pie
        // does. Without it the anchors are joined to whatever datum the caller bound - for a
        // hierarchy that is the root node, which d3 iterates into every descendant, so the
        // root gains an anchor of its own and the anchors come out breadth first while the
        // arcs are depth first.
        selection.datum(data).call(arcTooltipAnchor);
      });
      return sunburstComponent;
    }

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
     * @property {string, function} colorScale        The fill color for rectangles: a constant colour
     *                                                or an accessor taking a node's key
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
    /**
     * Main treemap component
     *
     * @template T The type of the original flat data objects
     */
    function treemap () {
      return component().prop("colorScale", functor).prop("transition").transition(true).prop("containerWidth").containerWidth(800) // Default width
      .prop("containerHeight").containerHeight(600) // Default height
      .prop("showLabels").showLabels(false) // Default disabled
      .prop("label", functor).label(d => d.data && "key" in d.data ? d.data.key : "").prop("labelPosition").labelPosition("center").prop("onClick").render(function (inputData) {
        const selection = d3.select(this);
        const props = selection.props();
        // Apply treemap layout to hierarchical data
        const layout = d3.treemap().tile(d3.treemapSquarify).size([props.containerWidth, props.containerHeight]).round(true).paddingInner(1).paddingOuter(2);
        layout(inputData);
        // Flatten the hierarchy and filter out root
        function flatten(node) {
          const result = [];
          if (node.children) {
            for (const child of node.children) {
              if (child.data._tag !== "root") {
                result.push(child);
              }
              result.push(...flatten(child));
            }
          } else if (node.data._tag !== "root") {
            result.push(node);
          }
          return result;
        }
        const treemapData = flatten(inputData);
        // Filter out very small rectangles and show only leaf nodes
        const visibleData = treemapData.filter(d => d.x1 - d.x0 > 0.5 && d.y1 - d.y0 > 0.5).filter(d => !d.children);
        const rectangles = selection.selectAll(".sszvis-treemap-rect").data(visibleData).join("rect").classed("sszvis-treemap-rect", true).attr("x", d => d.x0).attr("y", d => d.y0).attr("width", d => d.x1 - d.x0).attr("height", d => d.y1 - d.y0).attr("fill", d => {
          return nodeColor(d, props.colorScale);
        }).attr("stroke", "#ffffff").attr("stroke-width", 1).style("cursor", props.onClick ? "pointer" : "default").on("click", (event, d) => {
          var _props$onClick;
          return (_props$onClick = props.onClick) === null || _props$onClick === void 0 ? void 0 : _props$onClick.call(props, event, d);
        });
        // Apply transitions if enabled
        if (props.transition) {
          rectangles.transition(defaultTransition()).attr("x", d => d.x0).attr("y", d => d.y0).attr("width", d => d.x1 - d.x0).attr("height", d => d.y1 - d.y0);
        }
        // Render labels if enabled
        if (props.showLabels) {
          const fontSize = 12;
          const calculateLabelPosition = (d, position) => {
            const padding = 8;
            switch (position) {
              case "top-left":
                return {
                  x: d.x0 + padding,
                  y: d.y0 + fontSize + padding
                };
              case "center":
                return {
                  x: d.x0 + (d.x1 - d.x0) / 2,
                  y: d.y0 + (d.y1 - d.y0) / 2 + fontSize / 3
                };
              case "top-right":
                return {
                  x: d.x1 - padding,
                  y: d.y0 + fontSize + padding
                };
              case "bottom-left":
                return {
                  x: d.x0 + padding,
                  y: d.y1 - padding
                };
              case "bottom-right":
                return {
                  x: d.x1 - padding,
                  y: d.y1 - padding
                };
              default:
                return {
                  x: d.x0 + padding,
                  y: d.y0 + fontSize + padding
                };
            }
          };
          // Create type-safe label accessor functions
          const labelAcc = d => typeof props.label === "function" ? props.label(d) : props.label || "";
          const labelXAcc = d => calculateLabelPosition(d, props.labelPosition || "top-left").x;
          const labelYAcc = d => calculateLabelPosition(d, props.labelPosition || "top-left").y;
          const labelFillAcc = d => {
            return getAccessibleTextColor(nodeColor(d, props.colorScale));
          };
          // Filter data for labels - only show labels on leaf nodes that are large enough
          const labelData = visibleData.filter(d => !d.children).filter(d => labelAcc(d).length < (d.x1 - d.x0) / 7); // Rough estimate of fitting text
          const labels = selection.selectAll(".sszvis-treemap-label").data(labelData).join("text").classed("sszvis-treemap-label", true).attr("x", labelXAcc).attr("y", labelYAcc).attr("fill", labelFillAcc).attr("font-size", fontSize).attr("font-family", '"Helvetica Neue", Helvetica, Arial, sans-serif').style("pointer-events", "none").attr("text-anchor", () => {
            const position = props.labelPosition || "top-left";
            switch (position) {
              case "top-right":
              case "bottom-right":
                return "end";
              case "center":
                return "middle";
              default:
                return "start";
            }
          }).attr("dominant-baseline", () => {
            const position = props.labelPosition || "top-left";
            switch (position) {
              case "center":
                return "middle";
              case "bottom-left":
              case "bottom-right":
                return "alphabetic";
              default:
                return "hanging";
            }
          }).text(labelAcc);
          // Apply transitions to labels if enabled
          if (props.transition) {
            labels.transition(defaultTransition()).attr("x", labelXAcc).attr("y", labelYAcc).attr("font-size", fontSize).text(labelAcc);
          }
        } else {
          // Remove labels if showLabels is false
          selection.selectAll(".sszvis-treemap-label").remove();
        }
        // Add tooltip anchors at the center of each rectangle
        const tooltipPosition = d => [(d.x0 + d.x1) / 2, (d.y0 + d.y1) / 2];
        const ta = tooltipAnchor().position(tooltipPosition);
        selection.call(ta);
      });
    }

    /**
     * Button Group control
     *
     * Control for switching top-level filter values. Use this control for changing between several
     * options which affect the state of the chart. This component should be rendered into an html layer.
     *
     * This control is part of the `optionSelectable` class of controls and can be used interchangeably
     * with other controls of this class (sszvis.control.select).
     *
     * @module sszvis/control/buttonGroup
     *
     * @property {array} values         an array of values which are the options available in the control.
     *                                  Each one will become a button. Required - there is no default.
     * @property {string|number} current the current value of the button group. Should be one of the
     *                                  options passed to .values(). Compared with ===.
     * @property {number} width         The total width of the button group, divided evenly between the
     *                                  options. (default: 300px)
     * @property {function} change      A callback/event handler function called as (event, value) when
     *                                  the user clicks on a value. Note that clicking on a value does not
     *                                  necessarily change any state unless this callback function does
     *                                  something. (default: fn.identity, which returns the event and
     *                                  silently discards the value)
     *
     * Note: both optionSelectable controls join their wrapper element on the
     * `.sszvis-control-optionSelectable` selector, keyed by the control's own name, so rendering one
     * into a container that already holds the other replaces the other's DOM. This is what makes them
     * interchangeable. They do not accept quite the same values, though: this control labels its buttons
     * through d3's text coercion and so takes numbers as well as strings, while the select control
     * trims its labels and therefore requires strings.
     *
     * Note: each button gets exactly `width / values.length` pixels, written out unrounded. Labels are
     * never measured or trimmed, so a label wider than its button simply overflows - keep labels short.
     *
     * Note: selectedness is computed per button with no notion of uniqueness, so a value repeated in
     * `values` renders twice and both copies are highlighted when they equal `current`.
     *
     * Note: the options are real `button` elements carrying `role="radio"` inside a `role="radiogroup"`
     * wrapper, and are operable from the keyboard. Enter and Space activate the focused option; Left/Up
     * and Right/Down move the selection and wrap at the ends. A roving `tabindex` keeps exactly one
     * option in the tab order - the current one, or the first option when `current` matches no value, so
     * the group stays reachable either way. Arrow keys call `change` immediately, the same as a click,
     * which is the standard radio-group behaviour; the component still holds no state of its own. The
     * `selected` class is kept as the visual hook alongside `aria-checked`.
     *
     * Note: `values` has no default, so rendering before the data is available throws while computing
     * the button width - before any DOM is created, so no partial control is left behind.
     *
     * See test/control/buttonGroup.test.ts.
     *
     * @return {sszvis.component}
     */
    function buttonGroup() {
      return component().prop("values").prop("current").prop("width").width(300).prop("change").change(identity).render(function () {
        const selection = d3.select(this);
        const props = selection.props();
        const buttonWidth = props.width / props.values.length;
        const container = selection.selectAll(".sszvis-control-optionSelectable").data(["sszvis-control-buttonGroup"], d => d).join("div").classed("sszvis-control-optionSelectable", true).classed("sszvis-control-buttonGroup", true).attr("role", "radiogroup");
        container.style("width", "".concat(props.width, "px"));
        const buttons = container.selectAll(".sszvis-control-buttonGroup__item").data(props.values).join("button").classed("sszvis-control-buttonGroup__item", true).attr("type", "button").attr("role", "radio");
        // Roving tabindex: exactly one option is in the tab order. That is the current one, or
        // the first option when `current` matches no value, so the group stays reachable.
        const currentIndex = props.values.indexOf(props.current);
        const rovingIndex = currentIndex === -1 ? 0 : currentIndex;
        const nodes = buttons.nodes();
        /** Moves the selection by `step` options, wrapping at both ends. */
        const move = (event, from, step) => {
          var _nodes$to;
          const to = (from + step + nodes.length) % nodes.length;
          event.preventDefault();
          (_nodes$to = nodes[to]) === null || _nodes$to === void 0 || _nodes$to.focus();
          props.change(event, props.values[to]);
        };
        buttons.style("width", "".concat(buttonWidth, "px")).classed("selected", d => d === props.current)
        // Keyed on the index, not on the value: duplicate values are supported, and a
        // radiogroup with two checked radios is contradictory state for assistive
        // technology. The legacy `selected` class still highlights every occurrence.
        .attr("aria-checked", (_d, i) => i === currentIndex ? "true" : "false").attr("tabindex", (_d, i) => i === rovingIndex ? 0 : -1).text(d => d).on("click", props.change).on("keydown", function (event, d) {
          const index = nodes.indexOf(this);
          switch (event.key) {
            case "Enter":
            case " ":
              // The native button would activate on its own, but calling `change` here and
              // suppressing that activation keeps a keypress and a click on one code path.
              event.preventDefault();
              props.change(event, d);
              break;
            case "ArrowRight":
            case "ArrowDown":
              move(event, index, 1);
              break;
            case "ArrowLeft":
            case "ArrowUp":
              move(event, index, -1);
              break;
          }
        });
      });
    }

    /**
     * Ruler with a handle control
     *
     * The handle ruler component is very similar to the ruler component, except that it is rendered
     * with a 24-pixel tall handle at the top. It is moved and repositioned in the same manner as a ruler,
     * so the actual interaction with the handle is up to the developer to specify. This component also
     * creates dots for each data point it finds bound to its layer.
     *
     * @module sszvis/control/handleRuler
     *
     * @property {function} x                   A function or number which determines the x-position of the ruler
     * @property {function} y                   A function which determines the y-position of the ruler dots. Passed data values.
     * @property {number} top                   A number for the y-position of the top of the ruler.
     * @property {number} bottom                A number for the y-position of the bottom of the ruler.
     * @property {string, function} label       A string or string function for the labels of the ruler dots.
     * @property {string, function} color       A string or color for the fill color of the ruler dots.
     * @property {boolean, function} flip       A boolean or boolean function which determines whether the ruler should be flipped (they default to the right side)
     *
     * Note: there is one rule, one handle and one grip mark however many data points are bound, so
     * they are positioned from a single datum - the first one. An `x` accessor is called with that
     * datum; for data whose `x` values differ, the ruler follows the first. With no data bound there is
     * no first datum, so an `x` accessor is called with `undefined` - pass a number in that case.
     *
     * Note: labels are written with `.html()`, as elsewhere in the library, because sszvis.modularText
     * produces markup. Escaping untrusted label data is the caller's responsibility. Unlike
     * sszvis.annotation.ruler, this control neither de-overlaps labels nor defaults `color`, and its
     * labels are joined on the component's own selection rather than on the ruler group - so hiding or
     * moving that group leaves the labels behind.
     *
     * Note: the rule stops 4px above `bottom`, but the label's vertical nudge is decided against the
     * unadjusted `bottom`. A label falling in that 4px band is offset as if it were still on the ruler.
     *
     * Note: `top` and `bottom` have no defaults; leaving them out writes NaN into the geometry and the
     * ruler silently disappears.
     *
     * See test/control/handleRuler.test.ts.
     *
     * @returns {sszvis.component}
     */
    /** The gap kept between the bottom of the rule and props.bottom. */
    const RULE_BOTTOM_INSET = 4;
    const HANDLE_WIDTH$1 = 10;
    const HANDLE_HEIGHT$1 = 24;
    /** Where the grip mark starts and ends within the handle, as a fraction of its height. */
    const HANDLE_MARK_TOP = 0.15;
    const HANDLE_MARK_BOTTOM = 0.85;
    const DOT_RADIUS = 3.5;
    /** Horizontal distance between a dot and its label. */
    const LABEL_OFFSET = 10;
    /** Vertical nudge that drops a label's baseline clear of its dot. */
    const LABEL_BASELINE_NUDGE = 5;
    function handleRuler() {
      return component().prop("x", functor).prop("y", functor).prop("top").prop("bottom").prop("label").label(functor("")).prop("color").prop("flip", functor).flip(false).render(function (data) {
        var _props$color;
        const selection = d3.select(this);
        const props = selection.props();
        // Elements need to be placed on half-pixels in order to be rendered
        // crisply across browsers. That's why we create this position accessor
        // here that takes a datum as input, reads out its value (props.x) and
        // then rounds this pixel value to half pixels (1px -> 1.5px, 1.2px -> 1.5px)
        // Composed with fn.compose rather than written as arrow functions so that d3's full
        // (d, i, nodes) argument list and its element-bound `this` still reach the accessor.
        const crispX = compose(halfPixel, props.x);
        const crispY = compose(halfPixel, props.y);
        const bottom = props.bottom - RULE_BOTTOM_INSET;
        const handleTop = props.top - HANDLE_HEIGHT$1;
        // There is a single rule, handle and grip mark whatever the data, so the group they
        // live in is bound to one datum - the first - and `props.x` is read from that. The
        // dots and labels below are joined on the whole data array as usual. The array holds
        // one slot even for empty data, so the ruler still renders (from a constant `x`).
        const rulerDatum = [data[0]];
        const group = selection.selectAll(".sszvis-handleRuler__group").data(rulerDatum).join("g").classed("sszvis-handleRuler__group", true);
        // The static parts are joined rather than appended so that a re-render - the normal
        // case for an interactive ruler - neither duplicates them nor moves them in front of
        // the dots, which are joined further down and must stay on top.
        group.selectAll(".sszvis-ruler__rule").data(d => [d]).join("line").classed("sszvis-ruler__rule", true).attr("x1", crispX).attr("y1", halfPixel(props.top)).attr("x2", crispX).attr("y2", halfPixel(bottom));
        group.selectAll(".sszvis-handleRuler__handle").data(d => [d]).join("rect").classed("sszvis-handleRuler__handle", true).attr("x", d => crispX(d) - HANDLE_WIDTH$1 / 2).attr("y", halfPixel(handleTop)).attr("width", HANDLE_WIDTH$1).attr("height", HANDLE_HEIGHT$1).attr("rx", 2).attr("ry", 2);
        group.selectAll(".sszvis-handleRuler__handle-mark").data(d => [d]).join("line").classed("sszvis-handleRuler__handle-mark", true).attr("x1", crispX).attr("y1", halfPixel(handleTop + HANDLE_HEIGHT$1 * HANDLE_MARK_TOP)).attr("x2", crispX).attr("y2", halfPixel(handleTop + HANDLE_HEIGHT$1 * HANDLE_MARK_BOTTOM));
        const dots = group.selectAll(".sszvis-ruler__dot").data(data).join("circle").classed("sszvis-ruler__dot", true);
        dots.attr("cx", crispX).attr("cy", crispY).attr("r", DOT_RADIUS)
        // `?? null` only to satisfy d3's attr signature: it treats null and undefined
        // alike (`value == null` removes the attribute), so this matches the original.
        .attr("fill", (_props$color = props.color) !== null && _props$color !== void 0 ? _props$color : null);
        selection.selectAll(".sszvis-ruler__label-outline").data(data).join("text").classed("sszvis-ruler__label-outline", true);
        selection.selectAll(".sszvis-ruler__label").data(data).join("text").classed("sszvis-ruler__label", true);
        // Update both labelOutline and labelOutline selections
        selection.selectAll(".sszvis-ruler__label, .sszvis-ruler__label-outline").attr("transform", d => {
          const x = crispX(d);
          const y = crispY(d);
          const dx = props.flip(d) ? -LABEL_OFFSET : LABEL_OFFSET;
          // A constant nudge, whether the dot sits on the ruler or above its top; only a
          // dot below `bottom` needs none. The same expression lives in
          // src/annotation/ruler.ts and the two must not drift.
          const dy = y > props.bottom ? 0 : LABEL_BASELINE_NUDGE;
          return translateString(x + dx, y + dy);
        }).style("text-anchor", d => props.flip(d) ? "end" : "start").html(props.label);
      });
    }

    /**
     * Select control
     *
     * Control for switching top-level filter values. Use this control for changing between several
     * options which affect the state of the chart. This component should be rendered into an html layer.
     *
     * This control is part of the `optionSelectable` class of controls and can be used interchangeably
     * with other controls of this class (sszvis.control.buttonGroup).
     *
     * @module sszvis/control/select
     *
     * @property {array} values         an array of string values which are the options available in
     *                                  the control. Required - there is no default.
     * @property {string} current       the currently selected value of the select control. Should be one
     *                                  of the options passed to .values(). Compared with ===.
     * @property {number} width         The total width of the select control. If text labels exceed this
     *                                  width they will be trimmed to fit using an ellipsis mark.
     *                                  (default: 300px)
     * @property {function} change      A callback/event handler function called as (event, value) when
     *                                  the user selects an option. Selecting a value does not change any
     *                                  state unless this callback does something. (default: fn.identity,
     *                                  which returns the event and silently discards the value)
     *
     * Note: both optionSelectable controls join their wrapper element on the
     * `.sszvis-control-optionSelectable` selector, keyed by the control's own name, so rendering one
     * into a container that already holds the other replaces the other's DOM. This is what makes them
     * interchangeable.
     *
     * Note: `current` is written as each option's `selected` DOM property, so it stays authoritative
     * across re-renders even after the user has picked an option themselves. A value duplicated in
     * `values` selects the last matching option, because a single-select element holds one selection.
     *
     * Note: the wrapper is styled to `width`, but the select element itself is rendered 30px wider,
     * while labels are measured and trimmed against `width - 40`.
     *
     * Note: label truncation removes one character more than strictly necessary (the ellipsis replaces
     * the second-to-last character as well). Values are coerced with `String()` before measuring, so
     * non-string values are trimmed rather than throwing.
     *
     * Note: a selection whose stored index no longer resolves to a value - an empty select value, or an
     * index left behind by a shorter `values` array - is ignored with a warning instead of invoking
     * `change` with `undefined`.
     *
     * Note: `values` has no default, so rendering before the data is available throws mid-render from
     * d3's data join - after the wrapper and select have been created and styled, leaving an empty,
     * width-styled control behind rather than nothing at all.
     *
     * See test/control/select.test.ts.
     *
     * @return {sszvis.component}
     */
    /** Extra width given to the select element on top of the configured control width. */
    const SELECT_WIDTH_PADDING = 30;
    /** Width reserved for the select's own chrome when measuring whether a label fits. */
    const LABEL_WIDTH_ALLOWANCE = 40;
    function selectMenu() {
      return component().prop("values").prop("current").prop("width").width(300).prop("change").change(identity).render(function () {
        const selection = d3.select(this);
        const props = selection.props();
        const wrapperEl = selection.selectAll(".sszvis-control-optionSelectable").data(["sszvis-control-select"], d => d).join("div").classed("sszvis-control-optionSelectable", true).classed("sszvis-control-select", true);
        wrapperEl.style("width", "".concat(props.width, "px"));
        const metricsEl = wrapperEl.selectDiv("selectMetrics").classed("sszvis-control-select__metrics", true);
        const selectEl = wrapperEl.selectAll(".sszvis-control-select__element").data([1]).join("select").classed("sszvis-control-select__element", true).on("change", function (e) {
          // We store the index in the select's value instead of the datum
          // because an option's value can only hold strings. An empty value means
          // nothing is selected, which must not be read as index 0.
          const value = this.value;
          const i = value === "" ? -1 : Number(value);
          const selected = props.values[i];
          if (selected === undefined) {
            // The recorded index can go stale between renders - a shorter `values` array
            // removes options but leaves the browser's selection pointing at an index
            // that is gone. A selection that maps to no value is not a selection.
            warn("[selectMenu] ignoring a selection whose option value \"".concat(value, "\" does not resolve to one of the ").concat(props.values.length, " configured values."));
            return;
          }
          props.change(e, selected);
          // Prevent highlights on the select element after users have selected
          // an option by moving away from it.
          setTimeout(() => {
            window.focus();
          }, 0);
        });
        selectEl.style("width", "".concat(props.width + SELECT_WIDTH_PADDING, "px"));
        selectEl.selectAll("option").data(props.values).join("option").property("selected", d => d === props.current).attr("value", (_d, i) => i).text(d => truncateToWidth(metricsEl, props.width - LABEL_WIDTH_ALLOWANCE, d));
      });
    }
    /**
     * Shortens a label until it fits within maxWidth, measured by writing it into the
     * (invisible) metrics element and reading back its rendered width.
     *
     * The value is coerced with `String()` first, matching the coercion `.text()` would apply
     * anyway. Shortening stops as soon as the candidate no longer gets shorter, so a maxWidth
     * that not even "…" fits into costs a handful of measurements rather than MAX_RECURSION.
     *
     * Note: each step replaces the last two characters with a single ellipsis, so the first
     * step removes one character more than strictly necessary.
     * See test/control/select.test.ts.
     */
    function truncateToWidth(metricsEl, maxWidth, originalString) {
      const MAX_RECURSION = 1000;
      const fitText = (str, i) => {
        metricsEl.text(str);
        const textWidth = Math.ceil(metricsEl.node().clientWidth);
        if (i >= MAX_RECURSION || textWidth <= maxWidth) return str;
        const shorter = "".concat(str.slice(0, -2), "\u2026");
        // "…" is a fixed point of the shortening step; without this guard a negative
        // measuring budget burns the full MAX_RECURSION in forced synchronous layouts.
        // Compared by text rather than by length: a one-character label such as "A" is the
        // same length as the "…" it shortens to, and a length test returned the overflowing
        // original instead of taking the first step.
        return shorter === str ? str : fitText(shorter, i + 1);
      };
      return fitText(String(originalString), 0);
    }

    /**
     * Slider control
     *
     * Control for use in filtering. Works very much like an interactive axis.
     * A d3 scale is its primary configuration, and it has a labeled handle which can be used to
     * select values on that scale. Ticks created using an sszvis.axis show the user where
     * data values lie.
     *
     * @module  sszvis/control/slider
     *
     * @property {function} scale                 A scale function which this slider represents. The values in the scale's domain
     *                                            are used as the possible values of the slider.
     * @property {array} minorTicks               An array of ticks which become minor (smaller and unlabeled) ticks on the slider's axis
     * @property {array} majorTicks               An array of ticks which become major (larger and labeled) ticks on the slider's axis
     * @property {function} tickLabels            A function to use to format the major tick labels.
     * @property {string} slant                             Specify a label slant for the tick labels. Can be "vertical" - labels are displayed vertically - or
     *                                                      "diagonal" - labels are displayed at a 45 degree angle to the axis.
     *                                                      Use "horizontal" to reset to a horizontal slant.
     * @property {number|Date} value             The current value of the slider. Should be set whenever slider interaction causes the state to change.
     *                                            Required: rendering without it throws before any element is created. Values outside the
     *                                            scale's domain are clamped to it.
     * @property {string, function} label         A string or function for the handle label. The datum associated with it is the current slider value.
     * @property {function} onchange              A callback function called whenever user interaction attempts to change the slider value.
     *                                            Note that this component will not change its own state. The callback function must affect some state change
     *                                            in order for this component's display to be updated.
     *
     * Note: the handle, the track fill, the axis and the interaction layer all work through one copy
     * of the scale whose range is inset by half the handle width at each end, so that the handle stays
     * inside the track and pointing at the pixel where a value's handle is drawn reports that value.
     * That copy is clamped, so a `value` outside the domain pins the handle to the end of the track
     * rather than drawing it past the end. The inset is applied to each end of the configured range in
     * turn, so a descending range keeps its direction.
     *
     * Note: ticks are drawn in track order, not in the order they were configured, so the outermost
     * major labels are anchored inwards whatever order `majorTicks` is given in.
     *
     * Note: the move behaviour's y-scale is given a range but no domain, so the second argument passed
     * to `onchange` is a meaningless fraction and should be ignored.
     *
     * See test/control/slider.test.ts.
     *
     * @returns {sszvis.component}
     */
    const AXIS_OFFSET = 28; // vertical offset for the axis
    const MAJOR_TICK_SIZE = 12;
    const MINOR_TICK_SIZE = 4;
    const BACKGROUND_OFFSET = halfPixel(18); // vertical offset for the middle of the background
    const HANDLE_WIDTH = 10; // the width of the handle
    const HANDLE_HEIGHT = 23; // the height of the handle
    const BG_WIDTH = 6; // the width of the background
    const LINE_END_OFFSET = BG_WIDTH / 2; // the amount by which to offset the ends of the background line
    const HANDLE_SIDE_OFFSET = HANDLE_WIDTH / 2 + 0.5; // the amount by which to offset the position of the handle
    /** The amount by which to offset the small handle line within the handle. */
    const HANDLE_LINE_DIMENSION = HANDLE_HEIGHT / 2 - 4;
    /** Vertical extent of the interaction layer: from the label top (text is 11px tall) to the axis. */
    const INTERACTION_TOP = -11;
    function contains(x, a) {
      return a.includes(x);
    }
    function slider() {
      return component().prop("scale").prop("value").prop("onchange").prop("minorTicks").minorTicks([]).prop("majorTicks").majorTicks([]).prop("tickLabels", functor).prop("slant")
      // fn.identity is the documented "no formatting" default. It returns its argument, so it
      // cannot satisfy a formatter type that promises a string - d3 stringifies the value at
      // render time, which its own types do not model.
      .tickLabels(identity).prop("label", functor).label(identity).render(function () {
        const selection = d3.select(this);
        const props = selection.props();
        // `value` is only dereferenced further down, once the handle is being labelled, so
        // without this guard a slider rendered before its state exists would leave a
        // half-built control on screen. Thrown before anything is appended, and named, so
        // the caller is not left reading a TypeError out of fn.stringEqual.
        if (props.value == null) {
          throw new Error("[sszvis.control.slider] the `value` property is required");
        }
        const scaleRange = range(props.scale);
        // Inset each end of the configured range towards the middle rather than rebuilding
        // it from the sorted extent, so that a descending range keeps its direction.
        const [rangeStart, rangeEnd] = props.scale.range();
        const rangeSign = rangeStart <= rangeEnd ? 1 : -1;
        // Clamped so that a value outside the domain pins the handle to the end of the
        // track, and so that a drag past either end reports that end of the domain.
        const alteredScale = props.scale.copy().range([rangeStart + rangeSign * HANDLE_SIDE_OFFSET, rangeEnd - rangeSign * HANDLE_SIDE_OFFSET]).clamp(true);
        // the mostly unchanging bits
        const bg = selection.selectAll("g.sszvis-control-slider__backgroundgroup").data([1]).join("g").classed("sszvis-control-slider__backgroundgroup", true);
        // Sorted by position along the track, so that the outer-label anchoring below can
        // read the leftmost and rightmost labels off the ends of the selection.
        const tickValues = set$1([...props.majorTicks, ...props.minorTicks]);
        tickValues.sort((a, b) => d3.ascending(alteredScale(a), alteredScale(b)));
        // create the axis
        const axis = axisX().scale(alteredScale).orient("bottom").slant(props.slant).hideBorderTickThreshold(0).tickSize(MAJOR_TICK_SIZE).tickPadding(6).tickValues(tickValues).tickFormat(d => contains(d, props.majorTicks) ? props.tickLabels(d) : "");
        const axisSelection = bg.selectAll("g.sszvis-axisGroup").data([1]).join("g").classed("sszvis-axisGroup sszvis-axis sszvis-axis--bottom sszvis-axis--slider", true);
        axisSelection.attr("transform", translateString(0, AXIS_OFFSET)).call(axis);
        // adjust visual aspects of the axis to fit the design
        axisSelection.selectAll(".tick line").filter(d => !contains(d, props.majorTicks)).attr("y2", MINOR_TICK_SIZE);
        const majorAxisText = axisSelection.selectAll(".tick text").filter(d => contains(d, props.majorTicks));
        if (!props.slant || props.slant === "horizontal") {
          // The selection is in track order, so the first and last entries are the labels
          // at the ends of the track. A lone label needs no inward nudge.
          const numTicks = majorAxisText.size();
          majorAxisText.style("text-anchor", (_d, i) => {
            if (numTicks === 1) return "middle";
            return i === 0 ? "start" : i === numTicks - 1 ? "end" : "middle";
          });
        }
        if (props.slant === "vertical") {
          majorAxisText.attr("dx", "-1.8em");
          majorAxisText.attr("dy", "-1.5em");
        }
        if (props.slant === "diagonal") {
          majorAxisText.attr("dx", "-1.6em");
          majorAxisText.attr("dy", "0.2em");
        }
        // create the slider background
        const backgroundSelection = bg.selectAll("g.sszvis-slider__background").data([1]).join("g").classed("sszvis-slider__background", true).attr("transform", translateString(0, BACKGROUND_OFFSET));
        backgroundSelection.selectAll(".sszvis-slider__background__bg1").data([1]).join("line").classed("sszvis-slider__background__bg1", true).style("stroke-width", BG_WIDTH).style("stroke", "#888").style("stroke-linecap", "round").attr("x1", Math.ceil(scaleRange[0] + LINE_END_OFFSET)).attr("x2", Math.floor(scaleRange[1] - LINE_END_OFFSET));
        backgroundSelection.selectAll(".sszvis-slider__background__bg2").data([1]).join("line").classed("sszvis-slider__background__bg2", true).style("stroke-width", BG_WIDTH - 1).style("stroke", "#fff").style("stroke-linecap", "round").attr("x1", Math.ceil(scaleRange[0] + LINE_END_OFFSET)).attr("x2", Math.floor(scaleRange[1] - LINE_END_OFFSET));
        backgroundSelection.selectAll(".sszvis-slider__backgroundshadow").data([props.value]).join("line").attr("class", "sszvis-slider__backgroundshadow").attr("stroke-width", BG_WIDTH - 1).style("stroke", "#E0E0E0").style("stroke-linecap", "round")
        // The fill runs from the end of the track the domain minimum sits at, which is
        // the right-hand end for a descending range.
        .attr("x1", rangeSign === 1 ? Math.ceil(rangeStart + LINE_END_OFFSET) : Math.floor(rangeStart - LINE_END_OFFSET)).attr("x2", d => rangeSign === 1 ? Math.floor(alteredScale(d)) : Math.ceil(alteredScale(d)));
        // draw the handle and the label
        /**
         * Which end of the track the handle sits at: -1 at the low-pixel end, 1 at the
         * high-pixel end, 0 anywhere in between. Compared with a sub-pixel tolerance,
         * since the drawn position is a rounded copy of the inset range.
         */
        const handleSide = d => {
          const x = alteredScale(d);
          const [insetStart, insetEnd] = alteredScale.range();
          const low = Math.min(insetStart, insetEnd);
          const high = Math.max(insetStart, insetEnd);
          if (x <= low + 1) return -1;
          if (x >= high - 1) return 1;
          return 0;
        };
        const handle = selection.selectAll("g.sszvis-control-slider__handle").data([props.value]).join("g").classed("sszvis-control-slider__handle", true).attr("transform", d => translateString(halfPixel(alteredScale(d)), 0.5));
        handle.selectAll(".sszvis-control-slider--label").data(d => [d]).join("text").classed("sszvis-control-slider--label", true).text(props.label)
        // Anchored from the pixel the handle is drawn at, not from the value's position
        // in the domain. A descending range draws the domain's first value at the right-hand end,
        // where a domain-keyed "start" anchor sends a long label - a date, typically -
        // off the track instead of tucking it inside; and a value outside the domain is
        // clamped to an end without equalling either bound, so it would be centred over
        // an edge. Both fall out of asking which end of the track the handle is at.
        .style("text-anchor", d => {
          const side = handleSide(d);
          return side === 0 ? "middle" : side < 0 ? "start" : "end";
        }).attr("dx", d => handleSide(d) * (HANDLE_WIDTH / 2));
        handle.selectAll(".sszvis-control-slider__handlebox").data([1]).join("rect").classed("sszvis-control-slider__handlebox", true).attr("x", -5).attr("y", BACKGROUND_OFFSET - HANDLE_HEIGHT / 2).attr("width", HANDLE_WIDTH).attr("height", HANDLE_HEIGHT).attr("rx", 2).attr("ry", 2);
        handle.selectAll(".sszvis-control-slider__handleline").data([1]).join("line").classed("sszvis-control-slider__handleline", true).attr("y1", BACKGROUND_OFFSET - HANDLE_LINE_DIMENSION).attr("y2", BACKGROUND_OFFSET + HANDLE_LINE_DIMENSION);
        // The original always called .on("drag", props.onchange), including with undefined,
        // which d3-dispatch treats as removing the listener. The guard is equivalent.
        const sliderInteraction = move()
        // The same inset scale the handle is drawn with, so that pointing at a handle's
        // pixel reports that handle's value. Padded back out by the inset so the
        // interaction layer still spans the whole configured range.
        .xScale(alteredScale).padding({
          left: HANDLE_SIDE_OFFSET,
          right: HANDLE_SIDE_OFFSET
        })
        // range goes from the text top (text is 11px tall) to the bottom of the axis
        .yScale(d3.scaleLinear().range([INTERACTION_TOP, AXIS_OFFSET + MAJOR_TICK_SIZE])).draggable(true);
        if (props.onchange) {
          sliderInteraction.on("drag", props.onchange);
        }
        selection.selectGroup("sliderInteraction").classed("sszvis-control-slider--interactionLayer", true).attr("transform", translateString(0, 4)).call(sliderInteraction);
      });
    }

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
    function createHtmlLayer(selector, bounds$1) {
      let metadata = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      const {
        padding
      } = bounds$1 || bounds();
      const key = metadata.key || "default";
      const elementDataKey = "data-sszvis-html-".concat(key);
      const render = root => {
        root.classed("sszvis-outer-container", true);
        return root.selectAll("[data-sszvis-html-layer][".concat(elementDataKey, "]")).data([0]).join("div").classed("sszvis-html-layer", true).attr("data-sszvis-html-layer", "").attr(elementDataKey, "").style("position", "absolute").style("left", "".concat(padding.left, "px")).style("top", "".concat(padding.top, "px"));
      };
      return withRootSelection(selector, render);
    }

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
    function createSvgLayer(selector, bounds$1) {
      let metadata = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      const {
        padding,
        height,
        width
      } = bounds$1 || bounds();
      const key = metadata.key || "default";
      const elementDataKey = "data-sszvis-svg-".concat(key);
      const title = metadata.title || "";
      const description = metadata.description || "";
      const render = root => {
        const svg = root.selectAll("svg[".concat(elementDataKey, "]")).data([0]).join("svg").classed("sszvis-svg-layer", true).attr(elementDataKey, "").attr("role", "img").attr("aria-label", "".concat(title, " \u2013 ").concat(description)).attr("height", height).attr("width", width);
        svg.selectAll("title").data([0]).join("title").text(title);
        svg.selectAll("desc").data([0]).join("desc").text(description).classed("sszvis-svg-layer", true).attr(elementDataKey, "").attr("role", "img");
        return svg.selectAll("[data-sszvis-svg-layer]").data(() => [0]).join("g").attr("data-sszvis-svg-layer", "").attr("transform", "translate(".concat(padding.left, ",").concat(padding.top, ")"));
      };
      return withRootSelection(selector, render);
    }

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
     * @property {String} orientation               The orientation (layout order) of the legend. Must be either "horizontal" or "vertical".
     *                                              Required unless horizontalFloat is true, which uses its own layout; a missing or
     *                                              unrecognised value throws, because no layout can be computed without it.
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
    const DEFAULT_LEGEND_COLOR_ORDINAL_ROW_HEIGHT = 21;
    function legendColorOrdinal() {
      return component().prop("scale").prop("rowHeight").rowHeight(DEFAULT_LEGEND_COLOR_ORDINAL_ROW_HEIGHT).prop("columnWidth").columnWidth(200).prop("rows").rows(3).prop("columns").columns(3).prop("verticallyCentered").verticallyCentered(false).prop("orientation").prop("reverse").reverse(false).prop("rightAlign").rightAlign(false).prop("horizontalFloat").horizontalFloat(false).prop("floatPadding").floatPadding(20).prop("floatWidth").floatWidth(600).render(function () {
        const selection = d3.select(this);
        const props = selection.props();
        // Thrown before anything is rendered: without an orientation the row/column layout
        // cannot be computed at all, and the entries would silently stack at the origin.
        // horizontalFloat brings its own layout and needs no orientation.
        if (!props.horizontalFloat && props.orientation !== "horizontal" && props.orientation !== "vertical") {
          throw new Error('[legendColorOrdinal] orientation must be "horizontal" or "vertical" unless horizontalFloat is true');
        }
        let domain = props.scale.domain();
        if (props.reverse) {
          domain = [...domain].reverse();
        }
        // Zero under horizontalFloat, which does not read them.
        let rows = 0;
        let cols = 0;
        if (props.orientation === "horizontal") {
          cols = Math.ceil(props.columns);
          rows = Math.ceil(domain.length / cols);
        } else if (props.orientation === "vertical") {
          rows = Math.ceil(props.rows);
          cols = Math.ceil(domain.length / rows);
        }
        const groups = selection.selectAll(".sszvis-legend--entry").data(domain).join("g").classed("sszvis-legend--entry", true);
        groups.selectAll(".sszvis-legend__mark").data(d => [d]).join("circle").classed("sszvis-legend__mark", true).attr("cx", props.rightAlign ? -6 : 6).attr("cy", halfPixel(props.rowHeight / 2)).attr("r", 5).attr("fill", d => String(props.scale(d))).attr("stroke", d => String(props.scale(d))).attr("stroke-width", 1);
        groups.selectAll(".sszvis-legend__label").data(d => [d]).join("text").classed("sszvis-legend__label", true).text(d => String(d)).attr("dy", "0.35em") // vertically-center
        .style("text-anchor", () => props.rightAlign ? "end" : "start").attr("transform", () => {
          const x = props.rightAlign ? -18 : 18;
          const y = halfPixel(props.rowHeight / 2);
          return translateString(x, y);
        });
        let verticalOffset = "";
        if (props.verticallyCentered) {
          verticalOffset = "translate(0,".concat(String(-(domain.length * props.rowHeight / 2)), ") ");
        }
        if (props.horizontalFloat) {
          let rowPosition = 0;
          let horizontalPosition = 0;
          groups.attr("transform", function () {
            // not affected by scroll position
            const width = this.getBoundingClientRect().width;
            if (horizontalPosition + width > props.floatWidth) {
              rowPosition += props.rowHeight;
              horizontalPosition = 0;
            }
            const translate = translateString(horizontalPosition, rowPosition);
            horizontalPosition += width + props.floatPadding;
            return verticalOffset + translate;
          });
        } else {
          groups.attr("transform", (_d, i) => {
            var _props$columnWidth2;
            if (props.orientation === "horizontal") {
              var _props$columnWidth;
              return "".concat(verticalOffset, "translate(").concat(i % cols * ((_props$columnWidth = props.columnWidth) !== null && _props$columnWidth !== void 0 ? _props$columnWidth : 0), ",").concat(Math.floor(i / cols) * props.rowHeight, ")");
            }
            // Only "vertical" remains - any other value was rejected above.
            return "".concat(verticalOffset, "translate(").concat(Math.floor(i / rows) * ((_props$columnWidth2 = props.columnWidth) !== null && _props$columnWidth2 !== void 0 ? _props$columnWidth2 : 0), ",").concat(i % rows * props.rowHeight, ")");
          });
        }
      });
    }

    const SLANTS = ["horizontal", "vertical", "diagonal"];
    const DEFAULT_COLUMN_COUNT = 2;
    const LABEL_PADDING = 40;
    /**
     * colorLegendLayout
     *
     * Generate a color scale and a legend for the given labels. Compute how much
     * padding labels plus legend needs for use with `sszvis.bounds()`
     *
     * Behaviour notes:
     * - scaleQual6 is used up to six labels, scaleQual12 above six; colours repeat
     *   silently beyond twelve labels.
     * - axisLabelPadding is 60 for slant "horizontal", 40 + widest axis label for "vertical",
     *   and 40 + widest axis label / sqrt(2) for "diagonal". An omitted or null slant is
     *   horizontal; any other value throws.
     * - More labels than the chosen colour scale has colours is warned about, because a d3
     *   ordinal scale recycles its range rather than running out.
     * - A "vertical" or "diagonal" slant with no axisLabels reserves the 40px base padding
     *   and nothing for the labels themselves.
     * - A container that cannot be measured is warned about and treated as having no width.
     * - legendPadding is rows * DEFAULT_LEGEND_COLOR_ORDINAL_ROW_HEIGHT.
     */
    function colorLegendLayout(_ref, container) {
      let {
        legendLabels,
        axisLabels = [],
        slant
      } = _ref;
      // an omitted slant - null included, as the docs examples pass it - is horizontal
      const resolvedSlant = slant !== null && slant !== void 0 ? slant : "horizontal";
      if (!SLANTS.includes(resolvedSlant)) {
        throw new RangeError("colorLegendLayout: slant must be one of ".concat(SLANTS.join(", "), ", got ").concat(slant));
      }
      const measuredWidth = measureDimensions(container).width;
      if (!measuredWidth) {
        warn("colorLegendLayout could not measure its container, and is laying the legend out as if it had no width:", container);
      }
      const containerWidth = measuredWidth !== null && measuredWidth !== void 0 ? measuredWidth : 0;
      const layout = colorLegendDimensions(legendLabels, containerWidth);
      const scale = legendLabels.length > 6 ? scaleQual12().domain(legendLabels) : scaleQual6().domain(legendLabels);
      if (legendLabels.length > scale.range().length) {
        warn("colorLegendLayout: ".concat(legendLabels.length, " labels share the ").concat(scale.range().length, " colours of this scale, so some categories are drawn in the same colour"));
      }
      const legend = legendColorOrdinal().scale(scale).horizontalFloat(layout.horizontalFloat).rows(layout.rows).columnWidth(layout.columnWidth).orientation(layout.orientation);
      const axisLabelPadding = axisLabelHeight(resolvedSlant, axisLabels);
      const legendPadding = layout.rows * DEFAULT_LEGEND_COLOR_ORDINAL_ROW_HEIGHT;
      return {
        axisLabelPadding,
        legendPadding,
        bottomPadding: axisLabelPadding + legendPadding,
        legendWidth: layout.legendWidth,
        legend,
        scale
      };
    }
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
     * - legendWidth is columns * widest label, or the width of the whole line for a floated
     *   legend, which is laid out on one line rather than in columns.
     * - An empty label list gives a zero legendWidth.
     * - A container of no width degrades to one column, one row per label.
     */
    function colorLegendDimensions(labels, containerWidth) {
      var _max;
      const labelCount = labels.length;
      // an empty legend has no labels to be as wide as
      const maxLabelWidth = (_max = d3.max(labels, labelWidth)) !== null && _max !== void 0 ? _max : 0;
      const totalLabelsWidth = d3.sum(labels, labelWidth);
      // Use a single column for four or fewer items
      const columns = labelCount <= 4 ? 1 : numCols(containerWidth, maxLabelWidth, DEFAULT_COLUMN_COUNT);
      // Use a horizontal layout if all labels fit on one line
      const isHorizontal = columns === 1 && totalLabelsWidth <= containerWidth;
      return {
        columns,
        rows: isHorizontal ? 1 : Math.ceil(labelCount / columns),
        columnWidth: columns === 1 ? null : maxLabelWidth,
        // a floated legend is one line of labels, not a column of the widest one
        legendWidth: isHorizontal ? totalLabelsWidth : columns * maxLabelWidth,
        horizontalFloat: isHorizontal,
        orientation: isHorizontal ? null : "vertical"
      };
    }
    // -----------------------------------------------------------------------------
    // Helpers
    function axisLabelHeight(slant, labels) {
      switch (slant) {
        case "vertical":
          {
            var _max2;
            return 40 + ((_max2 = d3.max(labels, measureAxisLabel)) !== null && _max2 !== void 0 ? _max2 : 0);
          }
        case "diagonal":
          {
            var _max3;
            return 40 + Math.sqrt(2 * (((_max3 = d3.max(labels, measureAxisLabel)) !== null && _max3 !== void 0 ? _max3 : 0) / 2) ** 2);
          }
        default:
          {
            return 60;
          }
      }
    }
    function labelWidth(label) {
      return measureLegendLabel(label) + LABEL_PADDING;
    }
    function numCols(totalWidth, columnWidth, num) {
      if (num <= 1) return 1;
      return columnWidth <= totalWidth / num ? num : numCols(totalWidth, columnWidth, num - 1);
    }

    function _defineProperty(e, r, t) {
      return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
        value: t,
        enumerable: true,
        configurable: true,
        writable: true
      }) : e[r] = t, e;
    }
    function ownKeys(e, r) {
      var t = Object.keys(e);
      if (Object.getOwnPropertySymbols) {
        var o = Object.getOwnPropertySymbols(e);
        r && (o = o.filter(function (r) {
          return Object.getOwnPropertyDescriptor(e, r).enumerable;
        })), t.push.apply(t, o);
      }
      return t;
    }
    function _objectSpread2(e) {
      for (var r = 1; r < arguments.length; r++) {
        var t = null != arguments[r] ? arguments[r] : {};
        r % 2 ? ownKeys(Object(t), true).forEach(function (r) {
          _defineProperty(e, r, t[r]);
        }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {
          Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
        });
      }
      return e;
    }
    function _toPrimitive(t, r) {
      if ("object" != typeof t || !t) return t;
      var e = t[Symbol.toPrimitive];
      if (void 0 !== e) {
        var i = e.call(t, r);
        if ("object" != typeof i) return i;
        throw new TypeError("@@toPrimitive must return a primitive value.");
      }
      return ("string" === r ? String : Number)(t);
    }
    function _toPropertyKey(t) {
      var i = _toPrimitive(t, "string");
      return "symbol" == typeof i ? i : i + "";
    }

    /**
     * Argument checks shared by the layout functions.
     *
     * @module sszvis/layout/validate
     *
     * Every layout in this directory turns measurements and counts into geometry, and the two
     * degenerate cases they meet are distinguished here:
     *
     * - A size or a count that cannot describe any chart - negative, fractional where only whole
     *   items exist, or not a number at all - is a misconfiguration. It throws, naming the layout
     *   and the argument, before any dimension is computed.
     * - A zero size or a zero count is an ordinary runtime state: a container measured before its
     *   first paint, or a series filtered down to nothing. Each layout returns a zeroed layout for
     *   those rather than throwing, so a chart can render itself as empty.
     */
    /** Throws unless `value` is a finite number of zero or more pixels. */
    function requireSize(layoutName, propName, value) {
      if (!Number.isFinite(value) || value < 0) {
        throw new RangeError("".concat(layoutName, ": ").concat(propName, " must be a finite number of pixels of zero or more, got ").concat(value));
      }
    }
    /** Throws unless `value` is a finite ratio within `[0, 1]`. */
    function requireRatio(layoutName, propName, value) {
      if (!Number.isFinite(value) || value < 0 || value > 1) {
        throw new RangeError("".concat(layoutName, ": ").concat(propName, " must be a ratio within [0, 1], got ").concat(value));
      }
    }
    /** Throws unless `value` is a whole number of zero or more items. */
    function requireCount(layoutName, propName, value) {
      if (!Number.isInteger(value) || value < 0) {
        throw new RangeError("".concat(layoutName, ": ").concat(propName, " must be a whole number of zero or more, got ").concat(value));
      }
    }

    /** A table with no columns, no rows or no room: nothing to draw and nothing to report. */
    const EMPTY_DIMENSIONS = {
      side: 0,
      paddedSide: 0,
      padRatio: 0,
      width: 0,
      height: 0,
      centeredOffset: 0
    };
    function dimensionsHeatTable(spaceWidth, squarePadding, numX, numY, chartPadding) {
      var _padding$left, _padding$right;
      requireSize("dimensionsHeatTable", "spaceWidth", spaceWidth);
      requireSize("dimensionsHeatTable", "squarePadding", squarePadding);
      requireCount("dimensionsHeatTable", "numX", numX);
      requireCount("dimensionsHeatTable", "numY", numY);
      if (spaceWidth === 0 || numX === 0 || numY === 0) return _objectSpread2({}, EMPTY_DIMENSIONS);
      // a copy: a dimension calculator has no business writing to its arguments
      const padding = _objectSpread2({}, chartPadding);
      padding.top || (padding.top = 0);
      padding.right || (padding.right = 0);
      padding.bottom || (padding.bottom = 0);
      padding.left || (padding.left = 0);
      // this includes the default side length for the heat table
      const DEFAULT_SIDE = 30,
        availableChartWidth = spaceWidth - ((_padding$left = padding.left) !== null && _padding$left !== void 0 ? _padding$left : 0) - ((_padding$right = padding.right) !== null && _padding$right !== void 0 ? _padding$right : 0),
        // the side is capped from above and floored at 0: a box cannot have a negative side,
        // and a padRatio derived from one lands outside the [0, 1) a band scale accepts
        side = Math.max(0, Math.min((availableChartWidth - squarePadding * (numX - 1)) / numX, DEFAULT_SIDE)),
        paddedSide = side + squarePadding,
        padRatio = 1 - side / paddedSide,
        tableWidth = numX * paddedSide - squarePadding,
        // subtract the squarePadding at the end
        tableHeight = numY * paddedSide - squarePadding; // subtract the squarePadding at the end
      // no room for a box means no table to lay out
      if (side === 0) return _objectSpread2({}, EMPTY_DIMENSIONS);
      return {
        side,
        paddedSide,
        padRatio,
        width: tableWidth,
        height: tableHeight,
        centeredOffset: Math.max((availableChartWidth - tableWidth) / 2, 0)
      };
    }

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
     *                                  totalHeight: barGroupHeight plus the height of the outer padding. Since this layout
     *                                               has no outer padding, it always equals barGroupHeight; the two are kept
     *                                               distinct to match the shape of the vertical bar chart layout.
     *                                 }
     *
     * Behaviour notes:
     * - The layout is fixed: 24px bars separated by 20px of padding. Nothing scales with the
     *   available space - the caller sizes the container from barGroupHeight, not the reverse.
     * - outerRatio is always 0, so totalHeight always equals barGroupHeight. The two properties
     *   are kept distinct only to match the shape of the vertical bar chart layout.
     * - axisOffset is derived from the constant bar height and is therefore always -22.
     * - Zero bars give a zero group height; a negative or fractional bar count throws.
     */
    function dimensionsHorizontalBarChart(numBars) {
      requireCount("dimensionsHorizontalBarChart", "numBars", numBars);
      const DEFAULT_HEIGHT = 24,
        // the default bar height
        MIN_PADDING = 20,
        // the minimum padding size
        barHeight = DEFAULT_HEIGHT,
        // the bar height
        // an empty chart draws no bars, so it draws no gaps between them either
        numPads = Math.max(numBars - 1, 0),
        padding = MIN_PADDING,
        // compute other information
        padRatio = 1 - barHeight / (barHeight + padding),
        computedBarSpace = barHeight * numBars + padding * numPads,
        outerRatio = 0; // no outer padding
      return {
        barHeight,
        padHeight: padding,
        padRatio,
        outerRatio,
        axisOffset: -12 - 10,
        barGroupHeight: computedBarSpace,
        totalHeight: computedBarSpace + outerRatio * (barHeight + padding) * 2
      };
    }

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
     *                                      the value is 0 and no further padding is needed.
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
     * - maxBarLength is capped at half this module's own MAX_HEIGHT, so a very wide screen keeps
     *   the whole pyramid to a reasonable size.
     * - chartPadding is 0 once the pyramid fills the width.
     * - A zero spaceWidth or a pyramid with no bars is a chart with nothing to draw, and every
     *   dimension comes back 0.
     * - A negative spaceWidth, or a negative or fractional bar count, throws.
     */
    function layoutPopulationPyramid(spaceWidth, numBars) {
      requireSize("layoutPopulationPyramid", "spaceWidth", spaceWidth);
      requireCount("layoutPopulationPyramid", "numBars", numBars);
      if (spaceWidth === 0 || numBars === 0) {
        return {
          barHeight: 0,
          padding: 0,
          totalHeight: 0,
          positions: [],
          maxBarLength: 0,
          chartPadding: 0
        };
      }
      const MAX_HEIGHT = 480; // Chart no taller than this
      const MIN_BAR_HEIGHT = 2; // Bars no shorter than this
      const defaultHeight = Math.min(aspectRatioPortrait(spaceWidth), MAX_HEIGHT);
      const padding = 1;
      const numPads = numBars - 1;
      const totalPadding = padding * numPads;
      let roundedBarHeight = Math.round((defaultHeight - totalPadding) / numBars);
      roundedBarHeight = Math.max(roundedBarHeight, MIN_BAR_HEIGHT);
      const totalHeight = numBars * roundedBarHeight + totalPadding;
      let barPos = totalHeight - roundedBarHeight;
      const step = roundedBarHeight + padding,
        positions = [];
      while (barPos >= 0) {
        positions.push(barPos);
        barPos -= step;
      }
      // half of each side, up to half the chart's own maximum height
      const maxBarLength = Math.min(spaceWidth / 2, MAX_HEIGHT / 2);
      const chartPadding = Math.max((spaceWidth - 2 * maxBarLength) / 2, 0);
      return {
        barHeight: roundedBarHeight,
        padding,
        totalHeight,
        positions,
        maxBarLength,
        chartPadding
      };
    }

    /**
     * @module sszvis/layout/sankey
     *
     * A module of helper functions for computing the data structure
     * and layout required by the sankey component.
     *
     * Behaviour notes:
     * - prepareData's source, target and value accessors are required; a builder missing one throws
     *   when it is applied.
     * - a link with an unknown source or target id is warned about and dropped, so the returned
     *   links array holds only links.
     * - computeLayout's per-column padding and pixels-per-unit are each reduced to a minimum across
     *   all columns, but a degenerate column contributes the largest candidate in both cases, so it
     *   is discarded by the minimum rather than distorting the others.
     * - computeLayout returns a zeroed layout for a diagram with no columns, no room, or no
     *   values at all.
     */
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
     * - source, target and value are required accessors; a builder missing one throws when it is
     *   applied, rather than looking the raw row up as a node id.
     * - a link whose source or target id is not in idLists is warned about and dropped from the
     *   returned links array.
     * - a link's id is the index of the row it came from, so re-preparing the same data gives the
     *   same links the same ids and the component's data join can match them up.
     * - a duplicate id warns and keeps only the last column.
     * - a row whose value is not a number of zero or more is warned about and dropped.
     * - a link whose two ends are in the same column is warned about and dropped: a sankey link
     *   runs between columns.
     * - the builder's `apply` shadows Function.prototype.apply; call it as builder.apply(data)
     *   or builder(data).
     * - nodes are sorted across all columns at once (descending by default), then offsets are
     *   assigned per column.
     */
    const prepareData = () => {
      let mGetSource;
      let mGetTarget;
      let mGetValue;
      let mColumnIds = [];
      // Helper functions
      const valueAcc = prop("value");
      const byAscendingValue = (a, b) => d3.ascending(valueAcc(a), valueAcc(b));
      const byDescendingValue = (a, b) => d3.descending(valueAcc(a), valueAcc(b));
      let valueSortFunc = byDescendingValue;
      const main = inputData => {
        const getSource = mGetSource;
        const getTarget = mGetTarget;
        const getValue = mGetValue;
        if (!getSource || !getTarget || !getValue) {
          const missing = [getSource ? undefined : "source", getTarget ? undefined : "target", getValue ? undefined : "value"].filter(Boolean);
          throw new TypeError("sankeyPrepareData: the ".concat(missing.join(", "), " accessor").concat(missing.length > 1 ? "s are" : " is", " required"));
        }
        const columnIndex = mColumnIds.reduce((index, columnIdsList, colIndex) => {
          for (const id of columnIdsList) {
            if (index.has(id)) {
              warn("Duplicate column member id passed to sszvis.layout.sankey.prepareData.column:", id, "The existing value will be overwritten");
            }
            const item = {
              id,
              columnIndex: colIndex,
              // This is the index of the column containing this node
              nodeIndex: 0,
              // This will be overwritten at a later stage with the index of this node within its column
              value: 0,
              valueOffset: 0,
              linksFrom: [],
              linksTo: []
            };
            index.set(id, item);
          }
          return index;
        }, new Map());
        const listOfLinks = inputData.flatMap((datum, rowIndex) => {
          const srcId = getSource(datum);
          const tgtId = getTarget(datum);
          const rawValue = getValue(datum);
          const value = Number(rawValue);
          const srcNode = columnIndex.get(srcId);
          const tgtNode = columnIndex.get(tgtId);
          if (!srcNode) {
            warn("Found invalid source column id:", srcId);
            return [];
          }
          if (!tgtNode) {
            warn("Found invalid target column id:", tgtId);
            return [];
          }
          if (srcNode.columnIndex === tgtNode.columnIndex) {
            warn("Found a link whose source and target are in the same column, and dropped it:", srcId, tgtId);
            return [];
          }
          if (!Number.isFinite(value) || value < 0) {
            warn("Found a link value that is not a number of zero or more, and dropped the link:", rawValue, srcId, tgtId);
            return [];
          }
          const item = {
            // the row's own index: an id that identifies a link rather than a call
            id: rowIndex,
            value,
            src: srcNode,
            srcOffset: 0,
            tgt: tgtNode,
            tgtOffset: 0
          };
          srcNode.linksFrom.push(item);
          tgtNode.linksTo.push(item);
          return [item];
        });
        // Extract the column nodes from the index
        const listOfNodes = [...columnIndex.values()];
        // Calculate an array of total values for each column
        const columnTotals = listOfNodes.reduce((totals, node) => {
          const fromTotal = d3.sum(node.linksFrom, valueAcc);
          const toTotal = d3.sum(node.linksTo, valueAcc);
          // For correct visual display, the node's value is the max of the from and to links
          node.value = Math.max(fromTotal, toTotal);
          totals[node.columnIndex] += node.value;
          return totals;
        }, filledArray(mColumnIds.length, 0));
        // An array with the number of nodes in each column
        const columnLengths = mColumnIds.map(colIds => colIds.length);
        // Sort the column nodes
        // (note, this sorts all nodes for all columns in the same array)
        listOfNodes.sort(valueSortFunc);
        // Sort the links in descending order of value. This means smaller links will render
        // on top of larger links.
        // (note, this sorts all links for all columns in the same array)
        listOfLinks.sort(byDescendingValue);
        // Assign the valueOffset and nodeIndex properties
        // Here, columnData[0] is an array adding up value totals
        // and columnData[1] is an array adding up the number of nodes in each column
        // Both are used to assign cumulative properties to the nodes of each column
        listOfNodes.reduce((columnData, node) => {
          // Assigns valueOffset and nodeIndex
          node.valueOffset = columnData[0][node.columnIndex];
          node.nodeIndex = columnData[1][node.columnIndex];
          columnData[0][node.columnIndex] += node.value;
          columnData[1][node.columnIndex] += 1;
          return columnData;
        }, [filledArray(mColumnIds.length, 0), filledArray(mColumnIds.length, 0)]);
        // Once the order of nodes is calculated, we need to sort the links going into the
        // nodes and the links coming out of the nodes according to the ordering of the nodes
        // they come from or go to. This creates a visually appealing layout which minimizes
        // the number of link crossings
        for (const node of listOfNodes) {
          node.linksFrom.sort((linkA, linkB) => linkA.tgt.nodeIndex - linkB.tgt.nodeIndex);
          node.linksTo.sort((linkA, linkB) => linkA.src.nodeIndex - linkB.src.nodeIndex);
          // Stack the links vertically within the node according to their order
          node.linksFrom.reduce((sumValue, link) => {
            link.srcOffset = sumValue;
            return sumValue + valueAcc(link);
          }, 0);
          node.linksTo.reduce((sumValue, link) => {
            link.tgtOffset = sumValue;
            return sumValue + valueAcc(link);
          }, 0);
        }
        return {
          nodes: listOfNodes,
          links: listOfLinks,
          columnTotals,
          columnLengths
        };
      };
      const api = Object.assign(main, {
        apply(data) {
          return main(data);
        },
        source(func) {
          mGetSource = func;
          return api;
        },
        target(func) {
          mGetTarget = func;
          return api;
        },
        value(func) {
          mGetValue = func;
          return api;
        },
        descendingSort() {
          valueSortFunc = byDescendingValue;
          return api;
        },
        ascendingSort() {
          valueSortFunc = byAscendingValue;
          return api;
        },
        idLists(idLists) {
          mColumnIds = idLists;
          return api;
        }
      });
      return api;
    };
    /** Matches JavaScript's implicit undefined -> NaN coercion in arithmetic. */
    const num = value => value === undefined ? Number.NaN : value;
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
     *   minimum across the columns is used for all of them. A single-node column draws no gaps, so
     *   it has no padding to contribute and is left out of that minimum; a diagram whose columns
     *   all hold one node has no padding at all.
     * - pixels-per-unit is the minimum across the columns of the non-padding pixels divided by the
     *   column total. A column total of 0 contributes Infinity, which the minimum discards unless
     *   every total is 0; a diagram whose columns are all empty is zeroed instead.
     * - columnRange is the per-step offset, computed as (columnWidth - nodeThickness) /
     *   (numColumns - 1). Fewer than two columns have no step at all and report an offset of 0.
     * - nodeThickness is always 20.
     * - A diagram with no columns, no room or no values at all comes back zeroed; a negative
     *   height or width, or a negative or fractional column length, throws.
     */
    const computeLayout$1 = (columnLengths, columnTotals, columnHeight, columnWidth) => {
      var _max, _min;
      requireSize("sankeyLayout", "columnHeight", columnHeight);
      requireSize("sankeyLayout", "columnWidth", columnWidth);
      for (const colLength of columnLengths) {
        requireCount("sankeyLayout", "columnLengths", colLength);
      }
      if (columnTotals.length !== columnLengths.length) {
        throw new RangeError("sankeyLayout: columnTotals must hold one total per column, got ".concat(columnTotals.length, " for ").concat(columnLengths.length, " columns"));
      }
      // The maximum total value of any column
      const maxTotal = (_max = d3.max(columnTotals)) !== null && _max !== void 0 ? _max : 0;
      const nodeThickness = 20;
      const numColumns = columnLengths.length;
      // With one column there are no steps to space out, so the offset is zero rather than a
      // division by zero (issue #120).
      const columnXMultiplier = numColumns > 1 ? (columnWidth - nodeThickness) / (numColumns - 1) : 0;
      const columnDomain = [0, 1];
      const columnRange = [0, columnXMultiplier];
      // Nothing to scale: no columns, no room for them, or no values in any of them
      if (numColumns === 0 || columnHeight === 0 || columnWidth === 0 || maxTotal === 0) {
        return {
          valuePadding: 0,
          nodePadding: 0,
          columnPaddings: columnLengths.map(() => 0),
          valueDomain: [0, maxTotal],
          valueRange: [0, 0],
          nodeThickness,
          columnDomain,
          // Zeroed with the rest of the layout. Computed from columnWidth, the multiplier is
          // negative once columnWidth falls below nodeThickness, which would place the columns
          // outside a container that has no room for them at all.
          columnRange: [0, 0]
        };
      }
      // Calculate appropriate scale and padding values (in pixels)
      const padSpaceRatio = 0.15;
      const padMin = 12;
      const padMax = 50;
      const minDisplayPixels = 1; // Minimum number of pixels used for display area
      // Compute the padding value (in pixels) for each column, then take the minimum value.
      // A column of one node draws no gaps, so it has no padding of its own to contribute, and
      // charging its (divide-by-zero, then clamped) candidate to the other columns would shrink
      // columns that do draw gaps.
      const computedPixPadding = (_min = d3.min(columnLengths.filter(colLength => colLength > 1).map(colLength => {
        // Any given column's padding is := (1 / 4 of total extent) / (number of padding spaces)
        const colPadding = columnHeight * padSpaceRatio / (colLength - 1);
        // Limit by minimum and maximum pixel padding values
        return Math.max(padMin, Math.min(padMax, colPadding));
      }))) !== null && _min !== void 0 ? _min : 0;
      // Given the computed padding value, compute each column's resulting "pixels per unit"
      // This is the number of remaining pixels available to display the column's total units,
      // after padding pixels have been subtracted. Then take the minimum value of that.
      const pixPerUnit = d3.min(columnLengths.map((colLength, colIndex) => {
        // The non-padding pixels must have at least minDisplayPixels
        const nonPaddingPixels = Math.max(minDisplayPixels, columnHeight - (colLength - 1) * computedPixPadding);
        return nonPaddingPixels / num(columnTotals[colIndex]);
      }));
      // The padding between bars, in bar value units
      const valuePadding = computedPixPadding / num(pixPerUnit);
      // The padding between bars, in pixels
      const nodePadding = computedPixPadding;
      // Compute y-padding required to vertically center each column (in pixels)
      const paddedHeights = columnLengths.map((colLength, colIndex) => num(columnTotals[colIndex]) * num(pixPerUnit) + (colLength - 1) * nodePadding);
      const maxPaddedHeight = d3.max(paddedHeights);
      const columnPaddings = columnLengths.map((_colLength, colIndex) => (num(maxPaddedHeight) - num(paddedHeights[colIndex])) / 2);
      // The domain of the size scale
      const valueDomain = [0, maxTotal];
      // The range of the size scale
      const valueRange = [0, maxTotal * num(pixPerUnit)];
      return {
        valuePadding,
        nodePadding,
        columnPaddings,
        valueDomain,
        valueRange,
        nodeThickness,
        columnDomain,
        columnRange
      };
    };

    /**
     * Small Multiples layout
     *
     * Used to generate group elements which contain small multiples charts.
     *
     * This component lays out rectangular groups in a grid according to the number of rows
     * and the number of columns provided. It is possible to specify paddingX and paddingY
     * values, pixel amounts which will be left as empty space between the columns and the
     * rows, respectively.
     *
     * Data should be passed to this component in a special way: it should be an array of
     * data values, where each data value represents a single group. IMPORTANT: each data
     * value must also have a property called 'values' which represents the values corresponding
     * to that group.
     *
     * In the multiple pie charts example, an array of "groups" data is bound to the chart before
     * the multiples component is called. Each element in the "groups" data has a values property
     * which contains the data for a single pie chart.
     *
     * The multiples component creates the groups and lays them out, attaching the following new properties
     * to each group object:
     *
     * gx - the x-position of the group
     * gy - the y-position of the group
     * gw - the width of the group (without padding)
     * gh - the height of the group (without padding)
     * cx - the horizontal center point of the group
     * cy - the vertical center point of the group
     *
     * Generally, you should not use source data objects as group objects, but should instead
     * create new objects which are used to store group information. This creates a data hierarchy
     * which matches the representation hierarchy, which is very much a d3 pattern.
     *
     * Once the groups have been created, the user must still do something with them. The pattern
     * for creating charts within each group should look something like:
     *
     * chart.selectAll('.sszvis-multiple')
     *   .each(function(d) {
     *     var groupSelection = select(this);
     *
     *     ... do something which creates a chart using groupSelection ...
     *   });
     *
     * @module sszvis/layout/smallMultiples
     *
     * @property {number} width           the total width of the collection of multiples
     * @property {number} height          the total height of the collection of multiples
     * @property {number} paddingX        x-padding to put between columns
     * @property {number} paddingY        y-padding to put between rows
     * @property {number} rows            the number of rows to generate
     * @property {number} cols            the number of columns to generate
     * @property {boolean} showTitle      whether to show a title above each multiple (default: false)
     * @property {function} titleLabel    accessor function to get the title text from the data
     * @property {string} titleAnchor     text-anchor for the title: "start", "middle", or "end" (default: "middle"). Any other value throws.
     * @property {number} titleY          y-position offset for the title (default: 0)
     *
     * Behaviour notes:
     * - Groups are laid out left-to-right, then top-to-bottom, one group per datum.
     * - gx/gy are grid-absolute; cx/cy are unit-relative and identical for every multiple,
     *   since each group is translated to its own gx/gy.
     * - The layout writes gx/gy/gw/gh/cx/cy back onto the bound data objects.
     * - width, height, rows and cols are required: omitting any of them throws before a group
     *   is created. paddingX and paddingY default to 0, as do the four title properties.
     * - More data than rows * cols does not fit the declared grid, and throws.
     * - A datum without a `values` property throws: the inner chart group has nothing to bind.
     * - titleLabel is called after the layout fields have been attached to the datum, so it
     *   sees gx/gy/gw/gh/cx/cy alongside the caller's own fields.
     * - titleAnchor must be "start", "middle" or "end"; any other value throws.
     *
     * @return {sszvis.component}
     */
    const TITLE_ANCHORS = ["start", "middle", "end"];
    function smallMultiples () {
      return component().prop("width").prop("height").prop("paddingX").paddingX(0).prop("paddingY").paddingY(0).prop("rows").prop("cols").prop("showTitle").showTitle(false).prop("titleLabel").titleLabel(() => "").prop("titleAnchor").titleAnchor("middle").prop("titleY").titleY(0).render(function (data) {
        const selection = d3.select(this);
        const props = selection.props();
        for (const propName of ["width", "height", "rows", "cols"]) {
          if (props[propName] === undefined) {
            throw new TypeError("smallMultiples: the ".concat(propName, " property is required"));
          }
        }
        if (props.showTitle && !TITLE_ANCHORS.includes(props.titleAnchor)) {
          throw new RangeError("smallMultiples: titleAnchor must be one of ".concat(TITLE_ANCHORS.join(", "), ", got ").concat(props.titleAnchor));
        }
        for (const [index, datum] of data.entries()) {
          if (!(datum && "values" in datum)) {
            throw new TypeError("smallMultiples: group ".concat(index, " has no values property"));
          }
        }
        if (data.length > props.rows * props.cols) {
          throw new RangeError("smallMultiples: the ".concat(props.rows, " x ").concat(props.cols, " grid has no room for ").concat(data.length, " groups"));
        }
        const unitWidth = (props.width - props.paddingX * (props.cols - 1)) / props.cols;
        const unitHeight = (props.height - props.paddingY * (props.rows - 1)) / props.rows;
        const horizontalCenter = unitWidth / 2;
        const verticalCenter = unitHeight / 2;
        const multiples = selection.selectAll("g.sszvis-multiple").data(data).join("g").classed("sszvis-g sszvis-multiple", true);
        multiples.selectAll("g.sszvis-multiple-chart").data(d => [d.values]).join("g").classed("sszvis-multiple-chart", true);
        multiples.datum((d, i) => {
          d.gx = i % props.cols * (unitWidth + props.paddingX);
          d.gw = unitWidth;
          d.cx = horizontalCenter;
          d.gy = Math.floor(i / props.cols) * (unitHeight + props.paddingY);
          d.gh = unitHeight;
          d.cy = verticalCenter;
          return d;
        }).attr("transform", d => "translate(".concat(d.gx, ",").concat(d.gy, ")"));
        // Render titles if showTitle is enabled
        if (props.showTitle) {
          const titleX = props.titleAnchor === "start" ? 0 : props.titleAnchor === "end" ? unitWidth : horizontalCenter;
          multiples.selectAll(".sszvis-multiple-title").data(d => [d]).join("text").classed("sszvis-multiple-title", true).attr("x", titleX).attr("y", props.titleY).attr("text-anchor", props.titleAnchor).text(props.titleLabel);
        } else {
          multiples.selectAll(".sszvis-multiple-title").remove();
        }
      });
    }

    /** Nothing can be drawn: no baselines, and no band or padding to report. */
    const EMPTY_LAYOUT = {
      range: [],
      bandHeight: 0,
      padHeight: 0
    };
    function layoutStackedAreaMultiples(height, num, pct) {
      requireSize("layoutStackedAreaMultiples", "height", height);
      requireCount("layoutStackedAreaMultiples", "num", num);
      const padRatio = pct !== null && pct !== void 0 ? pct : 0.1;
      requireRatio("layoutStackedAreaMultiples", "pct", padRatio);
      const step = height / (num - padRatio);
      // A non-positive step never reaches the bottom of the chart, so the baseline loop below
      // would never terminate. An infinite one - num and pct both 0, or both 1, either of
      // which divides by zero - overshoots on the first iteration and yields NaN geometry.
      // There is no layout to describe in either case.
      if (!(step > 0) || !Number.isFinite(step)) return _objectSpread2({}, EMPTY_LAYOUT);
      const bandHeight = step * (1 - padRatio),
        range = [];
      let level = bandHeight; // count from the top, and start at the bottom of the first band
      while (level - height < 1) {
        range.push(level);
        level += step;
      }
      return {
        range,
        bandHeight,
        padHeight: step * padRatio
      };
    }

    /**
     * @module sszvis/layout/sunburst
     *
     * Helper functions for transforming your data to match the format required by the sunburst chart.
     *
     * Behaviour notes:
     * - computeLayout does not validate its inputs and can silently produce a layout that
     *   overflows or under-fills the chart; see the notes on computeLayout below.
     * - prepareData is deprecated but is still the only builder that produces the partition
     *   positions (x0/x1/y0/y1) that getRadiusExtent reads. The sunburst component accepts either:
     *   handed a plain hierarchy it runs d3.partition itself.
     */
    const MAX_SUNBURST_RING_WIDTH = 60;
    const MAX_RW = MAX_SUNBURST_RING_WIDTH;
    const MIN_SUNBURST_RING_WIDTH = 10;
    const MIN_RW = MIN_SUNBURST_RING_WIDTH;
    /**
     * sszvis.layout.sunburst.computeLayout
     *
     * Computes layout parameters for good visual display of the sunburst chart.
     *
     * @param  {Number} numLayers          The number of layers in the sunburst chart.
     * @param  {Number} chartWidth         The total width available for displaying the sunburst chart.
     * @return {Object}                    Some parameters for the sunburst chart:
     *       @property {Number} centerRadius      The central radius of the chart (used by the sunburst component)
     *       @property {Number} numLayers         The number of layers in the chart (used by the sunburst component)
     *       @property {Number} ringWidth         The width of a single ring in the chart (used by the sunburst component)
     *
     * Behaviour notes:
     * - centerRadius is chartWidth / 6, shrunk when the rings would not otherwise fit.
     * - ringWidth is the remaining radius divided by numLayers, clamped to [10, 60].
     * - The 10px floor is reconciled with the centre: a deep hierarchy in a narrow chart gives
     *   its rings the room by shrinking centerRadius, so that
     *   centerRadius + ringWidth * numLayers stays within chartWidth / 2 - the outer radius the
     *   sunburst component draws, per docs/sunburst/basic.js. A hierarchy so deep that even a
     *   centre of nothing cannot hold it warns and overflows. The 60px cap is not compensated
     *   for in the other direction: a shallow hierarchy simply leaves empty space.
     * - A zero chartWidth or a hierarchy with no layers is a chart with nothing to draw, and
     *   every dimension comes back 0.
     * - A negative chartWidth, or a negative or fractional layer count, throws.
     */
    const computeLayout = (numLayers, chartWidth) => {
      requireCount("sunburstLayout", "numLayers", numLayers);
      requireSize("sunburstLayout", "chartWidth", chartWidth);
      if (numLayers === 0 || chartWidth === 0) {
        return {
          centerRadius: 0,
          numLayers,
          ringWidth: 0
        };
      }
      // Diameter of the center circle is one-third the width
      const halfWidth = chartWidth / 2;
      const targetCenterRadius = halfWidth / 3;
      const ringWidth = Math.max(MIN_RW, Math.min(MAX_RW, (halfWidth - targetCenterRadius) / numLayers));
      // Once the ring width is floored, the rings may need more room than the target centre
      // leaves them. Give it to them, down to a centre of nothing.
      const centerRadius = Math.max(0, Math.min(targetCenterRadius, halfWidth - ringWidth * numLayers));
      if (ringWidth * numLayers > halfWidth) {
        warn("sunburstLayout: ".concat(numLayers, " rings of the minimum ").concat(MIN_RW, "px do not fit a chart ").concat(chartWidth, "px wide, and will be drawn outside it"));
      }
      return {
        centerRadius,
        numLayers,
        ringWidth
      };
    };
    /**
     * sszvis.layout.sunburst.getRadiusExtent
     * @param  {Array} formattedData      An array of data to inspect for the extent of the radius scale
     *
     * @return {Array}                    The minimum and maximum radius values (in d3's partition layout's terms). Use this as
     *                                    The domain of the radius scale you use to configure the sunburst chart. This is a convenience
     *                                    function which abstracts away the way d3 stores positions within the partition layout used
     *                                    by the sunburst chart.
     *
     * Behaviour notes:
     * - Returns [min y0, max y1] taken independently of each other.
     * - d3.min/max skip undefined and NaN nodes.
     * - An empty array gives [0, 0], which is a usable, if empty, scale domain.
     */
    const getRadiusExtent = formattedData => {
      var _min, _max;
      return [(_min = d3.min(formattedData, d => d.y0)) !== null && _min !== void 0 ? _min : 0, (_max = d3.max(formattedData, d => d.y1)) !== null && _max !== void 0 ? _max : 0];
    };

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
     * - numBars === 1 has zero padding spaces, so it reports no padding at all.
     * - A zero width or a zero bar count is a chart with nothing to draw, and every dimension
     *   comes back 0 (totalWidth still reports the width that was asked for).
     * - A negative width, or a negative or fractional bar count, throws.
     */
    function dimensionsVerticalBarChart(width, numBars) {
      requireSize("dimensionsVerticalBarChart", "width", width);
      requireCount("dimensionsVerticalBarChart", "numBars", numBars);
      if (width === 0 || numBars === 0) {
        return {
          barWidth: 0,
          padWidth: 0,
          padRatio: 0,
          outerRatio: 0,
          barGroupWidth: 0,
          totalWidth: width
        };
      }
      const MAX_BAR_WIDTH = 48,
        // the maximum width of a bar
        MIN_PADDING = 2,
        // the minimum padding value
        MAX_PADDING = 100,
        // the maximum padding value
        TARGET_BAR_RATIO = 0.7,
        // the ratio of width to width + padding used to compute the initial width and padding
        TARGET_PADDING_RATIO = 1 - TARGET_BAR_RATIO,
        // the inverse of the bar ratio, this is the ratio of padding to width + padding
        numPads = numBars - 1; // the number of padding spaces
      // compute the target size of the padding
      // the derivation of this equation is available upon request
      let padding = width * TARGET_PADDING_RATIO / (TARGET_PADDING_RATIO * numPads + TARGET_BAR_RATIO * numBars);
      // based on the computed padding, calculate the bar width
      let barWidth = (width - padding * numPads) / numBars;
      // adjust for min and max bounds
      if (barWidth > MAX_BAR_WIDTH) {
        barWidth = MAX_BAR_WIDTH;
        // recompute the padding value where necessary
        padding = numPads === 0 ? 0 : (width - barWidth * numBars) / numPads;
      }
      if (numPads === 0) {
        // a single bar draws no gaps, so any padding reported here is a phantom that would
        // still feed padRatio
        padding = 0;
      } else {
        if (padding < MIN_PADDING) padding = MIN_PADDING;
        if (padding > MAX_PADDING) padding = MAX_PADDING;
      }
      // compute other information
      const padRatio = 1 - barWidth / (barWidth + padding),
        computedBarSpace = barWidth * numBars + padding * numPads,
        outerRatio = (width - computedBarSpace) / 2 / (barWidth + padding);
      return {
        barWidth,
        padWidth: padding,
        padRatio,
        outerRatio,
        barGroupWidth: computedBarSpace,
        totalWidth: width
      };
    }

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
    function binnedColorScale () {
      return component().prop("scale").prop("displayValues").prop("endpoints").prop("width").width(200).prop("labelFormat").labelFormat(identity).render(function () {
        const selection = d3.select(this);
        const props = selection.props();
        if (!props.scale) {
          error("legend.binnedColorScale - a scale must be specified.");
          return;
        }
        if (!props.displayValues) {
          error("legend.binnedColorScale - display values must be specified.");
          return;
        }
        if (!props.endpoints) {
          error("legend.binnedColorScale - endpoints must be specified");
          return;
        }
        const segHeight = 10;
        const circleRad = segHeight / 2;
        const innerRange = [0, props.width - 2 * circleRad];
        const barWidth = d3.scaleLinear().domain(props.endpoints).range(innerRange);
        let sum = 0;
        const labelledBins = [];
        let pPrev = props.endpoints[0];
        for (const p of props.displayValues) {
          const w = barWidth(p) - sum;
          const offset = sum % 1;
          labelledBins.push({
            x: Math.floor(circleRad + sum),
            w: w + offset,
            c: props.scale(pPrev),
            p
          });
          sum += w;
          pPrev = p;
        }
        // add the final box (last display value - > endpoint)
        const finalBin = {
          x: Math.floor(circleRad + sum),
          w: innerRange[1] - sum,
          c: props.scale(pPrev)
        };
        const rectData = [...labelledBins, finalBin];
        const circles = selection.selectAll("circle.sszvis-legend__circle").data(props.endpoints).join("circle").classed("sszvis-legend__circle", true);
        circles.attr("r", circleRad).attr("cy", circleRad).attr("cx", (_d, i) => i === 0 ? circleRad : props.width - circleRad).attr("fill", props.scale);
        const segments = selection.selectAll("rect.sszvis-legend__crispmark").data(rectData).join("rect").classed("sszvis-legend__crispmark", true);
        segments.attr("x", d => d.x).attr("y", 0).attr("width", d => d.w).attr("height", segHeight).attr("fill", d => d.c);
        // Every bin except the trailing one gets a tick line and a label.
        const lineData = labelledBins;
        const lines = selection.selectAll("line.sszvis-legend__crispmark").data(lineData).join("line").classed("sszvis-legend__crispmark", true);
        lines.attr("x1", d => halfPixel(d.x + d.w)).attr("x2", d => halfPixel(d.x + d.w)).attr("y1", segHeight + 1).attr("y2", segHeight + 6).attr("stroke", "#B8B8B8");
        const labels = selection.selectAll(".sszvis-legend__axislabel").data(lineData).join("text").classed("sszvis-legend__axislabel", true);
        labels.style("text-anchor", "middle").attr("transform", d => "translate(".concat(d.x + d.w, ",").concat(segHeight + 20, ")")).text(d => props.labelFormat(d.p));
      });
    }

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
    function legendColorLinear() {
      return component().prop("scale").prop("displayValues").displayValues([]).prop("width").width(200).prop("segments").segments(8).prop("labelText").prop("labelFormat")
      // fn.identity is the documented "no formatting" default. It returns its argument, so it
      // cannot satisfy a formatter type that promises a primitive - d3 stringifies the value
      // at render time, which its own types do not model.
      .labelFormat(identity).render(function () {
        const selection = d3.select(this);
        const props = selection.props();
        if (!props.scale) {
          error("legend.linearColorScale - a scale must be specified.");
          return;
        }
        const domain = props.scale.domain();
        // Equivalent to fn.last(domain), without widening the element type to undefined.
        const domainMax = domain[domain.length - 1];
        let values = props.displayValues;
        if (values.length === 0 && props.scale.ticks) {
          values = props.scale.ticks(props.segments - 1);
        }
        // Never write into the caller's array, and only extend the ramp to the domain
        // maximum when the values do not already reach it - scale.ticks() usually does.
        values = values.length > 0 && values[values.length - 1] === domainMax ? [...values] : [...values, domainMax];
        const segWidth = props.width / values.length;
        const segHeight = 10;
        const segments = selection.selectAll("rect.sszvis-legend__mark").data(values).join("rect").classed("sszvis-legend__mark", true);
        segments.attr("x", (_d, i) => i * segWidth - 1) // The offsets here cover up half-pixel antialiasing artifacts
        .attr("y", 0).attr("width", segWidth + 1) // The offsets here cover up half-pixel antialiasing artifacts
        .attr("height", segHeight).attr("fill", d => props.scale(d));
        const startEnd = [domain[0], domainMax];
        const labelText = props.labelText || startEnd;
        // rounded end caps for the segments
        const endCaps = selection.selectAll("circle.sszvis-legend__mark").data(startEnd).join("circle").attr("class", "sszvis-legend__mark");
        endCaps.attr("cx", (_d, i) => i * props.width).attr("cy", segHeight / 2).attr("r", segHeight / 2).attr("fill", d => props.scale(d));
        const labels = selection.selectAll(".sszvis-legend__label").data(labelText).join("text").classed("sszvis-legend__label", true);
        const labelPadding = 16;
        labels.style("text-anchor", (_d, i) => i === 0 ? "end" : "start").attr("dy", "0.35em") // vertically-center
        .attr("transform", (_d, i) => "translate(".concat(i * props.width + (i === 0 ? -1 : 1) * labelPadding, ", ").concat(segHeight / 2, ")")).text((d, i) => props.labelFormat(d, i));
      });
    }

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
    function radius () {
      return component().prop("scale").prop("tickFormat")
      // fn.identity is the documented "no formatting" default. It returns its argument, so it
      // cannot satisfy a formatter type that promises a primitive - d3 stringifies the value
      // at render time, which its own types do not model.
      .tickFormat(identity).prop("tickValues").render(function () {
        const selection = d3.select(this);
        const props = selection.props();
        const tickValues = props.tickValues || defaultTickValues(props.scale);
        const maxRadius = range(props.scale)[1];
        const group = selection.selectAll("g.sszvis-legend__elementgroup").data([0]).join("g").attr("class", "sszvis-legend__elementgroup");
        group.attr("transform", translateString(halfPixel(maxRadius), halfPixel(maxRadius)));
        const circles = group.selectAll("circle.sszvis-legend__greyline").data(tickValues).join("circle").classed("sszvis-legend__greyline", true);
        const getCircleCenter = d => maxRadius - props.scale(d);
        const getCircleEdge = d => maxRadius - 2 * props.scale(d);
        circles.attr("r", props.scale).attr("stroke-width", 1).attr("cy", getCircleCenter);
        const lines = group.selectAll("line.sszvis-legend__dashedline").data(tickValues).join("line").classed("sszvis-legend__dashedline", true);
        lines.attr("x1", 0).attr("y1", getCircleEdge).attr("x2", maxRadius + 15).attr("y2", getCircleEdge);
        const labels = group.selectAll(".sszvis-legend__label").data(tickValues).join("text").attr("class", "sszvis-legend__label sszvis-legend__label--small");
        labels.attr("dx", maxRadius + 18).attr("y", getCircleEdge).attr("dy", "0.35em") // vertically-center
        .text(props.tickFormat);
      });
    }
    /**
     * The default ticks: the domain maximum, the value at the midpoint of the scale's range,
     * and the domain minimum. Deriving the middle value calls scale.invert(), so this only
     * works for a continuous scale - supply tickValues to use any other kind.
     */
    function defaultTickValues(scale) {
      var _mean;
      const {
        invert
      } = scale;
      if (!invert) {
        throw new TypeError("legend.radius - scale.invert is required to derive the default ticks; supply tickValues instead.");
      }
      const domain = scale.domain();
      // mean() only returns undefined for an empty range, which a d3 scale never has.
      return [domain[1], invert((_mean = d3.mean(scale.range())) !== null && _mean !== void 0 ? _mean : Number.NaN), domain[0]];
    }

    /**
     * Handle data load errors in a standardized way
     *
     * @module sszvis/loadError
     */
    /**
     * Handle data loading errors by logging them
     * @param error The error object from a failed data load operation
     */
    const loadError = error$1 => {
      error(error$1);
      // Don't use alert()!
      // TODO: render an inline error in the chart instead
      // if (error.status === 404) {
      //   alert('Die Daten konnten nicht geladen werden.\n\n' + error.responseURL + '\n\n' + RELOAD_MSG);
      // } else {
      //   alert('Ein Fehler ist aufgetreten und die Visualisierung kann nicht angezeigt werden. ' + RELOAD_MSG);
      // }
    };

    /**
     * A collection of utilities used by the map modules
     *
     * @module sszvis/map/utils
     */
    const STADT_KREISE_KEY = "zurichStadtKreise";
    const STATISTISCHE_QUARTIERE_KEY = "zurichStatistischeQuartiere";
    const STATISTISCHE_ZONEN_KEY = "zurichStatistischeZonen";
    const WAHL_KREISE_KEY = "zurichWahlKreise";
    const AGGLOMERATION_2012_KEY = "zurichAgglomeration2012";
    const SWITZERLAND_KEY = "switzerland";
    /**
     * swissMapProjection
     *
     * A function for creating d3 projection functions, customized for the dimensions of the map you need.
     * Because this projection generator involves calculating the boundary of the features that will be
     * projected, the result of these calculations is cached internally. Hence the featureBoundsCacheKey.
     *
     * Note: the cache key is width, height and featureBoundsCacheKey only. Reusing a key for a
     * different feature collection returns the projection fitted to the first collection, which places
     * the second collection outside the destination box.
     *
     * Note: featureBoundsCacheKey is optional, and every call that omits it shares the single key
     * "<width>,<height>,undefined". Two different maps rendered at the same size collide silently.
     *
     * Note: the memo cache is a module-level Map with no eviction, so one entry is retained per
     * distinct width/height/key triple for the lifetime of the page - a chart that reprojects on resize
     * accumulates an entry per resize tick. Clearing swissMapProjection.cache is the only way to
     * release them.
     *
     * See test/map/mapUtils.test.ts.
     *
     * @param  {Number} width                           The width of the projection destination space.
     * @param  {Number} height                          The height of the projection destination space.
     * @param  {Object} featureCollection               The feature collection that will be projected by the returned function. Needed to calculated a good size.
     * @param  {String} [featureBoundsCacheKey]         The cache key for the expensive bounds calculation.
     *                                                  Must identify the feature collection: the collection
     *                                                  itself is not part of the key.
     * @return {Function}                               The projection function.
     */
    const swissMapProjection = memoize((width, height, featureCollection,
    // Part of the signature only so that the memoize resolver below can read it.
    _featureBoundsCacheKey) => d3.geoMercator().fitSize([width, height], featureCollection),
    // Memoize resolver
    (width, height, _, featureBoundsCacheKey) => "".concat(width, ",").concat(height, ",").concat(featureBoundsCacheKey));
    /**
     * This is a special d3.geoPath generator function tailored for rendering maps of
     * Switzerland. The values are chosen specifically to optimize path generation for
     * Swiss map regions and is not necessarily optimal for displaying other areas of the globe.
     *
     * Note: the projection is the memoized one from swissMapProjection, shared with every other caller
     * holding the same width, height and cache key, along with that function's cache-key collision
     * behaviour. The path generator itself is new on every call.
     *
     * See test/map/mapUtils.test.ts.
     *
     * @param  {number} width                     The width of the available map space
     * @param  {number} height                    The height of the available map space
     * @param  {GeoJson} featureCollection        The collection of features to be displayed in the map space
     * @param  {string} [featureBoundsCacheKey]   A string key to use to cache the result of the bounds calculation, which is expensive.
     *                                            This key should be the same every time the same featureCollection object
     *                                            is passed to this function. If the featureCollection is different, use a different
     *                                            cache key. If provided, this can enable large performance improvements in map rendering.
     * @return {d3.geoPath}                       A path generator function. This function takes a geojson datum as argument
     *                                            and returns an svg path string which represents that geojson, projected using
     *                                            a map projection optimal for Swiss areas.
     */
    function swissMapPath(width, height, featureCollection, featureBoundsCacheKey) {
      return d3.geoPath().projection(swissMapProjection(width, height, featureCollection, featureBoundsCacheKey));
    }
    /**
     * Use this function to calcualate the length in pixels of a distance in meters across the surface of the earth
     * The earth's radius is not constant, so this function uses an approximation for calculating the degree angle of
     * a distance in meters.
     *
     * Note: the x and y spans of the projected square are averaged, so an anisotropic projection yields
     * the mean of the two axes rather than either one.
     *
     * Note: both spans are taken as absolute values, so a negative meterDistance returns the same
     * positive size as its positive counterpart rather than raising.
     *
     * See test/map/mapUtils.test.ts.
     *
     * @param {function} projection     You need to provide a projection function for calculating pixel values from decimal degree
     *                                  coordinates. This function should accept values as [lon, lat] array pairs (like d3's projection functions).
     * @param {array} centerPoint       You need to provide a center point. This point is used as the center of a hypothetical square
     *                                  with side lengths equal to the meter distance to be measured. The center point is required
     *                                  because the pixel size of a given degree distance will be different if that square is located
     *                                  at the equator or at one of the poles. This value should be specified as a [lon, lat] array pair.
     * @param {number} meterDistance    The distance (in meters) for which you want the pixel value
     * @throws {TypeError}              If the projection clips away either corner of the measured square.
     */
    function pixelsFromGeoDistance(projection, centerPoint, meterDistance) {
      // This radius (in meters) is halfway between the radius of the earth at the equator (6378200m) and that at its poles (6356750m).
      // I figure it's an appropriate approximation for Switzerland, which is at roughly 45deg latitude.
      const APPROX_EARTH_RADIUS = 6367475;
      const APPROX_EARTH_CIRCUMFERENCE = Math.PI * 2 * APPROX_EARTH_RADIUS;
      // Compute the size of the angle made by the meter distance
      const degrees = meterDistance / APPROX_EARTH_CIRCUMFERENCE * 360;
      // Construct a square, centered at centerPoint, with sides that span that number of degrees
      const halfDegrees = degrees / 2;
      const bounds = [[centerPoint[0] - halfDegrees, centerPoint[1] - halfDegrees], [centerPoint[0] + halfDegrees, centerPoint[1] + halfDegrees]];
      // Project those bounds to pixel coordinates using the provided map projection.
      // The projection is wrapped rather than passed to map() point-free, so it is called with the
      // point alone and never with map()'s index and array arguments.
      const [lowerBound, upperBound] = bounds.map(point => projection(point));
      if (lowerBound == null || upperBound == null) {
        throw new TypeError("pixelsFromGeoDistance: the projection clipped away the bounds of the measured square");
      }
      // Depending on the rotation of the map, the sides of the box are not always positive quantities
      // For example, on a north-is-up map, the pixel y-scale is inverted, so higher latitude degree
      // values are lower pixel y-values. On a south-is-up map, the opposite is true.
      const projXDist = Math.abs(upperBound[0] - lowerBound[0]);
      const projYDist = Math.abs(upperBound[1] - lowerBound[1]);
      return (projXDist + projYDist) / 2;
    }
    const GEO_KEY_DEFAULT = "geoId";
    /**
     * prepareMergedData
     *
     * Merges a dataset with a geojson object by matching elements in the dataset to elements in the geojson.
     * it expects a keyname to be given, which is the key in each data object which has the id of the geojson
     * element to which that data object should be matched. Expects an array of data objects, and a geojson object
     * which has a features array. Each feature is mapped to one data object, or to undefined where no
     * data object matched.
     *
     * Note: matching goes through a plain object literal, so ids are stringified - a numeric data key
     * matches a string feature id - and a feature whose id names an Object.prototype member
     * ("constructor", "toString", ...) is handed the inherited property as its datum even though no
     * such datum was supplied.
     *
     * Note: a datum keyed "__proto__" replaces the lookup object's prototype instead of creating an
     * entry. That datum still reads back correctly, but every unmatched feature afterwards is handed a
     * field of it rather than undefined. Do not feed untrusted ids to this function.
     *
     * Note: a symbol data key stays a symbol property, so it can never be matched by a feature id,
     * which GeoJSON allows only as a string or a number. Two symbols with the same description stay
     * distinct for the same reason.
     *
     * Note: several data sharing a key are not reported; the last one wins.
     *
     * Note: a falsy keyName, the empty string included, falls back to GEO_KEY_DEFAULT rather than being
     * used as given.
     *
     * Note: dataset is guarded but geoJson is not, so a missing map throws where missing data returns
     * an entry per feature with no datum.
     *
     * See test/map/mapUtils.test.ts.
     *
     * @param  {Array} [dataset]         The array of input data to match. Anything that is not an array is
     *                                   treated as no data at all.
     * @param  {Object} geoJson          The geojson object. This function will attempt to match each geojson feature to a data object
     * @param  {String} keyName          The name of the property on each data object which will be matched with each geojson id.
     * @return {Array}                   An array of objects (one for each element of the geojson's features). Each should have a
     *                                   geoJson property which is the feature, and a datum property which is the matched datum.
     */
    function prepareMergedGeoData(dataset, geoJson, keyName) {
      // Any falsy key name, the empty string included, falls back to the default.
      const key = keyName || GEO_KEY_DEFAULT;
      // group the input data by map entity id
      const groupedInputData = Array.isArray(dataset) ? dataset.reduce((m, v) => {
        m[toLookupKey(Reflect.get(v, key))] = v;
        return m;
      }, {}) : {};
      // merge the map features and the input data into new objects that include both
      return geoJson.features.map(feature => ({
        geoJson: feature,
        datum: groupedInputData[toLookupKey(feature.id)]
      }));
    }
    /**
     * Normalises a lookup key exactly as a property access does: a symbol stays a symbol key, so two
     * symbols with the same description remain distinct and can never be matched by a string or numeric
     * feature id. Everything else stringifies, which is how a missing key becomes the string
     * "undefined". Shared in substance with the geojson and highlight renderers' own lookups.
     */
    /**
     * The key a feature id or datum value is looked up under. Symbols pass through; everything
     * else is stringified, so numeric and string ids that print the same collide deliberately.
     */
    function toLookupKey(value) {
      return typeof value === "symbol" ? value : String(value);
    }
    /**
     * getGeoJsonCenter
     *
     * Gets the geographic centroid of a geojson feature object. Caches the result of the calculation
     * on the object as an optimization (note that this is a coordinate position and is independent
     * of the map projection). If the geoJson object's properties contain a 'center' property, that
     * is expected to be a string of the form "longitude,latitude" which will be parsed into a [lon, lat]
     * pair expected by d3's projection functions. These strings can be added to the properties array
     * using the topojson command line tool's -e option (see the Makefile rule for the zurich statistical
     * quarters map for an example of this use).
     *
     * Note: the cache is written onto the feature's own properties object, so this function mutates its
     * argument, and the cache is never invalidated - changing `center` after the first call has no
     * effect for the lifetime of the feature object.
     *
     * Note: the `center` string is split on "," and mapped through parseFloat with no validation. A
     * value that does not parse becomes NaN coordinates, and a wrong number of components becomes a
     * wrongly sized array; both reach the projection silently.
     *
     * See test/map/mapUtils.test.ts.
     *
     * @param  {Object} geoJson                 The geoJson object for which you want the center.
     * @return {number[]}                       The geographical coordinates (in the form [lon, lat]) of the centroid
     *                                          (or user-specified center) of the object. Typed as number[] rather
     *                                          than a [lon, lat] tuple because a malformed `center` property is
     *                                          parsed without validation and can yield a shorter or longer array.
     * @throws {TypeError}                      If the feature's properties are null, which is spec-legal GeoJSON
     *                                          but has never been supported here, since the cache is written to
     *                                          the properties object.
     */
    function getGeoJsonCenter(geoJson) {
      const properties = geoJson.properties;
      if (properties == null) {
        throw new TypeError("getGeoJsonCenter: the feature has no properties object to cache onto");
      }
      if (!properties.cachedCenter) {
        const setCenter = properties.center;
        properties.cachedCenter = setCenter ? setCenter.split(",").map(Number.parseFloat) : d3.geoCentroid(geoJson);
      }
      return properties.cachedCenter;
    }
    /**
     * widthAdaptiveMapPathStroke
     *
     * A little "magic" function for automatically calculating map stroke sizes based on
     * the width of the container they're in. Used for responsive designs.
     *
     * Note: the clamp does not rescue NaN - Math.max(0.8, NaN) is NaN - so an unmeasured container
     * width produces a NaN stroke width that reaches the DOM.
     *
     * See test/map/mapUtils.test.ts.
     *
     * @param  {number} width    The width of the container holding the map.
     * @return {number}          The stroke width that the map elements should have, clamped to [0.8, 1.1].
     */
    function widthAdaptiveMapPathStroke(width) {
      return Math.min(Math.max(0.8, width / 400), 1.1);
    }
    /**
     * Whether a fill value references a paint server rather than naming a color. An absent attribute
     * counts as neither: an entering element has no previous fill, and d3's rgb interpolator treats an
     * unparseable start as a constant, so it still reaches its color on the first tick.
     *
     * The map renderers use this to keep a paint-server reference out of a color tween. d3 has no
     * interpolator for one, so it falls back to interpolating the numbers embedded in the two strings:
     * the "-1" of "url(#missing-pattern-1)" pairs with a color's channels and the tween spends its run
     * pointing at patterns that do not exist, which paint nothing.
     *
     * See test/map/mapUtils.test.ts.
     */
    function isPaintServer(fill) {
      var _fill$startsWith;
      return (_fill$startsWith = fill === null || fill === void 0 ? void 0 : fill.startsWith("url(")) !== null && _fill$startsWith !== void 0 ? _fill$startsWith : false;
    }
    /** Where a layer records the pattern id it was given, so re-renders reuse it. */
    const MISSING_PATTERN_ID_ATTR = "data-sszvis-missing-pattern-id";
    let missingPatternCount = 0;
    /**
     * The id of this layer's missing-value pattern, assigning one the first time the layer is
     * rendered.
     *
     * Ids are document-global while the pattern definition lives inside each layer's own group, so a
     * fixed id would have two map layers on one page define it twice and every url(#...) reference in
     * the document resolve to whichever definition came first. The assigned id is cached on the layer
     * element rather than counted per render, so re-rendering a layer keeps its own definition.
     *
     * The selection parameters are generic because d3's Selection is invariant in its element
     * parameters - no single non-generic type accepts every selection.
     *
     * See test/map/mapUtils.test.ts.
     */
    function missingPatternId(selection) {
      const assigned = selection.attr(MISSING_PATTERN_ID_ATTR);
      if (assigned) return assigned;
      const id = "missing-pattern-".concat(++missingPatternCount);
      selection.attr(MISSING_PATTERN_ID_ATTR, id);
      return id;
    }

    /**
     * base renderer component
     *
     * @module sszvis/map/renderer/base
     *
     * @template T The type of the data values merged onto the map features
     *
     * A component used internally for rendering the base layer of maps.
     * These map entities have a color fill, which is possibly a pattern that represents
     * missing values. They are also event targets. If your map has nothing else, it should have a
     * base layer.
     *
     * @property {GeoJson} geoJson                        Declared for compatibility but never read: the render takes every
     *                                                    shape from the geoJson property of each merged datum. Setting it
     *                                                    has no effect, and omitting it renders the map in full.
     * @property {d3.geo.path} mapPath                    A path generator used to create the path data string for each merged
     *                                                    shape. It must be a real d3.geoPath with a projection set, since the
     *                                                    tooltip anchors are positioned by calling mapPath.projection(); see
     *                                                    the note below.
     * @property {Object} mergedData                      This should be an array of merged data objects. Each object should have a datum property (the datum for
     *                                                    the map entity) and a geoJson property (the geoJson shape for the map entity). This component renders the
     *                                                    geoJson data and uses the datum to get properties of the shape, like fill color and tooltip data.
     * @property {Boolean, Function} defined              A predicate used to determine whether a datum has a defined value. Map
     *                                                    entities that fail it display the missing value texture, as do entities
     *                                                    that matched no datum at all - the predicate is only consulted for a
     *                                                    datum that exists. It is wrapped in fn.functor and defaults to the
     *                                                    constant true, so a constant false textures the whole map. The
     *                                                    exception is a layer where no entity has a datum; see the note below.
     * @property {String, Function} fill                  A string or function for the fill of the map entities. An accessor is
     *                                                    called with the entity's datum, and is not called at all for an entity
     *                                                    the dataset does not cover - that one is textured instead. On a layer
     *                                                    where no entity has a datum, though, nothing is textured and the
     *                                                    accessor is called with undefined for every entity; see the note below.
     * @property {Boolean} transitionColor                Whether to transition the fill color of the map entities.
     *                                                    (default: true) With it set, the fill is only applied through the
     *                                                    transition, so a color change fades from the previous color; with it
     *                                                    unset the fill is written synchronously. An entering entity has no
     *                                                    previous color, so it takes the final color at the first tick. Only a
     *                                                    color-to-color change is transitioned; an entity entering or leaving
     *                                                    the missing value texture takes its fill synchronously either way,
     *                                                    since a paint-server reference cannot be interpolated.
     *
     * Note: the scheduled transition keeps d3's defaults of 250ms and easeCubicInOut rather than the
     * intended 500ms easePolyOut. `.transition().call(slowTransition)` returns the original
     * transition, while slowTransition ignores its argument and builds a fresh detached transition
     * that is discarded.
     *
     * Note: "missing" only means something relative to a dataset, so a layer where no entity has a
     * datum is taken to be drawing geometry rather than encoding values - it keeps the caller's fill,
     * is not classed --undefined, and calls the fill accessor with undefined for every entity. One
     * matched datum is enough to make it a data layer, and then the entities the dataset does not
     * cover are textured and the accessor is not called for them. A dataset that is supplied but
     * matches nothing is indistinguishable from no dataset here, since this renderer receives only
     * mergedData; such a map renders with the caller's fill rather than an all-textured map.
     *
     * Note: the missing value pattern is written into a defs element inside each map layer, under an id
     * of that layer's own - "missing-pattern-1", "missing-pattern-2" and so on, recorded on the layer
     * element so re-renders reuse it. The id is not part of the public API; do not select on it.
     *
     * Note: rendering mutates the geojson it is handed. Anchor positions go through getGeoJsonCenter,
     * which caches a center onto every feature's properties. A malformed `center` property parses to
     * NaN coordinates and the anchor is emitted with a transform of translate(NaN,NaN) rather than
     * being skipped, so a typo in an authored map file silently detaches that entity's tooltip.
     *
     * Note: a mapPath that is a bare path function renders all of the areas and then throws a
     * TypeError from the anchor positions, which read mapPath.projection(). An empty mergedData never
     * reaches that read, so the failure depends on the data.
     *
     * Note: the data join has no key function, so it is an index join. Reordering mergedData repaints
     * the existing nodes in place instead of moving them. The --entering class is added and removed
     * within the same chain, so it is never observable from outside a render and offers no enter-only
     * styling hook. See test/map/renderer/base.test.ts.
     *
     * @return {sszvis.component}
     */
    function mapRendererBase () {
      return component().prop("mergedData").prop("geoJson").prop("mapPath").prop("defined", functor).defined(true) // a predicate function to determine whether a datum has a defined value
      .prop("fill", functor).fill(() => "black") // a function for the entity fill color. default is black
      .prop("transitionColor").transitionColor(true).render(function () {
        const selection = d3.select(this);
        const props = selection.props();
        // render the missing value pattern, under an id of this layer's own
        const patternId = missingPatternId(selection);
        ensureDefsElement(selection, "pattern", patternId).call(mapMissingValuePattern);
        // "Missing" only means something relative to a dataset. A layer where no entity has a datum
        // is being used for its geometry rather than to encode data - rastermap-bins.js draws the
        // choropleth as a transparent outline over a raster, with fill("none") and no data at all -
        // so texturing every entity there would paint over what the layer is meant to reveal. Such a
        // layer keeps the caller's fill and is not classed --undefined.
        const encodesData = props.mergedData.some(d => defined(d.datum));
        // Where a dataset is present, one notion of a missing value is shared by the fill and the
        // --undefined class: an entity the dataset does not cover is as missing as one the predicate
        // rejects. Short-circuiting also keeps both accessors from being called with undefined.
        function hasValue(d) {
          return !encodesData || defined(d.datum) && props.defined(d.datum);
        }
        // map fill function - returns the missing value pattern if the datum doesn't exist or fails the props.defined test
        function getMapFill(d) {
          return hasValue(d) ? props.fill(d.datum) : "url(#".concat(patternId, ")");
        }
        const mapAreas = selection
        // Typed to the element the join creates, so the fill filters below can read the fill
        // currently in the DOM without narrowing d3's nullable BaseType at every call.
        .selectAll(".sszvis-map__area").data(props.mergedData).join("path").classed("sszvis-map__area", true).classed("sszvis-map__area--entering", true).attr("data-event-target", "").classed("sszvis-map__area--entering", false);
        mapAreas.classed("sszvis-map__area--undefined", d => !hasValue(d)).attr("d", d => props.mapPath(d.geoJson));
        // The fill is applied exactly once, so the transition has the previous colour to interpolate
        // from. Writing it to the plain selection first would put the final colour in the DOM before
        // the tween started, and the tween would then interpolate that colour onto itself.
        //
        // Only a colour-to-colour change can be tweened. d3 has no interpolator for a paint-server
        // reference, so it falls back to interpolating the numbers embedded in the two strings: the
        // "-1" of "url(#missing-pattern-1)" pairs with a colour's channels and the tween spends its
        // whole run pointing at patterns that do not exist - "url(#missing-pattern255)" - which paint
        // nothing, so the area vanishes until the transition lands. An area entering or leaving the
        // missing-value texture therefore takes its fill synchronously.
        if (props.transitionColor) {
          const tweenable = function (d) {
            return !isPaintServer(getMapFill(d)) && !isPaintServer(this.getAttribute("fill"));
          };
          mapAreas.filter(tweenable).transition().call(slowTransition).attr("fill", getMapFill);
          mapAreas.filter(function (d) {
            return !tweenable.call(this, d);
          }).attr("fill", getMapFill);
        } else {
          mapAreas.attr("fill", getMapFill);
        }
        // the tooltip anchor generator
        const ta = tooltipAnchor().position(d => {
          // Read inside the callback, as the JavaScript did: a mapPath without a projection is only
          // an error once there is an anchor to place, so an empty mergedData still renders.
          // d3's own typings expect the projection type as a type argument here. The runtime guard
          // below still covers a GeoPath whose projection was never set, and a mapPath that is a
          // bare path function with no projection method at all - which the JSDoc's {d3.geo.path}
          // contract permits but this component has never supported.
          const projection = props.mapPath.projection();
          if (typeof projection !== "function") {
            throw new TypeError("map/renderer/base: mapPath must be a d3.geoPath with a projection, since the tooltip anchors are positioned with it");
          }
          // The centre is handed over whole rather than narrowed to a pair. getGeoJsonCenter returns
          // number[] because an unvalidated `center` property can parse to any length, and the
          // JavaScript passed whatever it produced straight to the projection; truncating here would
          // change what a non-d3 projection function that reads past index 1 receives.
          const point = projection(getGeoJsonCenter(d.geoJson));
          // Only a hand-written projection can return null here: d3's own projections clip in the
          // stream, not in the point call, and return a pair - of NaN, for a malformed centre. A null
          // is passed on rather than replaced, as the JavaScript did: tooltipAnchor spreads it into
          // translateString and renders transform="translate(undefined,undefined)". Substituting a
          // NaN pair here would put a different attribute value in the DOM for the same input.
          return point;
        });
        const tooltipGroup = selection.selectGroup("tooltipAnchors").datum(props.mergedData);
        // attach tooltip anchors
        tooltipGroup.call(ta);
      });
    }

    /**
     * bubble renderer component
     *
     * @module sszvis/map/renderer/bubble
     *
     * @template T The type of the data values merged onto the map features
     *
     * Creates circles which are anchored to the positions of map elements. Used in the "bubble chart".
     * You will usually want to pass this component, configured, as the .anchoredShape property of a base
     * map component.
     *
     * @property {Array<Object>} mergedData             An array of merged data objects, each with a datum property (the datum
     *                                                  for the map entity) and a geoJson property (its shape). Produced by
     *                                                  the base map component which renders this. Required and unvalidated:
     *                                                  omitting it reaches d3's keyed join as undefined, which throws. Every
     *                                                  feature is present, including those with no matching datum, whose
     *                                                  datum is undefined.
     * @property {d3.geo.path} mapPath                  A path generator supplying the projection, passed in by the base map
     *                                                  component which renders this. Required: omitting it throws, and it
     *                                                  must be a real d3.geoPath with a projection set, since the anchor
     *                                                  positions call mapPath.projection(); see the note below.
     * @property {Number, Function} radius              The radius of the circles. Can be a function which accepts a datum and returns a radius value.
     *                                                  It has no default and is called unguarded, so omitting it throws -
     *                                                  and so does an accessor that reads through a datum without checking,
     *                                                  since a feature with no data is still given a circle.
     * @property {String, Function} fill                The fill color of the circles. Can be a function. No default, and
     *                                                  called unguarded, so omitting it throws too.
     * @property {String, Function} strokeColor         The stroke color of the circles. Can be a function. Default #ffffff.
     * @property {Number, Function} strokeWidth         The stroke width of the circles. Can be a function. Default 1.
     *                                                  Documented nowhere else: docs/map-signature/README.md omits it.
     * @property {Boolean} transition                   Whether or not to transition the sizes of the circles when data
     *                                                  changes. Default true - but it never actually animates a radius, and
     *                                                  never affects a departing circle; see the notes below.
     *
     * Note: only strokeColor and strokeWidth have defaults. mergedData, mapPath, radius and fill are all
     * required in practice, and each fails differently when left out.
     *
     * Note: the over, out and click handlers registered through .on() are called with undefined rather
     * than with the map entity's datum. The listeners are written for d3 v3, where a listener received
     * the datum first; since d3 v6 it receives the event first, so what they read as `d.datum` is a
     * property of a PointerEvent. The dispatch itself works, unlike the geojson renderer's, so a
     * handler does fire - it just learns nothing about which entity was hovered.
     *
     * Note: on() forwards straight to a d3 dispatch, so it inherits its semantics: it returns the
     * component for chaining and the handler when called with a name alone, an unknown event name
     * throws, a namespaced name such as "over.tooltip" is accepted, and null removes a handler.
     *
     * Note: the circles are drawn into a group appended after the base layer's areas, so they paint on
     * top - and they carry neither a data-event-target attribute nor a pointer-events override. As
     * choropleth binds its own handlers to [data-event-target] after calling the anchored shape, the
     * circles are never bound, so a pointer over a bubble reaches neither the base layer's handler nor,
     * usefully, the bubble's own.
     *
     * Note: the circles are sorted by radius descending, so the largest paint first and smaller ones sit
     * on top of them. That is a DOM reordering, so the rendered order does not follow mergedData.
     *
     * Note: the exit selection is read off the merged selection that join() returned, where it does not
     * exist - so both exit branches are dead code, the shrink-to-zero transition and the plain remove
     * alike. join() has already removed the departing circles synchronously, so a bubble leaving the
     * data disappears instantly rather than shrinking away, whatever `transition` says.
     *
     * Note: the join is keyed on geoJson.id, which GeoJSON does not require. Features that have one keep
     * their circles across a data change; features without one all key to "undefined", so on every
     * re-render the first node matches and every node past it is exited and replaced by a fresh enter
     * node - the count stays right, but all but one circle is destroyed and recreated each time, losing
     * any transition in flight.
     *
     * Note: the radius accessor is called for every circle twice over - once for the attribute and once
     * for the transition - and again for each comparison the size sort makes, so it runs several times
     * more often than there are data.
     *
     * Note: the class is written with attr rather than classed, so it is replaced wholesale on every
     * render and any class a consumer added to a circle is destroyed.
     *
     * Note: nothing in sszvis.css styles .sszvis-anchored-circle, so the fill, stroke and stroke width
     * come entirely from the inline styles this component writes - and a consumer cannot restyle them
     * from their own stylesheet, since an inline style beats any author rule short of !important.
     *
     * Note: this renderer shares four quirks with the base renderer, documented at length in
     * src/map/renderer/base.ts: the radius transition interpolates a value onto itself, so nothing
     * animates on enter or on update; the --entering modifier is added and removed within the same
     * render, so it is never observable and offers no enter-only styling hook; the anchor positions go
     * through getGeoJsonCenter, which caches a centre onto every feature's properties and never
     * invalidates it, so moving a feature's geometry leaves its bubble behind; and mapPath must be a
     * real d3.geoPath, since the positions read mapPath.projection(). Unlike base, though, the
     * transition itself is the intended one - defaultTransition() is passed as `t` to .transition(t)
     * rather than through the no-op `.transition().call(slowTransition)` pattern - so its 300ms and
     * easePolyOut survive.
     *
     * Note: this component adds no tooltip anchors of its own; a bubble map's tooltips are anchored by
     * the base renderer underneath it.
     * See test/map/renderer/bubble.test.ts.
     *
     * @return {sszvis.component}
     */
    /**
     * The join key, as d3 receives it: the feature id, or the string "undefined" for a feature without
     * one - which is why keyless features all collide. d3 appends "" to whatever this returns, so a
     * plain d.geoJson.id would already be stringified; String() only makes the "undefined" fallback
     * explicit for the type. The one divergence is a symbol id, on which d3's `+ ""` would have thrown
     * and String() does not - GeoJSON does not allow one, and no test covers it.
     */
    function keyOf(d) {
      return String(d.geoJson.id);
    }
    /** Reads the datum off a merged entry, as the JavaScript's module-level accessor did. */
    const datumAcc = prop("datum");
    /**
     * What the mouse listeners actually read. They were written for d3 v3, where a listener was called
     * with the datum; since d3 v6 the first argument is the event, so `datum` here is a property of a
     * PointerEvent and is always undefined. Transcribed rather than corrected so the port does not
     * change behaviour - the fix is to take the datum from d3's second argument.
     */
    function legacyDatum$1(event) {
      return event.datum;
    }
    /**
     * Reads the anchor position for a feature, as the JavaScript did: through mapPath.projection(),
     * which is why a bare path function throws here rather than being reported. The projection's own
     * result is indexed unguarded too, so a clipped point throws from that index.
     */
    function anchorPosition(mapPath, geoJson) {
      // The type argument is unchecked, as in base.ts: GeoPath types projection() as a union that
      // includes shapes with no call signature, and only the caller knows which one was set.
      const projection = mapPath.projection();
      if (projection === null || typeof projection !== "function") {
        // Reachable only for a real d3.geoPath whose projection was never set, where the JavaScript
        // threw "projection is not a function" from the call below. A bare path function throws one
        // line above instead, from reading .projection, as it did in the JavaScript. Not covered by
        // the suite: the message is reconstructed rather than observed.
        throw new TypeError("projection is not a function");
      }
      // The centre is handed over whole rather than narrowed to a pair, as the JavaScript did: an
      // unvalidated `center` property can parse to any length, and truncating here would change what a
      // non-d3 projection function that reads past index 1 receives. Follows base.ts.
      const projected = projection(getGeoJsonCenter(geoJson));
      if (projected === null) {
        // The JavaScript indexed this result directly, so a projection that cannot place the point
        // threw from that index; the message is V8's for it.
        throw new TypeError("Cannot read properties of null (reading '0')");
      }
      return projected;
    }
    function bubble () {
      const event = d3.dispatch("over", "out", "click");
      const anchoredCirclesComponent = component().prop("mergedData").prop("mapPath").prop("radius", functor).prop("fill", functor).prop("strokeColor", functor).strokeColor("#ffffff").prop("strokeWidth", functor).strokeWidth(1).prop("transition").transition(true).render(function () {
        const selection = d3.select(this);
        const props = selection.props();
        // Composed rather than written as an arrow: fn.compose invokes each stage with .call(this),
        // so a radius accessor written as a function receives d3's circle node as `this`, exactly as
        // the JavaScript did. An arrow here would call it with `this === undefined`.
        const radiusAcc = compose(props.radius, datumAcc);
        const anchoredCircles = selection.selectGroup("anchoredCircles").selectAll(".sszvis-anchored-circle")
        // The key is the feature id, stringified by d3 - which is how every feature without one
        // collides on "undefined". See the module note.
        .data(props.mergedData, keyOf).join("circle").attr("class", "sszvis-anchored-circle sszvis-anchored-circle--entering").attr("r", radiusAcc).on("mouseover", function (e) {
          event.call("over", this, legacyDatum$1(e));
        }).on("mouseout", function (e) {
          event.call("out", this, legacyDatum$1(e));
        }).on("click", function (e) {
          event.call("click", this, legacyDatum$1(e));
        }).attr("transform", d => {
          const position = anchorPosition(props.mapPath, d.geoJson);
          return translateString(position[0], position[1]);
        }).style("fill", d => props.fill(d.datum)).style("stroke", d => props.strokeColor(d.datum)).style("stroke-width", d => props.strokeWidth(d.datum)).sort((a, b) => props.radius(b.datum) - props.radius(a.datum));
        // Remove the --entering modifier from the updating circles
        anchoredCircles.classed("sszvis-anchored-circle--entering", false);
        if (props.transition) {
          const t = defaultTransition();
          // Note: join() has already removed the exiting nodes and returns the merged selection, so
          // this exit selection is empty and the shrink-away transition never runs. Kept as the
          // JavaScript had it; see the module note.
          anchoredCircles.exit().transition(t).attr("r", 0).remove();
          anchoredCircles.transition(t).attr("r", radiusAcc);
        } else {
          anchoredCircles.exit().remove();
          anchoredCircles.attr("r", radiusAcc);
        }
      });
      // The argument tuple is typed as geojson.ts and src/behavior/panning.ts type their own on():
      // d3's dispatch.on derives its callback type from a *literal* event name, so a plain string
      // collapses the callback to never. Narrowing to "over" | "out" | "click" would type the callback
      // properly but would also reject the namespaced typenames d3 accepts at runtime, such as
      // "over.tooltip".
      anchoredCirclesComponent.on = function () {
        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }
        const value = event.on.apply(event, args);
        return value === event ? anchoredCirclesComponent : value;
      };
      return anchoredCirclesComponent;
    }

    /**
     * geojson renderer component
     *
     * @module sszvis/map/renderer/geojson
     *
     * @template T The type of the data values merged onto the geojson features
     *
     * A component used for rendering overlays of geojson above map layers.
     * It can be used to render any arbitrary GeoJson.
     *
     * @property {string} dataKeyName           The keyname in the data which will be used to match data entities
     *                                          with geographic entities. Default 'geoId'.
     * @property {string} geoJsonKeyName        The keyname in the geoJson which will be used to match map entities
     *                                          with data entities. Default 'id'.
     * @property {GeoJson} geoJson              The GeoJson object which should be rendered. It is read unguarded, so a value
     *                                          without a 'features' property throws a TypeError. Rendering mutates it; see
     *                                          the note below on the cached centroid.
     * @property {d3.geo.path} mapPath          A path generator for drawing the GeoJson as SVG Path elements.
     * @property {Function, Boolean} defined    A predicate used to determine whether a datum has a defined value. Entities
     *                                          that fail it, and entities with no datum at all, display the missing value
     *                                          texture. It is wrapped in fn.functor and defaults to the constant true, so a
     *                                          constant false textures the whole overlay and the default never rejects
     *                                          anything.
     * @property {Function, String} fill        A function that returns a string, or a string, for the fill color of the GeoJson entities. Default black.
     * @property {String, Function} stroke      The stroke color of the entities. Can be a string or a function returning a
     *                                          string, called with the datum. Default black. Undefined entities are not
     *                                          asked for a stroke at all; see the note below.
     * @property {Number, Function} strokeWidth The thickness of the strokes of the shapes. A number, or a function
     *                                          returning a number, called with the datum as the fill and stroke
     *                                          accessors are. Default 1.25. Undefined entities are not asked for a
     *                                          stroke width; they carry no stroke-width attribute.
     * @property {Boolean} transitionColor      Whether to transition the fill color of the geojson entities. Default true.
     *                                          With it set the fill is only applied through the transition, so a color change
     *                                          fades from the previous color; with it unset the fill is written synchronously.
     *                                          An entering entity has no previous color, so it takes the final color at the
     *                                          first tick. Only a color-to-color change is transitioned; an entity entering or
     *                                          leaving the missing value texture takes its fill synchronously either way,
     *                                          since a paint-server reference cannot be interpolated.
     *
     * Note: lookup keys are stringified, so a numeric and a string id that print the same collide. A
     * symbol key stays a symbol and can never be matched by a string id. A feature or datum with no
     * key at all is left unmatched.
     *
     * Note: rendering caches a sphericalCentroid onto every feature's properties and never invalidates
     * it, so moving a feature's geometry leaves its anchor behind. Unlike the base renderer it ignores
     * an authored `center` property and caches under a different key, so the two renderers disagree
     * about where the same entity's tooltip belongs.
     *
     * Note: an undefined entity is given stroke="", which is not a valid paint value. The presentation
     * attribute is ignored and the stylesheet's stroke wins; this is not the same as removing the
     * attribute or asking for no stroke.
     *
     * Note: the missing value pattern is written into a defs element inside each layer, under an id of
     * that layer's own - "missing-pattern-1", "missing-pattern-2" and so on, recorded on the layer
     * element so re-renders reuse it. The id is not part of the public API; do not select on it.
     *
     * Note: two quirks remain, shared with the base renderer. The slowTransition call is a no-op that
     * leaves d3's 250ms easeCubicInOut defaults in place of the intended 500ms easePolyOut, and the
     * data join has no key function, so it is an index join: reordering the features repaints the
     * existing nodes in place instead of moving them.
     *
     * See test/map/renderer/geojson.test.ts.
     *
     * @return {sszvis.component}
     */
    /**
     * Reads a match key off a feature's properties. RFC 7946 permits a null properties member, and a
     * feature may simply not carry the configured key, so both cases read as undefined - which the
     * merge treats as unmatched rather than as the lookup key "undefined".
     */
    function readFeatureKey(properties, key) {
      return properties === null || properties === undefined ? undefined : properties[key];
    }
    function mapRendererGeoJson() {
      const event = d3.dispatch("over", "out", "click");
      const geojsonComponent = component().prop("dataKeyName").dataKeyName(GEO_KEY_DEFAULT).prop("geoJsonKeyName").geoJsonKeyName("id").prop("geoJson").prop("mapPath").prop("defined", functor).defined(true).prop("fill", functor).fill("black").prop("stroke", functor).stroke("black").prop("strokeWidth", functor).strokeWidth(1.25).prop("transitionColor").transitionColor(true).render(function (data) {
        const selection = d3.select(this);
        const props = selection.props();
        // render the missing value pattern, under an id of this layer's own
        const patternId = missingPatternId(selection);
        ensureDefsElement(selection, "pattern", patternId).call(mapMissingValuePattern);
        // getDataKeyName will be called on data values. It should return a map entity id.
        // getMapKeyName will be called on the 'properties' of each map feature. It should
        // return a map entity id. Data values are matched with corresponding map features using
        // these entity ids.
        const getDataKeyName = prop(props.dataKeyName);
        // A prototype-less table, so a feature keyed after an Object.prototype member - "valueOf",
        // say - cannot resolve to the inherited function, and so that the caller's data are never
        // written to.
        const groupedInputData = Object.create(null);
        for (const datum of data) {
          // A datum with no key is skipped rather than filed under the string "undefined", where it
          // would have become the datum for every feature that also lacks a key.
          const key = getDataKeyName(datum);
          if (key === undefined) continue;
          groupedInputData[toLookupKey(key)] = datum;
        }
        const mergedData = props.geoJson.features.map(feature => {
          const key = readFeatureKey(feature.properties, props.geoJsonKeyName);
          return {
            geoJson: feature,
            datum: key === undefined ? undefined : groupedInputData[toLookupKey(key)]
          };
        });
        function getMapFill(d) {
          return defined(d.datum) && props.defined(d.datum) ? props.fill(d.datum) : "url(#".concat(patternId, ")");
        }
        function getMapStroke(d) {
          return defined(d.datum) && props.defined(d.datum) ? props.stroke(d.datum) : "";
        }
        // Guarded like fill and stroke: an unmatched feature is not asked for a stroke width, and
        // returning null removes the attribute rather than handing the accessor undefined.
        function getMapStrokeWidth(d) {
          return defined(d.datum) && props.defined(d.datum) ? props.strokeWidth(d.datum) : null;
        }
        const geoElements = selection.selectAll(".sszvis-map__geojsonelement").data(mergedData).join("path").classed("sszvis-map__geojsonelement", true).attr("data-event-target", "");
        geoElements.classed("sszvis-map__geojsonelement--undefined", d => !defined(d.datum) || !props.defined(d.datum)).attr("d", d => props.mapPath(d.geoJson));
        // The fill is applied exactly once, so the transition has the previous color to interpolate
        // from, and only a color-to-color change is tweened - a paint-server reference cannot be
        // interpolated. Both rules are the base renderer's; see src/map/renderer/base.ts.
        if (props.transitionColor) {
          const tweenable = function (d) {
            return !isPaintServer(getMapFill(d)) && !isPaintServer(this.getAttribute("fill"));
          };
          geoElements.filter(tweenable).transition().call(slowTransition).attr("fill", getMapFill);
          geoElements.filter(function (d) {
            return !tweenable.call(this, d);
          }).attr("fill", getMapFill);
        } else {
          geoElements.attr("fill", getMapFill);
        }
        geoElements.attr("stroke", getMapStroke).attr("stroke-width", getMapStrokeWidth);
        // d3 v6 and later call a listener with (event, datum), and the datum here is the merged
        // { geoJson, datum } wrapper - the handler is given the entity's own datum.
        geoElements.on("mouseover", function (_pointerEvent, d) {
          event.call("over", this, d.datum);
        }).on("mouseout", function (_pointerEvent, d) {
          event.call("out", this, d.datum);
        }).on("click", function (_pointerEvent, d) {
          event.call("click", this, d.datum);
        });
        // the tooltip anchor generator
        const ta = tooltipAnchor().position(d => {
          // A feature with the spec-legal `properties: null` reaches here now that the merge no
          // longer crashes on one, and the centroid cache needs somewhere to live.
          if (!d.geoJson.properties) d.geoJson.properties = {};
          const properties = d.geoJson.properties;
          let sphericalCentroid = properties.sphericalCentroid;
          if (!sphericalCentroid) {
            sphericalCentroid = d3.geoCentroid(d.geoJson);
            properties.sphericalCentroid = sphericalCentroid;
          }
          // d3's own typings expect the projection type as a type argument here.
          const point = props.mapPath.projection()(sphericalCentroid);
          // Only a hand-written projection can return null: d3's projections clip in the stream,
          // not in the point call, and return a pair - of NaN, for a degenerate centroid. A null is
          // passed on rather than replaced, as the JavaScript did: tooltipAnchor spreads it into
          // translateString and renders transform="translate(undefined,undefined)". Substituting a
          // NaN pair here would put a different attribute value in the DOM for the same input.
          return point;
        });
        const tooltipGroup = selection.selectGroup("tooltipAnchors").datum(mergedData);
        // attach tooltip anchors
        tooltipGroup.call(ta);
      });
      // The argument tuple is typed as src/behavior/panning.ts types its own on(): d3's dispatch.on
      // derives its callback type from a *literal* event name, so a plain string collapses the
      // callback to never. Narrowing to "over" | "out" | "click" would type the callback properly but
      // would also reject the namespaced typenames d3 accepts at runtime, such as "over.tooltip".
      geojsonComponent.on = function () {
        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }
        const value = event.on.apply(event, args);
        return value === event ? geojsonComponent : value;
      };
      return geojsonComponent;
    }

    /**
     * highlight renderer component
     *
     * @module sszvis/map/renderer/highlight
     *
     * @template T The type of the data values in the highlight array
     *
     * A component used internally for rendering the highlight layer of maps.
     * The highlight layer accepts an array of data values to highlight, and renders
     * The map entities associated with those data values using a special stroke. It is the per-entity
     * counterpart to the mesh renderer, which draws every border as one path with one shared style.
     *
     * @property {GeoJson} geoJson                        The GeoJson object to be rendered by this map layer. It must be a
     *                                                    feature collection: `features` is read unguarded, so a bare Feature
     *                                                    throws. Required only when the highlight array is non-empty, and
     *                                                    never validated, which is why the getter reports it as possibly
     *                                                    undefined.
     * @property {d3.geo.path} mapPath                    A path-generator used to create the path data string for each matched
     *                                                    feature. A d3.geoPath or a bare generator function is accepted; it is
     *                                                    called only with features that were actually matched.
     * @property {String} key                             Identifies this highlight layer within the group it renders into,
     *                                                    so several highlight layers can share one group. Default
     *                                                    'highlight'. Two layers in one group need distinct keys; two
     *                                                    renders of the same layer must share one, which is what makes the
     *                                                    render idempotent. Named to match the mesh and raster renderers'
     *                                                    key.
     * @property {String} keyName                         The data object key which will return a map entity id. Default 'geoId'.
     *                                                    A falsy keyName is used as given, unlike prepareMergedGeoData, which
     *                                                    falls back to the default - so an empty keyName reads datum[""],
     *                                                    which is undefined, and therefore matches nothing.
     * @property {Array} highlight                        An array of data elements to highlight. The corresponding map entities
     *                                                    are highlighted. Falsy entries are dropped. Default [].
     * @property {String, Function} highlightStroke       A colour, or an accessor called with the highlighted datum only.
     *                                                    Default white. Returning null removes the inline style, leaving SVG's
     *                                                    initial stroke of 'none' - an invisible highlight, with no error.
     * @property {Number, Function} highlightStrokeWidth  A width, or an accessor called with the highlighted datum only.
     *                                                    Default 2. Returning null removes the inline style, leaving SVG's
     *                                                    initial width of 1.
     *
     * Note: an entity id that matches no feature is dropped from the join and reported through
     * sszvis.logger.warn once per render, naming every unmatched id. It is a warning rather than a throw
     * because a highlight normally tracks a transient hover or selection, and an id can legitimately
     * go stale between two renders - crashing a chart mid-interaction would be worse than the missing
     * highlight. Nothing is appended for an unmatched id, so the renderer no longer leaves a classed,
     * fully styled path with no geometry behind.
     *
     * Note: the feature lookup keys on feature.id, which GeoJSON does not require, and goes through a
     * Map. Ids are still stringified on both sides - a numeric feature id is matched by either a
     * numeric or a string data key, which is load-bearing because SSZ geodata uses numeric ids - but
     * only keys actually put into the Map can be found: a feature without an id is left out of the
     * lookup, a datum with no entity id matches nothing, and an id naming an Object.prototype member
     * ("valueOf", "toString", "__proto__", ...) is unmatched like any other absent id. A symbol stays a
     * symbol key, so it can never be matched by a string id.
     *
     * Note: neither geoJson nor mapPath is validated, and once there is something to highlight both
     * are required. A missing geoJson throws while the lookup table is built, before the join runs, so
     * nothing is appended; a missing mapPath throws from inside the "d" callback, after the join has
     * appended the element, so it leaves a classed path behind - with no geometry, and no inline stroke
     * styles either, since the throw happens in the "d" callback before either .style() call is
     * reached. The empty
     * highlight case returns early before either is touched, and is the one configuration that
     * tolerates having neither.
     *
     * Note: highlight is tested as `.length === 0`, so a non-array without a length - a single datum
     * passed by mistake - skips the early return and then throws a bare TypeError from .reduce. A
     * string has a length, so "" clears the layer while any other string throws. An array of only falsy entries is the second,
     * distinct way to clear the layer: it merges to nothing and the exit selection removes the paths,
     * but unlike the early return it still reads geoJson, to build the lookup table. mapPath is not
     * read: the join has no elements, so d3 never invokes the "d" callback.
     *
     * Note: nothing deduplicates the highlight array, so highlighting one entity twice draws two
     * stacked paths - harmless while the stroke is opaque, visible with a translucent one.
     *
     * Note: both style properties are wrapped in fn.functor and called by the component itself rather
     * than handed to d3, unlike the mesh renderer's. An accessor therefore receives exactly one
     * argument, the datum, with no index and no node group - and, because the call is written as a
     * method access on props, an accessor expecting d3's node as `this` gets the component's internal
     * props object instead. An accessor returning null removes the style, so a null colour leaves the
     * highlight with SVG's initial stroke of `none` - invisible, with no error - and a null width
     * leaves it at the initial width of 1.
     *
     * Note: both properties are written as inline styles rather than attributes. Nothing in sszvis.css
     * sets stroke or stroke-width for .sszvis-map__highlight, so nothing is being overridden - but a
     * consumer cannot restyle a highlight from their own stylesheet either, since an inline style
     * beats any author rule short of !important.
     *
     * Note: the component sets neither fill nor pointer-events; both come from sszvis.css. Rendered
     * without that stylesheet, a highlight is a filled black shape covering the entity, and it
     * swallows the base layer's hover and click events - which matters more here than for the mesh,
     * since a highlight is normally driven by exactly that hover.
     *
     * Note: the paths are scoped by key and the join is keyed by map entity. Each layer selects
     * only paths carrying its own data-highlight-key, so two highlight layers rendered into one group
     * coexist as long as they are given different keys - sharing the default key still means
     * sharing one set of paths, which is what makes an ordinary layer idempotent across renders even
     * though consumers build a fresh component every time. The keyed join means an element stays with
     * its entity when the array shrinks or is reordered, so per-entity transitions and enter/exit
     * styling are now possible. One entity highlighted twice still draws two paths: the join key
     * carries an occurrence counter.
     *
     * Note: the empty-highlight branch used to return a decorative `true`. Nothing consumed it -
     * d3's selection.each ignores the render callback's return value - so the port returns nothing.
     *
     * Note: no transition is scheduled, so a highlight appears and disappears instantly. Unlike the
     * base and geojson renderers this component keeps no caches, emits no missing-value pattern, and
     * adds no tooltip anchors or event targets, so none of that family of quirks applies here.
     * See test/map/renderer/highlight.test.ts.
     *
     * @return {sszvis.component}
     */
    /** The default key, so that a lone highlight layer needs no configuration. */
    const DEFAULT_KEY$2 = "highlight";
    /**
     * Marks the paths a highlight layer owns, so a second layer in the same group draws its own rather
     * than rebinding these. Read back through d3's filter rather than an attribute selector, which
     * would have to escape an arbitrary caller-supplied key. The same convention as the mesh
     * renderer's data-mesh-key and the raster renderer's data-raster-key.
     */
    const KEY_ATTRIBUTE$4 = "data-highlight-key";
    /**
     * Reads the entity id off a datum. Reflect.get is a property access, so it walks the prototype
     * chain and reads a falsy keyName as given, exactly as the JavaScript's datum[keyName] did. Only
     * truthy data reach this, and Object() boxes a primitive one rather than rejecting it, which is
     * what datum[keyName] did for a datum that is not an object.
     */
    function readEntityKey(datum, keyName) {
      return Reflect.get(toObject(datum), keyName);
    }
    /** Object as a boxing function, named so the boxing is explicit rather than an implicit any. */
    const toObject = Object;
    /**
     * Reports the highlight ids no map entity answers to: once per render, with every unmatched id,
     * rather than once per entry. A warning rather than a throw, because a highlight normally tracks a
     * transient hover or selection - throwing would take a whole chart down mid-interaction over an id
     * that may simply have gone stale between two renders.
     *
     * Goes through sszvis.logger rather than console directly, like every other diagnostic in the
     * library, so warnings stay identifiable as sszvis's and can be silenced in one place.
     */
    function warnUnmatched(unmatchedIds, keyName) {
      if (unmatchedIds.length === 0) return;
      const ids = unmatchedIds.map(id => String(id)).join(", ");
      warn("[mapRendererHighlight] no map entity has the ".concat(keyName, " ").concat(ids, "; nothing was highlighted for it. Check that the highlight ids match the geoJson feature ids, including their format (\"01\" and \"1\" are different entities)."));
    }
    function mapRendererHighlight() {
      return component().prop("keyName").keyName(GEO_KEY_DEFAULT) // the name of the data key that identifies which map entity it belongs to
      .prop("key").key(DEFAULT_KEY$2) // scopes this layer's paths, so several can share one group
      .prop("geoJson").prop("mapPath").prop("highlight").highlight([]) // an array of data values to highlight
      .prop("highlightStroke", functor).highlightStroke("white") // a function for highlighted entity stroke colors (default: white)
      .prop("highlightStrokeWidth", functor).highlightStrokeWidth(2).render(function () {
        const selection = d3.select(this);
        const props = selection.props();
        // Scoped to this layer, so a second highlight layer in the same group draws its own paths
        // instead of rebinding these.
        const highlightBorders = selection.selectAll(".sszvis-map__highlight").filter(function () {
          return this.getAttribute(KEY_ATTRIBUTE$4) === props.key;
        });
        if (props.highlight.length === 0) {
          highlightBorders.remove();
          // The JavaScript returned a decorative `true` here ("no highlight, no worry"); d3's
          // selection.each ignores whatever the render callback returns, so nothing consumed it.
          return;
        }
        const groupedMapData = props.geoJson.features.reduce((m, feature) => {
          // A feature without an id names no entity, so it is not addressable: keying it would
          // collapse every such feature onto the single key "undefined" and let a datum with no
          // entity id match the last of them.
          if (feature.id != null) {
            m.set(toLookupKey(feature.id), feature);
          }
          return m;
        }, new Map());
        // merge the highlight data, collecting the ids no map entity answers to
        const unmatchedIds = [];
        const occurrences = new Map();
        const mergedHighlight = props.highlight.reduce((m, v) => {
          if (v) {
            const entityId = readEntityKey(v, props.keyName);
            const feature = entityId == null ? undefined : groupedMapData.get(toLookupKey(entityId));
            if (feature === undefined) {
              unmatchedIds.push(entityId);
            } else {
              var _occurrences$get;
              const entityKey = String(toLookupKey(entityId));
              const occurrence = (_occurrences$get = occurrences.get(entityKey)) !== null && _occurrences$get !== void 0 ? _occurrences$get : 0;
              occurrences.set(entityKey, occurrence + 1);
              m.push({
                geoJson: feature,
                datum: v,
                joinKey: "".concat(entityKey, "#").concat(occurrence)
              });
            }
          }
          return m;
        }, []);
        warnUnmatched(unmatchedIds, props.keyName);
        highlightBorders
        // Keyed by map entity, so an element stays with its entity when the highlight array
        // shrinks or is reordered rather than being re-purposed by position.
        .data(mergedHighlight, d => d.joinKey).join("path").classed("sszvis-map__highlight", true).attr(KEY_ATTRIBUTE$4, props.key).attr("d", d => props.mapPath(d.geoJson)).style("stroke", d => props.highlightStroke(d.datum)).style("stroke-width", d => props.highlightStrokeWidth(d.datum));
      });
    }

    /**
     * image render component
     *
     * @module  sszvis/map/renderer/image
     *
     * Used for rendering an image layer, usually as a complement to a map. This is used in examples
     * for the topographic layer. It could also be used in other contexts, but the map usage is
     * the most straightforward.
     *
     * @property {Function} projection      The map projection function used to position the image in pixels. Uses the upper left
     *                                      and lower right corners of the image as geographical place markers to align with other map layers.
     *                                      It is called once per corner, with that corner's coordinates. A corner it answers
     *                                      null or undefined for is reported, naming the corner.
     * @property {String, Function} src      The source of the image you want to use. This should be either a URL for an image hosted on the same
     *                                      server that hosts the page, or a base64-encoded dataURL. For example, the zurich topolayer map module.
     *                                      Required: a missing src is reported rather than rendering an image with none.
     * @property {Array} geoBounds          This should be a 2D array containing the upper-left (north-west) and lower-right (south-east)
     *                                      coordinates of the corresponding corners of the image. The structure expected is:
     *
     *                                      [[nw-longitude, nw-latitude], [se-longitude, se-latitude]]
     *
     *                                      This is consistent with the way D3 handles similar geographic data. These coordinates are used to represent
     *                                      the edge of the image being used, and to align the image with other map layers (using the projection function).
     *                                      Note: it is possible that even with precise corner coordinates, some mismatch may still occur. This
     *                                      will happen if the image itself is generated using a different type of map projection than the one used by the
     *                                      projection function. SSZVIS uses a Mercator projection by default, but others from d3.geo can be used if desired.
     *                                      Required, and the order matters: corners the wrong way round project to a
     *                                      negative width or height, which is reported rather than silently dropped.
     * @property {Number, Function} opacity  The opacity of the resulting image layer. This will be applied to the entire image, and is sometimes useful when layering.
     *                                      Default 1. An invalid value is dropped by the CSS parser rather than reported,
     *                                      leaving the image fully opaque; 0 renders nothing at all, which is
     *                                      indistinguishable from a src that failed to load.
     * @property {String, Function} alt      The alternative text describing the image. Defaults to the
     *                                      empty string, which marks the layer decorative so that
     *                                      screen readers skip it - the right default for a
     *                                      topographic or raster backdrop whose data lives in the svg
     *                                      layers above. Pass a description when the image itself
     *                                      carries information.
     *
     * Note: this component renders an HTML img element, so it belongs in a createHtmlLayer. Nothing
     * enforces that: called on an SVG selection it appends an SVG-namespaced img, which no browser
     * renders, without complaining.
     *
     * Note: the component writes position: absolute, display: block and pointer-events: none inline, so
     * the offsets it computes are never inert and the image never swallows the hover and click events of
     * the map layers beneath it. sszvis.css sets the same three declarations for the class, plus
     * user-select: none, which is left to the stylesheet: it only affects text selection over a
     * decorative image, not whether the renderer works. So the component no longer needs sszvis.css to
     * position itself. Being inline styles they beat any author rule short of !important, so a consumer
     * who wants the image in the document flow or clickable can no longer get there through their own
     * stylesheet.
     *
     * Note: the projected coordinates are written unshifted, and createHtmlLayer positions the layer
     * itself by the bounds padding - so the image's offset is relative to the layer and the padding is
     * applied exactly once. That is what keeps the image aligned with the svg layer.
     *
     * Note: both corners are rounded before the size is taken as their difference, so left + width is
     * the rounded south-east corner and the image's edges land on the same pixels as the map layers it
     * is aligned with.
     *
     * Note: projection, src and geoBounds are all required and are validated before any element is
     * created, so each way of getting them wrong is reported with a message naming the property, and a
     * misconfigured renderer leaves nothing half-built in the layer. Inverted geoBounds - the likely
     * real-world mistake - are caught by comparing the projected corners before they are rounded, so
     * an inversion smaller than one pixel is reported rather than collapsing to a zero-size image.
     *
     * Note: a projection that answers a non-finite coordinate is still not reported; it produces the
     * string "Infinitypx", which the CSS parser drops, leaving the image unpositioned. Not reachable
     * with a d3 projection called this way: clipAngle and clipExtent apply to streams, not to a direct
     * call.
     *
     * Note: a Mercator pole, which is reachable, fails a third way again - log(tan(pi/2)) is merely a
     * very large float, so a geoBounds latitude of 90 positions and sizes the image tens of thousands
     * of pixels off rather than failing - the extent stays positive, so the geoBounds check does not
     * catch it either.
     *
     * Note: neither src nor opacity is wrapped in fn.functor, unlike the colour properties of the base,
     * geojson and highlight renderers - but an accessor works all the same, called with the join's
     * placeholder datum 0. opacity is handed to d3, which evaluates it; src is resolved by the
     * component itself, because the resolved value identifies the element.
     *
     * Note: the src identifies the image within its layer, so two renderers with different sources
     * each own an element and stack, while re-rendering the same source reuses the element it drew
     * before. The element carries the resolved source in a data-image-key attribute for that purpose:
     * the same key convention as the mesh, raster and highlight renderers, except that this renderer
     * derives its key from the src rather than taking one as a property.
     *
     * Note: no transition is scheduled, so the image jumps to its new position on a resize rather than
     * animating. Unlike the base and geojson renderers this component keeps no caches, emits no
     * missing-value pattern, and adds no tooltip anchors or event targets, so none of that family of
     * quirks applies here. The same img element is reused across renders, with every attribute and
     * style reapplied each time.
     * See test/map/renderer/image.test.ts.
     *
     * @return {sszvis.component}
     */
    /**
     * Marks the image a renderer owns, keyed by its resolved src, so the join can find its own
     * element. Read back through d3's filter rather than an attribute selector, which would have to
     * escape an arbitrary src - the same idiom as the mesh renderer's data-mesh-key, whose key is a
     * property rather than being derived.
     */
    const KEY_ATTRIBUTE$3 = "data-image-key";
    /**
     * Resolves a property that may be a constant or an accessor. d3 would evaluate an accessor against
     * the bound datum; this calls it the same way, with the join's placeholder datum 0, so that the
     * resolved value is available before the join needs it.
     */
    function resolve(value) {
      return typeof value === "function" ? value.call(null, 0, 0, []) : value;
    }
    /** Reports a required property the caller left unset, naming it. */
    function required(value, name) {
      if (value === undefined) {
        throw new Error("[mapRendererImage] the ".concat(name, " property is required"));
      }
      return value;
    }
    /**
     * Projects one corner of the image, reporting a projection that cannot place it rather than
     * throwing a bare TypeError from indexing null.
     */
    function corner(projection, geoBounds, which) {
      const projected = projection(geoBounds[which]);
      if (projected == null) {
        const name = which === 0 ? "north-west" : "south-east";
        throw new Error("[mapRendererImage] the projection could not place the ".concat(name, " corner of geoBounds"));
      }
      return projected;
    }
    function mapRendererImage() {
      return component().prop("projection").prop("src").prop("geoBounds").prop("opacity").prop("alt").opacity(1).alt("").render(function () {
        const selection = d3.select(this);
        const props = selection.props();
        // Everything the render depends on is validated before any element is created, so a
        // misconfigured renderer leaves nothing half-built behind in the layer.
        const projection = required(props.projection, "projection");
        const src = required(props.src, "src");
        const geoBounds = required(props.geoBounds, "geoBounds");
        const topLeft = corner(projection, geoBounds, 0);
        const bottomRight = corner(projection, geoBounds, 1);
        // Corners the wrong way round are the mistake the docs examples guard against with an
        // "Expects longitude, latitude" comment. Tested on the unrounded projection, because two
        // corners inverted by less than a pixel round to the same coordinate: a rounded extent of
        // zero would render an invisible image rather than report the mistake.
        if (bottomRight[0] < topLeft[0] || bottomRight[1] < topLeft[1]) {
          throw new Error("[mapRendererImage] the geoBounds property expects the north-west corner first; the corners given project to a negative width or height");
        }
        // Rounded only after the check, so left + width stays the rounded south-east corner and the
        // edges land on the same pixels as the map layers this is aligned with. The CSS parser drops
        // a negative length, which is what the check above keeps out of here.
        const width = Math.round(bottomRight[0]) - Math.round(topLeft[0]);
        const height = Math.round(bottomRight[1]) - Math.round(topLeft[1]);
        // The src identifies the image within its layer, so two renderers with different sources get
        // an element each instead of the second rebinding the first, while re-rendering the same
        // source keeps reusing the element it drew before. Filtering rather than building a selector
        // avoids having to escape a src into an attribute selector.
        const srcValue = resolve(src);
        const image = selection.selectAll(".sszvis-map__image").filter(function () {
          return this.getAttribute(KEY_ATTRIBUTE$3) === srcValue;
        }).data([0]).join("img").classed("sszvis-map__image", true).attr(KEY_ATTRIBUTE$3, srcValue);
        image.attr("src", srcValue).attr("alt", valueFn(props.alt))
        // The positioning and event behaviour the component depends on, written inline so it does
        // not need sszvis.css: absolute makes the offsets below apply at all, block keeps an inline
        // image from picking up baseline leading, and none lets the map layers underneath be
        // hovered through it.
        .style("position", "absolute").style("display", "block").style("pointer-events", "none").style("left", "".concat(Math.round(topLeft[0]), "px")).style("top", "".concat(Math.round(topLeft[1]), "px"))
        // Each corner is rounded before the subtraction, so the right and bottom edges land on the
        // same pixels as the projected south-east corner rather than a pixel either side of it.
        .style("width", "".concat(width, "px")).style("height", "".concat(height, "px")).style("opacity", valueFn(props.opacity));
      });
    }

    /**
     * mesh renderer component
     *
     * @module sszvis/map/renderer/mesh
     *
     * A component used internally for rendering the borders of all map entities as a single mesh.
     * This component expects a GeoJson object which is a single polyline for the entire mesh of all borders.
     * All borders will therefore be rendered as one continuous object, which is faster, more memory-efficient,
     * and prevents overlapping borders from creating strange rendering effects. The downside is that the entire
     * line must have a single set of styles which all borders share. To highlight individual borders, use the highlight renderer.
     *
     * @property {GeoJson} geoJson                        The GeoJson object to be rendered by this map layer.
     *                                                    Required: omitting it throws a TypeError, which is why the
     *                                                    getter reports it as possibly undefined.
     * @property {d3.geo.path} mapPath                    A path-generator function used to create the path data string of the provided GeoJson.
     *                                                    Required: omitting it throws a TypeError too.
     * @property {string} key                             Identifies this mesh within its layer. Default "border". Two
     *                                                    meshes in one group need distinct keys to coexist; two sharing a
     *                                                    key share one path, the last render winning.
     * @property {string, function} borderColor           The color of the border path stroke. Default is white
     * @property {number, function} strokeWidth           The width of the border path stroke. Default is 1.25.
     *                                                    An invalid value is dropped by the CSS parser rather than
     *                                                    reported, leaving SVG's initial width of 1.
     *
     * Note: both geoJson and mapPath are required, and omitting either throws a TypeError naming it.
     * The guard runs before the join, so nothing is appended. This replaces the earlier behaviour, in
     * which either omission left a classed, styled path with no geometry - invisible, silent, and
     * indistinguishable from having had no borders to draw.
     *
     * Note: an accessor passed for borderColor or strokeWidth is called with the mesh object and d3's
     * index, not with a per-entity datum - there is only one path, so there is no such datum. An
     * accessor written against a datum, the way every other map renderer's colour accessor is written,
     * therefore resolves to undefined. A null or undefined result is read as "keep the default" rather
     * than passed to d3, which would have removed the style and left the borders invisible with no
     * error. The lake overlay's lakePathColor still has the unguarded shape.
     *
     * Note: both properties are written as inline styles rather than attributes. Nothing in sszvis.css
     * sets stroke or stroke-width for .sszvis-map__border, so nothing is being overridden - but a
     * consumer cannot restyle a mesh border from their own stylesheet either, since an inline style
     * beats any author rule short of !important.
     *
     * Note: the component sets neither fill nor pointer-events; both come from sszvis.css. Rendered
     * without that stylesheet, the mesh is a filled black shape covering the map, and it swallows the
     * base layer's hover and click events rather than letting them through.
     *
     * Note: the border path is scoped to the rendering group's own children and identified by the key
     * property, so a mesh only ever rebinds the path it drew itself. Two meshes in one group therefore
     * coexist as long as they have distinct keys - administrative boundaries and lake outlines, say.
     * Two meshes sharing a key are still one path, which is what makes a re-render reuse its element,
     * so the constraint is one mesh per key per layer rather than one mesh per layer.
     *
     * Note: unlike the base and geojson renderers this component schedules no transition, keeps no
     * caches, emits no missing-value pattern, and adds no tooltip anchors or event targets - so none
     * of that family of quirks applies here. The path data is reapplied on every render rather than
     * only on enter, so a geoJson mutated in place still repaints.
     * See test/map/renderer/mesh.test.ts.
     *
     * @return {sszvis.component}
     */
    /**
     * Marks the path a mesh owns, so a second mesh in the same group draws its own rather than
     * rebinding this one. Read back through d3's filter rather than an attribute selector, which
     * would have to escape an arbitrary caller-supplied key.
     */
    const KEY_ATTRIBUTE$2 = "data-mesh-key";
    /** The defaults, named here because they are also the fallback for an accessor that resolves to nothing. */
    const DEFAULT_KEY$1 = "border";
    const DEFAULT_BORDER_COLOR = "white";
    const DEFAULT_STROKE_WIDTH = 1.25;
    /**
     * Resolves a style prop, substituting the component's default for a null or undefined result. d3
     * would remove the style for either, and since sszvis.css sets no stroke for .sszvis-map__border,
     * SVG's initial value `none` would then apply - invisible borders, with no error. That is the
     * outcome of an accessor written against a datum, the way every other map renderer's colour
     * accessor is written, so the default stands instead.
     */
    function withDefault(value, fallback) {
      return function (datum, index, groups) {
        const resolved = valueFn(value).call(this, datum, index, groups);
        return resolved !== null && resolved !== void 0 ? resolved : fallback;
      };
    }
    function mapRendererMesh() {
      return component().prop("geoJson").prop("mapPath").prop("key").key(DEFAULT_KEY$1).prop("borderColor").borderColor(DEFAULT_BORDER_COLOR) // A function or string for the color of all borders. Note: all borders have the same color
      .prop("strokeWidth").strokeWidth(DEFAULT_STROKE_WIDTH).render(function () {
        const selection = d3.select(this);
        const props = selection.props();
        // Validate before the join, so a missing property is reported rather than leaving a
        // classed, styled path with no geometry behind - invisible, and indistinguishable from
        // having had no borders to draw.
        const {
          geoJson,
          mapPath
        } = props;
        if (geoJson === undefined) {
          throw new TypeError("map/renderer/mesh: geoJson is required, since it carries the border geometry to render");
        }
        if (mapPath === undefined) {
          throw new TypeError("map/renderer/mesh: mapPath is required, since it turns the geoJson into path data");
        }
        // add the map borders. These are rendered as one single path element, the one carrying this
        // mesh's key: the selector is scoped to this group's own children so a nested mesh is left
        // alone, and the key filter is what lets two meshes share a group.
        const meshLine = selection.selectAll(":scope > path.sszvis-map__border").filter(function () {
          return this.getAttribute(KEY_ATTRIBUTE$2) === props.key;
        }).data([geoJson]).join("path").classed("sszvis-map__border", true).attr(KEY_ATTRIBUTE$2, props.key);
        meshLine.attr("d", mapPath).style("stroke", withDefault(props.borderColor, DEFAULT_BORDER_COLOR)).style("stroke-width", withDefault(props.strokeWidth, DEFAULT_STROKE_WIDTH));
      });
    }

    /**
     * patternedlakeoverlay component
     *
     * @module sszvis/map/renderer/patternedlakeoverlay
     *
     * A component used internally for rendering Lake Zurich, and the borders of map entities which
     * lie above Lake Zurich.
     *
     * @property {d3.geo.path} mapPath      A path-generator function used to create the path data string of the provided GeoJson.
     *                                      It is handed straight to d3 as the attribute callback, so it is called with the
     *                                      geoJson, d3's index and the group; a d3.geoPath returns null for an undefined
     *                                      feature. Never validated; see the note below.
     * @property {GeoJson} lakeFeature      A GeoJson object which provides data for the outline shape of Lake Zurich. This shape will
     *                                      be filled with a special texture fill and masked with an alpha gradient fade.
     *                                      Never validated, which is why the getter reports it as possibly undefined; see
     *                                      the note below.
     * @property {GeoJson} lakeBounds       A GeoJson object which provides data for the shape of map entity borders which lie over the
     *                                      lake. These borders will be drawn over the lake shape, as grey dotted lines.
     *                                      Never validated, like lakeFeature.
     * @property {String, Function} lakePathColor  The stroke colour of those borders. No default: the stylesheet's grey
     *                                      dotted stroke stands unless this is set. A falsy colour - "" - clears the
     *                                      inline stroke again. Not wrapped in fn.functor.
     * @property {Boolean} fadeOut          Whether to fade the lake out towards the bottom of the shape with a gradient mask.
     *                                      Default true - but choropleth defaults its own lakeFadeOut to false, so the
     *                                      default branch is the one no in-repo chart takes. Turning it off removes an
     *                                      existing fade again.
     * @property {String} key               Optional scope for this overlay's definitions and paths, so that two overlays
     *                                      drawn into one group each own their elements. Defaults to one scope per group,
     *                                      generated on first render and remembered on the group as
     *                                      data-lake-key - so re-rendering, even with a freshly constructed
     *                                      component, reuses the same elements, while a second map on the page gets its
     *                                      own. A caller-supplied key must be unique within the document, must start
     *                                      with a letter and may use only letters, digits, hyphens and underscores -
     *                                      it is written into the definition ids, so a url(#...) reference has to be
     *                                      able to name it. Anything else throws. The leading letter also keeps caller
     *                                      keys apart from the generated scopes, which are bare decimals.
     *
     * Note: the definition ids are scoped - "lake-pattern-1", "lake-fade-gradient-1", "lake-fade-mask-1"
     * and so on - so two maps on one page no longer define the same id twice. Consumers must not rely on
     * the previously fixed ids.
     *
     * Note: the pattern helpers in src/patterns.ts append their contents rather than joining them, so
     * this component may only call them on a definition that is still empty; otherwise the tile would
     * gain another rect and two lines, the gradient another two stops and the mask another rect on every
     * redraw. The narrower fix would be to make the helpers idempotent, which would cover the base and
     * geojson renderers' "missing-pattern" too.
     *
     * Note: the mask fades the lake by filling itself with the fade gradient, so the two definitions are
     * only useful together. Both helpers hard-code the old fixed gradient id, so this component rewrites
     * the gradient's id and the mask rect's fill after calling them.
     *
     * Note: the defs element is created inside the map group rather than at the svg root, and
     * ensureDefsElement selects it with an unscoped descendant selector - so this component shares one
     * defs with the base renderer's missing value pattern when both draw into the same group.
     *
     * Note: neither geoJson property is validated. Omitting either leaves a classed, pattern-filled
     * path with no geometry - invisible, silent, and indistinguishable from having no lake to draw. A
     * missing property reaches the path generator as undefined, which returns null; a missing mapPath
     * has d3 remove the attribute without calling anything. The same root defect as the mesh renderer.
     *
     * Note: lakePathColor is not wrapped in fn.functor, unlike the colour properties of the base,
     * geojson and highlight renderers. An accessor is handed straight to d3 and called with the
     * lakeBounds object and d3's index, not with a per-border datum - there is only one path, so there
     * is no such datum. It is written as an inline style, which does override the stylesheet's stroke
     * for .sszvis-map__lakepath - and cannot be overridden back from a consumer's stylesheet, since an
     * inline style beats any author rule short of !important. The mesh's borderColor has the same
     * shape - though where a dropped mesh style leaves the borders invisible, a dropped style here
     * falls back to the stylesheet's grey dotted stroke, so the mistake is even quieter.
     *
     * Note: the colour is written on every render, and only an unset property leaves the stylesheet's
     * stroke alone. A falsy colour - "", or an accessor returning undefined - clears the inline stroke
     * and hands the border back to the stylesheet.
     *
     * Note: the component sets no pointer-events on either path and no fill on the border path, so
     * both come from sszvis.css. Rendered without that stylesheet the border path is a filled black
     * shape covering the lake - SVG's initial fill is black - and both paths swallow the base layer's
     * hover and click events.
     *
     * Note: both path selectors are scoped by the overlay's key, so two overlays rendered into one group
     * each draw their own pair of paths as long as they are given distinct keys.
     *
     * Note: unlike the base and geojson renderers this component schedules no transition, keeps no
     * caches, and does not mutate the geoJson it is handed, so the whole centroid-caching family of
     * quirks does not apply. It emits patterns, but not their missing-value one, and adds no tooltip
     * anchors and no event targets. The path data is reapplied on every render rather than only on
     * enter, so a geoJson mutated in place still repaints.
     * See test/map/renderer/patternedlakeoverlay.test.ts.
     *
     * @return {sszvis.component}
     */
    /**
     * Marks both the group whose generated scope it records and the paths belonging to a scope,
     * mirroring d3-selectgroup's data-d3-selectgroup. Read back through getAttribute in a filter
     * rather than matched with an attribute selector, so a caller-supplied key needs no CSS
     * escaping - the same idiom as mesh's data-mesh-key and raster's data-raster-key.
     */
    const KEY_ATTRIBUTE$1 = "data-lake-key";
    let generatedScopes = 0;
    /**
     * A caller-supplied key has to be spellable both as an id selector and as a url(#...) fragment,
     * because the scope is interpolated into the three definition ids and matched back by id. Letters,
     * digits, hyphens and underscores qualify; a leading letter is required, which is what keeps
     * caller keys disjoint from the generated scopes below.
     */
    const KEY_PATTERN = /^[A-Za-z][A-Za-z0-9_-]*$/;
    /**
     * Rejects a key that cannot be spelled in an id. Without this a key such as "a b" builds the valid
     * but unmatchable selector "pattern#lake-pattern-a b", so every render appends another definition
     * and the url(#...) reference is inert, while a quote makes the selector unparseable and throws
     * from inside ensureDefsElement. Both were silent or obscure; this names the property instead.
     */
    function requireSpellableKey(key) {
      if (!KEY_PATTERN.test(key)) {
        throw new Error("[mapRendererPatternedLakeOverlay] the key property must start with a letter and use only letters, digits, hyphens and underscores; got \"".concat(key, "\". The key is written into this overlay's definition ids, which a url(#...) reference has to be able to name."));
      }
      return key;
    }
    /**
     * The scope every definition id and both path selectors are qualified with. A caller-supplied key
     * wins; otherwise a scope is generated once per group and remembered on the group itself, so a
     * re-render - even from a freshly constructed component, which is how the docs examples are written
     * - reuses the same definitions and paths, while a second map on the page gets its own.
     *
     * Generated scopes are bare decimals and caller keys must begin with a letter, so the two can
     * never collide: without that, `.key("1")` on one map and the first unkeyed overlay on another
     * would share the scope "1" and so share document-global definition ids - the very cross-map
     * reference this scoping exists to prevent.
     */
    function overlayScope(group, key) {
      if (key !== undefined) return requireSpellableKey(key);
      const recorded = group.getAttribute(KEY_ATTRIBUTE$1);
      if (recorded !== null) return recorded;
      const generated = String(++generatedScopes);
      group.setAttribute(KEY_ATTRIBUTE$1, generated);
      return generated;
    }
    /**
     * Calls one of the pattern helpers, but only on a definition that is still empty. The helpers append
     * their contents rather than joining them, so calling them on every render would grow the definition
     * without bound. The id is rewritten afterwards because mapLakeFadeGradient writes its own fixed one.
     */
    function defineOnce(definition, elementId, define) {
      definition.filter(function () {
        return this.childElementCount === 0;
      }).call(define).attr("id", elementId);
      return definition;
    }
    function mapRendererPatternedLakeOverlay() {
      return component().prop("mapPath").prop("lakeFeature").prop("lakeBounds").prop("lakePathColor").prop("fadeOut").prop("key").fadeOut(true).render(function () {
        const selection = d3.select(this);
        const props = selection.props();
        const scope = overlayScope(this, props.key);
        const patternId = "lake-pattern-".concat(scope);
        const gradientId = "lake-fade-gradient-".concat(scope);
        const maskId = "lake-fade-mask-".concat(scope);
        // the lake texture
        defineOnce(ensureDefsElement(selection, "pattern", patternId), patternId, mapLakePattern);
        if (props.fadeOut) {
          // the fade gradient
          defineOnce(ensureDefsElement(selection, "linearGradient", gradientId), gradientId, mapLakeFadeGradient);
          // the mask, which uses the fade gradient. The helper hard-codes the old fixed gradient id,
          // so point its rect at this overlay's gradient instead.
          defineOnce(ensureDefsElement(selection, "mask", maskId), maskId, mapLakeGradientMask).selectAll("rect").attr("fill", "url(#".concat(gradientId, ")"));
        } else {
          // Turning the fade off must undo an existing one, not merely skip writing it.
          selection.selectAll("linearGradient#".concat(gradientId, ", mask#").concat(maskId)).remove();
        }
        // generate the Lake Zurich path
        const zurichSee = selection.selectAll(".sszvis-map__lakezurich").filter(function () {
          return this.getAttribute(KEY_ATTRIBUTE$1) === scope;
        }).data([props.lakeFeature]).join("path").classed("sszvis-map__lakezurich", true).attr(KEY_ATTRIBUTE$1, scope).attr("d", props.mapPath).attr("fill", "url(#".concat(patternId, ")"));
        // this mask applies the fade effect
        zurichSee.attr("mask", props.fadeOut ? "url(#".concat(maskId, ")") : null);
        // add a path for the boundaries of map entities which extend over the lake.
        // This path is rendered as a dotted line over the lake shape
        const lakePath = selection.selectAll(".sszvis-map__lakepath").filter(function () {
          return this.getAttribute(KEY_ATTRIBUTE$1) === scope;
        }).data([props.lakeBounds]).join("path").classed("sszvis-map__lakepath", true).attr(KEY_ATTRIBUTE$1, scope).attr("d", props.mapPath);
        // An unset colour writes nothing, so the stylesheet's stroke stands; any value that is set -
        // including a falsy one - is written, so it can clear a colour an earlier render left behind.
        if (props.lakePathColor === undefined) {
          lakePath.style("stroke", null);
        } else {
          lakePath.style("stroke", valueFn(props.lakePathColor));
        }
      });
    }

    /**
     * raster renderer component
     *
     * @module  sszvis/map/renderer/raster
     *
     * @template T The type of the data values bound to the raster cells
     *
     * Used for rendering a raster layer within a map (can also be used in other contexts, but the map usage
     * is the most straightforward). Requires a width and a height for the raster layer, a function which
     * returns raster positions, and one which returns fill colors.
     *
     * Unlike the other map renderers this one draws into a canvas inside an HTML layer, and it takes its
     * data from the layer's datum rather than from a property.
     *
     * @property {Boolean} debug         Whether to activate debug mode, which shows a red square over the whole
     *                                   canvas, for testing alignment with other map layers. Default false.
     * @property {Number} width          The width of the canvas, in CSS pixels. Required: a missing, non-finite
     *                                   or negative width throws. A fractional value is rounded up to whole
     *                                   pixels; see the notes below.
     * @property {Number} height         The height of the canvas. Required and validated like the width.
     * @property {Function} position     A function which takes a datum and returns a position for the corresponding
     *                                   raster square, returned as [x, y] pairs. Called with the datum only - no
     *                                   index, no array - unlike a d3 accessor, though the render callback itself
     *                                   does receive d3's (data, index, group). A null result throws and a
     *                                   non-finite one is silently dropped; see the notes below.
     * @property {Number} cellSide       The length (in pixels) of one side of each raster cell. Default 2. A
     *                                   fractional side antialiases; see the notes below.
     *                                   sszvis.pixelsFromGeoDistance is the intended source for this value, and it
     *                                   returns a float.
     * @property {String, Function} fill The fill function. Takes a datum and should return a fill color for the datum's pixel.
     *                                   Wrapped in fn.functor, so a constant colour is accepted too. It has no
     *                                   default. A value the canvas cannot parse leaves the cell unpainted; see
     *                                   the notes below.
     *                                   Typed as a colour string: fillStyle also takes a CanvasGradient or
     *                                   CanvasPattern at runtime, which this contract deliberately excludes.
     * @property {String} key          Identifies this raster within its layer. Default "raster". Two rasters in
     *                                   one layer need distinct keys to coexist; two sharing a key share one
     *                                   canvas, and since each render clears it, the last one wins.
     * @property {String} alt            An accessible description of what the raster shows. Default "", which
     *                                   marks the canvas decorative so assistive technology skips it
     *                                   deliberately. A non-empty value is written as an aria-label with
     *                                   role="img", and as the canvas's fallback content. Named to match the
     *                                   image renderer's alt, so the two non-SVG layers are labelled the same
     *                                   way, though on a canvas it is not an HTML attribute.
     * @property {Number} opacity        The opacity of the canvas. Default 1; use a lower value to reveal the
     *                                   layers underneath. It is a style on the canvas, so it
     *                                   fades the whole layer rather than the individual cells, and 0 still draws
     *                                   every one of them.
     *
     * Note: the bitmap is sized in device pixels - the width and height attributes are the layer
     * dimensions multiplied by devicePixelRatio, with the CSS size pinned to the layer dimensions and
     * the drawing context scaled to match - so the cells are as sharp as the SVG layers over them on a
     * high-DPI display. Positions, cell sides and the debug rectangle are all in CSS pixels, as before;
     * the scale factor costs one fill of ratio-squared as many device pixels per cell.
     *
     * Note: a fractional width or height is rounded up, since the bitmap is a whole number of pixels.
     * Every docs caller passes bounds.innerWidth, which is routinely fractional, so a raster layer
     * would otherwise be up to a pixel narrower and shorter than the SVG layers it has to line up with,
     * leaving a hairline gap at the right and bottom edges that shifts as the chart is resized. Rounding
     * up covers those edges instead, at the cost of up to a pixel of overhang.
     *
     * Note: the visible clearing between renders comes from writing the width attribute, which resets
     * the bitmap per spec; the clearRect call is belt and braces. Both dimensions are validated before
     * anything is drawn, so a missing one is reported instead of leaving the canvas at its intrinsic
     * 300x150 with a NaN clearRect that never cleared and each render's cells piling up. The same
     * canvas element is reused across renders, with the dimensions and opacity reapplied each time, and
     * a change of dimensions resizes that canvas rather than replacing it - which is what makes the
     * bitmap reset double as the clear.
     *
     * Note: fillStyle is stateful and the canvas API ignores a value it cannot parse, so a cell whose
     * fill does not parse would otherwise be drawn in whatever colour was last set - the previous
     * cell's colour, or the debug red. Each fill is therefore probed before it is used and a cell whose
     * fill does not parse is left unpainted, so a broken colour scale shows as holes in the raster
     * rather than as plausible data. Debug mode stays purely additive as a result.
     *
     * Note: no docs example can turn debug on - rastermap-gradient guards its debug(DEBUG) call with
     * `if (DEBUG)` on a hardcoded false, and the other three rastermaps never touch the property - so
     * the feature is exercised only by the tests.
     *
     * Note: the data are iterated without a guard, and createHtmlLayer binds 0 as its own datum - so a
     * layer the caller forgot to hand data to throws "data is not iterable" rather than rendering
     * nothing. Neither position nor fill is validated, and each throws a bare TypeError from
     * being called, naming neither property - but only for non-empty data, so an empty dataset hides
     * the misconfiguration entirely. The canvas has already been created by the time any of these
     * throw.
     *
     * Note: a non-finite position is dropped by the canvas API rather than reported, so a datum the
     * projection could not place leaves a hole in the raster with no indication; a null position throws
     * a TypeError instead, from the same point in the loop the JavaScript's index threw from. A zero cellSide draws nothing at all, and a negative one is
     * indistinguishable from its positive counterpart, since the half-side offset and the width negate
     * each other. A fractional cellSide puts the cell edges on half pixels, so they antialias rather
     * than tiling exactly - and pixelsFromGeoDistance returns a float.
     *
     * Note: the component writes no position, so the canvas is only positioned because sszvis.css sets
     * position: absolute on the class - the same dependency as the image renderer, along with
     * display: block, pointer-events: none and user-select: none. The opacity, by contrast, is written
     * as an inline style, as are the CSS width and height that pin the scaled bitmap to the layer size;
     * nothing in sszvis.css sets any of them, so nothing is overridden - but a consumer
     * cannot restyle it from their own stylesheet either. The positions themselves are written unshifted, and
     * createHtmlLayer offsets the layer by the bounds padding, so cell positions are layer-relative and
     * the padding is applied exactly once.
     *
     * Note: the canvas is scoped to the layer's own children and identified by the key prop, so two
     * rasters can coexist in one layer as long as their keys differ - the same convention as the mesh
     * renderer's key. Two rasters sharing a key share one canvas, which is what makes a re-render reuse
     * its element, so the constraint is one raster per key per layer rather than one per layer. The
     * canvas is appended to the layer, so it stacks over whatever the layer already holds, which is
     * what rastermap-bins relies on.
     *
     * Note: nothing ties this component to an HTML layer. Called on an SVG selection the join creates an
     * SVG-namespaced canvas, which has no getContext, so it throws - where the image renderer silently
     * appends an unrenderable img instead.
     *
     * Note: the canvas is labelled through the alt property. In the four docs rasters the raster IS the
     * data - the SVG layers over it are borders and annotations - so a description belongs on it; where
     * a raster really is decoration, the empty default hides it from assistive technology on purpose
     * rather than by accident. A canvas has no per-element markup a consumer could annotate instead,
     * which is why the property has to exist here.
     *
     * Note: no transition is scheduled - a canvas cannot be transitioned by d3 anyway - so the raster
     * repaints in full on every render, one fillStyle write and one fillRect per datum. Unlike the base
     * and geojson renderers this component keeps no caches, emits no missing-value pattern, and adds no
     * tooltip anchors or event targets, so none of that family of quirks applies here.
     * See test/map/renderer/raster.test.ts.
     *
     * @return {sszvis.component}
     */
    /**
     * Marks the canvas a raster owns, so a second raster in the same layer draws its own rather than
     * clearing and redrawing this one. Read back through d3's filter rather than an attribute selector,
     * which would have to escape an arbitrary caller-supplied key. The same convention as the mesh
     * renderer's data-mesh-key.
     */
    const KEY_ATTRIBUTE = "data-raster-key";
    /** The default key, so a caller who never asks for a second raster need not name the first. */
    const DEFAULT_KEY = "raster";
    /**
     * Reads one axis of a position. The JavaScript indexed the accessor's result directly, so a null
     * result threw from that index; this reproduces the same failure with the message V8 produced for
     * it. Note the strict null check: an accessor returning undefined falls through to the index on the
     * next line, which throws the genuine "Cannot read properties of undefined" TypeError, again as the
     * JavaScript did. A non-finite coordinate passes through untouched, since fillRect is what drops
     * it.
     */
    function coordinate(position, axis) {
      if (position === null) {
        throw new TypeError("Cannot read properties of null (reading '".concat(axis, "')"));
      }
      return position[axis];
    }
    /**
     * Reads the drawing context, throwing as the JavaScript did when there is none. That happens when
     * the join created an SVG-namespaced canvas, which has no getContext at all - the message is the
     * one that call produced. The check is for the method rather than `instanceof HTMLCanvasElement`,
     * which would also reject a canvas belonging to another realm - an iframe's document - where the
     * JavaScript drew quite happily.
     */
    function context2d(node) {
      if (node === null || !("getContext" in node) || typeof node.getContext !== "function") {
        throw new TypeError("canvas.node(...).getContext is not a function");
      }
      const ctx = node.getContext("2d");
      if (ctx === null) {
        // A 2d context is only refused when one of another kind was already taken on this element,
        // which cannot happen here; the JavaScript would have thrown on the next line instead.
        throw new TypeError("Cannot read properties of null (reading 'clearRect')");
      }
      return ctx;
    }
    /**
     * Whether the canvas can parse a fill value, established by assignment rather than by a colour
     * parser of our own: fillStyle keeps its previous value when the assignment fails, so probing from
     * two different starting colours tells a parsed value (which normalises to the same colour from
     * both) from an unparseable one (which leaves each probe in place). A non-string reaching here at
     * runtime fails the same way, which is the point.
     */
    function fillParses(ctx, value) {
      const before = ctx.fillStyle;
      ctx.fillStyle = "#000000";
      ctx.fillStyle = value;
      const fromBlack = ctx.fillStyle;
      ctx.fillStyle = "#ffffff";
      ctx.fillStyle = value;
      const fromWhite = ctx.fillStyle;
      ctx.fillStyle = before;
      return fromBlack === fromWhite;
    }
    /**
     * The device pixels per CSS pixel to render at. Read from the global rather than from the canvas's
     * own realm: an iframe reports its parent's ratio anyway, and a missing or nonsensical value (a
     * non-browser host, say) falls back to drawing one device pixel per CSS pixel.
     */
    function pixelRatio() {
      const ratio = globalThis.devicePixelRatio;
      return typeof ratio === "number" && ratio > 0 && Number.isFinite(ratio) ? ratio : 1;
    }
    /**
     * Reads a required dimension, reporting a missing or nonsensical one rather than letting the canvas
     * fall back to its intrinsic 300x150 size - which also stopped it clearing between renders, since
     * clearRect was then called with NaN.
     */
    function dimension(value, name) {
      if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
        throw new Error("[map/renderer/raster] ".concat(name, " is required, and must be a finite, non-negative number"));
      }
      return value;
    }
    function mapRendererRaster() {
      return component().prop("debug").debug(false).prop("width").prop("height").prop("position").prop("cellSide").cellSide(2).prop("fill", functor).prop("key").key(DEFAULT_KEY).prop("alt").alt("").prop("opacity").opacity(1).render(function (data) {
        const selection = d3.select(this);
        const props = selection.props();
        // The bitmap is a whole number of pixels, and every caller passes a bounds dimension, which
        // is routinely fractional - so round up, to cover the layers the raster has to line up with
        // rather than falling a hairline short of them at the right and bottom edges.
        const width = Math.ceil(dimension(props.width, "width"));
        const height = Math.ceil(dimension(props.height, "height"));
        const canvas = selection.selectAll(":scope > canvas.sszvis-map__rasterimage").filter(function () {
          return this.getAttribute(KEY_ATTRIBUTE) === props.key;
        }).data([0]).join("canvas").classed("sszvis-map__rasterimage", true).attr(KEY_ATTRIBUTE, props.key);
        // The bitmap is in device pixels while the element is laid out in CSS pixels, so the cells
        // are as sharp as the SVG layers over them on a high-DPI display.
        const ratio = pixelRatio();
        canvas.attr("width", Math.round(width * ratio)).attr("height", Math.round(height * ratio)).style("width", "".concat(width, "px")).style("height", "".concat(height, "px")).style("opacity", props.opacity);
        // An empty alt marks the layer decorative, so it is skipped deliberately rather than by
        // accident; a description is exposed both to assistive technology and as fallback content.
        const described = props.alt !== "";
        canvas.attr("role", described ? "img" : null).attr("aria-label", described ? props.alt : null).attr("aria-hidden", described ? null : "true").text(props.alt);
        const ctx = context2d(canvas.node());
        // Everything below draws in CSS pixels. setTransform rather than scale, because the
        // transform is absolute: scale would compound if the bitmap had not just been reset.
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        ctx.clearRect(0, 0, width, height);
        if (props.debug) {
          // Displays a rectangle that fills the canvas.
          // Useful for checking alignment with other render layers.
          ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
          ctx.fillRect(0, 0, width, height);
        }
        const halfSide = props.cellSide / 2;
        // A colour scale usually yields only a handful of distinct values, so parsing each one once
        // per render keeps the probe off the hot path.
        const parsed = new Map();
        for (const datum of data) {
          const position = props.position(datum);
          const x = coordinate(position, 0) - halfSide;
          const y = coordinate(position, 1) - halfSide;
          const fill = props.fill(datum);
          let parses = parsed.get(fill);
          if (parses === undefined) {
            parses = fillParses(ctx, fill);
            parsed.set(fill, parses);
          }
          if (!parses) continue;
          ctx.fillStyle = fill;
          ctx.fillRect(x, y, props.cellSide, props.cellSide);
        }
      });
    }

    /**
     * choropleth Map Component
     *
     * @module sszvis/maps/choropleth
     *
     * @template T The type of the data values matched onto the map features
     *
     * To use this component, pass data in the usual manner. Each data object is expected to have a value which
     * will be used to match that object with a particular map entity. The possible id values depend on the map type.
     * They are covered in more detail in the file sszvis/map/map-ids.txt. Which data key is used to fetch this value is configurable.
     * The default key is GEO_KEY_DEFAULT from src/map/index.js, which is 'geoId', but by changing the keyName
     * property of the map, you can pass data which use any key. The map component assumes that
     * datum[keyName] is a valid map ID which is matched with the available map entities.
     *
     * @property {Number} width                           The width of the map. Used to create the map projection function.
     *                                                    No default and unvalidated: leaving it out fits the projection to
     *                                                    undefined, so every area is drawn with NaN coordinates.
     * @property {Number} height                          The height of the map. Used to create the map projection function.
     *                                                    No default, and fails the same way as width.
     * @property {Object} features                        The feature collection of map entities, as a geojson FeatureCollection.
     *                                                    Required and unguarded: its absence throws, as borders' does.
     * @property {Object} borders                         The mesh of entity borders, rendered as one path. No default, and
     *                                                    required in practice: the mesh renderer throws a TypeError naming
     *                                                    its geoJson property if it is left out.
     * @property {Object} lakeFeatures                    The shape of the part of Lake Zurich that lies within the city.
     *                                                    No default; a missing shape renders as an empty path.
     * @property {Object} lakeBorders                     The entity borders which extend over the lake. No default, and it
     *                                                    renders as an empty path too.
     * @property {Boolean} lakeFadeOut                    Whether to fade the lake out towards the outer edge. Default false,
     *                                                    which overrides the lake renderer's own default of true.
     * @property {String} keyName                         The data object key which will return a map entity id. Default 'geoId'.
     * @property {Array} highlight                        An array of data elements to highlight. The corresponding map entities
     *                                                    are highlighted. Default [], which renders no highlight path.
     * @property {String, Function} highlightStroke       A function for the stroke of the highlighted entities. Default white.
     * @property {Number, Function} highlightStrokeWidth  A function for the stroke width of the highlighted entities. Default 2.
     * @property {Boolean, Function} defined              A predicate function used to determine whether a datum has a defined value.
     *                                                    Map entities with data values that fail this predicate test will display the missing value texture.
     *                                                    Defaults to a constant true, so nothing is textured unless it is set.
     * @property {String, Function} fill                  A string or function for the fill of the map entities. Default black.
     *                                                    A feature that matched no datum shows the missing value texture, so an
     *                                                    accessor is not called for it. The exception is a map where no feature
     *                                                    matched a datum: that draws geometry rather than values, keeps this
     *                                                    fill, and calls an accessor with undefined. See src/map/renderer/base.ts.
     * @property {String, Function} borderColor           A string, or a function handed to d3 and so called with the border
     *                                                    mesh, for the border color of the map entities. Default white. An
     *                                                    accessor that resolves to nothing keeps that default rather than
     *                                                    clearing the stroke.
     * @property {Number, Function} strokeWidth           The width of the border path stroke, delegated to the mesh
     *                                                    renderer like borderColor. A number, or a function handed to d3
     *                                                    and so called with the border mesh. Default 1.25, with the same
     *                                                    resolves-to-nothing fallback as borderColor.
     * @property {String, Function} lakePathColor         The color of the entity borders which extend over the lake. No
     *                                                    default: left out, the paths take their stroke from the stylesheet.
     * @property {Boolean} withLake                       Whether or not to show the textured outline of the end of lake Zurich that is within the city. Default true
     * @property {AnchoredShape} anchoredShape            A shape to anchor to the base map elements of this map - a component
     *                                                    carrying mergedData and mapPath properties, which this component sets
     *                                                    before calling it. For example, mapRendererBubble for a bubble map.
     *                                                    No default; left out, nothing extra is drawn.
     * @property {Boolean} transitionColor                Whether or not to transition the color of the base shapes. Default true.
     * @function on(String, function)                     This component has an event handler interface for binding events to the map entities.
     *                                                    The available events are 'over', 'out', and 'click'. These are triggered on map
     *                                                    elements when the user mouses over or taps, mouses out, or taps or clicks, respectively.
     *                                                    A handler is called with undefined rather than with the entity's
     *                                                    datum; see the note below.
     *
     * Note: the projection cache key is the literal string "zurichStadtfeatures" for every choropleth
     * on the page, whatever it is a map of - and it names no map id in src/map/mapUtils.ts.
     * swissMapProjection memoizes on width, height and that string alone, so two maps of different
     * areas rendered at the same size share the projection fitted to whichever rendered first, and the
     * second is projected outside its destination box.
     *
     * Note: features and borders are the two properties whose absence throws - features because
     * prepareMergedGeoData reads geoJson.features, borders because the mesh renderer now validates its
     * own geoJson. width and height have no defaults either, but a missing size degrades silently:
     * fitSize gets undefined, the scale is NaN, and every area carries a path of NaN coordinates that
     * the browser drops, leaving a blank map instead of an error.
     *
     * Note: the lake and the anchored shape are not removed once drawn. Turning withLake off, or
     * clearing anchoredShape, only stops the renderer being called; the lake, its border path, the
     * pattern definition and the shape's own elements stay in the DOM from the previous render. The
     * highlight is the exception - the highlight renderer removes its paths for an empty highlight
     * array - which is what makes the other two read as oversights rather than as house style.
     *
     * Note: lakeFadeOut defaults to false and is passed through on every render, overriding the lake
     * renderer's own default of true, so the fade mask and its gradient are not created unless the
     * caller asks for them. Toggling it is safe in both directions: turning lakeFadeOut back off
     * removes the mask attribute and its two definitions again.
     *
     * Note: withLake defaults to true, so a map with no lake data still gets the lake renderer, which
     * emits its lake pattern definition - under an id scoped to the overlay - and two empty paths.
     * Every non-Zurich map - switzerland included - has to set .withLake(false) or it carries them.
     *
     * Note: the event dispatch is created once per choropleth() call and closed over, while the four
     * renderers keep their props on the element they rendered into. So one instance can draw into two
     * layers, each reflecting its own data, but both layers' event targets are bound to the one
     * dispatch and share its handlers. Within a layer the handlers are rebound on each render rather
     * than accumulating, and the binding is selectAll("[data-event-target]") scoped to the rendered
     * group, so an anchored shape's own event targets are bound too, since it renders before the
     * binding.
     *
     * See test/maps/choropleth.test.ts.
     *
     * @return {sszvis.component}
     */
    /**
     * What the mouse listeners actually read. They were written for d3 v3, where a listener was called
     * with the datum; since d3 v6 the first argument is the event, so `datum` here is a property of a
     * PointerEvent and is always undefined. Transcribed rather than corrected so the port does not
     * change behaviour - the fix is to take the datum from d3's second argument. The same defect as
     * the bubble renderer's own handlers.
     */
    function legacyDatum(event) {
      return event.datum;
    }
    function choropleth () {
      const event = d3.dispatch("over", "out", "click");
      const baseRenderer = mapRendererBase();
      const meshRenderer = mapRendererMesh();
      const lakeRenderer = mapRendererPatternedLakeOverlay();
      const highlightRenderer = mapRendererHighlight();
      const mapComponent = component().prop("width").prop("height").prop("keyName").keyName(GEO_KEY_DEFAULT).prop("withLake").withLake(true).prop("anchoredShape").prop("features").prop("borders").prop("lakeFeatures").prop("lakeBorders").prop("lakeFadeOut").lakeFadeOut(false).delegate("defined", baseRenderer).delegate("fill", baseRenderer).delegate("transitionColor", baseRenderer).delegate("borderColor", meshRenderer).delegate("strokeWidth", meshRenderer).delegate("highlight", highlightRenderer).delegate("highlightStroke", highlightRenderer).delegate("highlightStrokeWidth", highlightRenderer).delegate("lakePathColor", lakeRenderer).render(function (data) {
        const selection = d3.select(this);
        const props = selection.props();
        // create a map path generator function
        // Note: the cache key is the same literal string for every choropleth on the page, whatever
        // it is a map of. Transcribed as it stands; see the module note.
        const mapPath = swissMapPath(props.width, props.height, props.features, "zurichStadtfeatures");
        const mergedData = prepareMergedGeoData(data, props.features, props.keyName);
        // Base shape
        baseRenderer.geoJson(props.features).mergedData(mergedData).mapPath(mapPath);
        // Border mesh
        meshRenderer.geoJson(props.borders).mapPath(mapPath);
        // Lake Zurich shape
        lakeRenderer.lakeFeature(props.lakeFeatures).lakeBounds(props.lakeBorders).mapPath(mapPath).fadeOut(props.lakeFadeOut);
        // Highlight mesh
        highlightRenderer.geoJson(props.features).keyName(props.keyName).mapPath(mapPath);
        // Rendering
        selection.call(baseRenderer).call(meshRenderer);
        if (props.withLake) {
          selection.call(lakeRenderer);
        }
        selection.call(highlightRenderer);
        if (props.anchoredShape) {
          props.anchoredShape.mergedData(mergedData).mapPath(mapPath);
          selection.call(props.anchoredShape);
        }
        // Event Binding
        selection.selectAll("[data-event-target]").on("mouseover", function (e) {
          event.call("over", this, legacyDatum(e));
        }).on("mouseout", function (e) {
          event.call("out", this, legacyDatum(e));
        }).on("click", function (e) {
          event.call("click", this, legacyDatum(e));
        });
      });
      // The argument tuple is typed as the map renderers type their own on(): d3's dispatch.on derives
      // its callback type from a *literal* event name, so a plain string collapses the callback to
      // never. Narrowing to "over" | "out" | "click" would type the callback properly but would also
      // reject the namespaced typenames d3 accepts at runtime, such as "over.tooltip".
      mapComponent.on = function () {
        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }
        const value = event.on.apply(event, args);
        return value === event ? mapComponent : value;
      };
      return mapComponent;
    }

    /**
     * Parsing functions
     *
     * @module sszvis/parse
     */
    const timeParse = d3.timeFormatLocale(timeLocale).parse;
    /**
     * Parse Swiss date strings
     * @param  {String} d A Swiss date string, e.g. 17.08.2014
     * @return {Date}
     */
    const dateParser = timeParse("%d.%m.%Y");
    const parseDate = d => dateParser(d);
    /**
     * Parse year values
     * @param  {string} d   A string which should be parsed as if it were a year, like "2014"
     * @return {Date}       A javascript date object for the first time in the given year
     */
    const yearParser = timeParse("%Y");
    const parseYear = d => yearParser(d);
    /**
     * Parse untyped input
     * @param  {String} d A value that could be a number
     * @return {Number}   If d is not a number, NaN is returned
     */
    const parseNumber = d => d.trim() === "" ? Number.NaN : +d;

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
    /* Exported module
    ----------------------------------------------- */
    function responsiveProps() {
      let breakpointSpec = breakpointDefaultSpec();
      const propsConfig = {};
      /**
       * Constructor
       *
       * @param   {Measurement} arg1 Accepts a 'measurement' object with a
       *          width and screenHeight. You can also pass it a 'bounds' object which contains
       *          measurements, but you must also include the screen measurements. This is the shape
       *          of object returned by sszvis.measureDimensions
       * @returns {object} An object containing the configured properties and their values for the current
       *          breakpoint as defined by the parameter `arg1`
       */
      function _responsiveProps(measurement) {
        if (!isObject(measurement) || !isBounds(measurement)) {
          warn("Could not determine the current breakpoint, returning the default props");
          // We choose the _ option for all configured props as a default.
          return Object.keys(propsConfig).reduce((memo, val, key) => {
            // BUG: doesn't support fallback
            memo[key] = val;
            return memo;
          }, {});
        }
        // Create results object based on the current measurements and the configured breakpoints and properties
        return Object.keys(propsConfig).reduce((memo, propKey) => {
          const propSpec = propsConfig[propKey];
          // Finds out which breakpoints the provided measurements match up with
          const matchingBreakpoints = breakpointMatch(breakpointSpec, measurement);
          // Validate the propSpec for the current propKey
          if (!validatePropSpec(propSpec, breakpointSpec)) {
            warn("ResponsiveProps - invalid propSpec for " + propKey + ". Make sure you define the '_' fallback and that all breakpoint names are valid.");
            return memo;
          }
          // Find the first breakpoint entry in the propSpec which matches one of the matched breakpoints
          // This function should always at least find '_' at the end of the array.
          const matchedBreakpoint = find(bp => defined(propSpec[bp.name]), matchingBreakpoints);
          // the value in the query object for that property equals the propSpec value as a functor,
          // invoked if necessary with the current width. Providing the width allows aspect ratio
          // calculations based on element width.
          if (matchedBreakpoint) {
            memo[propKey] = propSpec[matchedBreakpoint.name](measurement.width);
          } else {
            // Use fallback value if no breakpoint matches
            const fallback = propSpec._;
            memo[propKey] = typeof fallback === "function" ? fallback(measurement.width) : fallback;
          }
          return memo;
        }, {});
      }
      /**
       * responsiveProps.prop
       *
       * Define a responsive property that can assume different values depending on the
       * currently active breakpoint.
       *
       * @example
       * var queryProps = sszvis.responsiveProps()
       *   .prop('height', {
       *     palm: function(width) { return width /  (4/3); },
       *     lap:  function(width) { return width / (16/9); },
       *     _: 600 // You must always define a default case
       *   });
       *
       * The algorithm looks for the lowest applicable breakpoint. If a breakpoint's width or
       * screenHeight are larger than the current container and screen dimensions, its properties
       * will not apply. In case no breakpoint matches, the fallback value is used; it must always
       * be provided with the key name '_'.
       *
       * Each value can be either a raw value or a function which takes the current width
       * and returns a value for the property. These functions can be used to lazily calculate
       * properties (they are only executed when the module is called as a function),
       * and to change property values for a given breakpoint as a function of the width,
       * for example to do height calculation with a custom aspect ratio.
       *
       * @param {string} propName The name of the property you want to define
       * @param {Object.<string, (Function(number) -> *|*)>} propSpec A map of breakpoint names to
       *        property values. Key names must be valid breakpoint names. These can either be the
       *        default breakpoint names (see sszvis.breakpoint) or user-defined names that match up
       *        to breakpoints you have provided. Additionally, the fallback key `_` must be defined;
       *        its value will be used for screens larger than the largest breakpoint. You don't
       *        have to define all breakpoints; if you skip a breakpoint, the next applicable breakpoint
       *        in the test list will be used. Values can be either plain values or
       *        functions that accept the current breakpoint width and return a value.
       *
       * @return {responsiveProps}
       */
      _responsiveProps.prop = (propName, propSpec) => {
        propsConfig[propName] = functorizeValues(propSpec);
        return _responsiveProps;
      };
      /**
       * responsiveProps.breakpoints
       *
       * Configure custom breakpoints for the responsiveProps. You don't need to call
       * this method; there are default breakpoints (see sszvis.breakpoint).
       * You should provide an array of breakpoint specifiers, each one an object with at
       * least a 'name' property (used as an identifier for the breakpoint), and one or both
       * of a 'width' or 'screenHeight' property. When choosing a matching breakpoint, the
       * 'width' will be compared to the provided container width, and the 'screenHeight'
       * to the window.innerHeight. These values are inclusive, so if the measured value is
       * equal to or less than the provided breakpoint value, that breakpoint matches.
       *
       * This component has default breakpoints which are equal to the ones described
       * in the sszvis.breakpoint module. This method can also be called without arguments
       * to get the breakpoints list.
       *
       * @param {Array.<Object.<string, (string|number)>>} [bps] Define the breakpoints to be used.
       *                                                   Object format is:
       *                                                     {
       *                                                       name: breakpointname,
       *                                                       width: (optional) container width of this bp
       *                                                       screenHeight: (optional) window.innerHeight of this bp
       *                                                     }
       *                                                   if neither width nor screenHeight is provided, the breakpoint
       *                                                   will match all possible dimensions.
       *
       * @example
       * var queryProps = sszvis.responsiveProps()
       * .breakpoints([
       *   { name: 'small', width: 300 },
       *   { name: 'medium', width: 500 },
       *   { name: 'large', width: 700 }
       * ])
       */
      const breakpoints = function () {
        if (arguments.length === 0) {
          return breakpointSpec;
        }
        breakpointSpec = breakpointCreateSpec(arguments.length <= 0 ? undefined : arguments[0]);
        return _responsiveProps;
      };
      _responsiveProps.breakpoints = breakpoints;
      return _responsiveProps;
    }
    // Helpers
    function isBounds(arg1) {
      if (!defined(arg1) || typeof arg1 !== "object") return false;
      const candidate = arg1;
      return defined(candidate.width) && defined(candidate.screenWidth) && defined(candidate.screenHeight);
    }
    /**
     * functorizeValues
     * @prop    {object} obj Original key-value object
     * @returns {object} Same as input object but with all values transformed to width-accepting functions
     */
    function functorizeValues(obj) {
      const result = {};
      Object.keys(obj).forEach(key => {
        const value = obj[key];
        result[key] = typeof value === "function" ? value : () => value;
      });
      return result;
    }
    function validatePropSpec(propSpec, breakpointSpec) {
      // Ensure that the propSpec contains a '_' value.
      // This is used as the default value when the test width
      // is larger than any breakpoint.
      if (!defined(propSpec._)) {
        return false;
      }
      // Validate the properties of the propSpec:
      // each should be a valid breakpoint name, and its value should be defined
      for (const breakpointName in propSpec) {
        if (Object.hasOwn(propSpec, breakpointName) && breakpointName !== "_" && !defined(breakpointFindByName(breakpointSpec, breakpointName))) {
          return false;
        }
      }
      // All checks passed, propSpec is valid
      return true;
    }

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
    const TEXT_STYLES = ["bold", "italic", "plain"];
    function formatHTML() {
      const styles = {
        plain: d => d,
        italic: d => "<em>".concat(d, "</em>"),
        bold: d => "<strong>".concat(d, "</strong>")
      };
      return (textBody, datum) => textBody.lines().map(line => line.map(word => styles[word.style](word.text(datum))).join(" ")).join("<br/>");
    }
    function formatSVG() {
      const styles = {
        plain: d => "<tspan>".concat(d, "</tspan>"),
        italic: d => "<tspan style=\"font-style:italic\">".concat(d, "</tspan>"),
        bold: d => "<tspan style=\"font-weight:bold\">".concat(d, "</tspan>")
      };
      return (textBody, datum) => textBody.lines().reduce((svg, line, i) => {
        const lineSvg = line.map(word => styles[word.style](word.text(datum))).join(" ");
        const dy = i === 0 ? 0 : "1.2em";
        return "".concat(svg, "<tspan x=\"0\" dy=\"").concat(dy, "\">").concat(lineSvg, "</tspan>");
      }, "");
    }
    function structuredText() {
      // Always holds at least one line, so the index in addWord is always in range.
      const lines = [[]];
      return {
        addLine() {
          lines.push([]);
        },
        addWord(style, text) {
          // Equivalent to fn.last(lines); `lines` always holds at least one line.
          lines[lines.length - 1].push({
            // fn.functor is typed for nullary thunks, so it cannot express an accessor that
            // receives the datum. The public methods accept `unknown` so that a consumer's
            // (d: Artist) => string still type-checks, which leaves this narrowing to us.
            text: functor(text),
            style
          });
        },
        lines() {
          return lines;
        }
      };
    }
    function makeTextWithFormat(format) {
      return () => {
        const textBody = structuredText();
        // A callable object: the chaining methods are attached below, so the function has to
        // be narrowed to the builder interface up front.
        const makeText = d => format(textBody, d);
        makeText.newline = () => {
          textBody.addLine();
          return makeText;
        };
        for (const style of TEXT_STYLES) {
          makeText[style] = text => {
            textBody.addWord(style, text);
            return makeText;
          };
        }
        return makeText;
      };
    }
    const modularTextHTML = makeTextWithFormat(formatHTML());
    const modularTextSVG = makeTextWithFormat(formatSVG());

    exports.AGGLOMERATION_2012_KEY = AGGLOMERATION_2012_KEY;
    exports.DEFAULT_LEGEND_COLOR_ORDINAL_ROW_HEIGHT = DEFAULT_LEGEND_COLOR_ORDINAL_ROW_HEIGHT;
    exports.DEFAULT_WIDTH = DEFAULT_WIDTH;
    exports.GEO_KEY_DEFAULT = GEO_KEY_DEFAULT;
    exports.RATIO = RATIO;
    exports.STADT_KREISE_KEY = STADT_KREISE_KEY;
    exports.STATISTISCHE_QUARTIERE_KEY = STATISTISCHE_QUARTIERE_KEY;
    exports.STATISTISCHE_ZONEN_KEY = STATISTISCHE_ZONEN_KEY;
    exports.SWITZERLAND_KEY = SWITZERLAND_KEY;
    exports.WAHL_KREISE_KEY = WAHL_KREISE_KEY;
    exports.annotationCircle = circle;
    exports.annotationConfidenceArea = confidenceArea;
    exports.annotationConfidenceBar = confidenceBar;
    exports.annotationLine = line$1;
    exports.annotationRangeFlag = rangeFlag;
    exports.annotationRangeRuler = rangeRuler;
    exports.annotationRectangle = rectangle;
    exports.annotationRuler = annotationRuler;
    exports.app = app;
    exports.arity = arity;
    exports.aspectRatio = aspectRatio;
    exports.aspectRatio12to5 = aspectRatio12to5;
    exports.aspectRatio16to10 = aspectRatio16to10;
    exports.aspectRatio4to3 = aspectRatio4to3;
    exports.aspectRatioAuto = aspectRatioAuto;
    exports.aspectRatioPortrait = aspectRatioPortrait;
    exports.aspectRatioSquare = aspectRatioSquare;
    exports.axisX = axisX;
    exports.axisY = axisY;
    exports.bar = bar;
    exports.bounds = bounds;
    exports.breadcrumb = breadcrumb;
    exports.breakpointCreateSpec = breakpointCreateSpec;
    exports.breakpointDefaultSpec = breakpointDefaultSpec;
    exports.breakpointFind = breakpointFind;
    exports.breakpointFindByName = breakpointFindByName;
    exports.breakpointLap = breakpointLap;
    exports.breakpointMatch = breakpointMatch;
    exports.breakpointPalm = breakpointPalm;
    exports.breakpointTest = breakpointTest;
    exports.buttonGroup = buttonGroup;
    exports.cascade = cascade;
    exports.choropleth = choropleth;
    exports.colorLegendDimensions = colorLegendDimensions;
    exports.colorLegendLayout = colorLegendLayout;
    exports.compose = compose;
    exports.contains = contains$1;
    exports.createBreadcrumbItems = createBreadcrumbItems;
    exports.createHtmlLayer = createHtmlLayer;
    exports.createSvgLayer = createSvgLayer;
    exports.dataAreaPattern = dataAreaPattern;
    exports.defaultTransition = defaultTransition;
    exports.defined = defined;
    exports.derivedSet = derivedSet;
    exports.dimensionsHeatTable = dimensionsHeatTable;
    exports.dimensionsHorizontalBarChart = dimensionsHorizontalBarChart;
    exports.dimensionsVerticalBarChart = dimensionsVerticalBarChart;
    exports.dot = dot;
    exports.ensureDefsElement = ensureDefsElement;
    exports.every = every;
    exports.fallbackCanvasUnsupported = fallbackCanvasUnsupported;
    exports.fallbackRender = fallbackRender;
    exports.fallbackUnsupported = fallbackUnsupported;
    exports.fastTransition = fastTransition;
    exports.filledArray = filledArray;
    exports.find = find;
    exports.first = first;
    exports.firstTouch = firstTouch;
    exports.fitTooltip = fitTooltip;
    exports.flatten = flatten;
    exports.foldPattern = foldPattern;
    exports.formatAge = formatAge;
    exports.formatAxisTimeFormat = formatAxisTimeFormat;
    exports.formatFractionPercent = formatFractionPercent;
    exports.formatLocale = formatLocale;
    exports.formatMonth = formatMonth;
    exports.formatNone = formatNone;
    exports.formatNumber = formatNumber;
    exports.formatPercent = formatPercent;
    exports.formatPreciseNumber = formatPreciseNumber;
    exports.formatText = formatText;
    exports.formatYear = formatYear;
    exports.functor = functor;
    exports.getAccessibleTextColor = getAccessibleTextColor;
    exports.getGeoJsonCenter = getGeoJsonCenter;
    exports.groupedBars = groupedBars;
    exports.groupedBarsHorizontal = groupedBarsHorizontal;
    exports.groupedBarsVertical = groupedBarsVertical;
    exports.halfPixel = halfPixel;
    exports.handleRuler = handleRuler;
    exports.hashableSet = hashableSet;
    exports.heatTableMissingValuePattern = heatTableMissingValuePattern;
    exports.identity = identity;
    exports.isFunction = isFunction$1;
    exports.isNull = isNull;
    exports.isNumber = isNumber;
    exports.isObject = isObject;
    exports.isPaintServer = isPaintServer;
    exports.isSelection = isSelection;
    exports.isString = isString;
    exports.last = last;
    exports.layoutPopulationPyramid = layoutPopulationPyramid;
    exports.layoutSmallMultiples = smallMultiples;
    exports.layoutStackedAreaMultiples = layoutStackedAreaMultiples;
    exports.legendColorBinned = binnedColorScale;
    exports.legendColorLinear = legendColorLinear;
    exports.legendColorOrdinal = legendColorOrdinal;
    exports.legendRadius = radius;
    exports.line = line;
    exports.loadError = loadError;
    exports.mapLakeFadeGradient = mapLakeFadeGradient;
    exports.mapLakeGradientMask = mapLakeGradientMask;
    exports.mapLakePattern = mapLakePattern;
    exports.mapMissingValuePattern = mapMissingValuePattern;
    exports.mapRendererBase = mapRendererBase;
    exports.mapRendererBubble = bubble;
    exports.mapRendererGeoJson = mapRendererGeoJson;
    exports.mapRendererHighlight = mapRendererHighlight;
    exports.mapRendererImage = mapRendererImage;
    exports.mapRendererMesh = mapRendererMesh;
    exports.mapRendererPatternedLakeOverlay = mapRendererPatternedLakeOverlay;
    exports.mapRendererRaster = mapRendererRaster;
    exports.measureAxisLabel = measureAxisLabel;
    exports.measureDimensions = measureDimensions;
    exports.measureLegendLabel = measureLegendLabel;
    exports.measureText = measureText;
    exports.memoize = memoize;
    exports.missingPatternId = missingPatternId;
    exports.modularTextHTML = modularTextHTML;
    exports.modularTextSVG = modularTextSVG;
    exports.move = move;
    exports.muchDarker = muchDarker;
    exports.nestedStackedBarsVertical = nestedStackedBarsVertical;
    exports.not = not;
    exports.pack = pack;
    exports.panning = panning;
    exports.parseDate = parseDate;
    exports.parseNumber = parseNumber;
    exports.parseYear = parseYear;
    exports.pie = pie;
    exports.pixelsFromGeoDistance = pixelsFromGeoDistance;
    exports.prepareHierarchyData = prepareHierarchyData;
    exports.prepareMergedGeoData = prepareMergedGeoData;
    exports.prop = prop;
    exports.propOr = propOr;
    exports.pyramid = pyramid;
    exports.range = range;
    exports.responsiveProps = responsiveProps;
    exports.roundTransformString = roundTransformString;
    exports.rulerLabelVerticalSeparate = rulerLabelVerticalSeparate;
    exports.sankey = sankey;
    exports.sankeyLayout = computeLayout$1;
    exports.sankeyPrepareData = prepareData;
    exports.scaleDeepGry = scaleDeepGry;
    exports.scaleDimGry = scaleDimGry;
    exports.scaleDivNtr = scaleDivNtr;
    exports.scaleDivNtrGry = scaleDivNtrGry;
    exports.scaleDivVal = scaleDivVal;
    exports.scaleDivValGry = scaleDivValGry;
    exports.scaleGender3 = scaleGender3;
    exports.scaleGender5Wedding = scaleGender5Wedding;
    exports.scaleGender6Origin = scaleGender6Origin;
    exports.scaleGry = scaleGry;
    exports.scaleLightGry = scaleLightGry;
    exports.scaleMedGry = scaleMedGry;
    exports.scalePaleGry = scalePaleGry;
    exports.scaleQual12 = scaleQual12;
    exports.scaleQual6 = scaleQual6;
    exports.scaleQual6a = scaleQual6a;
    exports.scaleQual6b = scaleQual6b;
    exports.scaleSeqBlu = scaleSeqBlu;
    exports.scaleSeqBrn = scaleSeqBrn;
    exports.scaleSeqGrn = scaleSeqGrn;
    exports.scaleSeqRed = scaleSeqRed;
    exports.selectMenu = selectMenu;
    exports.set = set$1;
    exports.slider = slider;
    exports.slightlyDarker = slightlyDarker;
    exports.slowTransition = slowTransition;
    exports.some = some;
    exports.stackedArea = stackedArea;
    exports.stackedAreaMultiples = stackedAreaMultiples;
    exports.stackedBarHorizontal = stackedBarHorizontal;
    exports.stackedBarHorizontalData = stackedBarHorizontalData;
    exports.stackedBarVertical = stackedBarVertical;
    exports.stackedBarVerticalData = stackedBarVerticalData;
    exports.stackedPyramid = stackedPyramid;
    exports.stackedPyramidData = stackedPyramidData;
    exports.stringEqual = stringEqual;
    exports.sunburst = sunburst;
    exports.sunburstGetRadiusExtent = getRadiusExtent;
    exports.sunburstLayout = computeLayout;
    exports.swissMapPath = swissMapPath;
    exports.swissMapProjection = swissMapProjection;
    exports.textWrap = textWrap;
    exports.timeLocale = timeLocale;
    exports.toLookupKey = toLookupKey;
    exports.tooltip = tooltip;
    exports.tooltipAnchor = tooltipAnchor;
    exports.transformTranslateSubpixelShift = transformTranslateSubpixelShift;
    exports.translateString = translateString;
    exports.treemap = treemap;
    exports.valueFn = valueFn;
    exports.viewport = viewport;
    exports.voronoi = voronoi;
    exports.widthAdaptiveMapPathStroke = widthAdaptiveMapPathStroke;
    exports.withAlpha = withAlpha;
    exports.withRootSelection = withRootSelection;

}));
//# sourceMappingURL=sszvis.js.map
