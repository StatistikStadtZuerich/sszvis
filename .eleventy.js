const FS = require("fs");
const PATH = require("path");
const babel = require("@babel/core");
const { COMMENT_KEYS } = require("@babel/types");
const prettier = require("prettier");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("docs/_headers");
  eleventyConfig.addPassthroughCopy("docs/index.html");
  eleventyConfig.addPassthroughCopy("docs/template.html");
  eleventyConfig.addPassthroughCopy("docs/**/*.css");
  eleventyConfig.addPassthroughCopy("docs/**/*.csv");
  eleventyConfig.addPassthroughCopy("docs/**/*.json");
  eleventyConfig.addPassthroughCopy("docs/**/*.md");
  eleventyConfig.addPassthroughCopy("docs/**/*.png");

  /**
   * printFileContents
   *
   * This shortcode is used to print the contents of a JavaScript file (or any
   * file, for that matter) into a template. It takes the content of what is
   * exported using "modules.export = …" and prints it verbatim.
   */
  eleventyConfig.addShortcode("printFileContents", function (relativePath) {
    const path = PATH.join(__dirname, PATH.dirname(this.page.inputPath), relativePath);
    // Concat shortcode + filecode before transform
    const { code } = babel.transformFileSync(path, {
      plugins: [BabelPluginRemoveGlobalHints],
    });
    return code;
  });

  eleventyConfig.addTransform("prettify", function (content, outputPath) {
    return outputPath.endsWith(".html") ? prettier.format(content, { parser: "html" }) : content;
  });

  return {
    dir: {
      input: "docs",
      output: "build",
    },
    htmlTemplateEngine: "njk",
    templateFormats: ["html", "njk"],
  };
};

// -----------------------------------------------------------------------------
// Babel Plugin

function BabelPluginRemoveGlobalHints() {
  return {
    visitor: {
      Program(path) {
        path.traverse({
          enter(path) {
            removeCommentMatchingRegexp(path.node, /^\s*global\s/);
          },
        });
      },
    },
  };
}

// -----------------------------------------------------------------------------
// Helpers

function removeCommentMatchingRegexp(node, regexp) {
  COMMENT_KEYS.forEach((key) => {
    if (Array.isArray(node[key])) {
      node[key] = node[key].filter((x) => !(x.type === "CommentBlock" && regexp.test(x.value)));
    }
  });
}
