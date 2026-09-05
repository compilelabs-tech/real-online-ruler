import { useEffect, useMemo, useState } from 'react';
import devices from '../data/devices.json';

export interface CalibrationData {
  method: 'auto' | 'device' | 'diagonal' | 'card' | 'manual' | null;
  dpi: number;
  confidence: number;
  deviceName: string | null;
  diagonal: number | null;
  cardAligned: boolean;
}

interface DeviceCfg {
  name: string;
  type: string;
  width: number;
  height: number;
  diagonal: number;
  dpi: number;
}

type MethodKey = 'auto' | 'device' | 'diagonal' | 'card' | 'manual';

interface Props {
  open: boolean;
  onClose: () => void;
  current: CalibrationData;
  onChange: (data: CalibrationData) => void;
}

const METHODS: { key: MethodKey; label: string; desc: string }[] = [
  { key: 'auto', label: 'Auto-detect', desc: 'Detect device automatically' },
  { key: 'device', label: 'Device database', desc: 'Pick from 100+ devices' },
  { key: 'diagonal', label: 'Screen diagonal', desc: 'Enter your screen size' },
  { key: 'card', label: 'Credit card', desc: 'Align a card to the outline' },
  { key: 'manual', label: 'Manual DPI', desc: 'Enter PPI directly' },
];

export default function CalibrationModal({ open, onClose, current, onChange }: Props) {
  const [active, setActive] = useState<MethodKey>(current.method ?? 'auto');
  const [deviceQuery, setDeviceQuery] = useState('');
  const [deviceType, setDeviceType] = useState<'all' | DeviceCfg['type']>('all');
  const [diagonalInput, setDiagonalInput] = useState<string>(String(current.diagonal ?? 15.6));
  const [cardTargetDpi, setCardTargetDpi] = useState<number>(96);
  const [manualDpi, setManualDpi] = useState<string>(String(current.dpi));

  // Focus management + Esc
  useEffect(() => {
    if (!open) return;
    const close = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', close);
    const btn = document.querySelector<HTMLElement>('.cal-close');
    btn?.focus();
    return () => window.removeEventListener('keydown', close);
  }, [open, onClose]);

  if (!open) return null;

  const allDevices = (devices.devices as DeviceCfg[]) ?? [];

  const filtered = useMemo(() => {
    let list = allDevices;
    if (deviceType !== 'all') list = list.filter((d) => d.type === deviceType);
    if (deviceQuery) {
      const q = deviceQuery.toLowerCase();
      list = list.filter((d) => d.name.toLowerCase().includes(q));
    }
    return list.slice(0, 60);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceQuery, deviceType, current]);

  // Auto-detect on first open of auto tab
  useEffect(() => {
    if (open && active === 'auto' && current.method !== 'auto') {
      const dpr = window.devicePixelRatio || 1;
      const width = window.screen.width * dpr;
      const height = window.screen.height * dpr;
      // Try to find a matching device by resolution
      const match = allDevices.find(
        (d) => Math.abs(d.width - width) < 40 && Math.abs(d.height - height) < 40
      );
      if (match) {
        onChange({ method: 'auto', dpi: match.dpi, confidence: 92, deviceName: match.name, diagonal: match.diagonal, cardAligned: false });
      } else {
        const est = Math.round(dpr * 96);
        onChange({ method: 'auto', dpi: est, confidence: 60, deviceName: null, diagonal: null, cardAligned: false });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, active]);

  const setCal = (partial: Partial<CalibrationData>) => {
    onChange({ ...current, ...partial });
  };

  const applyDevice = (d: DeviceCfg) => {
    setCal({ method: 'device', dpi: d.dpi, confidence: 95, deviceName: d.name, diagonal: d.diagonal, cardAligned: false });
  };

  const applyDiagonal = () => {
    const diag = parseFloat(diagonalInput);
    if (!diag || diag < 4 || diag > 50) return;
    const width = window.screen.width * (window.devicePixelRatio || 1);
    const height = window.screen.height * (window.devicePixelRatio || 1);
    const dpi = Math.round(Math.sqrt(width * width + height * height) / diag);
    setCal({ method: 'diagonal', dpi, confidence: 85, deviceName: null, diagonal: diag, cardAligned: false });
  };

  const applyManual = () => {
    const dpi = parseInt(manualDpi, 10);
    if (!dpi || dpi < 50 || dpi > 500) return;
    setCal({ method: 'manual', dpi, confidence: 90, deviceName: null, diagonal: null, cardAligned: false });
  };

  // Credit card: ISO ID-1 width = 85.60mm. With zoom, px = dpi/25.4 * 85.6
  const cardWidthPx = (cardTargetDpi / 25.4) * 85.6;

  return (
    <div className="cal-overlay" role="dialog" aria-modal="true" aria-label="Screen calibration">
      <div className="cal-modal">
        <header className="cal-header">
          <div>
            <h2 id="cal-title">Screen calibration</h2>
            <p className="cal-sub">Choose a method to make the ruler match real physical size</p>
          </div>
          <button className="cal-close" onClick={onClose} aria-label="Close calibration">
            ✕
          </button>
        </header>

        {/* Method tabs */}
        <div className="cal-tabs" role="tablist" aria-label="Calibration methods">
          {METHODS.map((m) => (
            <button
              key={m.key}
              role="tab"
              aria-selected={active === m.key}
              className={'cal-tab' + (active === m.key ? ' active' : '')}
              onClick={() => setActive(m.key)}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="cal-body">
          {/* AUTO */}
          {active === 'auto' && (
            <div className="cal-panel">
              <p className="cal-desc">We detected your device. Review and apply:</p>
              {current.deviceName ? (
                <div className="cal-device-hit">
                  <strong>{current.deviceName}</strong>
                  <span>
                    {current.dpi} PPI · {Math.round(current.confidence)}% confidence
                  </span>
                </div>
              ) : (
                <div className="cal-device-hit">
                  <strong>Estimated device</strong>
                  <span>{current.dpi} PPI · {Math.round(current.confidence)}% confidence — no exact match</span>
                </div>
              )}
              <button className="cal-apply" onClick={() => setCal({ ...current })}>
                Apply auto-detection
              </button>
            </div>
          )}

          {/* DEVICE */}
          {active === 'device' && (
            <div className="cal-panel">
              <input
                className="cal-input"
                placeholder="Search devices… e.g. iPhone"
                value={deviceQuery}
                onChange={(e) => setDeviceQuery(e.target.value)}
                aria-label="Search devices"
              />
              <div className="cal-type-filter">
                {(['all', 'phone', 'tablet', 'laptop', 'monitor'] as const).map((t) => (
                  <button
                    key={t}
                    className={'cal-type' + (deviceType === t ? ' active' : '')}
                    onClick={() => setDeviceType(t)}
                  >
                    {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
              <ul className="cal-device-list">
                {filtered.map((d, i) => (
                  <li key={d.name + i}>
                    <button onClick={() => applyDevice(d)}>
                      <span className="cal-device-name">{d.name}</span>
                      <span className="cal-device-meta">
                        {d.dpi} PPI · {d.diagonal}"
                      </span>
                    </button>
                  </li>
                ))}
                {filtered.length === 0 && <li className="cal-empty">No matching device</li>}
              </ul>
            </div>
          )}

          {/* DIAGONAL */}
          {active === 'diagonal' && (
            <div className="cal-panel">
              <p className="cal-desc">Enter your screen diagonal in inches (e.g. 15.6)</p>
              <div className="cal-row">
                <input
                  className="cal-input"
                  type="number"
                  min="4"
                  max="60"
                  step="0.1"
                  value={diagonalInput}
                  onChange={(e) => setDiagonalInput(e.target.value)}
                  aria-label="Screen diagonal in inches"
                />
                <span className="cal-unit">inches</span>
              </div>
              <button className="cal-apply" onClick={applyDiagonal}>
                Apply diagonal
              </button>
              <p className="cal-hint">
                DPI is computed from your screen resolution and the diagonal you enter.
              </p>
            </div>
          )}

          {/* CARD */}
          {active === 'card' && (
            <div className="cal-panel">
              <p className="cal-desc">
                Place a credit card (85.60 × 53.98 mm) widthwise on the line below, then save when it fits edge-to-edge.
              </p>
              <div
                className="cal-card"
                style={{ width: `${Math.min(cardWidthPx, 400)}px`, height: `${(53.98 / 85.6) * Math.min(cardWidthPx, 400)}px` }}
              />
              <div className="cal-row">
                <label htmlFor="card-dpi" className="cal-label">
                  Card width (px)
                </label>
                <input
                  id="card-dpi"
                  className="cal-input"
                  type="number"
                  value={cardTargetDpi}
                  onChange={(e) => setCardTargetDpi(parseInt(e.target.value, 10) || 96)}
                  min="50"
                  max="500"
                />
                <span className="cal-unit">PPI</span>
              </div>
              <button className="cal-apply" onClick={() => setCal({ method: 'card', dpi: cardTargetDpi, confidence: 88, deviceName: null, diagonal: null, cardAligned: true })}>
                Save card calibration
              </button>
              <p className="cal-hint">
                Adjust PPI until the outline matches your physical card, then save.
              </p>
            </div>
          )}

          {/* MANUAL */}
          {active === 'manual' && (
            <div className="cal-panel">
              <p className="cal-desc">Enter your screen PPI directly</p>
              <div className="cal-row">
                <input
                  className="cal-input"
                  type="number"
                  min="50"
                  max="500"
                  value={manualDpi}
                  onChange={(e) => setManualDpi(e.target.value)}
                  aria-label="Manual DPI value"
                />
                <span className="cal-unit">PPI</span>
              </div>
              <button className="cal-apply" onClick={applyManual}>
                Apply manual DPI
              </button>
              <p className="cal-hint">
                Typical: 96 (desktop at 100%), 264 (iPad), 326 (iPhone), 460 (iPhone Pro).
              </p>
            </div>
          )}
        </div>

        <footer className="cal-footer">
          <span className="cal-status">
            Current: <strong>{current.dpi} PPI</strong>
            {current.method ? ` · ${current.deviceName ?? METHOD_LABEL[current.method]}` : ' · estimated'}
          </span>
          <button className="cal-done" onClick={onClose}>
            Done
          </button>
        </footer>
      </div>

      <style>{`
        .cal-overlay { position: fixed; inset: 0; z-index: 200; display: flex; align-items: center; justify-content: center; background: rgba(9,13,20,.55); backdrop-filter: blur(4px); padding: 20px; }
        .cal-modal { width: min(520px, 100%); max-height: 88vh; overflow: auto; background: var(--card,#fff); color: var(--foreground,#11161d); border-radius: 16px; box-shadow: 0 24px 60px rgba(0,0,0,.25); font-family: 'Inter','Segoe UI',sans-serif; }
        .dark .cal-modal, .dark-app .cal-modal { --card: #161c26; --foreground: #f2f6fb; }
        .cal-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 20px 22px 14px; border-bottom: 1px solid var(--border, rgba(211,219,229,.6)); }
        .cal-header h2 { margin: 0; font-size: 18px; }
        .cal-sub { margin: 4px 0 0; font-size: 13px; color: var(--muted-foreground,#5b6776); }
        .cal-close { background: none; border: none; font-size: 18px; cursor: pointer; color: inherit; padding: 4px 8px; border-radius: 8px; }
        .cal-close:hover { background: rgba(120,130,150,.15); }
        .cal-tabs { display: flex; flex-wrap: wrap; gap: 6px; padding: 14px 22px 0; }
        .cal-tab { border: 1px solid var(--border,rgba(211,219,229,.6)); background: none; color: inherit; padding: 7px 12px; border-radius: 999px; font-size: 12.5px; cursor: pointer; }
        .cal-tab.active { background: var(--accent,#0066ff); border-color: var(--accent,#0066ff); color: #fff; }
        .cal-body { padding: 16px 22px; }
        .cal-desc { font-size: 13.5px; margin: 0 0 12px; color: var(--muted-foreground,#5b6776); }
        .cal-input { width: 100%; padding: 10px 12px; border: 1px solid var(--border,rgba(211,219,229,.7)); border-radius: 10px; background: var(--card,#fff); color: inherit; font-size: 14px; margin-bottom: 10px; }
        .cal-type-filter { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
        .cal-type { border: none; background: rgba(120,130,150,.12); padding: 5px 10px; border-radius: 8px; font-size: 12px; cursor: pointer; color: inherit; }
        .cal-type.active { background: var(--accent,#0066ff); color: #fff; }
        .cal-device-list { list-style: none; margin: 0; padding: 0; max-height: 280px; overflow: auto; border: 1px solid var(--border,rgba(211,219,229,.6)); border-radius: 10px; }
        .cal-device-list li { border-bottom: 1px solid var(--border,rgba(211,219,229,.5)); }
        .cal-device-list li:last-child { border-bottom: none; }
        .cal-device-list button { width: 100%; text-align: left; background: none; border: none; padding: 10px 12px; cursor: pointer; color: inherit; display: flex; justify-content: space-between; gap: 8px; }
        .cal-device-list button:hover { background: rgba(120,130,150,.1); }
        .cal-device-name { font-size: 13.5px; font-weight: 600; }
        .cal-device-meta { font-size: 12px; color: var(--muted-foreground,#5b6776); }
        .cal-device-hit { display: flex; flex-direction: column; gap: 4px; padding: 14px; background: rgba(0,102,255,.08); border: 1px solid rgba(0,102,255,.3); border-radius: 10px; margin-bottom: 12px; }
        .cal-row { display: flex; align-items: center; gap: 8px; }
        .cal-row .cal-input { flex: 1; margin-bottom: 0; }
        .cal-unit { font-size: 13px; color: var(--muted-foreground,#5b6776); }
        .cal-label { font-size: 13px; color: var(--muted-foreground,#5b6776); white-space: nowrap; }
        .cal-card { margin: 8px 0 14px; border: 2px solid var(--accent,#0066ff); border-radius: 8px; display: block; background: rgba(0,102,255,.06); }
        .cal-apply { margin-top: 12px; width: 100%; padding: 11px; border: none; border-radius: 10px; background: var(--accent,#0066ff); color: #fff; font-size: 14px; font-weight: 600; cursor: pointer; }
        .cal-apply:hover { filter: brightness(1.05); }
        .cal-hint { font-size: 12px; color: var(--muted-foreground,#5b6776); margin: 10px 0 0; }
        .cal-empty { padding: 16px; text-align: center; color: var(--muted-foreground,#5b6776); font-size: 13px; }
        .cal-footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 22px 18px; border-top: 1px solid var(--border,rgba(211,219,229,.6)); }
        .cal-status { font-size: 12.5px; color: var(--muted-foreground,#5b6776); }
        .cal-status strong { color: var(--foreground,#11161d); }
        .cal-done { border: none; padding: 10px 22px; border-radius: 10px; background: var(--foreground,#11161d); color: var(--card,#fff); font-size: 14px; font-weight: 600; cursor: pointer; }
        .dark .cal-done { background: #f2f6fb; color: #11161d; }
      `}</style>
    </div>
  );
}

const METHOD_LABEL: Record<string, string> = {
  auto: 'auto-detected',
  device: 'from device database',
  diagonal: 'screen diagonal',
  card: 'credit card',
  manual: 'manual DPI',
};
