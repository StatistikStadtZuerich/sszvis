// Base styles

const baseTextStyle = {
  fontStyle: "normal",
  fontWeight: 400,
  textRendering: "optimizeLegibility",
  WebkitFontSmoothing: "antialiased",
  MozOsxFontSmoothing: "grayscale",
};

// Helpers

// Modular scale font size helper; level can be negative (for smaller font sizes) and positive (for larger font sizes) integers; level 0 === baseFontSize
export const getFontSize = ({ baseFontSize, msRatio }, level = 0) =>
  `${baseFontSize * Math.pow(msRatio, level)}px`;

// Exports

// Text font style
export const text = (theme, level = 0) => ({
  ...baseTextStyle,
  color: theme.textColor,
  fontFamily: theme.fontFamily,
  fontSize: getFontSize(theme, level),
  lineHeight: theme.msRatio * theme.msRatio,
});
