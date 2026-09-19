#!/usr/bin/env node
// Post-build script: rewrites absolute paths in dist/index.html
// to work under the /curio/ GitHub Pages subpath.

const fs = require('fs');
const path = require('path');

const BASE_PATH = '/curio';
const indexPath = path.join(__dirname, '..', 'dist', 'index.html');

let html = fs.readFileSync(indexPath, 'utf8');

// Rewrite absolute asset paths to include the base path prefix
// e.g. src="/_expo/..." -> src="/curio/_expo/..."
//      href="/favicon.ico" -> href="/curio/favicon.ico"
html = html.replace(/(src|href)="\//g, `$1="${BASE_PATH}/`);

fs.writeFileSync(indexPath, html, 'utf8');
console.log(`✅ Patched dist/index.html with base path: ${BASE_PATH}`);
console.log('New asset references:');
const matches = html.match(/(src|href)="[^"]+"/g) || [];
matches.forEach(m => console.log(' ', m));
