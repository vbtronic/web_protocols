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

export default { rule, validate, guardedSet, guardedSessionSet, createGuard, addValidator };
