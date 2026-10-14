/**
 * `nprogress-next-vue` — the Vue 3 adapter for
 * [`nprogress-next`](https://github.com/Naaach/nprogress-next).
 *
 * ```ts
 * import { ProgressBar, useProgress, NProgressNext } from "nprogress-next-vue";
 * ```
 *
 * The core package is not re-implemented here: it is imported, so the adapter
 * inherits its semantics, its accessible markup and its settings object
 * verbatim. Only the framework-facing pieces — a render-function component, a
 * composable and an installable plugin — are added on top.
 */

export { ProgressBar, type ProgressBarStyle } from "./ProgressBar";
export { NProgressNext } from "./plugin";
export { useProgress, type UseProgressReturn } from "./useProgress";

/**
 * The adapter stylesheet as a string, for SSR frameworks and hand-rolled
 * `<style>` injection. Single source of truth: `styles.css`, which is also
 * shipped as `nprogress-next-vue/styles.css`.
 */
export { styles } from "./styles";

/* Re-exported so a Vue app never has to depend on the core package directly to
 * configure the instance `useProgress()` hands back. */
export {
  createProgress,
  defaultSettings,
  injectStyles,
  NProgress,
  version,
} from "nprogress-next";
export type { ProgressInstance, ProgressOptions, ProgressSettings } from "nprogress-next";