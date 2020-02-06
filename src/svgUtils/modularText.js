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
 * var fmtHtml = sszvis.svgUtils.modularText.html()
 *   .plain('Artist:')
 *   .plain(function(d) { return d.name; })
 *   .newline()
 *   .bold(function(d) { return d.age; })
 *   .italic('years old');
 * fmtHtml({name: 'Patti', age: 67});
 * //=> "Artist: Patti<br/><strong>67</strong> <em>years old</em>"
 *
 * @example SVG
 * var fmtSvg = sszvis.svgUtils.modularText.svg()
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

function formatHTML() {
  var styles = {
    plain: function(d) {
      return d;
    },
    italic: function(d) {
      return "<em>" + d + "</em>";
    },
    bold: function(d) {
      return "<strong>" + d + "</strong>";
    }
  };

  return function(textBody, datum) {
    return textBody
      .lines()
      .map(function(line) {
        return line
          .map(function(word) {
            return styles[word.style].call(null, word.text(datum));
          })
          .join(" ");
      })
      .join("<br/>");
  };
}

function formatSVG() {
  var styles = {
    plain: function(d) {
      return "<tspan>" + d + "</tspan>";
    },
    italic: function(d) {
      return '<tspan style="font-style:italic">' + d + "</tspan>";
    },
    bold: function(d) {
      return '<tspan style="font-weight:bold">' + d + "</tspan>";
    }
  };

  return function(textBody, datum) {
    return textBody.lines().reduce(function(svg, line, i) {
      var lineSvg = line
        .map(function(word) {
          return styles[word.style].call(null, word.text(datum));
        })
        .join(" ");
      var dy = i === 0 ? 0 : "1.2em";
      return svg + '<tspan x="0" dy="' + dy + '">' + lineSvg + "</tspan>";
    }, "");
  };
}

function structuredText() {
  var lines = [[]];

  return {
    addLine: function() {
      lines.push([]);
    },

    addWord: function(style, text) {
      fn.last(lines).push({
        text: fn.functor(text),
        style: style
      });
    },

    lines: function() {
      return lines;
    }
  };
}

function makeTextWithFormat(format) {
  return function() {
    var textBody = structuredText();

    function makeText(d) {
      return format(textBody, d);
    }

    makeText.newline = function() {
      textBody.addLine();
      return makeText;
    };

    ["bold", "italic", "plain"].forEach(function(style) {
      makeText[style] = function(text) {
        textBody.addWord(style, text);
        return makeText;
      };
    });

    return makeText;
  };
}

export var modularTextHTML = makeTextWithFormat(formatHTML());
export var modularTextSVG = makeTextWithFormat(formatSVG());
