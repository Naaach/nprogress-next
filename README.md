# nprogress-next

> **A drop-in replacement for [NProgress](https://github.com/rstacruz/nprogress)** — a minimalist, dependency-free, multi-framework progress bar for the top of the page.

NProgress is used by millions of projects every month, but its last release
(`0.2.0`) shipped back in 2015. **nprogress-next** keeps the exact same API you
already know, and rebuilds it as a modern, typed, multi-framework library.

```js
import NProgress from 'nprogress-next'

NProgress.start()
NProgress.inc()
NProgress.done()
```

## Why

- **Same API.** `start` / `done` / `set` / `inc` / `configure` / `remove` + `.status`.
- **Zero dependencies.** Core stays tiny (**2.96 KB gzip**, budget-gated in CI by `pnpm size`).
- **TypeScript.** Written in TS, shipped with first-class types.
- **ESM + CJS + UMD.** Works everywhere, SSR-safe (Next / Nuxt / Astro).
- **Multi-framework.** Core engine plus official adapters: React and Vue.
- **Accessible.** `role="progressbar"`, `aria-valuenow`, and
  `prefers-reduced-motion` support.
- **Themable.** CSS custom properties (`--np-color`, `--np-height`, `--np-z`, …).

## Status

✅ **Ready for use.** All core features, React and Vue adapters, tests, CI, and examples are complete.

| Fase | Scope                                                    | Status         |
| ----- | -------------------------------------------------------- | -------------- |
| 0     | Repo, name, license, base README                         | ✅ done        |
| 1     | Core: TypeScript port + ESM/CJS/UMD build + types        | ✅ done        |
| 2     | CSS variables + a11y + reduced-motion                    | ✅ done        |
| 3     | React and Vue adapters                                   | ✅ done        |
| 4     | Unit + visual tests, CI, Changesets                      | ✅ done        |
| 5     | Docs, examples (vanilla/React/Vue/Astro), publish to npm | ✅ done        |
| 6     | Launch                                                   | ⬜ planned     |

## Ecosystem

| Package                | Description                                              |
| ---------------------- | -------------------------------------------------------- |
| `nprogress-next`       | Core engine (framework-agnostic)                         |
| `nprogress-next-react` | React adapter (`<ProgressBar />`, `useProgress()`)       |
| `nprogress-next-vue`   | Vue adapter (`<ProgressBar />`, `useProgress()`, plugin) |

## Migration from NProgress

| Original | nprogress-next |
|----------|----------------|
| `import NProgress from 'nprogress'` | `import NProgress from 'nprogress-next'` |
| `require('nprogress')` | `require('nprogress-next')` (returns singleton) |
| `NProgress.configure({...})` | Same |
| `NProgress.start()` | Same |
| `NProgress.done()` | Same |
| `NProgress.set(0.5)` | Same |
| `NProgress.inc()` | Same |
| `NProgress.trickle()` | Same (now `inc(trickleRate)` internally) |
| `NProgress.promise(p)` | Same |
| `NProgress.remove()` | Same |
| `NProgress.status` | Same (now writable) |
| `NProgress.settings` | Same (mutable) |
| `NProgress.version` | Same |
| `NProgress.getPositioningCSS()` | Changed: returns a CSS declaration string, not a mode name |
| `import 'nprogress/nprogress.css'` | `import 'nprogress-next/styles.css'` OR auto-injected |
| `new NProgress()` | `import { createProgress } from 'nprogress-next'; const p = createProgress()` |
| — | `NProgress.subscribe(fn)` (new) |
| — | `prefers-reduced-motion` respected automatically |
| — | SSR-safe (no window access on import) |
| — | `--np-color`, `--np-height`, `--np-z` CSS variables |

## Examples

| Example | Description |
|---------|-------------|
| [`examples/vanilla/`](./examples/vanilla/) | Plain HTML + CDN UMD global — zero build step |
| [`examples/react/`](./examples/react/) | Vite + React 19 + TS — `<ProgressBar />` + `useProgress()` |
| [`examples/vue/`](./examples/vue/) | Vite + Vue 3 + TS — plugin + `<ProgressBar />` + `useProgress()` |
| [`examples/astro/`](./examples/astro/) | Astro 5 + React island + vanilla comparison |

Each example runs with `pnpm install && pnpm dev` (vanilla: open `index.html` directly).

## Credit where it's due

**Standing on the shoulders of NProgress by [Rico Sta. Cruz](https://github.com/rstacruz).**
This project is a modern revival of that work, and it would not exist without it.
The original design, API and behavior are his. Everything new is built on top.

The original is MIT-licensed; this project keeps the same license and preserves
the original copyright notice (see [LICENSE](./LICENSE)).

## License

[MIT](./LICENSE) © 2013-2014 Rico Sta. Cruz, © 2026 Nacho Diaz Perez
