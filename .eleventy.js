const PATH = require("path");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("docs/src/_headers");
  eleventyConfig.addPassthroughCopy("docs/src/index.html");
  eleventyConfig.addPassthroughCopy("docs/src/template.html");
  eleventyConfig.addPassthroughCopy("docs/src/**/*.css");
  eleventyConfig.addPassthroughCopy("docs/src/**/*.csv");
  eleventyConfig.addPassthroughCopy("docs/src/**/*.md");
  eleventyConfig.addPassthroughCopy("docs/src/**/*.png");

  /**
   * printFileContents
   *
   * This shortcode is used to print the contents of a JavaScript file (or any
   * file, for that matter) into a template. It takes the content of what is
   * exported using "modules.export = …" and prints it verbatim.
   */
  eleventyConfig.addShortcode("printFileContents", function (relativePath) {
    const path = PATH.join(__dirname, PATH.dirname(this.page.inputPath), relativePath);
    return require(path).toString();
  });

  return {
    dir: {
      input: "docs/src",
      output: "build",
    },
    htmlTemplateEngine: "njk",
    templateFormats: ["html", "njk"],
  };
};
