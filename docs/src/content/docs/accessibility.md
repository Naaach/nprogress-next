---
title: "Accessibility"
description: "Accessibility features in nprogress-next."
order: 8
---

## Built-in Accessibility

nprogress-next follows WAI-ARIA Authoring Practices for `progressbar` pattern.

### What you get automatically

- **`role="progressbar"`** on the container
- **`aria-valuemin="0"`** and **`aria-valuemax="100"`** (0–100 scale)
- **Live `aria-valuenow`** — updates on every progress change
- **`aria-label`** — configurable via `ariaLabel` option (default: "Loading")
- **`aria-busy="true"`** on `<html>` while progress is active
- **Decorative elements hidden:** bar/spinner wrappers have `aria-hidden="true"`

### Reduced Motion

Respects `@media (prefers-reduced-motion: reduce)` automatically:

- CSS transitions disabled (instant changes)
- Spinner animation stopped
- JS `speed` forced to `0` for instant completion

Disable with `respectReducedMotion: false` in options.

### Keyboard / Screen Reader Testing

```txt
// The progress bar is announced as:
// "Loading, progress bar, 42 percent"
// (or your custom ariaLabel)

// Example with NVDA/JAWS/VoiceOver:
// 1. Trigger NProgress.start()
// 2. Screen reader: "Loading, progress bar, 8 percent"
// 3. As progress updates: "42 percent", "78 percent", "100 percent"
// 4. On done(): "Loading, progress bar, complete" (removed from tree)
```

### Customizing aria-label

```js
// Global singleton
NProgress.configure({ ariaLabel: 'Cargando datos' })

// Or per-instance
const progress = createProgress({ ariaLabel: 'Uploading file' })
progress.start()

// Disable entirely
NProgress.configure({ ariaLabel: null })
```

### Focus Management

The progress bar is **not focusable** (it's a status indicator, not an interactive widget). It lives at the top of the page and does not trap or steal focus.

### Color Contrast

Default `--np-color: #29d` on white meets WCAG AA for non-text contrast (3:1). For custom colors, ensure 3:1 against background.

### Testing Checklist

- ☐ Screen reader announces progress changes
- ☐ `prefers-reduced-motion` stops animations
- ☐ No keyboard focus trap
- ☐ Color contrast ≥ 3:1 (custom colors)
- ☐ `aria-label` is meaningful in your language

## React Adapter

`<ProgressBar />` renders the same accessible DOM. Props map directly:

```tsx
<ProgressBar
  progress={status ?? 0}
  label="Loading data"        // aria-label
  ariaLabel="Loading data"    // alias
/>
```

## Vue Adapter

```vue
<ProgressBar
  :progress="status ?? 0"
  label="Loading data"
/>