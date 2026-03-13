/**
 * url-state-compact
 * Save & restore app state in the URL. Zero dependencies. LZ compression.
 * MIT License – Viktor Brunclík (vbtronic)
 */

// ── LZ Compression (URI-safe base64) ──────────────────────────────

const URI_KEY = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$';
const BASE = { val: {}, pos: {} };
for (let i = 0; i < URI_KEY.length; i++) {
  BASE.val[URI_KEY[i]] = i;
  BASE.pos[i] = URI_KEY[i];
}

function _compress(input) {
  if (input == null || input === '') return '';
  const ctx = {
    dict: {}, dictSize: 3, data: [], val: 0, pos: 0,
    bits: 6, // log2(64) for URI_KEY
  };
  let w = '', enlargeIn = 2, dictSize = 3, numBits = 2;

  function writeBits(value, numB) {
    for (let i = 0; i < numB; i++) {
      ctx.val = (ctx.val << 1) | (value & 1);
      if (ctx.pos === ctx.bits - 1) {
        ctx.pos = 0;
        ctx.data.push(URI_KEY[ctx.val]);
        ctx.val = 0;
      } else {
        ctx.pos++;
      }
      value >>= 1;
    }
  }

  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (!(c in ctx.dict)) {
      ctx.dict[c] = dictSize++;
      writeBits(0, numBits);
      const v = c.charCodeAt(0);
      writeBits(v, v < 256 ? 8 : 16);
      if (v >= 256) {
        // mark 16-bit
      }
      enlargeIn--;
      if (enlargeIn === 0) { enlargeIn = 1 << numBits; numBits++; }
    }
    const wc = w + c;
    if (wc in ctx.dict) {
      w = wc;
    } else {
      if (w in ctx.dict) {
        writeBits(ctx.dict[w], numBits);
      }
      ctx.dict[wc] = dictSize++;
      enlargeIn--;
      if (enlargeIn === 0) { enlargeIn = 1 << numBits; numBits++; }
      w = c;
    }
  }
  if (w !== '') {
    writeBits(ctx.dict[w], numBits);
  }
  // Write stop (value 2)
  writeBits(2, numBits);
  // Flush
  while (true) {
    ctx.val <<= 1;
    if (ctx.pos === ctx.bits - 1) {
      ctx.data.push(URI_KEY[ctx.val]);
      break;
    }
    ctx.pos++;
  }
  return ctx.data.join('');
}

function _decompress(compressed) {
  if (compressed == null || compressed === '') return '';
  const length = compressed.length;
  const getBits = (function () {
    let pos = 0, val = BASE.val[compressed[0]], bits = 0, maxPow, power, idx = 1;
    return function (n) {
      let res = 0;
      maxPow = 1 << n;
      power = 1;
      while (power !== maxPow) {
        if (bits === 0) {
          bits = 6; // log2(64)
          if (idx < length) val = BASE.val[compressed[idx++]];
        }
        res |= (val & 1) * power;
        val >>= 1;
        bits--;
        power <<= 1;
      }
      return res;
    };
  })();

  const dict = [];
  let enlargeIn = 4, dictSize = 4, numBits = 3, entry, w, result = [];

  for (let i = 0; i < 3; i++) dict[i] = i;

  const type = getBits(2);
  let c;
  if (type === 0) c = String.fromCharCode(getBits(8));
  else if (type === 1) c = String.fromCharCode(getBits(16));
  else return '';

  dict[3] = c;
  w = c;
  result.push(c);

  while (true) {
    const k = getBits(numBits);
    let bits;
    switch (k) {
      case 0: bits = 8; break;
      case 1: bits = 16; break;
      case 2: return result.join('');
      default: bits = 0; break;
    }
    if (bits) {
      c = String.fromCharCode(getBits(bits));
      dict[dictSize++] = c;
      k === 0 || k === 1 ? null : null;
      entry = c;
      enlargeIn--;
    } else {
      entry = k < dict.length ? (dict[k] || w + w[0]) : w + w[0];
    }
    result.push(entry);
    dict[dictSize++] = w + entry[0];
    enlargeIn--;
    if (enlargeIn === 0) { enlargeIn = 1 << numBits; numBits++; }
    w = entry;
  }
}

// ── Public API ─────────────────────────────────────────────────────

/**
 * Encode a JS object into a compressed URI-safe string.
 */
export function encodeState(obj) {
  return _compress(JSON.stringify(obj));
}

/**
 * Decode a compressed string back into a JS object.
 */
export function decodeState(str) {
  try {
    return JSON.parse(_decompress(str));
  } catch {
    return null;
  }
}

/**
 * Save state into the current page URL (browser only).
 */
export function saveToUrl(obj, key = 's') {
  const encoded = encodeState(obj);
  const url = new URL(window.location);
  url.searchParams.set(key, encoded);
  window.history.replaceState(null, '', url);
  return url.toString();
}

/**
 * Load state from the current page URL.
 */
export function loadFromUrl(key = 's') {
  const url = new URL(window.location);
  const val = url.searchParams.get(key);
  return val ? decodeState(val) : null;
}

/**
 * Build a shareable URL with embedded state.
 */
export function createUrl(baseUrl, obj, key = 's') {
  const encoded = encodeState(obj);
  const url = new URL(baseUrl);
  url.searchParams.set(key, encoded);
  return url.toString();
}

export default { encodeState, decodeState, saveToUrl, loadFromUrl, createUrl };
