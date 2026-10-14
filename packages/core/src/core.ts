import styles from "./styles";
import type { ProgressInstance, ProgressOptions, ProgressSettings } from "./types";

/** Library version. Also exposed as `NProgress.version` (0.2.0 API). */
export const version = "0.1.0";

const DEFAULT_TEMPLATE =
  '<div class="bar" role="bar" aria-hidden="true"><div class="peg"></div></div>' +
  '<div class="spinner" role="spinner" aria-hidden="true"><div class="spinner-icon"></div></div>';

/**
 * Default settings, shared as the base of every instance.
 *
 * These values are a deliberate port of the **published** `nprogress@0.2.0`
 * defaults (not `master`), so existing integrations keep behaving the same.
 */
export const defaultSettings: ProgressSettings = {
  minimum: 0.08,
  easing: "ease",
  speed: 200,
  trickle: true,
  trickleRate: 0.02,
  trickleSpeed: 800,
  showSpinner: true,
  // Comma selectors: the modern class-based default template *and* legacy
  // 0.2.0 custom templates (which only carried `role="bar"` / `role="spinner"`)
  // keep resolving.
  barSelector: '.bar, [role="bar"]',
  spinnerSelector: '.spinner, [role="spinner"]',
  parent: "body",
  template: DEFAULT_TEMPLATE,
  id: "nprogress",
  ariaLabel: "Loading",
  autoInjectStyles: true,
  respectReducedMotion: true,
  positionUsing: "translate",
};

const STYLE_ID = "nprogress-next-styles";

/** Injects the default stylesheet once, if the DOM is available. */
export function injectStyles(): void {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = styles;
  (document.head ?? document.documentElement).appendChild(style);
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function clamp(n: number, min: number, max: number): number {
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

/** Converts a `0..1` progress value into the bar `translate3d` percentage. */
function toBarPerc(n: number): number {
  return (-1 + n) * 100;
}

/**
 * Cross-realm safe element check: `instanceof HTMLElement` fails for elements
 * coming from another window/iframe, and `HTMLElement` may not exist at all
 * during SSR.
 */
function isElement(value: unknown): value is HTMLElement {
  return value != null && typeof value === "object" && (value as Node).nodeType === 1;
}

/** Normalised, space-padded class string. Named to avoid shadowing `classList`. */
function classNameOf(element: Element | null): string {
  const raw = (element && element.className) || "";
  return ` ${String(raw)} `.replace(/\s+/gi, " ");
}

function hasClass(element: Element | null, name: string): boolean {
  return classNameOf(element).indexOf(` ${name} `) >= 0;
}

/** Returns `true` only when the class was actually added by this call. */
function addClass(element: Element | null, name: string): boolean {
  if (!element || hasClass(element, name)) return false;
  element.className = (classNameOf(element) + name).substring(1);
  return true;
}

function removeClass(element: Element | null, name: string): void {
  if (!element || !hasClass(element, name)) return;
  const list = classNameOf(element).replace(` ${name} `, " ");
  element.className = list.substring(1, list.length - 1);
}

function removeElement(element: Element | null): void {
  if (element?.parentNode) element.parentNode.removeChild(element);
}

function camelCase(prop: string): string {
  return prop
    .replace(/^-ms-/, "ms-")
    .replace(/-([\da-z])/gi, (_match, letter: string) => letter.toUpperCase());
}

function hyphenate(prop: string): string {
  return prop.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

type StyleMap = Record<string, string | number | undefined>;

function applyStyles(element: HTMLElement, props: StyleMap): void {
  for (const key in props) {
    const value = props[key];
    if (value === undefined) continue;
    const style = element.style as unknown as Record<string, string>;
    style[camelCase(key)] = String(value);
  }
}

function serializeStyles(props: StyleMap): string {
  const parts: string[] = [];
  for (const key in props) {
    const value = props[key];
    if (value === undefined) continue;
    parts.push(`${hyphenate(camelCase(key))}:${String(value)}`);
  }
  return parts.join(";");
}

type QueueTask = (next: () => void) => void;

function createQueue(): (task: QueueTask) => void {
  const pending: QueueTask[] = [];
  const next = (): void => {
    const task = pending.shift();
    if (task) task(next);
  };
  return (task: QueueTask): void => {
    pending.push(task);
    if (pending.length === 1) next();
  };
}

/* ------------------------------------------------------------------ */
/* Document-level busy-state ownership                                 */
/* ------------------------------------------------------------------ */

/**
 * `aria-busy` / `nprogress-busy` live on `<html>`, which is shared by every
 * instance (and possibly the host app). Track ownership so the last instance
 * to finish restores whatever was there before, instead of clobbering it.
 */
let busyOwners = 0;
let busyPrevious: string | null = null;
let busyClassAdded = false;

/* ------------------------------------------------------------------ */
/* Factory                                                             */
/* ------------------------------------------------------------------ */

/**
 * Creates an isolated progress bar instance.
 *
 * The default export (`NProgress`) is a ready-to-use singleton, so most
 * projects never need to call this directly.
 */
export function createProgress(options: ProgressOptions = {}): ProgressInstance {
  const settings: ProgressSettings = { ...defaultSettings, ...options };
  const queue = createQueue();
  const listeners = new Set<(status: number | null) => void>();

  let status: number | null = null;
  let initial = 0;
  let current = 0;
  let ownsDocumentBusy = false;
  // Cached query object: `matchMedia` returns a live MediaQueryList, so this
  // stays correct while avoiding a fresh query on every `set()`.
  let reducedMotionQuery: MediaQueryList | null = null;

  const hasDocument = (): boolean => typeof document !== "undefined";

  const prefersReducedMotion = (): boolean => {
    if (!settings.respectReducedMotion) return false;
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
    try {
      if (!reducedMotionQuery) {
        reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      }
      return reducedMotionQuery.matches;
    } catch {
      return false;
    }
  };

  const speed = (): number => (prefersReducedMotion() ? 0 : settings.speed);

  const emit = (): void => {
    for (const listener of listeners) listener(status);
  };

  const getParent = (): HTMLElement | null => {
    if (!hasDocument()) return null;
    if (isElement(settings.parent)) return settings.parent;
    return document.querySelector<HTMLElement>(settings.parent);
  };

  const isRendered = (): boolean => hasDocument() && !!document.getElementById(settings.id);

  /**
   * Bar geometry + positioning for the current `positionUsing` setting.
   *
   * `width`/`height` are only part of the public `getPositioningCSS()` string
   * (which is meant to be usable standalone); the default stylesheet already
   * provides them, so `render()`/`set()` apply just the positioning part.
   */
  const positioningStyles = (n: number): StyleMap => {
    const perc = toBarPerc(n);
    switch (settings.positionUsing) {
      case "margin":
        return { left: `${perc}%`, marginLeft: `${-perc}%`, top: "0" };
      case "left":
        return { left: `${perc}%`, top: "0" };
      default:
        // "translate" — the 0.2.0 default.
        return { left: "0", top: "0", transform: `translate3d(${perc}%,0,0)` };
    }
  };

  const getPositioningCSS = (): string =>
    serializeStyles({
      width: "100%",
      height: "var(--nprogress-height, 2px)",
      ...positioningStyles(status ?? 0),
    });

  const claimDocumentBusy = (): void => {
    if (!hasDocument() || ownsDocumentBusy) return;
    const root = document.documentElement;
    if (busyOwners === 0) {
      busyPrevious = root.getAttribute("aria-busy");
      busyClassAdded = addClass(root, "nprogress-busy");
      root.setAttribute("aria-busy", "true");
    } else {
      addClass(root, "nprogress-busy");
    }
    busyOwners++;
    ownsDocumentBusy = true;
  };

  const releaseDocumentBusy = (): void => {
    if (!hasDocument() || !ownsDocumentBusy) return;
    ownsDocumentBusy = false;
    if (busyOwners > 0) busyOwners--;
    // Another instance is still running: leave `<html>` alone.
    if (busyOwners > 0) return;
    const root = document.documentElement;
    if (busyClassAdded) removeClass(root, "nprogress-busy");
    if (busyPrevious === null) root.removeAttribute("aria-busy");
    else root.setAttribute("aria-busy", busyPrevious);
    busyPrevious = null;
    busyClassAdded = false;
  };

  const render = (fromStart = false): HTMLElement | null => {
    if (!hasDocument()) return null;

    claimDocumentBusy();

    const existing = document.getElementById(settings.id);
    if (existing) return existing;

    if (settings.autoInjectStyles) injectStyles();

    const progress = document.createElement("div");
    progress.id = settings.id;
    progress.setAttribute("role", "progressbar");
    progress.setAttribute("aria-valuemin", "0");
    progress.setAttribute("aria-valuemax", "1");
    progress.setAttribute("aria-valuenow", String(status ?? 0));
    if (settings.ariaLabel) progress.setAttribute("aria-label", settings.ariaLabel);
    progress.innerHTML = settings.template;

    const bar = progress.querySelector<HTMLElement>(settings.barSelector);
    const parent = getParent() ?? document.body;

    if (bar) {
      applyStyles(bar, {
        // Order matters: the zero-duration transition must be written before
        // the initial transform, otherwise the bar animates in from 0% width.
        transition: "all 0 linear",
        ...positioningStyles(fromStart ? 0 : (status ?? 0)),
      });
    }

    if (!settings.showSpinner) {
      removeElement(progress.querySelector(settings.spinnerSelector));
    }

    if (parent !== document.body) addClass(parent, "nprogress-custom-parent");

    parent.appendChild(progress);
    return progress;
  };

  const remove = (): void => {
    if (!hasDocument()) return;
    const parent = getParent();
    releaseDocumentBusy();
    if (parent) removeClass(parent, "nprogress-custom-parent");
    removeElement(document.getElementById(settings.id));
  };

  const set = (n: number): ProgressInstance => {
    const started = isStarted();
    const value = clamp(n, settings.minimum, 1);
    const previous = status;
    status = value === 1 ? null : value;
    // Only notify on a real transition, otherwise the trickle loop (~every
    // `trickleSpeed` ms) would emit phantom events forever.
    if (status !== previous) emit();

    if (!hasDocument()) return api;

    const progress = render(!started);
    if (!progress) return api;

    progress.setAttribute("aria-valuenow", String(value));

    const ms = speed();
    const ease = settings.easing;
    const bar = progress.querySelector<HTMLElement>(settings.barSelector);

    // Force a repaint so the transition starts from the current position.
    void progress.offsetWidth;

    queue((next) => {
      // A template without a matching bar must not short-circuit the queue:
      // `done()` still has to fade out and remove the container.
      if (bar) {
        applyStyles(bar, {
          // Order matters (mirror image of `render`): the new transform has to
          // land before the transition that animates to it.
          ...positioningStyles(value),
          transition: `all ${ms}ms ${ease}`,
        });
      }

      if (value === 1) {
        applyStyles(progress, { transition: "none", opacity: 1 });
        void progress.offsetWidth;

        setTimeout(() => {
          applyStyles(progress, { transition: `all ${ms}ms linear`, opacity: 0 });
          setTimeout(() => {
            remove();
            next();
          }, ms);
        }, ms);
      } else {
        setTimeout(next, ms);
      }
    });

    return api;
  };

  const isStarted = (): boolean => typeof status === "number";

  const start = (): ProgressInstance => {
    if (!status) set(0);

    const work = (): void => {
      setTimeout(() => {
        if (!hasDocument() || !status) return;
        inc();
        work();
      }, settings.trickleSpeed);
    };

    // Guarded on `hasDocument()`: an unbounded timer chain would otherwise pin
    // the Node event loop open during SSR (Next/Nuxt/Lambda).
    if (settings.trickle && hasDocument()) work();

    return api;
  };

  const done = (force?: boolean): ProgressInstance => {
    if (!force && !status) return api;
    return inc(0.3 + 0.5 * Math.random()).set(1);
  };

  const inc = (amount?: number): ProgressInstance => {
    const n = status;
    if (!n) return start();

    let step = amount;
    if (typeof step !== "number") {
      step = (1 - n) * clamp(Math.random() * n, 0.1, 0.95);
    }

    return set(clamp(n + step, 0, 0.994));
  };

  const trickle = (): ProgressInstance => inc(Math.random() * settings.trickleRate);

  const configure = (options: ProgressOptions): ProgressInstance => {
    for (const key in options) {
      // Own properties only: inherited/prototype keys must not leak in.
      if (!Object.prototype.hasOwnProperty.call(options, key)) continue;
      const value = options[key as keyof ProgressOptions];
      if (value !== undefined) {
        (settings as unknown as Record<string, unknown>)[key] = value;
      }
    }
    return api;
  };

  const promise = (input: PromiseLike<unknown>): ProgressInstance => {
    if (!input || typeof (input as PromiseLike<unknown>).then !== "function") return api;

    if (current === 0) start();
    initial++;
    current++;

    const settle = (): void => {
      current--;
      if (current === 0) {
        initial = 0;
        done();
      } else {
        set((initial - current) / initial);
      }
    };

    Promise.resolve(input).then(settle, settle);
    return api;
  };

  const subscribe = (listener: (status: number | null) => void): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const api: ProgressInstance = {
    settings,
    version,
    get status() {
      return status;
    },
    start,
    done,
    set,
    inc,
    trickle,
    configure,
    promise,
    render,
    remove,
    isStarted,
    isRendered,
    getPositioningCSS,
    subscribe,
  };

  return api;
}

/**
 * Ready-to-use singleton, API-compatible with the original `NProgress` object.
 *
 * ```ts
 * import NProgress from "nprogress-next";
 * NProgress.start();
 * NProgress.done();
 * ```
 */
export const NProgress: ProgressInstance = createProgress();

export default NProgress;