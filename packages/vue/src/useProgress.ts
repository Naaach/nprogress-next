import { computed, getCurrentScope, onScopeDispose, shallowRef, watch } from "vue";
import type { ComputedRef, Ref } from "vue";
import { createProgress } from "nprogress-next";
import type { ProgressInstance, ProgressOptions } from "nprogress-next";

/**
 * Everything `useProgress()` hands back.
 *
 * `status` / `isStarted` / `isRendered` are refs so a template or a computed
 * re-renders the moment the core instance changes — no polling, no manual
 * `watch`.
 */
export interface UseProgressReturn {
  /** The underlying core instance. Use it for anything the helpers do not cover. */
  progress: ProgressInstance;
  /** Current progress between `0` and `1`, or `null` when idle. */
  status: Ref<number | null>;
  /** Whether a progress value is currently set. */
  isStarted: ComputedRef<boolean>;
  /** Whether the core container is currently in the document. */
  isRendered: ComputedRef<boolean>;
  /** Shows the bar and starts the trickle loop. */
  start(): void;
  /** Fades out and removes the bar. Pass `true` to complete even when idle. */
  done(force?: boolean): void;
  /** Sets the progress to a number between `0` and `1`. */
  set(n: number): void;
  /** Advances by `amount`, or by the random trickle when omitted. */
  inc(amount?: number): void;
}

/**
 * Reactive wrapper around an isolated core instance.
 *
 * ```ts
 * const { status, isStarted, start, done } = useProgress();
 * ```
 *
 * Every instance is created once per call — two components calling this get two
 * independent bars — and the core's `subscribe` list is torn down with the
 * surrounding effect scope, so unmounting a component never leaves a listener
 * (or a reactive ref) behind.
 *
 * SSR-safe: nothing here touches `window`/`document`, and the core skips its
 * trickle loop when there is no DOM, so a `renderToString()` on the server
 * schedules no timers and pins no event loop.
 *
 * @param options Core options. Mutate them (or pass a `reactive()` object) and
 *   the instance is re-`configure()`d automatically.
 */
export function useProgress(options: ProgressOptions = {}): UseProgressReturn {
  // `undefined` values are dropped by `createProgress`, so `options` can be
  // passed straight through without pre-filtering.
  const progress = createProgress(options);

  /**
   * `shallowRef`, not `ref`: the value is a primitive, and a `ref` would only
   * add a `Proxy` round-trip on every trickle tick.
   */
  const status = shallowRef<number | null>(progress.status);

  const isStarted = computed(() => typeof status.value === "number");

  /**
   * `isRendered()` reads the document, which is not reactive — so `status` is
   * read first purely to register a dependency.
   *
   * That is enough: the core emits *before* it touches the DOM inside `set()`,
   * so the flag is deliberately evaluated lazily, when a component re-renders
   * after the synchronous DOM work has already happened. Evaluating it inside
   * the subscription callback instead would report `false` on the very first
   * `start()`, because the container does not exist yet at that point.
   */
  const isRendered = computed(() => {
    void status.value;
    return typeof document !== "undefined" && progress.isRendered();
  });

  const unsubscribe = progress.subscribe((value) => {
    status.value = value;
  });

  // Options are applied through `configure()` rather than by recreating the
  // instance: recreating it would drop the current status and every listener.
  //
  // The source is a getter rather than the object itself — Vue rejects a bare
  // plain object as a watch source ("Invalid watch source") unless it is
  // reactive. Wrapping it means a `reactive()` options object is still tracked
  // deeply, while a plain literal is simply never watched and costs nothing.
  const stopWatchingOptions = watch(
    () => options,
    (next) => progress.configure(next),
    { deep: true },
  );

  /*
   * `onScopeDispose` only fires inside `setup()`. Calling it bare would warn
   * ("no active effect scope") for anyone calling the composable from a plain
   * module or a store, so the teardown is registered conditionally — outside a
   * scope the caller keeps ownership of `progress` (and can call `remove()`).
   */
  if (getCurrentScope()) {
    onScopeDispose(() => {
      unsubscribe();
      stopWatchingOptions();
    });
  }

  return {
    progress,
    status,
    isStarted,
    isRendered,
    start: () => {
      progress.start();
    },
    done: (force?: boolean) => {
      progress.done(force);
    },
    set: (n: number) => {
      progress.set(n);
    },
    inc: (amount?: number) => {
      progress.inc(amount);
    },
  };
}