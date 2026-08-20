import { functor } from '../fn.js';

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

export { modularTextHTML, modularTextSVG };
//# sourceMappingURL=modularText.js.map
