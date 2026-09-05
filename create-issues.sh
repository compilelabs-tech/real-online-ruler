#!/bin/bash
TOKEN=$(git credential fill <<< $'protocol=https\nhost=github.com' 2>/dev/null | grep password | cut -d= -f2)
API="https://api.github.com/repos/compilelabs-tech/real-online-ruler"

# Issue 1
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Accept: application/vnd.github.v3+json" "$API/issues" -d '{
  "title": "[scaffold|feature] Project scaffold + core ruler engine (cm/in/mm, 4-edge, crosshair, guide lines)",
  "body": "### What\nInitialize the Astro 5 project with i18n routing, build a precision ruler component supporting cm/inches/mm units, four-edge rulers (top/bottom/left/right), live crosshair with X/Y coordinates, and click-to-drop guide lines.\n\n### Why\nThis is the core product — without a functioning ruler, nothing else matters. The scaffold sets up the entire development foundation (Astro 5, i18n, build pipeline, deployment config).\n\n### Acceptance Criteria\n- [ ] `npm create astro@latest` with TypeScript, i18n config for 15 locales (prefixDefaultLocale: false)\n- [ ] Ruler component renders at exact physical size (CSS `device-pixel-ratio` aware)\n- [ ] Units toggle: cm / inches / mm (persisted in localStorage)\n- [ ] Four-edge rulers visible simultaneously\n- [ ] Crosshair mode: live X/Y coordinates display on hover/touch\n- [ ] Click/tap anywhere to drop a persistent guide line (horizontal/vertical toggle)\n- [ ] Dark/Light mode toggle (persisted, respects `prefers-color-scheme`)\n- [ ] Keyboard shortcuts: `U` (units), `G` (guide lines), `C` (crosshair), `D` (dark mode), `F` (fullscreen)\n- [ ] Mobile-responsive: touch-optimized, no horizontal scroll\n- [ ] Bundle size < 50KB gzipped (ruler page only)\n- [ ] Lighthouse Performance ≥ 95, LCP < 1.5s, CLS < 0.1\n\n**Branch:** feat/issue-1-scaffold\n**Status:** Done — implemented in commit d7c3c6b, 9a9c631",
  "labels": ["feature", "scaffold", "P0", "M1", "frontend"]
}' 2>&1
echo "--- Issue 1 done ---"

# Issue 2
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Accept: application/vnd.github.v3+json" "$API/issues" -d '{
  "title": "[feature] Calibration system — 5 methods (auto-detect, device DB, diagonal, credit card, manual DPI)",
  "body": "### What\nImplement five calibration methods so users on any device can achieve accurate physical measurements:\n1. **Auto-detect** — match `navigator.userAgent` + screen specs against 100+ device database\n2. **Device database** — searchable list of 100+ devices with known DPI\n3. **Screen diagonal** — user enters diagonal inches, computes DPI from resolution\n4. **Credit card** — ISO ID-1 standard (85.60 × 53.98 mm), user places card on screen\n5. **Manual DPI** — direct DPI/PPI entry for power users\n\n### Why\nCalibration accuracy is the #1 user complaint with competitor tools. Five methods cover every scenario from zero-effort to precision.\n\n### Acceptance Criteria\n- [ ] Device database JSON with 100+ entries (name, width/height px, diagonal in, DPI)\n- [ ] Auto-detect runs on first load, shows confidence score, one-click apply\n- [ ] Device search: fuzzy match by name, filter by type (phone/tablet/laptop/monitor)\n- [ ] Screen diagonal: input inch value, live preview of ruler scaling\n- [ ] Credit card calibration: visual overlay matching card outline, drag-to-align, calculates DPI from known 85.60mm width\n- [ ] Manual DPI: numeric input with validation (50-500 DPI range)\n- [ ] Calibration persists in localStorage per device\n- [ ] Calibration modal accessible via keyboard (Esc to close, Tab navigation)\n- [ ] Visual indicator showing current calibration method + accuracy estimate\n\n**Branch:** feat/issue-2-calibration\n**Status:** Done — implemented in commits on feat/issue-2-calibration branch",
  "labels": ["feature", "P0", "M1", "frontend"]
}' 2>&1
echo "--- Issue 2 done ---"

# Issue 3
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Accept: application/vnd.github.v3+json" "$API/issues" -d '{
  "title": "[feature|docs] i18n foundation — 15 languages (EN, ES, FR, DE, PT, ZH, JA, KO, PT, RU, AR, HI, BN, ID, TR, VI) + language switcher",
  "body": "### What\nBuild the complete i18n infrastructure for 15 launch languages with path-based routing (`/[locale]/`), hreflang tags, translation files, and a fully accessible language switcher component.\n\n### Why\nMultilingual support is the primary USP — launching with 15 languages (vs competitors 1-3) captures immediate SEO traffic in underserved markets.\n\n### Acceptance Criteria\n- [ ] Astro i18n config: 15 locales defined, defaultLocale: \"en\", prefixDefaultLocale: false\n- [ ] URL structure: / → redirects to /en/, /es/, /fr/, /de/, /pt/, /zh/, /ja/, /ko/, /ru/, /ar/, /hi/, /bn/, /id/, /tr/, /vi/\n- [ ] Language switcher: dropdown with native language names, flag icons, keyboard accessible\n- [ ] Bidirectional hreflang tags on every page (including x-default → /en/)\n- [ ] Self-referencing hreflang on each localized page\n- [ ] html[lang] and dir attributes set per locale (all LTR for P0)\n- [ ] Date/number formatting via Intl per locale\n- [ ] Sitemap generation includes all 15 language variants\n\n**Branch:** feat/issue-1-scaffold (part of scaffold)\n**Status:** Done — implemented in scaffold commit d7c3c6b",
  "labels": ["feature", "docs", "P0", "M1", "frontend"]
}' 2>&1
echo "--- Issue 3 done ---"

# Issue 4
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Accept: application/vnd.github.v3+json" "$API/issues" -d '{
  "title": "[feature|qa] PWA offline support — service worker, manifest, install prompt, cache-first strategy",
  "body": "### What\nMake the ruler fully functional offline after first visit: service worker with cache-first strategy for static assets, runtime caching for calibration data, web app manifest, install prompt, and offline indicator.\n\n### Why\n\"Works without internet\" is a secondary USP. Many users measure in workshops, job sites, or areas with poor connectivity.\n\n### Acceptance Criteria\n- [ ] vite-plugin-pwa: precache all static assets (HTML, CSS, JS, fonts, images, translation files)\n- [ ] Runtime cache: calibration DB, localStorage sync\n- [ ] Web App Manifest: name, short_name, icons (192/512), theme_color, display: standalone, start_url: /en/\n- [ ] Install prompt: custom deferred prompt UI (not native browser prompt), dismissible\n- [ ] Offline indicator: subtle banner when offline, hidden when online\n- [ ] Service worker updates: skipWaiting + clients.claim, toast notification on update available\n- [ ] Lighthouse PWA score ≥ 90\n- [ ] Tested offline: ruler, calibration, settings all work without network\n\n**Branch:** feat/issue-2-calibration\n**Status:** Done — implemented in commits on feat/issue-2-calibration branch",
  "labels": ["feature", "qa", "P0", "M1", "frontend"]
}' 2>&1
echo "--- Issue 4 done ---"

# Issue 5
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Accept: application/vnd.github.v3+json" "$API/issues" -d '{
  "title": "[qa|enhancement] Accessibility-first — ARIA, keyboard nav, screen readers, focus management, Lighthouse ≥ 95",
  "body": "### What\nEnsure the ruler meets WCAG 2.1 AA: full keyboard navigation, ARIA labels/roles, screen reader announcements for dynamic content (crosshair coords, guide lines, calibration changes), focus management in modals, color contrast ≥ 4.5:1, reduced motion support.\n\n### Why\nAccessibility is a stated USP and legal requirement in many target markets (EU, US, CA). Also drives Lighthouse scores.\n\n### Acceptance Criteria\n- [ ] Every interactive element: keyboard reachable, visible focus ring, ARIA label/role\n- [ ] Ruler canvas: role=\"img\" with aria-label describing current measurement\n- [ ] Crosshair: live region (aria-live=\"polite\") announcing X/Y on move\n- [ ] Guide lines: announced on add/remove (aria-live=\"assertive\")\n- [ ] Calibration modal: focus trap, Esc closes, focus returns to trigger\n- [ ] Language switcher: aria-label, keyboard navigation, announces selection\n- [ ] Color contrast: all text ≥ 4.5:1, UI elements ≥ 3:1 (verified in both themes)\n- [ ] prefers-reduced-motion: disable crosshair animation, guide line transitions\n- [ ] Lighthouse Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95\n- [ ] axe-core automated test: zero violations\n\n**Branch:** feat/issue-2-calibration\n**Status:** Done — implemented in commits on feat/issue-2-calibration branch",
  "labels": ["qa", "enhancement", "P0", "M1", "frontend"]
}' 2>&1
echo "--- Issue 5 done ---"

# Issue 6
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Accept: application/vnd.github.v3+json" "$API/issues" -d '{
  "title": "[docs|feature] SEO foundation — meta tags, JSON-LD, sitemap, robots, OG image, hreflang",
  "body": "### What\nImplement complete technical SEO foundation: per-page meta tags (title, description, og, twitter), JSON-LD structured data (WebApplication, FAQPage), auto-generated sitemap.xml with hreflang, robots.txt, canonical URLs, and Open Graph image.\n\n### Why\nSEO is the primary acquisition channel. Multilingual SEO (hreflang, localized content) is the moat.\n\n### Acceptance Criteria\n- [ ] Every page: unique title, description (localized), canonical, og:*, twitter:card\n- [ ] JSON-LD: WebApplication on ruler page\n- [ ] Sitemap.xml: all 15 language URLs + hreflang annotations (auto-generated at build)\n- [ ] robots.txt: allow all, sitemap reference\n- [ ] RSS feed: all 15 locale items\n- [ ] Open Graph image: 1200x630 branded image\n- [ ] Security headers: CSP, HSTS, X-Frame-Options via _headers\n- [ ] Lighthouse SEO ≥ 95\n\n**Branch:** feat/issue-2-calibration\n**Status:** Done — implemented in commit 048ef52 on feat/issue-2-calibration branch",
  "labels": ["docs", "feature", "P0", "M1", "frontend"]
}' 2>&1
echo "--- Issue 6 done ---"