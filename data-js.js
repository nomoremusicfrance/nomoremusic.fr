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
    if (r.seeded) return res.status(200).send(db.staticSource());
    res.status(200).send('window.NOMORE_DEFAULTS = ' + JSON.stringify(db.asDefaults(r.db)) + ';');
  } catch (e) {
    res.status(200).send(db.staticSource());
  }
};
