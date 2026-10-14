import { act, render, renderHook, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProgressBar, useProgress } from "../src/index";
import type { UseProgressReturn } from "../src/index";
import { drainTimers, renderProgressHook, resetDom, teardown } from "./support";

const core = (): HTMLElement | null => document.getElementById("nprogress");

/**
 * The hook instance behind the currently rendered `<Harness />`.
 *
 * The harness owns its own `useProgress()` call — a *separate* instance from the
 * one `renderProgressHook()` returns — so a test that wants to assert "React
 * re-rendered" has to drive the harness's instance, not a second one.
 *
 * Read it through `api()` rather than capturing it: the hook returns a fresh
 * object on every change (that is what makes React re-render), so a captured
 * reference would still hold the pre-update snapshot.
 */
let harnessApi: UseProgressReturn | null = null;

const api = (): UseProgressReturn => {
  if (!harnessApi) throw new Error("<Harness /> is not rendered");
  return harnessApi;
};

/**
 * A component that wires the hook straight into `<ProgressBar />`, so every
 * assertion about "the bar updated" is really an assertion about React
 * re-rendering on its own — nothing below ever calls `rerender()`.
 */
function Harness(): ReactElement {
  const state = useProgress({ trickle: false, speed: 0 });
  harnessApi = state;
  // One template literal, not three children: `renderToString` puts a
  // `<!-- -->` separator between adjacent text nodes, and `textContent` in the
  // DOM tests should read the same either way.
  const readout = `${state.isStarted ? "started" : "idle"}:${
    state.status === null ? "null" : state.status.toFixed(2)
  }`;
  return (
    <>
      <output data-testid="readout">{readout}</output>
      <ProgressBar progress={state.status ?? 0} visible={state.isStarted} label="Harness" />
    </>
  );
}

const readout = (): string => screen.getByTestId("readout").textContent ?? "";
const harnessBar = (): HTMLElement => screen.getByLabelText("Harness");

beforeEach(() => {
  resetDom();
  harnessApi = null;
});

afterEach(async () => {
  await teardown();
});

describe("useProgress() — initial state", () => {
  it("starts idle and unrendered", () => {
    const { result } = renderProgressHook();

    expect(result.current.status).toBeNull();
    expect(result.current.isStarted).toBe(false);
    expect(result.current.isRendered).toBe(false);
    expect(core()).toBeNull();
  });

  it("creates one isolated instance per hook call", () => {
    const a = renderProgressHook();
    const b = renderProgressHook();

    expect(a.result.current.progress).not.toBe(b.result.current.progress);

    act(() => a.result.current.start());
    expect(a.result.current.isStarted).toBe(true);
    expect(b.result.current.isStarted).toBe(false);
  });

  it("keeps the same instance across re-renders", () => {
    const { result, rerender } = renderProgressHook();
    const first = result.current.progress;
    rerender();
    expect(result.current.progress).toBe(first);
  });
});

describe("useProgress() — driving the bar", () => {
  it("start() sets isStarted/status and mounts the core container", () => {
    const { result } = renderProgressHook();

    act(() => result.current.start());

    expect(result.current.isStarted).toBe(true);
    expect(result.current.status).not.toBeNull();
    expect(result.current.isRendered).toBe(true);
    expect(core()).not.toBeNull();
    expect(core()?.getAttribute("role")).toBe("progressbar");
    expect(document.documentElement.getAttribute("aria-busy")).toBe("true");
  });

  it("re-renders the component on start with no manual rerender", async () => {
    render(<Harness />);

    expect(readout()).toBe("idle:null");
    expect(screen.queryByLabelText("Harness")).toBeNull();

    await act(async () => {
      api().start();
      await drainTimers();
    });

    expect(readout()).toMatch(/^started:/);
    // `aria-valuenow` is the instance's `0..1` status scaled to a 0..100 percentage.
    const percent = Number(harnessBar().getAttribute("aria-valuenow"));
    expect(percent).toBe(Math.round((api().status ?? 0) * 100));
    expect(percent).toBeGreaterThanOrEqual(0);
    expect(percent).toBeLessThanOrEqual(100);
  });

  it("set(n) updates status and the rendered percentage", async () => {
    render(<Harness />);

    await act(async () => {
      api().start();
      await drainTimers();
    });
    await act(async () => {
      api().set(0.5);
      await drainTimers();
    });

    expect(api().status).toBeCloseTo(0.5, 5);
    expect(readout()).toBe("started:0.50");
    expect(harnessBar().getAttribute("aria-valuenow")).toBe("50");
  });

  it("inc(amount) advances status by the given step", async () => {
    render(<Harness />);

    await act(async () => {
      api().start();
      await drainTimers();
    });
    const before = api().status ?? 0;

    await act(async () => {
      api().inc(0.25);
      await drainTimers();
    });

    expect(api().status).toBeCloseTo(before + 0.25, 5);
    expect(harnessBar().getAttribute("aria-valuenow")).toBe(
      String(Math.round((api().status ?? 0) * 100)),
    );
  });

  it("done() completes the bar, clears the state and unmounts the DOM", async () => {
    render(<Harness />);

    await act(async () => {
      api().start();
      await drainTimers();
    });
    expect(api().isStarted).toBe(true);
    expect(core()).not.toBeNull();

    await act(async () => {
      api().done();
      await drainTimers();
    });

    expect(api().status).toBeNull();
    expect(api().isStarted).toBe(false);
    expect(readout()).toBe("idle:null");
    expect(screen.queryByLabelText("Harness")).toBeNull();
    // The core removes its container from a fade-out callback, which never
    // notifies subscribers — the instance itself is the source of truth here.
    expect(api().progress.isRendered()).toBe(false);
    expect(core()).toBeNull();
    expect(document.documentElement.hasAttribute("aria-busy")).toBe(false);
  });

  it("survives repeated start()/done() cycles", async () => {
    const { result } = renderProgressHook();

    for (let i = 0; i < 3; i++) {
      await act(async () => {
        result.current.start();
        await drainTimers();
      });
      expect(result.current.isStarted).toBe(true);

      await act(async () => {
        result.current.done(true);
        await drainTimers();
      });
      expect(result.current.isStarted).toBe(false);
      expect(core()).toBeNull();
    }
  });
});

describe("useProgress() — options", () => {
  it("applies option changes through configure()", () => {
    const { result, rerender } = renderProgressHook({ minimum: 0.2, ariaLabel: "Loading" });
    expect(result.current.progress.settings.minimum).toBe(0.2);

    rerender({ minimum: 0.5, ariaLabel: "Uploading" });

    expect(result.current.progress).toBe(result.current.progress);
    expect(result.current.progress.settings.minimum).toBe(0.5);
    expect(result.current.progress.settings.ariaLabel).toBe("Uploading");
  });

  it("does not re-configure when an equal options object changes identity", () => {
    const { result, rerender } = renderProgressHook({ minimum: 0.3 });
    const instance = result.current.progress;
    const spy = vi.spyOn(instance, "configure");

    rerender({ minimum: 0.3 });
    expect(spy).not.toHaveBeenCalled();

    rerender({ minimum: 0.4 });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ minimum: 0.4 }));
  });

  it("rejects an invalid parent when it is configured", () => {
    const { rerender } = renderProgressHook();
    expect(() => rerender({ parent: "[[" })).toThrow();
  });
});

describe("useProgress() — teardown", () => {
  it("unsubscribes on unmount and stops updating", async () => {
    const errors: unknown[][] = [];
    vi.spyOn(console, "error").mockImplementation((...args) => {
      errors.push(args);
    });

    const { result, unmount } = renderProgressHook();
    const instance = result.current.progress;
    act(() => result.current.start());
    expect(instance.isRendered()).toBe(true);

    unmount();

    // Nothing is subscribed any more: driving the instance afterwards must not
    // reach a torn-down fiber, and must not throw.
    expect(() => {
      instance.set(0.7);
      instance.done(true);
    }).not.toThrow();

    await drainTimers();
    expect(errors).toEqual([]);
    expect(instance.isRendered()).toBe(false);
  });

  it("removes the container and the busy flag on unmount", () => {
    const { result, unmount } = renderProgressHook();

    act(() => result.current.start());
    expect(core()).not.toBeNull();
    expect(document.documentElement.getAttribute("aria-busy")).toBe("true");

    unmount();

    expect(core()).toBeNull();
    expect(document.documentElement.hasAttribute("aria-busy")).toBe(false);
  });

  it("leaves no timers behind", () => {
    vi.useFakeTimers();
    const { result, unmount } = renderProgressHook();

    act(() => result.current.start());
    expect(vi.getTimerCount()).toBeGreaterThan(0);

    unmount();
    // One-shot fade/step callbacks clear themselves; a trickle loop would not.
    vi.runAllTimers();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("stops the trickle loop on unmount", () => {
    vi.useFakeTimers();
    const { result, unmount } = renderProgressHook({ trickle: true, trickleSpeed: 50 });
    const instance = result.current.progress;

    act(() => result.current.start());
    expect(instance.settings.trickle).toBe(true);

    unmount();

    expect(instance.settings.trickle).toBe(true);
    expect(instance.status).toBeNull();
    expect(instance.isRendered()).toBe(false);
    vi.runOnlyPendingTimers();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("preserves trickle settings through React StrictMode effect replay", () => {
    vi.useFakeTimers();
    const { result, unmount } = renderHook(
      (options: { trickle: boolean; trickleSpeed: number }) => useProgress(options),
      {
        initialProps: { trickle: true, trickleSpeed: 50 },
        reactStrictMode: true,
      },
    );
    const instance = result.current.progress;

    expect(instance.settings.trickle).toBe(true);
    act(() => result.current.start());
    expect(vi.getTimerCount()).toBeGreaterThan(0);

    unmount();
    expect(instance.settings.trickle).toBe(true);
    expect(instance.status).toBeNull();
    expect(instance.isRendered()).toBe(false);
    vi.runOnlyPendingTimers();
    expect(vi.getTimerCount()).toBe(0);
  });
});