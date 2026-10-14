---
title: "Migration from NProgress"
description: "Drop-in replacement guide from NProgress to nprogress-next."
order: 7
---

## Overview

**nprogress-next** is a drop-in replacement for **NProgress 0.2.0**. Most apps can migrate by changing the import only.

> ✅ **Zero-code migration for most apps**
>
> ```js
> // Before
> import NProgress from 'nprogress'
> import 'nprogress/nprogress.css'
>
> // After
> import NProgress from 'nprogress-next'
> import 'nprogress-next/styles.css' // optional — auto-injected by default
> ```

## API Mapping

| NProgress 0.2.0 | nprogress-next | Notes |
|-----------------|----------------|-------|
| `import NProgress from 'nprogress'` | `import NProgress from 'nprogress-next'` | Same singleton API |
| `require('nprogress')` | `require('nprogress-next')` | Returns singleton (CJS interop fixed) |
| `NProgress.configure({...})` | Same | All options supported |
| `NProgress.start()` | Same | — |
| `NProgress.done()` | Same | — |
| `NProgress.set(0.5)` | Same | — |
| `NProgress.inc()` | Same | Uses 0.2.0 probabilistic formula |
| `NProgress.trickle()` | Same | Now `inc(trickleRate)` internally |
| `NProgress.promise(p)` | Same | Concurrency semantics identical |
| `NProgress.remove()` | Same | — |
| `NProgress.status` | Same (now writable) | `NProgress.status = null` works |
| `NProgress.settings` | Same (mutable) | Module-level object |
| `NProgress.version` | Same | `'0.1.0'` etc. |
| `NProgress.getPositioningCSS()` | Same | Returns CSS string |
| `import 'nprogress/nprogress.css'` | `import 'nprogress-next/styles.css'` OR auto-injected | CSS variables: `--np-*` |
| `new NProgress()` | `import { createProgress } from 'nprogress-next'` | Named export, not constructor |
| — | `NProgress.subscribe(fn)` | **New** — reactive updates |
| — | `prefers-reduced-motion` respected | **New** — automatic |
| — | SSR-safe | **New** — no window access on import |
| — | `--np-color`, `--np-height`, `--np-z` | **New** — CSS variable theming |

## Breaking Changes (Minimal)

- **Package name:** `nprogress` → `nprogress-next`
- **CSS variables:** `--nprogress-*` → `--np-*` (shorter, namespaced)
- **CDN global:** `window.NProgress` → `window.NProgressNext` (avoids conflicts)
- **Default easing:** `'ease'` (unchanged, but now explicit)
- **Default trickleSpeed:** `800` ms (unchanged from 0.2.0)
- **Default trickleRate:** `0.02` (restored from 0.2.0)

## Common Patterns

### Ajax Loading

```js
// Before (jQuery)
$(document).ajaxStart(() => NProgress.start())
$(document).ajaxStop(() => NProgress.done())

// After (fetch + nprogress-next)
const originalFetch = window.fetch
window.fetch = async (...args) => {
  NProgress.start()
  try {
    return await originalFetch(...args)
  } finally {
    NProgress.done()
  }
}
```

### Router Integration

```tsx
// React Router v6
import { useProgress } from 'nprogress-next-react'
import { useLocation } from 'react-router-dom'

export function ProgressWrapper() {
  const { start, done } = useProgress()
  const location = useLocation()

  useEffect(() => {
    start()
    const timer = setTimeout(done, 300) // minimum visible time
    return () => clearTimeout(timer)
  }, [location.pathname])

  return null
}
```

### Custom Template

```js
// NProgress 0.2.0 template still works
NProgress.configure({
  template: '<div class="bar"><div class="peg"></div></div><div class="spinner"></div>'
})

// nprogress-next also accepts .bar / .spinner classes
NProgress.configure({
  barSelector: '.bar',
  spinnerSelector: '.spinner'
})
```

## TypeScript

Types are included — no `@types/nprogress` needed. If you had `declare module 'nprogress'`, update to `'nprogress-next'`.