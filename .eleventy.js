const FS = require("fs");
const PATH = require("path");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("docs/src/_headers");
  eleventyConfig.addPassthroughCopy("docs/src/template.html");
  eleventyConfig.addPassthroughCopy("docs/src/**/*.css");
  eleventyConfig.addPassthroughCopy("docs/src/**/*.csv");
  eleventyConfig.addPassthroughCopy("docs/src/**/*.md");
  eleventyConfig.addPassthroughCopy("docs/src/**/*.png");

  eleventyConfig.addShortcode("printFileContents", function (relativePath) {
    const path = PATH.join(__dirname, PATH.dirname(this.page.inputPath), relativePath);
    return require(path).toString();
  });

  return {
    dir: {
      includes: "../_includes",
      input: "docs/src",
      output: "docs/static.preview",
    },
    htmlTemplateEngine: "njk",
    templateFormats: ["html", "njk"],
  };
};
