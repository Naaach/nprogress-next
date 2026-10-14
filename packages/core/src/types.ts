/**
 * Public types for nprogress-next.
 *
 * The settings object is intentionally compatible with the original
 * NProgress 0.2.0 configuration, with a few modern additions.
 */

export interface ProgressSettings {
  /** Minimum percentage shown on start. Default: `0.08`. */
  minimum: number;
  /** CSS easing used for the bar transition. Default: `"ease"`. */
  easing: string;
  /** Transition duration in ms. Default: `200`. */
  speed: number;
  /** Automatically move the bar while it is visible. Default: `true`. */
  trickle: boolean;
  /** Maximum trickle step, as a fraction of the remaining distance. Default: `0.02`. */
  trickleRate: number;
  /** Interval in ms between automatic trickle steps. Default: `800`. */
  trickleSpeed: number;
  /** Render the corner spinner. Default: `true`. */
  showSpinner: boolean;
  /** Selector of the bar element inside the template. Default: `'.bar, [role="bar"]'`. */
  barSelector: string;
  /** Selector of the spinner element inside the template. Default: `'.spinner, [role="spinner"]'`. */
  spinnerSelector: string;
  /** Where the bar is mounted. Default: `"body"`. */
  parent: string | HTMLElement;
  /** Markup rendered inside the container. */
  template: string;
  /** DOM id used for the container. Default: `"nprogress"`. */
  id: string;
  /** Accessible label for the progress container. Default: `"Loading"`. Set to `null` to omit. */
  ariaLabel: string | null;
  /** Inject the default stylesheet on first render. Default: `true`. */
  autoInjectStyles: boolean;
  /** Respect `prefers-reduced-motion`. Default: `true`. */
  respectReducedMotion: boolean;
  /**
   * Strategy used to position the bar.
   *
   * - `"translate"` (default): fixed at `left: 0` and moved with a `translate3d()` transform.
   * - `"margin"`: `left`/`margin-left` percentage pairs.
   * - `"left"`: `left` percentage only (no GPU-accelerated transform).
   */
  positionUsing: "translate" | "margin" | "left" | string;
}

export type ProgressOptions = Partial<ProgressSettings>;

export interface ProgressInstance {
  /** Library version (mirrors `NProgress.version` in nprogress 0.2.0). */
  readonly version: string;
  /** Live settings object. Mutate through `configure()` for safe merges. */
  readonly settings: ProgressSettings;
  /** Current progress between `0` and `1`, or `null` when idle. */
  readonly status: number | null;
  /** Shows the bar and starts the trickle loop. */
  start(): ProgressInstance;
  /** Completes and hides the bar. Pass `true` to force it. */
  done(force?: boolean): ProgressInstance;
  /** Sets the progress to a number between `0` and `1`. */
  set(n: number): ProgressInstance;
  /** Increments by `amount`, or by the 0.2.0 random trickle when omitted. */
  inc(amount?: number): ProgressInstance;
  /** Single trickle step: advances by a random fraction of `trickleRate`. */
  trickle(): ProgressInstance;
  /** Merges the given options into the instance settings. */
  configure(options: ProgressOptions): ProgressInstance;
  /** Tracks one or more promises and finishes when all of them settle. */
  promise(promise: PromiseLike<unknown>): ProgressInstance;
  /** Renders the container. Mostly internal. */
  render(fromStart?: boolean): HTMLElement | null;
  /** Removes the container from the DOM. */
  remove(): void;
  /** Whether the bar is currently in progress. */
  isStarted(): boolean;
  /** Whether the container is currently in the DOM. */
  isRendered(): boolean;
  /**
   * Bar positioning declarations for the current `positionUsing` setting, as a
   * CSS declaration string (e.g. `"left:0;top:0;transform:translate3d(-50%,0,0)"`).
   * Useful when building a custom bar that lives outside the default stylesheet.
   */
  getPositioningCSS(): string;
  /** Subscribes to status changes. Returns an unsubscribe function. */
  subscribe(listener: (status: number | null) => void): () => void;
}