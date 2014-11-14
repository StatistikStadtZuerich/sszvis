/**
 * ModularText component
 *
 * @return {@function} returns a configurable, callable class
 *
 * use like so:
 * modularText.html()
 *   .plain(function(d) { return d.name; })
 *   .plain(function(d) { return d.place; })
 *   .newline()
 *   .bold(function(d) { return d.value; })
 *   .italic(function(d) { return d.caption; })
 *
 * returns a function which, when called on a datum, produces a text string
 * by calling on the datum, in sequence, the provided functions,
 * with the result of each function formatted in the manner
 * described by the name of the method which was used to add it.
 */
namespace('sszvis.component.modularText', function(module) {
  'use strict';

  function formatHTML() {
    var styles = {
      plain: function(d){ return d;},
      italic: function(d){ return '<em>' + d + '</em>';},
      bold: function(d){ return '<strong>' + d + '</strong>';}
    };

    return function(textBody, datum) {
      return textBody.lines().map(function(line) {
        return line.map(function(word) {
          return styles[word.style].call(null, word.text(datum));
        }).join(' ');
      }).join('<br/>');
    };
  }

  function formatSVG() {
    var styles = {
      plain: function(d){ return '<tspan>' + d + '</tspan>'; },
      italic: function(d){ return '<tspan style="font-style:italic">' + d + '</tspan>'; },
      bold: function(d){ return '<tspan style="font-weight:bold">' + d + '</tspan>'; }
    };

    return function(textBody, datum) {
      return textBody.lines().reduce(function(svg, line, i) {
        var lineSvg = line.map(function(word) {
          return styles[word.style].call(null, word.text(datum));
        }).join(' ');
        var dy = (i === 0) ? 0 : '1.2em';
        return svg + '<tspan x="0" dy="'+ dy +'">' + lineSvg + '</tspan>';
      }, '');
    };
  }

  function structuredText() {
    var lines = [[]];

    return {
      addLine: function() {
        lines.push([]);
      },

      addWord: function(style, text) {
        sszvis.fn.last(lines).push({
          text: d3.functor(text),
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

      ['bold', 'italic', 'plain'].forEach(function(style) {
        makeText[style] = function(text) {
          textBody.addWord(style, text);
          return makeText;
        };
      });

      return makeText;
    };
  }

  module.exports = {
    html: makeTextWithFormat(formatHTML()),
    svg:  makeTextWithFormat(formatSVG())
  };

});
