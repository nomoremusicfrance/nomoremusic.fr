/* Stockage : Vercel Blob en production, dossier local pour les tests. */
const fs = require('fs');
const path = require('path');

const USE_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN && !process.env.NOMORE_LOCAL_STORE;
const LOCAL_DIR = process.env.NOMORE_LOCAL_DIR || path.join('/tmp', 'nomore-data');
const DB_PATH = 'db/data.json';

let _blob = null;
let _dbUrl = null; /* l'adresse du fichier ne change jamais : on la garde en mémoire */
async function blob() { return _blob || (_blob = await import('@vercel/blob')); }

function localFile(p) {
  const f = path.join(LOCAL_DIR, p);
  if (!f.startsWith(LOCAL_DIR)) throw new Error('chemin invalide');
  return f;
}

async function findBlob(prefix, exact) {
  const { list } = await blob();
  const out = [];
  let cursor;
  do {
    const r = await list({ prefix, limit: 1000, cursor });
    r.blobs.forEach(function (b) { if (!exact || b.pathname === exact) out.push(b); });
    cursor = r.hasMore ? r.cursor : undefined;
  } while (cursor);
  return out;
}

async function fetchBuffer(url) {
  const r = await fetch(url + (url.indexOf('?') < 0 ? '?' : '&') + 't=' + Date.now(), { cache: 'no-store' });
  if (!r.ok) throw new Error('lecture impossible (' + r.status + ')');
  return Buffer.from(await r.arrayBuffer());
}

/* ---- fichier générique ---- */
async function putFile(pathname, buffer, contentType) {
  if (!USE_BLOB) {
    const f = localFile(pathname);
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, buffer);
    return { url: '/_local/' + pathname };
  }
  const { put } = await blob();
  const r = await put(pathname, buffer, {
    access: 'public', addRandomSuffix: false, allowOverwrite: true,
    contentType: contentType || 'application/octet-stream', cacheControlMaxAge: 60 * 60 * 24 * 365
  });
  return { url: r.url };
}

async function getFile(pathname) {
  if (!USE_BLOB) {
    const f = localFile(pathname);
    return fs.existsSync(f) ? fs.readFileSync(f) : null;
  }
  const found = await findBlob(pathname, pathname);
  return found.length ? fetchBuffer(found[0].url) : null;
}

async function delFiles(pathnames) {
  if (!pathnames.length) return;
  if (!USE_BLOB) { pathnames.forEach(function (p) { try { fs.unlinkSync(localFile(p)); } catch (e) {} }); return; }
  const { del } = await blob();
  const urls = [];
  for (const p of pathnames) (await findBlob(p, p)).forEach(function (b) { urls.push(b.url); });
  if (urls.length) await del(urls);
}

/* ---- base de données (un seul fichier JSON) ---- */
async function readDb() {
  if (!USE_BLOB) {
    const f = localFile(DB_PATH);
    return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null;
  }
  if (_dbUrl) {
    try { return JSON.parse((await fetchBuffer(_dbUrl)).toString('utf8')); } catch (e) { _dbUrl = null; }
  }
  const found = await findBlob(DB_PATH, DB_PATH);
  if (!found.length) return null;
  _dbUrl = found[0].url;
  return JSON.parse((await fetchBuffer(_dbUrl)).toString('utf8'));
}

async function writeDb(obj) {
  const body = JSON.stringify(obj);
  if (!USE_BLOB) { await putFile(DB_PATH, Buffer.from(body), 'application/json'); return; }
  const { put } = await blob();
  await put(DB_PATH, body, {
    access: 'public', addRandomSuffix: false, allowOverwrite: true,
    contentType: 'application/json', cacheControlMaxAge: 60
  });
}

/* liste des fichiers dont le chemin commence par prefix (chemins seulement) */
async function listFiles(prefix) {
  if (!USE_BLOB) {
    const dir = localFile(prefix.replace(/\/[^/]*$/, '') || '.');
    if (!fs.existsSync(dir)) return [];
    const base = prefix.replace(/[^/]*$/, '');
    return fs.readdirSync(dir).map(function (n) { return base + n; }).filter(function (p) { return p.indexOf(prefix) === 0; });
  }
  return (await findBlob(prefix)).map(function (b) { return b.pathname; });
}

module.exports = { USE_BLOB, LOCAL_DIR, readDb, writeDb, putFile, getFile, delFiles, findBlob, listFiles };
