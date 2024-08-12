const PATH = require("node:path");
const babel = require("@babel/core");
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
   * Not familiar with eleventy, but it seems to not rewrite the whole build folder,
   * which lead to not having the js files in the build folder on the first build.
   */
  eleventyConfig.addPassthroughCopy("docs/**/*.js");

  eleventyConfig.addWatchTarget("docs/**/*.js");

  /**
   * printFileContents
   *
   * This shortcode is used to print the contents of a JavaScript file (or any
   * file, for that matter) into a template. It takes the content of what is
   * exported using "modules.export = …" and prints it verbatim.
   */
  eleventyConfig.addShortcode("printFileContents", function (relativePath) {
    const path = PATH.join(__dirname, PATH.dirname(this.page.inputPath), relativePath);
    const { code } = babel.transformFileSync(path, {
      sourceType: "script",
      generatorOpts: {
        compact: false,
        retainLines: true,
        shouldPrintComment: (val) => !/^\s*global\s/.test(val),
      },
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
    templateFormats: ["html", "njk", "11ty.js"],
  };
};
