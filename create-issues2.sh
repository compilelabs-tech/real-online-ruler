#!/bin/bash
TOKEN=$(git credential fill <<< $'protocol=https\nhost=github.com' 2>/dev/null | grep password | cut -d= -f2)
API="https://api.github.com/repos/compilelabs-tech/real-online-ruler"

# Use jq for proper JSON escaping
create_issue() {
  local title="$1"
  local body="$2"
  local labels="$3"
  
  jq -n --arg title "$title" --arg body "$body" --argjson labels "$labels" \
    '{title: $title, body: $body, labels: $labels}' | \
  curl -X POST -H "Authorization: Bearer $TOKEN" -H "Accept: application/vnd.github.v3+json" -H "Content-Type: application/json" "$API/issues" -d @- 2>&1
}

# Issue 1
create_issue \
  "[scaffold|feature] Project scaffold + core ruler engine (cm/in/mm, 4-edge, crosshair, guide lines)" \
  "### What
Initialize the Astro 5 project with i18n routing, build a precision ruler component supporting cm/inches/mm units, four-edge rulers (top/bottom/left/right), live crosshair with X/Y coordinates, and click-to-drop guide lines.

### Why
This is the core product — without a functioning ruler, nothing else matters. The scaffold sets up the entire development foundation (Astro 5, i18n, build pipeline, deployment config).

### Acceptance Criteria
- [ ] npm create astro@latest with TypeScript, i18n config for 15 locales (prefixDefaultLocale: false)
- [ ] Ruler component renders at exact physical size (CSS device-pixel-ratio aware)
- [ ] Units toggle: cm / inches / mm (persisted in localStorage)
- [ ] Four-edge rulers visible simultaneously
- [ ] Crosshair mode: live X/Y coordinates display on hover/touch
- [ ] Click/tap anywhere to drop a persistent guide line (horizontal/vertical toggle)
- [ ] Dark/Light mode toggle (persisted, respects prefers-color-scheme)
- [ ] Keyboard shortcuts: U (units), G (guide lines), C (crosshair), D (dark mode), F (fullscreen)
- [ ] Mobile-responsive: touch-optimized, no horizontal scroll
- [ ] Bundle size < 50KB gzipped (ruler page only)
- [ ] Lighthouse Performance >= 95, LCP < 1.5s, CLS < 0.1

**Branch:** feat/issue-1-scaffold
**Status:** Done — implemented in commit d7c3c6b, 9a9c631" \
  '["feature", "scaffold", "P0", "M1", "frontend"]'

echo "--- Issue 1 done ---"