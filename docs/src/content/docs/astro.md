---
title: "Astro"
description: "Using nprogress-next with Astro."
order: 6
---

## React Island (Recommended)

Use the React adapter as a client-side island — zero JS on initial render, hydrates on interaction.

```bash
pnpm add nprogress-next-react
# peer: react >= 18
```

### Layout with Island

```astro
---
// src/layouts/Layout.astro
import { ProgressBar } from 'nprogress-next-react'
---
<html lang="en">
  <head>...</head>
  <body>
    <ProgressBar client:load />
    <slot />
  </body>
</html>
```

### Component with `useProgress`

```tsx
// src/components/ProgressDemo.tsx
'use client'
import { ProgressBar, useProgress } from 'nprogress-next-react'

export default function ProgressDemo() {
  const { status, start, done } = useProgress()
  return (
    <>
      <ProgressBar progress={status ?? 0} color="#29d" />
      <button onClick={() => { start(); setTimeout(done, 2000) }}>Start</button>
    </>
  )
}
```

### Usage in Page

```astro
---
import ProgressDemo from '../components/ProgressDemo.tsx'
---
<ProgressDemo client:visible />
```

## Vanilla CDN (Alternative)

Use the UMD global directly in a script — no React needed.

```astro
---
// src/pages/index.astro
---
<html lang="en">
  <head>
    <script src="https://unpkg.com/nprogress-next@latest" defer></script>
    <script>
      document.addEventListener('astro:after-swap', () => {
        NProgressNext.start()
        // simulate navigation
        setTimeout(() => NProgressNext.done(), 1500)
      })
    </script>
  </head>
  <body>
    <slot />
  </body>
</html>
```

## Comparison

| Approach | Pros | Cons |
|----------|------|------|
| **React island** | Type-safe, reactive hooks, full React ecosystem | Adds React to bundle (~40 KB) |
| **Vanilla CDN** | Zero deps, ~2.96 KB, works everywhere | Imperative API, no reactivity |

## SSR Notes

- `client:load` — hydrates immediately on page load
- `client:visible` — hydrates when scrolled into view (lighter)
- `client:idle` — hydrates after main thread is free
- All approaches are SSR-safe — no hydration mismatch