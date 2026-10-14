---
title: "Installation"
description: "Install nprogress-next for your framework."
order: 1
---

## Package Manager

### Core (required for all)

```bash
pnpm add nprogress-next
# or
npm install nprogress-next
# or
yarn add nprogress-next
```

### React Adapter

```bash
pnpm add nprogress-next-react
# peer: react >= 18
```

### Vue Adapter

```bash
pnpm add nprogress-next-vue
# peer: vue ^3.3
```

## CDN (no build step)

Use the UMD global via unpkg or jsDelivr — great for quick prototypes, Astro islands, or legacy apps.

```html
<script src="https://unpkg.com/nprogress-next@latest"></script>
<script>
  NProgressNext.start()
  NProgressNext.done()
</script>
```

The global is `NProgressNext` (not `NProgress`) to avoid conflicts.

## CSS

The core injects its default stylesheet automatically on first render (`autoInjectStyles: true`). To use your own CSS or disable auto-injection:

```js
// Option 1: Import CSS (bundlers)
import 'nprogress-next/styles.css'

// Option 2: Disable auto-injection, use your own
import NProgress from 'nprogress-next'
NProgress.configure({ autoInjectStyles: false })
// ...your custom CSS using --np-* variables...
```

## Framework-Specific Setup

### React (Next.js, Vite, CRA, etc.)

```tsx
import { ProgressBar } from 'nprogress-next-react'
import 'nprogress-next-react/styles.css' // optional, inline styles work without it

export default function RootLayout() {
  return (
    <html>
      <body>
        <ProgressBar color="#29d" />
        {children}
      </body>
    </html>
  )
}
```

### Vue (Nuxt, Vite, etc.)

```ts
import { createApp } from 'vue'
import { NProgressNext } from 'nprogress-next-vue'
import 'nprogress-next-vue/styles.css' // optional

const app = createApp(App)
app.use(NProgressNext) // registers <ProgressBar /> globally
app.mount('#app')
```

### Astro

```astro
---
import { ProgressBar } from 'nprogress-next-react'
---
<html>
  <body>
    <ProgressBar client:load />
    <slot />
  </body>
</html>
```

### Vanilla (CDN or bundler)

```js
// Bundler
import NProgress from 'nprogress-next'
NProgress.start()

// CDN
<script src="https://unpkg.com/nprogress-next@latest"></script>
<script> NProgressNext.start() </script>
```

## TypeScript

Types are included — no extra `@types/` package needed. Works with `"moduleResolution": "Bundler"` (recommended) or `"NodeNext"`.