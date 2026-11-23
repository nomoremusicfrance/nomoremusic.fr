/* Stockage du site : Vercel Blob (connexion OIDC ou jeton), jamais le disque de la fonction en production.

   Authentification, par ordre de priorité :
   1. un jeton « read-write » s'il existe (BLOB_READ_WRITE_TOKEN, ou <PRÉFIXE>_READ_WRITE_TOKEN) ;
   2. la connexion OIDC de Vercel : l'identifiant du stockage (BLOB_STORE_ID, ou <PRÉFIXE>_STORE_ID, ex. NOMORE_STORE_ID)
      est passé au SDK, qui récupère lui-même le jeton OIDC fourni par Vercel à chaque requête.
   Si rien n'est configuré, toutes les opérations échouent avec une erreur explicite (aucun stockage de secours). */
const fs = require('fs');
const path = require('path');

const ENV = process.env;
const ON_VERCEL = !!(ENV.VERCEL || ENV.VERCEL_ENV);
/* mode « dossier local » : uniquement pour les tests en développement, demandé explicitement, et jamais sur Vercel */
const LOCAL_DIR = (!ON_VERCEL && ENV.NOMORE_LOCAL_STORE && ENV.NOMORE_LOCAL_DIR) ? ENV.NOMORE_LOCAL_DIR : null;
const DB_PATH = 'db/data.json';

/* ---------- erreurs lisibles ---------- */
class StoreError extends Error {
  constructor(code, message, cause) { super(message); this.name = 'StoreError'; this.code = code; this.cause = cause; }
}
/* message technique nettoyé : jamais de jeton ni d'identifiant long dans une réponse */
function safe(v) {
  return String((v && v.message) || v || 'erreur inconnue').replace(/\s+/g, ' ')
    .replace(/[A-Za-z0-9_\-.]{40,}/g, '…').slice(0, 200);
}
const NOT_CONFIGURED = 'Le stockage Vercel Blob n’est pas configuré pour ce projet : aucun identifiant de stockage (NOMORE_STORE_ID / BLOB_STORE_ID) ni jeton '
  + '(BLOB_READ_WRITE_TOKEN) n’est disponible. Vérifiez dans Vercel (Storage) que le stockage est connecté à ce projet et à cet environnement, puis redéployez.';
function wrap(action, e) {
  if (e instanceof StoreError) return e;
  return new StoreError('storage_error', 'Le stockage Vercel Blob a refusé l’opération (' + action + ') : ' + safe(e), e);
}

/* ---------- identifiants ---------- */
function firstEnd(suffix) {
  const k = Object.keys(ENV).filter(function (n) { return n.slice(-suffix.length) === suffix && ENV[n]; }).sort()[0];
  return k ? ENV[k] : '';
}
function token() { return (ENV.BLOB_READ_WRITE_TOKEN || ENV.NOMORE_READ_WRITE_TOKEN || firstEnd('_READ_WRITE_TOKEN') || '').trim(); }
function storeId() { return (ENV.BLOB_STORE_ID || ENV.NOMORE_STORE_ID || firstEnd('_STORE_ID') || '').trim(); }

/* 'token' | 'oidc' | 'local' | 'none' */
function mode() {
  if (LOCAL_DIR) return 'local';
  if (token()) return 'token';
  if (storeId()) return 'oidc';
  return 'none';
}
function creds() {
  const m = mode();
  if (m === 'token') return { token: token() };
  if (m === 'oidc') return { storeId: storeId() };
  throw new StoreError('not_configured', NOT_CONFIGURED);
}

let _blob = null;
let _dbUrl = null; /* l'adresse du fichier ne change jamais : on la garde en mémoire */
async function blob() {
  if (_blob) return _blob;
  try { _blob = await import('@vercel/blob'); }
  catch (e) { throw new StoreError('storage_error', 'Le module @vercel/blob est introuvable : vérifiez que package.json est bien sur GitHub (dépendance @vercel/blob).', e); }
  return _blob;
}

function localFile(p) {
  const f = path.join(LOCAL_DIR, p);
  if (f.indexOf(LOCAL_DIR) !== 0) throw new Error('chemin invalide');
  return f;
}

async function findBlob(prefix, exact) {
  try {
    const sdk = await blob(), c = creds(), out = [];
    let cursor;
    do {
      const r = await sdk.list(Object.assign({ prefix: prefix, limit: 1000, cursor: cursor }, c));
      r.blobs.forEach(function (b) { if (!exact || b.pathname === exact) out.push(b); });
      cursor = r.hasMore ? r.cursor : undefined;
    } while (cursor);
    return out;
  } catch (e) { throw wrap('lecture de la liste', e); }
}

async function fetchBuffer(url) {
  const r = await fetch(url + (url.indexOf('?') < 0 ? '?' : '&') + 't=' + Date.now(), { cache: 'no-store' });
  if (!r.ok) throw new Error('lecture impossible (' + r.status + ')');
  return Buffer.from(await r.arrayBuffer());
}

/* ---------- fichier générique ---------- */
async function putFile(pathname, buffer, contentType, cacheSeconds) {
  if (mode() === 'local') {
    const f = localFile(pathname);
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, buffer);
    return { url: '/_local/' + pathname };
  }
  try {
    const sdk = await blob();
    const r = await sdk.put(pathname, buffer, Object.assign({
      access: 'public', addRandomSuffix: false, allowOverwrite: true,
      contentType: contentType || 'application/octet-stream',
      cacheControlMaxAge: cacheSeconds || 60 * 60 * 24 * 365
    }, creds()));
    return { url: r.url };
  } catch (e) { throw wrap('écriture de ' + pathname, e); }
}

async function getFile(pathname) {
  if (mode() === 'local') {
    const f = localFile(pathname);
    return fs.existsSync(f) ? fs.readFileSync(f) : null;
  }
  const found = await findBlob(pathname, pathname);
  if (!found.length) return null;
  try { return await fetchBuffer(found[0].url); } catch (e) { throw wrap('lecture de ' + pathname, e); }
}

async function delFiles(pathnames) {
  if (!pathnames.length) return;
  if (mode() === 'local') { pathnames.forEach(function (p) { try { fs.unlinkSync(localFile(p)); } catch (e) {} }); return; }
  const urls = [];
  for (const p of pathnames) (await findBlob(p, p)).forEach(function (b) { urls.push(b.url); });
  if (!urls.length) return;
  try { const sdk = await blob(); await sdk.del(urls, creds()); } catch (e) { throw wrap('suppression', e); }
}

/* ---------- base de données (un seul fichier JSON) ---------- */
async function readDb() {
  if (mode() === 'local') {
    const f = localFile(DB_PATH);
    return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null;
  }
  creds(); /* échoue tout de suite, avec un message clair, si rien n'est configuré */
  if (_dbUrl) {
    try { return JSON.parse((await fetchBuffer(_dbUrl)).toString('utf8')); } catch (e) { _dbUrl = null; }
  }
  const found = await findBlob(DB_PATH, DB_PATH);
  if (!found.length) return null;
  _dbUrl = found[0].url;
  try { return JSON.parse((await fetchBuffer(_dbUrl)).toString('utf8')); }
  catch (e) { _dbUrl = null; throw wrap('lecture de la base', e); }
}

const sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

/* écrit puis RELIT le fichier : si ce qui est relu n'est pas identique, l'écriture est signalée comme échouée */
async function writeDb(obj) {
  const body = Buffer.from(JSON.stringify(obj));
  if (mode() === 'local') { await putFile(DB_PATH, body, 'application/json'); return; }
  const r = await putFile(DB_PATH, body, 'application/json', 60);
  let last = null;
  for (let i = 0; i < 4; i++) {
    try {
      if ((await fetchBuffer(r.url)).equals(body)) { _dbUrl = r.url; return; }
      last = new Error('le fichier relu est différent de celui enregistré');
    } catch (e) { last = e; }
    await sleep(350 * (i + 1));
  }
  _dbUrl = null;
  throw new StoreError('storage_error', 'L’enregistrement n’a pas pu être vérifié (relecture impossible) : ' + safe(last) + '. Réessayez.', last);
}

/* liste des fichiers dont le chemin commence par prefix (chemins seulement) */
async function listFiles(prefix) {
  if (mode() === 'local') {
    const dir = localFile(prefix.replace(/\/[^/]*$/, '') || '.');
    if (!fs.existsSync(dir)) return [];
    const base = prefix.replace(/[^/]*$/, '');
    return fs.readdirSync(dir).map(function (n) { return base + n; }).filter(function (p) { return p.indexOf(prefix) === 0; });
  }
  return (await findBlob(prefix)).map(function (b) { return b.pathname; });
}

/* ---------- diagnostic (admin) : écrit, relit puis supprime un petit fichier de test ---------- */
async function selfTest() {
  const out = { mode: mode(), ok: false, store: storeId() ? storeId().slice(0, 9) + '…' : null, steps: [] };
  try {
    creds();
    const probe = 'health/ping-' + Date.now() + '.json', body = Buffer.from(JSON.stringify({ t: Date.now() }));
    await putFile(probe, body, 'application/json', 60); out.steps.push('écriture');
    const back = await getFile(probe);
    if (!back || !back.equals(body)) throw new StoreError('storage_error', 'Le fichier de test relu est différent de celui écrit.');
    out.steps.push('relecture');
    await delFiles([probe]); out.steps.push('suppression');
    const db = await readDb();
    out.db = db ? { saved: true, rows: Object.keys(db).reduce(function (a, c) { a[c] = Object.keys(db[c] || {}).length; return a; }, {}) } : { saved: false };
    out.ok = true;
  } catch (e) {
    const w = e instanceof StoreError ? e : wrap('test', e);
    out.error = w.code; out.message = w.message;
  }
  return out;
}

/* réponse d'API pour une erreur de stockage */
function httpError(e) {
  if (e instanceof StoreError) {
    return { status: e.code === 'not_configured' ? 503 : 502, body: { error: e.code === 'not_configured' ? 'storage_not_configured' : 'storage_error', message: e.message } };
  }
  return { status: 500, body: { error: 'server_error', message: 'Erreur inattendue du serveur : ' + safe(e) } };
}

module.exports = {
  mode, USE_BLOB: !LOCAL_DIR, LOCAL_DIR, StoreError,
  readDb, writeDb, putFile, getFile, delFiles, findBlob, listFiles, selfTest, httpError
};
