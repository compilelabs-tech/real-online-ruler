import { useEffect, useRef, useState, useCallback } from 'react';
import CalibrationModal, { type CalibrationData } from './CalibrationModal';

const UNITS = ['cm', 'inches', 'mm'] as const;
type Unit = (typeof UNITS)[number];

interface GuideLine {
  id: string;
  type: 'horizontal' | 'vertical';
  position: number;
}

function getStored<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : fallback;
  } catch {
    return fallback;
  }
}
function setStored(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

function formatValue(value: number, unit: Unit): string {
  if (unit === 'inches') {
    const whole = Math.floor(value);
    const fraction = value - whole;
    const sixteenths = Math.round(fraction * 16);
    if (sixteenths === 0) return `${whole}"`;
    if (whole === 0) return `${sixteenths}/16"`;
    return `${whole} ${sixteenths}/16"`;
  }
  return `${value.toFixed(unit === 'mm' ? 0 : 1)}${unit}`;
}

function getUnitInfo(unit: Unit) {
  switch (unit) {
    case 'mm':
      return { major: 10, minor: 1 };
    case 'cm':
      return { major: 10, minor: 1 };
    case 'inches':
      return { major: 1, minor: 1 / 16 };
  }
}

function pxPerUnit(unit: Unit, dpi: number, dpr: number): number {
  switch (unit) {
    case 'mm':
      return (dpi / 25.4) * dpr;
    case 'cm':
      return (dpi / 2.54) * dpr;
    case 'inches':
      return dpi * dpr;
  }
}

export default function Ruler() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const crosshairRef = useRef<HTMLDivElement>(null);
  const coordsRef = useRef<HTMLDivElement>(null);

  const [unit, setUnit] = useState<Unit>(() => getStored('ruler-unit', 'cm'));
  const [dark, setDark] = useState<boolean>(() =>
    getStored('ruler-dark', typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)').matches : false)
  );
  const [crosshair, setCrosshair] = useState<boolean>(() => getStored('ruler-crosshair', false));
  const [showGuides, setShowGuides] = useState<boolean>(() => getStored('ruler-guides', true));
  const [guides, setGuides] = useState<GuideLine[]>(() => getStored('ruler-guide-lines', []));
  const [guideToggle, setGuideToggle] = useState<'horizontal' | 'vertical'>(() =>
    getStored('ruler-guide-toggle', 'horizontal')
  );
  const [calibration, setCalibration] = useState<CalibrationData>({
    method: null,
    dpi: 96,
    confidence: 0,
    deviceName: null,
    diagonal: null,
    cardAligned: false,
  });
  const [showCalibration, setShowCalibration] = useState(false);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [dpr, setDpr] = useState(1);
  const crosshairPos = useRef({ x: 0, y: 0 });

  const stateRef = useRef({ unit, dark, crosshair, showGuides, guides, guideToggle, calibration, dpr, viewport });
  stateRef.current = { unit, dark, crosshair, showGuides, guides, guideToggle, calibration, dpr, viewport };

  const announce = useCallback((msg: string) => {
    const el = document.getElementById('sr-announcer');
    if (el) el.textContent = msg;
  }, []);

  const renderRulers = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const s = stateRef.current;
    const { width, height } = s.viewport;
    const { dpr } = s;
    const info = getUnitInfo(s.unit);
    const pxMajor = pxPerUnit(s.unit, s.calibration.dpi, dpr);
    const pxMinor = pxPerUnit(s.unit, s.calibration.dpi, dpr) * info.minor;

    ctx.clearRect(0, 0, width * dpr, height * dpr);
    ctx.save();
    ctx.scale(dpr, dpr);

    const isDark = s.dark;
    const axisColor = isDark ? '#666' : '#ccc';
    const textColor = isDark ? '#ddd' : '#333';
    const majorColor = isDark ? '#888' : '#999';
    const minorColor = isDark ? '#555' : '#ddd';
    const bg = isDark ? '#1a1a1a' : '#f5f5f5';

    // --- Top ruler ---
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, 40);
    ctx.strokeStyle = axisColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 40);
    ctx.lineTo(width, 40);
    ctx.stroke();
    const maxTop = Math.floor(width / pxMajor);
    for (let i = 0; i <= maxTop; i++) {
      const x = i * pxMajor;
      if (x > width) break;
      ctx.strokeStyle = majorColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, 30);
      ctx.lineTo(x, 40);
      ctx.stroke();
      ctx.fillStyle = textColor;
      ctx.font = '11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(formatValue(i * info.major, s.unit), x, 28);
      if (i < maxTop) {
        for (let m = 1; m < info.major / info.minor; m++) {
          const mx = x + m * pxMinor;
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

    // --- Bottom ruler ---
    ctx.fillStyle = bg;
    ctx.fillRect(0, height - 40, width, 40);
    ctx.strokeStyle = axisColor;
    ctx.beginPath();
    ctx.moveTo(0, height - 40);
    ctx.lineTo(width, height - 40);
    ctx.stroke();
    const maxBottom = Math.floor(width / pxMajor);
    for (let i = 0; i <= maxBottom; i++) {
      const x = i * pxMajor;
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
      ctx.fillText(formatValue(i * info.major, s.unit), x, height - 28);
      if (i < maxBottom) {
        for (let m = 1; m < info.major / info.minor; m++) {
          const mx = x + m * pxMinor;
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

    // --- Left ruler ---
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 40, height);
    ctx.strokeStyle = axisColor;
    ctx.beginPath();
    ctx.moveTo(40, 0);
    ctx.lineTo(40, height);
    ctx.stroke();
    const maxLeft = Math.floor(height / pxMajor);
    for (let i = 0; i <= maxLeft; i++) {
      const y = i * pxMajor;
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
      ctx.fillText(formatValue(i * info.major, s.unit), 28, y);
      if (i < maxLeft) {
        for (let m = 1; m < info.major / info.minor; m++) {
          const my = y + m * pxMinor;
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

    // --- Right ruler ---
    ctx.fillStyle = bg;
    ctx.fillRect(width - 40, 0, 40, height);
    ctx.strokeStyle = axisColor;
    ctx.beginPath();
    ctx.moveTo(width - 40, 0);
    ctx.lineTo(width - 40, height);
    ctx.stroke();
    const maxRight = Math.floor(height / pxMajor);
    for (let i = 0; i <= maxRight; i++) {
      const y = i * pxMajor;
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
      ctx.fillText(formatValue(i * info.major, s.unit), width - 28, y);
      if (i < maxRight) {
        for (let m = 1; m < info.major / info.minor; m++) {
          const my = y + m * pxMinor;
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

    // Guides
    if (s.showGuides) {
      ctx.save();
      ctx.scale(dpr, dpr);
      s.guides.forEach((g) => {
        ctx.strokeStyle = isDark ? '#0af' : '#06f';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        if (g.type === 'horizontal') {
          ctx.moveTo(40, g.position);
          ctx.lineTo(width - 40, g.position);
        } else {
          ctx.moveTo(g.position, 40);
          ctx.lineTo(g.position, height - 40);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        const value = g.position / pxPerUnit(s.unit, s.calibration.dpi, dpr);
        ctx.fillStyle = isDark ? '#0af' : '#06f';
        ctx.font = 'bold 12px system-ui, sans-serif';
        if (g.type === 'horizontal') {
          ctx.textAlign = 'left';
          ctx.textBaseline = 'bottom';
          ctx.fillText(formatValue(value, s.unit), 44, g.position - 2);
        } else {
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText(formatValue(value, s.unit), g.position, 44);
        }
      });
      ctx.restore();
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const w = Math.max(1, Math.floor(canvas.clientWidth));
      const h = Math.max(1, Math.floor(canvas.clientHeight));
      const d = window.devicePixelRatio || 1;
      canvas.width = w * d;
      canvas.height = h * d;
      setViewport({ width: w, height: h });
      setDpr(d);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    const ro = new ResizeObserver(handleResize);
    ro.observe(canvas);
    return () => {
      window.removeEventListener('resize', handleResize);
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    renderRulers();
  }, [renderRulers, unit, dark, crosshair, showGuides, guides, guideToggle, calibration, viewport, dpr]);

  // Persist settings
  useEffect(() => {
    setStored('ruler-unit', unit);
    setStored('ruler-dark', dark);
    setStored('ruler-crosshair', crosshair);
    setStored('ruler-guides', showGuides);
    setStored('ruler-guide-lines', guides);
    setStored('ruler-guide-toggle', guideToggle);
  }, [unit, dark, crosshair, showGuides, guides, guideToggle]);

  // Theme
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  // Crosshair DOM element sync
  useEffect(() => {
    const x = crosshairPos.current.x;
    const y = crosshairPos.current.y;
    if (crosshairRef.current) {
      crosshairRef.current.style.display = crosshair ? 'block' : 'none';
      crosshairRef.current.style.left = `${x}px`;
      crosshairRef.current.style.top = `${y}px`;
    }
    if (coordsRef.current) {
      coordsRef.current.style.display = crosshair ? 'block' : 'none';
    }
  }, [crosshair]);

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const s = stateRef.current;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      crosshairPos.current = { x, y };
      if (s.crosshair) {
        if (crosshairRef.current) {
          crosshairRef.current.style.left = `${x}px`;
          crosshairRef.current.style.top = `${y}px`;
        }
        if (coordsRef.current) {
          const cx = x / pxPerUnit(s.unit, s.calibration.dpi, s.dpr);
          const cy = y / pxPerUnit(s.unit, s.calibration.dpi, s.dpr);
          coordsRef.current.textContent = `X: ${formatValue(cx, s.unit)}  Y: ${formatValue(cy, s.unit)}`;
          coordsRef.current.style.left = `${Math.min(x + 16, s.viewport.width - 160)}px`;
          coordsRef.current.style.top = `${Math.min(y - 30, s.viewport.height - 60)}px`;
        }
      }
    },
    []
  );

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      const s = stateRef.current;
      if (!s.showGuides) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x < 40 || x > s.viewport.width - 40 || y < 40 || y > s.viewport.height - 40) return;
      const guide: GuideLine = {
        id: crypto.randomUUID(),
        type: s.guideToggle,
        position: s.guideToggle === 'horizontal' ? y : x,
      };
      setGuides((g) => [...g, guide]);
    },
    []
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const threshold = 20;
      setGuides((prev) => {
        const idx = prev.findIndex((g) =>
          g.type === 'horizontal' ? Math.abs(g.position - y) < threshold : Math.abs(g.position - x) < threshold
        );
        if (idx === -1) return prev;
        return prev.filter((_, i) => i !== idx);
      });
    },
    []
  );

  const cycleUnit = useCallback(() => {
    setUnit((u) => {
      const idx = UNITS.indexOf(u);
      return UNITS[(idx + 1) % UNITS.length];
    });
    announce(`Unit changed to ${unit}`);
  }, [announce, unit]);

  const toggleDark = useCallback(() => {
    setDark((d) => !d);
    announce(`Dark mode ${!dark ? 'enabled' : 'disabled'}`);
  }, [announce, dark]);

  const toggleCrosshair = useCallback(() => {
    setCrosshair((c) => !c);
    announce(`Crosshair ${!crosshair ? 'enabled' : 'disabled'}`);
  }, [announce, crosshair]);

  const toggleGuides = useCallback(() => {
    setShowGuides((g) => !g);
    announce(`Guide lines ${!showGuides ? 'enabled' : 'disabled'}`);
  }, [announce, showGuides]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  const clearAllGuides = useCallback(() => {
    if (guides.length === 0) {
      announce('There are no guide lines to clear');
      return;
    }
    setGuides([]);
    announce('All guide lines cleared');
  }, [announce, guides.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
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
          setShowCalibration(true);
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cycleUnit, toggleDark, toggleCrosshair, toggleGuides, toggleFullscreen]);

  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove);
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, [handlePointerMove]);

  const handleCalibrationChange = useCallback(
    (data: CalibrationData) => {
      setCalibration(data);
      localStorage.setItem('ruler-calibration', JSON.stringify(data));
    },
    []
  );

  useEffect(() => {
    const saved = getStored<CalibrationData | null>('ruler-calibration', null);
    if (saved) setCalibration(saved);
  }, []);

  const statusText = calibration.method
    ? `${calibration.dpi} PPI · Calibrated`
    : '96 PPI · Estimated';

  return (
    <div id="ruler-app" className={'ruler-app' + (dark ? ' dark-app' : '')}>
      <canvas
        ref={canvasRef}
        className="ruler-canvas"
        aria-label="Ruler canvas"
        onClick={handleCanvasClick}
        onContextMenu={handleContextMenu}
      />

      <header className="app-header">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M5 5v14M5 7h8a3 3 0 0 1 0 6H5M13 13l5 6" />
            </svg>
          </span>
          <div>
            <strong>Real Ruler</strong>
            <span>Precision workspace</span>
          </div>
        </div>

        <div className="controls" role="toolbar" aria-label="Ruler controls">
          <button
            className="control-btn text-control unit-control"
            aria-label="Cycle units (U)"
            title="Change measurement unit"
            onClick={cycleUnit}
          >
            Unit: {unit.toUpperCase()}
          </button>
          <button
            className="control-btn icon-btn"
            aria-label="Toggle dark mode (D)"
            title="Toggle dark mode"
            aria-pressed={dark}
            onClick={toggleDark}
          >
            <svg className="theme-icon icon-sun" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
            </svg>
            <svg className="theme-icon icon-moon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.7 6.7 0 0 0 21 12.8Z" />
            </svg>
          </button>
          <button
            className="control-btn icon-btn"
            aria-label="Toggle crosshair (C)"
            title="Toggle crosshair"
            aria-pressed={crosshair}
            onClick={toggleCrosshair}
          >
            <svg className="tool-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 3v5M12 16v5M3 12h5M16 12h5" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
          <button
            className="control-btn icon-btn"
            aria-label="Toggle guide lines (G)"
            title="Toggle guide lines"
            aria-pressed={showGuides}
            onClick={toggleGuides}
          >
            <svg className="tool-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 7h16M4 17h16M7 4v16M17 4v16" />
              <path d="M9 12h6M12 9v6" />
            </svg>
          </button>
          <button
            className="control-btn text-control guide-control"
            aria-label="Toggle guide orientation"
            title="Change guide orientation"
            onClick={() => setGuideToggle((t) => (t === 'horizontal' ? 'vertical' : 'horizontal'))}
          >
            Guide: {guideToggle.charAt(0).toUpperCase() + guideToggle.slice(1)}
          </button>
          <button
            className="control-btn icon-btn"
            aria-label="Toggle fullscreen (F)"
            title="Toggle fullscreen"
            onClick={toggleFullscreen}
          >
            <svg className="fullscreen-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 3H3v5M16 3h5v5M8 21H3v-5M21 16v5h-5" />
            </svg>
          </button>
          <button className="control-btn" aria-label="Clear all guides" title="Clear all guide lines" onClick={clearAllGuides}>
            Clear Guides
          </button>
        </div>

        <button
          className="header-status"
          type="button"
          aria-label="Open screen calibration"
          title="Open screen calibration"
          onClick={() => setShowCalibration(true)}
        >
          <span className="status-dot" />
          <span>{statusText}</span>
          <span className="status-arrow" aria-hidden="true">
            ↗
          </span>
        </button>
      </header>

      <div className="canvas-label" aria-hidden="true">
        <span className="canvas-kicker">ACTUAL SIZE</span>
        <span>Place an object against any edge</span>
      </div>
      <div className="canvas-tools" aria-hidden="true">
        <span className="canvas-tool-dot" />
        <span>
          Guides {guides.length} · {calibration.dpi} PPI
        </span>
      </div>

      <div ref={crosshairRef} id="crosshair" className="crosshair" aria-hidden="true" style={{ display: 'none' }}>
        <div className="crosshair-h" />
        <div className="crosshair-v" />
      </div>
      <div ref={coordsRef} id="coords" className="coords" aria-live="polite" aria-atomic="true" style={{ display: 'none' }} />

      <div id="sr-announcer" aria-live="polite" aria-atomic="true" className="sr-only" />

      <footer className="app-footer">
        <span className="footer-brand">Real Ruler</span>
        <span className="footer-divider" aria-hidden="true" />
        <span>Measurements stay on this device</span>
        <nav aria-label="Footer links">
          <a href="/en/about">About</a>
          <a href="/en/privacy-policy">Privacy</a>
          <a href="/en/contact">Contact</a>
        </nav>
      </footer>

      <CalibrationModal
        open={showCalibration}
        onClose={() => setShowCalibration(false)}
        current={calibration}
        onChange={handleCalibrationChange}
      />
    </div>
  );
}
