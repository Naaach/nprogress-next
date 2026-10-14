import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createProgress } from "nprogress-next";
import type { ProgressInstance, ProgressOptions } from "nprogress-next";
import type { UseProgressReturn } from "./types";

/**
 * Immutable snapshot of an instance.
 *
 * `useSyncExternalStore` requires `getSnapshot` to be *stable*: React compares
 * consecutive results with `Object.is` during render, and a fresh object on
 * every call is an infinite render loop. One frozen object per distinct state
 * is therefore memoised inside the store reader rather than rebuilt per call.
 */
interface Snapshot {
  readonly status: number | null;
  readonly isStarted: boolean;
  readonly isRendered: boolean;
}

/**
 * The value every hook reports before it has a `document` — the server, and
 * the very first client render, which must match the server output to avoid a
 * hydration mismatch.
 *
 * Module-level and frozen so it doubles as the initial `getSnapshot()` result:
 * a brand-new instance really is idle.
 */
const IDLE: Snapshot = Object.freeze({ status: null, isStarted: false, isRendered: false });

/**
 * Object-valued settings (`parent: HTMLElement`, for one) cannot be
 * stringified meaningfully — `JSON.stringify` renders every element as `{}`,
 * so swapping one `<div>` for another would look like "no change". Identity
 * numbers keep those comparisons honest without keeping a strong reference.
 */
const objectIds = new WeakMap<object, number>();
let lastObjectId = 0;

const identify = (value: object): string => {
  let id = objectIds.get(value);
  if (id === undefined) {
    id = ++lastObjectId;
    objectIds.set(value, id);
  }
  return `#${id}`;
};

const describe = (value: unknown): string =>
  typeof value === "object" && value !== null ? identify(value) : String(value);

/**
 * A cheap, order-independent fingerprint of an options object, used to decide
 * whether `configure()` is worth calling again.
 *
 * Callers almost always write `useProgress({ minimum: 0.2 })`, which is a fresh
 * object literal on every render. Re-running `configure()` every render would
 * be harmless but pointless; worse, comparing by reference would mean *never*
 * noticing a real change if the object were hoisted into a module constant.
 */
const optionKey = (options: ProgressOptions | undefined): string => {
  if (!options) return "";
  const keys = Object.keys(options).sort();
  const parts: string[] = [];
  for (const key of keys) {
    const value = options[key as keyof ProgressOptions];
    // `configure()` ignores `undefined`, so a key only present-but-empty must
    // not count as a change.
    if (value === undefined) continue;
    parts.push(`${key}:${describe(value)}`);
  }
  return parts.join("|");
};

/**
 * Binds a `nprogress-next` instance to React state.
 *
 * ```tsx
 * const { progress, status, isStarted, start, done } = useProgress();
 * ```
 *
 * One isolated instance is created per hook call (lazily, so a render that is
 * thrown away never leaks one) and torn down on unmount. Later changes to
 * `options` are applied through `configure()`, which is why they are safe to
 * make inline.
 *
 * SSR-safe: nothing in the hook reads `window` or `document` during render, and
 * `getServerSnapshot` always reports the idle state.
 */
export function useProgress(options?: ProgressOptions): UseProgressReturn {
  // Lazy initialiser: `createProgress` allocates a settings object, a queue and
  // a listener set, and only the render that is actually kept should pay for it.
  const [instance] = useState<ProgressInstance>(() => createProgress(options));

  /**
   * The store reader. Recreated only if `instance` ever changes identity, which
   * it cannot — `useState` keeps the first instance forever — but going through
   * `useMemo` keeps the contract explicit and lint-clean.
   */
  const { subscribe, getSnapshot, getServerSnapshot } = useMemo(
    () => {
      let cache: Snapshot = IDLE;

      return {
        subscribe: (onStoreChange: () => void) => instance.subscribe(onStoreChange),
        getSnapshot: (): Snapshot => {
          const status = instance.status;
          const isRendered = instance.isRendered();
          const previous = cache;
          if (previous.status === status && previous.isRendered === isRendered) return previous;
          cache = { status, isStarted: typeof status === "number", isRendered };
          return cache;
        },
        getServerSnapshot: (): Snapshot => IDLE,
      };
    },
    [instance],
  );

  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const key = optionKey(options);
  const appliedKey = useRef<string | null>(null);

  /**
   * Deliberately *not* dependency-array driven: `options` is usually a fresh
   * literal each render, so the effect runs on every commit and `key` decides
   * whether anything actually changed. Depending on `options` itself would
   * re-`configure()` on every single render instead.
   */
  useEffect(() => {
    if (appliedKey.current === null) {
      // `createProgress(options)` already applied these on the first render.
      appliedKey.current = key;
      return;
    }
    if (appliedKey.current === key) return;
    appliedKey.current = key;
    if (options) instance.configure(options);
  });

  useEffect(
    () => () => {
      /**
       * The instance belongs to this hook, so the hook takes it down with
       * itself. Leaving it alone would strand the `start()` trickle chain (an
       * unbounded timer that nothing can ever stop once status is non-null) and
       * leave the container in `<body>`.
       *
       * `useSyncExternalStore` unsubscribed before this ran — effects tear down
       * in the order they were registered — so clearing `status` here cannot
       * reach a torn-down fiber.
       */
      instance.configure({ trickle: false });
      instance.status = null;
      instance.remove();
    },
    [instance],
  );

  const start = useCallback(() => void instance.start(), [instance]);
  const done = useCallback((force?: boolean) => void instance.done(force), [instance]);
  const set = useCallback((n: number) => void instance.set(n), [instance]);
  const inc = useCallback((amount?: number) => void instance.inc(amount), [instance]);

  return useMemo<UseProgressReturn>(
    () => ({
      progress: instance,
      status: snapshot.status,
      isStarted: snapshot.isStarted,
      isRendered: snapshot.isRendered,
      start,
      done,
      set,
      inc,
    }),
    [instance, snapshot, start, done, set, inc],
  );
}