import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import { ProgressBar } from "../src/index";

/**
 * Every piece of geometry is written inline, so these assertions double as the
 * contract with the React adapter: if a refactor drops an inline declaration
 * the component stops working without a stylesheet, and this file fails.
 */
const root = (progress = 0): string =>
  `<div class="np-root" role="progressbar" aria-valuemin="0" aria-valuemax="100" ` +
  `aria-valuenow="${Math.round(progress * 100)}" aria-label="Loading" ` +
  `style="--np-color: #29d; --np-height: 2px; --np-z: 1031;">`;

const bar = (percent: number, speed = 200, easing = "linear"): string =>
  `<div class="np-bar" style="position: fixed; top: 0px; left: 0px; width: 100%; background: var(--np-color, #29d); ` +
  `height: var(--np-height, 2px); z-index: var(--np-z); ` +
  `transform: translate3d(${percent}%,0,0); transition: all ${speed}ms ${easing};">` +
  `<div class="np-peg"></div></div>`;

const spinner =
  `<div class="np-spinner" aria-hidden="true" style="position: fixed; top: 15px; right: 15px; ` +
  `z-index: var(--np-z);"><div class="np-spinner-icon"></div></div>`;

/** `percent` is the bar's `translate3d` offset, derived from a `0..1` progress. */
const markup = (progress: number, withSpinner = true): string =>
  `${root(progress)}${bar((progress - 1) * 100)}${withSpinner ? spinner : ""}</div>`;

afterEach(() => {
  document.body.innerHTML = "";
});

describe("<ProgressBar /> markup", () => {
  it("renders the documented markup exactly", () => {
    const wrapper = mount(ProgressBar, { props: { progress: 0.3 } });
    expect(wrapper.element.outerHTML).toBe(markup(0.3));
  });

  it("defaults to an empty bar at 0%", () => {
    const wrapper = mount(ProgressBar);
    expect(wrapper.element.outerHTML).toBe(markup(0));
  });

  it("positions the bar offscreen at 0 and flush right at 1", () => {
    expect(mount(ProgressBar).find(".np-bar").attributes("style")).toContain(
      "transform: translate3d(-100%,0,0)",
    );
    expect(
      mount(ProgressBar, { props: { progress: 1 } }).find(".np-bar").attributes("style"),
    ).toContain("transform: translate3d(0%,0,0)");
  });

  it("exposes an integer 0..100 aria-valuenow", () => {
    expect(mount(ProgressBar, { props: { progress: 0.42 } }).attributes("aria-valuenow")).toBe(
      "42",
    );
    // 0.3367 * 100 = 33.67 -> rounded, never truncated, never fractional.
    expect(mount(ProgressBar, { props: { progress: 0.3367 } }).attributes("aria-valuenow")).toBe(
      "34",
    );
    expect(mount(ProgressBar, { props: { progress: 1 } }).attributes("aria-valuenow")).toBe(
      "100",
    );
  });

  it("clamps progress below 0 and above 1", () => {
    const low = mount(ProgressBar, { props: { progress: -5 } });
    expect(low.attributes("aria-valuenow")).toBe("0");
    expect(low.find(".np-bar").attributes("style")).toContain("translate3d(-100%,0,0)");

    const high = mount(ProgressBar, { props: { progress: 42 } });
    expect(high.attributes("aria-valuenow")).toBe("100");
    expect(high.find(".np-bar").attributes("style")).toContain("translate3d(0%,0,0)");

    // Non-finite input degrades to 0 instead of poisoning the transform with
    // `translate3d(NaN%,0,0)`.
    const nan = mount(ProgressBar, { props: { progress: Number.NaN } });
    expect(nan.attributes("aria-valuenow")).toBe("0");
  });

  it("does not leak binary floating-point noise into the transform", () => {
    expect(mount(ProgressBar, { props: { progress: 0.3 } }).find(".np-bar").attributes("style")).toContain(
      "translate3d(-70%,0,0)",
    );
  });
});

describe("<ProgressBar /> visibility", () => {
  it("renders a comment placeholder when visible is false", () => {
    const wrapper = mount(ProgressBar, { props: { visible: false } });
    expect(wrapper.html()).toBe("");
    expect(wrapper.element.nodeType).toBe(Node.COMMENT_NODE);
  });

  it("renders again when visible flips back to true", async () => {
    const wrapper = mount(ProgressBar, { props: { visible: false } });
    await wrapper.setProps({ visible: true, progress: 0.5 });
    expect(wrapper.element.outerHTML).toBe(markup(0.5));
  });
});

describe("<ProgressBar /> spinner", () => {
  it("renders the spinner by default", () => {
    const wrapper = mount(ProgressBar);
    expect(wrapper.find(".np-spinner").exists()).toBe(true);
    expect(wrapper.find(".np-spinner-icon").exists()).toBe(true);
    expect(wrapper.find(".np-spinner").attributes("aria-hidden")).toBe("true");
  });

  it("omits the whole spinner subtree when spinner is false", () => {
    const wrapper = mount(ProgressBar, { props: { spinner: false } });
    expect(wrapper.element.outerHTML).toBe(markup(0, false));
    expect(wrapper.find(".np-spinner").exists()).toBe(false);
    expect(wrapper.find(".np-spinner-icon").exists()).toBe(false);
  });
});

describe("<ProgressBar /> labelling", () => {
  it("defaults to aria-label=\"Loading\"", () => {
    expect(mount(ProgressBar).attributes("aria-label")).toBe("Loading");
  });

  it("omits aria-label entirely when label is null", () => {
    const wrapper = mount(ProgressBar, { props: { label: null } });
    expect(wrapper.attributes("aria-label")).toBeUndefined();
    expect(wrapper.html()).not.toContain("aria-label");
  });

  it("applies a custom label", () => {
    expect(mount(ProgressBar, { props: { label: "Uploading" } }).attributes("aria-label")).toBe(
      "Uploading",
    );
  });
});

describe("<ProgressBar /> theming", () => {
  it("emits the CSS custom properties from height, color and zIndex", () => {
    const wrapper = mount(ProgressBar, {
      props: { height: "6px", color: "#ff0055", zIndex: 9999 },
    });
    expect(wrapper.attributes("style")).toContain("--np-color: #ff0055");
    expect(wrapper.attributes("style")).toContain("--np-height: 6px");
    expect(wrapper.attributes("style")).toContain("--np-z: 9999");
  });

  it("accepts a string zIndex", () => {
    expect(
      mount(ProgressBar, { props: { zIndex: "42" } }).attributes("style"),
    ).toContain("--np-z: 42");
  });

  it("reads the bar height back through --np-height", () => {
    expect(mount(ProgressBar, { props: { height: "10px" } }).find(".np-bar").attributes("style")).toContain(
      "height: var(--np-height, 2px)",
    );
  });

  it("merges the class prop onto the root element", () => {
    expect(mount(ProgressBar, { props: { class: "my-bar" } }).attributes("class")).toBe(
      "np-root my-bar",
    );
    expect(mount(ProgressBar).attributes("class")).toBe("np-root");
  });

  it("merges the style prop over its own declarations", () => {
    const wrapper = mount(ProgressBar, {
      props: { style: { "--np-color": "rebeccapurple", top: "12px" } },
    });
    expect(wrapper.attributes("style")).toContain("--np-color: rebeccapurple");
    // Untouched declarations survive the merge.
    expect(wrapper.attributes("style")).toContain("--np-height: 2px");
  });

  it("applies speed and easing to the bar transition", () => {
    const wrapper = mount(ProgressBar, { props: { speed: 450, easing: "ease-out" } });
    expect(wrapper.find(".np-bar").attributes("style")).toContain("transition: all 450ms ease-out");
  });
});

describe("<ProgressBar /> reactivity", () => {
  it("re-renders when props change", async () => {
    const wrapper = mount(ProgressBar, { props: { progress: 0 } });
    await wrapper.setProps({ progress: 0.75 });
    expect(wrapper.attributes("aria-valuenow")).toBe("75");
    expect(wrapper.element.outerHTML).toBe(markup(0.75));
  });

  it("passes non-prop attributes through to the root element", () => {
    const wrapper = mount(ProgressBar, { attrs: { id: "app-loader" } });
    expect(wrapper.attributes("id")).toBe("app-loader");
  });
});