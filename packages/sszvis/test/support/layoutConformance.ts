import { describe, expect, test } from "vitest";

/**
 * The argument contract every pure layout in `src/layout` shares.
 *
 * `src/layout/validate.ts` states it in two halves, and this suite asserts both:
 *
 * - an argument that cannot describe any chart - negative, fractional where only whole items
 *   exist, outside `[0, 1]` for a ratio, or not a number at all - throws a `RangeError` naming
 *   the layout and the argument slot, before any dimension is computed;
 * - a zero size or a zero count is an ordinary runtime state and returns a zeroed layout.
 *
 * The suite is parameterised, never flattened: each caller supplies its own layout name, its
 * own slot list and its own expected zeroed objects, and every generated assertion is pinned to
 * that caller's data. The throw cases match `^<layoutName>: <slotName> ` anchored at the start
 * of the message, so dropping `requireCount` from one module fails that module's block and
 * leaves the other six green; the zeroed cases compare against a per-case `expected`, which the
 * layouts genuinely disagree about (sunburst echoes `numLayers`, the vertical bar chart echoes
 * `totalWidth`), so no shared "everything is zero" shortcut can stand in for them.
 *
 * `colorLegendLayout` and `smallMultiples` import none of `validate.js` and stay out.
 */

/** The validators in `src/layout/validate.ts`, and the values each one must reject. */
const REJECTED = {
  size: [
    { value: -1, because: "the size is negative" },
    { value: Number.NaN, because: "the size is not a number" },
  ],
  count: [
    { value: -3, because: "the count is negative" },
    { value: 2.5, because: "the count is fractional" },
    { value: Number.NaN, because: "the count is not a number" },
  ],
  ratio: [
    { value: -1, because: "the ratio is below 0" },
    { value: 4, because: "the ratio is above 1" },
    { value: Number.NaN, because: "the ratio is not a number" },
  ],
} satisfies Record<string, { value: number; because: string }[]>;

/** Which of the three validators guards a slot. */
type LayoutValidator = keyof typeof REJECTED;

/** One validated argument slot of a layout function. */
type LayoutSlot = {
  /** The slot name the layout passes to the validator, as it appears in the message. */
  name: string;
  /** Which of the three validators guards it. */
  kind: LayoutValidator;
  /** Calls the layout with `bad` in this slot and every other slot in range. */
  callWith: (bad: number) => void;
};

/** One degenerate-but-legal input and the zeroed layout it must return. */
type ZeroedCase<Layout> = {
  /** The condition, worded to finish a `when ...` clause. */
  when: string;
  call: () => Layout;
  expected: Layout;
};

/**
 * Registers the shared `the layout argument contract` block for one layout function.
 *
 * Callers keep their own clamping, proportionality and geometry tests: those limits are
 * heterogeneous across the family and a table over them would be a table of special cases.
 */
export function describesTheLayoutContract<Layout>(harness: {
  /** The layout name the validators prefix every message with. */
  layoutName: string;
  slots: LayoutSlot[];
  zeroed: ZeroedCase<Layout>[];
}): void {
  const { layoutName, slots, zeroed } = harness;

  describe("the layout argument contract", () => {
    for (const slot of slots) {
      for (const { value, because } of REJECTED[slot.kind]) {
        test(`should throw naming ${layoutName} and ${slot.name} when ${because}`, () => {
          const call = () => {
            slot.callWith(value);
          };
          expect(call).toThrow(RangeError);
          // The message opens with both the layout and the slot, so a module that stops
          // validating one argument fails here and nowhere else in the family.
          expect(call).toThrow(new RegExp(`^${layoutName}: ${slot.name} `, "u"));
        });
      }
    }

    for (const { when, call, expected } of zeroed) {
      test(`should return a zeroed layout when ${when}`, () => {
        expect(call()).toEqual(expected);
      });
    }
  });
}
