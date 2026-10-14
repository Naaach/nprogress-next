---
title: "nprogress-next"
description: "A modern, dependency-free, multi-framework drop-in replacement for NProgress."
order: 0
---

# nprogress-next

A minimalist, dependency-free, multi-framework progress bar for the top of the page.
Drop-in replacement for [NProgress](https://github.com/rstacruz/nprogress) — same API, now in TypeScript with React & Vue adapters.

## Why nprogress-next?

| Feature | Description |
|---------|-------------|
| 🔄 **Same API** | `start` / `done` / `set` / `inc` / `configure` / `remove` + `.status` — drop-in replacement for NProgress 0.2.0 |
| 📦 **Zero Dependencies** | Core stays tiny (**2.9 KB gzipped**). No peer dependencies, no runtime overhead. |
| 🎯 **TypeScript First** | Written in TS, shipped with first-class types. Full IntelliSense for all APIs. |
| ⚡ **ESM + CJS + UMD** | Works everywhere — bundlers, Node, browsers, CDN. SSR-safe for Next.js, Nuxt, Astro. |
| 🔧 **Multi-Framework** | Core engine + official adapters: **React** (`<ProgressBar />`, `useProgress()`) and **Vue** (`<ProgressBar />`, `useProgress()`, plugin). |
| ♿ **Accessible** | `role="progressbar"`, live `aria-valuenow`, respects `prefers-reduced-motion`. |

## Quick Example

```js
import NProgress from 'nprogress-next'

NProgress.start()
// ... async work ...
NProgress.done()
```

## Ecosystem

| Package | Description |
|---------|-------------|
| `nprogress-next` | Core engine (framework-agnostic) |
| `nprogress-next-react` | React adapter (`<ProgressBar />`, `useProgress()`) |
| `nprogress-next-vue` | Vue adapter (`<ProgressBar />`, `useProgress()`, plugin) |

## Next Steps

- [Installation](/installation) — Add to your project
- [Core API](/core-api) — Complete reference
- [React Adapter](/react) — Components & hooks
- [Vue Adapter](/vue) — Components, composable & plugin
- [Migration from NProgress](/migration) — Drop-in replacement guide