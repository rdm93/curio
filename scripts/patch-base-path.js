#!/usr/bin/env node
// Post-build script:
// 1. Rewrites absolute paths in dist/index.html to /curio/ subpath
// 2. Copies PWA manifest, service worker, and icons into dist/
// 3. Injects <link rel="manifest"> and SW registration into index.html

const fs = require('fs');
const path = require('path');

const BASE_PATH = '/curio';
const DIST = path.join(__dirname, '..', 'dist');
const WEB_STATIC = path.join(__dirname, '..', 'web-static');
const ASSETS = path.join(__dirname, '..', 'assets');
const indexPath = path.join(DIST, 'index.html');

// ── 1. Rewrite absolute asset paths ──────────────────────────────────────────
let html = fs.readFileSync(indexPath, 'utf8');
html = html.replace(/(src|href)="\//g, `$1="${BASE_PATH}/`);
console.log('✅ Patched asset paths with base:', BASE_PATH);

// ── 2. Inject <link rel="manifest"> into <head> ───────────────────────────
if (!html.includes('rel="manifest"')) {
  html = html.replace(
    '</head>',
    `  <link rel="manifest" href="${BASE_PATH}/manifest.json" />\n  <meta name="theme-color" content="#0B0D13" />\n  <meta name="mobile-web-app-capable" content="yes" />\n  <meta name="apple-mobile-web-app-capable" content="yes" />\n  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />\n  <meta name="apple-mobile-web-app-title" content="Smart Stash" />\n  <link rel="apple-touch-icon" href="${BASE_PATH}/icons/icon-192.png" />\n</head>`
  );
  console.log('✅ Injected manifest link and PWA meta tags');
}

// ── 3. Inject Service Worker registration before </body> ──────────────────
if (!html.includes('serviceWorker')) {
  html = html.replace(
    '</body>',
    `  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('${BASE_PATH}/sw.js')
          .then(function(reg) { console.log('SW registered:', reg.scope); })
          .catch(function(err) { console.warn('SW registration failed:', err); });
      });
    }
  </script>\n</body>`
  );
  console.log('✅ Injected service worker registration');
}

fs.writeFileSync(indexPath, html, 'utf8');

// ── 4. Copy manifest.json and sw.js to dist/ ─────────────────────────────
fs.copyFileSync(path.join(WEB_STATIC, 'manifest.json'), path.join(DIST, 'manifest.json'));
fs.copyFileSync(path.join(WEB_STATIC, 'sw.js'), path.join(DIST, 'sw.js'));
console.log('✅ Copied manifest.json and sw.js to dist/');

// ── 5. Copy PWA icons to dist/icons/ ─────────────────────────────────────
const iconsDir = path.join(DIST, 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });
fs.copyFileSync(path.join(ASSETS, 'icon-192.png'), path.join(iconsDir, 'icon-192.png'));
fs.copyFileSync(path.join(ASSETS, 'icon-512.png'), path.join(iconsDir, 'icon-512.png'));
console.log('✅ Copied PWA icons to dist/icons/');

console.log('\n🚀 Build complete — dist/ is ready for GitHub Pages');
