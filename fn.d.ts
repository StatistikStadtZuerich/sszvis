/**
 * A collection of functional programming helper functions
 *
 * @module sszvis/fn
 */
import { type BaseType, type Selection, type ValueFn } from "d3";
import type { $IntentionalAny, AnySelection } from "./types.js";
/**
 * fn.identity
 *
 * The identity function. It returns the first argument passed to it.
 * Useful as a default where a function is required.
 */
export declare const identity: <T>(value: T) => T;
/**
 * fn.isString
 *
 * determine whether the value is a string
 */
export declare const isString: (val: unknown) => val is string;
/**
 * fn.isSelection
 *
 * determine whether the value is a d3.selection.
 */
export declare const isSelection: (val: unknown) => val is AnySelection;
/**
 * fn.arity
 *
 * Wraps a function of any arity (including nullary) in a function that
 * accepts exactly `n` parameters. Any extraneous parameters will not be
 * passed to the supplied function.
 */
export declare const arity: <A extends unknown[], R>(n: number, fn: (...args: A) => R) => ((...args: unknown[]) => R);
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
export declare const compose: (...fns: ((...args: $IntentionalAny[]) => $IntentionalAny)[]) => ((...args: $IntentionalAny[]) => $IntentionalAny);
/**
 * fn.contains
 *
 * Checks whether an item is present in the given list (by strict equality).
 */
export declare const contains: <T>(list: T[], d: T) => boolean;
/**
 * fn.defined
 *
 * determines if the passed value is defined.
 */
export declare const defined: <T>(val: T) => val is NonNullable<T>;
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
export declare const derivedSet: <T>(arr: T[], acc?: (value: T, index: number, array: T[]) => unknown) => T[];
/**
 * fn.every
 *
 * Use a predicate function to test if every element in an array passes some test.
 * Returns false as soon as an element fails the predicate test. Returns true otherwise.
 */
export declare const every: <T>(predicate: (element: T) => boolean, arr: T[]) => boolean;
/**
 * fn.filledArray
 *
 * returns a new array with length `len` filled with `val`
 */
export declare const filledArray: <T>(len: number, val: T) => T[];
/**
 * fn.find
 *
 * Finds the first occurrence of an element in an array that passes the predicate function
 */
export declare const find: <T>(predicate: (element: T) => boolean, arr: T[]) => T | undefined;
/**
 * fn.first
 *
 * Returns the first value in the passed array, or undefined if the array is empty
 */
export declare const first: <T>(arr: T[]) => T | undefined;
/**
 * fn.flatten
 *
 * Flattens the nested input array by one level. The input array is expected to be
 * a two-dimensional array (i.e. its elements are also arrays). The result is a
 * one-dimensional array consisting of all the elements of the sub-arrays.
 */
export declare const flatten: <T>(arr: T[][]) => T[];
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
export declare const firstTouch: (event: TouchEvent) => Touch | null;
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
export declare const foldPattern: <T>(key: string, pattern: Record<string, () => T>) => T;
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
export declare const hashableSet: <T, U extends string | number>(arr: T[], acc?: (element: T, index: number, array: T[]) => U) => U[];
/**
 * fn.isFunction
 *
 * Determines if the passed value is a function
 */
export declare const isFunction: (val: unknown) => val is (...args: $IntentionalAny[]) => $IntentionalAny;
/**
 * fn.isNull
 *
 * determines if the passed value is null.
 */
export declare const isNull: (val: unknown) => val is null;
/**
 * fn.isNumber
 *
 * determine whether the value is a number
 */
export declare const isNumber: (val: unknown) => val is number;
/**
 * fn.isObject
 *
 * determines if the passed value is of an "object" type, or if it is something else,
 * e.g. a raw number, string, null, undefined, NaN, something like that.
 */
export declare const isObject: (val: unknown) => val is object;
/**
 * fn.last
 *
 * Returns the last value in the passed array, or undefined if the array is empty
 */
export declare const last: <T>(arr: T[]) => T | undefined;
/**
 * fn.not
 *
 * Takes as argument a function f and returns a new function
 * which calls f on its arguments and returns the
 * boolean opposite of f's return value.
 */
export declare const not: <T extends unknown[]>(f: (...args: T) => unknown) => ((...args: T) => boolean);
/**
 * fn.prop
 *
 * takes the name of a property and returns a property accessor function
 * for the named property. When the accessor function is called on an object,
 * it returns that object's value for the named property. (or undefined, if the object
 * does not contain the property.)
 */
export declare const prop: <K extends string | number | symbol>(key: K) => (<T extends Record<K, unknown>>(object: T) => T[K]);
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
export declare const propOr: <K extends string | number | symbol, D>(key: K, defaultVal?: D) => (<T extends Partial<Record<K, unknown>>>(object: T | undefined) => T[K] | D);
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
export declare const set: <T, U>(arr: T[], acc?: (value: T, index: number, array: T[]) => U) => U[];
/**
 * fn.some
 *
 * Test an array with a predicate and determine whether some element in the array passes the test.
 * Returns true as soon as an element passes the test. Returns false otherwise.
 */
export declare const some: <T>(predicate: (element: T) => boolean, arr: T[]) => boolean;
/**
 * fn.stringEqual
 *
 * Determines whether two values are equal when converted to strings. Useful for comparing
 * date objects, because two different date objects are not considered equal, even if they
 * represent the same date.
 */
export declare const stringEqual: (a: {
    toString(): string;
}, b: {
    toString(): string;
}) => boolean;
/**
 * fn.functor
 *
 * Same as fn.functor in d3v3
 */
export declare const functor: <T>(v: T | (() => T)) => (() => T);
/**
 * Applies `render` to whichever selection `selector` denotes.
 *
 * Each branch keeps its own concrete selection type rather than being widened into a shared
 * variable first: d3's select() has one overload for a selector string and another for a
 * node, and Selection is invariant in all four of its type parameters, so no single type -
 * and no union - holds all three cases. `render` is generic, so each branch infers.
 */
export declare function withRootSelection<R, SG extends BaseType, SD, SP extends BaseType, SPD>(selector: string | Element | Selection<SG, SD, SP, SPD>, render: <G extends BaseType, D, P extends BaseType, PD>(root: Selection<G, D, P, PD>) => R): R;
/**
 * fn.valueFn
 *
 * Wraps a constant in an accessor and leaves an existing accessor alone. Unlike fn.functor
 * the result takes d3's (datum, index, group) arguments and can be handed straight to
 * .attr() or .style(). An unset prop resolves to undefined, which d3 treats the same as
 * null - it removes the attribute either way - so `value ?? null` at a call site is about
 * the declared return type, not about what d3 renders.
 */
export declare const valueFn: <E extends BaseType, D, R>(value: R | ValueFn<E, D, R>) => ValueFn<E, D, R>;
/**
 * The most entries a memoized function retains. Beyond it the least recently used entry is
 * dropped. Deliberately in the low tens: the keys a chart revisits are few - a handful of
 * breakpoint widths, one per map - while a resize drag produces one throwaway key per tick.
 */
export declare const MEMOIZE_CACHE_LIMIT = 32;
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
 *
 * Also unlike lodash, the cache is bounded to MEMOIZE_CACHE_LIMIT entries and evicts the least
 * recently used one, so a caller that keys on a continuously varying value - a chart reprojecting
 * on every resize tick - no longer retains an entry per tick for the lifetime of the page. A
 * memoized value is therefore a cache, never a registry: it can disappear between calls, and a
 * caller that needs a value to survive must hold it itself.
 *
 * Recency is tracked by the Map's own insertion order, so a cache hit re-inserts its entry and
 * moves it to the end. `.cache` stays a plain, publicly mutable Map; only its iteration order
 * now reflects use rather than first insertion. Every call trims, hit or miss, so a cache filled
 * past the limit from outside is brought back to it by the next call.
 */
export declare const memoize: <TFunc extends (...args: never[]) => unknown>(func: TFunc, resolver?: (...args: Parameters<TFunc>) => string | number) => TFunc & {
    cache: Map<unknown, ReturnType<TFunc>>;
};
//# sourceMappingURL=fn.d.ts.map