const auth = require('../lib/auth');
const store = require('../lib/store');

/* Diagnostic du stockage (admin uniquement) : écrit, relit et supprime un petit fichier de test, et indique l'état de la base. */
module.exports = async function (req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!auth.isAdmin(req)) return res.status(401).json({ error: 'unauthenticated' });
  const r = await store.selfTest();
  res.status(r.ok ? 200 : 503).json(r);
};
