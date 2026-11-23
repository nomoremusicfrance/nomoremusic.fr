/* Collections du site + contenu initial (repris de data.js au premier chargement). */
const store = require('./store');

const COLS = ['discography', 'unreleased', 'gallery', 'refs', 'agenda'];

/* contenu initial : data.js est chargé comme module (suivi automatiquement par Vercel) */
function defaults() {
  if (!global.window) global.window = {};
  require('../data.js');
  return global.window.NOMORE_DEFAULTS || {};
}

function seed() {
  const def = defaults(), db = {};
  COLS.forEach(function (c) {
    db[c] = {};
    (def[c] || []).forEach(function (row, i) {
      const r = Object.assign({}, row, { order: i });
      db[c]['s' + String(i).padStart(3, '0')] = r;
    });
  });
  return db;
}

/* renvoie { db, seeded } ; seeded = rien d'enregistré pour l'instant */
async function load() {
  const saved = await store.readDb();
  if (saved) { COLS.forEach(function (c) { if (!saved[c]) saved[c] = {}; }); return { db: saved, seeded: false }; }
  return { db: seed(), seeded: true };
}

/* données au format NOMORE_DEFAULTS (tableaux triés, sans le champ « order ») */
function asDefaults(db) {
  const out = {};
  COLS.forEach(function (c) {
    out[c] = Object.keys(db[c] || {}).map(function (id) { return db[c][id]; })
      .sort(function (a, b) { return (a.order || 0) - (b.order || 0); })
      .map(function (r) { const o = Object.assign({}, r); delete o.order; return o; });
  });
  return out;
}

function staticSource() {
  return 'window.NOMORE_DEFAULTS = ' + JSON.stringify(defaults()) + ';';
}

module.exports = { COLS, load, seed, asDefaults, staticSource };
