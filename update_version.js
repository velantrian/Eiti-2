#!/usr/bin/env node
/**
 * VELANTRIM EITI — update_version.js
 * Синхронизирует версию во всех трёх файлах одной командой:
 *   node update_version.js 12.9.13
 *
 * Обновляет:
 *   sw.js      — заголовок, CACHE_NAME, SW_VERSION
 *   manifest.json — version
 *   index.html — EITI_VERSION, EITI_BUILD_DATE
 */

const fs   = require('fs');
const path = require('path');

const newVersion = process.argv[2];
if (!newVersion || !/^\d+\.\d+\.\d+$/.test(newVersion)) {
    console.error('❌ Укажи версию: node update_version.js X.Y.Z');
    process.exit(1);
}

const buildDate = new Date().toISOString().slice(0, 16); // "YYYY-MM-DDTHH:MM"
const root = path.resolve(__dirname);

// ── sw.js ────────────────────────────────────────────────────────────────────
const swPath = path.join(root, 'sw.js');
let sw = fs.readFileSync(swPath, 'utf8');

sw = sw.replace(
    /\/\/ VELANTRIM EITI — Service Worker v[\d.]+/,
    `// VELANTRIM EITI — Service Worker v${newVersion}`
);
sw = sw.replace(
    /const CACHE_NAME = 'eiti-cache-v[\d.]+'/,
    `const CACHE_NAME = 'eiti-cache-v${newVersion}'`
);
sw = sw.replace(
    /const SW_VERSION = '[\d.]+'/,
    `const SW_VERSION = '${newVersion}'`
);

fs.writeFileSync(swPath, sw, 'utf8');
console.log(`✅ sw.js         → v${newVersion}`);

// ── manifest.json ─────────────────────────────────────────────────────────────
const manifestPath = path.join(root, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
manifest.version = newVersion;
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
console.log(`✅ manifest.json → v${newVersion}`);

// ── index.html ────────────────────────────────────────────────────────────────
const htmlPath = path.join(root, 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

html = html.replace(
    /var EITI_VERSION = "[\d.]+"/,
    `var EITI_VERSION = "${newVersion}"`
);
html = html.replace(
    /var EITI_BUILD_DATE = "[\d\-T:]+"/,
    `var EITI_BUILD_DATE = "${buildDate}"`
);
// Обновить комментарий BUILD_DATE
html = html.replace(
    /(var EITI_BUILD_DATE = "[^"]+";)\s*\/\/.*/,
    `$1 // v${newVersion}`
);

fs.writeFileSync(htmlPath, html, 'utf8');
console.log(`✅ index.html    → v${newVersion} · BUILD_DATE=${buildDate}`);

console.log(`\n🚀 Версия ${newVersion} синхронизирована во всех файлах.`);
