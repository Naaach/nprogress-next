---
title: "Theming"
description: "Customize nprogress-next appearance with CSS variables."
order: 9
---

# Theming

## CSS Variables

All visual aspects are controlled via `--np-*` custom properties. Set them globally or per-instance.

| Variable | Default | Description |
|----------|---------|-------------|
| `--np-color` | `#29d` | Bar & spinner color |
| `--np-height` | `2px` | Bar thickness |
| `--np-z` | `1031` | Z-index for bar & spinner |
| `--np-peg-width` | `100px` | Glow/peg width on bar |
| `--np-spinner-size` | `18px` | Spinner diameter |
| `--np-spinner-top` | `15px` | Spinner offset from top |
| `--np-spinner-right` | `15px` | Spinner offset from right |

## Global Theming

```css
:root {
  --np-color: #6366f1;      /* indigo */
  --np-height: 3px;
  --np-z: 9999;
  --np-peg-width: 80px;
  --np-spinner-size: 20px;
  --np-spinner-top: 12px;
  --np-spinner-right: 12px;
}

/* Dark mode override */
@media (prefers-color-scheme: dark) {
  :root {
    --np-color: #818cf8;
  }
}
```

## Per-Instance (React/Vue)

```tsx
// React
<ProgressBar color="#f59e0b" height="4px" zIndex={2000} />

// Vue
<ProgressBar :color="#f59e0b" height="4px" :zIndex="2000" />
```

## Vanilla JS

```js
// Global (affects all)
document.documentElement.style.setProperty('--np-color', '#ef4444')

// Per-instance via configure()
const progress = createProgress({})
progress.configure({}) // variables set on :root or parent
```

## Complete Custom CSS (No Default Stylesheet)

```js
NProgress.configure({ autoInjectStyles: false })
```

```css
/* Your CSS */
#nprogress {
  pointer-events: none;
}
#nprogress .bar {
  background: var(--np-color, #29d);
  position: fixed;
  z-index: var(--np-z, 1031);
  top: 0; left: 0;
  width: 100%;
  height: var(--np-height, 2px);
  transform: translate3d(-100%, 0, 0);
  transition: transform var(--np-speed, 200ms) var(--np-easing, ease);
}
#nprogress .peg {
  display: block; position: absolute; right: 0;
  width: var(--np-peg-width, 100px); height: 100%;
  box-shadow: 0 0 10px var(--np-color), 0 0 5px var(--np-color);
  opacity: 1; transform: rotate(3deg) translate(0, -4px);
}
#nprogress .spinner {
  display: block; position: fixed; z-index: var(--np-z, 1031);
  top: var(--np-spinner-top, 15px); right: var(--np-spinner-right, 15px);
}
#nprogress .spinner-icon {
  width: var(--np-spinner-size, 18px); height: var(--np-spinner-size, 18px);
  border: 2px solid transparent;
  border-top-color: var(--np-color); border-left-color: var(--np-color);
  border-radius: 50%;
  animation: np-spin 400ms linear infinite;
}
@keyframes np-spin { to { transform: rotate(360deg); } }

@media (prefers-reduced-motion: reduce) {
  #nprogress .bar { transition: none; }
  #nprogress .spinner-icon { animation: none; opacity: 0.5; }
}
```

## Theme Presets

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin: 1.5rem 0;">
  <div class="card" style="text-align: center; --np-color: #29d;">
    <div style="height: 4px; background: var(--np-color); border-radius: 2px; margin-bottom: 0.5rem;"></div>
    <strong>Default</strong><br><code>#29d</code>
  </div>
  <div class="card" style="text-align: center; --np-color: #6366f1;">
    <div style="height: 4px; background: var(--np-color); border-radius: 2px; margin-bottom: 0.5rem;"></div>
    <strong>Indigo</strong><br><code>#6366f1</code>
  </div>
  <div class="card" style="text-align: center; --np-color: #ec4899;">
    <div style="height: 4px; background: var(--np-color); border-radius: 2px; margin-bottom: 0.5rem;"></div>
    <strong>Pink</strong><br><code>#ec4899</code>
  </div>
  <div class="card" style="text-align: center; --np-color: #10b981;">
    <div style="height: 4px; background: var(--np-color); border-radius: 2px; margin-bottom: 0.5rem;"></div>
    <strong>Emerald</strong><br><code>#10b981</code>
  </div>
  <div class="card" style="text-align: center; --np-color: #f59e0b;">
    <div style="height: 4px; background: var(--np-color); border-radius: 2px; margin-bottom: 0.5rem;"></div>
    <strong>Amber</strong><br><code>#f59e0b</code>
  </div>
  <div class="card" style="text-align: center; --np-color: #ef4444;">
    <div style="height: 4px; background: var(--np-color); border-radius: 2px; margin-bottom: 0.5rem;"></div>
    <strong>Red</strong><br><code>#ef4444</code>
  </div>
</div>

## Reduced Motion Fallback

The default stylesheet includes a `prefers-reduced-motion` block that stops the spinner and disables transitions. The spinner becomes a dimmed ring (not a broken arc).