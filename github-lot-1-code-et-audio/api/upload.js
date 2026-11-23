const auth = require('../lib/auth');
const store = require('../lib/store');

/* Envoi de fichiers (admin) : le navigateur découpe en morceaux ≤ 3,5 Mo (limite de 4,5 Mo par requête Vercel). */
const MAX_TOTAL = 40 * 1024 * 1024;
const TYPES = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif',
  'audio/mpeg': 'mp3', 'audio/mp3': 'mp3', 'audio/mp4': 'm4a', 'audio/x-m4a': 'm4a', 'audio/aac': 'aac',
  'audio/wav': 'wav', 'audio/x-wav': 'wav', 'audio/ogg': 'ogg', 'audio/flac': 'flac'
};
const ID_RE = /^[a-z0-9]{8,40}$/;

async function readBody(req) {
  if (Buffer.isBuffer(req.body)) return req.body;
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return Buffer.concat(chunks);
}

module.exports = async function (req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  if (!auth.isAdmin(req)) return res.status(401).json({ error: 'unauthenticated' });
  const q = req.query || {};
  const id = String(q.id || ''), i = parseInt(q.i, 10), n = parseInt(q.n, 10), total = parseInt(q.total, 10) || 0;
  const type = String(q.type || '').toLowerCase();
  const ext = TYPES[type];
  if (!ID_RE.test(id) || !(i >= 0) || !(n >= 1) || i >= n || n > 16 || !ext) return res.status(400).json({ error: 'bad_request' });
  if (total > MAX_TOTAL) return res.status(413).json({ error: 'too_large' });
  try {
    const part = await readBody(req);
    if (!part.length) return res.status(400).json({ error: 'empty' });
    const pathname = 'assets/' + id + '.' + ext;
    if (n === 1) {
      const r = await store.putFile(pathname, part, type);
      return res.status(200).json({ url: r.url });
    }
    await store.putFile('tmp/' + id + '/' + String(i).padStart(2, '0'), part, 'application/octet-stream');
    if (i < n - 1) return res.status(200).json({ ok: true, part: i });
    const parts = [];
    for (let k = 0; k < n; k++) {
      const b = await store.getFile('tmp/' + id + '/' + String(k).padStart(2, '0'));
      if (!b) return res.status(409).json({ error: 'missing_part', part: k });
      parts.push(b);
    }
    const whole = Buffer.concat(parts);
    if (whole.length > MAX_TOTAL) return res.status(413).json({ error: 'too_large' });
    const r = await store.putFile(pathname, whole, type);
    const names = []; for (let k = 0; k < n; k++) names.push('tmp/' + id + '/' + String(k).padStart(2, '0'));
    store.delFiles(names).catch(function () {});
    return res.status(200).json({ url: r.url });
  } catch (e) {
    console.error('upload failed', e);
    return res.status(500).json({ error: 'upload_failed' });
  }
};
