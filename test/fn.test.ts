import { select } from "d3";
import { describe, expect, test, vi } from "vitest";
import {
  arity,
  compose,
  contains,
  defined,
  derivedSet,
  every,
  filledArray,
  find,
  first,
  firstTouch,
  flatten,
  foldPattern,
  functor,
  hashableSet,
  identity,
  isFunction,
  isNull,
  isNumber,
  isObject,
  isSelection,
  isString,
  last,
  memoize,
  not,
  prop,
  propOr,
  set,
  some,
  stringEqual,
  valueFn,
} from "../src/fn.js";

describe("fn", () => {
  describe("identity", () => {
    test("should return the first argument unchanged", () => {
      const obj = { a: 1 };
      expect(identity(obj)).toBe(obj);
      expect(identity(42)).toBe(42);
      expect(identity(undefined)).toBeUndefined();
    });
  });

  describe("arity", () => {
    const spy = () => vi.fn((...args: unknown[]) => args);

    test("should pass exactly n arguments through for each n from 0 to 10", () => {
      const extra = Array.from({ length: 15 }, (_, i) => i);
      for (let n = 0; n <= 10; ++n) {
        const inner = spy();
        arity(n, inner)(...extra);
        expect(inner.mock.calls[0]).toHaveLength(n);
        expect(inner.mock.calls[0]).toEqual(extra.slice(0, n));
      }
    });

    test("should pad with undefined when fewer than n arguments are supplied", () => {
      const inner = spy();
      arity(3, inner)("a");
      // NOTE: the wrapper always forwards n positional slots, so the wrapped function
      // sees arguments.length === n even when the caller passed fewer.
      expect(inner.mock.calls[0]).toEqual(["a", undefined, undefined]);
    });

    test("should give the returned function a .length equal to n", () => {
      for (let n = 0; n <= 10; ++n) {
        expect(arity(n, (..._args: unknown[]) => undefined)).toHaveLength(n);
      }
    });

    test("should return the original function unchanged when n is greater than 10", () => {
      const inner = spy();
      // NOTE: the `default` branch is a no-op passthrough — for n > 10 the argument
      // limiting silently does not happen, and .length is the original function's.
      const wrapped = arity(11, inner);
      expect(wrapped).toBe(inner);
      wrapped(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12);
      expect(inner.mock.calls[0]).toHaveLength(12);
    });

    test("should return the original function unchanged for negative and non-integer n", () => {
      const inner = spy();
      // NOTE: same passthrough quirk — -1 and 1.5 both fall through to `default`.
      expect(arity(-1, inner)).toBe(inner);
      expect(arity(1.5, inner)).toBe(inner);
      expect(arity(Number.NaN, inner)).toBe(inner);
    });

    test("should forward the `this` binding to the wrapped function", () => {
      const context = { name: "ctx" };
      for (let n = 0; n <= 10; ++n) {
        const inner = vi.fn(function (this: unknown) {
          return this;
        });
        expect(arity(n, inner).call(context)).toBe(context);
      }
    });

    test("should return the wrapped function's return value", () => {
      expect(arity(2, (a: number, b: number) => a + b)(3, 4, 5)).toBe(7);
    });

    test("should work as a d3 accessor guard", () => {
      const accessor = vi.fn((d: unknown) => String(d));
      const div = document.createElement("div");
      select(div).datum({ v: 1 }).attr("data-x", arity(1, accessor));
      expect(accessor.mock.calls[0]).toHaveLength(1);
    });
  });

  describe("compose", () => {
    const inc = (x: number) => x + 1;
    const double = (x: number) => x * 2;

    test("should apply functions right to left", () => {
      expect(compose(inc, double)(5)).toBe(11);
      expect(compose(double, inc)(5)).toBe(12);
    });

    test("should pass all arguments to the rightmost function only", () => {
      const rightmost = vi.fn((...args: number[]) => args.length);
      expect(compose(identity, rightmost)(1, 2, 3)).toBe(3);
      expect(rightmost.mock.calls[0]).toEqual([1, 2, 3]);
    });

    test("should return its argument when given a single function", () => {
      expect(compose(inc)(1)).toBe(2);
    });

    test("should forward `this` to every composed function", () => {
      const context = { v: 10 };
      const outer = function (this: { v: number }, x: number) {
        return x + this.v;
      };
      const innerFn = function (this: { v: number }, x: number) {
        return x * this.v;
      };
      expect(compose(outer, innerFn).call(context, 2)).toBe(30);
    });

    test("should throw when called with no functions", () => {
      // NOTE: `fns[-1]` is undefined, so the composed function throws on invocation
      // rather than behaving like identity.
      expect(() => compose()(1)).toThrow();
    });
  });

  describe("prop", () => {
    test("should read the named property", () => {
      expect(prop("a")({ a: 1 })).toBe(1);
    });

    test("should return undefined for a missing property", () => {
      expect(prop("b")({ a: 1 } as Record<string, number>)).toBeUndefined();
    });

    test("should read numeric keys and array indices", () => {
      expect(prop(1)({ 1: "b" })).toBe("b");
    });

    test("should throw when applied to undefined", () => {
      // NOTE: prop does no guarding — use propOr when the object may be missing.
      expect(() => prop("a")(undefined as unknown as Record<string, number>)).toThrow();
    });
  });

  describe("propOr", () => {
    test("should read the named property when present", () => {
      expect(propOr("a", 99)({ a: 1 })).toBe(1);
    });

    test("should return the default when the property is missing", () => {
      expect(propOr("b", 99)({ a: 1 } as Record<string, number>)).toBe(99);
    });

    test("should return the default when the object is undefined", () => {
      expect(propOr("a", 99)(undefined)).toBe(99);
    });

    test("should return undefined when no default is given", () => {
      expect(propOr("b")({ a: 1 } as Record<string, number>)).toBeUndefined();
    });

    test("should return the default for an explicitly undefined property value", () => {
      // NOTE: propOr cannot distinguish "absent" from "present but undefined".
      expect(propOr("a", 99)({ a: undefined })).toBe(99);
    });

    test("should not substitute the default for other falsy values", () => {
      expect(propOr("a", 99)({ a: null })).toBeNull();
      expect(propOr("a", 99)({ a: 0 })).toBe(0);
      expect(propOr("a", 99)({ a: "" })).toBe("");
    });

    test("should throw when applied to null", () => {
      // NOTE: only `undefined` is guarded, not `null`.
      expect(() => propOr("a", 99)(null as unknown as Record<string, number>)).toThrow();
    });
  });

  describe("functor", () => {
    test("should wrap a constant in a function", () => {
      expect(functor(5)()).toBe(5);
      expect(functor(null)()).toBeNull();
    });

    test("should return an existing function unchanged", () => {
      const f = () => 1;
      expect(functor(f)).toBe(f);
    });

    test("should return the same value on repeated calls", () => {
      const obj = { a: 1 };
      const f = functor(obj);
      expect(f()).toBe(obj);
      expect(f()).toBe(obj);
    });
  });

  describe("valueFn", () => {
    test("should wrap a constant in a d3 accessor", () => {
      const f = valueFn("red") as unknown as () => string;
      expect(f()).toBe("red");
    });

    test("should return an existing accessor unchanged", () => {
      const f = (d: unknown) => d;
      expect(valueFn(f)).toBe(f);
    });

    test("should be usable directly with d3 .attr()", () => {
      const div = document.createElement("div");
      select(div).datum(3).attr("data-a", valueFn("x")).attr("data-b", valueFn(String));
      expect(div.getAttribute("data-a")).toBe("x");
      expect(div.getAttribute("data-b")).toBe("3");
    });

    test("should wrap undefined in an accessor that d3 treats as a removal", () => {
      const div = document.createElement("div");
      div.setAttribute("data-a", "old");
      // NOTE: the valueFn JSDoc claims you must pass `value ?? null` to get removal
      // instead of the string "undefined", but d3's attr uses a `== null` check, so
      // undefined already removes the attribute. The JSDoc advice is stale.
      select(div).attr("data-a", valueFn(undefined) as unknown as string);
      expect(div.getAttribute("data-a")).toBeNull();
    });
  });

  describe("set", () => {
    test("should return unique values in order of first appearance", () => {
      expect(set([2, 1, 1, 6, 8, 6, 5, 3])).toEqual([2, 1, 6, 8, 5, 3]);
      expect(set(["b", "a", "b", "b"])).toEqual(["b", "a"]);
    });

    test("should compare objects by reference", () => {
      const o1 = { a: 1 };
      const o2 = { a: 1 };
      expect(set([o1, o2, o1])).toEqual([o1, o2]);
    });

    test("should return the accessor's values, not the input elements", () => {
      expect(set([{ v: 1 }, { v: 2 }, { v: 1 }], (d) => d.v)).toEqual([1, 2]);
    });

    test("should pass value, index and array to the accessor", () => {
      const acc = vi.fn((d: string) => d);
      const arr = ["a", "b"];
      set(arr, acc);
      expect(acc.mock.calls[0]).toEqual(["a", 0, arr]);
    });

    test("should collapse repeated NaN into one entry", () => {
      // NOTE: Array#includes uses SameValueZero, so NaN is treated as equal to NaN
      // here even though `===` would not.
      expect(set([Number.NaN, Number.NaN])).toEqual([Number.NaN]);
    });

    test("should return an empty array for empty input", () => {
      expect(set([])).toEqual([]);
    });
  });

  describe("derivedSet", () => {
    test("should return the input objects, deduped by the derived value", () => {
      const a = { id: 1, name: "a" };
      const b = { id: 2, name: "b" };
      const c = { id: 1, name: "c" };
      expect(derivedSet([a, b, c], (d) => d.id)).toEqual([a, b]);
    });

    test("should keep the first object seen for each derived value", () => {
      const a = { id: 1, name: "a" };
      const c = { id: 1, name: "c" };
      expect(derivedSet([a, c], (d) => d.id)[0]).toBe(a);
    });

    test("should fall back to identity when no accessor is given", () => {
      expect(derivedSet([1, 2, 1, 3])).toEqual([1, 2, 3]);
    });

    test("should pass value, index and array to the accessor", () => {
      const acc = vi.fn((d: string) => d);
      const arr = ["a", "b"];
      derivedSet(arr, acc);
      expect(acc.mock.calls[0]).toEqual(["a", 0, arr]);
    });

    test("should return an empty array for empty input", () => {
      expect(derivedSet([])).toEqual([]);
    });
  });

  describe("hashableSet", () => {
    test("should return unique accessor values in order of first appearance", () => {
      expect(hashableSet(["b", "a", "b"])).toEqual(["b", "a"]);
      expect(hashableSet([{ v: "x" }, { v: "y" }, { v: "x" }], (d) => d.v)).toEqual(["x", "y"]);
    });

    test("should treat numbers and their string forms as the same key", () => {
      // NOTE: the seen-map is a plain object, so keys are coerced to strings and
      // 1 and "1" collide — fn.set does not have this behaviour.
      expect(hashableSet([1, "1"] as (string | number)[])).toEqual([1]);
    });

    test("should emit falsy values more than once", () => {
      // NOTE: bug. The guard is `if (!seen[value])`, and `seen[0] = true` is truthy,
      // but for the value 0 the check reads `seen[0]` only after it was set — the
      // real failure is any value whose stored marker is looked up as falsy. Empty
      // string keys behave the same way as any other key here, but a value that
      // stringifies to an inherited Object.prototype member is not guarded at all.
      expect(hashableSet([0, 0, ""] as (string | number)[])).toEqual([0, ""]);
    });

    test("should treat inherited Object.prototype keys as already seen", () => {
      // NOTE: bug. `seen["constructor"]` is truthy via the prototype chain, so
      // "constructor" is dropped from the result entirely.
      expect(hashableSet(["constructor", "a"])).toEqual(["a"]);
    });

    test("should pass value, index and array to the accessor", () => {
      const acc = vi.fn((d: string) => d);
      const arr = ["a", "b"];
      hashableSet(arr, acc);
      expect(acc.mock.calls[0]).toEqual(["a", 0, arr]);
    });

    test("should return an empty array for empty input", () => {
      expect(hashableSet([])).toEqual([]);
    });
  });

  describe("defined", () => {
    test("should be false for undefined, null and NaN", () => {
      expect(defined(undefined)).toBe(false);
      expect(defined(null)).toBe(false);
      expect(defined(Number.NaN)).toBe(false);
    });

    test("should be true for other falsy values", () => {
      expect(defined(0)).toBe(true);
      expect(defined("")).toBe(true);
      expect(defined(false)).toBe(true);
    });

    test("should be true for objects and dates", () => {
      expect(defined({})).toBe(true);
      expect(defined(new Date(Number.NaN))).toBe(true);
    });
  });

  describe("contains", () => {
    test("should detect membership by strict equality", () => {
      expect(contains([1, 2, 3], 2)).toBe(true);
      expect(contains([1, 2, 3], 4)).toBe(false);
    });

    test("should compare objects by reference", () => {
      const o = { a: 1 };
      expect(contains([o], o)).toBe(true);
      expect(contains([{ a: 1 }], { a: 1 })).toBe(false);
    });

    test("should find NaN", () => {
      // NOTE: Array#includes uses SameValueZero, so NaN is findable here.
      expect(contains([Number.NaN], Number.NaN)).toBe(true);
    });

    test("should be false for an empty list", () => {
      expect(contains([], 1)).toBe(false);
    });
  });

  describe("find", () => {
    test("should return the first matching element", () => {
      expect(find((d: number) => d > 1, [1, 2, 3])).toBe(2);
    });

    test("should return undefined when nothing matches", () => {
      expect(find((d: number) => d > 5, [1, 2, 3])).toBeUndefined();
      expect(find(() => true, [])).toBeUndefined();
    });

    test("should stop iterating at the first match", () => {
      const predicate = vi.fn((d: number) => d === 1);
      find(predicate, [1, 2, 3]);
      expect(predicate).toHaveBeenCalledTimes(1);
    });

    test("should call the predicate with the element only", () => {
      const predicate = vi.fn(() => false);
      find(predicate, ["a"]);
      // NOTE: unlike Array#find, no index or array argument is passed.
      expect(predicate.mock.calls[0]).toEqual(["a"]);
    });
  });

  describe("flatten", () => {
    test("should flatten one level", () => {
      expect(
        flatten([
          [1, 2],
          [3, 4],
        ])
      ).toEqual([1, 2, 3, 4]);
    });

    test("should flatten only one level", () => {
      expect(flatten([[[1]], [[2]]])).toEqual([[1], [2]]);
    });

    test("should handle empty and nested-empty input", () => {
      expect(flatten([])).toEqual([]);
      expect(flatten([[], []])).toEqual([]);
    });

    test("should return a new array", () => {
      const inner = [1];
      expect(flatten([inner])).not.toBe(inner);
    });
  });

  describe("memoize", () => {
    test("should call the wrapped function once per distinct key", () => {
      const inner = vi.fn((x: number) => x * 2);
      const memo = memoize(inner);
      expect(memo(2)).toBe(4);
      expect(memo(2)).toBe(4);
      expect(memo(3)).toBe(6);
      expect(inner).toHaveBeenCalledTimes(2);
    });

    test("should key on the first argument only when no resolver is given", () => {
      const inner = vi.fn((a: number, b: number) => a + b);
      const memo = memoize(inner);
      expect(memo(1, 1)).toBe(2);
      // NOTE: quirk. The default cache key is args[0], so differing later arguments
      // return the stale first result.
      expect(memo(1, 5)).toBe(2);
      expect(inner).toHaveBeenCalledTimes(1);
    });

    test("should use the resolver to compute the cache key", () => {
      const inner = vi.fn((a: number, b: number) => a + b);
      const memo = memoize(inner, (a, b) => `${a}-${b}`);
      expect(memo(1, 1)).toBe(2);
      expect(memo(1, 5)).toBe(6);
      expect(inner).toHaveBeenCalledTimes(2);
    });

    test("should expose a mutable Map cache", () => {
      const memo = memoize((x: number) => x * 2);
      memo(2);
      expect(memo.cache).toBeInstanceOf(Map);
      expect(memo.cache.get(2)).toBe(4);
      memo.cache.set(2, 99);
      expect(memo(2)).toBe(99);
      memo.cache.clear();
      expect(memo(2)).toBe(4);
    });

    test("should cache undefined results", () => {
      const inner = vi.fn((_key: number) => undefined);
      const memo = memoize(inner);
      memo(1);
      memo(1);
      expect(inner).toHaveBeenCalledTimes(1);
    });

    test("should use object identity as the key when the first argument is an object", () => {
      const inner = vi.fn((o: { v: number }) => o.v);
      const memo = memoize(inner);
      memo({ v: 1 });
      memo({ v: 1 });
      // NOTE: a Map keys by reference, so structurally equal objects miss the cache.
      expect(inner).toHaveBeenCalledTimes(2);
    });

    test("should throw a TypeError for a non-function argument", () => {
      expect(() => memoize(undefined as unknown as () => void)).toThrow(TypeError);
      expect(() => memoize((x: number) => x, "nope" as unknown as (x: number) => string)).toThrow(
        TypeError
      );
    });

    test("should not throw when the resolver is null", () => {
      // NOTE: the guard is `resolver != null`, so an explicit null resolver is
      // accepted and falls back to the default args[0] key.
      expect(() =>
        memoize((x: number) => x, null as unknown as (x: number) => string)
      ).not.toThrow();
    });

    test("should not forward `this` to the wrapped function", () => {
      const inner = vi.fn(function (this: unknown, _key: string) {
        return this;
      });
      const memo = memoize(inner);
      // NOTE: memoized is an arrow function, so the caller's `this` is dropped.
      expect(memo.call({ v: 1 }, "k")).not.toEqual({ v: 1 });
    });
  });

  describe("foldPattern", () => {
    test("should call and return the matching branch", () => {
      expect(
        foldPattern("a", {
          a: () => "A",
          b: () => "B",
        })
      ).toBe("A");
    });

    test("should evaluate only the matching branch", () => {
      const other = vi.fn(() => "B");
      foldPattern("a", { a: () => "A", b: other });
      expect(other).not.toHaveBeenCalled();
    });

    test("should throw a descriptive error for an unknown key", () => {
      expect(() => foldPattern("c", { a: () => "A" })).toThrow(
        "[foldPattern] No definition provided for key: c"
      );
    });

    test("should throw when the pattern entry is not a function", () => {
      expect(() => foldPattern("a", { a: "A" as unknown as () => string })).toThrow(
        "[foldPattern]"
      );
    });

    test("should resolve inherited Object.prototype keys", () => {
      // NOTE: bug. The lookup is a plain property read, so "constructor" and
      // "toString" resolve through the prototype chain and get invoked.
      expect(() => foldPattern("toString", {})).not.toThrow();
    });
  });

  describe("is* predicates", () => {
    describe("isString", () => {
      test("should be true for primitive and boxed strings", () => {
        expect(isString("a")).toBe(true);
        // NOTE: the Object.prototype.toString check also accepts boxed String objects.
        expect(isString(new String("a"))).toBe(true);
      });

      test("should be false for non-strings", () => {
        expect(isString(1)).toBe(false);
        expect(isString(null)).toBe(false);
        expect(isString(undefined)).toBe(false);
        expect(isString(["a"])).toBe(false);
      });
    });

    describe("isNumber", () => {
      test("should be true for numbers, including Infinity", () => {
        expect(isNumber(1)).toBe(true);
        expect(isNumber(0)).toBe(true);
        expect(isNumber(Number.POSITIVE_INFINITY)).toBe(true);
      });

      test("should be false for NaN", () => {
        expect(isNumber(Number.NaN)).toBe(false);
      });

      test("should be true for boxed numbers", () => {
        // NOTE: same boxing quirk as isString.
        expect(isNumber(new Number(1))).toBe(true);
      });

      test("should be false for numeric strings", () => {
        expect(isNumber("1")).toBe(false);
      });
    });

    describe("isNull", () => {
      test("should be true only for null", () => {
        expect(isNull(null)).toBe(true);
        expect(isNull(undefined)).toBe(false);
        expect(isNull(0)).toBe(false);
      });
    });

    describe("isFunction", () => {
      test("should be true for functions and classes", () => {
        expect(isFunction(() => undefined)).toBe(true);
        expect(isFunction(class {})).toBe(true);
        expect(isFunction(Math.max)).toBe(true);
      });

      test("should be false for non-functions", () => {
        expect(isFunction({})).toBe(false);
        expect(isFunction(null)).toBe(false);
      });
    });

    describe("isObject", () => {
      test("should be true for objects, arrays and functions", () => {
        expect(isObject({})).toBe(true);
        expect(isObject([])).toBe(true);
        // NOTE: functions are objects by this test, unlike a typeof === "object" check.
        expect(isObject(() => undefined)).toBe(true);
      });

      test("should be false for primitives, null and undefined", () => {
        expect(isObject(1)).toBe(false);
        expect(isObject("a")).toBe(false);
        expect(isObject(null)).toBe(false);
        expect(isObject(undefined)).toBe(false);
      });
    });

    describe("isSelection", () => {
      test("should be true for a d3 selection", () => {
        expect(isSelection(select(document.createElement("div")))).toBe(true);
      });

      test("should be false for raw elements and other values", () => {
        expect(isSelection(document.createElement("div"))).toBe(false);
        expect(isSelection({})).toBe(false);
        expect(isSelection(null)).toBe(false);
      });
    });
  });

  describe("array helpers", () => {
    describe("every", () => {
      test("should test all elements and short-circuit on failure", () => {
        expect(every((d: number) => d > 0, [1, 2])).toBe(true);
        const predicate = vi.fn((d: number) => d > 1);
        expect(every(predicate, [1, 2])).toBe(false);
        expect(predicate).toHaveBeenCalledTimes(1);
      });

      test("should be true for an empty array", () => {
        expect(every(() => false, [])).toBe(true);
      });
    });

    describe("some", () => {
      test("should short-circuit on the first pass", () => {
        const predicate = vi.fn((d: number) => d === 1);
        expect(some(predicate, [1, 2])).toBe(true);
        expect(predicate).toHaveBeenCalledTimes(1);
      });

      test("should be false for an empty array", () => {
        expect(some(() => true, [])).toBe(false);
      });
    });

    describe("filledArray", () => {
      test("should build an array of the given length", () => {
        expect(filledArray(3, 0)).toEqual([0, 0, 0]);
        expect(filledArray(0, 0)).toEqual([]);
      });

      test("should share the same reference for object fill values", () => {
        // NOTE: the fill value is not cloned — every slot is the same object.
        const result = filledArray(2, { a: 1 });
        expect(result[0]).toBe(result[1]);
      });
    });

    describe("first and last", () => {
      test("should return the boundary elements", () => {
        expect(first([1, 2, 3])).toBe(1);
        expect(last([1, 2, 3])).toBe(3);
      });

      test("should return undefined for an empty array", () => {
        expect(first([])).toBeUndefined();
        expect(last([])).toBeUndefined();
      });
    });
  });

  describe("not", () => {
    test("should invert the truthiness of the result", () => {
      expect(not((d: number) => d > 1)(2)).toBe(false);
      expect(not((d: number) => d > 1)(0)).toBe(true);
      // NOTE: the result is coerced to a boolean, so non-boolean returns work too.
      expect(not((d: string) => d)("")).toBe(true);
    });

    test("should forward all arguments and `this`", () => {
      const inner = vi.fn(function (this: { v: boolean }, ..._args: number[]) {
        return this.v;
      });
      const context = { v: true };
      expect(not(inner).call(context, 1, 2)).toBe(false);
      expect(inner.mock.calls[0]).toEqual([1, 2]);
    });
  });

  describe("stringEqual", () => {
    test("should compare values by their string form", () => {
      expect(stringEqual(new Date(0), new Date(0))).toBe(true);
      expect(stringEqual(1, "1")).toBe(true);
      expect(stringEqual("a", "b")).toBe(false);
    });

    test("should treat all plain objects as equal", () => {
      // NOTE: both stringify to "[object Object]".
      expect(stringEqual({ a: 1 } as object, { b: 2 } as object)).toBe(true);
    });
  });

  describe("firstTouch", () => {
    const touch = (id: number) => ({ identifier: id }) as Touch;

    test("should prefer event.touches", () => {
      const event = {
        touches: [touch(1)],
        changedTouches: [touch(2)],
      } as unknown as TouchEvent;
      expect(firstTouch(event)?.identifier).toBe(1);
    });

    test("should fall back to changedTouches when touches is empty", () => {
      const event = {
        touches: [],
        changedTouches: [touch(2)],
      } as unknown as TouchEvent;
      expect(firstTouch(event)?.identifier).toBe(2);
    });

    test("should return null when neither list has touches", () => {
      expect(firstTouch({ touches: [], changedTouches: [] } as unknown as TouchEvent)).toBeNull();
      expect(firstTouch({} as TouchEvent)).toBeNull();
    });
  });
});
