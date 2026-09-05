# 📏 Real Online Ruler

> **The world's first truly multilingual online ruler — measure anything, anywhere, in any language.**

Real Online Ruler is a free, browser-based measurement tool that turns any screen into a precision ruler calibrated to actual physical size. Unlike every competitor (English-only), it launches in **15 languages** from day 1, with Arabic RTL support.

**Repository:** https://github.com/compilelabs-tech/real-online-ruler

---

## ✨ Features

### Core Ruler
- **Units:** cm / inches / mm toggle (persisted in `localStorage`)
- **4-edge rulers:** top, bottom, left, right visible simultaneously
- **Crosshair mode:** live X/Y coordinates on hover/touch
- **Guide lines:** click/tap to drop persistent reference lines (horizontal/vertical)
- **Dark/Light mode:** persisted, respects `prefers-color-scheme`
- **Keyboard shortcuts:** `U` (units), `G` (guide lines), `C` (crosshair), `D` (dark mode), `F` (fullscreen), `K` (calibration)
- **Mobile-responsive:** touch-optimized, no horizontal scroll

### 🎯 Calibration — 5 Methods
1. **Auto-detect** — matches `navigator.userAgent` + screen specs against the device database
2. **Device database** — searchable list of 100+ devices with known DPI
3. **Screen diagonal** — enter diagonal inches, DPI computed from resolution
4. **Credit card** — ISO ID-1 standard (85.60 × 53.98 mm), place card on screen
5. **Manual DPI** — direct DPI/PPI entry for power users (50–500 range)

### 🌐 i18n — 15 Languages
EN, ES, FR, DE, ZH, JA, KO, PT, RU, AR, HI, BN, ID, TR, VI — path-based routing (`/en/`, `/es/`, ...), hreflang tags, per-locale metadata, sitemap with all language variants.

### 📱 PWA Offline
Service worker (cache-first), web app manifest, install prompt, offline support after first visit — works in workshops, job sites, and poor-connectivity areas.

### ♿ Accessibility (WCAG 2.1 AA)
ARIA labels/roles, screen reader live regions for crosshair/guides, focus-trap modals, `prefers-reduced-motion` support, keyboard navigation throughout.

### 🔍 SEO
JSON-LD `WebApplication` structured data, Open Graph + Twitter cards, canonical URLs, auto-generated `sitemap.xml` + `rss.xml`, `robots.txt`, OG share image.

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 22.12.0
- npm

### Install & Run

```bash
# 1. Clone the repo
git clone https://github.com/compilelabs-tech/real-online-ruler.git
cd real-online-ruler

# 2. Install dependencies
npm install

# 3. Start the dev server (http://localhost:4321)
npm run dev

# 4. Production build → ./dist/
npm run build

# 5. Preview the production build
npm run preview
```

> **Note:** behind the scenes this repo's pages also live under `src/pages/` per-locale — the root `/` page redirects to the default locale (`/en/`).

---

## 📁 Project Structure

```
real-online-ruler/
├── .workflow/                  # Factory workflow state (state.json, tasks.json, reports/)
├── public/                     # Static assets: robots.txt, og-image, favicon, icons
├── src/
│   ├── components/
│   │   ├── Ruler.svelte        # Core ruler engine (units, edges, crosshair, guides)
│   │   └── Calibration.svelte  # 5-method calibration modal
│   ├── data/
│   │   └── devices.json        # 100+ device database (name, resolution, diagonal, DPI)
│   └── pages/
│       ├── index.astro         # Root → redirects to /en/
│       ├── en/ es/ fr/ ...     # 15 locale pages
│       ├── rss.xml.js          # RSS feed (all locales)
│       └── sitemap.xml.js      # XML sitemap with hreflang annotations
├── astro.config.mjs            # Astro 5 config (i18n, PWA, svelte)
├── package.json
├── PROJECT-CONTEXT.md          # Strategy & context document
├── DESIGN.md                   # Design specs
├── SEO-PLAYBOOK.md             # SEO strategy
└── issues-backlog.md           # MVP issue backlog (6 issues)
```

---

## 🔧 Configuration

| File | What it controls |
|---|---|
| `astro.config.mjs` | i18n locales, Svelte integration, PWA (vite-plugin-pwa) |
| `src/data/devices.json` | Device database used by auto-detect + device-search calibration |
| `src/components/Ruler.svelte` | Default units, theme, shortcuts, ruler behavior |
| `src/components/Calibration.svelte` | Calibration methods, DPI persistence |
| `src/pages/en/index.astro` | Home meta tags, JSON-LD, hreflang, OG/Twitter cards |
| `public/robots.txt` | Crawl directives + sitemap reference |

---

## 🚢 Deployment

### Cloudflare Pages (recommended — $0)
1. Push to GitHub: `https://github.com/compilelabs-tech/real-online-ruler`
2. In Cloudflare Pages → **Create project** → connect the GitHub repo
3. Build settings:
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
4. Deploy (auto-deploys on every push to `main`)

### Manual (any static host)
```bash
npm run build
# upload ./dist/ to any static host (Netlify, Vercel, S3, etc.)
```

---

## 🧪 Testing

```bash
npm run build        # Build must pass (15 locale pages + sitemap + rss + PWA)
npm run preview      # Serve the production build locally
```

**Manual QA checklist:**
- [ ] Ruler shows correct physical size on a known device (calibrate via credit card method)
- [ ] Units toggle persists across reloads
- [ ] Crosshair mode shows live coordinates
- [ ] Guide lines add/remove correctly
- [ ] Calibration modal: Esc closes, focus returns to trigger
- [ ] Dark mode respects system preference on first load
- [ ] All 15 locales render (check `/es/`, `/ar/`, `/bn/`, ...)
- [ ] Offline: open site → go offline → reload → still works (PWA)

---

## 🌳 Git Workflow

- Feature branches: `feat/issue-<N>-<slug>` (e.g. `feat/issue-2-calibration`)
- Conventional commits: `feat(#2): ...`, `fix(#5): ...`, `chore(#1): ...`, `docs(#6): ...`
- All MVP work is on `main` / `feat/issue-*` branches — see `.workflow/` for state

---

## 📚 Docs

- [PROJECT-CONTEXT.md](PROJECT-CONTEXT.md) — strategy, USP, target audience, monetization
- [DESIGN.md](DESIGN.md) — design system & component specs
- [SEO-PLAYBOOK.md](SEO-PLAYBOOK.md) — SEO strategy & keyword plan
- [issues-backlog.md](issues-backlog.md) — MVP issue breakdown (6 issues, all done)

---

## 🛡️ License & Privacy

- **Privacy-first:** all measurements and calibration data stay on-device (`localStorage`) — nothing is sent to a server.
- License: see repository (MIT-style, ask maintainer).

---

Made with ❤️ by [compilelabs-tech](https://github.com/compilelabs-tech) · **Repo:** https://github.com/compilelabs-tech/real-online-ruler