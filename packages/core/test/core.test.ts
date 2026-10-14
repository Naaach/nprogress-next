import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createProgress, defaultSettings, NProgress } from "../src/index";
import { version } from "../src/core";
import type { ProgressInstance, ProgressOptions } from "../src/types";

const TEMPLATE =
  '<div class="bar" role="bar" aria-hidden="true"><div class="peg"></div></div>' +
  '<div class="spinner" role="spinner" aria-hidden="true"><div class="spinner-icon"></div></div>';

const container = (): HTMLElement | null => document.getElementById("nprogress");
const tick = (ms = 30): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const clamp = (n: number, min: number, max: number): number =>
  n < min ? min : n > max ? max : n;

/** Every instance created here is settled in `afterEach` so no timer chain survives a test. */
const tracked: ProgressInstance[] = [];

/** Unit-test instance: trickle is opt-in so tests never leak a live loop. */
function instance(options: ProgressOptions = {}): ProgressInstance {
  const progress = createProgress({ trickle: false, ...options });
  tracked.push(progress);
  return progress;
}

/** Finish and tear down an instance. Safe to call in any state. */
function settle(progress: ProgressInstance): void {
  try {
    if (progress.status !== null) progress.done(true);
  } finally {
    progress.remove();
  }
}

beforeEach(() => {
  document.body.innerHTML = "";
  document.documentElement.className = "";
  document.documentElement.removeAttribute("aria-busy");
});

afterEach(() => {
  // Restore the environment *first*: some tests stub globals or use fake timers.
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();

  for (const progress of tracked.splice(0)) settle(progress);
  settle(NProgress);
  NProgress.configure({ trickle: true });

  document.body.innerHTML = "";
  document.documentElement.className = "";
  document.documentElement.removeAttribute("aria-busy");
});

describe("0.2.0 default parity", () => {
  it("exposes the published nprogress@0.2.0 defaults", () => {
    const expected = {
      minimum: 0.08,
      easing: "ease",
      speed: 200,
      trickle: true,
      trickleRate: 0.02,
      trickleSpeed: 800,
      showSpinner: true,
      barSelector: '.bar, [role="bar"]',
      spinnerSelector: '.spinner, [role="spinner"]',
      parent: "body",
      id: "nprogress",
      ariaLabel: "Loading",
      autoInjectStyles: true,
      respectReducedMotion: true,
      positionUsing: "translate",
      template: TEMPLATE,
    };

    // Key comparison is explicit (and order-independent).
    expect(Object.keys(defaultSettings).sort()).toEqual(Object.keys(expected).sort());
    expect(defaultSettings).toEqual(expected);
  });

  it("does not leak settings between instances", () => {
    const a = instance({ minimum: 0.5 });
    const b = instance();

    expect(a.settings.minimum).toBe(0.5);
    expect(b.settings.minimum).toBe(defaultSettings.minimum);
  });

  it("exposes the library version on every instance", () => {
    expect(version).toBe("0.1.0");
    expect(instance().version).toBe(version);
    expect(NProgress.version).toBe(version);
  });

  it("keeps both the modern and the legacy role-based selectors working", () => {
    const p = instance();
    p.start();

    expect(container()?.querySelector(".bar")).not.toBeNull();
    expect(container()?.querySelector('[role="bar"]')).not.toBeNull();
    expect(container()?.querySelector(".spinner")).not.toBeNull();
    expect(container()?.querySelector('[role="spinner"]')).not.toBeNull();
  });
});

describe("createProgress", () => {
  it("starts, renders the bar and marks the document as busy", () => {
    const p = instance();

    p.start();

    expect(p.isStarted()).toBe(true);
    expect(p.status).toBe(defaultSettings.minimum);
    expect(container()).not.toBeNull();
    expect(document.documentElement.className).toContain("nprogress-busy");
    expect(document.documentElement.getAttribute("aria-busy")).toBe("true");
    expect(p.isRendered()).toBe(true);
  });

  it("clamps values to the configured minimum and maximum", () => {
    const p = instance({ minimum: 0.2 });

    p.set(0.05);
    expect(p.status).toBe(0.2);

    p.set(2);
    expect(p.status).toBeNull();
  });

  it("completes and removes the element on done()", async () => {
    const p = instance({ speed: 0 });

    p.start();
    p.done();

    expect(p.status).toBeNull();
    await tick(60);
    expect(container()).toBeNull();
    expect(document.documentElement.className).not.toContain("nprogress-busy");
    expect(document.documentElement.hasAttribute("aria-busy")).toBe(false);
  });

  it("increments and never reaches 1 on its own", () => {
    const p = instance({ minimum: 0.1 });

    p.start();
    const first = p.status ?? 0;
    p.inc();
    const second = p.status ?? 0;

    expect(second).toBeGreaterThan(first);
    expect(second).toBeLessThan(1);
  });

  it("skips the spinner when showSpinner is false", () => {
    const p = instance({ showSpinner: false });

    p.start();

    expect(container()?.querySelector('.spinner, [role="spinner"]')).toBeNull();
  });

  it("mounts into a custom parent", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);

    const p = instance({ parent: host });
    p.start();

    expect(host.querySelector("#nprogress")).not.toBeNull();
    expect(host.className).toContain("nprogress-custom-parent");
  });

  it("notifies subscribers on status changes", () => {
    const p = instance();
    const spy = vi.fn();
    const unsubscribe = p.subscribe(spy);

    p.start();
    expect(spy).toHaveBeenCalled();

    unsubscribe();
    spy.mockClear();
    p.set(0.5);
    expect(spy).not.toHaveBeenCalled();
  });

  it("only emits when the status actually changes", () => {
    const p = instance();
    const spy = vi.fn();
    p.subscribe(spy);

    p.set(0.4);
    expect(spy).toHaveBeenCalledTimes(1);

    p.set(0.4);
    expect(spy).toHaveBeenCalledTimes(1);

    p.set(0.9);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("merges options through configure()", () => {
    const p = instance();
    p.configure({ minimum: 0.3, showSpinner: false });

    expect(p.settings.minimum).toBe(0.3);
    expect(p.settings.showSpinner).toBe(false);
    expect(p.settings.speed).toBe(defaultSettings.speed);
  });

  it("does not throw when the DOM is unavailable (SSR)", () => {
    const p = instance();
    vi.stubGlobal("document", undefined);

    expect(() => {
      p.start();
      p.set(0.5);
      p.done();
    }).not.toThrow();
  });

  it("exposes a compatible singleton", () => {
    NProgress.start();
    expect(typeof NProgress.status).toBe("number");
    expect(NProgress.isRendered()).toBe(true);
    NProgress.done();
  });
});

describe("inc() 0.2.0 formula", () => {
  it("uses the (1 - n) * random(n) delta", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const p = instance();

    p.set(0.5);
    const expected = clamp(0.5 + (1 - 0.5) * clamp(0.5 * 0.5, 0.1, 0.95), 0, 0.994);
    p.inc();

    expect(p.status).toBeCloseTo(expected, 10);
    expect(expected).toBeCloseTo(0.625, 10);
  });

  it("never lets a bare inc() reach 1", () => {
    vi.spyOn(Math, "random").mockReturnValue(1);
    const p = instance({ minimum: 0.01 });

    p.set(0.99);
    for (let i = 0; i < 20; i += 1) p.inc();

    expect(p.status).toBeLessThanOrEqual(0.994);
    expect(p.status).not.toBeNull();
  });

  it("routes inc() through start() when minimum is 0", () => {
    const p = instance({ minimum: 0 });

    expect(p.status).toBeNull();
    p.inc();

    // `!n` is true for `null`, so inc() delegates to start() instead of jumping.
    expect(p.status).toBe(0);
    expect(p.isStarted()).toBe(true);
  });

  it("still honours an explicit amount", () => {
    const p = instance();

    p.set(0.5);
    p.inc(0.25);

    expect(p.status).toBe(0.75);
  });
});

describe("trickle()", () => {
  it("advances by exactly trickleRate at the top of the random range", () => {
    vi.spyOn(Math, "random").mockReturnValue(1);
    const p = instance();

    p.set(0.5);
    p.trickle();

    expect(p.status).toBeCloseTo(0.5 + defaultSettings.trickleRate, 10);
  });

  it("advances by 0 at the bottom of the random range", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const p = instance();

    p.set(0.5);
    p.trickle();

    expect(p.status).toBe(0.5);
  });

  it("runs a trickle loop on trickleSpeed and stops it on done()", () => {
    vi.useFakeTimers();
    const p = createProgress({ speed: 0 });
    tracked.push(p);

    p.start();
    expect(p.status).toBe(defaultSettings.minimum);
    expect(vi.getTimerCount()).toBeGreaterThan(0);

    vi.advanceTimersByTime(defaultSettings.trickleSpeed);
    expect(p.status ?? 0).toBeGreaterThan(defaultSettings.minimum);

    p.done();
    vi.advanceTimersByTime(defaultSettings.trickleSpeed * 4);

    expect(p.status).toBeNull();
    expect(container()).toBeNull();
    // Zero leaked timers: the loop and the fade-out both drained.
    expect(vi.getTimerCount()).toBe(0);
  });

  it("does not run a trickle loop when trickle is disabled", () => {
    vi.useFakeTimers();
    const p = instance();

    p.start();
    vi.advanceTimersByTime(defaultSettings.trickleSpeed * 4);

    expect(p.status).toBe(defaultSettings.minimum);
    vi.advanceTimersByTime(defaultSettings.trickleSpeed * 4);
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("getPositioningCSS()", () => {
  it("returns the translate positioning by default", () => {
    const p = instance();

    p.set(0.5);

    expect(p.getPositioningCSS()).toBe(
      "width:100%;height:var(--nprogress-height, 2px);left:0;top:0;transform:translate3d(-50%,0,0)",
    );
  });

  it("returns left/margin-left pairs when positionUsing is margin", () => {
    const p = instance({ positionUsing: "margin" });

    p.set(0.25);

    expect(p.getPositioningCSS()).toBe(
      "width:100%;height:var(--nprogress-height, 2px);left:-75%;margin-left:75%;top:0",
    );
  });

  it("returns a plain left percentage when positionUsing is left", () => {
    const p = instance({ positionUsing: "left" });

    p.set(0.25);

    expect(p.getPositioningCSS()).toBe(
      "width:100%;height:var(--nprogress-height, 2px);left:-75%;top:0",
    );
  });

  it("is 0 when idle", () => {
    const p = instance();
    expect(p.getPositioningCSS()).toContain("translate3d(-100%,0,0)");
  });

  it("matches the styles applied to the rendered bar", () => {
    const p = instance();
    p.set(0.5);

    const bar = container()?.querySelector<HTMLElement>('.bar, [role="bar"]');
    expect(bar).not.toBeNull();
    expect(bar?.style.transform).toBe("translate3d(-50%,0,0)");
    expect(bar?.style.left).toBe("0px");
  });
});

describe("aria", () => {
  it("keeps aria-valuenow in sync across set() calls", () => {
    const p = instance();

    p.set(0.4);
    expect(container()?.getAttribute("aria-valuenow")).toBe("0.4");

    p.set(0.7);
    expect(container()?.getAttribute("aria-valuenow")).toBe("0.7");

    p.set(1);
    expect(container()?.getAttribute("aria-valuenow")).toBe("1");
  });

  it("hides the decorative bar and spinner wrappers from assistive tech", () => {
    const p = instance();
    p.start();

    expect(container()?.getAttribute("role")).toBe("progressbar");
    expect(container()?.getAttribute("aria-label")).toBe("Loading");
    expect(
      container()?.querySelector('.bar, [role="bar"]')?.getAttribute("aria-hidden"),
    ).toBe("true");
    expect(
      container()?.querySelector('.spinner, [role="spinner"]')?.getAttribute("aria-hidden"),
    ).toBe("true");
  });

  it("omits aria-label when set to null", () => {
    const p = instance({ ariaLabel: null });
    p.start();

    expect(container()?.hasAttribute("aria-label")).toBe(false);
  });
});

describe("busy-state ownership", () => {
  it("completes a custom template that has no bar element", async () => {
    // Regression: a missing bar used to return early, so `done()` never removed
    // the container and `<html>` stayed permanently marked as busy.
    const p = instance({
      speed: 0,
      template: '<div class="spinner" role="spinner"></div>',
    });

    p.start();
    expect(container()?.querySelector('.bar, [role="bar"]')).toBeNull();
    expect(document.documentElement.className).toContain("nprogress-busy");

    p.done();
    await tick(60);

    expect(container()).toBeNull();
    expect(document.documentElement.className).not.toContain("nprogress-busy");
    expect(document.documentElement.hasAttribute("aria-busy")).toBe(false);
  });

  it("restores a pre-existing aria-busy value", async () => {
    document.documentElement.setAttribute("aria-busy", "false");
    const p = instance({ speed: 0 });

    p.start();
    expect(document.documentElement.getAttribute("aria-busy")).toBe("true");

    p.done();
    await tick(60);

    expect(document.documentElement.getAttribute("aria-busy")).toBe("false");
  });

  it("keeps the busy state while another instance is still running", () => {
    const a = instance({ speed: 0 });
    const b = instance({ speed: 0 });

    a.start();
    b.start();
    expect(document.documentElement.getAttribute("aria-busy")).toBe("true");

    a.remove();
    expect(document.documentElement.getAttribute("aria-busy")).toBe("true");
    expect(document.documentElement.className).toContain("nprogress-busy");

    b.remove();
    expect(document.documentElement.hasAttribute("aria-busy")).toBe(false);
    expect(document.documentElement.className).not.toContain("nprogress-busy");
  });
});

describe("configure()", () => {
  it("ignores explicit undefined values", () => {
    const p = instance();
    p.configure({ speed: undefined });

    expect(p.settings.speed).toBe(defaultSettings.speed);
  });

  it("does not copy inherited prototype properties", () => {
    const p = instance();
    const options = Object.create({ minimum: 0.42, showSpinner: false }) as ProgressOptions;
    options.speed = 321;

    p.configure(options);

    expect(p.settings.minimum).toBe(defaultSettings.minimum);
    expect(p.settings.showSpinner).toBe(defaultSettings.showSpinner);
    expect(p.settings.speed).toBe(321);
  });
});

describe("server-side rendering", () => {
  it("does not schedule an unbounded trickle loop without a document", () => {
    vi.useFakeTimers();
    const p = createProgress({ trickle: true, speed: 0 });
    tracked.push(p);

    vi.stubGlobal("document", undefined);

    expect(() => {
      p.start();
      p.set(0.5);
      p.done();
    }).not.toThrow();

    expect(p.status).toBeNull();
    // The Node event loop must not be pinned open by a timer chain.
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("promise()", () => {
  it("finishes when every tracked promise settles", async () => {
    const p = instance({ speed: 0 });
    const slow = new Promise<void>((resolve) => setTimeout(resolve, 10));

    p.promise(Promise.resolve()).promise(slow);
    expect(p.isStarted()).toBe(true);

    await tick(80);

    expect(p.status).toBeNull();
    expect(container()).toBeNull();
  });

  it("ignores non-promise input", () => {
    const p = instance();

    expect(() => p.promise(undefined as unknown as PromiseLike<unknown>)).not.toThrow();
    expect(p.isStarted()).toBe(false);
  });
});