# nprogress-next-vue

> Vue 3 components for [`nprogress-next`](https://github.com/Naaach/nprogress-next) — a modern, dependency-free, TypeScript-first, drop-in replacement for [NProgress](https://github.com/rstacruz/nprogress) `0.2.0`.

A `<ProgressBar />` component you control, a `useProgress()` composable that owns
the lifecycle, and a plugin to register the component globally. The underlying
bar logic is not re-implemented here — it is
[`nprogress-next`](https://github.com/Naaach/nprogress-next) itself, imported,
so the adapter inherits its semantics, its accessible markup and its settings
object verbatim.

📖 **Docs:** <https://nprogress-next.nachodiaz.es>

## Install

```sh
npm install nprogress-next-vue
```

`vue@^3.3` is a peer dependency. The stylesheet is optional — every piece of
*geometry* is written as an inline style, so the bar is positioned correctly
with no CSS import at all. Import it anyway for the decorative layer:

```js
import "nprogress-next-vue/styles.css";
```

## Quick start

```vue
<script setup lang="ts">
import { ProgressBar, useProgress } from "nprogress-next-vue";

const { status, isStarted, start, done } = useProgress();

async function load() {
  start();
  try {
    await fetch("/api/me");
  } finally {
    done();
  }
}
</script>

<template>
  <button @click="load">Load</button>
  <ProgressBar :progress="status ?? 0" :visible="isStarted" />
</template>
```

Global registration instead:

```ts
import { createApp } from "vue";
import NProgressNext from "nprogress-next-vue";

createApp(App).use(NProgressNext).mount("#app");
```

```vue
<!-- ProgressBar is now available in every template -->
<ProgressBar :progress="0.4" />
```

## `useProgress(options?)`

Creates an **isolated** core instance — two components calling this get two
independent bars — and mirrors it into refs.

| Return       | Type                    | Description                                                      |
| ------------ | ----------------------- | ---------------------------------------------------------------- |
| `progress`   | `ProgressInstance`      | The underlying core instance, for anything the helpers skip.     |
| `status`     | `Ref<number \| null>`   | Progress between `0` and `1`, or `null` when idle.               |
| `isStarted`  | `ComputedRef<boolean>`  | Whether a progress value is currently set.                       |
| `isRendered` | `ComputedRef<boolean>`  | Whether the core container is currently in the document.         |
| `start()`    | `() => void`            | Shows the bar and starts the trickle loop.                       |
| `done(force?)` | `(force?: boolean) => void` | Fades out and removes the bar.                             |
| `set(n)`     | `(n: number) => void`   | Sets progress to a number between `0` and `1`.                   |
| `inc(amount?)` | `(amount?: number) => void` | Advances by `amount`, or by the random trickle.              |

Every core option is accepted (`minimum`, `easing`, `speed`, `trickle`,
`trickleRate`, `trickleSpeed`, `showSpinner`, `parent`, `template`, `id`,
`ariaLabel`, `positionUsing`, …). Pass a `reactive()` object and the instance is
re-`configure()`d automatically:

```ts
const options = reactive({ minimum: 0.3, speed: 120 });
const { start } = useProgress(options);
options.speed = 400; // applied immediately, same instance
```

The subscription is torn down with the surrounding effect scope, so unmounting
a component never leaves a listener behind. Nothing here touches `window` or
`document`, so `renderToString()` on a server is safe.

## `<ProgressBar />`

Fully controlled: it renders markup, nothing else. It never starts a timer,
never talks to a core instance and never mutates its own state — you decide
what `progress` and `visible` are.

| Prop       | Type                  | Default      | Description                                             |
| ---------- | --------------------- | ------------ | ------------------------------------------------------- |
| `progress` | `number`              | `0`          | `0..1`, clamped. Rendered as an integer `0..100` percent. |
| `visible`  | `boolean`             | `true`       | `false` renders a comment placeholder.                   |
| `spinner`  | `boolean`             | `true`       | Render the corner spinner.                               |
| `label`    | `string \| null`      | `"Loading"`  | `aria-label`; `null` omits the attribute.               |
| `speed`    | `number`              | `200`        | Transition duration in ms.                               |
| `easing`   | `string`              | `"linear"`   | CSS easing for the bar transition.                       |
| `height`   | `string`              | `"2px"`      | Writes `--np-height`.                                    |
| `color`    | `string`              | `"#29d"`     | Writes `--np-color`.                                     |
| `zIndex`   | `number \| string`    | `1031`       | Writes `--np-z`.                                         |
| `class`    | `string`              | `""`         | Merged onto the root element.                            |
| `style`    | `CSSProperties`       | —            | Merged over the component's own inline styles.           |

### Rendered markup

```html
<div class="np-root" role="progressbar" aria-valuemin="0" aria-valuemax="100"
     aria-valuenow="42" aria-label="Loading"
     style="--np-color: #29d; --np-height: 2px; --np-z: 1031;">
  <div class="np-bar" style="position: fixed; top: 0; left: 0; width: 100%;
       height: var(--np-height, 2px); z-index: var(--np-z);
       transform: translate3d(-58%,0,0); transition: all 200ms linear;">
    <div class="np-peg"></div>
  </div>
  <div class="np-spinner" aria-hidden="true"
       style="position: fixed; top: 15px; right: 15px; z-index: var(--np-z);">
    <div class="np-spinner-icon"></div>
  </div>
</div>
```

`aria-valuenow` is an **integer percentage**, not the core's `0..1` fraction: a
`progressbar` is exposed to assistive technology on a `0..100` scale, and the
ARIA spec asks for a human-readable value.

## Theming

`styles.css` contains only what cannot be inlined — the peg glow, the spinner
ring and its keyframes, and the `prefers-reduced-motion` fallback — because
everything else is already an inline style. Override the same custom
properties the core package uses:

```css
:root {
  --np-color: #29d;          /* bar, peg glow and spinner */
  --np-height: 2px;
  --np-z: 1031;
  --np-peg-width: 100px;
  --np-spinner-size: 18px;
}
```

Or per instance, through the props:

```vue
<ProgressBar color="#ff0055" :height="'6px'" :zIndex="9999" />
```

Under `prefers-reduced-motion: reduce` the spinner stops spinning and becomes a
complete, dimmed ring — dropping the animation outright would freeze it on a
half-drawn arc that reads as a broken widget.

Every rule is namespaced under `.np-*`, so importing the stylesheet twice, or
alongside the core one, cannot collide with your app.

## Accessibility

The root is a real `role="progressbar"` with live `aria-valuemin` /
`aria-valuemax` / `aria-valuenow` and an `aria-label`. The bar and the spinner
are `aria-hidden`, so assistive technology only ever reaches the container. Set
`label={null}` to drop the attribute entirely.

## Build

`<ProgressBar />` is written as `defineComponent({ … setup() { return () =>
h(…) } })` rather than as a `.vue` single-file component. `tsup` bundles with
esbuild, which has no SFC compiler, and wiring `@vitejs/plugin-vue` into a
rollup pipeline means running Vite's dev-server transform by hand. Writing the
render function directly keeps the SFC compiler out of the published dependency
graph entirely: the package works with plain Vite, webpack, Rollup, esbuild,
Nuxt or Vitest without configuring a single plugin. The cost is authoring
ergonomics, which is the right trade for a two-element presentational component
whose exact DOM output is part of its public contract.

`vue` and `nprogress-next` stay external, so the host app's copies are the ones
that run.

## SSR

Safe to import, render and call on the server: every DOM access is guarded, no
timers are scheduled without a `document`, and the trickle loop is skipped
entirely — so a render in Nuxt, Astro or a Lambda will not pin the event loop
open. Call `start()` / `done()` on the client only.

## License

[MIT](https://github.com/Naaach/nprogress-next/blob/main/LICENSE)

Copyright (c) 2013-2014 Rico Sta. Cruz (original NProgress)
Copyright (c) 2026 Nacho Diaz Perez (nprogress-next)