---
title: "React Adapter"
description: "React components and hooks for nprogress-next."
order: 3
---

# React Adapter

## Installation

```bash
pnpm add nprogress-next-react
# peer: react >= 18
```

## Components

### `<ProgressBar />`

Controlled, presentational progress bar. Works with zero CSS imports (inline styles).

```tsx
import { ProgressBar } from 'nprogress-next-react'

// Basic usage with singleton
<ProgressBar color="#29d" />

// Controlled with useProgress()
const { status } = useProgress()
<ProgressBar progress={status ?? 0} /> // progress: 0..1
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `progress` | number | `0` | Progress value `0..1` (clamped) |
| `visible` | boolean | `true` | Render nothing when `false` |
| `spinner` | boolean | `true` | Show/hide spinner |
| `label` | string \| null | `'Loading'` | `aria-label` (`null` omits) |
| `speed` | number | `200` | Transition duration (ms) |
| `easing` | string | `'linear'` | CSS easing |
| `height` | string | `'2px'` | Sets `--np-height` |
| `color` | string | `'#29d'` | Sets `--np-color` |
| `zIndex` | number \| string | `1031` | Sets `--np-z` |
| `className` | string | — | Additional class |
| `style` | CSSProperties | — | Additional inline styles |

### Rendered DOM

```html
<div class="np-root" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="42" aria-label="Loading" style="--np-color: #29d; --np-height: 2px; --np-z: 1031;">
  <div class="np-bar" style="transform: translate3d(-58%,0,0); transition: all 200ms linear;">
    <div class="np-peg"></div>
  </div>
  <div class="np-spinner" aria-hidden="true">
    <div class="np-spinner-icon"></div>
  </div>
</div>
```

## `useProgress(options?)`

Hook that creates/returns a core instance and reactive state. Uses `useSyncExternalStore` for concurrent-safe subscriptions.

```tsx
import { useProgress } from 'nprogress-next-react'

function MyComponent() {
  const { progress, status, isStarted, isRendered, start, done, set, inc } = useProgress({
    minimum: 0.1,
    trickle: true
  })

  return (
    <button onClick={() => { start(); setTimeout(() => done(), 2000) }}>
      Start Task
    </button>
  )
}
```

| Return | Type | Description |
|--------|------|-------------|
| `progress` | `ProgressInstance` | Core instance (`createProgress()`) |
| `status` | `number \| null` | Reactive progress `0..1` or `null` |
| `isStarted` | `boolean` | Reactive `progress.isStarted()` |
| `isRendered` | `boolean` | Reactive `progress.isRendered()` |
| `start()` | `void` | Start progress |
| `done(force?)` | `void` | Complete progress |
| `set(n)` | `void` | Set progress `0..1` |
| `inc(amount?)` | `void` | Increment |

## Complete Example

```tsx
import { ProgressBar, useProgress } from 'nprogress-next-react'
import 'nprogress-next-react/styles.css' // optional

export default function App() {
  const { status, start, done } = useProgress()

  const handleFetch = async () => {
    start()
    try {
      await fetch('/api/data')
    } finally {
      done()
    }
  }

  return (
    <>
      <ProgressBar progress={status ?? 0} color="#29d" />
      <button onClick={handleFetch} disabled={status !== null}>
        {status !== null ? 'Loading...' : 'Fetch Data'}
      </button>
    </>
  )
}
```

## Next.js App Router

```tsx
// app/layout.tsx
import { ProgressBar } from 'nprogress-next-react'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <ProgressBar />
        {children}
      </body>
    </html>
  )
}

// In any component
import { useProgress } from 'nprogress-next-react'

export function MyComponent() {
  const { start, done } = useProgress()
  // ...
}
```

## SSR Notes

- No `window`/`document` access during render
- Inline styles mean zero CSS dependencies — works in any SSR setup
- Optional `styles.css` import adds spinner animation & reduced-motion fallback