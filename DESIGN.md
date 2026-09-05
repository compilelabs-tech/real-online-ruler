<!-- Drafted by @research (v5 — Zero-Question Auto-Run + Multilingual Global SEO) -->
<!-- DESIGN: Real Online Ruler — Brand Design System -->
<!-- Date: September 5, 2026 | Research Agent: @research -->
<!-- Skills Used: anti-ui-slop, design-taste-frontend, web-design-guidelines -->

# DESIGN.md: Real Online Ruler

> Design principles grounded in anti-ui-slop methodology, Vercel Web Interface Guidelines, and taste-skill v2 dials.

---

## 1. Design Direction (Taste-Skill Dials)

| Dial | Setting | Rationale |
|------|---------|-----------|
| **DESIGN_VARIANCE** | 0.3 (Low-Medium) | Ruler tool = functional, not experimental. Clean, predictable, trustworthy. |
| **MOTION_INTENSITY** | 0.2 (Low) | Measurement tool = precision, not flash. Subtle transitions only. |
| **VISUAL_DENSITY** | 0.4 (Medium-Low) | Ruler needs space for markings. Toolbars compact, canvas spacious. |

### Anti-Slop Rules Applied
- ❌ **No** centered-hero-everywhere — hero is functional (the ruler itself)
- ❌ **No** three-equal-cards — feature sections use varied layouts
- ❌ **No** purple gradients — brand palette is neutral/professional
- ❌ **No** serif without reason — sans-serif only (Inter/Noto Sans)
- ❌ **No** em-dashes — use commas or periods
- ❌ **No** Inter default everywhere — use Inter for Latin, Noto Sans for CJK/Arabic/Hindi
- ✅ **Yes** functional hero — the ruler IS the hero
- ✅ **Yes** purposeful whitespace — measurement canvas needs breathing room
- ✅ **Yes** clear hierarchy — toolbar > ruler > content

---

## 2. Color System

### Light Mode

```css
:root {
  /* Background */
  --bg-primary: #FAFAFA;        /* Page background — warm neutral */
  --bg-secondary: #F5F5F5;      /* Card/panel background */
  --bg-canvas: #FFFFFF;          /* Ruler measurement canvas */

  /* Foreground */
  --fg-primary: #1A1A1A;        /* Primary text — near-black */
  --fg-secondary: #6B7280;      /* Secondary text — muted */
  --fg-tertiary: #9CA3AF;       /* Placeholder/label text */

  /* Accent */
  --accent-primary: #2563EB;    /* Primary action — blue */
  --accent-hover: #1D4ED8;      /* Hover state */
  --accent-subtle: #EFF6FF;     /* Light blue background */

  /* Ruler Specific */
  --ruler-bg: #FFFFFF;          /* Ruler surface */
  --ruler-tick: #1A1A1A;        /* Tick marks */
  --ruler-label: #374151;       /* Number labels */
  --ruler-edge: #E5E7EB;        /* Ruler border */

  /* Measurement */
  --measure-line: #2563EB;      /* Active measurement line */
  --measure-fill: rgba(37, 99, 235, 0.1); /* Measurement area fill */
  --guide-line: #2563EB;        /* Guide reference lines */

  /* Crosshair */
  --crosshair: #2563EB;         /* Crosshair lines */

  /* Calibration */
  --calib-card: #D1D5DB;        /* Credit card outline */
  --calib-match: #10B981;       /* Matched state — green */
  --calib-mismatch: #EF4444;    /* Mismatched state — red */

  /* Border */
  --border: #E5E7EB;            /* Default border */
  --border-strong: #D1D5DB;     /* Emphasis border */

  /* Shadow */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.07);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
}
```

### Dark Mode

```css
[data-theme="dark"] {
  --bg-primary: #0F0F0F;
  --bg-secondary: #1A1A1A;
  --bg-canvas: #141414;

  --fg-primary: #F5F5F5;
  --fg-secondary: #9CA3AF;
  --fg-tertiary: #6B7280;

  --accent-primary: #3B82F6;
  --accent-hover: #60A5FA;
  --accent-subtle: rgba(59, 130, 246, 0.1);

  --ruler-bg: #1A1A1A;
  --ruler-tick: #E5E7EB;
  --ruler-label: #D1D5DB;
  --ruler-edge: #374151;

  --measure-line: #3B82F6;
  --measure-fill: rgba(59, 130, 246, 0.15);
  --guide-line: #3B82F6;
  --crosshair: #3B82F6;

  --calib-card: #4B5563;
  --calib-match: #34D399;
  --calib-mismatch: #F87171;

  --border: #374151;
  --border-strong: #4B5563;

  --shadow-sm: 0 1px 2px rgba(0,0,0,0.3);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.4);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.5);
}
```

---

## 3. Typography

### Font Stacks

```css
/* Latin languages (default) */
:root {
  --font-primary: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;
}

/* Japanese */
:lang(ja) {
  --font-primary: 'Noto Sans JP', 'Hiragino Sans', 'Yu Gothic', 'Meiryo', sans-serif;
}

/* Korean */
:lang(ko) {
  --font-primary: 'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
}

/* Chinese Simplified */
:lang(zh) {
  --font-primary: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', 'SimHei', sans-serif;
}

/* Hindi (Devanagari) */
:lang(hi) {
  --font-primary: 'Noto Sans Devanagari', 'Mangal', 'Arial Unicode MS', sans-serif;
}

/* Arabic (RTL) */
:lang(ar) {
  --font-primary: 'Noto Sans Arabic', 'Geeza Pro', 'Traditional Arabic', 'Arial', sans-serif;
}

/* Thai */
:lang(th) {
  --font-primary: 'Noto Sans Thai', 'Sarabun', 'Tahoma', sans-serif;
}
```

### Type Scale

```css
:root {
  --text-xs: 0.75rem;     /* 12px — labels, tick marks */
  --text-sm: 0.875rem;    /* 14px — secondary text */
  --text-base: 1rem;      /* 16px — body text */
  --text-lg: 1.125rem;    /* 18px — subheadings */
  --text-xl: 1.25rem;     /* 20px — section headings */
  --text-2xl: 1.5rem;     /* 24px — page title */
  --text-3xl: 1.875rem;   /* 30px — hero title */
  --text-4xl: 2.25rem;    /* 36px — hero large */

  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
}
```

### Ruler-Specific Typography

```css
/* Ruler tick labels */
.ruler-label {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--ruler-label);
  user-select: none;
}

/* Measurement readout */
.measurement-display {
  font-family: var(--font-mono);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--fg-primary);
  font-variant-numeric: tabular-nums; /* Fixed-width numbers */
}
```

---

## 4. Layout System

### Page Layout

```
┌─────────────────────────────────────────┐
│ HEADER: Logo | Toolbar | Lang | Theme  │  56px fixed
├─────────────────────────────────────────┤
│                                         │
│           RULER CANVAS                  │  Full viewport height
│    (The ruler IS the hero)              │  minus header
│                                         │
├─────────────────────────────────────────┤
│ CALIBRATION PANEL (collapsible)         │  Auto-height
├─────────────────────────────────────────┤
│ CONTENT: FAQ | How-to | Blog links      │  Below fold
├─────────────────────────────────────────┤
│ FOOTER: Links | Privacy | Language      │  Auto-height
└─────────────────────────────────────────┘
```

### CSS Logical Properties (RTL-Ready)

```css
/* All spacing uses logical properties */
.container {
  margin-inline: auto;        /* instead of margin: 0 auto */
  padding-inline: 16px;       /* instead of padding: 0 16px */
}

.toolbar {
  display: flex;
  gap: 8px;
  padding-block: 8px;
  padding-inline: 12px;
}

.toolbar-item {
  margin-inline-start: 4px;   /* instead of margin-left */
  margin-inline-end: 4px;     /* instead of margin-right */
}

.ruler-edge-top {
  inset-inline-start: 0;      /* instead of left: 0 */
  inset-inline-end: 0;        /* instead of right: 0 */
}

.ruler-edge-left {
  inset-block-start: 56px;    /* below header */
  inset-block-end: 0;
  inset-inline-start: 0;
}

/* Text alignment auto-flips for RTL */
[dir="rtl"] .text-start {
  text-align: start; /* right in RTL, left in LTR */
}
```

### Responsive Breakpoints

```css
/* Mobile-first */
/* sm: 640px — Large phones */
/* md: 768px — Tablets */
/* lg: 1024px — Desktops */
/* xl: 1280px — Large screens */
/* 2xl: 1536px — Ultra-wide */

@media (max-width: 767px) {
  /* Mobile: toolbar at bottom, single-edge ruler default */
  .toolbar { position: fixed; bottom: 0; left: 0; right: 0; }
  .ruler-edge-left, .ruler-edge-right { display: none; }
}

@media (min-width: 768px) {
  /* Tablet+: toolbar at top, multi-edge available */
  .toolbar { position: sticky; top: 0; }
}

@media (min-width: 1024px) {
  /* Desktop: all edges available, sidebar calibration */
  .calibration-panel { position: sticky; top: 72px; }
}
```

---

## 5. Components

### 5.1 Header/Toolbar

```
┌──────────────────────────────────────────────────┐
│ 📏 Real Ruler   [cm|in|mm|px]   [Edges ▾]  🌐 🔵 │
└──────────────────────────────────────────────────┘
```

- Fixed at top, 56px height
- Logo + brand name (left)
- Unit toggle buttons (center)
- Edge selector dropdown
- Language switcher + Dark mode toggle (right)
- On mobile: simplified, bottom-fixed

### 5.2 Ruler Canvas

```
┌──────────────────────────────────────────────┐
│ 0    1    2    3    4    5    6    7    8   │  ← Top edge
│|   |   |   |   |   |   |   |   |   |   |   │
├──────────────────────────────────────────────┤
│                                              │
│                                              │
│              MEASUREMENT AREA                │
│         (place object here)                  │
│                                              │
│                                              │
├──────────────────────────────────────────────┤
│ 0    1    2    3    4    5    6    7    8   │  ← Bottom edge
│|   |   |   |   |   |   |   |   |   |   |   │
└──────────────────────────────────────────────┘
```

- Full viewport width
- Tick marks at calibrated PPI
- Labels at each cm/inch
- Guide lines: blue dashed, 1px
- Crosshair: thin blue lines following cursor

### 5.3 Calibration Panel

```
┌─────────────────────────────────────┐
│ 📐 Calibration                      │
│                                     │
│ ┌─────────┐ ┌─────────┐ ┌────────┐ │
│ │ 📱 Auto  │ │ 💳 Card │ │ 📏 Diag│ │
│ │ Detect   │ │ Calibrate│ │ Enter  │ │
│ └─────────┘ └─────────┘ └────────┘ │
│                                     │
│ Current PPI: 96.0                   │
│ Accuracy: ±0.5mm (calibrated)      │
└─────────────────────────────────────┘
```

- Collapsible (default: collapsed on mobile)
- 3 visible methods (auto, card, diagonal)
- 2 hidden methods (device list, manual DPI)
- Live accuracy indicator

### 5.4 Language Switcher

```
┌──────────────┐
│ 🌐 English ▾ │
├──────────────┤
│ English      │
│ Español      │
│ Français     │
│ Deutsch      │
│ Português    │
│ 日本語       │
│ 한국어       │
│ 中文         │
│ हिन्दी      │
│ العربية     │  ← RTL indicator
│ Русский     │
│ Italiano     │
│ Türkçe       │
│ Tiếng Việt  │
│ ไทย         │
└──────────────┘
```

- Dropdown with all 15 languages
- Current language highlighted
- Native script names (not translations)
- RTL languages show directional indicator
- Keyboard accessible (Arrow keys + Enter)

### 5.5 Measurement Display

```
┌──────────────────────┐
│  ████████████░░░░░░░ │
│  12.5 cm = 4.92 in   │
│  = 125.0 mm          │
└──────────────────────┘
```

- Shows active measurement in all units
- Tabular-nums for stable width
- Updates in real-time during drag
- Persists until cleared

---

## 6. Mobile-First Design

### Touch Optimizations
- **Tap targets:** Minimum 44x44px (WCAG 2.5.5)
- **Calibration:** Swipe-to-match credit card overlay
- **Measurement:** Touch-and-drag along ruler edge
- **Toolbar:** Bottom-fixed on mobile (thumb-reachable)
- **Fullscreen:** Double-tap ruler to enter fullscreen

### Mobile Layout
```
┌──────────────┐
│ 📏 Ruler     │ ← Simplified header
├──────────────┤
│              │
│   RULER      │
│   (single    │
│    edge)     │
│              │
├──────────────┤
│ [cm] [in]    │ ← Bottom toolbar
│ [📐] [🌐] [🌙]│
└──────────────┘
```

### Desktop Layout
```
┌──────────────────────────────────────────────┐
│ 📏 Real Ruler  [cm|in|mm]  [Edges]  [🌐] [🌙]│
├──────────────────────────────────────────────┤
│ ┌──┐                                        │
│ │  │    RULER CANVAS (full viewport)         │
│ │L │    with guide lines and crosshair       │
│ │E │                                         │
│ │F │                                         │
│ │T │                                         │
│ └──┘                                        │
└──────────────────────────────────────────────┘
```

---

## 7. Accessibility (A11y)

### WCAG 2.1 AA Compliance
- ✅ Color contrast ratio ≥4.5:1 for all text
- ✅ Color contrast ratio ≥3:1 for large text and UI components
- ✅ Focus visible indicators on all interactive elements
- ✅ Keyboard navigation (Tab, Enter, Arrow, Escape)
- ✅ ARIA labels on ruler edges, calibration controls
- ✅ Screen reader announcements for measurement values
- ✅ `prefers-reduced-motion` disables animations
- ✅ `prefers-color-scheme` auto-detects dark mode

### ARIA Implementation

```html
<!-- Ruler edge -->
<div
  role="img"
  aria-label="Ruler along top edge, showing centimeters from 0 to 30"
  aria-roledescription="measurement ruler"
>
  <!-- ruler content -->
</div>

<!-- Calibration panel -->
<div role="region" aria-label="Screen calibration">
  <button aria-expanded="false" aria-controls="calibration-panel">
    Calibrate
  </button>
  <div id="calibration-panel" role="group">
    <button aria-label="Auto-detect device and calibrate">
      Auto Detect
    </button>
    <button aria-label="Calibrate using credit card size reference">
      Credit Card
    </button>
  </div>
</div>

<!-- Live measurement -->
<div
  aria-live="polite"
  aria-atomic="true"
  class="sr-only"
>
  Measuring: 12.5 centimeters
</div>
```

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `1` | Switch to cm |
| `2` | Switch to inches |
| `3` | Switch to mm |
| `4` | Switch to px |
| `G` | Toggle guide lines |
| `C` | Toggle crosshair |
| `F` | Toggle fullscreen |
| `D` | Toggle dark mode |
| `Esc` | Clear measurements / close panels |
| `?` | Show keyboard shortcuts help |

---

## 8. Dark Mode

### Toggle
- Button in toolbar (sun/moon icon)
- Auto-detects `prefers-color-scheme`
- Persists choice in localStorage
- Smooth 200ms transition

### Implementation
```css
/* Transition between themes */
*, *::before, *::after {
  transition: background-color 0.2s ease,
              color 0.2s ease,
              border-color 0.2s ease;
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    transition: none;
  }
}
```

---

## 9. 🌐 RTL Support (Arabic)

### CSS Logical Properties
All layout uses CSS logical properties (see Section 4) for automatic RTL support.

### Arabic-Specific Adjustments

```css
:lang(ar) {
  direction: rtl;
  text-align: right;
}

/* Ruler numbers remain LTR (universal notation) */
[dir="rtl"] .ruler-label {
  direction: ltr;
  unicode-bidi: bidi-override;
}

/* Toolbar items reverse order in RTL */
[dir="rtl"] .toolbar {
  flex-direction: row-reverse;
}

/* Calibration panel mirrors */
[dir="rtl"] .calibration-card {
  margin-left: 0;
  margin-right: auto;
}
```

### RTL Testing Checklist
- [ ] Header toolbar flows right-to-left
- [ ] Language switcher dropdown opens to the left
- [ ] Calibration panel text is right-aligned
- [ ] Ruler tick marks are mirrored correctly
- [ ] Numbers remain left-to-right (universal)
- [ ] FAQ content is right-aligned
- [ ] Footer links flow right-to-left
- [ ] Focus indicators work in RTL layout

---

## 10. Performance Budget

| Resource | Budget | Notes |
|----------|--------|-------|
| HTML | <5KB | Static Astro output |
| CSS | <15KB | Global + component styles |
| JS | <30KB | Ruler logic + calibration |
| Fonts | <100KB | Inter subset + Noto Sans per locale |
| Images | <50KB | SVG icons only, no raster |
| **Total** | **<200KB** | **gzipped: <60KB** |

### Font Loading Strategy
```css
/* Critical: Inter (Latin) loaded immediately */
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-latin.woff2') format('woff2');
  font-display: swap;
  unicode-range: U+0000-00FF; /* Latin only */
}

/* Non-critical: CJK fonts loaded on demand */
:lang(ja) /* loads Noto Sans JP */ { }
:lang(zh) /* loads Noto Sans SC */ { }
:lang(ar) /* loads Noto Sans Arabic */ { }
```

---

*Generated by @research using anti-ui-slop (UIZZE), design-taste-frontend (taste-skill v2), and web-design-guidelines (Vercel) skills. All design decisions grounded in competitor analysis and anti-AI-slop principles.*
