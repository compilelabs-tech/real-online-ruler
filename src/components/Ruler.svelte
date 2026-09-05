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
  let canvasResizeObserver: ResizeObserver;

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
    viewportSize.width = Math.max(1, Math.floor(canvas.clientWidth));
    viewportSize.height = Math.max(1, Math.floor(canvas.clientHeight));
    dpr = window.devicePixelRatio || 1;

    canvas.width = viewportSize.width * dpr;
    canvas.height = viewportSize.height * dpr;

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
    if (guides.length === 0) {
      announceToScreenReader('There are no guide lines to clear');
      return;
    }

    guides = [];
    saveSettings();
    renderGuides();
    announceToScreenReader('All guide lines cleared');
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
    canvasResizeObserver = new ResizeObserver(handleResize);
    canvasResizeObserver.observe(canvas);
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

  <header class="app-header">
    <div class="brand-lockup">
      <span class="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="M5 5v14M5 7h8a3 3 0 0 1 0 6H5M13 13l5 6"></path></svg>
      </span>
      <div>
        <strong>Real Ruler</strong>
        <span>Precision workspace</span>
      </div>
    </div>

    <div class="controls" role="toolbar" aria-label="Ruler controls">
      <button id="unit-btn" class="control-btn text-control unit-control" aria-label="Cycle units (U)" title="Change measurement unit"></button>
      <button id="dark-btn" class="control-btn icon-btn" aria-label="Toggle dark mode (D)" title="Toggle dark mode">
        <svg class="theme-icon icon-sun" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="4"></circle>
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path>
        </svg>
        <svg class="theme-icon icon-moon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.7 6.7 0 0 0 21 12.8Z"></path>
        </svg>
      </button>
      <button id="crosshair-btn" class="control-btn icon-btn" aria-label="Toggle crosshair (C)" title="Toggle crosshair">
        <svg class="tool-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3v5M12 16v5M3 12h5M16 12h5"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      </button>
      <button id="guides-btn" class="control-btn icon-btn" aria-label="Toggle guide lines (G)" title="Toggle guide lines">
        <svg class="tool-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 7h16M4 17h16M7 4v16M17 4v16"></path>
          <path d="M9 12h6M12 9v6"></path>
        </svg>
      </button>
      <button id="guide-toggle-btn" class="control-btn text-control guide-control" aria-label="Toggle guide orientation" title="Change guide orientation"></button>
      <button id="fullscreen-btn" class="control-btn icon-btn" aria-label="Toggle fullscreen (F)" title="Toggle fullscreen">
        <svg class="fullscreen-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8 3H3v5M16 3h5v5M8 21H3v-5M21 16v5h-5"></path>
        </svg>
      </button>
      <button id="clear-guides-btn" class="control-btn" aria-label="Clear all guides" title="Clear all guide lines" onclick={clearAllGuides}>Clear Guides</button>
    </div>

    <button class="header-status" type="button" aria-label="Open screen calibration" title="Open screen calibration" onclick={() => window.dispatchEvent(new CustomEvent('open-calibration'))}>
      <span class="status-dot"></span>
      <span>{calibration.method ? `${calibration.dpi} PPI · Calibrated` : '96 PPI · Estimated'}</span>
      <span class="status-arrow" aria-hidden="true">↗</span>
    </button>
  </header>

  <div class="canvas-label" aria-hidden="true">
    <span class="canvas-kicker">ACTUAL SIZE</span>
    <span>Place an object against any edge</span>
  </div>

  <div class="canvas-tools" aria-hidden="true">
    <span class="canvas-tool-dot"></span>
    <span>Guides {guides.length}</span>
  </div>

  <div id="crosshair" class="crosshair" aria-hidden="true">
    <div class="crosshair-h"></div>
    <div class="crosshair-v"></div>
  </div>

  <div id="coords" class="coords" aria-live="polite" aria-atomic="true"></div>

  <!-- Screen reader announcer -->
  <div id="sr-announcer" aria-live="polite" aria-atomic="true" class="sr-only"></div>

  <footer class="app-footer">
    <span class="footer-brand">Real Ruler</span>
    <span class="footer-divider" aria-hidden="true"></span>
    <span>Measurements stay on this device</span>
    <nav aria-label="Footer links">
      <a href="/about">About</a>
      <a href="/privacy-policy">Privacy</a>
      <a href="/contact">Contact</a>
    </nav>
  </footer>
</div>

<Calibration />

<style>
  .ruler-app {
    position: fixed;
    inset: 0;
    overflow: hidden;
    background: #f7f8fa;
    color: #18212f;
    font-family: 'Inter', 'Segoe UI', sans-serif;
    touch-action: none;
    -webkit-user-select: none;
    user-select: none;
  }

  :global(.dark) .ruler-app {
    background: #11161d;
    color: #f4f7fb;
  }

  .app-header {
    position: fixed;
    inset: 0 0 auto;
    z-index: 15;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    min-height: 68px;
    padding: 12px 24px;
    pointer-events: none;
    background: rgba(247, 248, 250, 0.94);
    border-bottom: 1px solid rgba(211, 219, 229, 0.7);
    backdrop-filter: blur(18px);
  }

  :global(.dark) .app-header {
    background: rgba(17, 22, 29, 0.94);
    border-bottom-color: rgba(74, 87, 103, 0.7);
  }

  .brand-lockup,
  .header-status {
    display: flex;
    align-items: center;
  }

  .brand-lockup {
    gap: 10px;
  }

  .brand-lockup > div {
    display: grid;
    gap: 2px;
  }

  .header-status {
    gap: 7px;
    padding: 7px 10px;
    border: 1px solid rgba(106, 125, 151, 0.2);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.58);
    backdrop-filter: blur(12px);
    color: #68758a;
    cursor: pointer;
    font: 500 11px 'Inter', 'Segoe UI', sans-serif;
    pointer-events: auto;
    transition: background 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
  }

  .header-status:hover {
    border-color: rgba(23, 105, 232, 0.35);
    background: rgba(255, 255, 255, 0.86);
    transform: translateY(-1px);
  }

  .brand-lockup strong {
    color: #152238;
    font-size: 14px;
    letter-spacing: 0.01em;
  }

  .brand-lockup span:not(.brand-mark) {
    color: #68758a;
    font-size: 11px;
  }

  :global(.dark) .brand-lockup strong {
    color: #f4f7fb;
  }

  :global(.dark) .brand-lockup span:not(.brand-mark) {
    color: #a9b6c8;
  }
  
  :global(.dark) .header-status:hover {
    background: rgba(31, 53, 84, 0.9);
  }

  .brand-mark {
    display: grid;
    width: 32px;
    height: 32px;
    place-items: center;
    border: 1px solid rgba(38, 112, 255, 0.22);
    border-radius: 10px;
    background: #18212f;
    color: #f7f8fa;
  }

  .brand-mark svg {
    width: 18px;
    height: 18px;
    fill: none;
    stroke: currentColor;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 1.8;
  }

  :global(.dark) .brand-mark {
    background: #f0b35a;
    color: #18212f;
  }

  :global(.dark) .header-status {
    background: rgba(22, 37, 59, 0.7);
  }

  .status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #16a568;
    box-shadow: 0 0 0 3px rgba(22, 165, 104, 0.13);
  }

  .canvas-label,
  .canvas-tools {
    position: fixed;
    z-index: 5;
    pointer-events: none;
    display: grid;
    gap: 4px;
    color: #8591a2;
    font-size: 11px;
    letter-spacing: 0.02em;
  }

  .canvas-label {
    top: 92px;
    left: 58px;
  }

  .canvas-kicker {
    color: #526176;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.16em;
  }

  .canvas-tools {
    right: 58px;
    bottom: 58px;
    display: flex;
    align-items: center;
    gap: 7px;
    color: #8793a4;
  }

  .canvas-tool-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #1769e8;
  }

  :global(.dark) .canvas-label,
  :global(.dark) .canvas-tools {
    color: #7f8b9b;
  }

  :global(.dark) .canvas-kicker {
    color: #b8c1ce;
  }

  .ruler-canvas {
    position: absolute;
    inset: 68px 0 40px;
    display: block;
    width: 100%;
    height: calc(100% - 108px);
    max-width: 100%;
    max-height: 100%;
    box-sizing: border-box;
    z-index: 1;
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
    position: relative;
    top: auto;
    left: auto;
    transform: none;
    display: flex;
    gap: 3px;
    padding: 4px;
    background: rgba(255, 255, 255, 0.94);
    border: 1px solid #e0e5ec;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(24, 33, 47, 0.09);
    backdrop-filter: blur(16px);
    z-index: 20;
    pointer-events: auto;
    flex-wrap: wrap;
    justify-content: center;
    width: max-content;
    max-width: calc(100vw - 32px);
    flex: 0 1 auto;
  }

  :global(.dark) .controls {
    background: rgba(28, 35, 45, 0.94);
    border-color: #354151;
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.28);
  }

  .control-btn {
    padding: 9px 12px;
    border: 1px solid transparent;
    border-radius: 8px;
    background: transparent;
    color: #657388;
    font: 600 12px 'Inter', 'Segoe UI', sans-serif;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
    min-width: 44px;
    min-height: 44px;
  }

  .control-btn:hover {
    background: #f0f3f7;
    border-color: #dbe2ea;
    color: #18212f;
  }

  .control-btn:focus-visible {
    outline: 2px solid var(--accent, #06f);
    outline-offset: 2px;
  }

  .control-btn[aria-pressed="true"] {
    background: #18212f;
    color: white;
    border-color: #18212f;
  }

  .icon-btn {
    display: inline-grid;
    place-items: center;
  }

  .tool-icon {
    width: 18px;
    height: 18px;
    fill: none;
    stroke: currentColor;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 1.8;
  }

  .text-control {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
  }

  .unit-control::before,
  .guide-control::before {
    display: inline-block;
    color: currentColor;
    font-size: 16px;
    font-weight: 700;
    line-height: 1;
  }

  .unit-control::before {
    content: '↔';
  }

  .guide-control::before {
    content: '＋';
  }

  .theme-icon,
  .fullscreen-icon {
    width: 17px;
    height: 17px;
    fill: none;
    stroke: currentColor;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 1.8;
  }

  .icon-moon {
    display: none;
  }

  :global(.dark) .icon-sun {
    display: none;
  }

  :global(.dark) .icon-moon {
    display: block;
  }

  :global(.dark) .control-btn {
    color: #b4c1d2;
  }

  :global(.dark) .control-btn:hover {
    background: #354151;
    border-color: #4b596b;
    color: #e6efff;
  }

  .shortcuts-help {
    position: fixed;
    top: 82px;
    left: 50%;
    transform: translateX(-50%);
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.76);
    border: 1px solid rgba(106, 125, 151, 0.16);
    border-radius: 999px;
    font: 11px 'Inter', 'Segoe UI', sans-serif;
    color: #718096;
    white-space: nowrap;
    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    z-index: 15;
    opacity: 0.78;
  }

  .shortcuts-help kbd {
    padding: 2px 6px;
    background: var(--bg-secondary, #f0f0f0);
    border: 1px solid var(--border, #ccc);
    border-radius: 4px;
    font-family: monospace;
    font-size: 10px;
  }

  .app-footer {
    position: fixed;
    inset: auto 0 0;
    z-index: 15;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    min-height: 40px;
    padding: 8px 24px;
    background: rgba(247, 248, 250, 0.94);
    border-top: 1px solid rgba(211, 219, 229, 0.7);
    backdrop-filter: blur(18px);
    color: #8a95a5;
    font-size: 10px;
    letter-spacing: 0.01em;
    pointer-events: auto;
  }

  .footer-brand {
    color: #5e6c7e;
    font-weight: 700;
  }

  .footer-divider {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: #aab3bf;
  }

  .app-footer nav {
    display: flex;
    gap: 10px;
    margin-inline-start: 5px;
  }

  .app-footer a {
    color: inherit;
    text-decoration: none;
    transition: color 0.15s ease;
  }

  .app-footer a:hover,
  .app-footer a:focus-visible {
    color: #1769e8;
  }

  :global(.dark) .app-footer,
  :global(.dark) .footer-brand {
    color: #8996a8;
  }

  :global(.dark) .app-footer {
    background: rgba(17, 22, 29, 0.94);
    border-top-color: rgba(74, 87, 103, 0.7);
  }

  :global(.dark) .footer-brand {
    color: #b7c1cf;
  }

  :global(.dark) .shortcuts-help kbd {
    background: #333;
    border-color: #555;
    color: #ddd;
  }

  @media (max-width: 480px) {
    .controls {
      position: fixed;
      bottom: 48px;
      top: auto;
      left: 50%;
      transform: translateX(-50%);
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      width: calc(100% - 16px);
      max-width: none;
      padding: 6px 8px;
      gap: 4px;
      border-radius: 18px;
    }

    .control-btn {
      width: 100%;
    }

    .unit-control,
    .guide-control,
    #clear-guides-btn {
      grid-column: span 2;
    }

    .control-btn {
      padding: 6px 10px;
      font-size: 12px;
    }

    .app-header {
      padding: 8px 12px;
      gap: 8px;
    }

    .brand-lockup > div {
      display: none;
    }

    .canvas-label {
      top: 78px;
      left: 22px;
    }

    .canvas-tools {
      right: 22px;
      bottom: 92px;
    }

    .app-footer {
      min-height: 38px;
      padding: 7px 12px;
      font-size: 9px;
    }

    .app-footer nav {
      gap: 7px;
    }

    .app-footer > span:nth-child(2),
    .app-footer > span:nth-child(3) {
      display: none;
    }

    .header-status {
      padding: 6px 8px;
    }

    .header-status span:last-child {
      display: none;
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