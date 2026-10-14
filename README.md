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
- **Zero dependencies.** Core stays tiny (< 2 KB gzip).
- **TypeScript.** Written in TS, shipped with first-class types.
- **ESM + CJS + UMD.** Works everywhere, SSR-safe (Next / Nuxt / Astro).
- **Multi-framework.** Core engine plus official adapters: React and Vue.
- **Accessible.** `role="progressbar"`, `aria-valuenow`, and
  `prefers-reduced-motion` support.
- **Themable.** CSS custom properties (`--np-color`, `--np-height`, `--np-z`, …).

## Status

🚧 **Early development.** This repository is at the scaffolding stage — see the
roadmap below for what's next.

| Phase | Scope | Status |
|---|---|---|
| 0 | Repo, name, license, base README | 🚧 in progress |
| 1 | Core: TypeScript port + ESM/CJS build + types | ⬜ planned |
| 2 | CSS variables + a11y + reduced-motion | ⬜ planned |
| 3 | React and Vue adapters | ⬜ planned |
| 4 | Unit + visual tests, CI, Changesets | ⬜ planned |
| 5 | Docs, examples (vanilla/React/Vue/Astro), publish to npm | ⬜ planned |
| 6 | Launch | ⬜ planned |

## Ecosystem (planned)

| Package | Description |
|---|---|
| `nprogress-next` | Core engine (framework-agnostic) |
| `nprogress-next-react` | React adapter (`<ProgressBar />`, `useProgress()`) |
| `nprogress-next-vue` | Vue adapter (`<ProgressBar />`, `useProgress()`, plugin) |

## Credit where it's due

**Standing on the shoulders of NProgress by [Rico Sta. Cruz](https://github.com/rstacruz).**
This project is a modern revival of that work, and it would not exist without it.
The original design, API and behavior are his. Everything new is built on top.

The original is MIT-licensed; this project keeps the same license and preserves
the original copyright notice (see [LICENSE](./LICENSE)).

## License

[MIT](./LICENSE) © 2013-2014 Rico Sta. Cruz, © 2026 Nacho Diaz Perez
