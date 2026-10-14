import type { CSSProperties } from "react";
import type { ProgressInstance, ProgressOptions } from "nprogress-next";

/**
 * The reactive surface of a {@link useProgress} hook.
 *
 * `status` / `isStarted` / `isRendered` are plain snapshots: re-reading them on
 * every render always yields the current value of the underlying instance,
 * because the hook subscribes to it with `useSyncExternalStore`.
 */
export interface UseProgressReturn {
  /** The underlying `nprogress-next` instance, owned by the hook. */
  readonly progress: ProgressInstance;
  /** Current progress between `0` and `1`, or `null` when idle. */
  readonly status: number | null;
  /** Whether a progress value is currently set. */
  readonly isStarted: boolean;
  /**
   * Whether the core container was in the DOM at the last store notification.
   *
   * Recomputed from `instance.isRendered()` on every render, so it is accurate
   * whenever anything else changed too. The one case it cannot report on its own
   * is `done()`'s fade-out, which removes the container from a timer callback
   * and never notifies subscribers — read `progress.isRendered()` directly if
   * that exact instant matters.
   */
  readonly isRendered: boolean;
  /** Shows the bar and starts the trickle loop. */
  start(): void;
  /** Completes and hides the bar. Pass `true` to force it. */
  done(force?: boolean): void;
  /** Sets the progress to a number between `0` and `1`. */
  set(n: number): void;
  /** Increments by `amount`, or by the 0.2.0 random trickle when omitted. */
  inc(amount?: number): void;
}

/**
 * `<ProgressBar />` is a *controlled* presentational component: it renders
 * whatever `progress` says and nothing else. It never creates a `nprogress-next`
 * instance, never touches a timer and never reads the DOM, so it can be
 * server-rendered and driven by any state you like.
 *
 * Every visual detail that can be inlined is inlined, so the component renders
 * correctly with **zero** CSS imports. The handful of things that cannot be —
 * the peg's glow, the spinner's border and its keyframes — live in
 * `nprogress-next-react/styles.css`, which is optional.
 */
export interface ProgressBarProps {
  /** Progress between `0` and `1`. Clamped on render. Default: `0`. */
  progress?: number;
  /** Renders nothing when `false`. Default: `true`. */
  visible?: boolean;
  /** Renders the corner spinner. Default: `true`. */
  spinner?: boolean;
  /** `aria-label` for the progressbar. `null` omits the attribute. Default: `"Loading"`. */
  label?: string | null;
  /** Bar transition duration in ms. Default: `200`. */
  speed?: number;
  /** CSS easing for the bar transition. Default: `"linear"`. */
  easing?: string;
  /** Sets `--np-height`. Default: `"2px"`. */
  height?: string;
  /** Sets `--np-color`. Default: `"#29d"`. */
  color?: string;
  /** Sets `--np-z`. Default: `1031`. */
  zIndex?: number | string;
  /** Extra classes appended to `"np-root"`. */
  className?: string;
  /** Inline styles merged over the generated CSS custom properties. */
  style?: CSSProperties;
}

/** Convenience re-export so consumers do not need a second import. */
export type { ProgressInstance, ProgressOptions };