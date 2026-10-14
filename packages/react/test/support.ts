import { cleanup, renderHook } from "@testing-library/react";
import { vi } from "vitest";
import type { ProgressInstance, ProgressOptions } from "nprogress-next";
import { useProgress } from "../src/index";
import type { UseProgressReturn } from "../src/index";

/**
 * Every instance a test creates is settled in `teardown()` so no trickle loop or
 * fade callback survives into the next test.
 *
 * A `Set`, not an array: `useProgress` owns its instance and tears it down on
 * unmount, so the same one gets registered more than once over a test's life.
 */
const tracked = new Set<ProgressInstance>();

export function track(instance: ProgressInstance): ProgressInstance {
  tracked.add(instance);
  return instance;
}

/**
 * Finish and tear down an instance. Safe to call in any state.
 *
 * `trickle`/`speed` are forced off first so the two fade callbacks `done()`
 * queues are 0 ms instead of 200 ms — `drainTimers()` then runs them instead of
 * letting them bleed into the next test.
 */
export function settle(instance: ProgressInstance): void {
  instance.configure({ trickle: false, speed: 0 });
  try {
    if (instance.status !== null) instance.done(true);
  } finally {
    instance.remove();
  }
}

/**
 * Runs every timer a test left behind to completion.
 *
 * Runs *before* the environment is restored, so the fake clock a test installed
 * is still the one being drained.
 */
export async function drainTimers(): Promise<void> {
  if (vi.isFakeTimers()) {
    // Twice: a settled queue step can schedule one more 0 ms callback.
    vi.runAllTimers();
    vi.runAllTimers();
    await Promise.resolve();
    return;
  }
  /**
   * 50 ms, not 10 ms.
   *
   * `done()` unwinds through a chain of five zero-millisecond callbacks (one per
   * queued `set()`, then two for the fade-out). Node clamps `setTimeout(fn, 0)`
   * to ~1 ms, and under jsdom each one measures closer to 3 ms — measured at
   * ~29 ms from `done()` to the container leaving the DOM, so a short wait
   * would race the very teardown this helper exists to make deterministic.
   */
  await new Promise((resolve) => setTimeout(resolve, 50));
}

/**
 * Shared `afterEach`: unmount first (so nothing can queue a React update from
 * outside `act()`), then settle every instance, then drain the timers they
 * queued.
 */
export async function teardown(): Promise<void> {
  cleanup();
  for (const instance of tracked) settle(instance);
  tracked.clear();
  await drainTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
}

/** Adapter tests share one jsdom document, so each test starts from a blank page. */
export function resetDom(): void {
  document.body.innerHTML = "";
  document.documentElement.className = "";
  document.documentElement.removeAttribute("aria-busy");
  document.getElementById("nprogress-next-styles")?.remove();
}

/**
 * Renders `useProgress` with a unit-test-friendly instance: `trickle` off and
 * `speed` 0, so a test can never leave an 800 ms loop or a 200 ms fade queued
 * for whichever test runs next.
 *
 * Options are passed as *props* so `rerender()` can change them and the hook's
 * "apply changed options through `configure()`" path can be exercised.
 */
export function renderProgressHook(options: ProgressOptions = {}) {
  const view = renderHook<UseProgressReturn, ProgressOptions>(
    (props) => useProgress({ trickle: false, speed: 0, ...props }),
    { initialProps: options },
  );
  track(view.result.current.progress);
  return view;
}