import NProgress, { createProgress, defaultSettings, injectStyles, version } from "./core";
import { styles } from "./styles";

/**
 * Browser global entry (`<script>` tag).
 *
 * Exposes `window.NProgressNext` as a thin facade that forwards every member of
 * the shared singleton, so CDN users can write `NProgressNext.start()` exactly
 * like the original `NProgress.start()`, while the named helpers stay available
 * as properties. Every public member of `ProgressInstance` is forwarded —
 * including `getPositioningCSS()` and `subscribe()`, which are easy to forget
 * and impossible to reach if they only exist on the module export.
 *
 * The shared singleton is deliberately *not* mutated: `Object.assign(NProgress, …)`
 * would leak the helpers onto the module-level default export for every importer.
 */
const facade = {
  start: (...args: Parameters<typeof NProgress.start>) => NProgress.start(...args),
  done: (...args: Parameters<typeof NProgress.done>) => NProgress.done(...args),
  set: (...args: Parameters<typeof NProgress.set>) => NProgress.set(...args),
  inc: (...args: Parameters<typeof NProgress.inc>) => NProgress.inc(...args),
  trickle: () => NProgress.trickle(),
  configure: (...args: Parameters<typeof NProgress.configure>) =>
    NProgress.configure(...args),
  promise: (...args: Parameters<typeof NProgress.promise>) =>
    NProgress.promise(...args),
  render: (...args: Parameters<typeof NProgress.render>) =>
    NProgress.render(...args),
  remove: () => NProgress.remove(),
  isStarted: () => NProgress.isStarted(),
  isRendered: () => NProgress.isRendered(),
  getPositioningCSS: () => NProgress.getPositioningCSS(),
  subscribe: (listener: (status: number | null) => void) => NProgress.subscribe(listener),
  get status() {
    return NProgress.status;
  },
  /** Writable for parity with 0.2.0's plain `NProgress.status` property. */
  set status(value: number | null) {
    NProgress.status = value;
  },
  settings: NProgress.settings,
  NProgress,
  default: NProgress,
  createProgress,
  defaultSettings,
  injectStyles,
  styles,
  version,
};

if (typeof window !== "undefined") {
  (globalThis as unknown as Record<string, unknown>).NProgressNext = facade;
}

export default facade;