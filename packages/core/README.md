# nprogress-next

> A minimalist, dependency-free, TypeScript-first progress bar for the top of the page — a drop-in replacement for [NProgress](https://github.com/rstacruz/nprogress) `0.2.0`.

NProgress is used by millions of projects, but its last release shipped in 2015.
`nprogress-next` keeps the API you already know (`start` / `done` / `set` / `inc`
/ `configure` / `.status`) and rebuilds it as a modern, typed library: ESM + CJS
+ CDN bundle, real types, no dependencies, and an accessible, themable default
stylesheet.

## Install

```sh
npm install nprogress-next
```

The default stylesheet is injected automatically on first render. If your bundler
strips injected CSS, import it explicitly: `import "nprogress-next/styles.css";`

## Quick start

```js
import NProgress from "nprogress-next";

NProgress.start();

// ... your request ...
NProgress.inc(); // optional manual nudge

NProgress.done();
```

Track a promise instead — the bar finishes when the last tracked promise settles:

```js
async function loadUser(id) {
  return NProgress.promise(fetch(`/api/users/${id}`).then((r) => r.json()));
}
```

## API

Every method returns the instance, so calls chain.

| Method                | Description                                                                        |
| --------------------- | ---------------------------------------------------------------------------------- |
| `start()`             | Shows the bar at `minimum` and starts the trickle loop.                              |
| `done(force?)`        | Fades out and removes the bar. Pass `true` to complete even when idle.              |
| `set(n)`              | Sets progress to `n` (`0..1`), clamped to `minimum..1`. `1` completes the bar.       |
| `inc(amount?)`        | Advances by `amount`; with no argument, by 0.2.0's random fraction of what remains. |
| `trickle()`           | One trickle step: `Math.random() * trickleRate`.                                    |
| `configure(options)`  | Merges options into the instance settings.                                          |
| `promise(p)`          | Tracks a promise; completes when the last one settles.                               |
| `remove()`            | Removes the bar from the DOM immediately.                                           |
| `subscribe(fn)`       | Subscribes to status changes. Returns an unsubscribe function.                      |
| `getPositioningCSS()` | Bar geometry as a CSS declaration string, for a fully custom bar.                   |
| `isStarted()`         | Whether a progress value is currently set.                                          |
| `isRendered()`        | Whether the container is currently in the DOM.                                      |
| `render(fromStart?)`  | Mounts the container. Mostly internal.                                              |
| `status`              | Current `0..1` progress, or `null` when idle. **Writable** (see below).             |
| `settings`            | Live settings object. Read-only by type; use `configure()` to change it.            |
| `version`             | Library version string.                                                             |
| `NProgress.default`   | The singleton itself, for `NProgress.default.start()`.                              |

`status` is a plain writable property for parity with 0.2.0, so the usual reset
idiom works in strict/ESM consumers: `NProgress.status = null`. Numbers are
clamped to `0..1`; anything else resets to `null`.

### Instances

`createProgress()` returns an isolated bar with its own settings, queue and
listeners — useful for two concurrent regions of the page:

```js
import { createProgress } from "nprogress-next";

const upload = createProgress({ parent: uploadPanel, ariaLabel: "Uploading" });
upload.start();
```

## Options

| Option                 | Type                              | Default                      | Description                                           |
| ---------------------- | --------------------------------- | ---------------------------- | ----------------------------------------------------- |
| `minimum`              | `number`                          | `0.08`                       | Value on `start()`, and the lower clamp for `set()`.   |
| `easing`               | `string`                          | `"ease"`                     | CSS easing for the bar transition.                     |
| `speed`                | `number`                          | `200`                        | Transition duration in ms.                             |
| `trickle`              | `boolean`                         | `true`                       | Auto-advance while visible.                            |
| `trickleRate`          | `number`                          | `0.02`                       | Maximum step per tick, as a fraction.                  |
| `trickleSpeed`         | `number`                          | `800`                        | Milliseconds between ticks.                            |
| `showSpinner`          | `boolean`                         | `true`                       | Render the corner spinner.                             |
| `barSelector`          | `string`                          | `'[role="bar"], .bar'`       | Bar node inside the template.                          |
| `spinnerSelector`      | `string`                          | `'[role="spinner"], .spinner'` | Spinner node inside the template.                   |
| `parent`               | `string \| HTMLElement`           | `"body"`                     | Mount point. Element or a valid CSS selector.          |
| `template`             | `string`                          | bar + spinner markup         | Markup rendered inside the container.                  |
| `id`                   | `string`                          | `"nprogress"`                | DOM id of the container.                               |
| `ariaLabel`            | `string \| null`                  | `"Loading"`                  | `aria-label`; `null` omits the attribute.              |
| `autoInjectStyles`     | `boolean`                         | `true`                       | Inject the default stylesheet on first render.         |
| `respectReducedMotion` | `boolean`                         | `true`                       | Collapse transitions when reduced motion is requested. |
| `positionUsing`        | `"translate" \| "margin" \| "left"` | `"translate"`              | Bar positioning strategy.                              |

`barSelector` / `spinnerSelector` accept comma-separated lists, resolved **in the
order written** rather than in document order — so the legacy 0.2.0 selectors win
on templates that carry both, exactly like the original.

`parent` is validated when it is configured: a value that is neither an element
nor a selector `document.querySelector` can parse throws immediately with a
named error, instead of failing later from inside a fade-out callback.

Custom templates keep working either way — legacy `role`-based markup and modern
class-based markup both resolve:

```js
NProgress.configure({
  template:
    '<div class="bar" role="bar"><div class="peg"></div></div>' +
    '<div class="spinner" role="spinner"><div class="spinner-icon"></div></div>',
});
```

### Accessibility and the legacy `role` attributes

The container is a real `role="progressbar"` with live `aria-valuenow` /
`aria-valuemin` / `aria-valuemax` and an `aria-label`, and while a bar is
running `<html>` carries `aria-busy="true"` (restored to its previous value
afterwards).

The decorative bar and spinner wrappers keep `role="bar"` / `role="spinner"`
**deliberately**, even though those are not valid ARIA roles and axe-style
linters will flag them. They are there for drop-in parity: 0.2.0 selected custom
templates with `[role="bar"]` / `[role="spinner"]`, so removing the attributes
would break every existing template that ships the original markup. Both
wrappers are `aria-hidden="true"`, so assistive technology never reaches them —
the only thing announced is the container. The bundled stylesheet targets the
classes (`.bar`, `.spinner`), never the roles, so hand-written markup behaves
predictably.

## Theming

Override the custom properties on `:root`, or on any element containing
`#nprogress`: `--np-color`, `--np-height`, `--np-z`, `--np-peg-width`,
`--np-spinner-size`, `--np-spinner-top`, `--np-spinner-right`.

```css
:root {
  --np-color: #29d; /* bar, peg glow and spinner */
  --np-height: 2px;
  --np-z: 1031;
  --np-peg-width: 100px;
  --np-spinner-size: 18px;
  --np-spinner-top: 15px;
  --np-spinner-right: 15px;
}
```

`getPositioningCSS()` returns the geometry as a declaration string if you would
rather build the bar yourself:

```js
NProgress.set(0.4);
myBar.style.cssText = NProgress.getPositioningCSS();
// => width:100%;height:var(--np-height, 2px);left:0;top:0;transform:translate3d(-60%,0,0)
```
## CDN

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/nprogress-next@0.1.0/dist/styles.css" />
<script src="https://cdn.jsdelivr.net/npm/nprogress-next@0.1.0/dist/nprogress-next.global.js"></script>
<script>
  NProgressNext.start()
  NProgressNext.done()
</script>
```

The global exposes the complete API — `start`, `done`, `set`, `inc`, `trickle`,
`configure`, `promise`, `render`, `remove`, `isStarted`, `isRendered`,
`getPositioningCSS`, `subscribe`, `status`, `settings`, `version` — plus
`NProgressNext.createProgress()`, `defaultSettings`, `injectStyles` and `styles`.

## SSR

Safe to import and call on the server: every DOM access is guarded, no timers
are scheduled without a `document`, and the trickle loop is skipped entirely, so
a render in Next.js, Nuxt or Astro will not pin the event loop open. Call
`start()` / `done()` on the client only.

## Size

**≈ 3 kB gzipped** for the ESM bundle, default stylesheet included, with zero
runtime dependencies. Budget-gated in CI by `pnpm size`.

[![gzip size](https://img.shields.io/endpoint?url=https%3A%2F%2Fnprogress-next.nachodiaz.es%2Fbadges%2Fsize.json&style=flat-square)](https://bundlephobia.com/package/nprogress-next@0.1.0)
[![dependencies](https://img.shields.io/endpoint?url=https%3A%2F%2Fnprogress-next.nachodiaz.es%2Fbadges%2Fdeps.json&style=flat-square)](https://bundlephobia.com/package/nprogress-next@0.1.0)

## License

[MIT](https://github.com/Naaach/nprogress-next/blob/main/LICENSE)

Copyright (c) 2013-2014 Rico Sta. Cruz (original NProgress)
Copyright (c) 2026 Nacho Diaz Perez (nprogress-next)

Docs and source: <https://github.com/Naaach/nprogress-next>
