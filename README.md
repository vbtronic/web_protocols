<br>

<div align="center">

# Web Protocols

**Free, open-source JavaScript tools with zero dependencies.**
**Powered by AI. Use anywhere — even commercially.**

<br>

[![Live Demo](https://img.shields.io/badge/LIVE_DEMO-6366f1?style=for-the-badge&logoColor=white)](https://vbtronic.github.io/web_protocols/)
[![License](https://img.shields.io/badge/LICENSE-Modified_MIT-22c55e?style=for-the-badge)](LICENSE)
![Dependencies](https://img.shields.io/badge/DEPENDENCIES-0-22c55e?style=for-the-badge)
![Size](https://img.shields.io/badge/SIZE-Under_3KB_each-6366f1?style=for-the-badge)

<br>

[Live Demo](https://vbtronic.github.io/web_protocols/) · [Integrate](https://vbtronic.github.io/web_protocols/#integrate) · [Download](https://vbtronic.github.io/web_protocols/#download) · [Help](https://vbtronic.github.io/web_protocols/#help) · [Terms](https://vbtronic.github.io/web_protocols/#terms)

</div>

<br>

---

<br>

## What is Web Protocols?

Three lightweight JavaScript tools that solve common web problems. No npm, no build tools, no dependencies. Just download and use.

| Package | What it does | Size |
|:--------|:-------------|:-----|
| **url-state-compact** | Save app state in the URL with compression | ~2 KB |
| **web-editor-live** | Visual CSS editor for any website | ~3 KB |
| **data-guard-lite** | Validate data before saving to storage | ~1 KB |

<br>

---

<br>

## URL State Compact

Save any JavaScript object into the URL. Create shareable links that restore full app state — no backend needed.

```js
import { saveToUrl, loadFromUrl, createUrl } from './url-state/src/index.js';

// Save state to the current URL
saveToUrl({ name: 'Viktor', score: 100, level: 5 });
// URL becomes: https://yoursite.com?s=compressed_data

// Load it back
const state = loadFromUrl();
// { name: 'Viktor', score: 100, level: 5 }

// Build a shareable link
const link = createUrl('https://myapp.com', { filter: 'new', page: 3 });
// https://myapp.com?s=compressed_data
```

<details>
<summary><strong>Full API Reference</strong></summary>

<br>

| Function | Parameters | Returns | Description |
|:---------|:-----------|:--------|:------------|
| `encodeState` | `obj` | `string` | Compress object to URI-safe string |
| `decodeState` | `str` | `object \| null` | Decompress string back to object |
| `saveToUrl` | `obj, key?` | `string` | Save state to current URL, returns URL |
| `loadFromUrl` | `key?` | `object \| null` | Load state from current URL |
| `createUrl` | `baseUrl, obj, key?` | `string` | Build a new URL with embedded state |

Default key is `s`. Pass a custom key to use multiple state params.

</details>

**Use cases:** shareable filters, form data persistence, game saves in URLs, dashboard configs as links

<br>

---

<br>

## Web Editor Live

Let users customize any website's appearance. Point-and-click to select elements, change styles, everything saves to localStorage.

```js
import { init, applySaved, clearStyles } from './web-editor/src/index.js';

// Open the visual editor panel
init();

// Apply saved styles on page load (no panel)
applySaved();

// Reset all customizations
clearStyles();
```

<details>
<summary><strong>Full API Reference</strong></summary>

<br>

| Function | Description |
|:---------|:------------|
| `init()` | Opens the editor panel and applies saved styles |
| `applySaved()` | Applies saved styles without showing the panel |
| `getStyles()` | Returns all stored style overrides as an object |
| `clearStyles()` | Removes all saved styles from localStorage |

Editable properties: color, background-color, font-size, font-weight, padding, margin, border-radius, border, opacity, display, visibility.

</details>

**Use as a bookmarklet:**
```
javascript:void(import('https://vbtronic.github.io/web_protocols/packages/web-editor/src/index.js').then(m=>m.init()))
```

<br>

---

<br>

## Data Guard Lite

Validate data before it hits localStorage. Define rules, run checks, never save bad data.

```js
import { rule, guardedSet, createGuard, addValidator } from './data-guard/src/index.js';

// Define validation rules
const rules = [
  rule('email', 'email', 'nonempty'),
  rule('age', 'positive', 'int'),
  rule('website', 'url'),
];

// Validate and save in one step
const result = guardedSet('user', {
  email: 'viktor@example.com',
  age: 11,
  website: 'https://github.com/vbtronic'
}, rules);
// { saved: true, errors: [] }

// Create a reusable guarded store
const store = createGuard(rules);
store.set('profile', { email: 'bad', age: -1, website: 'nope' });
// { saved: false, errors: [...] }

// Add custom validators
addValidator('teen', v => v >= 13 && v <= 19);
addValidator('czechPhone', v => /^\+420\d{9}$/.test(v));
```

<details>
<summary><strong>Built-in Validators</strong></summary>

<br>

| Name | Checks |
|:-----|:-------|
| `string` | Value is a string |
| `number` | Value is a number (not NaN) |
| `boolean` | Value is true or false |
| `email` | Valid email format |
| `url` | Valid URL format |
| `nonempty` | Not null, undefined, or empty string |
| `array` | Value is an array |
| `object` | Value is a plain object |
| `int` | Value is an integer |
| `positive` | Value is a positive number |

You can also use **RegExp** directly in rules: `rule('username', /^[a-z0-9_]{3,20}$/)`

</details>

<br>

---

<br>

## Quick Start

No install needed. Each tool is a single JavaScript file.

**Option 1 — Download**

Visit the [download page](https://vbtronic.github.io/web_protocols/#download) and grab the files you need.

**Option 2 — Clone**

```bash
git clone https://github.com/vbtronic/web_protocols.git
```

**Option 3 — CDN (GitHub Pages)**

```html
<script type="module">
  import { saveToUrl } from 'https://vbtronic.github.io/web_protocols/packages/url-state/src/index.js';
  import { init } from 'https://vbtronic.github.io/web_protocols/packages/web-editor/src/index.js';
  import { rule, guardedSet } from 'https://vbtronic.github.io/web_protocols/packages/data-guard/src/index.js';
</script>
```

<br>

---

<br>

## Project Structure

```
web_protocols/
├── packages/
│   ├── url-state/        State-in-URL with compression
│   │   └── src/index.js
│   ├── web-editor/       Visual CSS editor
│   │   └── src/index.js
│   └── data-guard/       Storage validation
│       └── src/index.js
├── docs/                 Live demo site (GitHub Pages)
├── LICENSE               Modified MIT
└── README.md
```

<br>

---

<br>

## Powered by AI

Web Protocols was developed with the help of AI tools. All code is human-reviewed, tested, and maintained. AI accelerates development — it does not replace quality engineering.

<br>

---

<br>

## License

**Modified MIT License** — free for personal and commercial use.

**You can:** use in any project, modify the code, include in commercial products.

**You cannot:** resell as a standalone product, claim authorship, remove copyright notices.

See [LICENSE](LICENSE) for full details. See [Terms](https://vbtronic.github.io/web_protocols/#terms) on the website.

<br>

---

<br>

## Contributing

PRs welcome. Ideas for contributions:
- New built-in validators for Data Guard
- Web Editor UI improvements
- Framework wrappers (React, Vue, Svelte)
- Performance improvements
- Documentation and examples

<br>

---

<br>

<div align="center">

Made by [vbtronic](https://github.com/vbtronic)

[Live Demo](https://vbtronic.github.io/web_protocols/) · [Integrate](https://vbtronic.github.io/web_protocols/#integrate) · [Download](https://vbtronic.github.io/web_protocols/#download) · [Help](https://vbtronic.github.io/web_protocols/#help) · [GitHub](https://github.com/vbtronic/web_protocols)

</div>
