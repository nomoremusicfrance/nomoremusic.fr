const auth = require('../lib/auth');
const db = require('../lib/db');
const store = require('../lib/store');

const ID_RE = /^[A-Za-z0-9_-]{1,48}$/;

/* Écriture (admin uniquement) : { ops:[{op:'set'|'delete', col, id, data}] } */
module.exports = async function (req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  if (!auth.isAdmin(req)) return res.status(401).json({ error: 'unauthenticated' });
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const ops = Array.isArray(body.ops) ? body.ops : [];
  if (!ops.length || ops.length > 500) return res.status(400).json({ error: 'bad_ops' });
  try {
    const r = await db.load();
    const state = r.db;
    for (const o of ops) {
      if (db.COLS.indexOf(o.col) < 0 || !ID_RE.test(String(o.id))) return res.status(400).json({ error: 'bad_target' });
      if (o.op === 'delete') { delete state[o.col][o.id]; continue; }
      if (o.op !== 'set' || !o.data || typeof o.data !== 'object' || Array.isArray(o.data)) return res.status(400).json({ error: 'bad_op' });
      if (JSON.stringify(o.data).length > 200000) return res.status(413).json({ error: 'too_large' });
      state[o.col][o.id] = o.data;
    }
    await store.writeDb(state);
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error('db write failed', e);
    res.status(500).json({ error: 'write_failed' });
  }
};
