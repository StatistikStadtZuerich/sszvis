/** Chart title, as a string literal. */
declare const __TITLE_TEXT__: string;
/** Chart description, as a string literal. */
declare const __DESCRIPTION__: string;

/** The `actions` parameter of `render`, named `_actions` when unused. */
declare const __ACTIONS_PARAM__: unknown;

/** The empty case; features with handlers substitute an object type. */
type __ACTIONS_TYPE__ = Record<string, never>;

/** The reference lines, as an array literal; the template's constant supplies the element type. */
declare const __REFERENCE_LINES__: never[];

// Bar chart

/** The single series' name, which is also its key in the colour scale. */
declare const __SERIES_KEY__: string;
/** CSV column holding the bar's category. */
declare const __CATEGORY_FIELD__: string;
/** CSV column holding the bar's value. */
declare const __VALUE_FIELD__: string;
/** The bar's fill: one colour, or an accessor once tooltips are on. */
declare const __BAR_FILL__: string;
/** The tooltip's text: a `modularTextHTML` chain over the roles `spec.tooltip` names. */
declare const __TOOLTIP_TEXT__: ReturnType<typeof sszvis.modularTextHTML>;

// Line chart

/** CSV column holding the date. */
declare const __DATE_FIELD__: string;
/** How a row's category is read - a column, or `""` for a single series. */
declare const __CATEGORY_EXPR__: string;
declare const __X_LABEL__: string;
declare const __Y_LABEL__: string;
/** The colour scale: the library's own, or the legend's once it is on. */
declare const __C_SCALE__: ReturnType<typeof sszvis.scaleQual12>;
/** Space under the chart, which the legend grows when it is on. */
declare const __BOTTOM_PADDING__: number;
/** The ruler's label: a `modularTextSVG` chain over the roles `spec.tooltip` names. */
declare const __RULER_LABEL__: ReturnType<typeof sszvis.modularTextSVG>;
