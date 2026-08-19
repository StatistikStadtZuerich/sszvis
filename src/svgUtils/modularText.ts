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
 * @property {string, function} plain  String without formatting
 * @property {string, function} italic String with italic style
 * @property {string, function} bold   String with bold style
 * @property newline                   Insert a line break
 *
 * @return {function} Formatting function that accepts a datum
 */

import * as fn from "../fn.js";

/** The three styles a word can be rendered in. */
type TextStyle = "plain" | "italic" | "bold";

const TEXT_STYLES = ["bold", "italic", "plain"] as const;

/** Renders a single word's value into its formatted representation. */
type StyleFormatter = (d: unknown) => unknown;

/** A single word of a line: its style and an accessor for its text. */
interface Word {
  text: (datum?: unknown) => unknown;
  style: TextStyle;
}

type Line = Word[];

/** Accumulates the lines and words configured on a builder. */
interface TextBody {
  addLine(): void;
  addWord(style: TextStyle, text: unknown): void;
  lines(): Line[];
}

/** Turns an accumulated text body and a datum into a formatted string. */
type Format = (textBody: TextBody, datum?: unknown) => string;

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

function formatHTML(): Format {
  const styles: Record<TextStyle, StyleFormatter> = {
    plain: (d) => d,
    italic: (d) => `<em>${d}</em>`,
    bold: (d) => `<strong>${d}</strong>`,
  };

  return (textBody, datum) =>
    textBody
      .lines()
      .map((line) => line.map((word) => styles[word.style](word.text(datum))).join(" "))
      .join("<br/>");
}

function formatSVG(): Format {
  const styles: Record<TextStyle, StyleFormatter> = {
    plain: (d) => `<tspan>${d}</tspan>`,
    italic: (d) => `<tspan style="font-style:italic">${d}</tspan>`,
    bold: (d) => `<tspan style="font-weight:bold">${d}</tspan>`,
  };

  return (textBody, datum) =>
    textBody.lines().reduce((svg, line, i) => {
      const lineSvg = line.map((word) => styles[word.style](word.text(datum))).join(" ");
      const dy = i === 0 ? 0 : "1.2em";
      return `${svg}<tspan x="0" dy="${dy}">${lineSvg}</tspan>`;
    }, "");
}

function structuredText(): TextBody {
  // Always holds at least one line, so the index in addWord is always in range.
  const lines: Line[] = [[]];

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
        text: fn.functor(text) as (datum?: unknown) => unknown,
        style,
      });
    },

    lines() {
      return lines;
    },
  };
}

function makeTextWithFormat(format: Format): () => ModularTextBuilder {
  return () => {
    const textBody = structuredText();

    // A callable object: the chaining methods are attached below, so the function has to
    // be narrowed to the builder interface up front.
    const makeText = ((d?: unknown) => format(textBody, d)) as ModularTextBuilder;

    makeText.newline = () => {
      textBody.addLine();
      return makeText;
    };

    for (const style of TEXT_STYLES) {
      makeText[style] = (text: unknown) => {
        textBody.addWord(style, text);
        return makeText;
      };
    }

    return makeText;
  };
}

export const modularTextHTML = makeTextWithFormat(formatHTML());
export const modularTextSVG = makeTextWithFormat(formatSVG());
