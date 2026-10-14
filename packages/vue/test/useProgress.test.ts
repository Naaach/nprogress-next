import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, nextTick, reactive } from "vue";
import type { ProgressInstance, ProgressOptions } from "nprogress-next";
import { ProgressBar, useProgress, type UseProgressReturn } from "../src/index";

/* ------------------------------------------------------------------ */
/* Harness                                                             */
/* ------------------------------------------------------------------ */

const container = (): HTMLElement | null => document.getElementById("nprogress");

/** Every instance created here is settled in `afterEach` so no timer chain survives a test. */
const tracked: ProgressInstance[] = [];

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

/** Runs every timer a test left behind to completion (mirrors the core suite). */
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

/**
 * Mounts a throwaway component whose `setup()` calls `useProgress()` and hands
 * the return value back to the test.
 *
 * `trickle: false` and `speed: 0` are forced on so a unit test can never leave
 * an 800 ms loop or a 200 ms fade callback queued for the next one.
 */
function host(options: ProgressOptions = {}): {
  api: UseProgressReturn;
  wrapper: ReturnType<typeof mount>;
} {
  let api!: UseProgressReturn;
  const wrapper = mount(
    defineComponent({
      setup() {
        api = useProgress({ trickle: false, speed: 0, ...options });
        tracked.push(api.progress);
        return () => h("div", { class: "host" });
      },
    }),
  );
  return { api, wrapper };
}

/**
 * Same, but the host renders `<ProgressBar />` from the reactive state — the
 * wiring the README recommends.
 */
function barHost(options: ProgressOptions = {}): {
  api: UseProgressReturn;
  wrapper: ReturnType<typeof mount>;
} {
  let api!: UseProgressReturn;
  const wrapper = mount(
    defineComponent({
      setup() {
        api = useProgress({ trickle: false, speed: 0, ...options });
        tracked.push(api.progress);
        return () =>
          h(ProgressBar, {
            progress: api.status.value ?? 0,
            visible: api.isStarted.value,
            label: "Loading profile",
          });
      },
    }),
  );
  return { api, wrapper };
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
  await drainTimers();

  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/* ------------------------------------------------------------------ */
/* Tests                                                               */
/* ------------------------------------------------------------------ */

describe("useProgress() state", () => {
  it("starts idle", () => {
    const { api } = host();
    expect(api.status.value).toBeNull();
    expect(api.isStarted.value).toBe(false);
    expect(api.isRendered.value).toBe(false);
    expect(container()).toBeNull();
  });

  it("exposes the underlying core instance", () => {
    const { api } = host({ minimum: 0.5 });
    expect(api.progress.version).toBeTypeOf("string");
    expect(api.progress.settings.minimum).toBe(0.5);
    expect(api.progress.isStarted()).toBe(false);
  });

  it("creates an isolated instance per call", () => {
    const first = host().api;
    const second = host().api;
    expect(first.progress).not.toBe(second.progress);

    first.start();
    expect(first.status.value).not.toBeNull();
    expect(second.status.value).toBeNull();
  });

  it("re-applies options through configure() when they change", async () => {
    const options = reactive<ProgressOptions>({ minimum: 0.2, showSpinner: false });
    const wrapper = mount(
      defineComponent({
        setup() {
          const api = useProgress(options);
          tracked.push(api.progress);
          return () => h("div");
        },
      }),
    );

    expect(wrapper.exists()).toBe(true);
    options.minimum = 0.4;
    options.showSpinner = true;
    await nextTick();

    // Same instance, re-configured — not a freshly created one.
    expect(tracked[0]?.settings.minimum).toBe(0.4);
    expect(tracked[0]?.settings.showSpinner).toBe(true);
  });
});

describe("useProgress() controls", () => {
  it("start() sets status, isStarted and renders the container", async () => {
    const { api } = host();
    api.start();
    await nextTick();

    expect(api.isStarted.value).toBe(true);
    expect(api.status.value).toBeCloseTo(0.08, 5);
    expect(api.isRendered.value).toBe(true);
    expect(container()).not.toBeNull();
  });

  it("set(n) updates status", async () => {
    const { api } = host();
    api.start();
    api.set(0.5);
    await nextTick();

    expect(api.status.value).toBe(0.5);
    expect(api.isStarted.value).toBe(true);
  });

  it("inc(amount) advances status", async () => {
    const { api } = host();
    api.start();
    const before = api.status.value ?? 0;
    api.inc(0.25);
    await nextTick();

    expect(api.status.value).toBeCloseTo(before + 0.25, 5);
  });

  it("inc() without an argument still advances", async () => {
    const { api } = host();
    api.start();
    const before = api.status.value ?? 0;
    api.inc();
    await nextTick();

    expect(api.status.value).toBeGreaterThan(before);
  });

  it("done() resets status and isStarted", async () => {
    const { api } = host();
    api.start();
    await nextTick();
    api.done();
    await nextTick();

    expect(api.status.value).toBeNull();
    expect(api.isStarted.value).toBe(false);
  });

  it("set(1) completes the bar", async () => {
    const { api } = host();
    api.start();
    api.set(1);
    await nextTick();

    expect(api.status.value).toBeNull();
    expect(api.isStarted.value).toBe(false);
  });
});

describe("useProgress() + <ProgressBar />", () => {
  it("renders the bar only while started, and updates reactively", async () => {
    const { api, wrapper } = barHost();

    expect(wrapper.find(".np-root").exists()).toBe(false);

    api.start();
    await nextTick();
    expect(wrapper.find(".np-root").exists()).toBe(true);
    expect(wrapper.find(".np-root").attributes("aria-valuenow")).toBe("8");

    api.set(0.6);
    await nextTick();
    expect(wrapper.find(".np-root").attributes("aria-valuenow")).toBe("60");
    expect(wrapper.find(".np-bar").attributes("style")).toContain("translate3d(-40%,0,0)");

    api.done();
    await nextTick();
    expect(wrapper.find(".np-root").exists()).toBe(false);
  });

  it("keeps the aria-label the host asked for", async () => {
    const { api, wrapper } = barHost();
    api.start();
    await nextTick();
    expect(wrapper.find(".np-root").attributes("aria-label")).toBe("Loading profile");
  });
});

describe("useProgress() teardown", () => {
  it("unsubscribes on unmount, so later core changes do not touch the ref", async () => {
    const { api, wrapper } = host();
    api.start();
    await nextTick();
    const started = api.status.value;

    wrapper.unmount();

    // The instance is still alive and still reports its own state...
    api.progress.set(0.42);
    expect(api.progress.status).toBe(0.42);
    // ...but the composable's ref is frozen at the last value the component saw.
    expect(api.status.value).toBe(started);
  });

  it("leaves no timers behind once the instance is settled", async () => {
    vi.useFakeTimers();
    const { api } = host();
    api.start();
    api.set(0.5);
    vi.runAllTimers();
    api.done();
    vi.runAllTimers();
    vi.runAllTimers();

    settle(api.progress);
    vi.runAllTimers();
    vi.runAllTimers();

    expect(vi.getTimerCount()).toBe(0);
  });

  it("does not warn when used outside an effect scope", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const api = useProgress({ trickle: false, speed: 0 });
    tracked.push(api.progress);

    expect(warn).not.toHaveBeenCalled();
    expect(api.isStarted.value).toBe(false);
  });

  it("removes the container and releases aria-busy on unmount", async () => {
    const { api, wrapper } = barHost();
    api.start();
    await nextTick();
    expect(document.documentElement.getAttribute("aria-busy")).toBe("true");

    wrapper.unmount();
    // `onScopeDispose` only detaches the listener; the core container is the
    // instance's own responsibility, which `afterEach`'s `settle()` performs.
    settle(api.progress);
    expect(container()).toBeNull();
    expect(document.documentElement.hasAttribute("aria-busy")).toBe(false);
  });
});