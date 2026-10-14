import { defineComponent, h } from "vue";
import type { CSSProperties, PropType, VNode } from "vue";

/**
 * A `CSSProperties` object that also accepts the `--np-*` custom properties the
 * component drives itself, so a caller can override the accent colour without
 * going through the dedicated `color` / `height` / `zIndex` props.
 */
export type ProgressBarStyle = CSSProperties & {
  [key: `--${string}`]: string | number | null | undefined;
};

/** Clamps any (possibly `NaN`/`Infinity`) input into `0..1`. */
function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

/**
 * The bar's horizontal offset: `0` sits the bar just off the left edge
 * (`-100%`) and `1` lands it exactly on the right (`0%`).
 *
 * Rounded to four decimals so binary-floating-point noise (`0.3` producing
 * `-70.00000000000001`) never reaches the DOM — the transform is GPU-bound and
 * a long fractional string is churn for no visual gain.
 */
function toBarPercent(progress: number): number {
  return Math.round((progress - 1) * 100 * 1e4) / 1e4;
}

/**
 * A controlled, presentational progress bar.
 *
 * The component renders the markup and nothing else: it never starts timers,
 * never talks to a core instance and never mutates its own state. Drive it
 * from whatever owns your request lifecycle — usually `useProgress()`:
 *
 * ```vue
 * <ProgressBar :progress="status ?? 0" :visible="isStarted" />
 * ```
 *
 * Every piece of *geometry* is written as an inline style, so the bar is
 * positioned correctly with **zero** CSS imports. `nprogress-next-vue/styles.css`
 * only adds the decorative layer (peg glow, spinner ring, reduced-motion
 * fallback); import it once, or nothing at all.
 *
 * SSR-safe: the render function touches no browser API, so `renderToString()`
 * produces the same markup the client hydrates to.
 */
export const ProgressBar = defineComponent({
  name: "ProgressBar",

  props: {
    /** Progress between `0` and `1`. Values outside the range are clamped. */
    progress: { type: Number, default: 0 },
    /** Render the bar at all. `false` renders a comment placeholder. */
    visible: { type: Boolean, default: true },
    /** Render the corner spinner. */
    spinner: { type: Boolean, default: true },
    /** `aria-label` of the bar. `null` omits the attribute entirely. */
    label: { type: String as PropType<string | null>, default: "Loading" },
    /** Transition duration in ms. */
    speed: { type: Number, default: 200 },
    /** CSS easing for the bar transition. */
    easing: { type: String, default: "linear" },
    /** Bar thickness — written to `--np-height`. */
    height: { type: String, default: "2px" },
    /** Accent colour of the bar, its peg glow and the spinner — written to `--np-color`. */
    color: { type: String, default: "#29d" },
    /** Stacking order of the bar and the spinner — written to `--np-z`. */
    zIndex: { type: [Number, String] as PropType<number | string>, default: 1031 },
    /** Extra class names, merged onto the root element (Vue's `className`). */
    class: { type: String, default: "" },
    /** Extra inline styles, merged over the component's own. */
    style: { type: Object as PropType<ProgressBarStyle>, default: undefined },
  },

  setup(props) {
    return () => {
      // A comment placeholder, not an empty `<div>`: it keeps the parent's
      // children positions stable (see Vue's `v-if` handling) and gives SSR
      // output somewhere to hang the `<!--v-if-->` anchor.
      if (!props.visible) return null;

      const value = clamp01(props.progress);
      const percent = toBarPercent(value);

      const children: VNode[] = [
        h(
          "div",
          {
            class: "np-bar",
            style: {
              position: "fixed",
              top: "0",
              left: "0",
              width: "100%",
              background: "var(--np-color, #29d)",
              // Read back through the custom property so the `height` prop
              // (and any app-level `--np-height` override) stays in charge.
              height: "var(--np-height, 2px)",
              zIndex: "var(--np-z)",
              transform: `translate3d(${percent}%,0,0)`,
              transition: `all ${props.speed}ms ${props.easing}`,
            },
          },
          [h("div", { class: "np-peg" })],
        ),
      ];

      if (props.spinner) {
        children.push(
          h(
            "div",
            {
              class: "np-spinner",
              // Purely decorative — the container above is what assistive
              // technology reads.
              "aria-hidden": "true",
              style: {
                position: "fixed",
                top: "15px",
                right: "15px",
                zIndex: "var(--np-z)",
              },
            },
            [h("div", { class: "np-spinner-icon" })],
          ),
        );
      }

      return h(
        "div",
        {
          // `normalizeClass` drops the empty string, so an unset `class` prop
          // renders exactly `"np-root"` and a set one appends after it.
          class: ["np-root", props.class],
          role: "progressbar",
          "aria-valuemin": "0",
          // `aria-valuemax` is `100` even though the core — and the `progress`
          // prop — are on a `0..1` scale: a `progressbar` is exposed to
          // assistive technology in percent, so the bounds have to match the
          // unit `aria-valuenow` is reported in.
          "aria-valuemax": "100",
          // The core works in `0..1` fractions, but a `progressbar` is exposed
          // to assistive technology on a `0..100` scale. `Math.round` keeps it
          // an integer, which is what the ARIA spec's "human readable" note
          // asks for and what a screen reader will actually announce.
          "aria-valuenow": String(Math.round(value * 100)),
          // `null` drops the attribute (Vue skips `null`/`undefined` props)
          // rather than rendering `aria-label="null"`.
          "aria-label": props.label ?? undefined,
          style: [
            {
              "--np-color": props.color,
              "--np-height": props.height,
              "--np-z": String(props.zIndex),
            },
            props.style,
          ],
        },
        children,
      );
    };
  },
});