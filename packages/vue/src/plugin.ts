import type { App, Plugin } from "vue";
import { ProgressBar } from "./ProgressBar";

/**
 * Vue plugin for the `<ProgressBar />` component.
 *
 * ```ts
 * import { createApp } from "vue";
 * import NProgressNext from "nprogress-next-vue";
 *
 * createApp(App).use(NProgressNext).mount("#app");
 * ```
 *
 * Then `<ProgressBar :progress="p" />` works in any template without a local
 * import.
 *
 * Deliberately a **plain object**, not a function: Vue's `app.use()` calls
 * `install(app, ...options)` on whatever it is given, so `app.use(NProgressNext)`
 * is the idiomatic call and reads better than `app.use(install)`. It also keeps
 * the export tree-shakeable — bundlers can see that nothing else in this module
 * has side effects.
 */
export const NProgressNext: Plugin = {
  install(app: App): void {
    app.component("ProgressBar", ProgressBar);
  },
};