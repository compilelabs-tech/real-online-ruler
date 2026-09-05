<script lang="ts">
  import { onMount } from 'svelte';

  // Types
  interface Device {
    name: string;
    type: 'phone' | 'tablet' | 'laptop' | 'monitor';
    width: number;
    height: number;
    diagonal: number;
    dpi: number;
  }

  interface DevicesData {
    devices: Device[];
  }

  interface CalibrationState {
    method: 'auto' | 'device' | 'diagonal' | 'card' | 'manual' | null;
    dpi: number;
    confidence: number;
    deviceName: string | null;
    diagonal: number | null;
    cardAligned: boolean;
  }

  // Load devices data
  let devicesData: DevicesData = { devices: [] };
  let calibration: CalibrationState = {
    method: null,
    dpi: 96,
    confidence: 0,
    deviceName: null,
    diagonal: null,
    cardAligned: false
  };

  let showCalibrationModal = false;
  let searchQuery = '';
  let selectedType = 'all';
  let filteredDevices: Device[] = [];
  let diagonalInput = '';
  let manualDpiInput = '';
  let cardDragOffset = { x: 0, y: 0 };
  let isCardDragging = false;
  let autoDetectedDevice: Device | null = null;
  let autoConfidence = 0;

  // Constants
  const CARD_WIDTH_MM = 85.60;
  const CARD_HEIGHT_MM = 53.98;
  const MIN_DPI = 50;
  const MAX_DPI = 500;

  // Load devices on mount
  onMount(async () => {
    try {
      const response = await fetch('/devices.json');
      devicesData = await response.json();
      filteredDevices = devicesData.devices;
      
      // Auto-detect device
      await autoDetect();
      
      // Load saved calibration
      loadCalibration();
    } catch (e) {
      console.error('Failed to load devices:', e);
    }
  });

  // Auto-detect device based on screen resolution and DPI
  async function autoDetect() {
    const screenWidth = window.screen.width * window.devicePixelRatio;
    const screenHeight = window.screen.height * window.devicePixelRatio;
    const currentDpi = window.devicePixelRatio * 96;

    let bestMatch: Device | null = null;
    let bestScore = 0;

    for (const device of devicesData.devices) {
      const widthDiff = Math.abs(device.width - screenWidth) / screenWidth;
      const heightDiff = Math.abs(device.height - screenHeight) / screenHeight;
      const dpiDiff = Math.abs(device.dpi - currentDpi) / currentDpi;
      
      const score = 1 - (widthDiff + heightDiff + dpiDiff) / 3;
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = device;
      }
    }

    if (bestMatch && bestScore > 0.7) {
      autoDetectedDevice = bestMatch;
      autoConfidence = Math.round(bestScore * 100);
    }
  }

  // Apply auto-detected calibration
  function applyAutoCalibration() {
    if (autoDetectedDevice) {
      calibration = {
        method: 'auto',
        dpi: autoDetectedDevice.dpi,
        confidence: autoConfidence,
        deviceName: autoDetectedDevice.name,
        diagonal: autoDetectedDevice.diagonal,
        cardAligned: false
      };
      saveCalibration();
      showCalibrationModal = false;
    }
  }

  // Filter devices
  function filterDevices() {
    filteredDevices = devicesData.devices.filter(device => {
      const matchesSearch = device.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === 'all' || device.type === selectedType;
      return matchesSearch && matchesType;
    });
  }

  // Select device calibration
  function selectDevice(device: Device) {
    calibration = {
      method: 'device',
      dpi: device.dpi,
      confidence: 95,
      deviceName: device.name,
      diagonal: device.diagonal,
      cardAligned: false
    };
    saveCalibration();
    showCalibrationModal = false;
  }

  // Apply diagonal calibration
  function applyDiagonalCalibration() {
    const diagonal = parseFloat(diagonalInput);
    if (!diagonal || diagonal < 1 || diagonal > 100) return;

    const screenWidth = window.screen.width * window.devicePixelRatio;
    const screenHeight = window.screen.height * window.devicePixelRatio;
    const pixelDiagonal = Math.sqrt(screenWidth ** 2 + screenHeight ** 2);
    const dpi = pixelDiagonal / diagonal;

    if (dpi < MIN_DPI || dpi > MAX_DPI) return;

    calibration = {
      method: 'diagonal',
      dpi: Math.round(dpi),
      confidence: 80,
      deviceName: `${diagonal}" custom`,
      diagonal,
      cardAligned: false
    };
    saveCalibration();
    showCalibrationModal = false;
  }

  // Credit card calibration
  function startCardCalibration() {
    calibration.method = 'card';
    calibration.cardAligned = false;
  }

  function handleCardDrag(event: MouseEvent | TouchEvent) {
    if (!isCardDragging) return;
    
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    
    cardDragOffset.x = clientX - window.innerWidth / 2;
    cardDragOffset.y = clientY - window.innerHeight / 2;
  }

  function finishCardCalibration() {
    // Calculate DPI from card alignment
    // Card is 85.60mm wide, measure how many pixels it spans
    const cardElement = document.querySelector('.card-overlay') as HTMLElement;
    if (!cardElement) return;

    const cardWidthPx = cardElement.getBoundingClientRect().width;
    const dpi = (cardWidthPx / CARD_WIDTH_MM) * 25.4; // mm to inches
    
    if (dpi >= MIN_DPI && dpi <= MAX_DPI) {
      calibration = {
        method: 'card',
        dpi: Math.round(dpi),
        confidence: 85,
        deviceName: 'Credit card',
        diagonal: null,
        cardAligned: true
      };
      saveCalibration();
    }
    calibration.cardAligned = false;
  }

  // Manual DPI
  function applyManualDpi() {
    const dpi = parseInt(manualDpiInput);
    if (!dpi || dpi < MIN_DPI || dpi > MAX_DPI) return;

    calibration = {
      method: 'manual',
      dpi,
      confidence: 70,
      deviceName: `Manual ${dpi} DPI`,
      diagonal: null,
      cardAligned: false
    };
    saveCalibration();
    showCalibrationModal = false;
  }

  // Save/load calibration
  function saveCalibration() {
    localStorage.setItem('ruler-calibration', JSON.stringify(calibration));
    // Notify parent ruler component
    window.dispatchEvent(new CustomEvent('calibration-changed', { detail: calibration }));
  }

  function loadCalibration() {
    const saved = localStorage.getItem('ruler-calibration');
    if (saved) {
      try {
        calibration = JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse calibration:', e);
      }
    }
  }

  function closeCalibration() {
    showCalibrationModal = false;
    isCardDragging = false;
    document.querySelector<HTMLElement>('.calibration-trigger')?.focus();
  }

  function openCalibration() {
    showCalibrationModal = true;
    setTimeout(() => {
      document.querySelector<HTMLElement>('.calibration-modal button, .calibration-modal input, .calibration-modal select')?.focus();
    }, 0);
  }

  // Keyboard handling
  function handleKeydown(event: KeyboardEvent) {
    if (!showCalibrationModal) return;
    
    if (event.key === 'Escape') {
      closeCalibration();
      return;
    }
    
    handleTabKey(event);
  }

  // Listen for open-calibration event
  onMount(() => {
    window.addEventListener('open-calibration', openCalibration);
    
    window.addEventListener('keydown', handleKeydown);
    
    return () => {
      window.removeEventListener('open-calibration', openCalibration);
      window.removeEventListener('keydown', handleKeydown);
    };
  });

  // Handle focus trap in modal
  function handleTabKey(event: KeyboardEvent) {
    if (!showCalibrationModal) return;
    
    if (event.key === 'Tab') {
      const focusableElements = Array.from(
        document.querySelectorAll('.calibration-modal button:not([disabled]), .calibration-modal input:not([disabled]), .calibration-modal select:not([disabled]), .calibration-modal [tabindex]:not([tabindex="-1"])')
      ) as HTMLElement[];
      
      if (focusableElements.length === 0) return;
      
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }

  // Get calibration label
  function getCalibrationLabel() {
    if (!calibration.method) return 'Uncalibrated';
    
    const labels: Record<string, string> = {
      auto: `Auto: ${calibration.deviceName} (${calibration.confidence}%)`,
      device: `${calibration.deviceName} (${calibration.confidence}%)`,
      diagonal: `${calibration.diagonal}" diagonal (${calibration.confidence}%)`,
      card: 'Credit card (85%)',
      manual: `${calibration.dpi} DPI manual (70%)`
    };
    return labels[calibration.method] || 'Calibrated';
  }

  // Get accuracy estimate
  function getAccuracyEstimate() {
    if (!calibration.method) return 'Unknown';
    
    if (calibration.confidence >= 90) return 'High';
    if (calibration.confidence >= 75) return 'Good';
    if (calibration.confidence >= 60) return 'Fair';
    return 'Low';
  }
</script>

<div class="calibration-modal-overlay" class:show={showCalibrationModal} role="dialog" aria-modal="true" aria-labelledby="calibration-title" id="calibration-modal" onclick={(event) => event.target === event.currentTarget && closeCalibration()}>
  <div class="calibration-modal">
    <header>
      <h2 id="calibration-title">Calibrate Ruler</h2>
      <button class="close-btn" type="button" onclick={closeCalibration} aria-label="Close calibration dialog" title="Close">×</button>
    </header>

    <!-- Current calibration status -->
    <div class="current-calibration">
      <span class="label">Current:</span>
      <span class="value">{getCalibrationLabel()}</span>
      <span class="accuracy" class:high={getAccuracyEstimate() === 'High'} class:good={getAccuracyEstimate() === 'Good'} class:fair={getAccuracyEstimate() === 'Fair'} class:low={getAccuracyEstimate() === 'Low'}>
        Accuracy: {getAccuracyEstimate()}
      </span>
    </div>

    <nav class="calibration-tabs" role="tablist">
      <button role="tab" class:active={!calibration.method || calibration.method === 'auto'} onclick={() => { calibration.method = 'auto'; }}>Auto-Detect</button>
      <button role="tab" class:active={calibration.method === 'device'} onclick={() => { calibration.method = 'device'; }}>Device Database</button>
      <button role="tab" class:active={calibration.method === 'diagonal'} onclick={() => { calibration.method = 'diagonal'; }}>Screen Diagonal</button>
      <button role="tab" class:active={calibration.method === 'card'} onclick={startCardCalibration}>Credit Card</button>
      <button role="tab" class:active={calibration.method === 'manual'} onclick={() => { calibration.method = 'manual'; }}>Manual DPI</button>
    </nav>

    <!-- Auto-Detect Tab -->
    <div class="tab-content" class:active={!calibration.method || calibration.method === 'auto'}>
      {#if autoDetectedDevice}
        <div class="auto-detect-result">
          <div class="device-info">
            <strong>{autoDetectedDevice.name}</strong>
            <span>{autoDetectedDevice.width} × {autoDetectedDevice.height} px · {autoDetectedDevice.dpi} DPI · {autoDetectedDevice.diagonal}"</span>
          </div>
          <div class="confidence-bar">
            <div class="confidence-fill" style="width: {autoConfidence}%"></div>
          </div>
          <span class="confidence-text">Confidence: {autoConfidence}%</span>
          <button class="btn primary" onclick={applyAutoCalibration} disabled={!autoDetectedDevice}>Apply Auto-Detection</button>
        </div>
      {:else}
        <p class="no-detection">Could not auto-detect your device. Try another method.</p>
      {/if}
    </div>

    <!-- Device Database Tab -->
    <div class="tab-content" class:active={calibration.method === 'device'}>
      <div class="device-search">
        <input 
          type="text" 
          bind:value={searchQuery} 
          placeholder="Search devices..." 
          oninput={filterDevices}
          aria-label="Search devices"
        />
        <select bind:value={selectedType} onchange={filterDevices} aria-label="Filter by type">
          <option value="all">All Types</option>
          <option value="phone">Phone</option>
          <option value="tablet">Tablet</option>
          <option value="laptop">Laptop</option>
          <option value="monitor">Monitor</option>
        </select>
      </div>
      <div class="device-list">
        {#each filteredDevices as device}
          <button class="device-item" onclick={() => selectDevice(device)}>
            <span class="device-name">{device.name}</span>
            <span class="device-specs">{device.width}×{device.height} · {device.dpi} DPI · {device.diagonal}"</span>
            <span class="device-type">{device.type}</span>
          </button>
        {/each}
      </div>
    </div>

    <!-- Screen Diagonal Tab -->
    <div class="tab-content" class:active={calibration.method === 'diagonal'}>
      <p class="instruction">Enter your screen's diagonal size in inches (measure physically).</p>
      <div class="input-group">
        <label for="diagonal">Diagonal (inches):</label>
        <input 
          id="diagonal"
          type="number" 
          step="0.1" 
          min="1" 
          max="100" 
          bind:value={diagonalInput} 
          placeholder="e.g., 13.3"
        />
        <span class="unit">inches</span>
      </div>
      <button class="btn primary" onclick={applyDiagonalCalibration} disabled={!diagonalInput}>Apply</button>
    </div>

    <!-- Credit Card Tab -->
    <div class="tab-content" class:active={calibration.method === 'card'}>
      <p class="instruction">Place a standard credit card (ID-1 format: 85.60 × 53.98 mm) on your screen and align the outline below.</p>
      
      <div class="card-calibration-area" onmousedown={() => isCardDragging = true} ontouchstart={() => isCardDragging = true}>
        <div class="card-overlay" style="transform: translate({cardDragOffset.x}px, {cardDragOffset.y}px);">
          <div class="card-outline"></div>
          <div class="card-label">Place card here</div>
        </div>
        <div class="card-instructions">
          <kbd>Drag</kbd> to position · <kbd>Scroll/Pinch</kbd> to resize · Click <button class="btn secondary" onclick={finishCardCalibration}>Done</button>
        </div>
      </div>
    </div>

    <!-- Manual DPI Tab -->
    <div class="tab-content" class:active={calibration.method === 'manual'}>
      <p class="instruction">Enter your screen's DPI directly (50-500).</p>
      <div class="input-group">
        <label for="manual-dpi">DPI:</label>
        <input 
          id="manual-dpi"
          type="number" 
          step="1" 
          min={MIN_DPI} 
          max={MAX_DPI} 
          bind:value={manualDpiInput} 
          placeholder="e.g., 96"
        />
        <span class="unit">DPI</span>
      </div>
      <button class="btn primary" onclick={applyManualDpi} disabled={!manualDpiInput}>Apply</button>
    </div>
  </div>
</div>

<!-- Calibration trigger button -->
<button 
  class="calibration-trigger" 
  type="button"
  onclick={openCalibration}
  aria-label="Open calibration settings"
  aria-expanded={showCalibrationModal}
  aria-controls="calibration-modal"
  title="Calibrate ruler (K)"
>
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 6v6l4 2"/>
  </svg>
  <span class="calibration-badge" class:active={calibration.method}>!</span>
</button>

<style>
  .calibration-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(11, 24, 43, 0.56);
    backdrop-filter: blur(8px);
    display: none;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
    animation: fadeIn 0.2s ease;
  }
  .calibration-modal-overlay.show {
    display: flex;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .calibration-modal {
    background: #fbfdff;
    border: 1px solid rgba(125, 148, 180, 0.2);
    border-radius: 20px;
    width: 100%;
    max-width: 560px;
    max-height: 85vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 28px 80px rgba(11, 32, 63, 0.24);
    animation: slideUp 0.3s ease;
  }

  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  .calibration-modal header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid #e4ebf5;
  }

  .calibration-modal h2 {
    margin: 0;
    color: #152238;
    font-size: 1.2rem;
    letter-spacing: -0.02em;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #718096;
    width: 32px;
    height: 32px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .close-btn:hover {
    background: #edf3fc;
  }

  .current-calibration {
    padding: 1rem 1.5rem;
    background: #f3f7fc;
    border-bottom: 1px solid #e4ebf5;
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: center;
    font-size: 0.875rem;
  }
  .current-calibration .label {
    color: var(--text-muted, #666);
    font-weight: 500;
  }
  .current-calibration .value {
    font-weight: 600;
    color: var(--text, #333);
  }
  .current-calibration .accuracy {
    padding: 0.25rem 0.5rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
  }
  .current-calibration .accuracy.high { background: #dcfce7; color: #166534; }
  .current-calibration .accuracy.good { background: #dbeafe; color: #1e40af; }
  .current-calibration .accuracy.fair { background: #fef9c3; color: #854d0e; }
  .current-calibration .accuracy.low { background: #fee2e2; color: #991b1b; }

  .calibration-tabs {
    display: flex;
    overflow-x: auto;
    padding: 0 1rem;
    border-bottom: 1px solid #e4ebf5;
    gap: 0.25rem;
  }
  .calibration-tabs button {
    padding: 0.75rem 1rem;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--text-muted, #666);
    white-space: nowrap;
    transition: all 0.2s;
  }
  .calibration-tabs button:hover {
    color: var(--text, #333);
  }
  .calibration-tabs button.active {
    color: #1769e8;
    border-bottom-color: #1769e8;
  }

  .tab-content {
    display: none;
    padding: 1.5rem;
    overflow-y: auto;
    flex: 1;
  }
  .tab-content.active {
    display: block;
    animation: fadeIn 0.2s ease;
  }

  .auto-detect-result {
    text-align: center;
  }
  .device-info {
    padding: 1rem;
    background: var(--bg-tertiary, #f5f5f5);
    border-radius: 8px;
    margin-bottom: 1rem;
  }
  .device-info strong {
    display: block;
    font-size: 1.125rem;
    margin-bottom: 0.25rem;
  }
  .device-info span {
    color: var(--text-muted, #666);
    font-size: 0.875rem;
  }
  .confidence-bar {
    height: 8px;
    background: var(--bg-tertiary, #e0e0e0);
    border-radius: 4px;
    overflow: hidden;
    margin: 1rem 0;
  }
  .confidence-fill {
    height: 100%;
    background: var(--accent, #3b82f6);
    border-radius: 4px;
    transition: width 0.3s ease;
  }
  .confidence-text {
    color: var(--text-muted, #666);
    font-size: 0.875rem;
  }

  .no-detection {
    text-align: center;
    color: var(--text-muted, #666);
    padding: 2rem;
  }

  .device-search {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }
  .device-search input {
    flex: 1;
    padding: 0.625rem 0.875rem;
    border: 1px solid var(--border, #e0e0e0);
    border-radius: 8px;
    font-size: 0.875rem;
  }
  .device-search select {
    padding: 0.625rem 0.875rem;
    border: 1px solid var(--border, #e0e0e0);
    border-radius: 8px;
    font-size: 0.875rem;
    background: var(--bg, #fff);
  }

  .device-list {
    max-height: 400px;
    overflow-y: auto;
  }
  .device-item {
    width: 100%;
    text-align: left;
    padding: 0.875rem 1rem;
    background: none;
    border: none;
    border-bottom: 1px solid var(--border, #e0e0e0);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    transition: background 0.15s;
  }
  .device-item:last-child {
    border-bottom: none;
  }
  .device-item:hover {
    background: var(--bg-tertiary, #f5f5f5);
  }
  .device-name {
    font-weight: 500;
    color: var(--text, #333);
  }
  .device-specs {
    font-size: 0.75rem;
    color: var(--text-muted, #666);
  }
  .device-type {
    font-size: 0.625rem;
    text-transform: uppercase;
    color: var(--accent, #3b82f6);
    font-weight: 600;
  }

  .instruction {
    color: var(--text-muted, #666);
    margin-bottom: 1rem;
    font-size: 0.875rem;
  }

  .input-group {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }
  .input-group label {
    min-width: 80px;
    font-weight: 500;
    font-size: 0.875rem;
  }
  .input-group input {
    flex: 1;
    padding: 0.625rem 0.875rem;
    border: 1px solid var(--border, #e0e0e0);
    border-radius: 8px;
    font-size: 1rem;
  }
  .input-group .unit {
    color: var(--text-muted, #666);
    font-size: 0.875rem;
  }

  .btn {
    padding: 0.625rem 1.25rem;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.875rem;
    cursor: pointer;
    border: none;
    transition: all 0.15s;
  }
  .btn.primary {
    background: #1769e8;
    color: white;
  }
  .btn.primary:hover:not(:disabled) {
    filter: brightness(1.1);
  }
  .btn.primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .btn.secondary {
    background: var(--bg-tertiary, #f0f0f0);
    color: var(--text, #333);
  }

  .card-calibration-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    min-height: 300px;
  }
  .card-overlay {
    position: relative;
    width: 342px; /* 85.6mm at 96 DPI = 323px, scaled */
    height: 216px; /* 53.98mm at 96 DPI = 204px, scaled */
    touch-action: none;
  }
  .card-outline {
    position: absolute;
    inset: 0;
    border: 2px dashed var(--accent, #3b82f6);
    border-radius: 12px;
    box-sizing: border-box;
  }
  .card-label {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: var(--text-muted, #666);
    font-size: 0.875rem;
    pointer-events: none;
    white-space: nowrap;
  }
  .card-instructions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.8125rem;
    color: var(--text-muted, #666);
    flex-wrap: wrap;
    justify-content: center;
  }
  .card-instructions kbd {
    background: var(--bg-tertiary, #f0f0f0);
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    font-family: inherit;
    font-size: 0.75rem;
  }

  .calibration-trigger {
    position: fixed;
    bottom: 1.5rem;
    right: 1.5rem;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: #1769e8;
    color: white;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 10px 24px rgba(23, 105, 232, 0.32);
    z-index: 100;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .calibration-trigger:hover {
    transform: scale(1.1);
    box-shadow: 0 12px 26px rgba(23, 105, 232, 0.4);
  }
  .calibration-trigger:focus-visible {
    outline: 2px solid var(--accent, #3b82f6);
    outline-offset: 2px;
  }

  .calibration-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #ef4444;
    color: white;
    font-size: 0.625rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transform: scale(0);
    transition: all 0.2s;
  }
  .calibration-badge.active {
    opacity: 1;
    transform: scale(1);
  }

  /* Dark mode */
  @media (prefers-color-scheme: dark) {
    .calibration-modal {
      background: #1e1e1e;
    }
    .device-search input,
    .device-search select,
    .input-group input {
      background: #2d2d2d;
      border-color: #444;
      color: #fff;
    }
    .device-item:hover {
      background: #2d2d2d;
    }
    .current-calibration {
      background: #2d2d2d;
    }
    .btn.secondary {
      background: #3d3d3d;
      color: #fff;
    }
    .card-instructions kbd {
      background: #3d3d3d;
    }
  }

  /* Mobile responsive */
  @media (max-width: 600px) {
    .calibration-modal {
      max-height: 100vh;
      border-radius: 0;
      max-width: 100%;
    }
    .calibration-tabs {
      padding: 0 0.5rem;
    }
    .calibration-tabs button {
      padding: 0.625rem 0.75rem;
      font-size: 0.75rem;
    }
    .device-search {
      flex-direction: column;
    }
    .calibration-trigger {
      bottom: 1rem;
      right: 1rem;
      width: 44px;
      height: 44px;
    }
  }
</style>