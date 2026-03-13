/**
 * web-editor-live
 * Visual CSS editor for any website. Saves to localStorage.
 * MIT License – Viktor Brunclík (vbtronic)
 */

const STORAGE_KEY = 'web-editor-live-styles';
const PANEL_ID = 'web-editor-panel';

let panel = null;
let isSelecting = false;
let selectedEl = null;
let overlay = null;

function getStoredStyles() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { return {}; }
}

function saveStyles(styles) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(styles));
}

function getCssPath(el) {
  const parts = [];
  while (el && el !== document.body && el !== document.documentElement) {
    let selector = el.tagName.toLowerCase();
    if (el.id) {
      selector += '#' + el.id;
      parts.unshift(selector);
      break;
    }
    const parent = el.parentElement;
    if (parent) {
      const siblings = [...parent.children].filter(c => c.tagName === el.tagName);
      if (siblings.length > 1) {
        selector += ':nth-of-type(' + (siblings.indexOf(el) + 1) + ')';
      }
    }
    parts.unshift(selector);
    el = el.parentElement;
  }
  return parts.join(' > ');
}

function applyAllStyles() {
  let styleEl = document.getElementById('web-editor-injected');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'web-editor-injected';
    document.head.appendChild(styleEl);
  }
  const stored = getStoredStyles();
  let css = '';
  for (const [selector, props] of Object.entries(stored)) {
    const rules = Object.entries(props).map(([k, v]) => `${k}:${v}!important`).join(';');
    css += `${selector}{${rules}}\n`;
  }
  styleEl.textContent = css;
}

function createPanel() {
  if (panel) return;
  panel = document.createElement('div');
  panel.id = PANEL_ID;
  panel.innerHTML = `
    <style>
      #${PANEL_ID}{position:fixed;bottom:0;right:0;width:320px;max-height:60vh;background:#1a1a2e;color:#e0e0e0;
        font:13px/1.5 system-ui,sans-serif;border-top-left-radius:12px;box-shadow:0 -4px 24px rgba(0,0,0,.5);
        z-index:999999;overflow:auto;padding:0}
      #${PANEL_ID} .header{padding:10px 14px;background:#16213e;display:flex;justify-content:space-between;
        align-items:center;border-top-left-radius:12px;cursor:move}
      #${PANEL_ID} .header h3{margin:0;font-size:14px;color:#00d9ff}
      #${PANEL_ID} .body{padding:12px 14px}
      #${PANEL_ID} button{background:#0f3460;color:#e0e0e0;border:none;padding:6px 12px;border-radius:6px;
        cursor:pointer;font-size:12px;margin:2px}
      #${PANEL_ID} button:hover{background:#533483}
      #${PANEL_ID} button.pick{background:#e94560}
      #${PANEL_ID} .sel{margin:8px 0;padding:8px;background:#0f3460;border-radius:6px;font-size:11px;word-break:break-all}
      #${PANEL_ID} label{display:block;margin:4px 0;font-size:12px}
      #${PANEL_ID} input[type=text],#${PANEL_ID} input[type=color]{width:100%;box-sizing:border-box;
        background:#16213e;border:1px solid #533483;color:#e0e0e0;padding:4px 8px;border-radius:4px;font-size:12px}
      #${PANEL_ID} .props{max-height:200px;overflow:auto}
    </style>
    <div class="header">
      <h3>🎨 Web Editor</h3>
      <div>
        <button class="pick" id="we-pick">⊹ Select</button>
        <button id="we-reset">Reset all</button>
        <button id="we-close">✕</button>
      </div>
    </div>
    <div class="body" id="we-body">
      <p style="opacity:.6;font-size:12px">Click "Select" then click any element to edit it.</p>
    </div>
  `;
  document.body.appendChild(panel);

  document.getElementById('we-pick').onclick = startPicking;
  document.getElementById('we-reset').onclick = () => {
    localStorage.removeItem(STORAGE_KEY);
    applyAllStyles();
    document.getElementById('we-body').innerHTML = '<p style="opacity:.6;font-size:12px">All styles reset.</p>';
  };
  document.getElementById('we-close').onclick = () => { panel.remove(); panel = null; };
}

function startPicking() {
  isSelecting = true;
  document.getElementById('we-pick').textContent = '⊹ Picking...';
  overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:999998;cursor:crosshair';
  document.body.appendChild(overlay);
  overlay.addEventListener('click', onPick);
  overlay.addEventListener('mousemove', (e) => {
    overlay.style.pointerEvents = 'none';
    const el = document.elementFromPoint(e.clientX, e.clientY);
    overlay.style.pointerEvents = 'auto';
    if (el && el !== panel && !panel.contains(el)) {
      el.style.outline = '2px solid #e94560';
      setTimeout(() => el.style.outline = '', 800);
    }
  });
}

function onPick(e) {
  e.preventDefault();
  overlay.style.pointerEvents = 'none';
  const el = document.elementFromPoint(e.clientX, e.clientY);
  overlay.style.pointerEvents = 'auto';
  overlay.remove();
  overlay = null;
  isSelecting = false;
  document.getElementById('we-pick').textContent = '⊹ Select';
  if (el && el !== panel && !panel.contains(el)) {
    selectedEl = el;
    showEditor(el);
  }
}

function showEditor(el) {
  const path = getCssPath(el);
  const stored = getStoredStyles();
  const current = stored[path] || {};
  const props = [
    ['color', 'text'], ['background-color', 'color'], ['font-size', 'text'],
    ['font-weight', 'text'], ['padding', 'text'], ['margin', 'text'],
    ['border-radius', 'text'], ['border', 'text'], ['opacity', 'text'],
    ['display', 'text'], ['visibility', 'text']
  ];
  const body = document.getElementById('we-body');
  const aiSuggestions = analyzeElement(el);
  const aiHtml = aiSuggestions.length ? `
    <div style="margin:8px 0;padding:8px;background:#1a0a2e;border:1px solid #533483;border-radius:6px">
      <div style="font-size:11px;color:#a855f7;font-weight:600;margin-bottom:4px">AI Suggestions</div>
      ${aiSuggestions.map(s => `
        <button class="ai-suggest" data-prop="${s.prop}" data-val="${s.value}"
          style="display:block;width:100%;text-align:left;margin:2px 0;padding:4px 8px;font-size:11px;background:#0f3460;border-radius:4px">
          ${s.label}
        </button>
      `).join('')}
    </div>` : '';

  body.innerHTML = `<div class="sel">${path}</div>${aiHtml}<div class="props">${
    props.map(([prop, type]) => `
      <label>${prop}
        <input type="${type === 'color' ? 'color' : 'text'}" data-prop="${prop}"
          value="${current[prop] || ''}" placeholder="${getComputedStyle(el)[prop] || ''}">
      </label>
    `).join('')
  }</div><button id="we-apply">Apply & Save</button>`;

  body.querySelectorAll('.ai-suggest').forEach(btn => {
    btn.onclick = () => {
      const input = body.querySelector(`input[data-prop="${btn.dataset.prop}"]`);
      if (input) input.value = btn.dataset.val;
    };
  });

  document.getElementById('we-apply').onclick = () => {
    const inputs = body.querySelectorAll('input[data-prop]');
    const newProps = {};
    inputs.forEach(inp => { if (inp.value) newProps[inp.dataset.prop] = inp.value; });
    if (Object.keys(newProps).length) {
      stored[path] = { ...current, ...newProps };
    } else {
      delete stored[path];
    }
    saveStyles(stored);
    applyAllStyles();
  };
}

// ── AI: Style analysis and suggestions ────────────────────────────

function luminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function parseColor(str) {
  const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  return m ? [+m[1], +m[2], +m[3]] : null;
}

function contrastRatio(c1, c2) {
  const l1 = luminance(...c1), l2 = luminance(...c2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function analyzeElement(el) {
  const s = getComputedStyle(el);
  const suggestions = [];
  const fg = parseColor(s.color);
  const bg = parseColor(s.backgroundColor);

  if (fg && bg) {
    const ratio = contrastRatio(fg, bg);
    if (ratio < 4.5) {
      suggestions.push({ prop: 'color', value: '#ffffff', label: 'Low contrast (' + ratio.toFixed(1) + ':1) — set text to white' });
      suggestions.push({ prop: 'color', value: '#000000', label: 'Low contrast — set text to black' });
    }
  }

  const fs = parseFloat(s.fontSize);
  if (fs < 12) suggestions.push({ prop: 'font-size', value: '14px', label: 'Text too small (' + fs + 'px) — increase to 14px' });
  if (fs > 40) suggestions.push({ prop: 'font-size', value: '32px', label: 'Text very large (' + fs + 'px) — reduce to 32px' });

  const pad = parseFloat(s.padding);
  if (pad < 4 && (el.tagName === 'BUTTON' || el.tagName === 'A' || el.tagName === 'INPUT')) {
    suggestions.push({ prop: 'padding', value: '10px 20px', label: 'Add padding for better touch targets' });
  }

  const br = parseFloat(s.borderRadius);
  if (br === 0 && (el.tagName === 'BUTTON' || el.tagName === 'INPUT' || el.tagName === 'DIV')) {
    suggestions.push({ prop: 'border-radius', value: '8px', label: 'Add rounded corners for modern look' });
  }

  if (s.fontWeight === '400' && (el.tagName === 'H1' || el.tagName === 'H2' || el.tagName === 'H3')) {
    suggestions.push({ prop: 'font-weight', value: '700', label: 'Heading should be bold' });
  }

  if (s.opacity !== '1' && parseFloat(s.opacity) < 0.5) {
    suggestions.push({ prop: 'opacity', value: '1', label: 'Element is very transparent — make visible' });
  }

  return suggestions;
}

/**
 * AI: Analyze any element and get style suggestions.
 * Returns array of { prop, value, label }.
 */
export function aiSuggest(element) {
  return analyzeElement(element);
}

/**
 * Initialize the editor. Call once to activate.
 */
export function init() {
  applyAllStyles();
  createPanel();
}

/**
 * Apply saved styles without showing the panel.
 */
export function applySaved() {
  applyAllStyles();
}

/**
 * Get all stored style overrides.
 */
export function getStyles() {
  return getStoredStyles();
}

/**
 * Remove all stored styles.
 */
export function clearStyles() {
  localStorage.removeItem(STORAGE_KEY);
  const el = document.getElementById('web-editor-injected');
  if (el) el.remove();
}

export default { init, applySaved, getStyles, clearStyles, aiSuggest };
