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
/**
 * A chainable text builder. Calling it with a datum returns the formatted string.
 * The `plain`, `italic` and `bold` methods each accept either a constant value or
 * an accessor function which is called with the datum.
 */
export interface ModularTextBuilder {
    (datum?: unknown): string;
    newline(): ModularTextBuilder;
    plain(text: unknown): ModularTextBuilder;
    italic(text: unknown): ModularTextBuilder;
    bold(text: unknown): ModularTextBuilder;
}
export declare const modularTextHTML: () => ModularTextBuilder;
export declare const modularTextSVG: () => ModularTextBuilder;
//# sourceMappingURL=modularText.d.ts.map