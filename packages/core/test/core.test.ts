import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createProgress, defaultSettings, NProgress } from "../src/index";
import facade from "../src/global";
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

/**
 * Unit-test instance: `trickle` is off and `speed` is 0 so a test can never
 * leave an 800 ms loop or a 200 ms fade callback queued for the next test.
 */
function instance(options: ProgressOptions = {}): ProgressInstance {
  const progress = createProgress({ trickle: false, speed: 0, ...options });
  tracked.push(progress);
  return progress;
}

/**
 * Finish and tear down an instance. Safe to call in any state.
 *
 * `trickle`/`speed` are forced off first so the two fade callbacks `done()`
 * queues are 0 ms instead of 200 ms — `afterEach` then drains them instead of
 * letting them bleed into the next test.
 */
function settle(progress: ProgressInstance): void {
  progress.configure({ trickle: false, speed: 0 });
  try {
    if (progress.status !== null) progress.done(true);
  } finally {
    progress.remove();
  }
}

/**
 * Runs every timer a test left behind to completion.
 *
 * Runs *before* the environment is restored in `afterEach`, so the fake clock
 * installed by the test is still the one being drained.
 */
async function drainTimers(): Promise<void> {
  if (vi.isFakeTimers()) {
    // Twice: a settled queue step can schedule one more 0 ms callback.
    vi.runAllTimers();
    vi.runAllTimers();
    await Promise.resolve();
    return;
  }
  await new Promise((resolve) => setTimeout(resolve, 10));
}

beforeEach(() => {
  document.body.innerHTML = "";
  document.documentElement.className = "";
  document.documentElement.removeAttribute("aria-busy");
});

afterEach(async () => {
  // Tear down *first*, while any fake clock the test installed is still
  // installed — restoring it first is what used to strand `done()`'s timers.
  for (const progress of tracked.splice(0)) settle(progress);
  settle(NProgress);
  await drainTimers();

  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();

  NProgress.configure({ ...defaultSettings });

  document.body.innerHTML = "";
  document.documentElement.className = "";
  document.documentElement.removeAttribute("aria-busy");
});

describe("0.2.0 default parity", () => {
  it("publishes the published nprogress@0.2.0 defaults", () => {
    /*
     * Written out by hand, on purpose. Restating `defaultSettings` (or a
     * copy-paste of it) can only ever prove the object equals itself, which is
     * how the widened selectors and the extra keys below survived an audit.
     *
     * nprogress@0.2.0 ships exactly these fourteen keys:
     *
     *   minimum, easing, speed, trickle, trickleRate, trickleSpeed,
     *   showSpinner, barSelector, spinnerSelector, parent, template,
     *   and (0.2.0 only) positionUsing.
     *
     * The ONLY intentional deviations from that object are:
     *   1. `template`      — adds `aria-hidden="true"` to both wrappers.
     *   2. `barSelector` / `spinnerSelector` — widened to accept the modern
     *      class-based markup as well as 0.2.0's legacy `role` markup, and
     *      ordered so the legacy selector is tried FIRST (see `queryFirst`).
     *   3. Four added keys with no 0.2.0 equivalent: `id`, `ariaLabel`,
     *      `autoInjectStyles`, `respectReducedMotion`.
     *
     * Every other value must stay byte-identical to 0.2.0.
     */
    const expected = {
      // --- verbatim from nprogress@0.2.0 -----------------------------------
      minimum: 0.08,
      easing: "ease",
      speed: 200,
      trickle: true,
      trickleRate: 0.02,
      trickleSpeed: 800,
      showSpinner: true,
      parent: "body",
      positionUsing: "translate",
      // --- deviation 1: aria-hidden on the decorative wrappers -------------
      template: TEMPLATE,
      // --- deviation 2: widened, legacy-role-first selectors ----------------
      barSelector: '[role="bar"], .bar',
      spinnerSelector: '[role="spinner"], .spinner',
      // --- deviation 3: keys 0.2.0 does not have ----------------------------
      id: "nprogress",
      ariaLabel: "Loading",
      autoInjectStyles: true,
      respectReducedMotion: true,
    };

    // Exact key set: an added or dropped key fails here, not just a value diff.
    expect(Object.keys(defaultSettings).sort()).toEqual(Object.keys(expected).sort());
    expect(defaultSettings).toEqual(expected);
  });

  it("keeps the widened selectors a superset of the 0.2.0 ones", () => {
    for (const [key, legacy] of [
      ["barSelector", '[role="bar"]'],
      ["spinnerSelector", '[role="spinner"]'],
    ] as const) {
      const list = defaultSettings[key].split(",").map((part) => part.trim());
      expect(list).toContain(legacy);
    }
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

  it("keeps default stylesheet matching when a custom id is configured", () => {
    const p = instance({ id: "custom-progress" });
    p.start();

    const root = document.getElementById("custom-progress");
    expect(root?.classList.contains("nprogress-container")).toBe(true);
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
    const p = instance({ speed: 321 });
    p.configure({ minimum: 0.3, showSpinner: false });

    expect(p.settings.minimum).toBe(0.3);
    expect(p.settings.showSpinner).toBe(false);
    // Keys the merge did not mention keep this instance's own value.
    expect(p.settings.speed).toBe(321);
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
    NProgress.configure({ trickle: false, speed: 0 });
    NProgress.start();
    expect(typeof NProgress.status).toBe("number");
    expect(NProgress.isRendered()).toBe(true);
    NProgress.done();
    expect(NProgress.status).toBeNull();
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

  it("runs the 0.2.0 trickle loop, not an inc() loop", () => {
    vi.useFakeTimers();
    // Math.random() === 0.5 makes every step exactly 0.5 * trickleRate === 0.01,
    // so the loop's whole trajectory is deterministic.
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const p = createProgress({ speed: 0 });
    tracked.push(p);

    p.start();
    expect(p.status).toBeCloseTo(0.08, 10);
    expect(vi.getTimerCount()).toBeGreaterThan(0);

    const seen: number[] = [];
    for (let tickIndex = 0; tickIndex < 5; tickIndex += 1) {
      vi.advanceTimersByTime(defaultSettings.trickleSpeed);
      seen.push(p.status ?? Number.NaN);
    }

    /*
     * NProgress 0.2.0's `work()` calls `NProgress.trickle()`, so the sequence is
     * 0.08, +0.01, +0.01, ... — one `trickleRate`-scaled step per tick.
     *
     * This assertion is the regression guard for a loop that called `inc()`
     * instead, which advanced by `(1 - n) * 0.1` and produced
     * 0.172, 0.255, 0.329, 0.396, 0.457 — roughly 4.5x ahead after 5 ticks, with
     * `trickleRate` left as dead configuration.
     */
    expect(seen).toEqual([0.09, 0.1, 0.11, 0.12, 0.13].map((n) => expect.closeTo(n, 10)));

    // Independently recomputed reference: the status after N repeated trickle().
    let reference = 0.08;
    const expected = Array.from({ length: 5 }, () => {
      reference = clamp(reference + 0.5 * defaultSettings.trickleRate, 0, 0.994);
      return reference;
    });
    expect(seen).toEqual(expected.map((n) => expect.closeTo(n, 10)));

    p.done();
    vi.advanceTimersByTime(defaultSettings.trickleSpeed * 4);

    expect(p.status).toBeNull();
    expect(container()).toBeNull();
    // Zero leaked timers: the loop and the fade-out both drained.
    expect(vi.getTimerCount()).toBe(0);
  });

  it("scales the loop step with trickleRate", () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const p = createProgress({ speed: 0, trickleRate: 0.1 });
    tracked.push(p);

    p.start();
    vi.advanceTimersByTime(defaultSettings.trickleSpeed);

    // 0.5 * 0.1 === 0.05 — only reachable if the loop goes through trickle().
    expect(p.status ?? 0).toBeCloseTo(0.13, 10);
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

describe("template / selector resolution", () => {
  it("transforms the inner [role=\"bar\"] of a nested legacy template", () => {
    // 0.2.0 only ever queried `[role="bar"]`, so on this markup it picks the
    // INNER node. `querySelector('.bar, [role="bar"]')` would pick the outer
    // `.bar` instead, because a comma-separated list resolves in document
    // order rather than selector order.
    const p = instance({ template: '<div class="bar"><div role="bar"></div></div>' });

    p.set(0.5);

    const outer = container()?.querySelector<HTMLElement>(".bar");
    const inner = container()?.querySelector<HTMLElement>('[role="bar"]');
    expect(outer).not.toBeNull();
    expect(inner).not.toBeNull();
    expect(inner).not.toBe(outer);

    expect(inner?.style.transform).toBe("translate3d(-50%,0,0)");
    expect(outer?.style.transform).toBe("");
    expect(outer?.getAttribute("style")).toBeNull();
  });

  it("removes the inner [role=\"spinner\"] of a nested legacy template", () => {
    // Distinct ids: only one container can exist per id, so the two templates
    // have to be rendered separately.
    const p = instance({
      id: "nprogress-legacy-spinner",
      showSpinner: false,
      template: '<div class="spinner"><div role="spinner"></div></div>',
    });
    p.start();

    const legacy = document.getElementById("nprogress-legacy-spinner");
    expect(legacy?.querySelector('[role="spinner"]')).toBeNull();
    // The legacy `.spinner` class survives; only the role-marked node went.
    expect(legacy?.querySelector(".spinner")).not.toBeNull();

    const q = instance({
      id: "nprogress-class-spinner",
      showSpinner: false,
      template: '<div class="spinner"></div>',
    });
    q.start();

    expect(document.getElementById("nprogress-class-spinner")?.querySelector(".spinner")).toBeNull();
  });

  it("still transforms a class-only custom template", () => {
    const p = instance({ template: '<div class="bar"><div class="peg"></div></div>' });

    p.set(0.25);

    const bar = container()?.querySelector<HTMLElement>(".bar");
    expect(bar).not.toBeNull();
    expect(bar?.style.transform).toBe("translate3d(-75%,0,0)");
    expect(bar?.style.left).toBe("0px");
  });

  it("honours a single-selector override exactly like 0.2.0", () => {
    const p = instance({
      barSelector: "#custom-bar",
      template: '<div class="bar"><div id="custom-bar"></div></div>',
    });

    p.set(0.5);

    expect(
      container()?.querySelector<HTMLElement>("#custom-bar")?.style.transform,
    ).toBe("translate3d(-50%,0,0)");
    expect(container()?.querySelector<HTMLElement>(".bar")?.style.transform).toBe("");
  });

  it("tolerates an empty selector in the list", () => {
    const p = instance({ barSelector: "  , .bar " });
    p.set(0.5);

    expect(container()?.querySelector<HTMLElement>(".bar")?.style.transform).toBe(
      "translate3d(-50%,0,0)",
    );
  });
});

describe("instance isolation and stale timers", () => {
  it("a stale done() fade timer cannot delete a newer instance's container", async () => {
    const a = instance({ speed: 20 });
    a.start();
    a.done(true);
    a.remove();

    // Same default id, next request. The element captured by `a`'s fade timer
    // is long gone, so a fresh `getElementById('nprogress')` would find — and
    // delete — this instance's bar.
    const b = instance({ speed: 20 });
    b.start();
    const mounted = container();
    expect(mounted).not.toBeNull();

    await tick(150);

    expect(container()).toBe(mounted);
    expect(b.isRendered()).toBe(true);
    expect(b.status).toBeCloseTo(defaultSettings.minimum, 10);
    expect(document.documentElement.getAttribute("aria-busy")).toBe("true");
  });

  it("does not let a stale timer steal another instance's busy state", async () => {
    const a = instance({ speed: 10 });
    a.start();
    a.done(true);
    a.remove();

    const b = instance({ speed: 10 });
    b.start();

    await tick(150);

    expect(document.documentElement.getAttribute("aria-busy")).toBe("true");
    expect(document.documentElement.className).toContain("nprogress-busy");

    b.remove();
    expect(document.documentElement.hasAttribute("aria-busy")).toBe(false);
  });

  it("only detaches the element it captured", async () => {
    const p = instance();
    p.start();
    const first = container();

    // `done()` captures the container it faded synchronously; the id is only
    // stolen afterwards, which is exactly the window the fade timer lives in.
    p.done(true);
    expect(first).not.toBeNull();

    first?.remove();
    const second = document.createElement("div");
    second.id = "nprogress";
    document.body.appendChild(second);

    await tick(60);

    expect(container()).toBe(second);
  });
});

describe("status is writable (0.2.0 parity)", () => {
  it("accepts a direct assignment instead of throwing in strict mode", () => {
    const p = instance();
    p.start();

    expect(() => {
      p.status = null;
    }).not.toThrow();
    expect(p.status).toBeNull();
    expect(p.isStarted()).toBe(false);

    p.status = 0.42;
    expect(p.status).toBeCloseTo(0.42, 10);
    expect(p.isStarted()).toBe(true);
  });

  it("supports the `NProgress.status = null` reset idiom", () => {
    NProgress.configure({ trickle: false, speed: 0 });
    NProgress.start();
    expect(NProgress.status).toBeCloseTo(defaultSettings.minimum, 10);

    expect(() => {
      NProgress.status = null;
    }).not.toThrow();
    expect(NProgress.status).toBeNull();

    // Readable back, and the DOM state follows the reset.
    NProgress.remove();
    expect(container()).toBeNull();
    expect(NProgress.isRendered()).toBe(false);
  });

  it("clamps assigned numbers and treats anything else as a reset", () => {
    const p = instance();

    p.status = 5;
    expect(p.status).toBe(1);

    p.status = -3;
    expect(p.status).toBe(0);

    p.status = Number.NaN;
    expect(p.status).toBeNull();

    p.status = undefined as unknown as number;
    expect(p.status).toBeNull();
  });

  it("notifies subscribers of an assigned status", () => {
    const p = instance();
    const spy = vi.fn();
    p.subscribe(spy);

    p.status = 0.3;
    expect(spy).toHaveBeenCalledExactlyOnceWith(0.3);

    p.status = 0.3;
    expect(spy).toHaveBeenCalledTimes(1);

    p.status = null;
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenLastCalledWith(null);
  });
});

describe("invalid parent", () => {
  it("rejects a non-element, non-selector parent at configure time", () => {
    const p = instance();

    // A Document is an object with no querySelector guarantee: 0.2.0 would
    // have blown up with a bare SyntaxError from the middle of a fade-out.
    expect(() => p.configure({ parent: document as unknown as HTMLElement })).toThrow(TypeError);
    expect(() => p.configure({ parent: 42 as unknown as string })).toThrow(TypeError);
    expect(() => p.configure({ parent: null as unknown as string })).toThrow(TypeError);

    // Failing fast must not have touched the document.
    expect(container()).toBeNull();
    expect(document.documentElement.hasAttribute("aria-busy")).toBe(false);
    expect(document.documentElement.className).not.toContain("nprogress-busy");
  });

  it("rejects an unparsable selector with a named error", () => {
    const p = instance();

    expect(() => p.configure({ parent: "#" })).toThrow(SyntaxError);
    expect(() => p.configure({ parent: "#" })).toThrow(/"parent" is not a valid CSS selector/);
    expect(() => createProgress({ trickle: false, parent: ">" })).toThrow(SyntaxError);

    expect(document.documentElement.hasAttribute("aria-busy")).toBe(false);
  });

  it("never strands <html aria-busy> when the parent cannot be resolved", async () => {
    const p = instance();
    p.start();
    expect(document.documentElement.getAttribute("aria-busy")).toBe("true");

    // `settings` is a live object in 0.2.0 too, so `parent` can still be poked
    // behind `configure()`'s validation. The container is already mounted, so
    // only the removal path resolves it — which is exactly where the busy
    // state used to leak.
    p.settings.parent = document as unknown as string;

    expect(() => p.done(true)).not.toThrow();
    await tick(60);

    expect(container()).toBeNull();
    expect(document.documentElement.hasAttribute("aria-busy")).toBe(false);
    expect(document.documentElement.className).not.toContain("nprogress-busy");

    // A leaked refcount would show up here: `busyOwners` would still be >= 1,
    // so this second instance would release to 1 owner and `<html>` would stay
    // busy forever.
    const q = instance();
    q.start();
    expect(document.documentElement.getAttribute("aria-busy")).toBe("true");
    q.done(true);
    await tick(60);
    expect(document.documentElement.hasAttribute("aria-busy")).toBe(false);
    expect(document.documentElement.className).not.toContain("nprogress-busy");
  });

  it("falls back to body when an unusable parent is set before rendering", async () => {
    const p = instance();
    p.settings.parent = document as unknown as string;

    expect(() => p.start()).not.toThrow();
    expect(document.body.querySelector("#nprogress")).not.toBeNull();
    expect(document.documentElement.getAttribute("aria-busy")).toBe("true");

    expect(() => p.done(true)).not.toThrow();
    await tick(60);
    expect(container()).toBeNull();
    expect(document.documentElement.hasAttribute("aria-busy")).toBe(false);
  });

  it("falls back to document.body when the selector matches nothing", async () => {
    const p = instance({ parent: "#definitely-not-here" });

    p.start();

    expect(document.body.querySelector("#nprogress")).not.toBeNull();
    expect(p.isRendered()).toBe(true);
    // `body` is the fallback, so the custom-parent marker must not be applied.
    expect(document.body.className).not.toContain("nprogress-custom-parent");

    p.done(true);
    await tick(60);
    expect(container()).toBeNull();
  });

  it("removes the custom-parent marker on a real custom parent", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);

    const p = instance({ parent: host });
    p.start();
    expect(host.className).toContain("nprogress-custom-parent");

    p.remove();
    expect(host.className).not.toContain("nprogress-custom-parent");
    expect(host.querySelector("#nprogress")).toBeNull();
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
    const p = instance();

    p.start();
    expect(document.documentElement.getAttribute("aria-busy")).toBe("true");

    p.done();
    await tick(60);

    expect(document.documentElement.getAttribute("aria-busy")).toBe("false");
  });

  it("keeps the busy state while another instance is still running", () => {
    const a = instance();
    const b = instance();

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

  it("leaves no junk class attribute behind on <html>", () => {
    const p = instance();

    p.start();
    expect(document.documentElement.className).toBe("nprogress-busy");

    p.remove();

    // 0.2.0's off-by-one `substring(0, className.length - 1)` left a lone
    // space here, producing `class=" "` on the document element.
    expect(document.documentElement.className).toBe("");
    expect(document.documentElement.className).not.toContain(" ");
  });

  it("preserves unrelated classes on <html>", () => {
    document.documentElement.className = "theme-dark js";
    const p = instance();

    p.start();
    expect(document.documentElement.className).toContain("theme-dark js nprogress-busy");

    p.remove();
    expect(document.documentElement.className).toBe("theme-dark js");
  });
});

describe("getPositioningCSS()", () => {
  it("returns the translate positioning by default", () => {
    const p = instance();

    p.set(0.5);

    expect(p.getPositioningCSS()).toBe(
      "width:100%;height:var(--np-height, 2px);left:0;top:0;transform:translate3d(-50%,0,0)",
    );
  });

  it("returns left/margin-left pairs when positionUsing is margin", () => {
    const p = instance({ positionUsing: "margin" });

    p.set(0.25);

    expect(p.getPositioningCSS()).toBe(
      "width:100%;height:var(--np-height, 2px);left:-75%;margin-left:75%;top:0",
    );
  });

  it("returns a plain left percentage when positionUsing is left", () => {
    const p = instance({ positionUsing: "left" });

    p.set(0.25);

    expect(p.getPositioningCSS()).toBe(
      "width:100%;height:var(--np-height, 2px);left:-75%;top:0",
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

  it("re-applies a reconfigured aria-label to the live DOM", () => {
    const p = instance();
    p.start();
    expect(container()?.getAttribute("aria-label")).toBe("Loading");

    p.configure({ ariaLabel: "Cargando" });
    p.set(0.4);
    expect(p.settings.ariaLabel).toBe("Cargando");
    expect(container()?.getAttribute("aria-label")).toBe("Cargando");

    p.configure({ ariaLabel: null });
    p.set(0.5);
    expect(container()?.hasAttribute("aria-label")).toBe(false);

    p.configure({ ariaLabel: "Loading" });
    p.set(0.6);
    expect(container()?.getAttribute("aria-label")).toBe("Loading");
  });
});

describe("configure()", () => {
  it("ignores explicit undefined values", () => {
    const p = instance({ speed: 321 });
    p.configure({ speed: undefined });

    expect(p.settings.speed).toBe(321);
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

  it("skips parent validation when there is no document to parse against", () => {
    vi.stubGlobal("document", undefined);
    const p = createProgress({ trickle: false, parent: "#" });
    tracked.push(p);

    expect(() => p.start()).not.toThrow();
    expect(p.status).toBe(defaultSettings.minimum);
  });
});

describe("promise()", () => {
  it("finishes when every tracked promise settles", async () => {
    const p = instance();
    const slow = new Promise<void>((resolve) => setTimeout(resolve, 10));

    p.promise(Promise.resolve()).promise(slow);
    expect(p.isStarted()).toBe(true);

    await tick(80);

    expect(p.status).toBeNull();
    expect(container()).toBeNull();
  });

  it("advances by (initial - current) / initial as each promise settles", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const p = instance();
    const seen: Array<number | null> = [];
    p.subscribe((value) => seen.push(value));

    const resolvers: Array<() => void> = [];
    const pending = [0, 1, 2].map(
      () =>
        new Promise<void>((resolve) => {
          resolvers.push(resolve);
        }),
    );

    p.promise(pending[0]!).promise(pending[1]!).promise(pending[2]!);
    expect(p.isStarted()).toBe(true);
    expect(p.status).toBeCloseTo(defaultSettings.minimum, 10);

    // `initial - current` is the number of promises that have *finished*, so
    // the bar walks 1/3, 2/3 as each one resolves, then `done()` takes over.
    resolvers[0]!();
    await tick(20);
    expect(p.status).toBeCloseTo(1 / 3, 10);

    resolvers[1]!();
    await tick(20);
    expect(p.status).toBeCloseTo(2 / 3, 10);

    resolvers[2]!();
    await tick(60);

    expect(seen[0]).toBeCloseTo(defaultSettings.minimum, 10);
    expect(seen[1]).toBeCloseTo(1 / 3, 10);
    expect(seen[2]).toBeCloseTo(2 / 3, 10);
    expect(seen[seen.length - 1]).toBeNull();
    expect(p.status).toBeNull();
    expect(container()).toBeNull();
  });

  it("rejects are treated exactly like resolutions", async () => {
    const p = instance();

    p.promise(Promise.reject(new Error("boom"))).promise(Promise.resolve("ok"));

    await tick(60);
    expect(p.status).toBeNull();
    expect(container()).toBeNull();
  });

  it("ignores non-promise input", () => {
    const p = instance();

    expect(() => p.promise(undefined as unknown as PromiseLike<unknown>)).not.toThrow();
    expect(p.isStarted()).toBe(false);
  });
});

describe("CDN global facade", () => {
  it("publishes itself on the browser global", () => {
    expect((globalThis as unknown as Record<string, unknown>).NProgressNext).toBe(facade);
  });

  it("forwards the complete singleton API", () => {
    for (const key of [
      "start",
      "done",
      "set",
      "inc",
      "trickle",
      "configure",
      "promise",
      "render",
      "remove",
      "isStarted",
      "isRendered",
      "getPositioningCSS",
      "subscribe",
    ] as const) {
      expect(typeof facade[key], key).toBe("function");
    }

    for (const key of ["createProgress", "defaultSettings", "injectStyles", "version", "styles"] as const) {
      expect(facade[key], key).toBeDefined();
    }
    expect(facade.version).toBe(version);
    expect(facade.default).toBe(NProgress);
  });

  it("exposes getPositioningCSS() and subscribe() as working members", () => {
    NProgress.configure({ trickle: false, speed: 0 });

    facade.start();
    facade.set(0.5);

    expect(facade.status).toBeCloseTo(0.5, 10);
    expect(facade.getPositioningCSS()).toBe(NProgress.getPositioningCSS());
    expect(facade.getPositioningCSS()).toContain("translate3d(-50%,0,0)");

    const spy = vi.fn();
    const off = facade.subscribe(spy);
    facade.set(0.6);
    expect(spy).toHaveBeenCalledWith(0.6);
    off();
    spy.mockClear();
    facade.set(0.7);
    expect(spy).not.toHaveBeenCalled();

    facade.done();
  });

  it("keeps the facade status accessor writable", () => {
    NProgress.configure({ trickle: false, speed: 0 });
    facade.start();
    expect(facade.status).not.toBeNull();

    facade.status = null;
    expect(facade.status).toBeNull();
    expect(NProgress.status).toBeNull();

    facade.remove();
  });

  it("creates isolated instances from the facade", async () => {
    const p = facade.createProgress({ trickle: false, speed: 0 });
    tracked.push(p);

    p.start();
    expect(p.status).toBeCloseTo(defaultSettings.minimum, 10);
    expect(p.isRendered()).toBe(true);

    p.done(true);
    await tick(60);
    expect(p.isRendered()).toBe(false);
  });
});
