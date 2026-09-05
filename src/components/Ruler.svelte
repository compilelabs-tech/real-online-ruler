<script lang="ts">
  import { onMount } from 'svelte';
  import Calibration from './Calibration.svelte';

  const UNITS = ['cm', 'inches', 'mm'] as const;
  type Unit = typeof UNITS[number];

  interface GuideLine {
    id: string;
    type: 'horizontal' | 'vertical';
    position: number; // in pixels from origin
  }

  interface CalibrationData {
    method: 'auto' | 'device' | 'diagonal' | 'card' | 'manual' | null;
    dpi: number;
    confidence: number;
    deviceName: string | null;
    diagonal: number | null;
    cardAligned: boolean;
  }

  // State
  let currentUnit: Unit = 'cm';
  let isDarkMode = false;
  let showCrosshair = false;
  let showGuides = true;
  let guides: GuideLine[] = [];
  let guideToggle = 'horizontal'; // 'horizontal' | 'vertical'
  let crosshairPos = { x: 0, y: 0 };
  let viewportSize = { width: 0, height: 0 };
  let dpr = 1;
  let calibration: CalibrationData = {
    method: null,
    dpi: 96,
    confidence: 0,
    deviceName: null,
    diagonal: null,
    cardAligned: false
  };

  // DOM elements
  let rulerTop: HTMLElement;
  let rulerBottom: HTMLElement;
  let rulerLeft: HTMLElement;
  let rulerRight: HTMLElement;
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let crosshairEl: HTMLElement;
  let coordsEl: HTMLElement;
  let unitBtn: HTMLButtonElement;
  let darkBtn: HTMLButtonElement;
  let crosshairBtn: HTMLButtonElement;
  let guidesBtn: HTMLButtonElement;
  let fullscreenBtn: HTMLButtonElement;
  let guideToggleBtn: HTMLButtonElement;

  function getStored<T>(key: string, fallback: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch {
      return fallback;
    }
  }

  function setStored(key: string, value: unknown) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function loadSettings() {
    currentUnit = getStored('ruler-unit', 'cm') as Unit;
    isDarkMode = getStored('ruler-dark', window.matchMedia('(prefers-color-scheme: dark)').matches);
    showCrosshair = getStored('ruler-crosshair', false);
    showGuides = getStored('ruler-guides', true);
    guides = getStored('ruler-guide-lines', []);
    guideToggle = getStored('ruler-guide-toggle', 'horizontal');
    applyTheme();
    updateUnitButton();
    updateButtons();
  }

  function applyTheme() {
    document.documentElement.classList.toggle('dark', isDarkMode);
    darkBtn.setAttribute('aria-pressed', String(isDarkMode));
  }

  function updateUnitButton() {
    unitBtn.textContent = `Unit: ${currentUnit.toUpperCase()}`;
    unitBtn.setAttribute('aria-label', `Current unit: ${currentUnit}, press U to cycle`);
    // Announce to screen readers
    announceToScreenReader(`Unit changed to ${currentUnit}`);
  }

  function announceToScreenReader(message: string) {
    const announcer = document.getElementById('sr-announcer');
    if (announcer) {
      announcer.textContent = message;
    }
  }

  function updateButtons() {
    crosshairBtn.setAttribute('aria-pressed', String(showCrosshair));
    guidesBtn.setAttribute('aria-pressed', String(showGuides));
    guideToggleBtn.textContent = `Guide: ${guideToggle.charAt(0).toUpperCase() + guideToggle.slice(1)}`;
    guideToggleBtn.setAttribute('aria-label', `Guide orientation: ${guideToggle}, click to toggle`);
  }

  function saveSettings() {
    setStored('ruler-unit', currentUnit);
    setStored('ruler-dark', isDarkMode);
    setStored('ruler-crosshair', showCrosshair);
    setStored('ruler-guides', showGuides);
    setStored('ruler-guide-lines', guides);
    setStored('ruler-guide-toggle', guideToggle);
  }

  function cycleUnit() {
    const idx = UNITS.indexOf(currentUnit);
    currentUnit = UNITS[(idx + 1) % UNITS.length];
    updateUnitButton();
    saveSettings();
    renderRulers();
  }

  function toggleDark() {
    isDarkMode = !isDarkMode;
    applyTheme();
    saveSettings();
    renderRulers();
    announceToScreenReader(`Dark mode ${isDarkMode ? 'enabled' : 'disabled'}`);
  }

  function toggleCrosshair() {
    showCrosshair = !showCrosshair;
    crosshairBtn.setAttribute('aria-pressed', String(showCrosshair));
    crosshairEl.style.display = showCrosshair ? 'block' : 'none';
    coordsEl.style.display = showCrosshair ? 'block' : 'none';
    saveSettings();
    announceToScreenReader(`Crosshair ${showCrosshair ? 'enabled' : 'disabled'}`);
  }

  function toggleGuides() {
    showGuides = !showGuides;
    guidesBtn.setAttribute('aria-pressed', String(showGuides));
    renderGuides();
    saveSettings();
    announceToScreenReader(`Guide lines ${showGuides ? 'enabled' : 'disabled'}`);
  }

  function toggleGuideOrientation() {
    guideToggle = guideToggle === 'horizontal' ? 'vertical' : 'horizontal';
    guideToggleBtn.textContent = `Guide: ${guideToggle.charAt(0).toUpperCase() + guideToggle.slice(1)}`;
    saveSettings();
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  function getUnitInfo(unit: Unit) {
    switch (unit) {
      case 'mm':
        return { major: 10, minor: 1, label: 'mm', majorLabel: 'cm' };
      case 'cm':
        return { major: 10, minor: 1, label: 'mm', majorLabel: 'cm' };
      case 'inches':
        return { major: 1, minor: 1/16, label: 'in', majorLabel: 'in' };
    }
  }

  function pxPerUnit(unit: Unit): number {
    // Use calibrated DPI or fallback to 96
    const cssInch = calibration.dpi || 96;
    switch (unit) {
      case 'mm':
        return cssInch / 25.4 * dpr;
      case 'cm':
        return cssInch / 2.54 * dpr;
      case 'inches':
        return cssInch * dpr;
    }
  }

  function formatValue(value: number, unit: Unit): string {
    if (unit === 'inches') {
      // Show as fraction for inches
      const whole = Math.floor(value);
      const fraction = value - whole;
      const sixteenths = Math.round(fraction * 16);
      if (sixteenths === 0) return `${whole}"`;
      if (whole === 0) return `${sixteenths}/16"`;
      return `${whole} ${sixteenths}/16"`;
    }
    return `${value.toFixed(unit === 'mm' ? 0 : 1)}${unit}`;
  }

  function renderRulers() {
    if (!ctx || !canvas) return;

    const { width, height } = viewportSize;
    const unitInfo = getUnitInfo(currentUnit);
    const pxPerMajor = pxPerUnit(currentUnit) * unitInfo.major;
    const pxPerMinor = pxPerUnit(currentUnit) * unitInfo.minor;

    // Clear canvas
    ctx.clearRect(0, 0, width * dpr, height * dpr);

    // Set up canvas for high DPI
    ctx.save();
    ctx.scale(dpr, dpr);

    const isDark = isDarkMode;
    const axisColor = isDark ? '#666' : '#ccc';
    const textColor = isDark ? '#ddd' : '#333';
    const majorColor = isDark ? '#888' : '#999';
    const minorColor = isDark ? '#555' : '#ddd';

    // Top ruler
    ctx.fillStyle = isDark ? '#1a1a1a' : '#f5f5f5';
    ctx.fillRect(0, 0, width, 40);

    ctx.strokeStyle = axisColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 40);
    ctx.lineTo(width, 40);
    ctx.stroke();

    // Top ruler marks
    const maxMajorTop = Math.floor(width / pxPerMajor);
    for (let i = 0; i <= maxMajorTop; i++) {
      const x = i * pxPerMajor;
      if (x > width) break;

      // Major tick
      ctx.strokeStyle = majorColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, 30);
      ctx.lineTo(x, 40);
      ctx.stroke();

      // Label
      ctx.fillStyle = textColor;
      ctx.font = '11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(formatValue(i * unitInfo.major, currentUnit), x, 28);

      // Minor ticks
      if (i < maxMajorTop) {
        const minorCount = unitInfo.major / unitInfo.minor;
        for (let m = 1; m < minorCount; m++) {
          const mx = x + m * pxPerMinor;
          if (mx > width) break;
          ctx.strokeStyle = minorColor;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(mx, 34);
          ctx.lineTo(mx, 40);
          ctx.stroke();
        }
      }
    }

    // Bottom ruler
    ctx.fillStyle = isDark ? '#1a1a1a' : '#f5f5f5';
    ctx.fillRect(0, height - 40, width, 40);

    ctx.strokeStyle = axisColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height - 40);
    ctx.lineTo(width, height - 40);
    ctx.stroke();

    const maxMajorBottom = Math.floor(width / pxPerMajor);
    for (let i = 0; i <= maxMajorBottom; i++) {
      const x = i * pxPerMajor;
      if (x > width) break;

      ctx.strokeStyle = majorColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, height - 40);
      ctx.lineTo(x, height - 30);
      ctx.stroke();

      ctx.fillStyle = textColor;
      ctx.font = '11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(formatValue(i * unitInfo.major, currentUnit), x, height - 28);

      if (i < maxMajorBottom) {
        const minorCount = unitInfo.major / unitInfo.minor;
        for (let m = 1; m < minorCount; m++) {
          const mx = x + m * pxPerMinor;
          if (mx > width) break;
          ctx.strokeStyle = minorColor;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(mx, height - 36);
          ctx.lineTo(mx, height - 40);
          ctx.stroke();
        }
      }
    }

    // Left ruler
    ctx.fillStyle = isDark ? '#1a1a1a' : '#f5f5f5';
    ctx.fillRect(0, 0, 40, height);

    ctx.strokeStyle = axisColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, 0);
    ctx.lineTo(40, height);
    ctx.stroke();

    const maxMajorLeft = Math.floor(height / pxPerMajor);
    for (let i = 0; i <= maxMajorLeft; i++) {
      const y = i * pxPerMajor;
      if (y > height) break;

      ctx.strokeStyle = majorColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(30, y);
      ctx.lineTo(40, y);
      ctx.stroke();

      ctx.fillStyle = textColor;
      ctx.font = '11px system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(formatValue(i * unitInfo.major, currentUnit), 28, y);

      if (i < maxMajorLeft) {
        const minorCount = unitInfo.major / unitInfo.minor;
        for (let m = 1; m < minorCount; m++) {
          const my = y + m * pxPerMinor;
          if (my > height) break;
          ctx.strokeStyle = minorColor;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(34, my);
          ctx.lineTo(40, my);
          ctx.stroke();
        }
      }
    }

    // Right ruler
    ctx.fillStyle = isDark ? '#1a1a1a' : '#f5f5f5';
    ctx.fillRect(width - 40, 0, 40, height);

    ctx.strokeStyle = axisColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(width - 40, 0);
    ctx.lineTo(width - 40, height);
    ctx.stroke();

    const maxMajorRight = Math.floor(height / pxPerMajor);
    for (let i = 0; i <= maxMajorRight; i++) {
      const y = i * pxPerMajor;
      if (y > height) break;

      ctx.strokeStyle = majorColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(width - 40, y);
      ctx.lineTo(width - 30, y);
      ctx.stroke();

      ctx.fillStyle = textColor;
      ctx.font = '11px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(formatValue(i * unitInfo.major, currentUnit), width - 28, y);

      if (i < maxMajorRight) {
        const minorCount = unitInfo.major / unitInfo.minor;
        for (let m = 1; m < minorCount; m++) {
          const my = y + m * pxPerMinor;
          if (my > height) break;
          ctx.strokeStyle = minorColor;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(width - 36, my);
          ctx.lineTo(width - 40, my);
          ctx.stroke();
        }
      }
    }

    ctx.restore();
    renderGuides();
  }

  function renderGuides() {
    if (!ctx || !canvas || !showGuides) return;

    const { width, height } = viewportSize;
    const isDark = isDarkMode;

    ctx.save();
    ctx.scale(dpr, dpr);

    guides.forEach(guide => {
      if (guide.type === 'horizontal') {
        // Horizontal guide line
        ctx.strokeStyle = isDark ? '#0af' : '#06f';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(40, guide.position);
        ctx.lineTo(width - 40, guide.position);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label
        const value = guide.position / pxPerUnit(currentUnit);
        ctx.fillStyle = isDark ? '#0af' : '#06f';
        ctx.font = 'bold 12px system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(formatValue(value, currentUnit), 44, guide.position - 2);
      } else {
        // Vertical guide line
        ctx.strokeStyle = isDark ? '#0af' : '#06f';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(guide.position, 40);
        ctx.lineTo(guide.position, height - 40);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label
        const value = guide.position / pxPerUnit(currentUnit);
        ctx.fillStyle = isDark ? '#0af' : '#06f';
        ctx.font = 'bold 12px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(formatValue(value, currentUnit), guide.position, 44);
      }
    });

    ctx.restore();
  }

  function handlePointerMove(e: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * dpr;
    const y = (e.clientY - rect.top) * dpr;

    crosshairPos.x = x / dpr;
    crosshairPos.y = y / dpr;

    if (showCrosshair) {
      updateCrosshair();
    }
  }

  function updateCrosshair() {
    const { width, height } = viewportSize;
    const x = crosshairPos.x;
    const y = crosshairPos.y;

    // Crosshair lines
    crosshairEl.style.left = `${x}px`;
    crosshairEl.style.top = `${y}px`;

    // Coordinates display
    const unitInfo = getUnitInfo(currentUnit);
    const pxPerMajor = pxPerUnit(currentUnit);
    const coordX = x / pxPerMajor;
    const coordY = y / pxPerMajor;

    coordsEl.textContent = `X: ${formatValue(coordX, currentUnit)}  Y: ${formatValue(coordY, currentUnit)}`;
    coordsEl.style.left = `${Math.min(x + 16, width - 160)}px`;
    coordsEl.style.top = `${Math.min(y - 30, height - 60)}px`;
  }

  function handleClick(e: PointerEvent) {
    if (!showGuides) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * dpr;
    const y = (e.clientY - rect.top) * dpr;

    // Don't add guide if clicking on ruler areas
    if (x < 40 || x > viewportSize.width - 40 || y < 40 || y > viewportSize.height - 40) {
      return;
    }

    const guide: GuideLine = {
      id: crypto.randomUUID(),
      type: guideToggle,
      position: guideToggle === 'horizontal' ? y / dpr : x / dpr,
    };

    guides.push(guide);
    saveSettings();
    renderGuides();
  }

  function handleKeyDown(e: KeyboardEvent) {
    // Ignore if typing in input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

    switch (e.key.toLowerCase()) {
      case 'u':
        e.preventDefault();
        cycleUnit();
        break;
      case 'd':
        e.preventDefault();
        toggleDark();
        break;
      case 'c':
        e.preventDefault();
        toggleCrosshair();
        break;
      case 'g':
        e.preventDefault();
        toggleGuides();
        break;
      case 'f':
        e.preventDefault();
        toggleFullscreen();
        break;
      case 'k':
        e.preventDefault();
        // Open calibration modal
        const calibrationEvent = new CustomEvent('open-calibration');
        window.dispatchEvent(calibrationEvent);
        break;
    }
  }

  function handleResize() {
    viewportSize.width = window.innerWidth;
    viewportSize.height = window.innerHeight;
    dpr = window.devicePixelRatio || 1;

    canvas.width = viewportSize.width * dpr;
    canvas.height = viewportSize.height * dpr;
    canvas.style.width = `${viewportSize.width}px`;
    canvas.style.height = `${viewportSize.height}px`;

    renderRulers();

    if (showCrosshair) {
      updateCrosshair();
    }
  }

  function removeGuide(id: string) {
    guides = guides.filter(g => g.id !== id);
    saveSettings();
    renderGuides();
  }

  function clearAllGuides() {
    if (guides.length === 0) return;
    guides = [];
    saveSettings();
    renderGuides();
  }

  onMount(() => {
    // Initialize DOM references
    rulerTop = document.getElementById('ruler-top')!;
    rulerBottom = document.getElementById('ruler-bottom')!;
    rulerLeft = document.getElementById('ruler-left')!;
    rulerRight = document.getElementById('ruler-right')!;
    canvas = document.getElementById('ruler-canvas') as HTMLCanvasElement;
    ctx = canvas.getContext('2d')!;
    crosshairEl = document.getElementById('crosshair')!;
    coordsEl = document.getElementById('coords')!;
    unitBtn = document.getElementById('unit-btn') as HTMLButtonElement;
    darkBtn = document.getElementById('dark-btn') as HTMLButtonElement;
    crosshairBtn = document.getElementById('crosshair-btn') as HTMLButtonElement;
    guidesBtn = document.getElementById('guides-btn') as HTMLButtonElement;
    fullscreenBtn = document.getElementById('fullscreen-btn') as HTMLButtonElement;
    guideToggleBtn = document.getElementById('guide-toggle-btn') as HTMLButtonElement;

    loadSettings();
    handleResize();

    // Listen for calibration changes
    window.addEventListener('calibration-changed', ((e: CustomEvent<CalibrationData>) => {
      calibration = e.detail;
      renderRulers();
    }) as EventListener);

    // Event listeners
    window.addEventListener('resize', handleResize);
    window.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('click', handleClick);
    window.addEventListener('keydown', handleKeyDown);

    unitBtn.addEventListener('click', cycleUnit);
    darkBtn.addEventListener('click', toggleDark);
    crosshairBtn.addEventListener('click', toggleCrosshair);
    guidesBtn.addEventListener('click', toggleGuides);
    fullscreenBtn.addEventListener('click', toggleFullscreen);
    guideToggleBtn.addEventListener('click', toggleGuideOrientation);

    // Touch support for crosshair
    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        handlePointerMove(e.touches[0] as unknown as PointerEvent);
      }
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        handlePointerMove(e.touches[0] as unknown as PointerEvent);
      }
    }, { passive: true });

    // Context menu for guide removal
    canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * dpr;
      const y = (e.clientY - rect.top) * dpr;

      // Find guide near click
      const threshold = 20 / dpr;
      const idx = guides.findIndex(g => {
        if (g.type === 'horizontal') {
          return Math.abs(g.position - y / dpr) < threshold;
        } else {
          return Math.abs(g.position - x / dpr) < threshold;
        }
      });

      if (idx !== -1) {
        removeGuide(guides[idx].id);
      }
    });

    // Initial render
    renderRulers();
  });
</script>

<div id="ruler-app" class="ruler-app">
  <canvas id="ruler-canvas" class="ruler-canvas" aria-label="Ruler canvas"></canvas>

  <div id="crosshair" class="crosshair" aria-hidden="true">
    <div class="crosshair-h"></div>
    <div class="crosshair-v"></div>
  </div>

  <div id="coords" class="coords" aria-live="polite" aria-atomic="true"></div>

  <div class="controls" role="toolbar" aria-label="Ruler controls">
    <button id="unit-btn" class="control-btn" aria-label="Cycle units (U)"></button>
    <button id="dark-btn" class="control-btn" aria-label="Toggle dark mode (D)"></button>
    <button id="crosshair-btn" class="control-btn" aria-label="Toggle crosshair (C)"></button>
    <button id="guides-btn" class="control-btn" aria-label="Toggle guide lines (G)"></button>
    <button id="guide-toggle-btn" class="control-btn" aria-label="Toggle guide orientation"></button>
    <button id="fullscreen-btn" class="control-btn" aria-label="Toggle fullscreen (F)"></button>
    <button id="clear-guides-btn" class="control-btn" aria-label="Clear all guides" onclick={clearAllGuides}>Clear Guides</button>
  </div>

  <!-- Screen reader announcer -->
  <div id="sr-announcer" aria-live="polite" aria-atomic="true" class="sr-only"></div>

  <div class="shortcuts-help" aria-hidden="true">
    <kbd>U</kbd> Unit &nbsp;
    <kbd>D</kbd> Dark &nbsp;
    <kbd>C</kbd> Crosshair &nbsp;
    <kbd>G</kbd> Guides &nbsp;
    <kbd>F</kbd> Fullscreen &nbsp;
    <kbd>K</kbd> Calibrate &nbsp;
    <kbd>Click</kbd> Add guide &nbsp;
    <kbd>Right-click</kbd> Remove guide
  </div>
</div>

<Calibration />

<style>
  .ruler-app {
    position: fixed;
    inset: 0;
    overflow: hidden;
    background: var(--bg-primary, #fff);
    color: var(--text-primary, #111);
    font-family: system-ui, -apple-system, sans-serif;
    touch-action: none;
    -webkit-user-select: none;
    user-select: none;
  }

  :global(.dark) .ruler-app {
    --bg-primary: #111;
    --text-primary: #eee;
  }

  .ruler-canvas {
    position: absolute;
    inset: 0;
    display: block;
  }

  .crosshair {
    position: absolute;
    pointer-events: none;
    display: none;
    z-index: 10;
  }

  .crosshair-h,
  .crosshair-v {
    position: absolute;
    background: var(--accent, #06f);
    opacity: 0.6;
  }

  .crosshair-h {
    width: 100vw;
    height: 1px;
    top: 50%;
    left: 0;
    transform: translateY(-50%);
  }

  .crosshair-v {
    width: 1px;
    height: 100vh;
    left: 50%;
    top: 0;
    transform: translateX(-50%);
  }

  .coords {
    position: absolute;
    pointer-events: none;
    padding: 4px 8px;
    background: var(--bg-primary, #fff);
    border: 1px solid var(--border, #ccc);
    border-radius: 4px;
    font: 12px monospace;
    white-space: nowrap;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    z-index: 11;
    display: none;
  }

  .controls {
    position: fixed;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 8px;
    padding: 8px 12px;
    background: var(--bg-primary, #fff);
    border: 1px solid var(--border, #ddd);
    border-radius: 12px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.1);
    z-index: 20;
    flex-wrap: wrap;
    justify-content: center;
  }

  .control-btn {
    padding: 8px 12px;
    border: 1px solid var(--border, #ddd);
    border-radius: 8px;
    background: var(--bg-secondary, #f5f5f5);
    color: var(--text-primary, #111);
    font: 13px system-ui, sans-serif;
    cursor: pointer;
    transition: all 0.15s ease;
    min-width: 44px;
    min-height: 44px;
  }

  .control-btn:hover {
    background: var(--bg-tertiary, #eee);
    border-color: var(--accent, #06f);
  }

  .control-btn:focus-visible {
    outline: 2px solid var(--accent, #06f);
    outline-offset: 2px;
  }

  .control-btn[aria-pressed="true"] {
    background: var(--accent, #06f);
    color: white;
    border-color: var(--accent, #06f);
  }

  .shortcuts-help {
    position: fixed;
    bottom: 72px;
    left: 50%;
    transform: translateX(-50%);
    padding: 8px 16px;
    background: var(--bg-primary, #fff);
    border: 1px solid var(--border, #ddd);
    border-radius: 8px;
    font: 11px system-ui, sans-serif;
    color: var(--text-secondary, #666);
    white-space: nowrap;
    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    z-index: 15;
  }

  .shortcuts-help kbd {
    padding: 2px 6px;
    background: var(--bg-secondary, #f0f0f0);
    border: 1px solid var(--border, #ccc);
    border-radius: 4px;
    font-family: monospace;
    font-size: 10px;
  }

  :global(.dark) .shortcuts-help kbd {
    background: #333;
    border-color: #555;
    color: #ddd;
  }

  @media (max-width: 480px) {
    .controls {
      bottom: 8px;
      padding: 6px 8px;
      gap: 4px;
    }

    .control-btn {
      padding: 6px 10px;
      font-size: 12px;
    }

    .shortcuts-help {
      bottom: 64px;
      font-size: 10px;
      padding: 6px 12px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .control-btn,
    .crosshair-h,
    .crosshair-v {
      transition: none;
    }
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>