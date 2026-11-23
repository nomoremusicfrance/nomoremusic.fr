const auth = require('../lib/auth');

module.exports = async function (req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  const body = typeof req.body === 'string' ? safeJson(req.body) : (req.body || {});
  if (auth.checkPassword(body.password)) {
    res.setHeader('Set-Cookie', auth.makeCookie(req));
    return res.status(200).json({ ok: true });
  }
  await auth.sleep(800);
  return res.status(401).json({ error: 'bad_password' });
};
function safeJson(s) { try { return JSON.parse(s); } catch (e) { return {}; } }
