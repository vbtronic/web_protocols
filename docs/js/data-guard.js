/**
 * data-guard-lite
 * Validate data before saving to localStorage / sessionStorage.
 * MIT License – Viktor Brunclík (vbtronic)
 */

// ── Built-in validators ───────────────────────────────────────────

const builtIn = {
  string:   (v) => typeof v === 'string',
  number:   (v) => typeof v === 'number' && !isNaN(v),
  boolean:  (v) => typeof v === 'boolean',
  email:    (v) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  url:      (v) => { try { new URL(v); return true; } catch { return false; } },
  nonempty: (v) => v !== null && v !== undefined && v !== '',
  array:    (v) => Array.isArray(v),
  object:   (v) => v !== null && typeof v === 'object' && !Array.isArray(v),
  int:      (v) => Number.isInteger(v),
  positive: (v) => typeof v === 'number' && v > 0,
};

// ── Core ──────────────────────────────────────────────────────────

/**
 * Create a rule: { field, checks[] }
 * checks can be: string (built-in name), RegExp, or function(value) => bool
 */
export function rule(field, ...checks) {
  return { field, checks };
}

/**
 * Validate an object against rules.
 * Returns { valid: bool, errors: [{ field, message }] }
 */
export function validate(data, rules) {
  const errors = [];
  for (const r of rules) {
    const value = data[r.field];
    for (const check of r.checks) {
      let ok = false;
      let msg = '';
      if (typeof check === 'string') {
        const fn = builtIn[check];
        if (!fn) { msg = `Unknown validator "${check}"`; }
        else { ok = fn(value); msg = `${r.field} failed "${check}" check`; }
      } else if (check instanceof RegExp) {
        ok = typeof value === 'string' && check.test(value);
        msg = `${r.field} failed regex ${check}`;
      } else if (typeof check === 'function') {
        ok = check(value);
        msg = `${r.field} failed custom check`;
      }
      if (!ok) errors.push({ field: r.field, message: msg });
    }
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Guarded localStorage.setItem — only saves if validation passes.
 * Returns { saved: bool, errors: [] }
 */
export function guardedSet(key, data, rules) {
  const result = validate(data, rules);
  if (result.valid) {
    localStorage.setItem(key, JSON.stringify(data));
  }
  return { saved: result.valid, errors: result.errors };
}

/**
 * Guarded sessionStorage.setItem.
 */
export function guardedSessionSet(key, data, rules) {
  const result = validate(data, rules);
  if (result.valid) {
    sessionStorage.setItem(key, JSON.stringify(data));
  }
  return { saved: result.valid, errors: result.errors };
}

/**
 * Create a guarded storage wrapper.
 * const store = createGuard([ rule('email', 'email'), rule('age', 'positive') ]);
 * store.set('user', { email: 'a@b.c', age: 25 }); // validates first
 */
export function createGuard(rules, storage = 'local') {
  const s = storage === 'session' ? sessionStorage : localStorage;
  return {
    set(key, data) {
      const result = validate(data, rules);
      if (result.valid) s.setItem(key, JSON.stringify(data));
      return { saved: result.valid, errors: result.errors };
    },
    get(key) {
      try { return JSON.parse(s.getItem(key)); } catch { return null; }
    },
    remove(key) { s.removeItem(key); },
  };
}

/**
 * Add a custom validator to the built-in set.
 */
export function addValidator(name, fn) {
  builtIn[name] = fn;
}

// ── AI: Smart field analysis ──────────────────────────────────────

const fieldPatterns = [
  { match: /e[-_]?mail/i, checks: ['email', 'nonempty'], type: 'email' },
  { match: /^url$|website|homepage|link/i, checks: ['url'], type: 'url' },
  { match: /phone|tel|mobile/i, checks: ['string', v => /^\+?[\d\s\-()]{6,20}$/.test(v)], type: 'phone' },
  { match: /age|year/i, checks: ['int', 'positive'], type: 'number' },
  { match: /price|cost|amount|total/i, checks: ['number', 'positive'], type: 'currency' },
  { match: /name|first.?name|last.?name|username/i, checks: ['string', 'nonempty'], type: 'text' },
  { match: /pass|password/i, checks: ['string', 'nonempty', v => typeof v === 'string' && v.length >= 6], type: 'password' },
  { match: /zip|postal/i, checks: ['string', v => /^\d{3,10}$/.test(v)], type: 'zip' },
  { match: /date|birth|created|updated/i, checks: ['string', v => !isNaN(Date.parse(v))], type: 'date' },
  { match: /active|enabled|visible|checked/i, checks: ['boolean'], type: 'boolean' },
  { match: /count|quantity|num|size|length/i, checks: ['int'], type: 'number' },
  { match: /description|bio|comment|note|text|message/i, checks: ['string'], type: 'text' },
];

/**
 * AI: Analyze a data object and auto-generate validation rules.
 * Inspects field names and values to suggest the best validators.
 *
 * const data = { email: 'a@b.c', age: 25, website: 'https://x.com' };
 * const rules = suggestRules(data);
 * // [rule('email','email','nonempty'), rule('age','int','positive'), rule('website','url')]
 */
export function suggestRules(data) {
  const rules = [];
  for (const [field, value] of Object.entries(data)) {
    let matched = false;
    for (const pattern of fieldPatterns) {
      if (pattern.match.test(field)) {
        rules.push({ field, checks: pattern.checks, _aiType: pattern.type, _confidence: 'high' });
        matched = true;
        break;
      }
    }
    if (!matched) {
      const inferred = inferFromValue(field, value);
      rules.push(inferred);
    }
  }
  return rules;
}

function inferFromValue(field, value) {
  if (typeof value === 'string') {
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
      return { field, checks: ['email'], _aiType: 'email', _confidence: 'medium' };
    if (/^https?:\/\//.test(value))
      return { field, checks: ['url'], _aiType: 'url', _confidence: 'medium' };
    if (!isNaN(Date.parse(value)) && value.length > 6)
      return { field, checks: ['string', v => !isNaN(Date.parse(v))], _aiType: 'date', _confidence: 'low' };
    return { field, checks: ['string', 'nonempty'], _aiType: 'text', _confidence: 'low' };
  }
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return { field, checks: ['int'], _aiType: 'integer', _confidence: 'medium' };
    return { field, checks: ['number'], _aiType: 'number', _confidence: 'medium' };
  }
  if (typeof value === 'boolean')
    return { field, checks: ['boolean'], _aiType: 'boolean', _confidence: 'high' };
  if (Array.isArray(value))
    return { field, checks: ['array'], _aiType: 'array', _confidence: 'high' };
  if (value && typeof value === 'object')
    return { field, checks: ['object'], _aiType: 'object', _confidence: 'high' };
  return { field, checks: ['nonempty'], _aiType: 'unknown', _confidence: 'low' };
}

/**
 * AI: Validate with auto-generated rules. Zero config.
 * Just pass your data — AI figures out the rules.
 *
 * const result = autoValidate({ email: 'bad', age: -1 });
 * // { valid: false, errors: [...], rulesUsed: [...] }
 */
export function autoValidate(data) {
  const rules = suggestRules(data);
  const result = validate(data, rules);
  return { ...result, rulesUsed: rules };
}

/**
 * AI: Guarded save with auto-generated rules.
 * Analyzes data, validates, and saves if valid.
 */
export function autoGuardedSet(key, data) {
  const rules = suggestRules(data);
  const result = validate(data, rules);
  if (result.valid) localStorage.setItem(key, JSON.stringify(data));
  return { saved: result.valid, errors: result.errors, rulesUsed: rules };
}

export default { rule, validate, guardedSet, guardedSessionSet, createGuard, addValidator, suggestRules, autoValidate, autoGuardedSet };
