const db = require('../lib/db');

/* /data.js : le contenu du site, toujours à jour (dernier état enregistré dans l'admin).
   En cas de problème de lecture, on renvoie le contenu de secours embarqué dans le site. */
module.exports = async function (req, res) {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  try {
    const r = await Promise.race([
      db.load(),
      new Promise(function (_, rej) { setTimeout(function () { rej(new Error('timeout')); }, 1500); })
    ]);
    if (r.seeded) { res.setHeader('X-Nomore-Source', 'defaults'); return res.status(200).send(db.staticSource()); }
    res.setHeader('X-Nomore-Source', 'blob');
    res.status(200).send('window.NOMORE_DEFAULTS = ' + JSON.stringify(db.asDefaults(r.db)) + ';');
  } catch (e) {
    /* le site reste en ligne avec son contenu de secours ; l'admin, lui, affiche l'erreur de stockage */
    console.error('data-js fallback', e && e.message);
    res.setHeader('X-Nomore-Source', 'fallback');
    res.status(200).send(db.staticSource());
  }
};
