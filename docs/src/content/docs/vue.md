---
title: "Vue Adapter"
description: "Vue 3 components, composable, and plugin for nprogress-next."
order: 4
---

## Installation

```bash
pnpm add nprogress-next-vue
# peer: vue ^3.3
```

## Plugin (Global Registration)

```ts
import { createApp } from 'vue'
import { NProgressNext } from 'nprogress-next-vue'
import 'nprogress-next-vue/styles.css' // optional

const app = createApp(App)
app.use(NProgressNext) // registers <ProgressBar /> globally
app.mount('#app')
```

## Components

### `<ProgressBar />`

```vue
<script setup lang="ts">
import { ProgressBar, useProgress } from 'nprogress-next-vue'

const { status } = useProgress()
</script>

<template>
  <ProgressBar :progress="status ?? 0" color="#29d" />
  <button @click="start">Start</button>
</template>
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
| `class` | string | — | Additional class |
| `style` | CSSProperties | — | Additional inline styles |

## `useProgress(options?)`

Composable that creates a core instance and returns reactive state. Uses `shallowRef` + `watch` + `onScopeDispose` for proper cleanup.

```ts
import { useProgress } from 'nprogress-next-vue'

export default {
  setup() {
    const { progress, status, isStarted, isRendered, start, done, set, inc } = useProgress({
      minimum: 0.1,
      trickle: true
    })

    return { status, start, done }
  }
}
```

| Return | Type | Description |
|--------|------|-------------|
| `progress` | `ProgressInstance` | Core instance |
| `status` | `Ref<number \| null>` | Reactive progress |
| `isStarted` | `ComputedRef<boolean>` | Reactive started state |
| `isRendered` | `ComputedRef<boolean>` | Reactive rendered state |
| `start()` | `void` | Start progress |
| `done(force?)` | `void` | Complete progress |
| `set(n)` | `void` | Set progress |
| `inc(amount?)` | `void` | Increment |

## Complete Example

```vue
<script setup lang="ts">
import { ProgressBar, useProgress } from 'nprogress-next-vue'

const { status, start, done } = useProgress()

const handleFetch = async () => {
  start()
  try {
    await fetch('/api/data')
  } finally {
    done()
  }
}
</script>

<template>
  <ProgressBar :progress="status ?? 0" color="#29d" />
  <button @click="handleFetch" :disabled="status !== null">
    {{ status !== null ? 'Loading...' : 'Fetch Data' }}
  </button>
</template>
```

## Nuxt 3

```ts
// plugins/nprogress.ts
import { NProgressNext } from 'nprogress-next-vue'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(NProgressNext)
})

// In any component
<script setup lang="ts">
import { useProgress } from 'nprogress-next-vue'
const { start, done } = useProgress()
</script>
```

## SSR Notes

- Works with `@vue/server-renderer` — no hydration mismatch
- Inline styles = zero CSS dependencies for SSR
- Plugin registers `<ProgressBar />` globally; composable for local instances

## Exports

```ts
import {
  ProgressBar,      // DefineComponent
  useProgress,      // Composable
  NProgressNext,    // Plugin { install(app) }
  styles,           // Stylesheet string
  createProgress,   // Re-exported from core
  defaultSettings,
  injectStyles,
  NProgress,
  version,
  type ProgressBarProps,
  type UseProgressReturn,
  type ProgressInstance,
  type ProgressOptions,
  type ProgressSettings
} from 'nprogress-next-vue'