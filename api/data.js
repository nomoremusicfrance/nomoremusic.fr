const db = require('../lib/db');
const auth = require('../lib/auth');
const store = require('../lib/store');

/* Lecture publique : alimente le site (et l'admin). Toujours le dernier état enregistré (jamais mis en cache). */
module.exports = async function (req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ error: 'method' });
  try {
    const r = await db.load(auth.isAdmin(req));
    const out = {};
    db.COLS.forEach(function (c) {
      out[c] = Object.keys(r.db[c] || {}).map(function (id) { return { id: id, data: r.db[c][id] }; });
    });
    res.setHeader('X-Nomore-Source', r.seeded ? 'defaults' : 'blob');
    res.status(200).json({ collections: out, seeded: r.seeded });
  } catch (e) {
    console.error('read failed', e && e.message);
    const h = store.httpError(e);
    /* le détail n'est donné qu'à l'administrateur connecté */
    const body = { error: 'read_failed' };
    if (auth.isAdmin(req)) { body.error = h.body.error; body.message = h.body.message; }
    res.status(h.status).json(body);
  }
};
