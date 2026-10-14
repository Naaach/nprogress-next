# nprogress-next-react

> React bindings for [nprogress-next](https://github.com/Naaach/nprogress-next) — a
> controlled `<ProgressBar />` component and a `useProgress()` hook.

The core (`nprogress-next`) owns the engine: settings, the trickle loop, the
fade-out, SSR guards. This package owns the React shape of it, and nothing else.

## Install

```sh
npm install nprogress-next-react
```

`react >= 18` is a peer dependency — this package uses `useSyncExternalStore`,
so it must share a single React copy with your app. `nprogress-next` is a
regular dependency and is installed for you.

## `<ProgressBar />`

A controlled, presentational bar. It renders whatever `progress` says, creates no
instance, schedules no timer and never reads the DOM.

```tsx
import { ProgressBar } from "nprogress-next-react";

function Upload() {
  const [progress, setProgress] = useState(0);

  return (
    <>
      <ProgressBar progress={progress} height="3px" color="#f43f5e" />
      {/* … */}
    </>
  );
}
```

| Prop        | Type               | Default      | Description                                                        |
| ----------- | ------------------ | ------------ | ------------------------------------------------------------------ |
| `progress`  | `number`           | `0`          | `0..1`, clamped on render. Drives both the bar and `aria-valuenow`. |
| `visible`   | `boolean`          | `true`       | Renders nothing when `false`.                                       |
| `spinner`   | `boolean`          | `true`       | Renders the corner spinner.                                         |
| `label`     | `string \| null`   | `"Loading"`  | `aria-label`. `null` omits the attribute.                           |
| `speed`     | `number`           | `200`        | Bar transition duration in ms.                                      |
| `easing`    | `string`           | `"linear"`   | CSS easing for the bar transition.                                  |
| `height`    | `string`           | `"2px"`      | Sets `--np-height`.                                                 |
| `color`     | `string`           | `"#29d"`     | Sets `--np-color`.                                                  |
| `zIndex`    | `number \| string` | `1031`       | Sets `--np-z`.                                                      |
| `className` | `string`           | —            | Appended to `"np-root"`.                                            |
| `style`     | `CSSProperties`    | —            | Merged over the generated custom properties.                        |

It renders:

```html
<div class="np-root" role="progressbar" aria-valuemin="0" aria-valuemax="1"
     aria-valuenow="40" aria-label="Loading"
     style="--np-color:#29d; --np-height:2px; --np-z:1031">
  <div class="np-bar" style="transform: translate3d(-60%,0,0); transition: all 200ms linear">
    <div class="np-peg"></div>
  </div>
  <div class="np-spinner" aria-hidden="true">
    <div class="np-spinner-icon"></div>
  </div>
</div>
```

### Stylesheet: optional

Everything that can be an inline style *is* one, so `<ProgressBar />` renders
correctly with **no CSS at all**. Only three things cannot be inlined — the peg's
glow, the spinner's border and its `@keyframes` — and they are shipped separately:

```js
import "nprogress-next-react/styles.css";
```

The stylesheet is namespaced under `.np-*`, reuses the same `--np-*` custom
properties as the core, and carries a `prefers-reduced-motion` block that stops
the bar transition and replaces the spin with a static, dimmed arc. The three
properties the component writes inline (`--np-color`, `--np-height`, `--np-z`)
always win, so you can still restyle it from the `color` / `height` / `zIndex`
props.

## `useProgress(options?)`

Binds a `nprogress-next` instance to React state. One isolated instance is created
per hook call and torn down on unmount.

```tsx
import { useProgress } from "nprogress-next-react";

function Panel() {
  const { status, isStarted, start, done, set } = useProgress({ minimum: 0.2 });

  async function load() {
    start();
    try {
      const user = await fetch("/api/user").then((r) => r.json());
      set(0.8);
      return user;
    } finally {
      done();
    }
  }

  return <button onClick={load}>{isStarted ? `${Math.round((status ?? 0) * 100)}%` : "Load"}</button>;
}
```

| Field                | Type                    | Description                                                                 |
| -------------------- | ----------------------- | --------------------------------------------------------------------------- |
| `progress`           | `ProgressInstance`      | The underlying core instance. `configure`, `promise`, `trickle` are all there. |
| `status`             | `number \| null`        | Reactive. `0..1`, or `null` when idle.                                       |
| `isStarted`          | `boolean`               | Reactive. Whether a value is currently set.                                 |
| `isRendered`         | `boolean`               | Reactive. Whether the container was in the DOM at the last notification.     |
| `start()`            | `() => void`            | Shows the bar and starts the trickle loop.                                   |
| `done(force?)`       | `(force?: boolean) => void` | Completes and hides it.                                                |
| `set(n)`             | `(n: number) => void`   | Sets progress to `0..1`.                                                     |
| `inc(amount?)`       | `(amount?: number) => void` | Advances by `amount`, or by the 0.2.0 random trickle.                    |

`options` accepts every [`nprogress-next` setting](https://github.com/Naaach/nprogress-next#options).
It is applied when it changes — so `useProgress({ minimum: 0.2 })` is safe to
write inline; the hook diffs it and only calls `configure()` when the values
actually differ.

`isRendered` is recomputed on every render. The one instant it cannot observe on
its own is `done()`'s fade-out, which removes the container from a timer callback
and never notifies subscribers — read `progress.isRendered()` directly there.

## SSR

Safe. `renderToString()` produces the full markup for `<ProgressBar />`, the hook
never touches `window` or `document` during render, and the server snapshot is
the idle one — so the first client render matches the server output and hydration
stays quiet.

## Exports

`ProgressBar`, `useProgress`, `styles`, and the types `ProgressBarProps`,
`UseProgressReturn`, `ProgressInstance`, `ProgressOptions`.

## License

[MIT](https://github.com/Naaach/nprogress-next/blob/main/LICENSE)