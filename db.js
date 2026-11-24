const auth = require('../lib/auth');
const db = require('../lib/db');
const store = require('../lib/store');

const ID_RE = /^[A-Za-z0-9_-]{1,48}$/;
/* un fichier envoyé depuis l'admin : https://<stockage>.public.blob.vercel-storage.com/assets/<nom> → chemin « assets/<nom> » */
const BLOB_URL = /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\/(assets\/[A-Za-z0-9_.-]+)$/i;

/* Écriture (admin uniquement) : { ops:[{op:'set'|'delete', col, id, data}] } */
module.exports = async function (req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  if (!auth.isAdmin(req)) return res.status(401).json({ error: 'unauthenticated' });
  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {}); }
  catch (e) { return res.status(400).json({ error: 'bad_json', message: 'Requête illisible.' }); }
  const ops = Array.isArray(body.ops) ? body.ops : [];
  if (!ops.length || ops.length > 500) return res.status(400).json({ error: 'bad_ops' });
  try {
    const r = await db.load(true);
    const state = r.db;
    const oldAudio = new Set();   /* fichiers audio d'Unreleased supprimés ou remplacés par cette opération */
    for (const o of ops) {
      if (db.COLS.indexOf(o.col) < 0 || !ID_RE.test(String(o.id))) return res.status(400).json({ error: 'bad_target' });
      const prev = state[o.col] && state[o.col][o.id];
      if (o.col === 'unreleased' && prev && prev.src && (o.op === 'delete' || (o.data && o.data.src !== prev.src))) oldAudio.add(prev.src);
      if (o.op === 'delete') { delete state[o.col][o.id]; continue; }
      if (o.op !== 'set' || !o.data || typeof o.data !== 'object' || Array.isArray(o.data)) return res.status(400).json({ error: 'bad_op' });
      if (JSON.stringify(o.data).length > 200000) return res.status(413).json({ error: 'too_large' });
      state[o.col][o.id] = o.data;
    }
    await store.writeDb(state);
    /* ménage : le fichier audio remplacé ou supprimé (morceau complet éventuel) ne doit plus rester accessible */
    try {
      const still = JSON.stringify(state);
      for (const src of oldAudio) {
        const m = BLOB_URL.exec(String(src));
        if (m && still.indexOf(src) < 0) await store.delFiles([m[1]]);
      }
    } catch (e) { console.error('audio cleanup failed', e && e.message); }
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error('db write failed', e && e.message);
    const h = store.httpError(e);
    h.body.message = 'Modification NON enregistrée. ' + h.body.message;
    res.status(h.status).json(h.body);
  }
};
