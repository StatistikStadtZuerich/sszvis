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
  MEMOIZE_CACHE_LIMIT,
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

    // The motivating case: d3 calls an accessor with (datum, index, group), and arity(1, ...)
    // exists so an accessor that must not see index or group never does.
    test("should hide index and group from an accessor when it is used with d3 .attr()", () => {
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
    test.each([
      ["a", { a: 1 }, 1],
      ["b", { a: 1 }, undefined],
      [1, { 1: "b" }, "b"],
    ] as [string | number, Record<string | number, unknown>, unknown][])(
      "should return the object's own value when reading key %s of %j, namely %s",
      (key, object, expected) => {
        expect(prop(key)(object)).toBe(expected);
      },
    );

    test("should throw when applied to undefined", () => {
      // NOTE: prop does no guarding — use propOr when the object may be missing.
      expect(() => prop("a")(undefined as unknown as Record<string, number>)).toThrow();
    });
  });

  describe("propOr", () => {
    test.each([
      ["the property value", "a", 99, { a: 1 }, 1],
      ["the default, because the property is missing", "b", 99, { a: 1 }, 99],
      ["the default, because the object is undefined", "a", 99, undefined, 99],
      ["undefined, because no default was given", "b", undefined, { a: 1 }, undefined],
      ["null unchanged, because only undefined triggers the default", "a", 99, { a: null }, null],
      ["0 unchanged, because only undefined triggers the default", "a", 99, { a: 0 }, 0],
      ['"" unchanged, because only undefined triggers the default', "a", 99, { a: "" }, ""],
    ] as [string, string, unknown, Record<string, unknown> | undefined, unknown][])(
      "should return %s",
      (_label, key, defaultVal, object, expected) => {
        expect(propOr(key, defaultVal)(object)).toBe(expected);
      },
    );

    test("should return the default for an explicitly undefined property value", () => {
      // NOTE: propOr cannot distinguish "absent" from "present but undefined".
      expect(propOr("a", 99)({ a: undefined })).toBe(99);
    });

    test("should throw when applied to null", () => {
      // NOTE: only `undefined` is guarded, not `null`.
      expect(() => propOr("a", 99)(null as unknown as Record<string, number>)).toThrow();
    });
  });

  // functor and valueFn are separate exports stating one contract twice, so the contract is
  // stated once here with a row each: a mutation in either one still fails its own row.
  describe("functor and valueFn", () => {
    const wrappers = [
      ["functor", functor],
      ["valueFn", valueFn],
    ] as [string, (value: unknown) => unknown][];

    test.each(wrappers)(
      "should wrap a constant in a function when %s is given a non-function",
      (_name, wrap) => {
        expect((wrap(5) as () => unknown)()).toBe(5);
        expect((wrap(null) as () => unknown)()).toBeNull();
      },
    );

    test.each(wrappers)(
      "should return the same reference when %s is given a function",
      (_name, wrap) => {
        const f = (d: unknown) => d;
        expect(wrap(f)).toBe(f);
      },
    );
  });

  describe("valueFn", () => {
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

  // set, derivedSet and hashableSet dedupe by three different rules, but they agree on how a
  // list of primitives comes out, on the accessor contract, and on empty input. Those are
  // stated once here; the rules they disagree about stay in the per-function blocks below.
  describe("set, derivedSet and hashableSet", () => {
    const setLikes = [
      ["set", set],
      ["derivedSet", derivedSet],
      ["hashableSet", hashableSet],
    ] as [
      string,
      <T extends string | number>(
        arr: T[],
        acc?: (value: T, index: number, array: T[]) => T,
      ) => T[],
    ][];

    test.each(setLikes)(
      "should return unique primitives in order of first appearance from %s",
      (_name, setLike) => {
        expect(setLike([2, 1, 1, 6, 8, 6, 5, 3])).toEqual([2, 1, 6, 8, 5, 3]);
        expect(setLike(["b", "a", "b", "b"])).toEqual(["b", "a"]);
      },
    );

    test.each(setLikes)(
      "should pass value, index and array to the accessor given to %s",
      (_name, setLike) => {
        const acc = vi.fn((d: string) => d);
        const arr = ["a", "b"];
        setLike(arr, acc);
        expect(acc.mock.calls[0]).toEqual(["a", 0, arr]);
      },
    );

    test.each(setLikes)(
      "should return an empty array from %s for empty input",
      (_name, setLike) => {
        expect(setLike([])).toEqual([]);
      },
    );
  });

  describe("set", () => {
    test("should compare objects by reference", () => {
      const o1 = { a: 1 };
      const o2 = { a: 1 };
      expect(set([o1, o2, o1])).toEqual([o1, o2]);
    });

    test("should return the accessor's values, not the input elements", () => {
      expect(set([{ v: 1 }, { v: 2 }, { v: 1 }], (d) => d.v)).toEqual([1, 2]);
    });

    test("should collapse repeated NaN into one entry", () => {
      // NOTE: Array#includes uses SameValueZero, so NaN is treated as equal to NaN
      // here even though `===` would not.
      expect(set([Number.NaN, Number.NaN])).toEqual([Number.NaN]);
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
  });

  describe("hashableSet", () => {
    test("should return the accessor's values, not the input elements", () => {
      expect(hashableSet([{ v: "x" }, { v: "y" }, { v: "x" }], (d) => d.v)).toEqual(["x", "y"]);
    });

    test("should treat numbers and their string forms as the same key", () => {
      // NOTE: keys are stringified, which is what "hashable" means for this function,
      // so 1 and "1" collide — fn.set does not have this behaviour.
      expect(hashableSet([1, "1"] as (string | number)[])).toEqual([1]);
    });

    test("should dedupe falsy values like any other", () => {
      expect(hashableSet([0, 0, ""] as (string | number)[])).toEqual([0, ""]);
    });

    test("should keep values that name an Object.prototype member", () => {
      expect(hashableSet(["constructor", "a"])).toEqual(["constructor", "a"]);
      expect(hashableSet(["toString", "valueOf", "toString"])).toEqual(["toString", "valueOf"]);
    });
  });

  describe("defined", () => {
    test.each([
      [false, "undefined", undefined],
      [false, "null", null],
      [false, "NaN", Number.NaN],
      [true, "0", 0],
      [true, "the empty string", ""],
      [true, "false", false],
      [true, "an empty object", {}],
      [true, "an invalid Date", new Date(Number.NaN)],
    ] as [boolean, string, unknown][])(
      "should return %s when the value is %s",
      (expected, _label, value) => {
        expect(defined(value)).toBe(expected);
      },
    );
  });

  describe("contains", () => {
    test.each([
      [true, [1, 2, 3], 2],
      [false, [1, 2, 3], 4],
      [false, [], 1],
    ] as [boolean, number[], number][])(
      "should return %s when searching %j for %s",
      (expected, list, needle) => {
        expect(contains(list, needle)).toBe(expected);
      },
    );

    test("should compare objects by reference", () => {
      const o = { a: 1 };
      expect(contains([o], o)).toBe(true);
      expect(contains([{ a: 1 }], { a: 1 })).toBe(false);
    });

    test("should find NaN", () => {
      // NOTE: Array#includes uses SameValueZero, so NaN is findable here.
      expect(contains([Number.NaN], Number.NaN)).toBe(true);
    });
  });

  describe("find", () => {
    test.each([
      [2, [1, 2, 3], 1],
      [undefined, [1, 2, 3], 5],
      [undefined, [], 0],
    ] as [number | undefined, number[], number][])(
      "should return %s when searching %j for the first element greater than %s",
      (expected, arr, threshold) => {
        expect(find((d: number) => d > threshold, arr)).toBe(expected);
      },
    );

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
    test.each([
      [
        [
          [1, 2],
          [3, 4],
        ],
        [1, 2, 3, 4],
      ],
      [
        [[[1]], [[2]]],
        [[1], [2]],
      ],
      [[], []],
      [[[], []], []],
    ] as [unknown[][], unknown[]][])(
      "should flatten %j into %j, removing exactly one level of nesting",
      (input, expected) => {
        expect(flatten(input)).toEqual(expected);
      },
    );

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

    test("should refuse a multi-argument call when no resolver is given", () => {
      // The default cache key is args[0] alone, so answering a two-argument call would
      // mean returning the first call's result for any differing second argument.
      const inner = vi.fn((a: number, b: number) => a + b);
      const memo = memoize(inner);
      expect(() => memo(1, 1)).toThrow(TypeError);
      expect(inner).not.toHaveBeenCalled();
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

    test("should evict the least recently used entry beyond the cache limit", () => {
      const inner = vi.fn((x: number) => x * 2);
      const memo = memoize(inner);
      for (let i = 0; i < MEMOIZE_CACHE_LIMIT + 5; i++) memo(i);
      expect(memo.cache.size).toBe(MEMOIZE_CACHE_LIMIT);
      // The five oldest keys were dropped; the newest are still there.
      expect(memo.cache.has(0)).toBe(false);
      expect(memo.cache.has(4)).toBe(false);
      expect(memo.cache.has(5)).toBe(true);
      expect(memo.cache.has(MEMOIZE_CACHE_LIMIT + 4)).toBe(true);
    });

    test("should keep a repeatedly read entry alive across evictions", () => {
      // The sizes a resizing chart revisits are few: a hit must not be evicted by the debris of
      // the keys passed once during a drag.
      const memo = memoize((x: number) => x * 2);
      memo(0);
      for (let i = 1; i < MEMOIZE_CACHE_LIMIT * 2; i++) {
        memo(i);
        memo(0);
      }
      expect(memo.cache.has(0)).toBe(true);
    });

    test("should trim a cache filled past the limit from outside on a hit", () => {
      // `.cache` is public, so entries can arrive without going through the memoized function. A
      // read of an existing key restores the bound just as a miss does, and keeps its own entry.
      const memo = memoize((x: number) => x * 2);
      for (let i = 0; i < MEMOIZE_CACHE_LIMIT + 1; i++) memo.cache.set(i, i * 2);
      expect(memo.cache.size).toBe(MEMOIZE_CACHE_LIMIT + 1);
      expect(memo(0)).toBe(0);
      expect(memo.cache.size).toBe(MEMOIZE_CACHE_LIMIT);
      expect(memo.cache.has(0)).toBe(true);
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
        TypeError,
      );
    });

    test("should not throw when the resolver is null", () => {
      // NOTE: the guard is `resolver != null`, so an explicit null resolver is
      // accepted and falls back to the default args[0] key.
      expect(() =>
        memoize((x: number) => x, null as unknown as (x: number) => string),
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
        }),
      ).toBe("A");
    });

    test("should evaluate only the matching branch", () => {
      const other = vi.fn(() => "B");
      foldPattern("a", { a: () => "A", b: other });
      expect(other).not.toHaveBeenCalled();
    });

    test("should throw a descriptive error for an unknown key", () => {
      expect(() => foldPattern("c", { a: () => "A" })).toThrow(
        "[foldPattern] No definition provided for key: c",
      );
    });

    test("should throw when the pattern entry is not a function", () => {
      expect(() => foldPattern("a", { a: "A" as unknown as () => string })).toThrow(
        "[foldPattern]",
      );
    });

    test("should resolve inherited Object.prototype keys", () => {
      // NOTE: bug. The lookup is a plain property read, so "constructor" and
      // "toString" resolve through the prototype chain and get invoked.
      expect(() => foldPattern("toString", {})).not.toThrow();
    });
  });

  describe("is* predicates", () => {
    // One row per value, one column per predicate, so a value's full classification is visible
    // at a glance and a predicate that starts agreeing with another shows up as a changed column.
    test.each([
      // label, value, isString, isNumber, isNull, isFunction, isObject
      ['the string "a"', "a", true, false, false, false, false],
      ['the numeric string "1"', "1", true, false, false, false, false],
      ["the number 1", 1, false, true, false, false, false],
      ["the number 0", 0, false, true, false, false, false],
      ["Infinity", Number.POSITIVE_INFINITY, false, true, false, false, false],
      ["NaN", Number.NaN, false, false, false, false, false],
      ["null", null, false, false, true, false, false],
      ["undefined", undefined, false, false, false, false, false],
      ["an array of strings", ["a"], false, false, false, false, true],
      ["an empty object", {}, false, false, false, false, true],
      ["an empty array", [], false, false, false, false, true],
      ["an arrow function", () => undefined, false, false, false, true, true],
      ["a class", class {}, false, false, false, true, true],
      ["a built-in function", Math.max, false, false, false, true, true],
    ] as [string, unknown, boolean, boolean, boolean, boolean, boolean][])(
      "should classify %s as isString=%s isNumber=%s isNull=%s isFunction=%s isObject=%s",
      (_label, value, expectString, expectNumber, expectNull, expectFunction, expectObject) => {
        expect(isString(value)).toBe(expectString);
        expect(isNumber(value)).toBe(expectNumber);
        expect(isNull(value)).toBe(expectNull);
        expect(isFunction(value)).toBe(expectFunction);
        expect(isObject(value)).toBe(expectObject);
      },
    );

    describe("isString", () => {
      test("should be true for primitive and boxed strings", () => {
        expect(isString("a")).toBe(true);
        // NOTE: the Object.prototype.toString check also accepts boxed String objects.
        expect(isString(new String("a"))).toBe(true);
      });
    });

    describe("isNumber", () => {
      test("should be true for boxed numbers", () => {
        // NOTE: same boxing quirk as isString.
        expect(isNumber(new Number(1))).toBe(true);
      });
    });

    describe("isObject", () => {
      test("should be true for objects, arrays and functions", () => {
        expect(isObject({})).toBe(true);
        expect(isObject([])).toBe(true);
        // NOTE: functions are objects by this test, unlike a typeof === "object" check.
        expect(isObject(() => undefined)).toBe(true);
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
    describe("every and some", () => {
      const isPositive = (d: number) => d > 0;

      test.each([
        [true, [1, 2]],
        [false, [1, -1]],
        [true, []],
      ] as [boolean, number[]][])("should return %s from every for %j", (expected, arr) => {
        expect(every(isPositive, arr)).toBe(expected);
      });

      test.each([
        [true, [1, 2]],
        [false, [-1, -2]],
        [false, []],
      ] as [boolean, number[]][])("should return %s from some for %j", (expected, arr) => {
        expect(some(isPositive, arr)).toBe(expected);
      });

      test("should stop calling the predicate once the answer is decided", () => {
        const everyPredicate = vi.fn((d: number) => d > 1);
        expect(every(everyPredicate, [1, 2])).toBe(false);
        expect(everyPredicate).toHaveBeenCalledTimes(1);

        const somePredicate = vi.fn((d: number) => d === 1);
        expect(some(somePredicate, [1, 2])).toBe(true);
        expect(somePredicate).toHaveBeenCalledTimes(1);
      });
    });

    describe("filledArray", () => {
      test.each([
        [3, 0, [0, 0, 0]],
        [0, 0, []],
      ] as [number, number, number[]][])(
        "should build %s slots of %s, namely %j",
        (len, val, expected) => {
          expect(filledArray(len, val)).toEqual(expected);
        },
      );

      test("should share the same reference for object fill values", () => {
        // NOTE: the fill value is not cloned — every slot is the same object.
        const result = filledArray(2, { a: 1 });
        expect(result[0]).toBe(result[1]);
      });
    });

    describe("first and last", () => {
      test.each([
        [[1, 2, 3], 1, 3],
        [[], undefined, undefined],
      ] as [number[], number | undefined, number | undefined][])(
        "should return the boundary elements of %j, namely %s first and %s last",
        (arr, expectedFirst, expectedLast) => {
          expect(first(arr)).toBe(expectedFirst);
          expect(last(arr)).toBe(expectedLast);
        },
      );
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
