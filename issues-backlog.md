# Real Online Ruler — MVP Issue Backlog

> Generated from PROJECT-CONTEXT.md MVP Scope (P0 items). Since `gh` CLI is not available, issues are documented here for manual creation.

---

## Issue 1: Project Scaffold & Core Ruler Engine

**Title:** `[scaffold|feature] Project scaffold + core ruler engine (cm/in/mm, 4-edge, crosshair, guide lines)`

**Labels:** `feature`, `scaffold`, `P0`, `M1`, `frontend`

**Description:**

### What
Initialize the Astro 5 project with i18n routing, build a precision ruler component supporting cm/inches/mm units, four-edge rulers (top/bottom/left/right), live crosshair with X/Y coordinates, and click-to-drop guide lines.

### Why
This is the core product — without a functioning ruler, nothing else matters. The scaffold sets up the entire development foundation (Astro 5, i18n, build pipeline, deployment config).

### Acceptance Criteria
- [ ] `npm create astro@latest` with TypeScript, i18n config for 15 locales (prefixDefaultLocale: false)
- [ ] Ruler component renders at exact physical size (CSS `device-pixel-ratio` aware)
- [ ] Units toggle: cm / inches / mm (persisted in localStorage)
- [ ] Four-edge rulers visible simultaneously
- [ ] Crosshair mode: live X/Y coordinates display on hover/touch
- [ ] Click/tap anywhere to drop a persistent guide line (horizontal/vertical toggle)
- [ ] Dark/Light mode toggle (persisted, respects `prefers-color-scheme`)
- [ ] Keyboard shortcuts: `U` (units), `G` (guide lines), `C` (crosshair), `D` (dark mode), `F` (fullscreen)
- [ ] Mobile-responsive: touch-optimized, no horizontal scroll
- [ ] Bundle size < 50KB gzipped (ruler page only)
- [ ] Lighthouse Performance ≥ 95, LCP < 1.5s, CLS < 0.1

---

## Issue 2: Calibration System (5 Methods)

**Title:** `[feature] Calibration system — 5 methods (auto-detect, device DB, diagonal, credit card, manual DPI)`

**Labels:** `feature`, `P0`, `M1`, `frontend`

**Description:**

### What
Implement five calibration methods so users on any device can achieve accurate physical measurements:
1. **Auto-detect** — match `navigator.userAgent` + screen specs against 100+ device database
2. **Device database** — searchable list of 100+ devices with known DPI
3. **Screen diagonal** — user enters diagonal inches, computes DPI from resolution
4. **Credit card** — ISO ID-1 standard (85.60 × 53.98 mm), user places card on screen
5. **Manual DPI** — direct DPI/PPI entry for power users

### Why
Calibration accuracy is the #1 user complaint with competitor tools. Five methods cover every scenario from zero-effort to precision.

### Acceptance Criteria
- [ ] Device database JSON with 100+ entries (name, width/height px, diagonal in, DPI)
- [ ] Auto-detect runs on first load, shows confidence score, one-click apply
- [ ] Device search: fuzzy match by name, filter by type (phone/tablet/laptop/monitor)
- [ ] Screen diagonal: input inch value, live preview of ruler scaling
- [ ] Credit card calibration: visual overlay matching card outline, drag-to-align, calculates DPI from known 85.60mm width
- [ ] Manual DPI: numeric input with validation (50-500 DPI range)
- [ ] Calibration persists in localStorage per device
- [ ] Calibration modal accessible via keyboard (Esc to close, Tab navigation)
- [ ] Visual indicator showing current calibration method + accuracy estimate

---

## Issue 3: i18n Foundation — 5 Languages (EN, ES, FR, DE, PT)

**Title:** `[feature|docs] i18n foundation — 5 launch languages (EN, ES, FR, DE, PT) + language switcher`

**Labels:** `feature`, `docs`, `P0`, `M1`, `frontend`

**Description:**

### What
Build the complete i18n infrastructure for 5 launch languages with path-based routing (`/[locale]/`), hreflang tags, translation files, and a fully accessible language switcher component.

### Why
Multilingual support is the primary USP — launching with 5 languages (vs competitors' 1-3) captures immediate SEO traffic in underserved markets.

### Acceptance Criteria
- [ ] Astro i18n config: 15 locales defined, 5 active (EN, ES, FR, DE, PT), defaultLocale: 'en', prefixDefaultLocale: false
- [ ] URL structure: `/` → redirects to `/en/`, `/es/`, `/fr/`, `/de/`, `/pt/`
- [ ] Translation JSON files: `src/i18n/[locale].json` with 200+ keys (UI strings, units, calibration, settings, errors, accessibility)
- [ ] Language switcher: dropdown with native language names, flag icons, keyboard accessible (Arrow keys, Enter, Escape)
- [ ] Bidirectional hreflang tags on every page (including `x-default` → `/en/`)
- [ ] Self-referencing hreflang on each localized page
- [ ] `html[lang]` and `dir` attributes set per locale (all LTR for P0)
- [ ] Date/number formatting via `Intl` per locale
- [ ] 404 page translated for all 5 languages
- [ ] Sitemap generation includes all 5 language variants

---

## Issue 4: PWA & Offline Support

**Title:** `[feature|qa] PWA offline support — service worker, manifest, install prompt, cache-first strategy`

**Labels:** `feature`, `qa`, `P0`, `M1`, `frontend`

**Description:**

### What
Make the ruler fully functional offline after first visit: service worker with cache-first strategy for static assets, runtime caching for calibration data, web app manifest, install prompt, and offline indicator.

### Why
"Works without internet" is a secondary USP. Many users measure in workshops, job sites, or areas with poor connectivity.

### Acceptance Criteria
- [ ] `astro-pwa` or custom SW: precache all static assets (HTML, CSS, JS, fonts, images, translation files)
- [ ] Runtime cache: calibration DB, localStorage sync
- [ ] Web App Manifest: name, short_name, icons (192/512), theme_color, display: standalone, start_url: `/en/`
- [ ] Install prompt: custom deferred prompt UI (not native browser prompt), dismissible
- [ ] Offline indicator: subtle banner when offline, hidden when online
- [ ] Service worker updates: skipWaiting + clients.claim, toast notification on update available
- [ ] Lighthouse PWA score ≥ 90
- [ ] Tested offline: ruler, calibration, settings all work without network

---

## Issue 5: Accessibility & QA Hardening

**Title:** `[qa|enhancement] Accessibility-first — ARIA, keyboard nav, screen readers, focus management, Lighthouse ≥ 95`

**Labels:** `qa`, `enhancement`, `P0`, `M1`, `frontend`

**Description:**

### What
Ensure the ruler meets WCAG 2.1 AA: full keyboard navigation, ARIA labels/roles, screen reader announcements for dynamic content (crosshair coords, guide lines, calibration changes), focus management in modals, color contrast ≥ 4.5:1, reduced motion support.

### Why
Accessibility is a stated USP and legal requirement in many target markets (EU, US, CA). Also drives Lighthouse scores.

### Acceptance Criteria
- [ ] Every interactive element: keyboard reachable, visible focus ring, ARIA label/role
- [ ] Ruler canvas: `role="img"` with `aria-label` describing current measurement
- [ ] Crosshair: live region (`aria-live="polite"`) announcing X/Y on move
- [ ] Guide lines: announced on add/remove (`aria-live="assertive"`)
- [ ] Calibration modal: focus trap, Esc closes, focus returns to trigger
- [ ] Language switcher: `aria-label`, keyboard navigation, announces selection
- [ ] Color contrast: all text ≥ 4.5:1, UI elements ≥ 3:1 (verified in both themes)
- [ ] `prefers-reduced-motion`: disable crosshair animation, guide line transitions
- [ ] Lighthouse Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95
- [ ] axe-core automated test: zero violations

---

## Issue 6: SEO Foundation & Deployment Pipeline

**Title:** `[docs|feature] SEO foundation — meta tags, JSON-LD, sitemap, robots, Cloudflare Pages deploy`

**Labels:** `docs`, `feature`, `P0`, `M1`, `frontend`

**Description:**

### What
Implement complete technical SEO foundation: per-page meta tags (title, description, og, twitter), JSON-LD structured data (WebApplication, FAQPage), auto-generated sitemap.xml with hreflang, robots.txt, canonical URLs, and Cloudflare Pages deployment pipeline.

### Why
SEO is the primary acquisition channel. Multilingual SEO (hreflang, localized content) is the moat.

### Acceptance Criteria
- [ ] Every page: unique title, description (localized), canonical, og:*, twitter:card
- [ ] JSON-LD: `WebApplication` on ruler page, `FAQPage` on FAQ page (per language)
- [ ] Sitemap.xml: all 5 language URLs + hreflang annotations (auto-generated at build)
- [ ] robots.txt: allow all, sitemap reference
- [ ] Cloudflare Pages config: build command `npm run build`, output `dist`, custom domain ready
- [ ] Cloudflare Web Analytics enabled (privacy-first)
- [ ] 301 redirect: root `/` → `/en/` (via `_redirects` or Worker)
- [ ] Security headers: CSP, HSTS, X-Frame-Options via Cloudflare Workers or `_headers`
- [ ] Lighthouse SEO ≥ 95

---

## Summary Table

| ID | Title | Labels | Priority | Milestone | Assignee |
|----|-------|--------|----------|-----------|----------|
| task-001 | Project scaffold + core ruler engine | feature, scaffold, P0 | P0 | M1 | frontend |
| task-002 | Calibration system — 5 methods | feature, P0 | P0 | M1 | frontend |
| task-003 | i18n foundation — 5 languages | feature, docs, P0 | P0 | M1 | frontend |
| task-004 | PWA offline support | feature, qa, P0 | P0 | M1 | frontend |
| task-005 | Accessibility & QA hardening | qa, enhancement, P0 | P0 | M1 | frontend |
| task-006 | SEO foundation & deployment | docs, feature, P0 | P0 | M1 | frontend |

**gh used:** No — `gh` CLI not installed. Issues documented in this file for manual creation.