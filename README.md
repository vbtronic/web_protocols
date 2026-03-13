<p align="center">
  <h1 align="center">⚡ Web Protocols</h1>
  <p align="center">
    Free, open-source web tools with <b>zero dependencies</b>.<br>
    Use anywhere — even commercially.
  </p>
</p>

<p align="center">
  <a href="https://vbtronic.github.io/web_protocols/"><img src="https://img.shields.io/badge/🌐_Live_Demo-6366f1?style=for-the-badge" alt="Live Demo"></a>
  <img src="https://img.shields.io/badge/license-MIT-green?style=for-the-badge" alt="MIT License">
  <img src="https://img.shields.io/badge/dependencies-0-brightgreen?style=for-the-badge" alt="Zero Dependencies">
  <img src="https://img.shields.io/badge/size-<3KB_each-blue?style=for-the-badge" alt="Size">
</p>

---

## 📦 Three Tools, One Repo

| Package | Description | Size |
|---------|-------------|------|
| **[url-state-compact](#-url-state)** | Save app state in the URL with LZ compression | ~2 KB |
| **[web-editor-live](#-web-editor)** | Visual CSS editor for any website, saves to localStorage | ~3 KB |
| **[data-guard-lite](#-data-guard)** | Validate data before saving to storage | ~1 KB |

> 🎮 **[Try the live demo →](https://vbtronic.github.io/web_protocols/)**

---

## 📦 URL State

Save any JavaScript object into the URL. Share links that restore full app state — **no backend needed**.

```js
import { saveToUrl, loadFromUrl, createUrl } from './packages/url-state/src/index.js';

// Save current state to URL
saveToUrl({ name: 'Viktor', score: 100, level: 5 });

// Load it back
const state = loadFromUrl();
// → { name: 'Viktor', score: 100, level: 5 }

// Create a shareable link
const link = createUrl('https://myapp.com', { filter: 'new', page: 3 });
// → https://myapp.com?s=compressed_data
```

### API

| Function | Description |
|----------|-------------|
| `encodeState(obj)` | Compress object to URI-safe string |
| `decodeState(str)` | Decompress string back to object |
| `saveToUrl(obj, key?)` | Save state to current URL |
| `loadFromUrl(key?)` | Load state from current URL |
| `createUrl(baseUrl, obj, key?)` | Build a shareable URL |

### Use Cases
- 🔗 Shareable filter/search states
- 📋 Form data that survives page refresh
- 🎮 Game save states in URLs
- 📊 Dashboard configurations as links

---

## 🎨 Web Editor

Let users customize any website's appearance. Changes persist in localStorage.

```js
import { init, applySaved, clearStyles } from './packages/web-editor/src/index.js';

// Show the visual editor panel
init();

// Just apply saved styles (no panel)
applySaved();

// Reset everything
clearStyles();
```

### Features
- 🖱️ Point-and-click element selection
- 🎨 Edit colors, fonts, spacing, borders, opacity
- 💾 Auto-saves to localStorage
- 🔌 Works on any website

### As a Bookmarklet
```
javascript:void(import('https://vbtronic.github.io/web_protocols/packages/web-editor/src/index.js').then(m=>m.init()))
```

---

## 🛡️ Data Guard

Validate data before it hits localStorage. Never save garbage again.

```js
import { rule, guardedSet, createGuard } from './packages/data-guard/src/index.js';

// Define rules
const rules = [
  rule('email', 'email', 'nonempty'),
  rule('age', 'positive', 'int'),
  rule('website', 'url'),
];

// Validate & save in one step
const result = guardedSet('user-profile', {
  email: 'viktor@example.com',
  age: 11,
  website: 'https://github.com/vbtronic'
}, rules);

console.log(result);
// → { saved: true, errors: [] }
```

### Built-in Validators

| Validator | Checks |
|-----------|--------|
| `string` | Is a string |
| `number` | Is a number (not NaN) |
| `boolean` | Is true or false |
| `email` | Valid email format |
| `url` | Valid URL |
| `nonempty` | Not null, undefined, or empty string |
| `array` | Is an array |
| `object` | Is a plain object |
| `int` | Is an integer |
| `positive` | Is a positive number |

### Custom Validators

```js
import { addValidator, rule, guardedSet } from './packages/data-guard/src/index.js';

// Add your own
addValidator('teen', v => v >= 13 && v <= 19);
addValidator('czechPhone', v => /^\+420\d{9}$/.test(v));

// Use regex directly in rules
const rules = [
  rule('username', 'nonempty', /^[a-z0-9_]{3,20}$/),
  rule('age', 'teen'),
];
```

---

## 🚀 Quick Start

No install needed. Just copy the file you need:

```bash
# Clone the repo
git clone https://github.com/vbtronic/web_protocols.git

# Use directly in your HTML
<script type="module">
  import { saveToUrl } from './packages/url-state/src/index.js';
</script>
```

Or use from CDN (GitHub Pages):
```html
<script type="module">
  import { saveToUrl } from 'https://vbtronic.github.io/web_protocols/packages/url-state/src/index.js';
</script>
```

---

## 📁 Project Structure

```
web_protocols/
├── packages/
│   ├── url-state/        # State-in-URL with compression
│   ├── web-editor/       # Visual CSS editor
│   └── data-guard/       # Storage validation
├── docs/                 # Live demo (GitHub Pages)
├── LICENSE               # MIT
└── README.md
```

---

## 🤝 Contributing

PRs welcome! Feel free to:
- Add new validators to Data Guard
- Improve the Web Editor UI
- Add framework wrappers (React, Vue, Svelte)

---

## 📄 License

**MIT** — free for personal and commercial use.

Made with ❤️ by [vbtronic](https://github.com/vbtronic)
