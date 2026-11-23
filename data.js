const db = require('../lib/db');

/* Lecture publique : alimente le site (et l'admin). */
module.exports = async function (req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'method' });
  try {
    const r = await db.load();
    const out = {};
    db.COLS.forEach(function (c) {
      out[c] = Object.keys(r.db[c] || {}).map(function (id) { return { id: id, data: r.db[c][id] }; });
    });
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ collections: out, seeded: r.seeded });
  } catch (e) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(500).json({ error: 'read_failed' });
  }
};
