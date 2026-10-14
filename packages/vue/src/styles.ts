import css from "./styles.css";

/**
 * The adapter stylesheet as a string.
 *
 * Single source of truth: `styles.css`. The build inlines this (minified) into
 * `dist/index.js` *and* writes it out as `dist/styles.css`, so a consumer can
 * either `import "nprogress-next-vue/styles.css"` or inject `styles` by hand
 * and get byte-identical results.
 */
export const styles: string = css;
export default styles;