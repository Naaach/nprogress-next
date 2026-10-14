import type { CSSProperties, ReactElement } from "react";
import type { ProgressBarProps } from "./types";

/** Defaults, in one place so the README and the tests read the same numbers. */
const DEFAULT_LABEL = "Loading";
const DEFAULT_SPEED = 200;
const DEFAULT_EASING = "linear";
const DEFAULT_HEIGHT = "2px";
const DEFAULT_COLOR = "#29d";
const DEFAULT_Z_INDEX = 1031;
/** Corner offsets, matching the original NProgress spinner. */
const SPINNER_OFFSET = 15;

/**
 * `CSSProperties` does not model custom properties, and neither does React's
 * runtime: anything starting with `--` is written through
 * `style.setProperty`, which is exactly what these three need.
 */
type CustomProperties = CSSProperties & Record<`--${string}`, string | number | undefined>;

const clamp01 = (n: number): number =>
  typeof n === "number" && Number.isFinite(n) ? (n < 0 ? 0 : n > 1 ? 1 : n) : 0;

/**
 * Converts a `0..1` fraction into the `translate3d` percentage the bar needs.
 *
 * The bar is `width: 100%` and pinned at `left: 0`, so `0%` must push it fully
 * off-screen (`-100%`) and `100%` must leave it fully visible (`0%`). Same
 * arithmetic as `nprogress-next`'s own `toBarPerc`.
 */
const toBarPerc = (n: number): number => (-1 + n) * 100;

/**
 * A controlled, presentational progress bar.
 *
 * ```tsx
 * <ProgressBar progress={0.4} height="3px" color="#f43f5e" />
 * ```
 *
 * It renders the exact same DOM as the Vue adapter's component — `.np-root`,
 * `.np-bar`, `.np-peg`, `.np-spinner`, `.np-spinner-icon` — with every
 * property that can be inlined written as an inline style, so it works with no
 * stylesheet at all. Nothing here reads `window` or `document`, so
 * `renderToString()` is safe.
 */
export function ProgressBar({
  progress = 0,
  visible = true,
  spinner = true,
  label = DEFAULT_LABEL,
  speed = DEFAULT_SPEED,
  easing = DEFAULT_EASING,
  height = DEFAULT_HEIGHT,
  color = DEFAULT_COLOR,
  zIndex = DEFAULT_Z_INDEX,
  className,
  style,
}: ProgressBarProps): ReactElement | null {
  if (!visible) return null;

  const value = clamp01(progress);
  const perc = toBarPerc(value);
  /**
   * `aria-valuenow` is an integer percentage. The core works in `0..1`
   * fractions, which are meaningless to announce; a progressbar is read out
   * loud, so it is scaled to `0..100` here.
   */
  const percent = Math.round(value * 100);

  const rootStyle: CustomProperties = {
    "--np-color": color,
    "--np-height": height,
    "--np-z": zIndex,
    // The caller's styles win, so `style={{ "--np-color": "red" }}` is a
    // supported way to theme the bar without a separate prop.
    ...style,
  };

  const barStyle: CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "var(--np-height)",
    background: "var(--np-color)",
    zIndex: "var(--np-z)",
    transform: `translate3d(${perc}%,0,0)`,
    transition: `all ${speed}ms ${easing}`,
  };

  /**
   * `right` is written *first*, on purpose.
   *
   * Browsers treat a `style` object as unordered — these are four distinct
   * properties and declaration order cannot change the result. jsdom's
   * `cssstyle`, on the other hand, drops `right`/`bottom` entirely if any other
   * declaration was written to the same `CSSStyleDeclaration` first. Writing
   * `right` first costs nothing and is what lets the test suite assert the
   * spinner's real offset instead of skipping it. Do not "tidy" this order.
   */
  const spinnerStyle: CSSProperties = {
    right: SPINNER_OFFSET,
    position: "fixed",
    top: SPINNER_OFFSET,
    zIndex: "var(--np-z)",
  };

  const rootClass = className ? `np-root ${className}` : "np-root";

  return (
    <div
      className={rootClass}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-label={label === null ? undefined : label}
      style={rootStyle}
    >
      <div className="np-bar" style={barStyle}>
        <div className="np-peg" />
      </div>
      {spinner ? (
        <div className="np-spinner" aria-hidden="true" style={spinnerStyle}>
          <div className="np-spinner-icon" />
        </div>
      ) : null}
    </div>
  );
}

ProgressBar.displayName = "ProgressBar";