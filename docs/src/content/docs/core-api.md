---
title: "Core API"
description: "Complete API reference for nprogress-next core."
order: 2
---

## Import

```js
import NProgress, { createProgress, defaultSettings, injectStyles, version } from 'nprogress-next'
import 'nprogress-next/styles.css' // optional
```

## Singleton: `NProgress`

The default export is a ready-to-use singleton, API-compatible with NProgress 0.2.0.

```js
import NProgress from 'nprogress-next'

NProgress.start()
NProgress.set(0.5)
NProgress.inc()
NProgress.done()
```

## `createProgress(options?)`

Creates an isolated instance. Use when you need multiple independent progress bars.

```js
import { createProgress } from 'nprogress-next'

const uploadProgress = createProgress({ minimum: 0.1, trickle: false })
const downloadProgress = createProgress({ parent: '#download-area' })

uploadProgress.start()
downloadProgress.start()
```

## Options (`ProgressOptions`)

All options are optional. Pass to `createProgress()` or `NProgress.configure()`.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `minimum` | number | `0.08` | Minimum progress shown on start |
| `easing` | string | `'ease'` | CSS easing for bar transition |
| `speed` | number | `200` | Transition duration in ms |
| `trickle` | boolean | `true` | Auto-advance while visible |
| `trickleRate` | number | `0.02` | Max fraction per trickle step (0.2.0 compat) |
| `trickleSpeed` | number | `800` | Interval between trickle steps (ms) |
| `showSpinner` | boolean | `true` | Render the corner spinner |
| `barSelector` | string | `'[role="bar"], .bar'` | Selector for bar element in template |
| `spinnerSelector` | string | `'[role="spinner"], .spinner'` | Selector for spinner element |
| `parent` | string \| HTMLElement | `'body'` | Where to mount the bar |
| `template` | string | see below | HTML template for the bar |
| `id` | string | `'nprogress'` | DOM id for the container |
| `ariaLabel` | string \| null | `'Loading'` | Accessible label (`null` to omit) |
| `autoInjectStyles` | boolean | `true` | Inject default stylesheet on first render |
| `respectReducedMotion` | boolean | `true` | Respect `prefers-reduced-motion` |
| `positionUsing` | string | `'translate'` | Positioning method (0.2.0 compat) |

### Default Template

```js
const DEFAULT_TEMPLATE = `
  <div class="bar" role="bar" aria-hidden="true">
    <div class="peg"></div>
  </div>
  <div class="spinner" role="spinner" aria-hidden="true">
    <div class="spinner-icon"></div>
  </div>
`
```

## Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `start()` | `ProgressInstance` | Show bar at `minimum`, begin trickle loop |
| `done(force?)` | `ProgressInstance` | Complete & hide. `force=true` shows even if not started |
| `set(n)` | `ProgressInstance` | Set progress `0..1` (clamped to `minimum..1`) |
| `inc(amount?)` | `ProgressInstance` | Increment by `amount` or smart default (0.2.0 formula) |
| `trickle()` | `ProgressInstance` | Alias for `inc(Math.random() * trickleRate)` |
| `configure(opts)` | `ProgressInstance` | Merge options into settings |
| `promise(p)` | `ProgressInstance` | Track promise(s); done when all settle |
| `render(fromStart?)` | `HTMLElement \| null` | Render container (internal) |
| `remove()` | `void` | Remove container & cleanup |
| `isStarted()` | `boolean` | Whether progress is active |
| `isRendered()` | `boolean` | Whether container is in DOM |
| `getPositioningCSS()` | `string` | CSS for bar positioning (0.2.0 compat) |

## Events: `subscribe(listener)`

Subscribe to status changes. Returns an unsubscribe function.

```js
const unsubscribe = NProgress.subscribe((status) => {
  console.log('Progress:', status) // number 0..1 or null
})

// Later
unsubscribe()
```

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `status` | `number \| null` | Current progress `0..1` or `null` when idle. **Writable** (0.2.0 compat). |
| `settings` | `ProgressSettings` | Live settings object. Mutate via `configure()`. |
| `version` | `string` | Package version (e.g. `'0.1.0'`) |

## Utilities

```js
import { defaultSettings, injectStyles, version } from 'nprogress-next'

// Default settings object (clone before mutating)
const mySettings = { ...defaultSettings, color: '#f00' }

// Manually inject styles (if autoInjectStyles: false)
injectStyles()

// Version string
console.log(version) // '0.1.0'
```

## SSR Safety

All imports and method calls are safe in Node/SSR environments — no `window`/`document` access until `render()` is actually called.