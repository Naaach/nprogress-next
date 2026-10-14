---
title: "Vanilla JS"
description: "Using nprogress-next without a framework."
order: 5
---

## CDN (Quick Start)

Zero build step — open an HTML file and go.

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>nprogress-next demo</title>
  </head>
  <body>
    <button id="start">Start</button>
    <button id="done">Done</button>

    <script src="https://unpkg.com/nprogress-next@latest"></script>
    <script>
      const startBtn = document.getElementById('start')
      const doneBtn = document.getElementById('done')

      startBtn.addEventListener('click', () => NProgressNext.start())
      doneBtn.addEventListener('click', () => NProgressNext.done())
    </script>
  </body>
</html>
```

## Bundler (ESM)

```js
import NProgress from 'nprogress-next'
// or
import { createProgress } from 'nprogress-next'

NProgress.configure({ color: '#29d' })
NProgress.start()
setTimeout(() => NProgress.done(), 2000)
```

## Isolated Instances

Use `createProgress()` for multiple independent bars.

```js
import { createProgress } from 'nprogress-next'

const upload = createProgress({ parent: '#upload-area', minimum: 0.1 })
const download = createProgress({ parent: '#download-area', trickle: false })

upload.start()
download.start()
```

## Custom Styling

CSS variables (`--np-*`) work with or without the default stylesheet.

```js
// Option 1: Override variables (default stylesheet injected)
NProgress.configure({ autoInjectStyles: true })
document.documentElement.style.setProperty('--np-color', '#f00')
document.documentElement.style.setProperty('--np-height', '4px')

// Option 2: Bring your own CSS, disable auto-injection
NProgress.configure({ autoInjectStyles: false })
/* your CSS:
#nprogress .bar { background: var(--np-color, #29d); height: var(--np-height, 2px); }
*/
```

## Full API

Same as [Core API](/core-api) — `NProgressNext` global exposes:

- `start()`, `done()`, `set()`, `inc()`, `trickle()`
- `configure()`, `promise()`, `remove()`
- `isStarted()`, `isRendered()`
- `subscribe(fn)` — reactive updates
- `status` (writable), `settings`, `version`
- `createProgress()`, `defaultSettings`, `injectStyles()`

## SSR / Node

Safe to import in Node — no `window`/`document` access until methods are called.