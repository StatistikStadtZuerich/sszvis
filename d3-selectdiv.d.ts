import type { AnySelection } from "./types.js";
/**
 * d3.selection plugin to simplify creating idempotent divs that are not
 * recreated when rendered again.
 *
 * @see https://github.com/mbostock/d3/wiki/Selections
 *
 * @param {String} key - the name of the group
 * @return {d3.selection}
 */
declare module "d3" {
    interface Selection<GElement, Datum, PElement, PDatum> {
        selectDiv(key: string): AnySelection;
    }
}
//# sourceMappingURL=d3-selectdiv.d.ts.map