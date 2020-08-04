// This is the more strict version of `isNaN`. We need to polyfill it for Internet Explorer,
// all other browsers support this.
// See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isNaN

Number.isNaN =
  Number.isNaN ||
  function isNaN(input) {
    return typeof input === "number" && input !== input;
  };
