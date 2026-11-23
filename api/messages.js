const auth = require('../lib/auth');
const store = require('../lib/store');

/* Messages reçus par le formulaire (admin uniquement) */
module.exports = async function (req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!auth.isAdmin(req)) return res.status(401).json({ error: 'unauthenticated' });
  try {
    if (req.method === 'POST') {
      const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const p = String(b.delete || '');
      if (!/^messages\/[0-9]{14}-[0-9a-f]{16}\.json$/.test(p)) return res.status(400).json({ error: 'bad_path' });
      await store.delFiles([p]);
      return res.status(200).json({ ok: true });
    }
    if (req.method !== 'GET') return res.status(405).json({ error: 'method' });
    const paths = (await store.listFiles('messages/')).sort().reverse().slice(0, 150);
    const out = [];
    for (const p of paths) {
      try { const buf = await store.getFile(p); if (buf) out.push(Object.assign({ id: p }, JSON.parse(buf.toString('utf8')))); } catch (e) {}
    }
    return res.status(200).json({ messages: out });
  } catch (e) {
    console.error('messages failed', e);
    return res.status(500).json({ error: 'failed' });
  }
};
